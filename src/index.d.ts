export interface PrerenderOptions {
    prerenderScript?: string;
    renderTarget?: string;
    additionalPrerenderRoutes?: string[];
}

interface HeadElement {
    type: string;
    props: Record<string, string>;
    children?: string;
}

interface Head {
    lang: string;
    title: string;
    elements: Set<HeadElement>;
}

interface PrerenderedRoute {
    url: string;
    _discoveredBy?: PrerenderedRoute;
}
