import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setupTest, teardownTest, loadFixture, viteBuild } from './lib/lifecycle.js';
import { getOutputFile, outputFileExists, writeFixtureFile } from './lib/utils.js';


const writeConfig = async (dir, content) => writeFixtureFile(dir, 'vite.config.js', content);

let env;
test.before.each(async () => {
    env = await setupTest();
});

test.after.each(async () => {
    await teardownTest(env);
});

test('Should support the `prerenderScript` plugin option', async () => {
    await loadFixture('config/prerender-script', env);
    await writeConfig(env.tmp.path, `
        import { defineConfig } from 'vite';
        import { vitePrerenderPlugin } from 'vite-prerender-plugin';
        import path from 'path';

        export default defineConfig({
            plugins: [vitePrerenderPlugin({ prerenderScript: path.join(__dirname, 'src', 'prerender.js') })],
        });
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<body><h1>Hello, World!</h1>');
});

test('Should throw if no `prerenderScript` is specified or can be found', async () => {
    await loadFixture('config/prerender-script', env);
    let message = '';
    try {
        await viteBuild(env.tmp.path);
    } catch (error) {
        message = error.message;
    }

    assert.match(message, 'Unable to detect prerender entry script');
});

test('Should throw if the found `prerenderScript` is not local', async () => {
    await loadFixture('config/prerender-script', env);
    await writeFixtureFile(env.tmp.path, 'index.html', `
        <html>
            <head></head>
            <body>
                <script prerender src="https://example.com"></script>
            </body>
        </html>`
    );

    let message = '';
    try {
        await viteBuild(env.tmp.path);
    } catch (error) {
        message = error.message;
    }

    assert.match(message, 'Prerender entry script must have a `src` attribute and be local');
});

test('Should throw if the `prerenderScript` does not export a `prerender` function', async () => {
    await loadFixture('config/prerender-script', env);
    await writeConfig(env.tmp.path, `
        import { defineConfig } from 'vite';
        import { vitePrerenderPlugin } from 'vite-prerender-plugin';
        import path from 'path';

        export default defineConfig({
            plugins: [vitePrerenderPlugin({ prerenderScript: path.join(__dirname, 'src', 'index.js') })],
        });
    `);

    let message = '';
    try {
        await viteBuild(env.tmp.path);
    } catch (error) {
        message = error.message;
    }

    assert.match(message, 'Cannot detect module with `prerender` export');
});



test('Should support the `renderTarget` plugin option', async () => {
    await loadFixture('config/render-target', env);
    await writeConfig(env.tmp.path, `
        import { defineConfig } from 'vite';
        import { vitePrerenderPlugin } from 'vite-prerender-plugin';

        export default defineConfig({
            plugins: [vitePrerenderPlugin({ renderTarget: '#app' })],
        });
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<div id="app"><h1>Hello, World!</h1></div>');
});

test('Should throw if the `renderTarget` plugin option cannot be found', async () => {
    await loadFixture('config/render-target', env);
    await writeConfig(env.tmp.path, `
        import { defineConfig } from 'vite';
        import { vitePrerenderPlugin } from 'vite-prerender-plugin';

        export default defineConfig({
            plugins: [vitePrerenderPlugin({ renderTarget: '#does-not-exist' })],
        });
    `);
    let message = '';
    try {
        await viteBuild(env.tmp.path);
    } catch (error) {
        message = error.message;
    }

    assert.match(message, 'Unable to detect prerender renderTarget');
});



test('Should support the `additionalPrerenderRoutes` plugin option', async () => {
    await loadFixture('config/render-target', env);
    await writeConfig(env.tmp.path, `
        import { defineConfig } from 'vite';
        import { vitePrerenderPlugin } from 'vite-prerender-plugin';

        export default defineConfig({
            plugins: [vitePrerenderPlugin({ additionalPrerenderRoutes: ['/about', '/not-found'] })],
        });
    `);
    await viteBuild(env.tmp.path);

    assert.ok(await outputFileExists(env.tmp.path, 'about/index.html'));
    assert.ok(await outputFileExists(env.tmp.path, 'not-found/index.html'));
});

test.run();
