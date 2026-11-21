// Ecranul unei intrebari din chestionar. O singura intrebare pe ecran.
// Raspunsul se salveaza cand este dat; "Inapoi" nu il pierde.

import { useState } from "preact/hooks";
import { LIPSA, type Datorie, type Raspunsuri } from "../domeniu/tipuri";
import type {
  IntrebareAlegere,
  IntrebareCheltuialaMare,
  IntrebareDaNu,
  IntrebareDatorii,
  IntrebareSuma,
  Optiune,
} from "../continut/intrebari";
import { MESAJ_EROARE } from "../chestionar/suma";
import { Cadru, type Pozitie } from "./Cadru";
import { CampSuma, citesteStare, stareDinSuma } from "./CampSuma";

export type Navigare = {
  readonly pozitie: Pozitie;
  readonly onInapoi?: (() => void) | undefined;
  readonly onInainte: () => void;
};

type Comun<I, V> = {
  readonly intrebare: I;
  readonly raspuns: V | undefined;
  /** undefined sterge raspunsul: intrebarea redevine fara raspuns. */
  readonly onRaspuns: (valoare: V | undefined) => void;
  readonly navigare: Navigare;
};

const ALEGETI = "Alegeți un răspuns, apoi apăsați „Mai departe”.";

function ButonOptiune<V>({ optiune, ales, onAlege }: { optiune: Optiune<V>; ales: boolean; onAlege: () => void }) {
  return (
    <button type="button" class="buton" aria-pressed={ales} onClick={onAlege}>
      {optiune.eticheta}
      {optiune.explicatie ? <small>{optiune.explicatie}</small> : null}
    </button>
  );
}

export function EcranSuma({ intrebare, raspuns, onRaspuns, navigare }: Comun<IntrebareSuma, Raspunsuri["venit"]>) {
  const [stare, setStare] = useState(() => stareDinSuma(raspuns, intrebare.monede[0] ?? "RON"));
  const [mesaj, setMesaj] = useState<string | null>(null);

  const inainte = () => {
    const citire = citesteStare(stare);
    if (citire.fel === "gol") return setMesaj(MESAJ_EROARE.gol);
    if (citire.fel === "eroare") return setMesaj(citire.mesaj);
    onRaspuns(citire.suma);
    navigare.onInainte();
  };
  // La "Inapoi", o suma scrisa corect se pastreaza; una neterminata nu blocheaza intoarcerea.
  const inapoi = navigare.onInapoi
    ? () => {
        const citire = citesteStare(stare);
        if (citire.fel === "suma") onRaspuns(citire.suma);
        navigare.onInapoi?.();
      }
    : undefined;

  return (
    <Cadru pozitie={navigare.pozitie} titlu={intrebare.titlu} indiciu={intrebare.indiciu} onInapoi={inapoi} onInainte={inainte} mesaj={mesaj}>
      <CampSuma
        id={`suma-${intrebare.cheie}`}
        eticheta="Suma"
        stare={stare}
        onSchimba={(s) => {
          setStare(s);
          setMesaj(null);
        }}
        monede={intrebare.monede}
        cuRefuz
      />
    </Cadru>
  );
}

export function EcranAlegere({ intrebare, raspuns, onRaspuns, navigare }: Comun<IntrebareAlegere, Raspunsuri["ramanBani"]>) {
  const [mesaj, setMesaj] = useState<string | null>(null);
  return (
    <Cadru
      pozitie={navigare.pozitie}
      titlu={intrebare.titlu}
      indiciu={intrebare.indiciu}
      onInapoi={navigare.onInapoi}
      onInainte={() => (raspuns === undefined ? setMesaj(ALEGETI) : navigare.onInainte())}
      mesaj={mesaj}
    >
      {intrebare.optiuni.map((o) => (
        <ButonOptiune
          optiune={o}
          ales={raspuns === o.valoare}
          onAlege={() => {
            onRaspuns(o.valoare);
            setMesaj(null);
          }}
        />
      ))}
    </Cadru>
  );
}

export function EcranDaNu({ intrebare, raspuns, onRaspuns, navigare }: Comun<IntrebareDaNu, boolean>) {
  const [mesaj, setMesaj] = useState<string | null>(null);
  const optiuni: readonly Optiune<boolean>[] = [
    { valoare: true, eticheta: "Da" },
    { valoare: false, eticheta: "Nu" },
  ];
  return (
    <Cadru
      pozitie={navigare.pozitie}
      titlu={intrebare.titlu}
      indiciu={intrebare.indiciu}
      onInapoi={navigare.onInapoi}
      onInainte={() => (raspuns === undefined ? setMesaj(ALEGETI) : navigare.onInainte())}
      mesaj={mesaj}
    >
      {optiuni.map((o) => (
        <ButonOptiune
          optiune={o}
          ales={raspuns === o.valoare}
          onAlege={() => {
            onRaspuns(o.valoare);
            setMesaj(null);
          }}
        />
      ))}
    </Cadru>
  );
}

