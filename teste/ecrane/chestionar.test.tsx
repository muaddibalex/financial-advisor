import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, describe, expect, test } from "vitest";
import { App } from "../../src/app";
import type { RezultatCursuri } from "../../src/cursuri/incarcare";
import { calculeazaPasi } from "../../src/domeniu/reguli";
import { LIPSA, type Cursuri, type Rand } from "../../src/domeniu/tipuri";
import { PREFIX, VERSIUNE, creeazaStocare, depozitInMemorie, type Depozit, type Stocare } from "../../src/stocare/stocare";
import { esteComplet, type RaspunsuriPartiale, type StareSalvata } from "../../src/stocare/validare";
import { AZI, baza, cursuriTest, parametriTest, suma } from "../fixturi/situatii";

afterEach(cleanup);

const bancaExemplu = { fel: "lista", id: "exemplu-a" } as const;

/** Porneste aplicatia cu o stocare in memorie, ca testele sa nu se atinga intre ele. */
function porneste(optiuni: { stare?: StareSalvata; cursuri?: Cursuri | null; depozit?: Depozit | null; seIncarca?: boolean } = {}): Stocare {
  const stocare = creeazaStocare(optiuni.depozit === undefined ? depozitInMemorie() : optiuni.depozit);
  if (optiuni.stare) stocare.salveaza(optiuni.stare);
  const cursuri = optiuni.cursuri === undefined ? cursuriTest : optiuni.cursuri;
  const rezultat: RezultatCursuri = cursuri ? { sursa: "retea", cursuri } : { sursa: "lipsa", cursuri: null };
  const incarca = () => (optiuni.seIncarca ? new Promise<RezultatCursuri>(() => {}) : Promise.resolve(rezultat));
  render(<App stocare={stocare} incarca={incarca} azi={AZI} />);
  return stocare;
}

const cu = (raspunsuri: RaspunsuriPartiale): StareSalvata => ({ raspunsuri, pasiFacuti: [] });
const apasa = (nume: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nume }));
const scrie = (eticheta: string | RegExp, text: string) => fireEvent.input(screen.getByLabelText(eticheta), { target: { value: text } });
const titlu = () => screen.getByRole("heading", { level: 1 }).textContent;
const mesaj = () => screen.getByRole("alert").textContent;
const salvat = (stocare: Stocare): RaspunsuriPartiale => {
  const citit = stocare.citeste();
  if (citit.fel !== "valida") throw new Error(`stare ${citit.fel}`);
  return citit.stare.raspunsuri;
};
const inainte = () => apasa("Mai departe");

/** Raspunsurile de dinaintea intrebarii 5, ca aplicatia sa porneasca la lista de locuri. */
const panaLaLocuri: RaspunsuriPartiale = { venit: baza.venit, cheltuieli: baza.cheltuieli, ramanBani: "da", datorii: [] };

