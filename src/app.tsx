import { useEffect, useRef, useState } from "preact/hooks";
import { BANCI } from "./continut/banci";
import { INTREBARI, type Intrebare } from "./continut/intrebari";
import { incarcaCursuri, type RezultatCursuri } from "./cursuri/incarcare";
import type { Cursuri, Raspunsuri } from "./domeniu/tipuri";
import { EcranAlegere, EcranCheltuialaMare, EcranDaNu, EcranDatorii, EcranSuma, type Navigare } from "./ecrane/Intrebare";
import { ListaLocuri } from "./ecrane/ListaLocuri";
import { creeazaStocare, type Stocare } from "./stocare/stocare";
import { STARE_GOALA, esteComplet, type RaspunsuriPartiale, type StareSalvata } from "./stocare/validare";

type Proprietati = {
  readonly stocare?: Stocare;
  readonly incarca?: (stocare: Stocare) => Promise<RezultatCursuri>;
  /** Data de azi, AAAA-LL-ZZ. */
  readonly azi?: string;
};

type Ecran =
  /** Datele salvate nu pot fi folosite. Nimic nu se suprascrie pana cand omul nu este de acord. */
  | { readonly fel: "date-necitite" }
  | { readonly fel: "intrebare"; readonly index: number }
  | { readonly fel: "gata" };

/** Data de azi in Romania, oriunde s-ar afla telefonul. */
export function aziInRomania(acum: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(acum);
}

function primaFaraRaspuns(raspunsuri: RaspunsuriPartiale): number {
  return INTREBARI.findIndex((i) => raspunsuri[i.cheie] === undefined);
}

function ecranDePornire(raspunsuri: RaspunsuriPartiale): Ecran {
  const index = primaFaraRaspuns(raspunsuri);
  return index === -1 ? { fel: "gata" } : { fel: "intrebare", index };
}

const incarcaDinRetea = (stocare: Stocare) => incarcaCursuri("./cursuri.json", stocare.cursuri);

export function App({ stocare: stocareData, incarca = incarcaDinRetea, azi = aziInRomania() }: Proprietati) {
  const [stocare] = useState(() => stocareData ?? creeazaStocare());
  const [citit] = useState(() => stocare.citeste());
  const [stare, setStare] = useState<StareSalvata>(citit.fel === "valida" ? citit.stare : STARE_GOALA);
  const [ecran, setEcran] = useState<Ecran>(() =>
    citit.fel === "versiune-veche" || citit.fel === "stricata" ? { fel: "date-necitite" } : ecranDePornire(stare.raspunsuri),
  );
  const [salvareEsuata, setSalvareEsuata] = useState(false);
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
    const noua: StareSalvata = { ...ultima.current, raspunsuri };
    ultima.current = noua;
    setStare(noua);
    setSalvareEsuata(!stocare.salveaza(noua));
  };

  const avertizare = !stocare.persistenta
    ? "Răspunsurile nu pot fi salvate pe acest telefon. Rămân doar cât timp pagina este deschisă."
    : salvareEsuata
      ? "Ultimul răspuns nu a putut fi salvat pe telefon. Dacă închideți pagina, se poate pierde."
      : null;

  const cuAvertizare = (continut: preact.ComponentChildren) => (
    <>
      {avertizare ? (
        <p class="avertizare-salvare" role="status">
          {avertizare}
        </p>
      ) : null}
      {continut}
    </>
  );

  if (ecran.fel === "date-necitite") {
    return (
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
      </main>
    );
  }

  if (ecran.fel === "gata") {
    return cuAvertizare(
      <main class="ecran">
        <h1>Ați răspuns la toate întrebările</h1>
        <p>Planul dumneavoastră va apărea aici. Această parte a aplicației este încă în lucru.</p>
        <div class="spatiu" />
        <button type="button" class="buton" onClick={() => setEcran({ fel: "intrebare", index: 0 })}>
          Schimbați răspunsurile
        </button>
      </main>,
    );
  }

  const { index } = ecran;
  const intrebare = INTREBARI[index];
  if (intrebare === undefined) return null;

  const navigare: Navigare = {
    pozitie: { numar: index + 1, total: INTREBARI.length },
    onInapoi: index > 0 ? () => setEcran({ fel: "intrebare", index: index - 1 }) : undefined,
    onInainte: () => {
      if (index + 1 < INTREBARI.length) return setEcran({ fel: "intrebare", index: index + 1 });
      // Dupa ultima intrebare: la plan, sau inapoi la prima ramasa fara raspuns.
      setEcran(esteComplet(ultima.current.raspunsuri) ? { fel: "gata" } : ecranDePornire(ultima.current.raspunsuri));
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
