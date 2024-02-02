# `vite-prerender-plugin`

All-in-one tool for prerendering your Vite applications, no matter the UI library (so long as it has a render-to-string implementation).

## Installation

```bash
npm install vite-prerender-plugin
```

## Options

| Option                      | Type     | Default     | Description                                                                                                                                                                                                                                                     |
| --------------------------- | -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prerenderScript`           | `string` | `undefined` | Absolute path to script containing exported `prerender()` function. If not provided, the plugin will try to find the prerender script in the scripts listed in your HTML entrypoint                                                                             |
| `renderTarget`              | `string` | `"body"`    | Query selector for where to insert prerender result in your HTML template                                                                                                                                                                                       |
| `additionalPrerenderRoutes` | `string` | `undefined` | While the prerendering process will automatically find new links in your app to prerender, sometimes you will have pages that are not linked to but you still want them prerendered (such as a `/404` page). Use this option to add them to the prerender queue |

To prerender your app, you'll need to do two things:

1. Specify a script using the `prerenderScript` option OR add a `prerender` attribute to one of the scripts listed in your `index.html`, like this: `<script prerender src="...">`. This script will be the prerender entry point.

2. Export a function named `prerender` from your entry point.
    - This function can by sync or async
    - All that's necessary is that this function returns an object containing an `html` property, which is a string of HTML you want injected into your template

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
