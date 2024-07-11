import { Plugin } from 'vite';

export interface PrerenderOptions {
    prerenderScript?: string;
    renderTarget?: string;
    additionalPrerenderRoutes?: string[];
}

export interface PreviewMiddlewareOptions {
    previewMiddlewareFallback?: string;
}

export type Options = PrerenderOptions & PreviewMiddlewareOptions;

export function vitePrerenderPlugin(options?: Options): Plugin;
