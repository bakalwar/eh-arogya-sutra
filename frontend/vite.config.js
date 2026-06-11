import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// EH CDSS — PWA for installable web + Play Store (TWA) packaging
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  // Must match backend listen port (backend: PORT in .env, default 5000). Set in frontend/.env as VITE_API_PROXY_TARGET if yours differs.
  const apiProxyTarget = (env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000').replace(/\/$/, '');

  /* Dev proxy must outlive long Ollama summary calls (browser axios may wait 7+ min) */
  const longMs = Number(env.VITE_API_LONG_TIMEOUT_MS) || 300000;
  const expertMs = Number(env.VITE_API_EXPERT_CLINICAL_TIMEOUT_MS) || 600000;
  const apiProxyTimeoutMs =
    Number(env.VITE_API_PROXY_TIMEOUT_MS) || Math.max(longMs, expertMs, 720000) + 60000;

  const proxyToApi = {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    timeout: apiProxyTimeoutMs,
    proxyTimeout: apiProxyTimeoutMs
  };

  const legacyHtmlPaths = [
    '/doctor-analysis.html',
    '/demo-search.html',
    '/live-preview.html',
    '/autologin.html'
  ];

  return {
    plugins: [
      react(),
      {
        name: 'eh-legacy-html-redirect',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const p = (req.url || '').split('?')[0];
            if (legacyHtmlPaths.includes(p)) {
              res.statusCode = 302;
              res.setHeader('Location', '/go-search.html?upgraded=1');
              res.end();
              return;
            }
            next();
          });
        }
      },
      VitePWA({
        devOptions: { enabled: false },
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-icon.svg'],
        manifest: {
          name: 'EH CDSS — Electro Homoeopathy',
          short_name: 'EH CDSS',
          description:
            'Clinical Decision Support System — Count Cesare Mattei principles. Doctor, Admin & Patient panels.',
          theme_color: '#0e1a0f',
          background_color: '#080f09',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['medical', 'health'],
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10 } }
            },
            // Never cache auth — avoids stale 401/502 responses breaking login after PWA install
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/auth'),
              handler: 'NetworkOnly'
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/summary/'),
              handler: 'NetworkOnly'
            },
            {
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/api') && !url.pathname.startsWith('/api/summary/'),
              handler: 'NetworkFirst',
              options: { cacheName: 'api-cache', networkTimeoutSeconds: 10 }
            }
          ]
        }
      })
    ],
    server: {
      host: '0.0.0.0',
      port: Number(process.env.VITE_PORT) || 5178,
      strictPort: false,
      open: '/clear.html',
      proxy: {
        '/api': proxyToApi,
        '/uploads': proxyToApi,
        '/health': proxyToApi,
        '/eh-arogya': proxyToApi
      }
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production'
        }
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor';
              }
              if (id.includes('axios') || id.includes('fuse.js') || id.includes('i18next')) {
                return 'utils';
              }
            }
          }
        }
      }
    }
  };
});
