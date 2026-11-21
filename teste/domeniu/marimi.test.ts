import { describe, expect, test } from "vitest";
import {
  areRanduriNesocotite,
  baniAccesibili,
  baniPesteRezerva,
  inLei,
  numerarAcasa,
  rezervaTinta,
  sumePeBanci,
  totalOrientativ,
} from "../../src/domeniu/marimi";
import { LIPSA, type Banca, type Calcul, type Cursuri, type Moneda, type Rand, type Raspunsuri, type Suma } from "../../src/domeniu/tipuri";

// Cursuri fictive, rotunde, doar pentru teste.
const cursuri: Cursuri = { lunaReferinta: "2026-10", generatLa: "2026-11-02", leiPe: { EUR: 5, USD: 4, GBP: 6 } };

const suma = (valoare: number, moneda: Moneda = "RON"): Suma => ({ fel: "suma", valoare, moneda });
const lei = (v: number): Calcul => ({ fel: "valoare", lei: v });
const bancaA: Banca = { fel: "lista", id: "banca-a" };
const bancaB: Banca = { fel: "lista", id: "banca-b" };
const alta = (nume: string): Banca => ({ fel: "alta", nume });

const raspunsuri = (partial: Partial<Raspunsuri>): Raspunsuri => ({
  venit: suma(3000),
  cheltuieli: suma(2500),
  ramanBani: "da",
  datorii: [],
  locuri: [],
  cheltuialaMare: { raspuns: "nu", suma: LIPSA },
  stieCineva: true,
  contactSuspect: false,
  girant: false,
  altaSituatie: false,
  ...partial,
});

describe("inLei", () => {
  test("leii raman lei", () => {
    expect(inLei(suma(1000), null)).toEqual(lei(1000));
  });
  test("valuta se transforma la cursul mediu", () => {
    expect(inLei(suma(100, "EUR"), cursuri)).toEqual(lei(500));
    expect(inLei(suma(100, "USD"), cursuri)).toEqual(lei(400));
    expect(inLei(suma(100, "GBP"), cursuri)).toEqual(lei(600));
  });
  test("valuta fara cursuri este lipsa, nu zero", () => {
    expect(inLei(suma(100, "EUR"), null)).toEqual(LIPSA);
  });
  test("suma nespusa este lipsa", () => {
    expect(inLei(LIPSA, cursuri)).toEqual(LIPSA);
  });
  test("rezultatul este rotunjit la ban", () => {
    expect(inLei(suma(0.1 + 0.2), null)).toEqual(lei(0.3));
  });
});

describe("totalOrientativ", () => {
  test("aduna Acasa, Cont, Depozit si Titluri de stat", () => {
    const locuri: Rand[] = [
      { tip: "acasa", suma: suma(6000) },
      { tip: "cont", suma: suma(1000), banca: bancaA },
      { tip: "depozit", suma: suma(42000), banca: bancaA },
      { tip: "titluri-de-stat", suma: suma(10000) },
    ];
    expect(totalOrientativ(locuri, null)).toEqual(lei(59000));
  });
  test("aduna mai multe monede", () => {
    const locuri: Rand[] = [
      { tip: "depozit", suma: suma(42000), banca: bancaA },
      { tip: "cont", suma: suma(8500, "EUR"), banca: bancaA },
    ];
    expect(totalOrientativ(locuri, cursuri)).toEqual(lei(84500));
  });
  test("aurul, Altceva si Nu stiu sigur nu intra in total", () => {
    const locuri: Rand[] = [
      { tip: "acasa", suma: suma(6000) },
      { tip: "aur", forma: "lingouri-monede", grame: 50 },
      { tip: "altceva", suma: suma(20000) },
      { tip: "nu-stiu-sigur", suma: LIPSA },
    ];
    expect(totalOrientativ(locuri, null)).toEqual(lei(6000));
    expect(areRanduriNesocotite(locuri)).toBe(true);
  });
  test("o suma nespusa face totalul lipsa", () => {
    const locuri: Rand[] = [
      { tip: "acasa", suma: suma(6000) },
      { tip: "depozit", suma: LIPSA, banca: bancaA },
    ];
    expect(totalOrientativ(locuri, null)).toEqual(LIPSA);
  });
  test("valuta fara cursuri face totalul lipsa", () => {
    const locuri: Rand[] = [{ tip: "cont", suma: suma(100, "EUR"), banca: bancaA }];
    expect(totalOrientativ(locuri, null)).toEqual(LIPSA);
  });
  test("lista goala inseamna zero, nu lipsa", () => {
    expect(totalOrientativ([], null)).toEqual(lei(0));
    expect(areRanduriNesocotite([])).toBe(false);
  });
});

