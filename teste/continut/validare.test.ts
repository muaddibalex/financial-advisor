import { describe, expect, test } from "vitest";
import { PASI, type ContinutPas } from "../../src/continut/pasi";
import { FORMULARI_INTERZISE, faraDiacritice, valideazaContinut, type Continut } from "../../src/continut/validare";
import { ORDINEA_PASILOR } from "../../src/domeniu/reguli";
import type { IdPas } from "../../src/domeniu/tipuri";
import { AZI, parametriTest } from "../fixturi/situatii";

/** Un pas cum ar arata dupa verificare. Sursa si linkul sunt fictive, doar pentru test. */
const verificat = (pas: ContinutPas): ContinutPas => ({
  titlu: pas.titlu,
  peScurt: pas.peScurt,
  deCe: pas.deCe,
  cePutetiFace: pas.cePutetiFace,
  ciorna: false,
  sursa: "Sursa de test",
  verificatLa: "2026-11-01",
  link: { eticheta: "Pagina de test", adresa: "https://exemplu.test/pagina", ceSaCautati: "Cautati cuvantul de test." },
});

const pasiVerificati = Object.fromEntries(ORDINEA_PASILOR.map((id) => [id, verificat(PASI[id])])) as Record<IdPas, ContinutPas>;

const bun: Continut = {
  pasi: pasiVerificati,
  banci: { ciorna: false, sursa: "Sursa de test", verificatLa: "2026-11-01", banci: [{ id: "a", nume: "Banca de test" }] },
  parametri: parametriTest,
  provenienta: { decisDe: "Proprietarul", decisLa: "2026-11-01", sursaPlafon: "Sursa de test" },
  incadrare: { lamurita: true, raspuns: "Raspuns de test", data: "2026-11-01" },
};

/** Un sfat general, cum ar arata dupa aprobare: fara link si fara sursa, cu motivul scris. */
const sfatGeneral: Partial<ContinutPas> = { link: null, sursa: null, verificatLa: null, faraLink: "Sfat de organizare." };

const cuPas = (id: IdPas, schimbare: Partial<ContinutPas>): Continut => ({ ...bun, pasi: { ...bun.pasi, [id]: { ...bun.pasi[id], ...schimbare } } });
const probleme = (c: Continut, azi = AZI) => valideazaContinut(c, azi);

