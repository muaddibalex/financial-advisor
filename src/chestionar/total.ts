// Ce se afiseaza ca total sub lista de locuri. Functie pura.
//
// Regula: niciun numar nu apare daca nu poate fi calculat corect. O suma
// nespusa sau lipsa cursurilor schimba felul afisarii, nu produce o cifra.

import { TIPURI_IN_TOTAL, totalOrientativ } from "../domeniu/marimi";
import type { Cursuri, Moneda, Rand } from "../domeniu/tipuri";

export type AfisareTotal =
  /** Niciun rand care intra in total. */
  | { readonly fel: "nimic" }
  /** Cel putin o suma nu a fost spusa. */
  | { readonly fel: "suma-nespusa" }
  | { readonly fel: "lei"; readonly lei: number; readonly cuValuta: boolean }
  /** Exista valuta, dar nu exista cursuri: cate un total pe fiecare moneda. */
  | { readonly fel: "pe-monede"; readonly sume: readonly (readonly [Moneda, number])[] };

const ORDINEA_MONEDELOR: readonly Moneda[] = ["RON", "EUR", "USD", "GBP"];

export function afisareTotal(locuri: readonly Rand[], cursuri: Cursuri | null): AfisareTotal {
  const peMonede = new Map<Moneda, number>();
  let randuri = 0;
  for (const rand of locuri) {
    if (rand.tip === "aur" || !TIPURI_IN_TOTAL.includes(rand.tip)) continue;
    randuri++;
    if (rand.suma.fel === "lipsa") return { fel: "suma-nespusa" };
    peMonede.set(rand.suma.moneda, (peMonede.get(rand.suma.moneda) ?? 0) + rand.suma.valoare);
  }
  if (randuri === 0) return { fel: "nimic" };

  const cuValuta = [...peMonede.keys()].some((m) => m !== "RON");
  const total = totalOrientativ(locuri, cursuri);
  if (total.fel === "valoare") return { fel: "lei", lei: total.lei, cuValuta };

  return {
    fel: "pe-monede",
    sume: ORDINEA_MONEDELOR.flatMap((m) => {
      const suma = peMonede.get(m);
      return suma === undefined ? [] : [[m, Math.round(suma * 100) / 100] as const];
    }),
  };
}

const LUNI = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
] as const;

/** "2026-10" -> "octombrie 2026". */
export function numeleLunii(lunaReferinta: string): string {
  const [an, luna] = lunaReferinta.split("-");
  const nume = LUNI[Number(luna) - 1];
  return nume === undefined ? lunaReferinta : `${nume} ${an}`;
}
