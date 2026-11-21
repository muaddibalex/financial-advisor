import { cleanup, fireEvent, render, screen, within } from "@testing-library/preact";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "../../src/app";
import { PASI } from "../../src/continut/pasi";
import type { RezultatCursuri } from "../../src/cursuri/incarcare";
import { ORDINEA_PASILOR } from "../../src/domeniu/reguli";
import { LIPSA, type Cursuri, type Parametri, type Raspunsuri } from "../../src/domeniu/tipuri";
import { cifrelePasului, construiestePlan, dataRomaneasca } from "../../src/plan/plan";
import { PREFIX, creeazaStocare, depozitInMemorie, type Depozit, type Stocare } from "../../src/stocare/stocare";
import type { StareSalvata } from "../../src/stocare/validare";
import { AZI, baza, cursuriTest, parametriTest, suma } from "../fixturi/situatii";

afterEach(cleanup);

type Optiuni = {
  raspunsuri?: Raspunsuri;
  pasiFacuti?: StareSalvata["pasiFacuti"];
  cursuri?: Cursuri | null;
  parametri?: Parametri | null;
  depozit?: Depozit;
  seIncarca?: boolean;
};

/** Porneste aplicatia cu chestionarul terminat, deci direct la plan. */
function porneste(o: Optiuni = {}): { stocare: Stocare; depozit: Depozit; tipareste: ReturnType<typeof vi.fn> } {
  const depozit = o.depozit ?? depozitInMemorie();
  const stocare = creeazaStocare(depozit);
  stocare.salveaza({ raspunsuri: o.raspunsuri ?? baza, pasiFacuti: o.pasiFacuti ?? [], laIntrebarea: null });
  const cursuri = o.cursuri === undefined ? cursuriTest : o.cursuri;
  const rezultat: RezultatCursuri = cursuri ? { sursa: "retea", cursuri } : { sursa: "lipsa", cursuri: null };
  const incarca = () => (o.seIncarca ? new Promise<RezultatCursuri>(() => {}) : Promise.resolve(rezultat));
  const tipareste = vi.fn();
  render(<App stocare={stocare} incarca={incarca} azi={AZI} parametri={o.parametri === undefined ? parametriTest : o.parametri} tipareste={tipareste} />);
  return { stocare, depozit, tipareste };
}

const titlu = () => screen.getByRole("heading", { level: 1 }).textContent;
const laPlan = (text: string | RegExp) => screen.findByRole("heading", { level: 1, name: text });
const apasa = (nume: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nume }));
/** Titlurile pasilor de pe ecran, in ordinea afisata. */
const pasiiAfisati = () => [...document.querySelectorAll(".buton.pas")].map((b) => b.textContent ?? "");
const deTiparit = () => screen.getByTestId("de-tiparit").textContent ?? "";
const pasiFacuti = (stocare: Stocare) => {
  const citit = stocare.citeste();
  if (citit.fel !== "valida") throw new Error(citit.fel);
  return citit.stare.pasiFacuti;
};

const cuFrauda: Raspunsuri = { ...baza, contactSuspect: true, stieCineva: false, girant: true };

