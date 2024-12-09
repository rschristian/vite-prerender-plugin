import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { setupTest, teardownTest, loadFixture, viteBuild } from './lib/lifecycle.js';
import { getOutputFile } from './lib/utils.js';

let env;
test.before.each(async () => {
    env = await setupTest();
});

test.after.each(async () => {
    await teardownTest(env);
});

test('Should support isomorphic fetch', async () => {
    await loadFixture('features/local-fetch', env);
    await viteBuild(env.tmp.path);

    const prerenderedHtml = await getOutputFile(env.tmp.path, 'index.html');
    assert.match(prerenderedHtml, '<body>Local fetch works');
});

test.run();
