if (typeof window !== 'undefined') {
    const worker = new Worker(new URL('./worker.js', import.meta.url));

    worker.postMessage({ type: 'init' });
}

export async function prerender() {
    return `<h1>Simple Test Result</h1>`;
}
