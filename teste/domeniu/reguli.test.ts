import { describe, expect, test } from "vitest";
import { ORDINEA_PASILOR, calculeazaPasi, plafonulEsteVechi } from "../../src/domeniu/reguli";
import type { Pas } from "../../src/domeniu/tipuri";
import { AZI, cursuriTest, parametriTest, situatii } from "../fixturi/situatii";

const scurt = (pas: Pas): string => (pas.forma === "generala" ? `${pas.id}:generala` : pas.id);

describe("tabelul de situatii", () => {
  test.each(situatii.map((s) => [s.nume, s] as const))("%s", (_nume, s) => {
    const cursuri = s.cursuri === undefined ? cursuriTest : s.cursuri;
    const pasi = calculeazaPasi(s.raspunsuri, cursuri, parametriTest, s.azi ?? AZI);
    expect(pasi.map(scurt)).toEqual(s.asteptat);
  });
});

describe("acoperirea tabelului", () => {
  const aparitii = new Set(situatii.flatMap((s) => s.asteptat.map((p) => p.replace(":generala", ""))));

  test.each(ORDINEA_PASILOR.map((id) => [id] as const))("pasul %s este declansat de cel putin o situatie", (id) => {
    expect(aparitii.has(id)).toBe(true);
  });

  test("numele situatiilor sunt unice", () => {
    expect(new Set(situatii.map((s) => s.nume)).size).toBe(situatii.length);
  });
});

describe("plafonulEsteVechi", () => {
  test("in aceeasi zi, dupa un an, este inca valabil", () => {
    expect(plafonulEsteVechi("2026-06-01", "2027-06-01")).toBe(false);
  });
  test("o zi mai tarziu este vechi", () => {
    expect(plafonulEsteVechi("2026-06-01", "2027-06-02")).toBe(true);
  });
  test("verificat pe 29 februarie", () => {
    expect(plafonulEsteVechi("2028-02-29", "2029-02-28")).toBe(false);
    expect(plafonulEsteVechi("2028-02-29", "2029-03-01")).toBe(true);
  });
});