describe("parcurgerea chestionarului", () => {
  test("de la prima intrebare pana la capat, cu toate raspunsurile salvate", () => {
    const stocare = porneste();
    expect(screen.getByText(/1 din 10/)).toBeTruthy();

    scrie("Suma", "3.000");
    inainte();
    scrie("Suma", "2500");
    inainte();
    apasa("Da, de obicei");
    inainte();
    apasa("Nu am datorii");
    inainte();

    apasa("+ Adăugați un loc");
    apasa(/^Cont/);
    scrie("Suma", "10 000");
    fireEvent.change(screen.getByLabelText("La ce bancă?"), { target: { value: "exemplu-a" } });
    apasa("Salvați");
    inainte();

    apasa("Nu");
    inainte();
    apasa("Da");
    inainte();
    apasa("Nu");
    inainte();
    apasa("Nu");
    inainte();
    expect(screen.getByText(/10 din 10/)).toBeTruthy();
    apasa("Nu");
    inainte();

    expect(titlu()).toBe("Ați răspuns la toate întrebările");
    const raspunsuri = salvat(stocare);
    expect(raspunsuri).toEqual({ ...baza, locuri: [{ tip: "cont", suma: suma(10000), banca: bancaExemplu }] });
    if (!esteComplet(raspunsuri)) throw new Error("chestionar neterminat");
    expect(calculeazaPasi(raspunsuri, cursuriTest, parametriTest, AZI)).toEqual([]);
  });

  test("fara raspuns nu se merge mai departe si nu se salveaza nimic", () => {
    const stocare = porneste();
    inainte();
    expect(mesaj()).toContain("Scrieți suma");
    expect(screen.getByText(/1 din 10/)).toBeTruthy();
    expect(stocare.citeste()).toEqual({ fel: "lipsa" });
  });

  test("la o intrebare cu butoane, fara alegere apare ce este de facut", () => {
    porneste({ stare: cu({ venit: baza.venit, cheltuieli: baza.cheltuieli }) });
    expect(screen.getByText(/3 din 10/)).toBeTruthy();
    inainte();
    expect(mesaj()).toContain("Alegeți un răspuns");
    expect(screen.getByText(/3 din 10/)).toBeTruthy();
  });

  test("porneste de la prima intrebare fara raspuns", () => {
    porneste({ stare: cu(panaLaLocuri) });
    expect(screen.getByText(/5 din 10/)).toBeTruthy();
  });

  test("cu toate raspunsurile date, porneste dupa chestionar, iar raspunsurile pot fi schimbate", () => {
    porneste({ stare: cu(baza) });
    expect(titlu()).toBe("Ați răspuns la toate întrebările");
    apasa("Schimbați răspunsurile");
    expect(screen.getByText(/1 din 10/)).toBeTruthy();
    expect((screen.getByLabelText("Suma") as HTMLInputElement).value).toBe("3.000");
  });
});

describe("revenirea la o intrebare", () => {
  test("Inapoi arata raspunsul dat, iar alegerea ramane marcata", () => {
    porneste();
    scrie("Suma", "3000");
    inainte();
    scrie("Suma", "2500,50");
    inainte();
    apasa("Uneori");
    apasa("Înapoi");
    expect((screen.getByLabelText("Suma") as HTMLInputElement).value).toBe("2.500,50");
    apasa("Înapoi");
    expect((screen.getByLabelText("Suma") as HTMLInputElement).value).toBe("3.000");
    inainte();
    inainte();
    expect(screen.getByRole("button", { name: "Uneori" }).getAttribute("aria-pressed")).toBe("true");
  });

  test("Inapoi pastreaza o suma scrisa corect, chiar fara Mai departe", () => {
    const stocare = porneste({ stare: cu({ venit: baza.venit }) });
    scrie("Suma", "1800");
    apasa("Înapoi");
    expect(salvat(stocare).cheltuieli).toEqual(suma(1800));
  });

  test("prima intrebare nu are Inapoi", () => {
    porneste();
    expect(screen.queryByRole("button", { name: "Înapoi" })).toBeNull();
  });
});

describe("sumele", () => {
  test("o suma neclara este refuzata, cu explicatie, si nu se salveaza", () => {
    const stocare = porneste();
    scrie("Suma", "20,000");
    expect(screen.queryByText(/Am înțeles/)).toBeNull();
    inainte();
    expect(mesaj()).toContain("Nu am înțeles suma");
    expect(stocare.citeste()).toEqual({ fel: "lipsa" });
  });

  test("aplicatia arata inapoi ce a inteles, cu moneda aleasa", () => {
    const stocare = porneste();
    scrie("Suma", "1 200");
    apasa("euro");
    expect(screen.getByText("Am înțeles: 1.200 euro")).toBeTruthy();
    inainte();
    expect(salvat(stocare).venit).toEqual(suma(1200, "EUR"));
  });

  test("cheltuielile sunt mereu in lei: nu se poate alege alta moneda", () => {
    porneste({ stare: cu({ venit: baza.venit }) });
    expect(screen.queryByRole("button", { name: "euro" })).toBeNull();
  });

  test("Prefer sa nu spun se salveaza ca suma lipsa, nu ca zero", () => {
    const stocare = porneste();
    scrie("Suma", "3000");
    apasa("Prefer să nu spun");
    expect((screen.getByLabelText("Suma") as HTMLInputElement).value).toBe("");
    inainte();
    expect(salvat(stocare).venit).toEqual(LIPSA);
  });
});

