import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false
  },
  plugins: [
    {
      name: 'skillorapath-static-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/SkilloraPath/')) {
            const cleanUrl = req.url.replace(/^\/SkilloraPath\//, '/');
            // If the rewritten URL matches a public static file, use the cleaned path
            req.url = cleanUrl;
          }
          next();
        });
      }
    }
  ]
});