/**
 * Intrebarea 4. Lista goala inseamna "Nu am datorii", ales anume.
 * Nicio alegere inseamna intrebare fara raspuns, nu "Nu".
 */
export function EcranDatorii({ intrebare, raspuns, onRaspuns, navigare }: Comun<IntrebareDatorii, readonly Datorie[]>) {
  const [mesaj, setMesaj] = useState<string | null>(null);

  const comuta = (d: Datorie) => {
    const acum = raspuns ?? [];
    const nou = acum.includes(d) ? acum.filter((x) => x !== d) : intrebare.optiuni.map((o) => o.valoare).filter((x) => x === d || acum.includes(x));
    onRaspuns(nou.length > 0 ? nou : undefined);
    setMesaj(null);
  };
  const faraDatorii = raspuns !== undefined && raspuns.length === 0;

  return (
    <Cadru
      pozitie={navigare.pozitie}
      titlu={intrebare.titlu}
      indiciu={intrebare.indiciu}
      onInapoi={navigare.onInapoi}
      onInainte={() => (raspuns === undefined ? setMesaj(ALEGETI) : navigare.onInainte())}
      mesaj={mesaj}
    >
      {intrebare.optiuni.map((o) => (
        <ButonOptiune optiune={o} ales={raspuns?.includes(o.valoare) ?? false} onAlege={() => comuta(o.valoare)} />
      ))}
      <ButonOptiune
        optiune={{ valoare: null, eticheta: intrebare.niciuna }}
        ales={faraDatorii}
        onAlege={() => {
          onRaspuns(faraDatorii ? undefined : []);
          setMesaj(null);
        }}
      />
    </Cadru>
  );
}

/** Intrebarea 6. Suma este optionala si mereu in lei; un camp gol inseamna suma nespusa. */
export function EcranCheltuialaMare({
  intrebare,
  raspuns,
  onRaspuns,
  navigare,
}: Comun<IntrebareCheltuialaMare, Raspunsuri["cheltuialaMare"]>) {
  const [stare, setStare] = useState(() => stareDinSuma(raspuns?.suma.fel === "suma" ? raspuns.suma : undefined, "RON"));
  const [mesaj, setMesaj] = useState<string | null>(null);
  const ales = raspuns?.raspuns;

  /** Suma de salvat, sau null daca ce este scris nu poate fi citit. */
  const sumaScrisa = () => {
    const citire = citesteStare(stare);
    if (citire.fel === "eroare") return null;
    return citire.fel === "suma" ? citire.suma : LIPSA;
  };

  const inainte = () => {
    if (ales === undefined) return setMesaj(ALEGETI);
    if (ales === "nu") {
      onRaspuns({ raspuns: "nu", suma: LIPSA });
      return navigare.onInainte();
    }
    const citire = citesteStare(stare);
    if (citire.fel === "eroare") return setMesaj(citire.mesaj);
    onRaspuns({ raspuns: ales, suma: citire.fel === "suma" ? citire.suma : LIPSA });
    navigare.onInainte();
  };

  const inapoi = navigare.onInapoi
    ? () => {
        const suma = sumaScrisa();
        if ((ales === "da" || ales === "poate") && suma !== null) onRaspuns({ raspuns: ales, suma });
        navigare.onInapoi?.();
      }
    : undefined;

  return (
    <Cadru pozitie={navigare.pozitie} titlu={intrebare.titlu} indiciu={intrebare.indiciu} onInapoi={inapoi} onInainte={inainte} mesaj={mesaj}>
      {intrebare.optiuni.map((o) => (
        <ButonOptiune
          optiune={o}
          ales={ales === o.valoare}
          onAlege={() => {
            onRaspuns({ raspuns: o.valoare, suma: o.valoare === "nu" ? LIPSA : (sumaScrisa() ?? LIPSA) });
            setMesaj(null);
          }}
        />
      ))}
      {ales === "da" || ales === "poate" ? (
        <CampSuma
          id="suma-cheltuiala-mare"
          eticheta={intrebare.etichetaSuma}
          stare={stare}
          onSchimba={(s) => {
            setStare(s);
            setMesaj(null);
          }}
          monede={["RON"]}
          cuRefuz={false}
        />
      ) : null}
    </Cadru>
  );
}