describe("datoriile", () => {
  const laDatorii = cu({ venit: baza.venit, cheltuieli: baza.cheltuieli, ramanBani: "da" });

  test("mai multe alegeri; Nu am datorii le inlocuieste", () => {
    const stocare = porneste({ stare: laDatorii });
    apasa(/^Pe card/);
    apasa(/^La un IFN/);
    expect(salvat(stocare).datorii).toEqual(["ifn", "card"]);
    apasa("Nu am datorii");
    expect(salvat(stocare).datorii).toEqual([]);
    apasa(/^La bancă/);
    expect(salvat(stocare).datorii).toEqual(["banca"]);
  });

  test("fara nicio alegere, intrebarea este fara raspuns, nu Nu", () => {
    const stocare = porneste({ stare: laDatorii });
    apasa(/^Pe card/);
    apasa(/^Pe card/);
    expect(salvat(stocare).datorii).toBeUndefined();
    inainte();
    expect(mesaj()).toContain("Alegeți un răspuns");
  });
});

describe("lista de locuri", () => {
  /** Porneste cu locuri deja trecute si se intoarce de la intrebarea 6 la lista. */
  const pornesteLaLista = (locuri: readonly Rand[], cursuri?: Cursuri | null): Stocare => {
    const stocare = porneste({ stare: cu({ ...panaLaLocuri, locuri }), ...(cursuri === undefined ? {} : { cursuri }) });
    apasa("Înapoi");
    return stocare;
  };

  test("adaugarea, modificarea si stergerea unui rand", () => {
    const stocare = porneste({ stare: cu(panaLaLocuri) });

    apasa("+ Adăugați un loc");
    apasa(/^Acasă/);
    scrie("Suma", "6000");
    apasa("Salvați");
    expect(salvat(stocare).locuri).toEqual([{ tip: "acasa", suma: suma(6000) }]);

    apasa("+ Adăugați alt loc");
    apasa(/^Depozit/);
    scrie("Suma", "8.500");
    apasa("euro");
    fireEvent.change(screen.getByLabelText("La ce bancă?"), { target: { value: "alta" } });
    scrie("Numele băncii", "  Banca   Mică ");
    apasa("Salvați");
    expect(salvat(stocare).locuri?.[1]).toEqual({ tip: "depozit", suma: suma(8500, "EUR"), banca: { fel: "alta", nume: "Banca Mică" } });

    apasa(/^Schimbați: Acasă/);
    expect((screen.getByLabelText("Suma") as HTMLInputElement).value).toBe("6.000");
    scrie("Suma", "7000");
    apasa("Salvați");
    expect(salvat(stocare).locuri?.[0]).toEqual({ tip: "acasa", suma: suma(7000) });
    expect(salvat(stocare).locuri).toHaveLength(2);

    apasa(/^Schimbați: Acasă/);
    apasa("Ștergeți acest loc");
    expect(salvat(stocare).locuri).toHaveLength(1);

    apasa(/^Schimbați: Depozit/);
    apasa("Ștergeți acest loc");
    expect(salvat(stocare).locuri).toBeUndefined();
  });

  test("Renuntati nu schimba nimic", () => {
    const stocare = pornesteLaLista([{ tip: "acasa", suma: suma(6000) }]);
    apasa(/^Schimbați: Acasă/);
    scrie("Suma", "1");
    apasa("Renunțați");
    expect(salvat(stocare).locuri).toEqual([{ tip: "acasa", suma: suma(6000) }]);
  });

  test("un cont fara banca sau fara suma nu se salveaza", () => {
    const stocare = porneste({ stare: cu(panaLaLocuri) });
    apasa("+ Adăugați un loc");
    apasa(/^Cont/);
    apasa("Salvați");
    expect(mesaj()).toContain("Scrieți suma");
    scrie("Suma", "100");
    apasa("Salvați");
    expect(mesaj()).toBe("Alegeți banca.");
    fireEvent.change(screen.getByLabelText("La ce bancă?"), { target: { value: "alta" } });
    scrie("Numele băncii", "   ");
    apasa("Salvați");
    expect(mesaj()).toBe("Scrieți numele băncii.");
    expect(salvat(stocare).locuri).toBeUndefined();
  });

  test("aurul se noteaza cu forma si, daca omul vrea, cu grame", () => {
    const stocare = porneste({ stare: cu(panaLaLocuri) });
    apasa("+ Adăugați un loc");
    apasa(/^Aur/);
    apasa("Salvați");
    expect(mesaj()).toBe("Alegeți ce fel de aur este.");
    apasa("Bijuterii");
    apasa("Salvați");
    expect(salvat(stocare).locuri).toEqual([{ tip: "aur", forma: "bijuterii", grame: null }]);

    apasa(/^Schimbați: Aur/);
    scrie(/Câte grame/, "31.5");
    apasa("Salvați");
    expect(mesaj()).toContain("Nu am înțeles câte grame");
    scrie(/Câte grame/, "50");
    expect(screen.getByText("Am înțeles: 50 grame")).toBeTruthy();
    apasa("Salvați");
    expect(salvat(stocare).locuri).toEqual([{ tip: "aur", forma: "bijuterii", grame: 50 }]);
  });

  test("fara niciun loc: trebuie spus anume ca nu exista bani pusi deoparte", () => {
    const stocare = porneste({ stare: cu(panaLaLocuri) });
    inainte();
    expect(mesaj()).toContain("Adăugați un loc");
    apasa("Nu am bani puși deoparte");
    expect(salvat(stocare).locuri).toEqual([]);
    inainte();
    expect(screen.getByText(/6 din 10/)).toBeTruthy();
  });

  describe("totalul orientativ", () => {
    const locuri: readonly Rand[] = [
      { tip: "depozit", suma: suma(42000), banca: bancaExemplu },
      { tip: "cont", suma: suma(2100, "EUR"), banca: bancaExemplu },
      { tip: "aur", forma: "lingouri-monede", grame: 50 },
    ];

    test("valuta la cursul mediu, cu luna numita si cu ce nu a fost socotit", async () => {
      pornesteLaLista(locuri);
      // 42.000 + 2.100 x 5 = 52.500
      expect(await screen.findByText("aproximativ 52.500 lei")).toBeTruthy();
      expect(screen.getByText(/cursul mediu BNR din octombrie 2026/)).toBeTruthy();
      expect(screen.getByText(/nu sunt socotite/)).toBeTruthy();
      expect(screen.queryByText(/curs este vechi/)).toBeNull();
    });

    test("un curs vechi este folosit, cu avertizare", async () => {
      pornesteLaLista(locuri, { ...cursuriTest, lunaReferinta: "2026-08" });
      expect(await screen.findByText(/curs este vechi/)).toBeTruthy();
      expect(screen.getByText(/august 2026/)).toBeTruthy();
    });

    test("doar lei: fara nicio mentiune despre curs", async () => {
      pornesteLaLista([{ tip: "acasa", suma: suma(6000) }], { ...cursuriTest, lunaReferinta: "2026-08" });
      expect(screen.getByText("aproximativ 6.000 lei")).toBeTruthy();
      await Promise.resolve();
      expect(screen.queryByText(/curs/)).toBeNull();
    });

    test("fara cursuri: cate un total pe fiecare moneda, fara adunare", async () => {
      pornesteLaLista(locuri, null);
      expect(await screen.findByText(/nu a putut fi citit/)).toBeTruthy();
      const total = document.querySelector(".total")?.textContent ?? "";
      expect(total).toContain("42.000 lei");
      expect(total).toContain("2.100 euro");
      expect(total).not.toContain("aproximativ");
    });

    test("cat timp cursurile se incarca, nu se spune ca lipsesc", async () => {
      const stocare = porneste({ stare: cu({ ...panaLaLocuri, locuri }), seIncarca: true });
      apasa("Înapoi");
      await Promise.resolve();
      expect(salvat(stocare).locuri).toHaveLength(3);
      expect(document.querySelector(".total")).toBeNull();
      expect(screen.queryByText(/nu a putut fi citit/)).toBeNull();
    });

    test("o suma nespusa: niciun total, nici partial", async () => {
      pornesteLaLista([...locuri, { tip: "acasa", suma: LIPSA }]);
      expect(await screen.findByText(/Totalul nu poate fi calculat/)).toBeTruthy();
      expect(screen.queryByText(/aproximativ/)).toBeNull();
    });
  });
});

