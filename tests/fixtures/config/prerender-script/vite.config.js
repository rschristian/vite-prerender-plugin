import { defineConfig } from 'vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

export default defineConfig({
    plugins: [vitePrerenderPlugin()],
});
