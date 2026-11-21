import { beforeEach, describe, expect, test } from "vitest";
import { PREFIX, VERSIUNE, creeazaStocare, depozitInMemorie, depozitulBrowserului, type Depozit } from "../../src/stocare/stocare";
import { STARE_GOALA, esteComplet, valideazaStare, type StareSalvata } from "../../src/stocare/validare";
import { baza, cursuriTest } from "../fixturi/situatii";

const stare: StareSalvata = { raspunsuri: baza, pasiFacuti: ["ordine-in-acte"] };
const CHEIE = `${PREFIX}stare`;

/** Un depozit care refuza orice scriere, ca un browser cu stocarea plina. */
function depozitPlin(): Depozit {
  return {
    ...depozitInMemorie(),
    setItem() {
      throw new DOMException("QuotaExceededError");
    },
  };
}

describe("citirea starii", () => {
  let depozit: Depozit;
  beforeEach(() => {
    depozit = depozitInMemorie();
  });

  test("date lipsa", () => {
    expect(creeazaStocare(depozit).citeste()).toEqual({ fel: "lipsa" });
  });

  test("date valide: ce s-a salvat se citeste inapoi la fel", () => {
    const stocare = creeazaStocare(depozit);
    expect(stocare.salveaza(stare)).toBe(true);
    expect(stocare.citeste()).toEqual({ fel: "valida", stare });
  });

  test("chestionar neterminat: raspunsurile partiale sunt valide", () => {
    const partiala: StareSalvata = { raspunsuri: { venit: baza.venit, ramanBani: "uneori" }, pasiFacuti: [] };
    const stocare = creeazaStocare(depozit);
    stocare.salveaza(partiala);
    expect(stocare.citeste()).toEqual({ fel: "valida", stare: partiala });
  });

  test("versiune veche", () => {
    depozit.setItem(CHEIE, JSON.stringify({ versiune: VERSIUNE - 1, stare }));
    expect(creeazaStocare(depozit).citeste()).toEqual({ fel: "versiune-veche" });
  });

  test("versiune mai noua decat aplicatia este tratata la fel", () => {
    depozit.setItem(CHEIE, JSON.stringify({ versiune: VERSIUNE + 1, stare }));
    expect(creeazaStocare(depozit).citeste()).toEqual({ fel: "versiune-veche" });
  });

  test.each([
    ["text care nu este JSON", "{raspunsuri"],
    ["fara versiune", JSON.stringify({ stare })],
    ["versiune care nu este numar", JSON.stringify({ versiune: "1", stare })],
    ["fara stare", JSON.stringify({ versiune: VERSIUNE })],
    ["null", "null"],
    ["raspuns necunoscut", JSON.stringify({ versiune: VERSIUNE, stare: { raspunsuri: { parola: "x" }, pasiFacuti: [] } })],
    ["suma negativa", JSON.stringify({ versiune: VERSIUNE, stare: { raspunsuri: { venit: { fel: "suma", valoare: -1, moneda: "RON" } }, pasiFacuti: [] } })],
    ["moneda necunoscuta", JSON.stringify({ versiune: VERSIUNE, stare: { raspunsuri: { venit: { fel: "suma", valoare: 1, moneda: "CHF" } }, pasiFacuti: [] } })],
    ["cont fara banca", JSON.stringify({ versiune: VERSIUNE, stare: { raspunsuri: { locuri: [{ tip: "cont", suma: { fel: "lipsa" } }] }, pasiFacuti: [] } })],
    ["pas necunoscut", JSON.stringify({ versiune: VERSIUNE, stare: { raspunsuri: {}, pasiFacuti: ["cumpara-actiuni"] } })],
  ])("date stricate: %s", (_nume, continut) => {
    depozit.setItem(CHEIE, continut);
    expect(creeazaStocare(depozit).citeste()).toEqual({ fel: "stricata" });
  });
});

describe("stergerea completa", () => {
  test("nu ramane nicio cheie a aplicatiei, iar cheile altora raman", () => {
    const depozit = depozitInMemorie();
    depozit.setItem("alta-aplicatie", "neatins");
    const stocare = creeazaStocare(depozit);
    stocare.salveaza(stare);
    stocare.cursuri.scrie(cursuriTest);
    expect(depozit.length).toBe(3);

    stocare.stergeTot();

    expect(depozit.length).toBe(1);
    expect(depozit.getItem("alta-aplicatie")).toBe("neatins");
    expect(stocare.citeste()).toEqual({ fel: "lipsa" });
    expect(stocare.cursuri.citeste()).toBeNull();
  });
});

describe("copia cursurilor", () => {
  test("se citeste inapoi ce s-a scris", () => {
    const stocare = creeazaStocare(depozitInMemorie());
    expect(stocare.cursuri.citeste()).toBeNull();
    stocare.cursuri.scrie(cursuriTest);
    expect(stocare.cursuri.citeste()).toEqual(cursuriTest);
  });

  test("o copie care nu este JSON este tratata ca lipsa", () => {
    const depozit = depozitInMemorie();
    depozit.setItem(`${PREFIX}cursuri`, "<html>");
    expect(creeazaStocare(depozit).cursuri.citeste()).toBeNull();
  });
});

describe("stocare indisponibila", () => {
  test("fara stocare in browser, datele tin cat sesiunea si aplicatia stie asta", () => {
    const stocare = creeazaStocare(null);
    expect(stocare.persistenta).toBe(false);
    expect(stocare.salveaza(stare)).toBe(true);
    expect(stocare.citeste()).toEqual({ fel: "valida", stare });
  });

  test("o salvare refuzata de browser intoarce false, fara eroare", () => {
    const stocare = creeazaStocare(depozitPlin());
    expect(stocare.salveaza(stare)).toBe(false);
    expect(() => stocare.cursuri.scrie(cursuriTest)).not.toThrow();
  });

  test("stocarea browserului este gasita in mediul de test", () => {
    const depozit = depozitulBrowserului();
    expect(depozit).not.toBeNull();
    expect(creeazaStocare(depozit).persistenta).toBe(true);
    expect(globalThis.localStorage.getItem(`${PREFIX}proba`)).toBeNull();
  });
});

describe("validare", () => {
  test("starea goala este valida", () => {
    expect(valideazaStare(STARE_GOALA)).toEqual(STARE_GOALA);
  });
  test("esteComplet: doar cu toate cele 10 raspunsuri", () => {
    expect(esteComplet(baza)).toBe(true);
    expect(esteComplet({ ...baza, altaSituatie: undefined })).toBe(false);
    expect(esteComplet({})).toBe(false);
  });
  test("aurul fara grame si banca scrisa de mana sunt valide", () => {
    const cuAur: StareSalvata = {
      raspunsuri: {
        locuri: [
          { tip: "aur", forma: "bijuterii", grame: null },
          { tip: "depozit", suma: { fel: "lipsa" }, banca: { fel: "alta", nume: "Banca Mica" } },
        ],
      },
      pasiFacuti: [],
    };
    expect(valideazaStare(cuAur)).toEqual(cuAur);
  });
});
