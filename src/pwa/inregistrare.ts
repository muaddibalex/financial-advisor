// Inregistrarea service worker-ului, care pastreaza aplicatia pentru folosirea
// fara internet. Aplicatia merge si fara el: un browser care nu il are, sau o
// inregistrare esuata, nu opresc nimic.

/** Adresa relativa: pe GitHub Pages aplicatia sta sub /<nume-repo>/. */
export const ADRESA_SERVICE_WORKER = "./sw.js";

type Navigator = { readonly serviceWorker?: { register(adresa: string, optiuni?: { scope: string }): Promise<unknown> } };

export function inregistreazaServiceWorker(nav: Navigator = navigator): void {
  try {
    void nav.serviceWorker?.register(ADRESA_SERVICE_WORKER, { scope: "./" }).catch(() => {
      // Fara service worker, aplicatia are nevoie de internet la deschidere. Atat.
    });
  } catch {
    // La fel.
  }
}
