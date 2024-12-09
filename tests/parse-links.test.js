import { test } from 'uvu';
import * as assert from 'uvu/assert';

import { parseLinks } from '../src/parse.js';

test('Should parse links from HTML', async () => {
    const input = `<a href="https://example.com">Link</a><a href="/foo">Link</a>`;
    const output = parseLinks(input);
    assert.equal(output, ['https://example.com', '/foo']);
});

test('Should ignore anchors without an `href`', async () => {
    const input = `<a>Link</a>`;
    const output = parseLinks(input);
    assert.equal(output, []);
});

test('Should ignore anchors without `target` set to `_self`', async () => {
    const input = `<a href="https://example.com" target="_blank">Link</a>`;
    const output = parseLinks(input);
    assert.equal(output, []);
});

test.run();
