import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

// base relativ: pe GitHub Pages aplicatia este servita sub /<nume-repo>/, nu la radacina.
// Din acelasi motiv, nicio adresa de mai jos nu incepe cu "/".
export default defineConfig({
  base: "./",
  plugins: [
    preact(),
    // Functionarea fara internet: un service worker care pastreaza aplicatia dupa prima incarcare.
    VitePWA({
      // Inregistrarea se face din src/pwa/inregistrare.ts, o singura data si doar in build-ul de productie.
      injectRegister: false,
      scope: "./",
      manifest: {
        name: "Ghid de economii",
        short_name: "Economii",
        description: "Pași simpli pentru a vă pune economiile în ordine.",
        lang: "ro",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#f3f1ec",
        theme_color: "#0b5a4a",
        icons: [
          { src: "iconita-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "iconita-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "iconita-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Se pastreaza doar aplicatia: pagina, codul, stilurile si iconitele.
        // cursuri.json NU este aici: se cere mereu din retea, iar ultima copie o tine stocarea aplicatiei.
        // Iconitele si manifestul sunt adaugate de plugin.
        globPatterns: ["**/*.{html,js,css}"],
        navigateFallback: "index.html",
        // O versiune noua preia controlul imediat, dar pagina deschisa nu este reincarcata:
        // omul nu pierde ce scria. Versiunea noua se vede la urmatoarea deschidere.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      // Un singur fisier de cod: o pagina deja deschisa nu mai cere nimic dupa ce cache-ul vechi este sters.
      output: { codeSplitting: false },
    },
  },
  test: {
    environment: "jsdom",
    include: ["teste/**/*.test.{ts,tsx}"],
  },
});
