// Tipurile domeniului. Urmeaza sectiunile 4 si 5 din specificatie.

export type Moneda = "RON" | "EUR" | "USD" | "GBP";
export type Valuta = Exclude<Moneda, "RON">;

/** Omul a ales "Prefer sa nu spun". Nu este zero si nu se poate aduna. */
export type Lipsa = { readonly fel: "lipsa" };
export const LIPSA: Lipsa = { fel: "lipsa" };

/** O suma introdusa de om, in moneda ei, sau refuzul de a o spune. */
export type Suma = { readonly fel: "suma"; readonly valoare: number; readonly moneda: Moneda } | Lipsa;

/** Rezultatul unui calcul in lei: o valoare, sau lipsa cand nu se poate calcula. */
export type Calcul = { readonly fel: "valoare"; readonly lei: number } | Lipsa;

export type Banca =
  | { readonly fel: "lista"; readonly id: string }
  | { readonly fel: "alta"; readonly nume: string };

export type FormaAur = "lingouri-monede" | "bijuterii";

/** Un rand din lista "Unde aveti bani pusi deoparte?" (intrebarea 5). */
export type Rand =
  | { readonly tip: "acasa"; readonly suma: Suma }
  | { readonly tip: "cont" | "depozit"; readonly suma: Suma; readonly banca: Banca }
  | { readonly tip: "titluri-de-stat"; readonly suma: Suma }
  | { readonly tip: "aur"; readonly forma: FormaAur; readonly grame: number | null }
  | { readonly tip: "altceva" | "nu-stiu-sigur"; readonly suma: Suma };

export type TipRand = Rand["tip"];

export type RamanBani = "da" | "uneori" | "nu-se-termina" | "nu-ajung";
export type Datorie = "banca" | "ifn" | "card" | "persoane";
export type DaNuPoate = "da" | "nu" | "poate";

/** Raspunsurile la cele 10 intrebari, in ordinea din specificatie. */
export type Raspunsuri = {
  /** 1. Cati bani va intra in fiecare luna? */
  readonly venit: Suma;
  /** 2. Cati bani cheltuiti intr-o luna obisnuita? In lei. */
  readonly cheltuieli: Suma;
  /** 3. La sfarsitul lunii va raman bani? */
  readonly ramanBani: RamanBani;
  /** 4. Aveti rate sau datorii? Lista goala inseamna "Nu". */
  readonly datorii: readonly Datorie[];
  /** 5. Unde aveti bani pusi deoparte? */
  readonly locuri: readonly Rand[];
  /** 6. Aveti o cheltuiala mare in urmatorul an? Suma este optionala, in lei. */
  readonly cheltuialaMare: { readonly raspuns: DaNuPoate; readonly suma: Suma };
  /** 7. Stie cineva de incredere unde sunt banii dumneavoastra? */
  readonly stieCineva: boolean;
  /** 8. V-a sunat sau v-a scris cineva recent cu o oferta? */
  readonly contactSuspect: boolean;
  /** 9. Ati girat sau ati imprumutat bani cuiva? */
  readonly girant: boolean;
  /** 10. Aveti si altceva: chirii, mostenire in curs, bani de recuperat, afacere? */
  readonly altaSituatie: boolean;
};

/** Cursurile medii BNR ale unei luni, in lei pentru o unitate de valuta. */
export type Cursuri = {
  /** Luna de referinta, in forma AAAA-LL. */
  readonly lunaReferinta: string;
  /** Data la care a fost generat fisierul, in forma AAAA-LL-ZZ. */
  readonly generatLa: string;
  readonly leiPe: Readonly<Record<Valuta, number>>;
};

/** Parametrii de continut. Sunt decizii ale proprietarului, nu ale aplicatiei. */
export type Parametri = {
  readonly luniRezerva: number;
  readonly pragNumerarAcasaLei: number;
  readonly plafonGarantareEur: number;
  readonly marjaPlafonEur: number;
  /** Data la care plafonul a fost verificat din sursa oficiala, AAAA-LL-ZZ. */
  readonly plafonVerificatLa: string;
};

export type IdPas =
  | "frauda"
  | "luna-nu-se-inchide"
  | "datorii-scumpe"
  | "bani-pentru-urgente"
  | "cheltuiala-apropiata"
  | "bani-in-casa"
  | "o-singura-banca"
  | "bani-peste-rezerva"
  | "alta-moneda"
  | "aur"
  | "produse-neintelese"
  | "ordine-in-acte"
  | "girant"
  | "situatie-neacoperita";

/** Un pas din plan. Forma generala apare cand pasul nu a putut fi calculat. */
export type Pas = { readonly id: IdPas; readonly forma: "calculata" | "generala" };
