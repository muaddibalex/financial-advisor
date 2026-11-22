import { useEffect, useRef, useState } from "preact/hooks";
import { BANCI } from "./continut/banci";
import { INTREBARI, type Intrebare } from "./continut/intrebari";
import { PARAMETRI } from "./continut/parametri";
import { CONTINUT_IN_CIORNA } from "./continut/pasi";
import { incarcaCursuri, type RezultatCursuri } from "./cursuri/incarcare";
import type { Cursuri, IdPas, Parametri, Raspunsuri } from "./domeniu/tipuri";
import { DetaliuPas } from "./ecrane/DetaliuPas";
import { EcranAlegere, EcranCheltuialaMare, EcranDaNu, EcranDatorii, EcranSuma, type Navigare } from "./ecrane/Intrebare";
import { ListaLocuri } from "./ecrane/ListaLocuri";
import { Plan } from "./ecrane/Plan";
import { Siguranta, StergeTot, Subsol } from "./ecrane/Siguranta";
import { cifrelePasului, construiestePlan, notelePasului } from "./plan/plan";
import { creeazaStocare, type Stocare } from "./stocare/stocare";
import { STARE_GOALA, esteComplet, type RaspunsuriPartiale, type StareSalvata } from "./stocare/validare";

type Proprietati = {
  readonly stocare?: Stocare;
  readonly incarca?: (stocare: Stocare) => Promise<RezultatCursuri>;
  /** Data de azi, AAAA-LL-ZZ. */
  readonly azi?: string;
  /** Parametrii proprietarului. null cat timp nu au fost decisi. */
  readonly parametri?: Parametri | null;
  readonly tipareste?: () => void;
};

type Ecran =
  /** Datele salvate nu pot fi folosite. Nimic nu se suprascrie pana cand omul nu este de acord. */
  | { readonly fel: "date-necitite" }
  | { readonly fel: "intrebare"; readonly index: number }
  | { readonly fel: "plan" }
  | { readonly fel: "pas"; readonly id: IdPas }
  /** Dupa "Stergeti tot". Nimic nu se salveaza pana la primul raspuns nou. */
  | { readonly fel: "sters" };

/** Data de azi in Romania, oriunde s-ar afla telefonul. */
export function aziInRomania(acum: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(acum);
}

function primaFaraRaspuns(raspunsuri: RaspunsuriPartiale): number {
  return INTREBARI.findIndex((i) => raspunsuri[i.cheie] === undefined);
}

function ecranDePornire({ raspunsuri, laIntrebarea }: StareSalvata): Ecran {
  // Dupa o intrerupere, omul reia de la intrebarea la care a ramas.
  if (laIntrebarea !== null && laIntrebarea < INTREBARI.length) return { fel: "intrebare", index: laIntrebarea };
  const index = primaFaraRaspuns(raspunsuri);
  return index === -1 ? { fel: "plan" } : { fel: "intrebare", index };
}

const incarcaDinRetea = (stocare: Stocare) => incarcaCursuri("./cursuri.json", stocare.cursuri);

const tiparesteDinBrowser = () => window.print();

