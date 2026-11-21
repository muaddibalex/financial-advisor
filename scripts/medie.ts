// Calculul cursului mediu lunar din fisierul anual BNR. Functii pure:
// primesc textul fisierului, nu descarca nimic si nu scriu nimic.

import { XMLParser } from "fast-xml-parser";
import type { Cursuri, Valuta } from "../src/domeniu/tipuri.ts";

export const VALUTE: readonly Valuta[] = ["EUR", "USD", "GBP"];

/**
 * Numarul minim de zile cu curs publicat pentru ca media sa fie acceptata.
 * O luna are in jur de 20 de zile lucratoare; mult mai putine inseamna un
 * fisier trunchiat sau incomplet, iar o medie pe cateva zile ar fi gresita
 * fara ca nimeni sa observe.
 */
export const ZILE_MINIME = 15;

export class EroareCursuri extends Error {
  override name = "EroareCursuri";
}

export type Luna = { readonly an: number; readonly luna: number };

export function formatLuna({ an, luna }: Luna): string {
  return `${String(an).padStart(4, "0")}-${String(luna).padStart(2, "0")}`;
}

/** Luna incheiata, fata de o data AAAA-LL-ZZ. In ianuarie este decembrie din anul precedent. */
export function lunaIncheiata(azi: string): Luna {
  const potrivire = /^(\d{4})-(\d{2})-(\d{2})$/.exec(azi);
  if (!potrivire) throw new EroareCursuri(`Data nu este in forma AAAA-LL-ZZ: "${azi}"`);
  const an = Number(potrivire[1]);
  const luna = Number(potrivire[2]);
  if (luna < 1 || luna > 12) throw new EroareCursuri(`Luna invalida in data "${azi}"`);
  return luna === 1 ? { an: an - 1, luna: 12 } : { an, luna: luna - 1 };
}

/** Adresa fisierului anual BNR pentru anul dat. */
export function adresaFisierAnual(an: number): string {
  return `https://curs.bnr.ro/files/xml/years/nbrfxrates${an}.xml`;
}

type RataXml = { "#text"?: unknown; "@_currency"?: unknown; "@_multiplier"?: unknown };
type ZiXml = { "@_date"?: unknown; Rate?: RataXml[] };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (nume) => nume === "Cube" || nume === "Rate",
});

function zileleDinFisier(xml: string): ZiXml[] {
  let document: unknown;
  try {
    document = parser.parse(xml);
  } catch (eroare) {
    throw new EroareCursuri(`Fisierul BNR nu poate fi citit: ${String(eroare)}`);
  }
  const zile = (document as { DataSet?: { Body?: { Cube?: ZiXml[] } } })?.DataSet?.Body?.Cube;
  if (!Array.isArray(zile) || zile.length === 0) {
    throw new EroareCursuri("Fisierul BNR nu contine nicio zi cu cursuri.");
  }
  return zile;
}

function cursulZilei(zi: ZiXml, valuta: Valuta): number {
  const data = String(zi["@_date"]);
  const rata = (zi.Rate ?? []).find((r) => r["@_currency"] === valuta);
  if (!rata) throw new EroareCursuri(`Lipseste ${valuta} in ziua ${data}.`);

  const curs = Number(rata["#text"]);
  const multiplicator = rata["@_multiplier"] === undefined ? 1 : Number(rata["@_multiplier"]);
  if (!Number.isFinite(curs) || curs <= 0 || !Number.isFinite(multiplicator) || multiplicator <= 0) {
    throw new EroareCursuri(`Curs invalid pentru ${valuta} in ziua ${data}.`);
  }
  // BNR publica unele monede pentru 100 de unitati; cursul pe unitate este curs / multiplicator.
  return curs / multiplicator;
}

/**
 * Media aritmetica a cursurilor zilnice publicate in luna ceruta, pe 4 zecimale.
 * Arunca EroareCursuri daca luna nu are destule zile sau lipseste o moneda.
 */
export function medieLunara(xml: string, luna: Luna): Cursuri["leiPe"] {
  const prefix = `${formatLuna(luna)}-`;
  const zile = zileleDinFisier(xml).filter((zi) => String(zi["@_date"]).startsWith(prefix));

  if (zile.length === 0) {
    throw new EroareCursuri(`Fisierul BNR nu contine nicio zi din luna ${formatLuna(luna)}.`);
  }
  if (zile.length < ZILE_MINIME) {
    throw new EroareCursuri(
      `Luna ${formatLuna(luna)} are doar ${zile.length} zile cu curs publicat; minimul acceptat este ${ZILE_MINIME}.`,
    );
  }

  const medie = (valuta: Valuta): number => {
    const total = zile.reduce((suma, zi) => suma + cursulZilei(zi, valuta), 0);
    return Math.round((total / zile.length) * 10000) / 10000;
  };
  return { EUR: medie("EUR"), USD: medie("USD"), GBP: medie("GBP") };
}

/** Construieste continutul fisierului de cursuri pentru luna incheiata fata de data de azi. */
export function construiesteCursuri(xml: string, azi: string): Cursuri {
  const luna = lunaIncheiata(azi);
  return { lunaReferinta: formatLuna(luna), generatLa: azi, leiPe: medieLunara(xml, luna) };
}

/** Doua fisiere de cursuri spun acelasi lucru daca au aceeasi luna si aceleasi medii. */
export function aceleasiCursuri(a: Cursuri, b: Cursuri): boolean {
  return a.lunaReferinta === b.lunaReferinta && VALUTE.every((v) => a.leiPe[v] === b.leiPe[v]);
}
