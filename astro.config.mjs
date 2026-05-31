import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import rehypeTableWrap from './scripts/rehype-table-wrap.mjs';
import rehypeEmbed from './scripts/rehype-embed.mjs';
import { indexNowIntegration } from './scripts/indexnow-integration.mjs';

export default defineConfig({
  site: 'https://getnestdaily.xyz',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,

  build: {
    format: 'directory'
  },

  integrations: [sitemap(), indexNowIntegration()],
  markdown: {
    rehypePlugins: [rehypeTableWrap, rehypeEmbed],
  },
});