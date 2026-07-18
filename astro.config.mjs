// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { markket } from './markket.config';

export default defineConfig({
  site: markket.site_url,
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
