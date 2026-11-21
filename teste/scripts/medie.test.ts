// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  aceleasiCursuri,
  adresaFisierAnual,
  construiesteCursuri,
  EroareCursuri,
  lunaIncheiata,
  medieLunara,
  ZILE_MINIME,
} from "../../scripts/medie.ts";

type Rate = Partial<Record<"EUR" | "USD" | "GBP", number>>;

/** Construieste un fisier in structura BNR, cu cursuri fictive. */
function fisier(zile: ReadonlyArray<readonly [data: string, rate: Rate]>): string {
  const cuburi = zile
    .map(([data, rate]) => {
      const linii = Object.entries(rate).map(([moneda, curs]) => `<Rate currency="${moneda}">${curs}</Rate>`);
      // O moneda cu multiplicator, ca in fisierul real; nu trebuie sa incurce calculul.
      linii.push('<Rate currency="HUF" multiplier="100">1.4000</Rate>');
      return `<Cube date="${data}">${linii.join("")}</Cube>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="utf-8"?><DataSet xmlns="https://www.bnr.ro/xsd"><Header><Publisher>National Bank of Romania</Publisher></Header><Body><Subject>Reference rates</Subject><OrigCurrency>RON</OrigCurrency>${cuburi}</Body></DataSet>`;
}

const zi = (luna: string, n: number): string => `${luna}-${String(n).padStart(2, "0")}`;

/** O luna cu `cate` zile publicate; EUR alterneaza intre 5 si 5,2 (medie 5,1 la numar par de zile). */
function luna(prefix: string, cate: number, rate: (n: number) => Rate = (n) => ({ EUR: n % 2 ? 5 : 5.2, USD: 4, GBP: 6 })) {
  return Array.from({ length: cate }, (_, i) => [zi(prefix, i + 1), rate(i + 1)] as const);
}

describe("lunaIncheiata", () => {
  test("luna dinaintea celei curente", () => {
    expect(lunaIncheiata("2026-11-02")).toEqual({ an: 2026, luna: 10 });
    expect(lunaIncheiata("2026-03-31")).toEqual({ an: 2026, luna: 2 });
  });
  test("in ianuarie este decembrie din anul precedent", () => {
    expect(lunaIncheiata("2027-01-02")).toEqual({ an: 2026, luna: 12 });
  });
  test("refuza o data scrisa altfel", () => {
    expect(() => lunaIncheiata("02.11.2026")).toThrow(EroareCursuri);
    expect(() => lunaIncheiata("2026-13-01")).toThrow(EroareCursuri);
  });
});

test("adresa fisierului anual", () => {
  expect(adresaFisierAnual(2026)).toBe("https://curs.bnr.ro/files/xml/years/nbrfxrates2026.xml");
});

describe("medieLunara", () => {
  test("media aritmetica a zilelor din luna ceruta", () => {
    const xml = fisier(luna("2026-10", 20));
    expect(medieLunara(xml, { an: 2026, luna: 10 })).toEqual({ EUR: 5.1, USD: 4, GBP: 6 });
  });

  test("ignora zilele din alte luni", () => {
    const xml = fisier([
      ...luna("2026-09", 20, () => ({ EUR: 9, USD: 9, GBP: 9 })),
      ...luna("2026-10", 20),
      ...luna("2026-11", 15, () => ({ EUR: 1, USD: 1, GBP: 1 })),
    ]);
    expect(medieLunara(xml, { an: 2026, luna: 10 })).toEqual({ EUR: 5.1, USD: 4, GBP: 6 });
  });

  test("rotunjeste la 4 zecimale", () => {
    // 16 zile: doua de 5,0001 si restul de 5 -> 5,0000125 -> 5
    const xml = fisier(luna("2026-10", 16, (n) => ({ EUR: n <= 2 ? 5.0001 : 5, USD: 4, GBP: 6 })));
    expect(medieLunara(xml, { an: 2026, luna: 10 }).EUR).toBe(5);
  });

  test("luna cu zile lipsa, dar peste minim: media se face pe zilele publicate", () => {
    const xml = fisier(luna("2026-12", ZILE_MINIME, () => ({ EUR: 5, USD: 4, GBP: 6 })));
    expect(medieLunara(xml, { an: 2026, luna: 12 })).toEqual({ EUR: 5, USD: 4, GBP: 6 });
  });

  test("luna cu prea putine zile este refuzata", () => {
    const xml = fisier(luna("2026-10", ZILE_MINIME - 1));
    expect(() => medieLunara(xml, { an: 2026, luna: 10 })).toThrow(/doar 14 zile/);
  });

  test("fisier fara luna ceruta", () => {
    const xml = fisier(luna("2026-09", 20));
    expect(() => medieLunara(xml, { an: 2026, luna: 10 })).toThrow(/nicio zi din luna 2026-10/);
  });

  test("moneda lipsa intr-o singura zi opreste calculul", () => {
    const xml = fisier(luna("2026-10", 20, (n) => (n === 7 ? { EUR: 5, USD: 4 } : { EUR: 5, USD: 4, GBP: 6 })));
    expect(() => medieLunara(xml, { an: 2026, luna: 10 })).toThrow(/Lipseste GBP in ziua 2026-10-07/);
  });

  test("curs care nu este numar pozitiv", () => {
    const xml = fisier(luna("2026-10", 20, (n) => ({ EUR: n === 3 ? 0 : 5, USD: 4, GBP: 6 })));
    expect(() => medieLunara(xml, { an: 2026, luna: 10 })).toThrow(/Curs invalid pentru EUR in ziua 2026-10-03/);
  });

  test("continut care nu este fisierul BNR", () => {
    expect(() => medieLunara("<!doctype html><html><body>BNR</body></html>", { an: 2026, luna: 10 })).toThrow(EroareCursuri);
    expect(() => medieLunara("", { an: 2026, luna: 10 })).toThrow(EroareCursuri);
  });
});

describe("construiesteCursuri", () => {
  test("luna obisnuita", () => {
    expect(construiesteCursuri(fisier(luna("2026-10", 20)), "2026-11-02")).toEqual({
      lunaReferinta: "2026-10",
      generatLa: "2026-11-02",
      leiPe: { EUR: 5.1, USD: 4, GBP: 6 },
    });
  });

  test("in ianuarie foloseste decembrie din fisierul anului precedent", () => {
    const rezultat = construiesteCursuri(fisier(luna("2026-12", 20)), "2027-01-02");
    expect(rezultat.lunaReferinta).toBe("2026-12");
  });

  test("date reale BNR, octombrie 2026: mediile se potrivesc cu un calcul facut separat", () => {
    // Fisier decupat din nbrfxrates2026.xml, descarcat la 21.11.2026 (22 de zile).
    // Valorile asteptate au fost calculate independent, cu awk, pe acelasi fisier:
    // EUR 5,338518  USD 4,764777  GBP 6,333277.
    const xml = readFileSync(new URL("../fixturi/bnr/2026-octombrie-real.xml", import.meta.url), "utf8");
    expect(construiesteCursuri(xml, "2026-11-02").leiPe).toEqual({ EUR: 5.3385, USD: 4.7648, GBP: 6.3333 });
  });
});

describe("aceleasiCursuri", () => {
  const a = { lunaReferinta: "2026-10", generatLa: "2026-11-02", leiPe: { EUR: 5.1, USD: 4, GBP: 6 } };
  test("data generarii nu conteaza", () => {
    expect(aceleasiCursuri(a, { ...a, generatLa: "2026-11-05" })).toBe(true);
  });
  test("alta luna sau alta medie inseamna cursuri diferite", () => {
    expect(aceleasiCursuri(a, { ...a, lunaReferinta: "2026-09" })).toBe(false);
    expect(aceleasiCursuri(a, { ...a, leiPe: { ...a.leiPe, EUR: 5.2 } })).toBe(false);
  });
});
