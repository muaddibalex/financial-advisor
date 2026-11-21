import { describe, expect, test, vi } from "vitest";
import { TIMP_MAXIM_MS, incarcaCursuri, valideazaCursuri, type PastrareCursuri } from "../../src/cursuri/incarcare";
import type { Cursuri } from "../../src/domeniu/tipuri";

const octombrie: Cursuri = { lunaReferinta: "2026-10", generatLa: "2026-11-02", leiPe: { EUR: 5, USD: 4, GBP: 6 } };
const septembrie: Cursuri = { lunaReferinta: "2026-09", generatLa: "2026-10-02", leiPe: { EUR: 5.1, USD: 4.1, GBP: 6.1 } };

const ADRESA = "./cursuri.json";

function pastrare(initial: unknown = null): PastrareCursuri & { continut: unknown } {
  return {
    continut: initial,
    citeste() {
      return this.continut;
    },
    scrie(cursuri) {
      this.continut = cursuri;
    },
  };
}

const raspunde = (corp: string, status = 200) => async () => new Response(corp, { status });
const faraRetea = async (): Promise<Response> => {
  throw new TypeError("Failed to fetch");
};

describe("valideazaCursuri", () => {
  test("accepta un fisier corect", () => {
    expect(valideazaCursuri(octombrie)).toEqual(octombrie);
  });
  test.each([
    ["null", null],
    ["text", "cursuri"],
    ["fara luna", { ...octombrie, lunaReferinta: undefined }],
    ["luna scrisa gresit", { ...octombrie, lunaReferinta: "2026-13" }],
    ["fara data generarii", { ...octombrie, generatLa: 20261102 }],
    ["fara cursuri", { ...octombrie, leiPe: null }],
    ["moneda lipsa", { ...octombrie, leiPe: { EUR: 5, USD: 4 } }],
    ["curs zero", { ...octombrie, leiPe: { EUR: 0, USD: 4, GBP: 6 } }],
    ["curs negativ", { ...octombrie, leiPe: { EUR: -5, USD: 4, GBP: 6 } }],
    ["curs ca text", { ...octombrie, leiPe: { EUR: "5", USD: 4, GBP: 6 } }],
  ])("refuza: %s", (_nume, valoare) => {
    expect(valideazaCursuri(valoare)).toBeNull();
  });
});

describe("incarcaCursuri", () => {
  test("raspuns bun: foloseste reteaua si salveaza o copie", async () => {
    const p = pastrare();
    const rezultat = await incarcaCursuri(ADRESA, p, raspunde(JSON.stringify(octombrie)));
    expect(rezultat).toEqual({ sursa: "retea", cursuri: octombrie });
    expect(p.continut).toEqual(octombrie);
  });

  test("cere fisierul fara cache", async () => {
    let optiuni: RequestInit | undefined;
    await incarcaCursuri(ADRESA, pastrare(), async (_adresa, o) => {
      optiuni = o;
      return new Response(JSON.stringify(octombrie));
    });
    expect(optiuni?.cache).toBe("no-store");
  });

  test("raspuns stricat, cu copie: foloseste copia si nu o strica", async () => {
    const p = pastrare(septembrie);
    const rezultat = await incarcaCursuri(ADRESA, p, raspunde("<!doctype html><html>"));
    expect(rezultat).toEqual({ sursa: "copie", cursuri: septembrie });
    expect(p.continut).toEqual(septembrie);
  });

  test("raspuns cu forma gresita, fara copie: lipsa", async () => {
    const rezultat = await incarcaCursuri(ADRESA, pastrare(), raspunde(JSON.stringify({ leiPe: { EUR: 5 } })));
    expect(rezultat).toEqual({ sursa: "lipsa", cursuri: null });
  });

  test("eroare de la server, cu copie: foloseste copia", async () => {
    const rezultat = await incarcaCursuri(ADRESA, pastrare(septembrie), raspunde("Not found", 404));
    expect(rezultat).toEqual({ sursa: "copie", cursuri: septembrie });
  });

  test("fara retea, cu copie: foloseste copia", async () => {
    const rezultat = await incarcaCursuri(ADRESA, pastrare(octombrie), faraRetea);
    expect(rezultat).toEqual({ sursa: "copie", cursuri: octombrie });
  });

  test("fara retea, fara copie: lipsa", async () => {
    const rezultat = await incarcaCursuri(ADRESA, pastrare(), faraRetea);
    expect(rezultat).toEqual({ sursa: "lipsa", cursuri: null });
  });

  test("fara retea, cu o copie stricata: lipsa", async () => {
    const rezultat = await incarcaCursuri(ADRESA, pastrare({ lunaReferinta: "candva" }), faraRetea);
    expect(rezultat).toEqual({ sursa: "lipsa", cursuri: null });
  });

  test("un raspuns mai vechi decat copia nu o inlocuieste", async () => {
    const p = pastrare(octombrie);
    const rezultat = await incarcaCursuri(ADRESA, p, raspunde(JSON.stringify(septembrie)));
    expect(rezultat).toEqual({ sursa: "copie", cursuri: octombrie });
    expect(p.continut).toEqual(octombrie);
  });

  test("stocare indisponibila: cursurile din retea se folosesc oricum", async () => {
    const stricata: PastrareCursuri = {
      citeste() {
        throw new Error("stocare indisponibila");
      },
      scrie() {
        throw new Error("stocare indisponibila");
      },
    };
    const rezultat = await incarcaCursuri(ADRESA, stricata, raspunde(JSON.stringify(octombrie)));
    expect(rezultat).toEqual({ sursa: "retea", cursuri: octombrie });
  });

  describe("o cerere care nu mai raspunde", () => {
    /** Ca o retea agatata: raspunsul nu vine niciodata, dar cererea poate fi oprita. */
    const agatat = (_adresa: string, optiuni?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        optiuni?.signal?.addEventListener("abort", () => reject(new DOMException("oprit", "AbortError")));
      });

    test.each([
      ["cu copie: foloseste copia", septembrie, { sursa: "copie", cursuri: septembrie }],
      ["fara copie: lipsa", null, { sursa: "lipsa", cursuri: null }],
    ])("%s", async (_nume, copie, asteptat) => {
      vi.useFakeTimers();
      try {
        const rezultat = incarcaCursuri(ADRESA, pastrare(copie), agatat);
        await vi.advanceTimersByTimeAsync(TIMP_MAXIM_MS);
        expect(await rezultat).toEqual(asteptat);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  test("fisierul real din public/ are forma asteptata", async () => {
    const { readFileSync } = await import("node:fs");
    const real: unknown = JSON.parse(readFileSync("public/cursuri.json", "utf8"));
    expect(valideazaCursuri(real)).not.toBeNull();
  });
});
