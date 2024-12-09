import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setupTest, teardownTest, loadFixture, viteBuild } from './lib/lifecycle.js';
import { getOutputFile, writeFixtureFile } from './lib/utils.js';

const writeEntry = async (dir, content) => writeFixtureFile(dir, 'src/index.js', content);

let env;
test.before.each(async () => {
    env = await setupTest();
});

test.after.each(async () => {
    await teardownTest(env);
});

test('Should accept the `prerender` function returning a string', async () => {
    await loadFixture('simple', env);
    await writeEntry(env.tmp.path, `
        export async function prerender() {
            return '<h1>Hello, World!</h1>';
        }
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<h1>Hello, World!</h1>');
});

test('Should accept the `prerender` function returning an object', async () => {
    await loadFixture('simple', env);
    await writeEntry(env.tmp.path, `
        export async function prerender() {
            return {
                html: '<h1>Hello, World!</h1>',
            };
        }
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<h1>Hello, World!</h1>');
});

test('Should stringify returned `data` object', async () => {
    await loadFixture('simple', env);
    await writeEntry(env.tmp.path, `
        export async function prerender() {
            return {
                html: '<h1>Hello, World!</h1>',
                data: { foo: 'bar' },
            };
        }
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<script type="application/json" id="prerender-data">{"foo":"bar"}</script>');
});

test('Should support `head.lang` property', async () => {
    await loadFixture('simple', env);
    await writeEntry(env.tmp.path, `
        export async function prerender() {
            return {
                html: '<h1>Hello, World!</h1>',
                head: { lang: 'de' },
            };
        }
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<html lang="de">');
});

test('Should support `head.title` property', async () => {
    await loadFixture('simple', env);
    await writeEntry(env.tmp.path, `
        export async function prerender() {
            return {
                html: '<h1>Hello, World!</h1>',
                head: { title: 'My Prerendered Site' },
            };
        }
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<title>My Prerendered Site</title>');
});

test('Should support `head.elements` property', async () => {
    await loadFixture('simple', env);
    await writeEntry(env.tmp.path, `
        export async function prerender() {
            return {
                html: '<h1>Hello, World!</h1>',
                head: {
                    elements: new Set([
                        { type: 'link', props: { rel: 'stylesheet', href: 'foo.css' } },
                        { type: 'meta', props: { property: 'og:title', content: 'Social media title' } },
                    ]),
                },
            };
        }
    `);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<link rel="stylesheet" href="foo.css">');
    assert.match(prerenderedHtml, '<meta property="og:title" content="Social media title">');
});

test.run();
