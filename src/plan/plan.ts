// Planul afisat omului: pasii motorului de reguli, in ordinea lui, impreuna cu
// bifele si cu starea cursului valutar. Functii pure.

import { formateazaSuma } from "../chestionar/suma";
import { textSucursale, type BancaDinLista } from "../continut/banci";
import { CONSTATARI } from "../continut/constatari";
import { stareCursuri } from "../cursuri/vechime";
import { baniAccesibili, numerarAcasa, rezervaTinta } from "../domeniu/marimi";
import { calculeazaPasi } from "../domeniu/reguli";
import type { Cursuri, IdPas, Parametri, Pas, Raspunsuri } from "../domeniu/tipuri";

export type PasInPlan = Pas & {
  readonly facut: boolean;
  /** Numarul din lista. Avertizarea de frauda nu are numar: sta deasupra, marcata distinct. */
  readonly numar: number | null;
};

/**
 * Starea cursului valutar, daca planul a avut nevoie de el:
 * "nu-trebuie" cand niciun calcul nu a folosit cursul.
 */
export type StareCurs = "nu-trebuie" | "proaspat" | "vechi" | "lipsa";

export type Plan = {
  readonly pasi: readonly PasInPlan[];
  /** Cati pasi nu sunt bifati. */
  readonly ramase: number;
  readonly curs: StareCurs;
};

/** Pasul de frauda nu poate fi bifat: o avertizare stearsa nu mai avertizeaza. */
export function sePoateBifa(id: IdPas): boolean {
  return id !== "frauda";
}

function cursulEsteNecesar(r: Raspunsuri, parametri: Parametri | null): boolean {
  const areValuta = r.locuri.some((rand) => rand.tip !== "aur" && rand.suma.fel === "suma" && rand.suma.moneda !== "RON");
  // Pragul pentru o singura banca se socoteste in euro, chiar daca toate economiile sunt in lei.
  const areBanca = r.locuri.some((rand) => rand.tip === "cont" || rand.tip === "depozit");
  return areValuta || (areBanca && parametri !== null);
}

export function construiestePlan(
  r: Raspunsuri,
  cursuri: Cursuri | null,
  parametri: Parametri | null,
  azi: string,
  pasiFacuti: readonly IdPas[],
): Plan {
  let numar = 0;
  // Ordinea este cea a motorului de reguli si nu se schimba aici.
  const pasi = calculeazaPasi(r, cursuri, parametri, azi).map((pas): PasInPlan => {
    const facut = sePoateBifa(pas.id) && pasiFacuti.includes(pas.id);
    return { ...pas, facut, numar: pas.id === "frauda" ? null : ++numar };
  });

  const curs: StareCurs = !cursulEsteNecesar(r, parametri)
    ? "nu-trebuie"
    : cursuri === null
      ? "lipsa"
      : stareCursuri(cursuri.lunaReferinta, azi);

  return { pasi, ramase: pasi.filter((p) => !p.facut).length, curs };
}

/**
 * Cifrele din raspunsurile omului care au dus la un pas calculat.
 * Doar pentru pasii 4 si 6. Pasul despre o singura banca nu arata nimic legat de
 * plafon, iar cel despre banii peste rezerva nu arata nicio suma: o suma langa
 * "depozit" sau "titlu de stat" ar putea fi citita drept "atat sa puneti".
 */
export function cifrelePasului(pas: Pas, r: Raspunsuri, cursuri: Cursuri | null, parametri: Parametri | null): readonly string[] {
  if (pas.forma !== "calculata" || parametri === null) return [];
  const aproximativ = (lei: number) => `aproximativ ${formateazaSuma(Math.round(lei), "RON")}`;

  if (pas.id === "bani-pentru-urgente") {
    const accesibili = baniAccesibili(r.locuri, cursuri);
    const rezerva = rezervaTinta(r.cheltuieli, parametri.luniRezerva, cursuri);
    if (accesibili.fel === "lipsa" || rezerva.fel === "lipsa") return [];
    return [
      `Bani la îndemână, acasă și în cont: ${aproximativ(accesibili.lei)}.`,
      `Cheltuielile dumneavoastră pe ${parametri.luniRezerva} luni: ${aproximativ(rezerva.lei)}.`,
    ];
  }
  if (pas.id === "bani-in-casa") {
    const acasa = numerarAcasa(r.locuri, cursuri);
    return acasa.fel === "lipsa" ? [] : [`Bani ținuți în casă: ${aproximativ(acasa.lei)}.`];
  }
  return [];
}

/**
 * Ce mai trebuie spus omului la un pas, pe langa textul pasului.
 * Deocamdata doar la pasul despre o singura banca: daca are bani la sucursale ale
 * unor banci din alte state UE, depozitele de acolo nu sunt garantate de FGDB.
 * O banca scrisa de mana ("Alta banca") nu poate fi recunoscuta si nu produce nicio nota.
 */
export function notelePasului(pas: Pas, r: Raspunsuri, banci: readonly BancaDinLista[]): readonly string[] {
  if (pas.id !== "o-singura-banca") return [];
  const nume: string[] = [];
  for (const rand of r.locuri) {
    if ((rand.tip !== "cont" && rand.tip !== "depozit") || rand.banca.fel !== "lista") continue;
    const id = rand.banca.id;
    const banca = banci.find((b) => b.id === id);
    if (banca?.schema === "alt-stat-ue" && !nume.includes(banca.nume)) nume.push(banca.nume);
  }
  const text = textSucursale(nume);
  return text === null ? [] : [text];
}

/** O constatare din blocul "Ce am vazut", pentru un pas anume. */
export type Constatare = { readonly id: IdPas; readonly text: string };

/**
 * Constatarile din capul planului: cate una pentru fiecare pas calculat, fara
 * frauda (care ramane avertizarea de sus), fara pasii in forma generala (care nu
 * au putut fi socotiti, deci nu se afirma nimic despre ei) si fara pasii bifati.
 */
export function constatarile(plan: Plan): readonly Constatare[] {
  return plan.pasi
    .filter((p) => p.id !== "frauda" && p.forma === "calculata" && !p.facut)
    .map((p) => ({ id: p.id, text: CONSTATARI[p.id] }));
}

/** "2026-11-21" -> "21.11.2026". */
export function dataRomaneasca(azi: string): string {
  const [an, luna, zi] = azi.split("-");
  return `${zi}.${luna}.${an}`;
}
