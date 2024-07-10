import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        preact(),
        vitePrerenderPlugin({
            renderTarget: '#app',
        }),
    ],
});
