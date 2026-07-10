import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://locationcloturechantier.ca',
  trailingSlash: 'never',
  build: { format: 'directory' },
});
