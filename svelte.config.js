import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter(),
        alias: {
            // Przenieś tutaj swoje aliasy, np.:
            '$components': './src/components',
            '$static': './static',
            '$assets': './src/assets'
        }
    }
};

export default config;