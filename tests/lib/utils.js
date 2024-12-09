import path from 'node:path';
import url from 'node:url';
import { promises as fs } from 'node:fs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export async function copyDependencies(cwd) {
    await fs.mkdir(path.join(cwd, 'node_modules', 'vite-prerender-plugin'), {
        recursive: true,
    });

    // Copy module to tmp dir
    await fs.cp(
        path.join(__dirname, '..', '..', 'src'),
        path.join(cwd, 'node_modules', 'vite-prerender-plugin', 'src'),
        { recursive: true },
    )
    await fs.copyFile(
        path.join(__dirname, '..', '..', 'package.json'),
        path.join(cwd, 'node_modules', 'vite-prerender-plugin', 'package.json'),
    );

    const copyNodeModule = async (nodeModule) =>
        await fs.cp(
            path.join(__dirname, '..', '..', 'node_modules', nodeModule),
            path.join(cwd, 'node_modules', nodeModule),
            { recursive: true },
        );

    // Copy dependencies to tmp dir
    await copyNodeModule('vite');
    await copyNodeModule('magic-string');
    await copyNodeModule('node-html-parser');
    await copyNodeModule('simple-code-frame');
    await copyNodeModule('source-map');
    await copyNodeModule('stack-trace');
}

/**
 * Get build output file as utf-8 string
 * @param {string} dir
 * @param {string | RegExp} file
 * @returns {Promise<string>}
 */
export async function getOutputFile(dir, file) {
    if (typeof file !== 'string') {
        // @ts-ignore - TS bug, assigning to `file` breaks the narrowing
        file = (await fs.readdir(path.join(dir, 'dist'))).find((f) => file.test(f));
    }
    return await fs.readFile(path.join(dir, 'dist', file), 'utf-8');
}

/**
 * Check to see if output files exists
 * @param {string} dir
 * @param {string} file
 * @returns {Promise<boolean>}
 */
export async function outputFileExists(dir, file) {
    return await fs
        .access(path.join(dir, 'dist', file))
        .then(() => true)
        .catch(() => false);
}

/**
 * @param {string} dir
 * @param {string} filePath
 * @param {string} content
 */
export async function writeFixtureFile(dir, filePath, content) {
    await fs.writeFile(path.join(dir, filePath), content);
}