export function App({
  stocare: stocareData,
  incarca = incarcaDinRetea,
  azi = aziInRomania(),
  parametri = PARAMETRI,
  tipareste = tiparesteDinBrowser,
}: Proprietati) {
  const [stocare] = useState(() => stocareData ?? creeazaStocare());
  const [citit] = useState(() => stocare.citeste());
  const [stare, setStare] = useState<StareSalvata>(citit.fel === "valida" ? citit.stare : STARE_GOALA);
  const [ecran, setEcran] = useState<Ecran>(() =>
    citit.fel === "versiune-veche" || citit.fel === "stricata" ? { fel: "date-necitite" } : ecranDePornire(stare),
  );
  const [salvareEsuata, setSalvareEsuata] = useState(false);
  // Ecranele "Siguranta" si "Stergeti tot" se deschid peste ecranul curent, care ramane
  // neatins dedesubt: un loc pe jumatate completat nu se pierde.
  const [suprapus, setSuprapus] = useState<"siguranta" | "sterge" | null>(null);
  // undefined: cursurile inca se incarca. null: nu exista nici in retea, nici in copie.
  const [cursuri, setCursuri] = useState<Cursuri | null | undefined>(undefined);

  // Mereu ultima stare, ca doua raspunsuri date unul dupa altul sa nu se piarda.
  const ultima = useRef(stare);

  useEffect(() => {
    let activ = true;
    void incarca(stocare).then((rezultat) => {
      if (activ) setCursuri(rezultat.cursuri);
    });
    return () => {
      activ = false;
    };
  }, [incarca, stocare]);

  const raspunde = <K extends keyof Raspunsuri>(cheie: K, valoare: Raspunsuri[K] | undefined) => {
    const raspunsuri: { -readonly [C in keyof Raspunsuri]?: Raspunsuri[C] } = { ...ultima.current.raspunsuri };
    if (valoare === undefined) delete raspunsuri[cheie];
    else raspunsuri[cheie] = valoare;
    // Pasii bifati se pastreaza: salvarea unui raspuns nu ii sterge.
    // Odata cu raspunsul se retine si intrebarea, ca o lista inceputa sa fie reluata, nu sarita.
    const laIntrebarea = ecran.fel === "intrebare" ? ecran.index : ultima.current.laIntrebarea;
    const noua: StareSalvata = { ...ultima.current, raspunsuri, laIntrebarea };
    ultima.current = noua;
    setStare(noua);
    setSalvareEsuata(!stocare.salveaza(noua));
  };

  /** Schimba ecranul si retine unde a ajuns omul. */
  const mergiLa = (nou: Ecran) => {
    const noua: StareSalvata = { ...ultima.current, laIntrebarea: nou.fel === "intrebare" ? nou.index : null };
    ultima.current = noua;
    setStare(noua);
    setSalvareEsuata(!stocare.salveaza(noua));
    setEcran(nou);
  };

  const avertizare = !stocare.persistenta
    ? "Răspunsurile nu pot fi salvate pe acest telefon. Rămân doar cât timp pagina este deschisă."
    : salvareEsuata
      ? "Ultimul răspuns nu a putut fi salvat pe telefon. Dacă închideți pagina, se poate pierde."
      : null;

  const bifeaza = (id: IdPas, facut: boolean) => {
    const faraEl = ultima.current.pasiFacuti.filter((p) => p !== id);
    const noua: StareSalvata = { ...ultima.current, pasiFacuti: facut ? [...faraEl, id] : faraEl };
    ultima.current = noua;
    setStare(noua);
    setSalvareEsuata(!stocare.salveaza(noua));
  };

  const stergeTot = () => {
    stocare.stergeTot();
    // Starea din memorie se goleste si nu se salveaza: pe telefon nu ramane nimic.
    ultima.current = STARE_GOALA;
    setStare(STARE_GOALA);
    setSalvareEsuata(false);
    setEcran({ fel: "sters" });
    setSuprapus(null);
  };

  const cuAvertizare = (continut: preact.ComponentChildren, areAvertizare = true) => (
    <>
      {areAvertizare && avertizare ? (
        <p class="avertizare-salvare fara-tipar" role="status">
          {avertizare}
        </p>
      ) : null}
      <div class="strat" hidden={suprapus !== null}>
        {continut}
      </div>
      {suprapus === "siguranta" ? <Siguranta onInapoi={() => setSuprapus(null)} /> : null}
      {suprapus === "sterge" ? <StergeTot onSterge={stergeTot} onRenunta={() => setSuprapus(null)} /> : null}
      {suprapus === null ? <Subsol onSiguranta={() => setSuprapus("siguranta")} onSterge={() => setSuprapus("sterge")} /> : null}
    </>
  );

  if (ecran.fel === "date-necitite") {
    return cuAvertizare(
      <main class="ecran">
        <h1>Răspunsurile salvate nu mai pot fi citite</h1>
        <p>
          {citit.fel === "versiune-veche"
            ? "Aplicația s-a schimbat de când ați răspuns ultima dată, iar răspunsurile vechi nu se mai potrivesc."
            : "Datele salvate pe acest telefon sunt deteriorate."}
        </p>
        <p>Aplicația nu ghicește ce ați răspuns. Este nevoie să reluați întrebările.</p>
        <p>Când dați primul răspuns nou, răspunsurile vechi sunt înlocuite.</p>
        <div class="spatiu" />
        <button type="button" class="buton principal" onClick={() => setEcran({ fel: "intrebare", index: 0 })}>
          Reluați întrebările
        </button>
      </main>,
      false,
    );
  }

  if (ecran.fel === "sters") {
    return cuAvertizare(
      <main class="ecran">
        <h1>Totul a fost șters</h1>
        <p>Pe acest telefon nu a mai rămas niciun răspuns.</p>
        <div class="spatiu" />
        <button type="button" class="buton principal" onClick={() => setEcran({ fel: "intrebare", index: 0 })}>
          Începeți din nou
        </button>
      </main>,
      false,
    );
  }

  if (ecran.fel === "plan" || ecran.fel === "pas") {
    const { raspunsuri } = stare;
    if (!esteComplet(raspunsuri)) {
      // Nu ar trebui sa se intample; daca se intampla, omul ajunge la intrebarea ramasa fara raspuns.
      const prima = primaFaraRaspuns(raspunsuri);
      return cuAvertizare(
        <main class="ecran">
          <h1>Mai este o întrebare fără răspuns</h1>
          <div class="spatiu" />
          <button type="button" class="buton principal" onClick={() => mergiLa({ fel: "intrebare", index: Math.max(prima, 0) })}>
            Mergeți la întrebare
          </button>
        </main>,
      );
    }
    // Planul nu se socoteste cat timp cursurile se incarca: altfel ar aparea, pentru o clipa, fara ele.
    if (cursuri === undefined) {
      return cuAvertizare(
        <main class="ecran">
          <h1>Se pregătește planul…</h1>
        </main>,
      );
    }
    const plan = construiestePlan(raspunsuri, cursuri, parametri, azi, stare.pasiFacuti);
    const pas = ecran.fel === "pas" ? plan.pasi.find((p) => p.id === ecran.id) : undefined;
    if (pas !== undefined) {
      return cuAvertizare(
        <DetaliuPas
          key={pas.id}
          pas={pas}
          cifre={cifrelePasului(pas, raspunsuri, cursuri, parametri)}
          note={notelePasului(pas, raspunsuri, BANCI.banci)}
          onInapoi={() => setEcran({ fel: "plan" })}
          onBifeaza={(facut) => bifeaza(pas.id, facut)}
        />,
      );
    }
    return cuAvertizare(
      <Plan
        plan={plan}
        cursuri={cursuri}
        azi={azi}
        inCiorna={CONTINUT_IN_CIORNA}
        onDeschide={(id) => setEcran({ fel: "pas", id })}
        onSchimba={() => mergiLa({ fel: "intrebare", index: 0 })}
        onTipareste={tipareste}
      />,
    );
  }

  const { index } = ecran;
  const intrebare = INTREBARI[index];
  if (intrebare === undefined) return null;

  const navigare: Navigare = {
    pozitie: { numar: index + 1, total: INTREBARI.length },
    onInapoi: index > 0 ? () => mergiLa({ fel: "intrebare", index: index - 1 }) : undefined,
    onInainte: () => {
      if (index + 1 < INTREBARI.length) return mergiLa({ fel: "intrebare", index: index + 1 });
      // Dupa ultima intrebare: la plan, sau inapoi la prima ramasa fara raspuns.
      const prima = primaFaraRaspuns(ultima.current.raspunsuri);
      mergiLa(prima === -1 ? { fel: "plan" } : { fel: "intrebare", index: prima });
    },
  };

  return cuAvertizare(ecranul(intrebare, stare.raspunsuri, raspunde, navigare, cursuri, azi));
}