describe("starile planului", () => {
  test("gol: mesaj neutru, care nu spune ca totul este in ordine", async () => {
    porneste();
    await laPlan("Din răspunsuri nu a reieșit niciun pas de făcut");
    expect(within(screen.getByRole("main")).getByText(/verifică doar câteva lucruri de bază/)).toBeTruthy();
    expect(document.body.textContent?.toLowerCase()).not.toContain("în ordine");
    expect(pasiiAfisati()).toEqual([]);
    expect(screen.queryByRole("button", { name: "Tipăriți planul" })).toBeNull();
  });

  test("cu pasi: in ordinea motorului de reguli, numerotati", async () => {
    porneste({ raspunsuri: { ...baza, stieCineva: false, girant: true } });
    await laPlan("Aveți 2 pași de făcut");
    const pasi = pasiiAfisati();
    expect(pasi).toHaveLength(2);
    expect(pasi[0]).toContain(`1${PASI["ordine-in-acte"].titlu}`);
    expect(pasi[1]).toContain(`2${PASI.girant.titlu}`);
  });

  test("cu frauda: avertizarea este prima, marcata distinct si fara numar", async () => {
    porneste({ raspunsuri: cuFrauda });
    await laPlan("Aveți 3 pași de făcut");
    const [prima, a_doua] = document.querySelectorAll(".buton.pas");
    expect(prima?.classList.contains("urgent")).toBe(true);
    expect(prima?.textContent).toContain(`!${PASI.frauda.titlu}`);
    expect(within(screen.getByRole("main")).getByText(/Citiți întâi avertizarea de sus/)).toBeTruthy();
    expect(document.body.textContent).not.toContain("nicio grabă");
    expect(a_doua?.textContent).toContain(`1${PASI["ordine-in-acte"].titlu}`);
  });

  test("cu pasul 14: situatia neacoperita este mereu ultima", async () => {
    porneste({ raspunsuri: { ...cuFrauda, altaSituatie: true } });
    await laPlan("Aveți 4 pași de făcut");
    expect(pasiiAfisati().at(-1)).toContain(PASI["situatie-neacoperita"].titlu);
  });

  test("un singur pas: titlul este la singular", async () => {
    porneste({ raspunsuri: { ...baza, girant: true } });
    expect(await laPlan("Aveți un pas de făcut")).toBeTruthy();
  });

  test("cat timp cursurile se incarca, planul nu este socotit fara ele", async () => {
    porneste({ raspunsuri: cuFrauda, seIncarca: true });
    await Promise.resolve();
    expect(titlu()).toBe("Se pregătește planul…");
    expect(pasiiAfisati()).toEqual([]);
  });

  test("continutul in ciorna este anuntat pe ecran", async () => {
    porneste();
    await laPlan(/niciun pas/);
    expect(screen.getAllByText(/Versiune de probă/).length).toBeGreaterThan(0);
  });
});

describe("parametri nedecisi", () => {
  test("pasii care depind de ei apar in forma generala, fara nicio suma", async () => {
    porneste({ parametri: null });
    await laPlan("Aveți 3 pași de făcut");
    apasa(new RegExp(PASI["bani-pentru-urgente"].titlu));
    expect(screen.getByText(/nu a putut face socoteala/)).toBeTruthy();
    expect(screen.queryByText("Din răspunsurile dumneavoastră")).toBeNull();
    expect(document.body.textContent).not.toMatch(/10\.000|2\.500/);
  });
});

describe("avertizarea de curs", () => {
  const cuEuro: Raspunsuri = { ...baza, locuri: [{ tip: "acasa", suma: suma(100, "EUR") }] };
  const doarAcasa: Raspunsuri = { ...baza, locuri: [{ tip: "acasa", suma: suma(100) }] };
  const vechi: Cursuri = { ...cursuriTest, lunaReferinta: "2026-08" };

  test("curs vechi si economii in valuta: avertizare cu luna cursului", async () => {
    porneste({ raspunsuri: cuEuro, cursuri: vechi });
    expect((await screen.findByRole("note")).textContent).toContain("august 2026");
  });

  test("curs vechi, dar niciun calcul nu l-a folosit: fara avertizare", async () => {
    porneste({ raspunsuri: doarAcasa, cursuri: vechi });
    await laPlan(/de făcut/);
    expect(screen.queryByRole("note")).toBeNull();
  });

  test("curs vechi si bani in banca, doar in lei: avertizare, fiindca pragul bancii se socoteste in euro", async () => {
    porneste({ cursuri: vechi });
    expect((await screen.findByRole("note")).textContent).toContain("este vechi");
  });

  test("fara cursuri: se spune ca pasii apar fara socoteli", async () => {
    porneste({ raspunsuri: cuEuro, cursuri: null });
    expect((await screen.findByRole("note")).textContent).toContain("nu a putut fi citit");
  });

  test("curs proaspat: fara avertizare", async () => {
    porneste({ raspunsuri: cuEuro });
    await laPlan(/de făcut/);
    expect(screen.queryByRole("note")).toBeNull();
  });
});