describe("cheltuiala mare", () => {
  const laCheltuiala = cu({ ...panaLaLocuri, locuri: [] });

  test("Da cu suma lasata goala: raspunsul se salveaza, suma ramane nespusa", () => {
    const stocare = porneste({ stare: laCheltuiala });
    apasa("Da");
    inainte();
    expect(salvat(stocare).cheltuialaMare).toEqual({ raspuns: "da", suma: LIPSA });
    expect(screen.getByText(/7 din 10/)).toBeTruthy();
  });

  test("Poate cu suma: se salveaza in lei", () => {
    const stocare = porneste({ stare: laCheltuiala });
    apasa("Poate");
    scrie(/Cam cât/, "15.000");
    inainte();
    expect(salvat(stocare).cheltuialaMare).toEqual({ raspuns: "poate", suma: suma(15000) });
  });

  test("Nu sterge suma scrisa inainte", () => {
    const stocare = porneste({ stare: laCheltuiala });
    apasa("Da");
    scrie(/Cam cât/, "15000");
    apasa("Nu");
    inainte();
    expect(salvat(stocare).cheltuialaMare).toEqual({ raspuns: "nu", suma: LIPSA });
  });

  test("o suma neclara opreste trecerea mai departe", () => {
    porneste({ stare: laCheltuiala });
    apasa("Da");
    scrie(/Cam cât/, "15,000");
    inainte();
    expect(mesaj()).toContain("Nu am înțeles suma");
    expect(screen.getByText(/6 din 10/)).toBeTruthy();
  });
});

