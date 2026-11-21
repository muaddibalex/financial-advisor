// Marimile calculate din specificatie, sectiunea 5. Functii pure.
// Regula de baza: daca o suma necesara lipseste sau nu poate fi transformata
// in lei, rezultatul este LIPSA, niciodata zero.

import {
  LIPSA,
  type Banca,
  type Calcul,
  type Cursuri,
  type Rand,
  type Raspunsuri,
  type Suma,
  type TipRand,
} from "./tipuri";

/** Tipurile de rand care intra in totalul orientativ. */
export const TIPURI_IN_TOTAL: readonly TipRand[] = ["acasa", "cont", "depozit", "titluri-de-stat"];

/** Tipurile de rand socotite bani accesibili imediat. */
export const TIPURI_ACCESIBILE: readonly TipRand[] = ["acasa", "cont"];

function valoare(lei: number): Calcul {
  // Rotunjire la ban, ca adunarile repetate sa nu lase zecimale parazite.
  return { fel: "valoare", lei: Math.round(lei * 100) / 100 };
}

/** Transforma o suma in lei, la cursul mediu al lunii de referinta. */
export function inLei(suma: Suma, cursuri: Cursuri | null): Calcul {
  if (suma.fel === "lipsa") return LIPSA;
  if (suma.moneda === "RON") return valoare(suma.valoare);
  if (cursuri === null) return LIPSA;
  return valoare(suma.valoare * cursuri.leiPe[suma.moneda]);
}

function aduna(sume: readonly Calcul[]): Calcul {
  let total = 0;
  for (const s of sume) {
    if (s.fel === "lipsa") return LIPSA;
    total += s.lei;
  }
  return valoare(total);
}

function sumaRandului(rand: Rand): Suma {
  // Aurul nu are suma in bani: este inregistrat doar ca forma si grame.
  return rand.tip === "aur" ? LIPSA : rand.suma;
}

function sumaPeTipuri(locuri: readonly Rand[], tipuri: readonly TipRand[], cursuri: Cursuri | null): Calcul {
  return aduna(locuri.filter((r) => tipuri.includes(r.tip)).map((r) => inLei(sumaRandului(r), cursuri)));
}

/** Totalul orientativ: Acasa, Cont, Depozit si Titluri de stat. Fara aur si fara "Altceva". */
export function totalOrientativ(locuri: readonly Rand[], cursuri: Cursuri | null): Calcul {
  return sumaPeTipuri(locuri, TIPURI_IN_TOTAL, cursuri);
}

/** Exista randuri care nu au fost socotite in total (aur, altceva, nu stiu sigur)? */
export function areRanduriNesocotite(locuri: readonly Rand[]): boolean {
  return locuri.some((r) => !TIPURI_IN_TOTAL.includes(r.tip));
}

/** Bani accesibili imediat: randurile Acasa si Cont. */
export function baniAccesibili(locuri: readonly Rand[], cursuri: Cursuri | null): Calcul {
  return sumaPeTipuri(locuri, TIPURI_ACCESIBILE, cursuri);
}

/** Numerarul tinut acasa. */
export function numerarAcasa(locuri: readonly Rand[], cursuri: Cursuri | null): Calcul {
  return sumaPeTipuri(locuri, ["acasa"], cursuri);
}

/** Rezerva tinta: numarul de luni din parametri inmultit cu cheltuielile lunare. */
export function rezervaTinta(cheltuieli: Suma, luniRezerva: number, cursuri: Cursuri | null): Calcul {
  const lunar = inLei(cheltuieli, cursuri);
  if (lunar.fel === "lipsa") return LIPSA;
  return valoare(lunar.lei * luniRezerva);
}

/** Cheia dupa care doua randuri sunt socotite la aceeasi banca. */
export function cheieBanca(banca: Banca): string {
  // Doua randuri "Alta banca" sunt aceeasi banca doar daca numele sunt identice.
  return banca.fel === "lista" ? `lista:${banca.id}` : `alta:${banca.nume}`;
}

export type SumaPeBanca = { readonly banca: Banca; readonly suma: Calcul };

/** Suma la fiecare banca: randurile Cont si Depozit, toate monedele, in lei. */
export function sumePeBanci(locuri: readonly Rand[], cursuri: Cursuri | null): readonly SumaPeBanca[] {
  const grupuri = new Map<string, { banca: Banca; sume: Calcul[] }>();
  for (const rand of locuri) {
    if (rand.tip !== "cont" && rand.tip !== "depozit") continue;
    const cheie = cheieBanca(rand.banca);
    const grup = grupuri.get(cheie) ?? { banca: rand.banca, sume: [] };
    grup.sume.push(inLei(rand.suma, cursuri));
    grupuri.set(cheie, grup);
  }
  return [...grupuri.values()].map((g) => ({ banca: g.banca, suma: aduna(g.sume) }));
}

/**
 * Bani peste rezerva: totalul orientativ, minus cheltuiala mare din urmatorul an
 * (daca omul a spus o suma), minus rezerva tinta. Poate fi negativ.
 */
export function baniPesteRezerva(raspunsuri: Raspunsuri, luniRezerva: number, cursuri: Cursuri | null): Calcul {
  const total = totalOrientativ(raspunsuri.locuri, cursuri);
  const rezerva = rezervaTinta(raspunsuri.cheltuieli, luniRezerva, cursuri);
  if (total.fel === "lipsa" || rezerva.fel === "lipsa") return LIPSA;

  const { raspuns, suma } = raspunsuri.cheltuialaMare;
  const cheltuiala = raspuns === "nu" ? LIPSA : inLei(suma, cursuri);
  const deScazut = cheltuiala.fel === "valoare" ? cheltuiala.lei : 0;

  return valoare(total.lei - deScazut - rezerva.lei);
}