function ecranul(
  i: Intrebare,
  r: RaspunsuriPartiale,
  raspunde: <K extends keyof Raspunsuri>(cheie: K, valoare: Raspunsuri[K] | undefined) => void,
  navigare: Navigare,
  cursuri: Cursuri | null | undefined,
  azi: string,
) {
  // "key" face ca fiecare intrebare sa porneasca de la raspunsul ei salvat, nu de la ce s-a scris la alta.
  switch (i.fel) {
    case "suma":
      return <EcranSuma key={i.cheie} intrebare={i} raspuns={r[i.cheie]} onRaspuns={(v) => raspunde(i.cheie, v)} navigare={navigare} />;
    case "alegere":
      return <EcranAlegere key={i.cheie} intrebare={i} raspuns={r[i.cheie]} onRaspuns={(v) => raspunde(i.cheie, v)} navigare={navigare} />;
    case "datorii":
      return <EcranDatorii key={i.cheie} intrebare={i} raspuns={r[i.cheie]} onRaspuns={(v) => raspunde(i.cheie, v)} navigare={navigare} />;
    case "locuri":
      return (
        <ListaLocuri
          key={i.cheie}
          intrebare={i}
          raspuns={r[i.cheie]}
          onRaspuns={(v) => raspunde(i.cheie, v)}
          navigare={navigare}
          cursuri={cursuri}
          azi={azi}
          banci={BANCI.banci}
        />
      );
    case "cheltuiala-mare":
      return <EcranCheltuialaMare key={i.cheie} intrebare={i} raspuns={r[i.cheie]} onRaspuns={(v) => raspunde(i.cheie, v)} navigare={navigare} />;
    case "da-nu":
      return <EcranDaNu key={i.cheie} intrebare={i} raspuns={r[i.cheie]} onRaspuns={(v) => raspunde(i.cheie, v)} navigare={navigare} />;
  }
}