describe("detaliul unui pas si bifarea", () => {
  test("detaliul arata de ce conteaza, ce se poate face si ca aplicatia nu alege", async () => {
    porneste({ raspunsuri: { ...baza, girant: true } });
    await laPlan(/un pas/);
    apasa(new RegExp(PASI.girant.titlu));
    expect(titlu()).toBe(PASI.girant.titlu);
    expect(screen.getByText(PASI.girant.deCe)).toBeTruthy();
    expect(screen.getByText(PASI.girant.cePutetiFace[0] ?? "")).toBeTruthy();
    expect(screen.getByText(/nu vă spune ce să alegeți/)).toBeTruthy();
    apasa("Înapoi la plan");
    expect(titlu()).toBe("Aveți un pas de făcut");
  });

  test("bifa se salveaza, pasul apare ca facut si poate fi scoasa", async () => {
    const { stocare } = porneste({ raspunsuri: { ...baza, stieCineva: false, girant: true } });
    await laPlan("Aveți 2 pași de făcut");
    apasa(new RegExp(PASI.girant.titlu));
    apasa(/^Am făcut acest pas/);
    expect(pasiFacuti(stocare)).toEqual(["girant"]);
    apasa("Înapoi la plan");
    expect(titlu()).toBe("Aveți un pas de făcut");
    expect(pasiiAfisati()[1]).toContain("Făcut");

    apasa(new RegExp(PASI.girant.titlu));
    apasa(/^Am făcut acest pas/);
    expect(pasiFacuti(stocare)).toEqual([]);
  });

  test("toti pasii bifati: se spune ca bifele sunt declaratia omului, nu o verificare", async () => {
    porneste({ raspunsuri: { ...baza, girant: true }, pasiFacuti: ["girant"] });
    await laPlan("Ați bifat toți pașii");
    expect(screen.getByText(/Aplicația nu verifică/)).toBeTruthy();
    expect(document.body.textContent?.toLowerCase()).not.toContain("în ordine");
  });

  test("avertizarea de frauda nu poate fi bifata, nici dintr-o bifa salvata", async () => {
    porneste({ raspunsuri: cuFrauda, pasiFacuti: ["frauda"] });
    await laPlan("Aveți 3 pași de făcut");
    expect(document.querySelector(".buton.pas")?.classList.contains("facut")).toBe(false);
    apasa(new RegExp(PASI.frauda.titlu));
    expect(screen.queryByRole("button", { name: /^Am făcut acest pas/ })).toBeNull();
  });

  test("o bifa pentru un pas care nu se mai aplica ramane salvata, dar nu se numara", async () => {
    const { stocare } = porneste({ raspunsuri: { ...baza, girant: true }, pasiFacuti: ["ordine-in-acte"] });
    await laPlan("Aveți un pas de făcut");
    expect(pasiiAfisati()).toHaveLength(1);
    expect(pasiFacuti(stocare)).toEqual(["ordine-in-acte"]);
  });

  test("un pas calculat arata cifrele din raspunsuri; pasul despre banca nu arata nimic legat de plafon", async () => {
    const raspunsuri: Raspunsuri = {
      ...baza,
      locuri: [
        { tip: "acasa", suma: suma(7000) },
        { tip: "depozit", suma: suma(95000), banca: { fel: "lista", id: "banca-a" } },
      ],
    };
    porneste({ raspunsuri });
    await laPlan(/pași de făcut/);

    apasa(new RegExp(PASI["bani-in-casa"].titlu));
    expect(screen.getByText("Bani ținuți în casă: aproximativ 7.000 lei.")).toBeTruthy();
    apasa("Înapoi la plan");

    apasa(new RegExp(PASI["o-singura-banca"].titlu));
    expect(screen.queryByText("Din răspunsurile dumneavoastră")).toBeNull();
    expect(document.body.textContent).not.toMatch(/20\.000|18\.000|90\.000|95\.000/);
    apasa("Înapoi la plan");

    apasa(new RegExp(PASI["bani-peste-rezerva"].titlu));
    expect(screen.queryByText("Din răspunsurile dumneavoastră")).toBeNull();
    expect(document.body.textContent).not.toMatch(/\d{2}\.\d{3}/);
  });
});