describe("baniAccesibili si numerarAcasa", () => {
  const locuri: Rand[] = [
    { tip: "acasa", suma: suma(6000) },
    { tip: "cont", suma: suma(1000, "EUR"), banca: bancaA },
    { tip: "depozit", suma: suma(42000), banca: bancaA },
    { tip: "titluri-de-stat", suma: suma(10000) },
  ];
  test("accesibili imediat sunt doar Acasa si Cont", () => {
    expect(baniAccesibili(locuri, cursuri)).toEqual(lei(11000));
  });
  test("un depozit cu suma nespusa nu strica banii accesibili", () => {
    const cuLipsa: Rand[] = [...locuri, { tip: "depozit", suma: LIPSA, banca: bancaB }];
    expect(baniAccesibili(cuLipsa, cursuri)).toEqual(lei(11000));
  });
  test("numerarul de acasa", () => {
    expect(numerarAcasa(locuri, cursuri)).toEqual(lei(6000));
  });
});

describe("rezervaTinta", () => {
  test("luni inmultite cu cheltuielile", () => {
    expect(rezervaTinta(suma(2500), 4, null)).toEqual(lei(10000));
  });
  test("cheltuieli nespuse dau lipsa", () => {
    expect(rezervaTinta(LIPSA, 4, null)).toEqual(LIPSA);
  });
});

describe("sumePeBanci", () => {
  test("aduna conturile si depozitele de la aceeasi banca, in toate monedele", () => {
    const locuri: Rand[] = [
      { tip: "depozit", suma: suma(42000), banca: bancaA },
      { tip: "cont", suma: suma(8500, "EUR"), banca: bancaA },
      { tip: "cont", suma: suma(3000), banca: bancaB },
      { tip: "acasa", suma: suma(6000) },
    ];
    expect(sumePeBanci(locuri, cursuri)).toEqual([
      { banca: bancaA, suma: lei(84500) },
      { banca: bancaB, suma: lei(3000) },
    ]);
  });
  test("doua randuri Alta banca cu acelasi nume sunt aceeasi banca", () => {
    const locuri: Rand[] = [
      { tip: "cont", suma: suma(1000), banca: alta("Banca Mica") },
      { tip: "depozit", suma: suma(2000), banca: alta("Banca Mica") },
    ];
    expect(sumePeBanci(locuri, null)).toEqual([{ banca: alta("Banca Mica"), suma: lei(3000) }]);
  });
  test("doua randuri Alta banca cu nume diferite sunt banci diferite", () => {
    const locuri: Rand[] = [
      { tip: "cont", suma: suma(1000), banca: alta("Banca Mica") },
      { tip: "depozit", suma: suma(2000), banca: alta("Banca Mare") },
    ];
    expect(sumePeBanci(locuri, null)).toHaveLength(2);
  });
  test("o suma nespusa la o banca nu afecteaza celelalte banci", () => {
    const locuri: Rand[] = [
      { tip: "cont", suma: LIPSA, banca: bancaA },
      { tip: "depozit", suma: suma(5000), banca: bancaA },
      { tip: "cont", suma: suma(3000), banca: bancaB },
    ];
    expect(sumePeBanci(locuri, null)).toEqual([
      { banca: bancaA, suma: LIPSA },
      { banca: bancaB, suma: lei(3000) },
    ]);
  });
  test("fara conturi sau depozite nu exista nicio banca", () => {
    expect(sumePeBanci([{ tip: "acasa", suma: suma(6000) }], null)).toEqual([]);
  });
});

describe("baniPesteRezerva", () => {
  const locuri: Rand[] = [
    { tip: "acasa", suma: suma(6000) },
    { tip: "depozit", suma: suma(42000), banca: bancaA },
  ];
  test("total minus rezerva", () => {
    expect(baniPesteRezerva(raspunsuri({ locuri }), 4, null)).toEqual(lei(38000));
  });
  test("scade si cheltuiala mare, cand omul a spus o suma", () => {
    const r = raspunsuri({ locuri, cheltuialaMare: { raspuns: "da", suma: suma(8000) } });
    expect(baniPesteRezerva(r, 4, null)).toEqual(lei(30000));
  });
  test("cheltuiala mare fara suma nu scade nimic", () => {
    const r = raspunsuri({ locuri, cheltuialaMare: { raspuns: "poate", suma: LIPSA } });
    expect(baniPesteRezerva(r, 4, null)).toEqual(lei(38000));
  });
  test("o suma ramasa la raspunsul Nu este ignorata", () => {
    const r = raspunsuri({ locuri, cheltuialaMare: { raspuns: "nu", suma: suma(8000) } });
    expect(baniPesteRezerva(r, 4, null)).toEqual(lei(38000));
  });
  test("poate fi negativ", () => {
    const r = raspunsuri({ locuri: [{ tip: "acasa", suma: suma(2000) }] });
    expect(baniPesteRezerva(r, 4, null)).toEqual(lei(-8000));
  });
  test("cheltuieli nespuse dau lipsa", () => {
    expect(baniPesteRezerva(raspunsuri({ locuri, cheltuieli: LIPSA }), 4, null)).toEqual(LIPSA);
  });
  test("total lipsa da lipsa", () => {
    const r = raspunsuri({ locuri: [{ tip: "depozit", suma: LIPSA, banca: bancaA }] });
    expect(baniPesteRezerva(r, 4, null)).toEqual(LIPSA);
  });
});
