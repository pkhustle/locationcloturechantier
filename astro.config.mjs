import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
// Marketing pages stay static (prerendered); the /api routes and the /admin zone
// opt into on-demand server rendering (export const prerender = false), served
// by the Node adapter.
export default defineConfig({
  site: 'https://locationcloturechantier.ca',
  trailingSlash: 'never',
  build: { format: 'directory' },
  adapter: node({ mode: 'standalone' }),
  // Every POST now comes from our own forms, so keep Astro's CSRF origin check
  // on — it blocks cross-site posts to the admin actions. It compares the
  // Origin header against Astro.url, and Astro only trusts the request host for
  // the domains listed here (otherwise the host falls back to "localhost" and
  // every form submission would 403).
  security: {
    checkOrigin: true,
    allowedDomains: [
      { hostname: 'locationcloturechantier.ca' },
      { hostname: '**.locationcloturechantier.ca' },
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
    ],
  },
  // better-sqlite3 is a native module: leave it to Node instead of bundling it.
  vite: { ssr: { external: ['better-sqlite3'] } },
});