describe("pornirea si salvarea", () => {
  test.each([
    ["stricate", "{raspunsuri", "deteriorate"],
    ["dintr-o versiune veche", JSON.stringify({ versiune: VERSIUNE - 1, stare: cu(baza) }), "s-a schimbat"],
  ])("date %s: omul este anuntat si nimic nu se suprascrie pana nu raspunde din nou", (_nume, continut, text) => {
    const depozit = depozitInMemorie();
    depozit.setItem(`${PREFIX}stare`, continut);
    const stocare = porneste({ depozit });

    expect(titlu()).toBe("Răspunsurile salvate nu mai pot fi citite");
    expect(screen.getByText(new RegExp(text))).toBeTruthy();
    expect(depozit.getItem(`${PREFIX}stare`)).toBe(continut);

    apasa("Reluați întrebările");
    expect(screen.getByText(/1 din 10/)).toBeTruthy();
    expect(depozit.getItem(`${PREFIX}stare`)).toBe(continut);

    scrie("Suma", "3000");
    inainte();
    expect(salvat(stocare)).toEqual({ venit: suma(3000) });
  });

  test("salvarea unui raspuns pastreaza pasii bifati", () => {
    const stocare = porneste({ stare: { raspunsuri: { venit: baza.venit }, pasiFacuti: ["ordine-in-acte"] } });
    scrie("Suma", "2500");
    inainte();
    expect(stocare.citeste()).toEqual({
      fel: "valida",
      stare: { raspunsuri: { venit: baza.venit, cheltuieli: suma(2500) }, pasiFacuti: ["ordine-in-acte"] },
    });
  });

  test("browser care nu permite salvarea: omul este anuntat de la inceput", () => {
    porneste({ depozit: null });
    expect(screen.getByRole("status").textContent).toContain("nu pot fi salvate");
  });

  test("o salvare refuzata este anuntata, iar chestionarul merge mai departe", () => {
    const plin: Depozit = {
      ...depozitInMemorie(),
      setItem() {
        throw new DOMException("QuotaExceededError");
      },
    };
    porneste({ depozit: plin });
    expect(screen.queryByRole("status")).toBeNull();
    scrie("Suma", "3000");
    inainte();
    expect(screen.getByRole("status").textContent).toContain("nu a putut fi salvat");
    expect(screen.getByText(/2 din 10/)).toBeTruthy();
  });
});
