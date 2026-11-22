// Incadrarea aplicatiei fata de consultanta de investitii reglementata
// (Legea nr. 126/2018, art. 3 alin. (1) pct. 13). Vezi specificatia, sectiunea 9,
// si docs/verificari/2026-11-21-surse-oficiale.md.
//
// Decizia proprietarului din 22.11.2026: construirea continua, proprietarul
// intreaba ASF, iar aplicatia nu ajunge la nimeni pana la raspuns.
//
// Cat timp "lamurita" este false, verificarea de publicare refuza build-ul.
// Se schimba doar de proprietar, cu raspunsul primit notat mai jos.

export type Incadrare = {
  readonly lamurita: boolean;
  /** De la cine este raspunsul si ce spune, pe scurt. */
  readonly raspuns: string | null;
  /** Data raspunsului, AAAA-LL-ZZ. */
  readonly data: string | null;
};

export const INCADRARE_ASF: Incadrare = {
  lamurita: false,
  raspuns: null,
  data: null,
};
