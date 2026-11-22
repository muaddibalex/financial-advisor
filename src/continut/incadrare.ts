// Incadrarea aplicatiei fata de consultanta de investitii reglementata
// (Legea nr. 126/2018, art. 3 alin. (1) pct. 13). Vezi specificatia, sectiunea 9,
// si docs/verificari/2026-11-21-surse-oficiale.md.
//
// Istoric:
//  - 22.11.2026: proprietarul hotaraste sa intrebe ASF; publicarea este oprita.
//  - 22.11.2026, mai tarziu: proprietarul hotaraste ca raspunsul ASF nu este
//    necesar, fiindca aplicatia este folosita de 2-3 persoane apropiate, gratuit.
//
// Aceasta NU este o concluzie juridica si nu vine de la ASF. Este decizia
// proprietarului, luata pe raspunderea lui, si se sprijina pe o conditie:
// aplicatia ramane pentru cateva persoane apropiate. Daca aplicatia ajunge la
// un public mai larg, incadrarea trebuie lamurita din nou, iar valoarea de mai
// jos se pune inapoi pe false.
//
// Cat timp "lamurita" este false, verificarea de publicare refuza continutul.

export type Incadrare = {
  readonly lamurita: boolean;
  /** Cine a hotarat si pe ce temei, pe scurt. */
  readonly raspuns: string | null;
  /** Data hotararii sau a raspunsului, AAAA-LL-ZZ. */
  readonly data: string | null;
};

export const INCADRARE_ASF: Incadrare = {
  lamurita: true,
  raspuns:
    "Decizia proprietarului, nu un raspuns al ASF: aplicatia este folosita gratuit de 2-3 persoane apropiate. Valabila doar cat timp ramane asa.",
  data: "2026-11-22",
};
