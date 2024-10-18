import path from 'node:path';
import { promises as fs } from 'node:fs';

import MagicString from 'magic-string';
import { parse as htmlParse } from 'node-html-parser';
import { SourceMapConsumer } from 'source-map';
import { parse as StackTraceParse } from 'stack-trace';
import { createCodeFrame } from 'simple-code-frame';

/**
 * @typedef {import('vite').Rollup.OutputChunk} OutputChunk
 * @typedef {import('vite').Rollup.OutputAsset} OutputAsset
 */

/**
 * @param {string} str
 */
function enc(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * @typedef {import('./types.d.ts')} HeadElement
 */

/**
 * @param {HeadElement | HeadElement[] | string} element
 * @returns {string}
 */
function serializeElement(element) {
    if (element == null) return '';
    if (typeof element !== 'object') return String(element);
    if (Array.isArray(element)) return element.map(serializeElement).join('');
    const type = element.type;
    let s = `<${type}`;
    const props = element.props || {};
    let children = element.children;
    for (const prop of Object.keys(props)) {
        const value = props[prop];
        // Filter out empty values:
        if (value == null) continue;
        if (prop === 'children' || prop === 'textContent') children = value;
        else s += ` ${prop}="${enc(value)}"`;
    }
    s += '>';
    if (!/link|meta|base/.test(type)) {
        if (children) s += serializeElement(children);
        s += `</${type}>`;
    }
    return s;
}

/**
 * @param {import('../index.d.ts').PrerenderOptions} options
 * @returns {import('vite').Plugin}
 */
export function prerenderPlugin({ prerenderScript, renderTarget, additionalPrerenderRoutes } = {}) {
    let viteConfig = {};
    let userEnabledSourceMaps;

    renderTarget ||= 'body';
    additionalPrerenderRoutes ||= [];

    /**
     * From the non-external scripts in entry HTML document, find the one (if any)
     * that provides a `prerender` export
     *
     * @param {import('vite').Rollup.InputOption} input
     */
    const getPrerenderScriptFromHTML = async (input) => {
        // prettier-ignore
        const entryHtml =
			typeof input === "string"
				? input
				: Array.isArray(input)
					? input.find(i => /html$/.test(i))
					: Object.values(input).find(i => /html$/.test(i));

        if (!entryHtml) throw new Error('Unable to detect entry HTML');

        const htmlDoc = htmlParse(await fs.readFile(entryHtml, 'utf-8'));

        const entryScriptTag = htmlDoc
            .getElementsByTagName('script')
            .find((s) => s.hasAttribute('prerender'));

        if (!entryScriptTag) throw new Error('Unable to detect prerender entry script');

        const entrySrc = entryScriptTag.getAttribute('src');
        if (!entrySrc || /^https:/.test(entrySrc))
            throw new Error('Prerender entry script must have a `src` attribute and be local');

        return path.join(viteConfig.root, entrySrc);
    };

    return {
        name: 'vite-prerender-plugin',
        apply: 'build',
        enforce: 'post',
        configResolved(config) {
            userEnabledSourceMaps = !!config.build.sourcemap;
            // Enable sourcemaps for generating more actionable error messages
            config.build.sourcemap = true;

            viteConfig = config;
        },
        async options(opts) {
            if (!opts.input) return;
            if (!prerenderScript) {
                prerenderScript = await getPrerenderScriptFromHTML(opts.input);
            }

            // prettier-ignore
            opts.input =
				typeof opts.input === "string"
					? [opts.input, prerenderScript]
					: Array.isArray(opts.input)
						? [...opts.input, prerenderScript]
						: { ...opts.input, prerenderEntry: prerenderScript };
            opts.preserveEntrySignatures = 'allow-extension';
        },
        // Injects a window check into Vite's preload helper, instantly resolving
        // the module rather than attempting to add a <link> to the document.
        transform(code, id) {
            // Vite keeps changing up the ID, best we can do for cross-version
            // compat is an `includes`
            if (id.includes('vite/preload-helper')) {
                // Through v5.0.4
                // https://github.com/vitejs/vite/blob/b93dfe3e08f56cafe2e549efd80285a12a3dc2f0/packages/vite/src/node/plugins/importAnalysisBuild.ts#L95-L98
                const s = new MagicString(code);
                s.replace(
                    `if (!__VITE_IS_MODERN__ || !deps || deps.length === 0) {`,
                    `if (!__VITE_IS_MODERN__ || !deps || deps.length === 0 || typeof window === 'undefined') {`,
                );
                // 5.0.5+
                // https://github.com/vitejs/vite/blob/c902545476a4e7ba044c35b568e73683758178a3/packages/vite/src/node/plugins/importAnalysisBuild.ts#L93
                s.replace(
                    `if (__VITE_IS_MODERN__ && deps && deps.length > 0) {`,
                    `if (__VITE_IS_MODERN__ && deps && deps.length > 0 && typeof window !== 'undefined') {`,
                );
                return {
                    code: s.toString(),
                    map: s.generateMap({ hires: true }),
                };
            }
        },
        async generateBundle(_opts, bundle) {
            // @ts-ignore
            globalThis.location = {};
            // @ts-ignore
            globalThis.self = globalThis;

            // As of Vite 5.3.0-beta.0, Vite injects an undefined `__VITE_PRELOAD__` var
            // Swapping in an empty array is fine as we have no need to preload whilst prerendering
            // https://github.com/vitejs/vite/pull/16562
            // @ts-ignore
            globalThis.__VITE_PRELOAD__ = [];

            globalThis.unpatchedFetch = globalThis.fetch;
            // Local, fs-based fetch implementation for prerendering
            globalThis.fetch = async (url, opts) => {
                if (/^\//.test(url)) {
                    try {
                        return new Response(
                            await fs.readFile(
                                `${path.join(
                                    viteConfig.root,
                                    viteConfig.build.outDir,
                                )}/${url.replace(/^\//, '')}`,
                                'utf-8',
                            ),
                            { status: 200 },
                        );
                    } catch (e) {
                        if (e.code !== 'ENOENT') throw e;
                        return new Response(null, { status: 404 });
                    }
                }

                return globalThis.unpatchedFetch(url, opts);
            };

            // Grab the generated HTML file, which we'll use as a template:
            const tpl = /** @type {string} */ (
                /** @type {OutputAsset} */ (bundle['index.html']).source
            );
            let htmlDoc = htmlParse(tpl);

            // Create a tmp dir to allow importing & consuming the built modules,
            // before Rollup writes them to the disk
            const tmpDir = path.join(
                viteConfig.root,
                'node_modules',
                'vite-prerender-plugin',
                'headless-prerender',
            );
            try {
                await fs.rm(tmpDir, { recursive: true });
            } catch (e) {
                if (e.code !== 'ENOENT') throw e;
            }
            await fs.mkdir(tmpDir, { recursive: true });

            await fs.writeFile(
                path.join(tmpDir, 'package.json'),
                JSON.stringify({ type: 'module' }),
            );

            /** @type {OutputChunk | undefined} */
            let prerenderEntry;
            for (const output of Object.keys(bundle)) {
                // Clean up source maps if the user didn't enable them themselves
                if (!userEnabledSourceMaps) {
                    if (output.endsWith('.map')) {
                        delete bundle[output];
                        continue;
                    }
                    if (output.endsWith('.js') && bundle[output].type == 'chunk') {
                        /** @type {OutputChunk} */ (bundle[output]).code =
                            /** @type {OutputChunk} */ (bundle[output]).code.replace(
                                /\n\/\/#\ssourceMappingURL=.*/,
                                '',
                            );
                    }
                }
                if (!output.endsWith('.js') || bundle[output].type !== 'chunk') continue;

                await fs.writeFile(
                    path.join(tmpDir, path.basename(output)),
                    /** @type {OutputChunk} */ (bundle[output]).code,
                );

                if (/** @type {OutputChunk} */ (bundle[output]).exports?.includes('prerender')) {
                    prerenderEntry = /** @type {OutputChunk} */ (bundle[output]);
                }
            }
            if (!prerenderEntry) {
                this.error('Cannot detect module with `prerender` export');
            }

            /** @type {import('./types.d.ts').Head} */
            let head = { lang: '', title: '', elements: new Set() };

            let prerender;
            try {
                const m = await import(
                    `file://${path.join(tmpDir, path.basename(prerenderEntry.fileName))}`
                );
                prerender = m.prerender;
            } catch (e) {
                const isReferenceError = e instanceof ReferenceError;

                let message = `
					${e}

					This ${
                        isReferenceError ? 'is most likely' : 'could be'
                    } caused by using DOM/Web APIs which are not available
					available to the prerendering process running in Node. Consider
					wrapping the offending code in a window check like so:

					if (typeof window !== "undefined") {
						// do something in browsers only
					}
				`.replace(/^\t{5}/gm, '');

                const stack = StackTraceParse(e).find((s) => s.getFileName().includes(tmpDir));

                const sourceMapContent = prerenderEntry.map;
                if (stack && sourceMapContent) {
                    await SourceMapConsumer.with(sourceMapContent, null, async (consumer) => {
                        let { source, line, column } = consumer.originalPositionFor({
                            line: stack.getLineNumber(),
                            column: stack.getColumnNumber(),
                        });

                        if (!source || line == null || column == null) {
                            message += `\nUnable to locate source map for error!\n`;
                            this.error(message);
                        }

                        const sourcePath = path.join(
                            viteConfig.root,
                            source.replace(/^(..\/)*/, ''),
                        );
                        const sourceContent = await fs.readFile(sourcePath, 'utf-8');

                        // `simple-code-frame` has 1-based line numbers
                        const frame = createCodeFrame(sourceContent, line - 1, column);
                        message += `
							> ${sourcePath}:${line}:${column + 1}\n
							${frame}
						`.replace(/^\t{7}/gm, '');
                    });
                }

                this.error(message);
            }

            if (typeof prerender !== 'function') {
                this.error('Detected `prerender` export, but it is not a function');
            }

            // We start by pre-rendering the home page.
            // Links discovered during pre-rendering get pushed into the list of routes.
            const seen = new Set(['/', ...additionalPrerenderRoutes]);

            /** @type {import('./types.d.ts').PrerenderedRoute[]} */
            let routes = [...seen].map((link) => ({ url: link }));

            for (const route of routes) {
                if (!route.url) continue;

                const outDir = route.url.replace(/(^\/|\/$)/g, '');
                const assetName = path.join(outDir, outDir.endsWith('.html') ? '' : 'index.html');

                // Update `location` to current URL so routers can use things like `location.pathname`
                const u = new URL(route.url, 'http://localhost');
                for (const i in u) {
                    try {
                        globalThis.location[i] = i == 'toString' ? u[i].bind(u) : String(u[i]);
                    } catch {}
                }

                const result = await prerender({ ssr: true, url: route.url, route });
                if (result == null) continue;

                // Reset HTML doc & head data
                htmlDoc = htmlParse(tpl);
                head = { lang: '', title: '', elements: new Set() };

                // Add any discovered links to the list of routes to pre-render:
                if (result.links) {
                    for (let url of result.links) {
                        const parsed = new URL(url, 'http://localhost');
                        url = parsed.pathname.replace(/\/$/, '') || '/';
                        // ignore external links and ones we've already picked up
                        if (seen.has(url) || parsed.origin !== 'http://localhost') continue;
                        seen.add(url);
                        routes.push({ url, _discoveredBy: route });
                    }
                }

                let body;
                if (result && typeof result === 'object') {
                    if (typeof result.html !== 'undefined') body = result.html;
                    if (result.head) {
                        head = result.head;
                    }
                    if (result.data) {
                        body += `<script type="application/json" id="prerender-data">${JSON.stringify(
                            result.data,
                        )}</script>`;
                    }
                } else {
                    body = result;
                }

                const htmlHead = htmlDoc.querySelector('head');
                if (htmlHead) {
                    if (head.title) {
                        const htmlTitle = htmlHead.querySelector('title');
                        htmlTitle
                            ? htmlTitle.set_content(enc(head.title))
                            : htmlHead.insertAdjacentHTML(
                                  'afterbegin',
                                  `<title>${enc(head.title)}</title>`,
                              );
                    }

                    if (head.lang) {
                        htmlDoc.querySelector('html').setAttribute('lang', enc(head.lang));
                    }

                    if (head.elements) {
                        // Inject HTML links at the end of <head> for any stylesheets injected during rendering of the page:
                        htmlHead.insertAdjacentHTML(
                            'beforeend',
                            Array.from(
                                new Set(Array.from(head.elements).map(serializeElement)),
                            ).join('\n'),
                        );
                    }
                }

                const target = htmlDoc.querySelector(renderTarget);
                if (!target)
                    this.error(
                        result.renderTarget == 'body'
                            ? '`renderTarget` was not specified in plugin options and <body> does not exist in input HTML template'
                            : `Unable to detect prerender renderTarget "${result.selector}" in input HTML template`,
                    );
                target.insertAdjacentHTML('afterbegin', body);

                // Add generated HTML to compilation:
                if (route.url === '/')
                    /** @type {OutputAsset} */ (bundle['index.html']).source = htmlDoc.toString();
                else
                    this.emitFile({
                        type: 'asset',
                        fileName: assetName,
                        source: htmlDoc.toString(),
                    });
            }
        },
    };
}
