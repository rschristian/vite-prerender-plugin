# `vite-prerender-plugin`

All-in-one tool for prerendering your Vite applications, no matter the UI library (so long as it has a render-to-string implementation).

## Getting Started

```bash
npm install vite-prerender-plugin
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

export default defineConfig({
	plugins: [
        vitePrerenderPlugin(),
	],
});
```

## Options

| Option                      | Type     | Default     | Description                                                                                                                                                                                                                                                     |
| --------------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderTarget`              | `string` | `"body"`    | Query selector for where to insert prerender result in your HTML template                                                                                                                                                                                       |
| `prerenderScript`           | `string` | `undefined` | Absolute path to script containing exported `prerender()` function. If not provided, the plugin will try to find the prerender script in the scripts listed in your HTML entrypoint                                                                             |
| `additionalPrerenderRoutes` | `string` | `undefined` | While the prerendering process will automatically find new links in your app to prerender, sometimes you will have pages that are not linked to but you still want them prerendered (such as a `/404` page). Use this option to add them to the prerender queue |

To prerender your app, you'll need to do three things:

1. Set your `renderTarget`. This should, in all likelihood, match the query selector for where you render your app client-side, i.e., `render(<App />, document.querySelector('#app'))` -> `'#app'`

2. Specify your prerender script, which can be done by a) adding a `prerender` attribute to one of the scripts listed in your entry HTML (`<script prerender src="./my-prerender-script.js">`) or b) use the `prerenderScript` plugin option to specify the location of your script with an absolute path

3. Export a function named `prerender()` from your prerender script (see below for an example)

The plugin simply calls the prerender function you provide so it's up to you to determine how your app should be prerendered, likely you'll want to use the `render-to-string` implementation of your framework. This prerender function can be sync or async, so fee free to initialize your app data with `fetch()` calls, reading local data with `fs.readFile()`, etc. All that's required is that your return an object containing an `html` property, which is the string of HTML you want injected into your HTML document.

With that, you're all ready to build!

For full examples, please see the [examples directory](./examples), and if you don't see your framework listed, let me know! I can take a look to see at adding it.

## Advanced Prerender Options

Additionally, your `prerender()` function can return more than just HTML -- it can return additional links to prerender as well as information that should be set in the `<head>` of the HTML document, such as title, language, or meta tags. For example:

```js
export async function prerender(data) {
    const html = '<h1>hello world</h1>';

    return {
        html,

        // Optionally add additional links that should be
        // prerendered (if they haven't already been)
        links: new Set(['/foo', '/bar']),

        // Optionally configure and add elements to the `<head>` of
        // the prerendered HTML document
        head: {
            // Sets the "lang" attribute: `<html lang="en">`
            lang: 'en',

            // Sets the title for the current page: `<title>My cool page</title>`
            title: 'My cool page',

            // Sets any additional elements you want injected into the `<head>`:
            //   <link rel="stylesheet" href="foo.css">
            //   <meta property="og:title" content="Social media title">
            elements: new Set([
                { type: 'link', props: { rel: 'stylesheet', href: 'foo.css' } },
                { type: 'meta', props: { property: 'og:title', content: 'Social media title' } },
            ]),
        },
    };
}
```

## License

[MIT](https://github.com/rschristian/vite-prerender-plugin/blob/master/LICENSE)
