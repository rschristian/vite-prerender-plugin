import { createApp, createSSRApp } from 'vue';
// Vite can't seem to split a module w/ static & dynamic imports, so may as well statically import everything
import { createWebHistory, createMemoryHistory, createRouter } from 'vue-router';

import App from './App.vue';
import Home from './pages/Home.vue';
import NotFound from './pages/_404.vue';
import './style.css';

const routes = [
    { path: '/', component: Home },
    { path: '/:catchAll(.*)*', component: NotFound },
];

if (typeof window !== 'undefined') {
    const router = createRouter({
        history: createWebHistory(),
        routes,
    });

    const app = import.meta.env.DEV ? createApp(App) : createSSRApp(App);
    app.use(router).mount('#app');
}

export async function prerender(data) {
    const { renderToString } = await import('vue/server-renderer');
    const { parseLinks } = await import('vite-prerender-plugin/parse');

    const router = createRouter({
        history: createMemoryHistory(),
        routes,
    });

    const app = createSSRApp(App).use(router);

    router.push(data.url);
    await router.isReady();

    const html = await renderToString(app);
    const links = parseLinks(html);

    return { html, links };
}
