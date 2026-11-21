// Tabelul de situatii: raspunsuri -> pasi asteptati.
// Este si documentul din care se poate citi ce face aplicatia.
//
// ATENTIE: parametrii si cursurile de aici sunt FICTIVE, alese rotunde pentru
// calcule usor de urmarit. Nu sunt valorile reale si nu ajung in aplicatie.

import { LIPSA, type Banca, type Cursuri, type Moneda, type Parametri, type Rand, type Raspunsuri, type Suma } from "../../src/domeniu/tipuri";

export const suma = (valoare: number, moneda: Moneda = "RON"): Suma => ({ fel: "suma", valoare, moneda });
export const bancaA: Banca = { fel: "lista", id: "banca-a" };
export const bancaB: Banca = { fel: "lista", id: "banca-b" };

/** Fictiv: 1 euro = 5 lei, 1 dolar = 4 lei, 1 lira = 6 lei. */
export const cursuriTest: Cursuri = { lunaReferinta: "2026-10", generatLa: "2026-11-02", leiPe: { EUR: 5, USD: 4, GBP: 6 } };

/**
 * Fictiv: rezerva de 4 luni, prag numerar 5.000 lei, plafon 20.000 euro, marja 2.000 euro.
 * Pragul pentru o banca este deci (20.000 - 2.000) x 5 = 90.000 lei.
 */
export const parametriTest: Parametri = {
  luniRezerva: 4,
  pragNumerarAcasaLei: 5000,
  plafonGarantareEur: 20000,
  marjaPlafonEur: 2000,
  plafonVerificatLa: "2026-06-01",
};

export const AZI = "2026-11-21";

/**
 * Situatia de baza nu produce niciun pas: cheltuieli de 2.500 lei pe luna
 * (rezerva tinta 10.000 lei) si exact 10.000 lei intr-un cont la banca A.
 */
export const baza: Raspunsuri = {
  venit: suma(3000),
  cheltuieli: suma(2500),
  ramanBani: "da",
  datorii: [],
  locuri: [{ tip: "cont", suma: suma(10000), banca: bancaA }],
  cheltuialaMare: { raspuns: "nu", suma: LIPSA },
  stieCineva: true,
  contactSuspect: false,
  girant: false,
  altaSituatie: false,
};

const contA = (lei: number): Rand => ({ tip: "cont", suma: suma(lei), banca: bancaA });
const contB = (lei: number): Rand => ({ tip: "cont", suma: suma(lei), banca: bancaB });

export type Situatie = {
  readonly nume: string;
  readonly raspunsuri: Raspunsuri;
  /** Implicit cursuriTest. null inseamna ca nu exista niciun fisier de cursuri. */
  readonly cursuri?: Cursuri | null;
  /** Implicit AZI. */
  readonly azi?: string;
  /** Pasii asteptati, in ordine. Forma generala se scrie "id:generala". */
  readonly asteptat: readonly string[];
};

