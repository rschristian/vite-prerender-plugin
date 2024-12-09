export async function prerender() {
    const res = await fetch('/local-fetch-test.txt')
    return await res.text();
}
