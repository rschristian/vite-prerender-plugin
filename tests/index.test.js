import { test } from 'uvu';
import * as assert from 'uvu/assert';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { setupTest, teardownTest, loadFixture, viteBuild } from './lib/lifecycle.js';
import { getOutputFile } from './lib/utils.js';

let env;
test.before.each(async () => {
    env = await setupTest();
});

test.after.each(async () => {
    await teardownTest(env);
});

test('Should prerender and output correct file structure', async () => {
    await loadFixture('simple', env);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<h1>Simple Test Result</h1>');

    const outDir = path.join(env.tmp.path, 'dist');
    const outDirAssets = path.join(outDir, 'assets');

    assert.equal((await fs.readdir(outDir)).length, 2);
    assert.equal((await fs.readdir(outDirAssets)).length, 1);
});

test.run();
