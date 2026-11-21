// Jobul lunar: descarca fisierul anual BNR, calculeaza cursul mediu al lunii
// incheiate si scrie public/cursuri.json.
//
// Folosire:  node scripts/cursuri-lunare.ts [AAAA-LL-ZZ]
// Fara argument foloseste data de azi. La orice eroare se opreste cu cod
// diferit de zero si NU atinge fisierul existent.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Cursuri } from "../src/domeniu/tipuri.ts";
import { aceleasiCursuri, adresaFisierAnual, construiesteCursuri, EroareCursuri, lunaIncheiata } from "./medie.ts";

const DESTINATIE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "cursuri.json");

function dataDeAzi(): string {
  // Data calendaristica din Romania, nu cea UTC a serverului pe care ruleaza jobul.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest" }).format(new Date());
}

async function descarca(adresa: string): Promise<string> {
  const raspuns = await fetch(adresa, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "error" });
  if (!raspuns.ok) throw new EroareCursuri(`BNR a raspuns cu ${raspuns.status} pentru ${adresa}`);
  return raspuns.text();
}

function citesteExistent(): Cursuri | null {
  if (!existsSync(DESTINATIE)) return null;
  try {
    return JSON.parse(readFileSync(DESTINATIE, "utf8")) as Cursuri;
  } catch {
    return null;
  }
}

async function ruleaza(): Promise<void> {
  const azi = process.argv[2] ?? dataDeAzi();
  const luna = lunaIncheiata(azi);
  const adresa = adresaFisierAnual(luna.an);

  console.log(`Data: ${azi}. Sursa: ${adresa}`);
  const cursuri = construiesteCursuri(await descarca(adresa), azi);

  const existent = citesteExistent();
  if (existent && aceleasiCursuri(existent, cursuri)) {
    console.log(`Cursurile pentru ${cursuri.lunaReferinta} sunt deja la zi. Fisierul nu a fost modificat.`);
    return;
  }

  mkdirSync(dirname(DESTINATIE), { recursive: true });
  writeFileSync(DESTINATIE, `${JSON.stringify(cursuri, null, 2)}\n`, "utf8");
  console.log(`Scris ${DESTINATIE}:`, cursuri);
}

ruleaza().catch((eroare: unknown) => {
  console.error(eroare instanceof Error ? `${eroare.name}: ${eroare.message}` : eroare);
  process.exitCode = 1;
});
