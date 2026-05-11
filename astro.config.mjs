import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';
import rehypeTableWrap from './scripts/rehype-table-wrap.mjs';

export default defineConfig({
  site: 'https://getnestdaily.xyz',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,

  build: {
    format: 'directory'
  },

  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeTableWrap],
  },
  adapter: cloudflare()
});