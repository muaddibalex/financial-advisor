// Interpretarea unei sume scrise de om si afisarea ei inapoi.
//
// Regula de baza: aplicatia nu ghiceste. O scriere care poate insemna doua
// sume diferite ("20,000", "20.5") este refuzata, cu un exemplu de scriere
// corecta. O citire gresita de 1000 de ori ar strica intregul plan.
//
// Conventia este cea romaneasca: punctul desparte miile, virgula desparte banii.

import type { Moneda } from "../domeniu/tipuri";

export type MotivEroare = "negativ" | "caractere" | "neclar" | "prea-mare";

export type RezultatSuma =
  | { readonly fel: "valoare"; readonly valoare: number }
  /** Nu s-a scris nimic. Nu este zero si nu este "Prefer sa nu spun". */
  | { readonly fel: "gol" }
  | { readonly fel: "eroare"; readonly motiv: MotivEroare };

const CIFRE_MAXIME = 12;

export function interpreteazaSuma(text: string): RezultatSuma {
  // \s cuprinde si spatiile nedespartitoare (U+00A0, U+202F), folosite uneori intre mii.
  const t = text.replace(/\s/g, "");
  if (t === "") return { fel: "gol" };
  if (/^[-−–—]/.test(t)) return { fel: "eroare", motiv: "negativ" };
  if (!/^[\d.,]+$/.test(t)) return { fel: "eroare", motiv: "caractere" };

  const parti = t.split(",");
  const intreg = parti[0] ?? "";
  const bani = parti[1];
  if (parti.length > 2) return { fel: "eroare", motiv: "neclar" };
  // Dupa virgula: una sau doua cifre. "20,000" poate fi douazeci sau douazeci de mii.
  if (bani !== undefined && !/^\d{1,2}$/.test(bani)) return { fel: "eroare", motiv: "neclar" };
  // Inainte de virgula: doar cifre, sau grupuri de cate trei despartite prin punct.
  const faraPuncte = /^\d+$/.test(intreg);
  const cuPuncte = /^[1-9]\d{0,2}(\.\d{3})+$/.test(intreg);
  if (!faraPuncte && !cuPuncte) return { fel: "eroare", motiv: "neclar" };

  const cifre = intreg.replace(/\./g, "");
  if (cifre.length > CIFRE_MAXIME) return { fel: "eroare", motiv: "prea-mare" };
  return { fel: "valoare", valoare: Number(`${cifre}.${bani ?? "0"}`) };
}

export const MESAJ_EROARE: Readonly<Record<MotivEroare | "gol", string>> = {
  gol: "Scrieți suma sau apăsați „Prefer să nu spun”.",
  negativ: "Suma nu poate fi cu minus.",
  caractere: "Scrieți doar cifre, de exemplu 2500.",
  neclar: "Nu am înțeles suma. Scrieți-o fără puncte, de exemplu 20000 sau 20000,50.",
  "prea-mare": "Suma este prea mare. Verificați cifrele.",
};

export const NUME_MONEDA: Readonly<Record<Moneda, string>> = {
  RON: "lei",
  EUR: "euro",
  USD: "dolari",
  GBP: "lire",
};

/** Scrie un numar in felul romanesc: 20.000 sau 20.000,50. */
export function formateazaNumar(valoare: number): string {
  const rotunjit = Math.round(valoare * 100) / 100;
  const [intreg = "0", bani] = rotunjit.toFixed(2).split(".");
  const cuPuncte = intreg.replace(/\B(?=(\d{3})+$)/g, ".");
  return bani === undefined || bani === "00" ? cuPuncte : `${cuPuncte},${bani}`;
}

export function formateazaSuma(valoare: number, moneda: Moneda): string {
  return `${formateazaNumar(valoare)} ${NUME_MONEDA[moneda]}`;
}
