// Lista bancilor din care alege omul la intrebarea 5.
//
// CIORNA: lista de mai jos NU este reala. Lista bancilor participante la
// schema de garantare se ia din sursa oficiala (FGDB) la etapa 10, cu sursa si
// data verificarii. Pana atunci aplicatia nu poate fi publicata.

export type BancaDinLista = { readonly id: string; readonly nume: string };

export type ListaBanci = {
  /** true cat timp lista nu a fost verificata din sursa oficiala. */
  readonly ciorna: boolean;
  readonly sursa: string | null;
  readonly verificatLa: string | null;
  readonly banci: readonly BancaDinLista[];
};

export const BANCI: ListaBanci = {
  ciorna: true,
  sursa: null,
  verificatLa: null,
  banci: [
    { id: "exemplu-a", nume: "Banca A (exemplu)" },
    { id: "exemplu-b", nume: "Banca B (exemplu)" },
  ],
};
