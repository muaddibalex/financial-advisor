import { describe, expect, test } from "vitest";
import { stareCursuri } from "../../src/cursuri/vechime";

describe("stareCursuri", () => {
  // [luna de referinta, data de azi, starea asteptata, explicatie]
  const cazuri = [
    ["2026-10", "2026-11-21", "proaspat", "media lunii precedente"],
    ["2026-10", "2026-11-01", "proaspat", "media lunii precedente, in prima zi"],
    ["2026-10", "2026-11-30", "proaspat", "media lunii precedente, in ultima zi"],
    ["2026-09", "2026-11-01", "proaspat", "cu o luna in urma, inainte ca jobul sa ruleze"],
    ["2026-09", "2026-11-10", "proaspat", "cu o luna in urma, in ziua 10"],
    ["2026-09", "2026-11-11", "vechi", "cu o luna in urma, in ziua 11"],
    ["2026-08", "2026-11-01", "vechi", "cu doua luni in urma, chiar in prima zi"],
    ["2025-10", "2026-11-05", "vechi", "de acum un an"],
    ["2026-12", "2027-01-15", "proaspat", "ianuarie: media lui decembrie"],
    ["2026-11", "2027-01-10", "proaspat", "ianuarie: media lui noiembrie, in ziua 10"],
    ["2026-11", "2027-01-11", "vechi", "ianuarie: media lui noiembrie, in ziua 11"],
    ["2026-12", "2027-02-10", "proaspat", "februarie: media lui decembrie, in ziua 10"],
    ["2026-12", "2027-02-11", "vechi", "februarie: media lui decembrie, in ziua 11"],
    ["2026-11", "2026-11-21", "proaspat", "o luna de referinta neasteptat de noua nu este veche"],
  ] as const;

  test.each(cazuri)("media din %s, azi %s -> %s (%s)", (lunaReferinta, azi, asteptat) => {
    expect(stareCursuri(lunaReferinta, azi)).toBe(asteptat);
  });

  test("o luna sau o data care nu pot fi citite sunt socotite vechi", () => {
    expect(stareCursuri("octombrie", "2026-11-21")).toBe("vechi");
    expect(stareCursuri("2026-10", "21.11.2026")).toBe("vechi");
  });
});
