import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config/site.mjs';

export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  adapter: vercel({
    // El dossier del lead corre en segundo plano (waitUntil) tras responder al
    // formulario; le damos margen para que termine antes de congelar la función.
    maxDuration: 60,
  }),
  integrations: [
    sitemap({
      // Landing secreta del teaser de Halloween Fest V: solo se llega por QR.
      filter: (page) => !new URL(page).pathname.startsWith('/countdown'),
      changefreq: 'monthly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, '');
        if (path === '') {
          item.priority = 1.0;
        } else if (path === '/terminos' || path === '/privacidad') {
          item.priority = 0.3;
          item.changefreq = 'yearly';
        } else if (path === '/contacto') {
          item.priority = 0.8;
        } else if (path.startsWith('/proyectos/')) {
          item.priority = 0.9;
        } else if (path === '/proyectos') {
          item.priority = 0.9;
        } else if (path === '/blog') {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        } else if (path.startsWith('/blog/')) {
          item.priority = 0.7;
        }
        return item;
      },
    }),
  ],
});
