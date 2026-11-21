import { describe, expect, test, vi } from "vitest";
import { ADRESA_SERVICE_WORKER, inregistreazaServiceWorker } from "../../src/pwa/inregistrare";

describe("inregistrarea service worker-ului", () => {
  test("foloseste o adresa si un domeniu relative, ca sa mearga sub /<nume-repo>/", () => {
    const register = vi.fn(() => Promise.resolve());
    inregistreazaServiceWorker({ serviceWorker: { register } });
    expect(register).toHaveBeenCalledExactlyOnceWith("./sw.js", { scope: "./" });
    expect(ADRESA_SERVICE_WORKER.startsWith("/")).toBe(false);
  });

  test("un browser fara service worker nu opreste aplicatia", () => {
    expect(() => inregistreazaServiceWorker({})).not.toThrow();
  });

  test("o inregistrare refuzata nu opreste aplicatia", async () => {
    const register = vi.fn(() => Promise.reject(new Error("refuzat")));
    expect(() => inregistreazaServiceWorker({ serviceWorker: { register } })).not.toThrow();
    await Promise.resolve();
  });

  test("o inregistrare care arunca pe loc nu opreste aplicatia", () => {
    const register = vi.fn(() => {
      throw new Error("interzis");
    });
    expect(() => inregistreazaServiceWorker({ serviceWorker: { register } })).not.toThrow();
  });
});
