// Cele 10 intrebari ale chestionarului, ca date. Urmeaza sectiunea 4 din specificatie.
//
// Titlurile sunt cele din specificatie. Indiciile de sub titlu si explicatiile
// optiunilor sunt o prima forma si se revad de proprietar la etapa 10.

import type { DaNuPoate, Datorie, Moneda, RamanBani, Raspunsuri, TipRand, FormaAur } from "../domeniu/tipuri";

export type Optiune<V> = { readonly valoare: V; readonly eticheta: string; readonly explicatie?: string };

type Comun = { readonly titlu: string; readonly indiciu?: string };

export type IntrebareSuma = Comun & {
  readonly fel: "suma";
  readonly cheie: "venit" | "cheltuieli";
  /** Monedele din care poate alege omul. O singura moneda inseamna ca nu se alege. */
  readonly monede: readonly Moneda[];
};
export type IntrebareAlegere = Comun & {
  readonly fel: "alegere";
  readonly cheie: "ramanBani";
  readonly optiuni: readonly Optiune<RamanBani>[];
};
export type IntrebareDatorii = Comun & {
  readonly fel: "datorii";
  readonly cheie: "datorii";
  readonly optiuni: readonly Optiune<Datorie>[];
  /** Raspunsul "Nu", care le exclude pe celelalte. */
  readonly niciuna: string;
};
export type IntrebareLocuri = Comun & { readonly fel: "locuri"; readonly cheie: "locuri" };
export type IntrebareCheltuialaMare = Comun & {
  readonly fel: "cheltuiala-mare";
  readonly cheie: "cheltuialaMare";
  readonly optiuni: readonly Optiune<DaNuPoate>[];
  readonly etichetaSuma: string;
};
export type IntrebareDaNu = Comun & {
  readonly fel: "da-nu";
  readonly cheie: "stieCineva" | "contactSuspect" | "girant" | "altaSituatie";
};

export type Intrebare =
  | IntrebareSuma
  | IntrebareAlegere
  | IntrebareDatorii
  | IntrebareLocuri
  | IntrebareCheltuialaMare
  | IntrebareDaNu;

/** Cate o intrebare pentru fiecare raspuns. O intrebare lipsa nu trece de verificarea de tipuri. */
const PE_CHEI: { readonly [K in keyof Raspunsuri]: Intrebare & { readonly cheie: K } } = {
  venit: {
    fel: "suma",
    cheie: "venit",
    titlu: "Câți bani vă intră în fiecare lună?",
    indiciu: "Pensia și orice alt venit care vine lună de lună. Puteți rotunji.",
    monede: ["RON", "EUR", "USD", "GBP"],
  },
  cheltuieli: {
    fel: "suma",
    cheie: "cheltuieli",
    titlu: "Câți bani cheltuiți într-o lună obișnuită?",
    indiciu: "Mâncare, facturi, medicamente și restul, la un loc. Suma în lei. Puteți rotunji.",
    monede: ["RON"],
  },
  ramanBani: {
    fel: "alegere",
    cheie: "ramanBani",
    titlu: "La sfârșitul lunii vă rămân bani?",
    indiciu: "Gândiți-vă la ultimele trei luni.",
    optiuni: [
      { valoare: "da", eticheta: "Da, de obicei" },
      { valoare: "uneori", eticheta: "Uneori" },
      { valoare: "nu-se-termina", eticheta: "Nu, se termină" },
      { valoare: "nu-ajung", eticheta: "Nu îmi ajung" },
    ],
  },
  datorii: {
    fel: "datorii",
    cheie: "datorii",
    titlu: "Aveți rate sau datorii? La cine?",
    indiciu: "Puteți alege mai multe.",
    optiuni: [
      { valoare: "banca", eticheta: "La bancă" },
      { valoare: "ifn", eticheta: "La un IFN", explicatie: "O firmă care dă împrumuturi, dar nu este bancă" },
      { valoare: "card", eticheta: "Pe card", explicatie: "Card de credit sau de cumpărături" },
      { valoare: "persoane", eticheta: "La persoane", explicatie: "Rude, prieteni, vecini" },
    ],
    niciuna: "Nu am datorii",
  },
  locuri: {
    fel: "locuri",
    cheie: "locuri",
    titlu: "Unde aveți bani puși deoparte?",
    indiciu: "Treceți fiecare loc pe rând. Puteți rotunji sumele.",
  },
  cheltuialaMare: {
    fel: "cheltuiala-mare",
    cheie: "cheltuialaMare",
    titlu: "Aveți o cheltuială mare în următorul an?",
    indiciu: "De exemplu o reparație, o operație sau un eveniment în familie.",
    optiuni: [
      { valoare: "da", eticheta: "Da" },
      { valoare: "poate", eticheta: "Poate" },
      { valoare: "nu", eticheta: "Nu" },
    ],
    etichetaSuma: "Cam cât, în lei? Puteți lăsa gol.",
  },
  stieCineva: {
    fel: "da-nu",
    cheie: "stieCineva",
    titlu: "Știe cineva de încredere unde sunt banii dumneavoastră?",
    indiciu: "Cineva care ar ști unde să caute dacă ați avea nevoie de ajutor.",
  },
  contactSuspect: {
    fel: "da-nu",
    cheie: "contactSuspect",
    titlu: "V-a sunat sau v-a scris cineva recent cu o ofertă de câștig sau „de la bancă”?",
    indiciu: "Prin telefon, mesaj sau e-mail.",
  },
  girant: {
    fel: "da-nu",
    cheie: "girant",
    titlu: "Ați girat sau ați împrumutat bani cuiva?",
    indiciu: "A gira înseamnă că v-ați angajat să plătiți dumneavoastră, dacă celălalt nu își plătește împrumutul.",
  },
  altaSituatie: {
    fel: "da-nu",
    cheie: "altaSituatie",
    titlu: "Aveți și altceva: chirii încasate, o moștenire în curs, bani de recuperat, o afacere?",
  },
};

/** Intrebarile, in ordinea in care sunt puse. */
export const INTREBARI: readonly Intrebare[] = Object.values(PE_CHEI);

/** Tipurile de loc de la intrebarea 5, fiecare cu explicatia lui. */
export const TIPURI_DE_LOC: readonly Optiune<TipRand>[] = [
  { valoare: "acasa", eticheta: "Acasă", explicatie: "Bani în numerar, ținuți în casă" },
  { valoare: "cont", eticheta: "Cont", explicatie: "Bani la bancă, pe care îi puteți scoate oricând" },
  { valoare: "depozit", eticheta: "Depozit", explicatie: "Bani la bancă, puși deoparte pe o perioadă stabilită" },
  { valoare: "titluri-de-stat", eticheta: "Titluri de stat", explicatie: "Bani împrumutați statului" },
  { valoare: "aur", eticheta: "Aur", explicatie: "Lingouri, monede sau bijuterii" },
  { valoare: "altceva", eticheta: "Altceva", explicatie: "Alt loc sau alt fel de economii" },
  { valoare: "nu-stiu-sigur", eticheta: "Nu știu sigur", explicatie: "Am bani undeva, dar nu știu ce fel de produs este" },
];

export const FORME_DE_AUR: readonly Optiune<FormaAur>[] = [
  { valoare: "lingouri-monede", eticheta: "Lingouri sau monede" },
  { valoare: "bijuterii", eticheta: "Bijuterii" },
];

export function etichetaTipului(tip: TipRand): string {
  return TIPURI_DE_LOC.find((t) => t.valoare === tip)?.eticheta ?? tip;
}
