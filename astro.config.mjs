// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: 'https://sell.markket.place',
  // Remove base path since you're using a custom domain
  vite: {
    plugins: [tailwindcss()],
  },
});
