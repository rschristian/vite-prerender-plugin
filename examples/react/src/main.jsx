import React from 'react'
import { render, hydrate } from 'react-dom'
import { renderToString } from 'react-dom/server';
import App from './App.jsx'
import './index.css'

if (typeof window !== 'undefined') {
    (import.meta.env.DEV ? render : hydrate)(<App />, document.getElementById('root'))
}

export async function prerender(data) {
	return await renderToString(<App {...data} />);
}