export const situatii: readonly Situatie[] = [
  // --- Lista goala ---
  { nume: "situatia de baza nu produce niciun pas", raspunsuri: baza, asteptat: [] },

  // --- 1. Posibila frauda ---
  { nume: "frauda: a fost contactat recent", raspunsuri: { ...baza, contactSuspect: true }, asteptat: ["frauda"] },

  // --- 2. Luna nu se inchide ---
  { nume: "luna: banii se termina", raspunsuri: { ...baza, ramanBani: "nu-se-termina" }, asteptat: ["luna-nu-se-inchide"] },
  { nume: "luna: banii nu ajung", raspunsuri: { ...baza, ramanBani: "nu-ajung" }, asteptat: ["luna-nu-se-inchide"] },
  { nume: "luna: uneori raman bani - niciun pas", raspunsuri: { ...baza, ramanBani: "uneori" }, asteptat: [] },

  // --- 3. Datorii scumpe ---
  { nume: "datorii: IFN", raspunsuri: { ...baza, datorii: ["ifn"] }, asteptat: ["datorii-scumpe"] },
  { nume: "datorii: card", raspunsuri: { ...baza, datorii: ["banca", "card"] }, asteptat: ["datorii-scumpe"] },
  { nume: "datorii: doar la banca - niciun pas", raspunsuri: { ...baza, datorii: ["banca"] }, asteptat: [] },
  { nume: "datorii: doar catre persoane - niciun pas", raspunsuri: { ...baza, datorii: ["persoane"] }, asteptat: [] },

  // --- 4. Bani pentru urgente ---
  { nume: "urgente: cu un leu sub rezerva", raspunsuri: { ...baza, locuri: [contA(9999)] }, asteptat: ["bani-pentru-urgente"] },
  { nume: "urgente: fara nicio economie", raspunsuri: { ...baza, locuri: [] }, asteptat: ["bani-pentru-urgente"] },
  {
    nume: "urgente: banii sunt intr-un depozit, nu sunt accesibili imediat",
    raspunsuri: { ...baza, locuri: [{ tip: "depozit", suma: suma(10000), banca: bancaA }] },
    asteptat: ["bani-pentru-urgente"],
  },
  {
    nume: "urgente: cheltuieli nespuse - forma generala, la fel si banii peste rezerva",
    raspunsuri: { ...baza, cheltuieli: LIPSA },
    asteptat: ["bani-pentru-urgente:generala", "bani-peste-rezerva:generala"],
  },
  {
    nume: "urgente: cheltuieli nespuse si nicio economie - doar pasul de urgente",
    raspunsuri: { ...baza, cheltuieli: LIPSA, locuri: [] },
    asteptat: ["bani-pentru-urgente:generala"],
  },

  // --- 5. Cheltuiala apropiata ---
  {
    nume: "cheltuiala apropiata: da, fara suma",
    raspunsuri: { ...baza, cheltuialaMare: { raspuns: "da", suma: LIPSA } },
    asteptat: ["cheltuiala-apropiata"],
  },
  {
    nume: "cheltuiala apropiata: poate",
    raspunsuri: { ...baza, cheltuialaMare: { raspuns: "poate", suma: LIPSA } },
    asteptat: ["cheltuiala-apropiata"],
  },

  // --- 6. Multi bani in casa ---
  {
    nume: "numerar: cu un leu peste prag",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "acasa", suma: suma(5001) }] },
    asteptat: ["bani-in-casa", "bani-peste-rezerva"],
  },
  {
    nume: "numerar: exact la prag - pasul nu apare",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "acasa", suma: suma(5000) }] },
    asteptat: ["bani-peste-rezerva"],
  },
  {
    nume: "numerar: suma de acasa nespusa - forma generala",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "acasa", suma: LIPSA }] },
    asteptat: ["bani-pentru-urgente:generala", "bani-in-casa:generala", "bani-peste-rezerva:generala"],
  },

  // --- 7. Totul la o singura banca ---
  {
    nume: "banca: cu un leu peste prag la banca A",
    raspunsuri: { ...baza, locuri: [contB(10000), { tip: "depozit", suma: suma(90001), banca: bancaA }] },
    asteptat: ["o-singura-banca", "bani-peste-rezerva"],
  },
  {
    nume: "banca: exact la prag - pasul nu apare",
    raspunsuri: { ...baza, locuri: [contB(10000), { tip: "depozit", suma: suma(90000), banca: bancaA }] },
    asteptat: ["bani-peste-rezerva"],
  },
  {
    nume: "banca: lei si euro la aceeasi banca se aduna",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "depozit", suma: suma(16001, "EUR"), banca: bancaA }] },
    asteptat: ["o-singura-banca", "bani-peste-rezerva", "alta-moneda"],
  },
  {
    nume: "banca: aceeasi suma impartita la doua banci nu declanseaza pasul",
    raspunsuri: { ...baza, locuri: [contA(50000), contB(50000)] },
    asteptat: ["bani-peste-rezerva"],
  },
  { nume: "banca: fara cursuri, o singura banca - forma generala", raspunsuri: baza, cursuri: null, asteptat: ["o-singura-banca:generala"] },
  {
    nume: "banca: fara cursuri, doua banci - pasul nu apare",
    raspunsuri: { ...baza, locuri: [contA(5000), contB(5000)] },
    cursuri: null,
    asteptat: [],
  },
  { nume: "banca: plafon verificat acum exact 12 luni - inca valabil", raspunsuri: baza, azi: "2027-06-01", asteptat: [] },
  { nume: "banca: plafon mai vechi de 12 luni - forma generala", raspunsuri: baza, azi: "2027-06-02", asteptat: ["o-singura-banca:generala"] },
  {
    nume: "banca: plafon vechi - forma generala chiar daca suma ar depasi pragul",
    raspunsuri: { ...baza, locuri: [contA(500000)] },
    azi: "2027-06-02",
    asteptat: ["o-singura-banca:generala", "bani-peste-rezerva"],
  },
  {
    nume: "banca: fara conturi sau depozite - pasul nu apare nici cu plafon vechi",
    raspunsuri: { ...baza, locuri: [{ tip: "acasa", suma: suma(10000) }] },
    azi: "2027-06-02",
    asteptat: ["bani-in-casa"],
  },

  // --- 8. Bani peste rezerva ---
  { nume: "peste rezerva: cu un leu peste", raspunsuri: { ...baza, locuri: [contA(10001)] }, asteptat: ["bani-peste-rezerva"] },
  {
    nume: "peste rezerva: cheltuiala mare cu suma micsoreaza ce ramane",
    raspunsuri: { ...baza, locuri: [contA(15000)], cheltuialaMare: { raspuns: "da", suma: suma(5000) } },
    asteptat: ["cheltuiala-apropiata"],
  },

  // --- 9. Economii in alta moneda ---
  {
    nume: "alta moneda: un rand in euro",
    raspunsuri: { ...baza, locuri: [contA(9995), { tip: "cont", suma: suma(1, "EUR"), banca: bancaA }] },
    asteptat: ["alta-moneda"],
  },
  {
    nume: "alta moneda: fara cursuri, pasul apare oricum",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "acasa", suma: suma(100, "USD") }] },
    cursuri: null,
    asteptat: [
      "bani-pentru-urgente:generala",
      "bani-in-casa:generala",
      "o-singura-banca:generala",
      "bani-peste-rezerva:generala",
      "alta-moneda",
    ],
  },

  // --- 10. Aur ---
  {
    nume: "aur: monede",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "aur", forma: "lingouri-monede", grame: 50 }] },
    asteptat: ["aur"],
  },
  {
    nume: "aur: bijuterii fara grame",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "aur", forma: "bijuterii", grame: null }] },
    asteptat: ["aur"],
  },

  // --- 11. Produse pe care nu le intelege ---
  {
    nume: "produse: altceva, cu suma - nu intra in total",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "altceva", suma: suma(50000) }] },
    asteptat: ["produse-neintelese"],
  },
  {
    nume: "produse: nu stiu sigur, fara suma",
    raspunsuri: { ...baza, locuri: [contA(10000), { tip: "nu-stiu-sigur", suma: LIPSA }] },
    asteptat: ["produse-neintelese"],
  },

  // --- 12, 13, 14 ---
  { nume: "ordine in acte: nu stie nimeni unde sunt banii", raspunsuri: { ...baza, stieCineva: false }, asteptat: ["ordine-in-acte"] },
  { nume: "girant sau imprumuturi date", raspunsuri: { ...baza, girant: true }, asteptat: ["girant"] },
  { nume: "situatie pe care aplicatia nu o acopera", raspunsuri: { ...baza, altaSituatie: true }, asteptat: ["situatie-neacoperita"] },

  // --- Combinatii ---
  {
    nume: "toate sumele nespuse",
    raspunsuri: { ...baza, venit: LIPSA, cheltuieli: LIPSA, locuri: [{ tip: "cont", suma: LIPSA, banca: bancaA }] },
    asteptat: ["bani-pentru-urgente:generala", "o-singura-banca:generala", "bani-peste-rezerva:generala"],
  },
  {
    nume: "toti pasii deodata, in ordinea prioritatii",
    raspunsuri: {
      venit: suma(3000),
      cheltuieli: suma(2500),
      ramanBani: "nu-ajung",
      datorii: ["ifn"],
      locuri: [
        { tip: "acasa", suma: suma(6000) },
        { tip: "depozit", suma: suma(20000, "EUR"), banca: bancaA },
        { tip: "aur", forma: "lingouri-monede", grame: 10 },
        { tip: "nu-stiu-sigur", suma: LIPSA },
      ],
      cheltuialaMare: { raspuns: "da", suma: suma(3000) },
      stieCineva: false,
      contactSuspect: true,
      girant: true,
      altaSituatie: true,
    },
    asteptat: [
      "frauda",
      "luna-nu-se-inchide",
      "datorii-scumpe",
      "bani-pentru-urgente",
      "cheltuiala-apropiata",
      "bani-in-casa",
      "o-singura-banca",
      "bani-peste-rezerva",
      "alta-moneda",
      "aur",
      "produse-neintelese",
      "ordine-in-acte",
      "girant",
      "situatie-neacoperita",
    ],
  },
];
