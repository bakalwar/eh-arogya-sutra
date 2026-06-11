EH CDSS — Google Play (Trusted Web Activity)
============================================

Your PWA is built with Vite (`npm run build:web`). Host the `frontend/dist` output on HTTPS
(e.g. Vercel) and point your backend (Railway) with the same API domain or CORS.

Steps for Play Store (summary — Technology Guide Month 4):

1. Publish the web app on a stable HTTPS URL (production build + API).

2. Install Android SDK + JDK 17.

3. Use Google Bubblewrap (recommended) or PWA Builder:
   - npm i -g @bubblewrap/cli
   - bubblewrap init --manifest https://YOUR_DOMAIN/manifest.webmanifest
   - bubblewrap build
   - Sign the AAB with your Play signing key.

4. Play Console: create app, upload AAB, set content rating, privacy policy URL.

5. Replace placeholder SVG icons with PNG 192/512 maskable assets for store compliance
   (generate with @vite-pwa/assets or design tool).

6. Digital Asset Links: host `/.well-known/assetlinks.json` for TWA verification.

For local testing: Chrome → Install app (from menu) after `npm run build:web` + `npm start`.
