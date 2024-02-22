import { createApp, createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'

import './style.css'

if (typeof window !== 'undefined') {
    createApp(App).mount('#app')
}

export async function prerender() {
    const app = createSSRApp(App);

    return {
        html: await renderToString(app),
    }
}
