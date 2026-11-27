// @ts-check
import { defineConfig } from 'astro/config';

// On GitHub Pages the site may live under a sub-path (e.g. /website/).
// The deploy workflow sets SITE_URL and BASE_PATH automatically; locally they default to "/".
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
});
