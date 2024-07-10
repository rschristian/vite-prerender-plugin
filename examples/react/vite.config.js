import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        vitePrerenderPlugin({
            renderTarget: '#app',
        }),
    ],
});