describe("cifrele pasului", () => {
  test("bani pentru urgente: banii la indemana si cheltuielile pe lunile din parametri", () => {
    const r: Raspunsuri = { ...baza, locuri: [{ tip: "acasa", suma: suma(4000) }] };
    expect(cifrelePasului({ id: "bani-pentru-urgente", forma: "calculata" }, r, cursuriTest, parametriTest)).toEqual([
      "Bani la îndemână, acasă și în cont: aproximativ 4.000 lei.",
      "Cheltuielile dumneavoastră pe 4 luni: aproximativ 10.000 lei.",
    ]);
  });

  test("forma generala sau parametri nedecisi: nicio cifra", () => {
    expect(cifrelePasului({ id: "bani-pentru-urgente", forma: "generala" }, baza, cursuriTest, parametriTest)).toEqual([]);
    expect(cifrelePasului({ id: "bani-pentru-urgente", forma: "calculata" }, baza, cursuriTest, null)).toEqual([]);
  });

  test.each(ORDINEA_PASILOR.filter((id) => id !== "bani-pentru-urgente" && id !== "bani-in-casa"))("pasul %s nu arata nicio cifra", (id) => {
    const r: Raspunsuri = { ...baza, locuri: [{ tip: "acasa", suma: suma(99999) }] };
    expect(cifrelePasului({ id, forma: "calculata" }, r, cursuriTest, parametriTest)).toEqual([]);
  });

  test("planul pastreaza ordinea motorului de reguli", () => {
    const toate: Raspunsuri = {
      ...baza,
      ramanBani: "nu-ajung",
      datorii: ["ifn"],
      locuri: [
        { tip: "acasa", suma: LIPSA },
        { tip: "aur", forma: "bijuterii", grame: null },
        { tip: "altceva", suma: suma(5, "EUR") },
      ],
      cheltuialaMare: { raspuns: "da", suma: LIPSA },
      stieCineva: false,
      contactSuspect: true,
      girant: true,
      altaSituatie: true,
    };
    const ids = construiestePlan(toate, cursuriTest, parametriTest, AZI, []).pasi.map((p) => p.id);
    expect(ids).toEqual(ORDINEA_PASILOR.filter((id) => ids.includes(id)));
    expect(ids.length).toBeGreaterThan(10);
  });
});

describe("varianta de tiparit", () => {
  const cuSume: Raspunsuri = {
    ...baza,
    venit: suma(3141),
    cheltuieli: suma(2718),
    locuri: [
      { tip: "acasa", suma: suma(41237) },
      { tip: "depozit", suma: suma(8517, "EUR"), banca: { fel: "alta", nume: "Banca Vecinului" } },
      { tip: "aur", forma: "lingouri-monede", grame: 73 },
    ],
    cheltuialaMare: { raspuns: "da", suma: suma(15926) },
    stieCineva: false,
  };

  test("contine pasii cu explicatiile lor si data, dar nicio suma si niciun nume de banca", async () => {
    porneste({ raspunsuri: cuSume });
    await laPlan(/pași de făcut/);
    const text = deTiparit();

    expect(text).toContain(`Întocmit la ${dataRomaneasca(AZI)}`);
    expect(text).toContain("21.11.2026");
    expect(text).toContain(PASI["bani-in-casa"].titlu);
    expect(text).toContain(PASI["bani-in-casa"].deCe);
    expect(text).toContain(PASI["ordine-in-acte"].cePutetiFace[0]);

    for (const cifre of ["3141", "3.141", "2718", "2.718", "41237", "41.237", "8517", "8.517", "15926", "15.926", "73 grame"]) {
      expect(text).not.toContain(cifre);
    }
    expect(text).not.toContain("Banca Vecinului");
    // Nimic socotit: nici rezerva (4 x 2.718), nici totalul, nici vreun "aproximativ".
    expect(text).not.toContain("aproximativ");
    expect(text.replace(dataRomaneasca(AZI), "")).not.toMatch(/\d\.\d{3}/);
    // Cuvantul "lei" poate aparea in explicatii, dar niciodata dupa o cifra.
    expect(text).not.toMatch(/\d\s*(lei|euro|dolari|lire|grame)/);
  });

  test("butonul de tiparire porneste tiparirea", async () => {
    const { tipareste } = porneste({ raspunsuri: cuSume });
    await laPlan(/pași de făcut/);
    apasa("Tipăriți planul");
    expect(tipareste).toHaveBeenCalledTimes(1);
  });

  test("un pas bifat este notat ca atare pe foaie", async () => {
    porneste({ raspunsuri: { ...baza, girant: true }, pasiFacuti: ["girant"] });
    await laPlan(/bifat/);
    expect(deTiparit()).toContain("(bifat ca făcut)");
  });
});