describe("validarea continutului pentru publicare", () => {
  test("un continut complet si verificat trece", () => {
    expect(probleme(bun)).toEqual([]);
  });

  test.each<[string, Continut, string]>([
    ["incadrarea ASF nelamurita", { ...bun, incadrare: { lamurita: false, raspuns: null, data: null } }, "ASF"],
    ["incadrare lamurita fara raspuns notat", { ...bun, incadrare: { lamurita: true, raspuns: " ", data: "2026-11-01" } }, "lipseste raspunsul"],
    ["parametri lipsa", { ...bun, parametri: null }, "parametrii proprietarului lipsesc"],
    ["rezerva zero", { ...bun, parametri: { ...parametriTest, luniRezerva: 0 } }, "rezerva in luni"],
    ["marja cat plafonul", { ...bun, parametri: { ...parametriTest, marjaPlafonEur: parametriTest.plafonGarantareEur } }, "marja"],
    ["plafon fara data", { ...bun, parametri: { ...parametriTest, plafonVerificatLa: "candva" } }, "data verificarii"],
    ["plafon verificat in viitor", { ...bun, parametri: { ...parametriTest, plafonVerificatLa: "2027-01-01" } }, "in viitor"],
    ["parametri fara nota", { ...bun, provenienta: null }, "cine i-a decis"],
    ["nota fara sursa plafonului", { ...bun, provenienta: { decisDe: "Proprietarul", decisLa: "2026-11-01", sursaPlafon: "" } }, "sursa oficiala a plafonului"],
    ["lista bancilor in ciorna", { ...bun, banci: { ...bun.banci, ciorna: true } }, "bancilor este marcata CIORNA"],
    ["lista bancilor fara sursa", { ...bun, banci: { ...bun.banci, sursa: null } }, "bancilor nu are sursa"],
    ["lista bancilor goala", { ...bun, banci: { ...bun.banci, banci: [] } }, "bancilor este goala"],
    ["pas in ciorna", cuPas("girant", { ciorna: true }), "pasul girant: text marcat CIORNA"],
    ["pas fara sursa", cuPas("aur", { sursa: null }), "pasul aur: lipseste sursa"],
    ["pas fara data", cuPas("aur", { verificatLa: null }), "pasul aur: lipseste sursa sau data"],
    ["pas fara link si fara motiv", cuPas("frauda", { link: null }), "pasul frauda: lipseste linkul"],
    ["motiv gol pentru lipsa linkului", cuPas("aur", { ...sfatGeneral, faraLink: "  " }), "pasul aur: motivul pentru lipsa linkului este gol"],
    ["link si motiv de lipsa, amandoua", cuPas("aur", { faraLink: "Sfat de organizare." }), "pasul aur: are si link, si motiv"],
    ["pas fara link, cu sursa dar fara data", cuPas("girant", { ...sfatGeneral, sursa: "Codul civil" }), "pasul girant: sursa nu are data"],
    [
      "link fara https",
      cuPas("frauda", { link: { eticheta: "x", adresa: "http://exemplu.test", ceSaCautati: "y" } }),
      "nu incepe cu https",
    ],
    [
      "link fara ce sa cautati",
      cuPas("frauda", { link: { eticheta: "x", adresa: "https://exemplu.test", ceSaCautati: "" } }),
      "ce sa cautati",
    ],
  ])("refuza: %s", (_nume, continut, fragment) => {
    const gasite = probleme(continut);
    expect(gasite.some((p) => p.includes(fragment))).toBe(true);
  });

  test("un pas fara link trece daca are motivul scris, cu sau fara sursa", () => {
    expect(probleme(cuPas("ordine-in-acte", sfatGeneral))).toEqual([]);
    expect(probleme(cuPas("girant", { ...sfatGeneral, sursa: "Codul civil", verificatLa: "2026-11-01" }))).toEqual([]);
  });

  test("pasii care trimit la o institutie au link in continutul de acum sau sunt inca de completat, niciodata scutiti", () => {
    for (const id of ["frauda", "o-singura-banca", "bani-peste-rezerva", "produse-neintelese"] as const) {
      expect(PASI[id].faraLink).toBeUndefined();
    }
    expect(ORDINEA_PASILOR.filter((id) => PASI[id].faraLink !== undefined)).toHaveLength(10);
  });

  test("plafonul verificat acum mai mult de 12 luni opreste publicarea", () => {
    expect(probleme(bun, "2027-06-01")).toEqual([]);
    expect(probleme(bun, "2027-06-02")).toEqual(["parametru: plafonul a fost verificat acum mai mult de 12 luni"]);
  });

  test.each(FORMULARI_INTERZISE)("formularea „%s” este refuzata in pasii despre produse si valuta, cu sau fara diacritice", (formulare) => {
    const cuDiacritice = { "va recomandam": "Vă recomandăm", alegeti: "Alegeți", cumparati: "Cumpărați", schimbati: "Schimbați" }[formulare] ?? "Cel mai bun";
    for (const id of ["bani-peste-rezerva", "alta-moneda"] as const) {
      expect(probleme(cuPas(id, { deCe: `${cuDiacritice} ceva.` }))).toEqual([`pasul ${id}: formulare de recomandare interzisa: "${formulare}"`]);
    }
  });

  test("lista interzisa priveste doar pasii despre produse si valuta", () => {
    expect(probleme(cuPas("aur", { deCe: "Alegeți un loc sigur." }))).toEqual([]);
  });

  test("textele de acum ale pasilor despre produse si valuta nu contin formulari interzise", () => {
    for (const id of ["bani-peste-rezerva", "alta-moneda"] as const) {
      const p = PASI[id];
      const text = faraDiacritice([p.titlu, p.peScurt, p.deCe, ...p.cePutetiFace].join("\n"));
      for (const formulare of FORMULARI_INTERZISE) expect(text).not.toContain(formulare);
    }
  });
});
