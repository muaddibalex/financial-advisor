// Incarcarea fisierului de cursuri: intai din retea, apoi din ultima copie
// salvata. Daca nu exista niciuna, rezultatul este "lipsa" si aplicatia
// afiseaza totaluri separate pe fiecare moneda.

import type { Cursuri, Valuta } from "../domeniu/tipuri";

const VALUTE: readonly Valuta[] = ["EUR", "USD", "GBP"];

/** Locul in care se pastreaza ultima copie a cursurilor. Implementat de modulul de stocare. */
export type PastrareCursuri = {
  citeste(): unknown;
  scrie(cursuri: Cursuri): void;
};

export type RezultatCursuri =
  | { readonly sursa: "retea" | "copie"; readonly cursuri: Cursuri }
  | { readonly sursa: "lipsa"; readonly cursuri: null };

type Cere = (adresa: string, optiuni?: RequestInit) => Promise<Response>;

function esteObiect(valoare: unknown): valoare is Record<string, unknown> {
  return typeof valoare === "object" && valoare !== null;
}

/** Verifica forma unui fisier de cursuri. Intoarce null pentru orice nu arata exact cum trebuie. */
export function valideazaCursuri(valoare: unknown): Cursuri | null {
  if (!esteObiect(valoare)) return null;
  const { lunaReferinta, generatLa, leiPe } = valoare;
  if (typeof lunaReferinta !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(lunaReferinta)) return null;
  if (typeof generatLa !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(generatLa)) return null;
  if (!esteObiect(leiPe)) return null;

  const cursuri: Partial<Record<Valuta, number>> = {};
  for (const valuta of VALUTE) {
    const curs = leiPe[valuta];
    if (typeof curs !== "number" || !Number.isFinite(curs) || curs <= 0) return null;
    cursuri[valuta] = curs;
  }
  return { lunaReferinta, generatLa, leiPe: cursuri as Record<Valuta, number> };
}

export const TIMP_MAXIM_MS = 8000;

async function dinRetea(adresa: string, cere: Cere): Promise<Cursuri | null> {
  // O cerere care nu mai raspunde este oprita, ca aplicatia sa treaca la copia salvata.
  // AbortController cu setTimeout merge si pe telefoanele mai vechi.
  const oprire = new AbortController();
  const ceas = setTimeout(() => oprire.abort(), TIMP_MAXIM_MS);
  try {
    const raspuns = await cere(adresa, { cache: "no-store", signal: oprire.signal });
    if (!raspuns.ok) return null;
    return valideazaCursuri(await raspuns.json());
  } catch {
    return null;
  } finally {
    clearTimeout(ceas);
  }
}

function dinCopie(pastrare: PastrareCursuri): Cursuri | null {
  try {
    return valideazaCursuri(pastrare.citeste());
  } catch {
    return null;
  }
}

/**
 * Incarca cursurile. Nu arunca niciodata: orice esec duce la copia salvata,
 * iar in lipsa ei la rezultatul "lipsa".
 */
export async function incarcaCursuri(adresa: string, pastrare: PastrareCursuri, cere: Cere = fetch): Promise<RezultatCursuri> {
  const proaspete = await dinRetea(adresa, cere);
  const copie = dinCopie(pastrare);

  // Un raspuns mai vechi decat copia (de exemplu servit dintr-un cache) nu o inlocuieste.
  if (proaspete && (!copie || proaspete.lunaReferinta >= copie.lunaReferinta)) {
    try {
      pastrare.scrie(proaspete);
    } catch {
      // Fara stocare, cursurile raman valabile pe durata sesiunii.
    }
    return { sursa: "retea", cursuri: proaspete };
  }
  if (copie) return { sursa: "copie", cursuri: copie };
  return { sursa: "lipsa", cursuri: null };
}
