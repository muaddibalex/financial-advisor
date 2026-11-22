// Verificarea continutului inainte de publicare. Functie pura: primeste
// continutul si data de azi, intoarce lista de probleme. Lista goala inseamna
// ca nimic din regulile de mai jos nu opreste publicarea.
//
// Verificarea prinde doar ce se poate verifica mecanic. Nu inlocuieste citirea
// textelor de catre proprietar.

import { plafonulEsteVechi } from "../domeniu/reguli";
import type { IdPas, Parametri } from "../domeniu/tipuri";
import type { ListaBanci } from "./banci";
import type { Incadrare } from "./incadrare";
import type { ContinutPas } from "./pasi";

/** Cine a decis parametrii si de unde vine plafonul. */
export type ProvenientaParametri = {
  readonly decisDe: string;
  /** AAAA-LL-ZZ. */
  readonly decisLa: string;
  readonly sursaPlafon: string;
};

export type Continut = {
  readonly pasi: Readonly<Record<IdPas, ContinutPas>>;
  readonly banci: ListaBanci;
  readonly parametri: Parametri | null;
  readonly provenienta: ProvenientaParametri | null;
  readonly incadrare: Incadrare;
};

/** Pasii in care o formulare de recomandare ar fi cea mai grava: produse si valuta. */
export const PASI_FARA_RECOMANDARI: readonly IdPas[] = ["bani-peste-rezerva", "alta-moneda"];

/** Scrise fara diacritice; textele sunt comparate tot fara diacritice. */
export const FORMULARI_INTERZISE: readonly string[] = ["va recomandam", "cel mai bun", "alegeti", "cumparati", "schimbati"];

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const esteData = (v: string | null): v is string => v !== null && DATA.test(v);
const areText = (v: string | null | undefined): v is string => typeof v === "string" && v.trim() !== "";

export function faraDiacritice(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function textelePasului(p: ContinutPas): string {
  return [p.titlu, p.peScurt, p.deCe, ...p.cePutetiFace, p.link?.eticheta ?? "", p.link?.ceSaCautati ?? ""].join("\n");
}

export function valideazaContinut(c: Continut, azi: string): readonly string[] {
  const probleme: string[] = [];

  if (!c.incadrare.lamurita) {
    probleme.push("incadrarea fata de consultanta de investitii (ASF) nu este lamurita");
  } else if (!areText(c.incadrare.raspuns) || !esteData(c.incadrare.data)) {
    probleme.push("incadrarea ASF este marcata ca lamurita, dar lipseste raspunsul sau data lui");
  }

  if (c.parametri === null) {
    probleme.push("parametrii proprietarului lipsesc (rezerva, pragul pentru banii din casa, marja, plafonul)");
  } else {
    const p = c.parametri;
    const numere: readonly (readonly [string, number])[] = [
      ["rezerva in luni", p.luniRezerva],
      ["pragul pentru banii din casa", p.pragNumerarAcasaLei],
      ["plafonul de garantare", p.plafonGarantareEur],
    ];
    for (const [nume, valoare] of numere) {
      if (!Number.isFinite(valoare) || valoare <= 0) probleme.push(`parametru: ${nume} trebuie sa fie un numar mai mare decat zero`);
    }
    if (!Number.isFinite(p.marjaPlafonEur) || p.marjaPlafonEur < 0 || p.marjaPlafonEur >= p.plafonGarantareEur) {
      probleme.push("parametru: marja trebuie sa fie intre zero si plafon");
    }
    if (!esteData(p.plafonVerificatLa)) probleme.push("parametru: plafonul nu are data verificarii");
    else if (p.plafonVerificatLa > azi) probleme.push("parametru: data verificarii plafonului este in viitor");
    else if (plafonulEsteVechi(p.plafonVerificatLa, azi)) probleme.push("parametru: plafonul a fost verificat acum mai mult de 12 luni");

    if (c.provenienta === null) {
      probleme.push("parametrii nu au nota despre cine i-a decis si cand");
    } else {
      if (!areText(c.provenienta.decisDe) || !esteData(c.provenienta.decisLa)) probleme.push("nota parametrilor: lipseste cine a decis sau data");
      if (!areText(c.provenienta.sursaPlafon)) probleme.push("nota parametrilor: lipseste sursa oficiala a plafonului");
    }
  }

  if (c.banci.ciorna) probleme.push("lista bancilor este marcata CIORNA");
  if (!areText(c.banci.sursa) || !esteData(c.banci.verificatLa)) probleme.push("lista bancilor nu are sursa sau data verificarii");
  if (c.banci.banci.length === 0) probleme.push("lista bancilor este goala");
  if (esteData(c.banci.verificatLa)) {
    if (c.banci.verificatLa > azi) probleme.push("lista bancilor: data verificarii este in viitor");
    // O banca poate trece dintr-o grupa in alta sau isi poate schimba numele.
    else if (plafonulEsteVechi(c.banci.verificatLa, azi)) probleme.push("lista bancilor a fost verificata acum mai mult de 12 luni");
  }
  const iduri = new Set<string>();
  for (const banca of c.banci.banci) {
    if (!areText(banca.id) || !areText(banca.nume)) probleme.push("lista bancilor: o banca nu are id sau nume");
    if (iduri.has(banca.id)) probleme.push(`lista bancilor: id-ul ${banca.id} apare de doua ori`);
    iduri.add(banca.id);
    if (banca.schema !== "fgdb" && banca.schema !== "alt-stat-ue") probleme.push(`lista bancilor: ${banca.id} nu are schema de garantare`);
  }

  for (const [id, pas] of Object.entries(c.pasi) as [IdPas, ContinutPas][]) {
    if (pas.ciorna) probleme.push(`pasul ${id}: text marcat CIORNA`);
    const faraLink = pas.faraLink !== undefined;
    if (faraLink && !areText(pas.faraLink)) probleme.push(`pasul ${id}: motivul pentru lipsa linkului este gol`);
    if (faraLink && pas.link !== null) probleme.push(`pasul ${id}: are si link, si motiv pentru lipsa linkului`);

    // Un pas cu link are mereu sursa si data. Un pas fara link poate fi un sfat
    // general, fara sursa; daca are totusi o sursa, are si data verificarii.
    const areSursa = areText(pas.sursa);
    if (!faraLink && (!areSursa || !esteData(pas.verificatLa))) probleme.push(`pasul ${id}: lipseste sursa sau data verificarii`);
    if (faraLink && areSursa && !esteData(pas.verificatLa)) probleme.push(`pasul ${id}: sursa nu are data verificarii`);

    if (pas.link === null) {
      if (!faraLink) probleme.push(`pasul ${id}: lipseste linkul oficial`);
    } else {
      if (!pas.link.adresa.startsWith("https://")) probleme.push(`pasul ${id}: linkul nu incepe cu https://`);
      if (!areText(pas.link.eticheta) || !areText(pas.link.ceSaCautati)) probleme.push(`pasul ${id}: linkul nu spune ce sa cautati pe pagina`);
    }
    if (PASI_FARA_RECOMANDARI.includes(id)) {
      const text = faraDiacritice(textelePasului(pas));
      for (const formulare of FORMULARI_INTERZISE) {
        if (text.includes(formulare)) probleme.push(`pasul ${id}: formulare de recomandare interzisa: "${formulare}"`);
      }
    }
  }

  return probleme;
}
