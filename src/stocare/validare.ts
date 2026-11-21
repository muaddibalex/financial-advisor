// Verificarea datelor citite din stocarea browserului. Orice nu arata exact
// cum trebuie este socotit stricat: aplicatia nu ghiceste si nu repara.

import { ORDINEA_PASILOR } from "../domeniu/reguli";
import type { Banca, Datorie, IdPas, Moneda, Rand, Raspunsuri, Suma } from "../domeniu/tipuri";

/** Raspunsurile date pana acum. Chestionarul poate fi inca neterminat. */
export type RaspunsuriPartiale = Partial<Raspunsuri>;

export type StareSalvata = {
  readonly raspunsuri: RaspunsuriPartiale;
  /** Pasii pe care omul i-a bifat ca facuti. Este declaratia lui, nu o verificare. */
  readonly pasiFacuti: readonly IdPas[];
};

export const STARE_GOALA: StareSalvata = { raspunsuri: {}, pasiFacuti: [] };

const MONEDE: readonly Moneda[] = ["RON", "EUR", "USD", "GBP"];
const DATORII: readonly Datorie[] = ["banca", "ifn", "card", "persoane"];

type Obiect = Record<string, unknown>;
const esteObiect = (v: unknown): v is Obiect => typeof v === "object" && v !== null && !Array.isArray(v);
const esteUnulDin = <T extends string>(v: unknown, valori: readonly T[]): v is T =>
  typeof v === "string" && (valori as readonly string[]).includes(v);
const esteSumaPozitiva = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

function esteSuma(v: unknown): v is Suma {
  if (!esteObiect(v)) return false;
  if (v.fel === "lipsa") return true;
  return v.fel === "suma" && esteSumaPozitiva(v.valoare) && esteUnulDin(v.moneda, MONEDE);
}

function esteBanca(v: unknown): v is Banca {
  if (!esteObiect(v)) return false;
  if (v.fel === "lista") return typeof v.id === "string" && v.id.length > 0;
  return v.fel === "alta" && typeof v.nume === "string" && v.nume.length > 0;
}

function esteRand(v: unknown): v is Rand {
  if (!esteObiect(v)) return false;
  switch (v.tip) {
    case "acasa":
    case "titluri-de-stat":
    case "altceva":
    case "nu-stiu-sigur":
      return esteSuma(v.suma);
    case "cont":
    case "depozit":
      return esteSuma(v.suma) && esteBanca(v.banca);
    case "aur":
      return esteUnulDin(v.forma, ["lingouri-monede", "bijuterii"]) && (v.grame === null || esteSumaPozitiva(v.grame));
    default:
      return false;
  }
}

/** Cate o verificare pentru fiecare raspuns. O cheie necunoscuta inseamna date stricate. */
const VERIFICARI: { readonly [K in keyof Raspunsuri]: (v: unknown) => boolean } = {
  venit: esteSuma,
  cheltuieli: esteSuma,
  ramanBani: (v) => esteUnulDin(v, ["da", "uneori", "nu-se-termina", "nu-ajung"]),
  datorii: (v) => Array.isArray(v) && v.every((d) => esteUnulDin(d, DATORII)),
  locuri: (v) => Array.isArray(v) && v.every(esteRand),
  cheltuialaMare: (v) => esteObiect(v) && esteUnulDin(v.raspuns, ["da", "nu", "poate"]) && esteSuma(v.suma),
  stieCineva: (v) => typeof v === "boolean",
  contactSuspect: (v) => typeof v === "boolean",
  girant: (v) => typeof v === "boolean",
  altaSituatie: (v) => typeof v === "boolean",
};

function esteRaspunsuriPartiale(v: unknown): v is RaspunsuriPartiale {
  if (!esteObiect(v)) return false;
  return Object.entries(v).every(([cheie, valoare]) => {
    const verifica = (VERIFICARI as Record<string, ((x: unknown) => boolean) | undefined>)[cheie];
    return verifica !== undefined && verifica(valoare);
  });
}

/** Intoarce starea daca este corecta in intregime, altfel null. */
export function valideazaStare(v: unknown): StareSalvata | null {
  if (!esteObiect(v)) return null;
  const { raspunsuri, pasiFacuti } = v;
  if (!esteRaspunsuriPartiale(raspunsuri)) return null;
  if (!Array.isArray(pasiFacuti) || !pasiFacuti.every((p) => esteUnulDin(p, ORDINEA_PASILOR))) return null;
  return { raspunsuri, pasiFacuti: pasiFacuti as IdPas[] };
}

/** Chestionarul este terminat cand exista raspuns la toate cele 10 intrebari. */
export function esteComplet(raspunsuri: RaspunsuriPartiale): raspunsuri is Raspunsuri {
  return (Object.keys(VERIFICARI) as (keyof Raspunsuri)[]).every((cheie) => raspunsuri[cheie] !== undefined);
}