describe("Siguranta", () => {
  test("se deschide de pe plan si spune ce nu cere aplicatia niciodata", async () => {
    porneste();
    await laPlan(/niciun pas/);
    apasa("Siguranță");
    expect(screen.getByRole("heading", { level: 1, name: "Siguranță" })).toBeTruthy();
    expect(screen.getByText(/Parole sau coduri PIN/)).toBeTruthy();
    apasa("Înapoi");
    expect(screen.getByRole("heading", { level: 1, name: /niciun pas/ })).toBeTruthy();
  });

  test("deschisa de la o intrebare, nu pierde un loc pe jumatate completat", () => {
    const stocare = creeazaStocare(depozitInMemorie());
    stocare.salveaza({ raspunsuri: { venit: baza.venit, cheltuieli: baza.cheltuieli, ramanBani: "da", datorii: [] }, pasiFacuti: [], laIntrebarea: 4 });
    render(<App stocare={stocare} incarca={() => Promise.resolve({ sursa: "lipsa", cursuri: null })} azi={AZI} parametri={parametriTest} />);
    apasa("+ Adăugați un loc");
    apasa(/^Acasă/);
    fireEvent.input(screen.getByLabelText("Suma"), { target: { value: "6000" } });

    apasa("Siguranță");
    apasa("Înapoi");

    expect((screen.getByLabelText("Suma") as HTMLInputElement).value).toBe("6000");
  });
});

describe("Stergeti tot", () => {
  test("cere confirmare; fara ea nu se sterge nimic", async () => {
    const { stocare } = porneste({ raspunsuri: { ...baza, girant: true }, pasiFacuti: ["girant"] });
    await laPlan(/bifat/);
    apasa("Ștergeți tot");
    expect(titlu()).toBe("Ștergeți tot");
    expect(stocare.citeste().fel).toBe("valida");

    const ecran = within(screen.getByRole("main"));
    fireEvent.click(ecran.getByRole("button", { name: "Ștergeți tot" }));
    expect(titlu()).toBe("Sigur ștergeți tot?");
    expect(stocare.citeste().fel).toBe("valida");

    apasa("Nu, păstrați");
    expect(titlu()).toBe("Ați bifat toți pașii");
    expect(pasiFacuti(stocare)).toEqual(["girant"]);
  });

  test("dupa confirmare nu ramane nicio cheie a aplicatiei, nici dupa ecranul urmator", async () => {
    const depozit = depozitInMemorie();
    depozit.setItem("alta-aplicatie", "neatins");
    const { stocare } = porneste({ depozit });
    stocare.cursuri.scrie(cursuriTest);
    await laPlan(/niciun pas/);

    apasa("Ștergeți tot");
    fireEvent.click(within(screen.getByRole("main")).getByRole("button", { name: "Ștergeți tot" }));
    apasa("Da, ștergeți tot");

    const cheileAplicatiei = () => Array.from({ length: depozit.length }, (_, i) => depozit.key(i)).filter((c) => c?.startsWith(PREFIX));
    expect(titlu()).toBe("Totul a fost șters");
    expect(cheileAplicatiei()).toEqual([]);

    apasa("Începeți din nou");
    expect(screen.getByText(/1 din 10/)).toBeTruthy();
    expect((screen.getByLabelText("Suma") as HTMLInputElement).value).toBe("");
    apasa("Siguranță");
    apasa("Înapoi");
    expect(cheileAplicatiei()).toEqual([]);
    expect(depozit.getItem("alta-aplicatie")).toBe("neatins");
  });

  test("de pe ecranul cu date necitite, deschiderea ecranelor permanente nu scrie nimic", () => {
    const depozit = depozitInMemorie();
    depozit.setItem(`${PREFIX}stare`, "{stricat");
    render(<App stocare={creeazaStocare(depozit)} incarca={() => Promise.resolve({ sursa: "lipsa", cursuri: null })} azi={AZI} parametri={parametriTest} />);
    apasa("Siguranță");
    apasa("Înapoi");
    apasa("Ștergeți tot");
    apasa("Înapoi");
    expect(depozit.getItem(`${PREFIX}stare`)).toBe("{stricat");
    expect(titlu()).toBe("Răspunsurile salvate nu mai pot fi citite");
  });
});
