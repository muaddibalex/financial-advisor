import { describe, expect, test } from "vitest";
import { formateazaNumar, formateazaSuma, interpreteazaSuma } from "../../src/chestionar/suma";

describe("interpreteazaSuma", () => {
  test.each([
    ["20000", 20000],
    ["20.000", 20000],
    ["20 000", 20000],
    ["20000,50", 20000.5],
    ["20.000,50", 20000.5],
    ["1.234.567", 1234567],
    ["1 234,56", 1234.56],
    ["1,5", 1.5],
    ["0", 0],
    ["0,5", 0.5],
    ["  2500  ", 2500],
    ["20 000", 20000],
    ["20 000", 20000],
    ["007", 7],
  ])("%s -> %s", (text, asteptat) => {
    expect(interpreteazaSuma(text)).toEqual({ fel: "valoare", valoare: asteptat });
  });

  test.each([
    ["20,000", "neclar"],
    ["20.5", "neclar"],
    ["20.50", "neclar"],
    ["20.0000", "neclar"],
    ["1,234.56", "neclar"],
    ["1,2,3", "neclar"],
    ["20,", "neclar"],
    [",50", "neclar"],
    [".5", "neclar"],
    ["0.500", "neclar"],
    ["20..000", "neclar"],
    ["-5", "negativ"],
    ["−5", "negativ"],
    ["- 5", "negativ"],
    ["1e5", "caractere"],
    ["20000 lei", "caractere"],
    ["doua mii", "caractere"],
    ["+5", "caractere"],
    ["1234567890123", "prea-mare"],
  ])("%s este refuzat (%s)", (text, motiv) => {
    expect(interpreteazaSuma(text)).toEqual({ fel: "eroare", motiv });
  });

  test.each([[""], ["   "], [" "]])("nimic scris (%j) nu este zero", (text) => {
    expect(interpreteazaSuma(text)).toEqual({ fel: "gol" });
  });
});

describe("afisarea sumelor", () => {
  test.each([
    [0, "0"],
    [7, "7"],
    [999, "999"],
    [1000, "1.000"],
    [20000, "20.000"],
    [1234567, "1.234.567"],
    [20000.5, "20.000,50"],
    [0.5, "0,50"],
  ])("%s -> %s", (valoare, asteptat) => {
    expect(formateazaNumar(valoare)).toBe(asteptat);
  });

  test("cu moneda", () => {
    expect(formateazaSuma(8500, "EUR")).toBe("8.500 euro");
    expect(formateazaSuma(42000, "RON")).toBe("42.000 lei");
  });

  test.each([0, 7, 1000, 20000.5, 1234567.89, 0.05])("ce se afiseaza se citeste inapoi la fel: %s", (valoare) => {
    expect(interpreteazaSuma(formateazaNumar(valoare))).toEqual({ fel: "valoare", valoare });
  });
});
