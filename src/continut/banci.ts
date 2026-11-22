// Lista bancilor din care alege omul la intrebarea 5.
//
// Sursa: FGDB, pagina "Unde garantam", https://fgdb.ro/unde-garantam/, citita la
// 22.11.2026 dintr-un PDF salvat de proprietar (vezi docs/verificari).
//
// CIORNA: lista este INCOMPLETA. In PDF, randuri au ramas ascunse la trecerea
// dintre pagini (intre Exim Banca Romaneasca si Patria Bank, si intre ING Bank
// si TBI Bank). Bancile lipsa nu se completeaza din memorie. Pana atunci, omul
// le poate scrie la "Alta banca".
//
// Bancile sunt de doua feluri (pagina FGDB):
//  - persoane juridice romane: participa la FGDB;
//  - sucursale ale bancilor din alte state UE: depozitele sunt garantate de
//    schema din tara de origine, nu de FGDB.

/** De cine sunt garantate depozitele de la o banca. */
export type SchemaDeGarantare = "fgdb" | "alt-stat-ue";

export type BancaDinLista = { readonly id: string; readonly nume: string; readonly schema: SchemaDeGarantare };

export type ListaBanci = {
  /** true cat timp lista nu este completa si verificata din sursa oficiala. */
  readonly ciorna: boolean;
  readonly sursa: string | null;
  /** Data verificarii, AAAA-LL-ZZ. Dupa 12 luni, verificarea de publicare refuza lista. */
  readonly verificatLa: string | null;
  readonly banci: readonly BancaDinLista[];
};

const fgdb = (id: string, nume: string): BancaDinLista => ({ id, nume, schema: "fgdb" });
const altStat = (id: string, nume: string): BancaDinLista => ({ id, nume, schema: "alt-stat-ue" });

export const BANCI: ListaBanci = {
  ciorna: true,
  sursa: "FGDB, pagina „Unde garantăm”",
  verificatLa: "2026-11-22",
  banci: [
    fgdb("bcr", "Banca Comercială Română"),
    fgdb("bcr-banca-pentru-locuinte", "BCR Banca pentru Locuințe"),
    fgdb("intesa-sanpaolo", "Banca Comercială Intesa Sanpaolo România"),
    fgdb("brci", "Banca Română de Credite și Investiții"),
    fgdb("banca-transilvania", "Banca Transilvania"),
    fgdb("brd", "BRD – Groupe Société Générale"),
    fgdb("cec-bank", "CEC Bank"),
    fgdb("exim-banca-romaneasca", "Exim Banca Românească"),
    fgdb("patria-bank", "Patria Bank"),
    fgdb("credex-bank", "Credex Bank (fostă Porsche Bank România)"),
    fgdb("procredit-bank", "ProCredit Bank"),
    fgdb("raiffeisen-bank", "Raiffeisen Bank"),
    fgdb("salt-bank", "Salt Bank (fostă Idea Bank)"),
    fgdb("techventures-bank", "TechVentures Bank"),
    fgdb("unicredit-bank", "UniCredit Bank"),
    fgdb("vista-bank", "Vista Bank"),
    fgdb("creditcoop", "Banca Centrală Cooperatistă Creditcoop"),
    altStat("ing-bank", "ING Bank"),
    altStat("tbi-bank", "TBI Bank"),
    altStat("bnp-paribas-personal-finance", "BNP Paribas Personal Finance"),
    altStat("bnp-paribas", "BNP Paribas"),
    altStat("bank-of-china", "Bank of China"),
    altStat("pko-bank-polski", "PKO Bank Polski"),
    altStat("revolut-bank", "Revolut Bank"),
    altStat("nexent-bank", "Nexent Bank (fostă Credit Europe Bank)"),
  ],
};

/** Bancile in ordine alfabetica, cum le vede omul in lista. */
export function banciInOrdine(banci: readonly BancaDinLista[]): readonly BancaDinLista[] {
  return [...banci].sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
}

/**
 * Ce i se spune omului care are bani la sucursale ale unor banci din alte state UE.
 * CIORNA: text de aprobat de proprietar, odata cu textele pasilor.
 */
export function textSucursale(nume: readonly string[]): string | null {
  if (nume.length === 0) return null;
  const inceput =
    nume.length === 1
      ? `${nume[0]} este sucursala unei bănci din alt stat al Uniunii Europene.`
      : `${nume.slice(0, -1).join(", ")} și ${nume.at(-1)} sunt sucursale ale unor bănci din alte state ale Uniunii Europene.`;
  return `${inceput} Depozitele de acolo sunt garantate de schema din țara de origine, nu de FGDB. Întrebați banca ce schemă vă garantează banii și până la ce sumă.`;
}
