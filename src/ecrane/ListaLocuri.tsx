// Intrebarea 5: lista locurilor in care omul are bani pusi deoparte.
// Trei ecrane: lista, alegerea felului de loc si detaliile unui loc.

import { useState } from "preact/hooks";
import type { BancaDinLista } from "../continut/banci";
import { FORME_DE_AUR, TIPURI_DE_LOC, etichetaTipului, type IntrebareLocuri } from "../continut/intrebari";
import { MESAJ_EROARE, formateazaNumar, formateazaSuma, interpreteazaSuma } from "../chestionar/suma";
import { afisareTotal, numeleLunii } from "../chestionar/total";
import { stareCursuri } from "../cursuri/vechime";
import { areRanduriNesocotite } from "../domeniu/marimi";
import type { Banca, Cursuri, FormaAur, Rand, TipRand } from "../domeniu/tipuri";
import { Cadru } from "./Cadru";
import { CampSuma, citesteStare, stareDinSuma, type StareSuma } from "./CampSuma";
import type { Navigare } from "./Intrebare";

type Proprietati = {
  readonly intrebare: IntrebareLocuri;
  /** undefined: fara raspuns. Lista goala: "Nu am bani pusi deoparte", ales anume. */
  readonly raspuns: readonly Rand[] | undefined;
  readonly onRaspuns: (locuri: readonly Rand[] | undefined) => void;
  readonly navigare: Navigare;
  /** undefined: cursurile inca se incarca. null: nu exista cursuri. */
  readonly cursuri: Cursuri | null | undefined;
  /** Data de azi, AAAA-LL-ZZ. */
  readonly azi: string;
  readonly banci: readonly BancaDinLista[];
};

type Mod = { readonly fel: "lista" } | { readonly fel: "tip" } | { readonly fel: "detalii"; readonly tip: TipRand; readonly index: number | null };

const ALTA_BANCA = "alta";
const MESAJ_GRAME = "Nu am înțeles câte grame. Scrieți doar cifre, de exemplu 50 sau 31,1.";

function numeleBancii(banca: Banca, banci: readonly BancaDinLista[]): string {
  if (banca.fel === "alta") return banca.nume;
  return banci.find((b) => b.id === banca.id)?.nume ?? "Bancă necunoscută";
}

function descriere(rand: Rand, banci: readonly BancaDinLista[]): { titlu: string; sub: string; suma: string } {
  const titlu = etichetaTipului(rand.tip);
  if (rand.tip === "aur") {
    const forma = FORME_DE_AUR.find((f) => f.valoare === rand.forma)?.eticheta ?? "";
    return { titlu, sub: `${forma}, nu intră în total`, suma: rand.grame === null ? "" : `${formateazaNumar(rand.grame)} grame` };
  }
  const suma = rand.suma.fel === "suma" ? formateazaSuma(rand.suma.valoare, rand.suma.moneda) : "sumă nespusă";
  if (rand.tip === "cont" || rand.tip === "depozit") return { titlu, sub: numeleBancii(rand.banca, banci), suma };
  if (rand.tip === "acasa") return { titlu, sub: "Numerar", suma };
  if (rand.tip === "titluri-de-stat") return { titlu, sub: "", suma };
  return { titlu, sub: "Nu intră în total", suma };
}

function Total({ locuri, cursuri: cursuriCitite, azi }: { locuri: readonly Rand[]; cursuri: Cursuri | null | undefined; azi: string }) {
  const cursuri = cursuriCitite ?? null;
  const total = afisareTotal(locuri, cursuri);
  // Cat timp cursurile se incarca, aplicatia nu spune ca nu au putut fi citite.
  if (cursuriCitite === undefined && total.fel === "pe-monede") return null;
  const nesocotite = areRanduriNesocotite(locuri) ? <small>Aurul și locurile trecute la „Altceva” sau „Nu știu sigur” nu sunt socotite.</small> : null;
  if (total.fel === "nimic") return null;

  if (total.fel === "suma-nespusa") {
    return (
      <div class="total">
        <small>Totalul nu poate fi calculat, fiindcă o sumă nu a fost spusă.</small>
      </div>
    );
  }
  if (total.fel === "pe-monede") {
    return (
      <div class="total">
        <small>Total orientativ, pe fiecare monedă</small>
        {total.sume.map(([moneda, suma]) => (
          <b>{formateazaSuma(suma, moneda)}</b>
        ))}
        <small>Cursul valutar nu a putut fi citit, așa că sumele nu au fost adunate în lei.</small>
        {nesocotite}
      </div>
    );
  }
  const vechi = total.cuValuta && cursuri !== null && stareCursuri(cursuri.lunaReferinta, azi) === "vechi";
  return (
    <div class="total">
      <small>Total orientativ</small>
      <b>aproximativ {formateazaSuma(Math.round(total.lei), "RON")}</b>
      {total.cuValuta && cursuri !== null ? <small>Valuta este socotită la cursul mediu BNR din {numeleLunii(cursuri.lunaReferinta)}.</small> : null}
      {vechi ? <small class="avertizare">Acest curs este vechi. Totalul poate fi diferit de cel de azi.</small> : null}
      {nesocotite}
    </div>
  );
}

type Ciorna = {
  readonly suma: StareSuma;
  /** "" inseamna ca nu s-a ales inca nicio banca. */
  readonly banca: string;
  readonly numeBanca: string;
  readonly forma: FormaAur | null;
  readonly grame: string;
};

function ciornaDin(rand: Rand | undefined, banci: readonly BancaDinLista[]): Ciorna {
  const goala: Ciorna = { suma: stareDinSuma(undefined, "RON"), banca: "", numeBanca: "", forma: null, grame: "" };
  if (rand === undefined) return goala;
  if (rand.tip === "aur") return { ...goala, forma: rand.forma, grame: rand.grame === null ? "" : formateazaNumar(rand.grame) };
  const cuSuma = { ...goala, suma: stareDinSuma(rand.suma, "RON") };
  if (rand.tip !== "cont" && rand.tip !== "depozit") return cuSuma;
  if (rand.banca.fel === "alta") return { ...cuSuma, banca: ALTA_BANCA, numeBanca: rand.banca.nume };
  const id = rand.banca.id;
  // O banca disparuta din lista trebuie aleasa din nou.
  return { ...cuSuma, banca: banci.some((b) => b.id === id) ? id : "" };
}

/** Randul de salvat, sau mesajul care spune ce lipseste. */
function randDin(tip: TipRand, c: Ciorna): { rand: Rand } | { mesaj: string } {
  if (tip === "aur") {
    if (c.forma === null) return { mesaj: "Alegeți ce fel de aur este." };
    const grame = interpreteazaSuma(c.grame);
    if (grame.fel === "eroare") return { mesaj: MESAJ_GRAME };
    return { rand: { tip, forma: c.forma, grame: grame.fel === "valoare" ? grame.valoare : null } };
  }
  const citire = citesteStare(c.suma);
  if (citire.fel === "gol") return { mesaj: MESAJ_EROARE.gol };
  if (citire.fel === "eroare") return { mesaj: citire.mesaj };
  if (tip !== "cont" && tip !== "depozit") return { rand: { tip, suma: citire.suma } };

  if (c.banca === "") return { mesaj: "Alegeți banca." };
  if (c.banca !== ALTA_BANCA) return { rand: { tip, suma: citire.suma, banca: { fel: "lista", id: c.banca } } };
  const nume = c.numeBanca.trim().replace(/\s+/g, " ");
  if (nume === "") return { mesaj: "Scrieți numele băncii." };
  return { rand: { tip, suma: citire.suma, banca: { fel: "alta", nume } } };
}

function Detalii({
  tip,
  initial,
  banci,
  navigare,
  onSalveaza,
  onSterge,
  onRenunta,
}: {
  tip: TipRand;
  initial: Rand | undefined;
  banci: readonly BancaDinLista[];
  navigare: Navigare;
  onSalveaza: (rand: Rand) => void;
  onSterge: (() => void) | undefined;
  onRenunta: () => void;
}) {
  const [ciorna, setCiorna] = useState(() => ciornaDin(initial, banci));
  const [mesaj, setMesaj] = useState<string | null>(null);
  const schimba = (parte: Partial<Ciorna>) => {
    setCiorna({ ...ciorna, ...parte });
    setMesaj(null);
  };
  const salveaza = () => {
    const rezultat = randDin(tip, ciorna);
    if ("mesaj" in rezultat) setMesaj(rezultat.mesaj);
    else onSalveaza(rezultat.rand);
  };
  const tipul = TIPURI_DE_LOC.find((t) => t.valoare === tip);
  const grame = interpreteazaSuma(ciorna.grame);

  return (
    <Cadru
      pozitie={navigare.pozitie}
      titlu={tipul?.eticheta ?? tip}
      indiciu={tipul?.explicatie}
      onInapoi={onRenunta}
      onInainte={salveaza}
      etichetaInapoi="Renunțați"
      etichetaInainte="Salvați"
      mesaj={mesaj}
    >
      {tip === "aur" ? (
        <>
          {FORME_DE_AUR.map((f) => (
            <button type="button" class="buton" aria-pressed={ciorna.forma === f.valoare} onClick={() => schimba({ forma: f.valoare })}>
              {f.eticheta}
            </button>
          ))}
          <div class="camp">
            <label for="grame">Câte grame? Puteți lăsa gol.</label>
            <input id="grame" type="text" inputMode="decimal" autocomplete="off" value={ciorna.grame} onInput={(e) => schimba({ grame: e.currentTarget.value })} />
            <p class="inteles" aria-live="polite">
              {grame.fel === "valoare" ? `Am înțeles: ${formateazaNumar(grame.valoare)} grame` : " "}
            </p>
          </div>
          <p class="indiciu">Aplicația notează aurul, dar nu îi socotește valoarea în bani.</p>
        </>
      ) : (
        <CampSuma id="suma-loc" eticheta="Suma" stare={ciorna.suma} onSchimba={(suma) => schimba({ suma })} monede={["RON", "EUR", "USD", "GBP"]} cuRefuz />
      )}
      {tip === "cont" || tip === "depozit" ? (
        <div class="camp">
          <label for="banca">La ce bancă?</label>
          <select id="banca" value={ciorna.banca} onChange={(e) => schimba({ banca: e.currentTarget.value })}>
            <option value="">Alegeți banca</option>
            {banci.map((b) => (
              <option value={b.id}>{b.nume}</option>
            ))}
            <option value={ALTA_BANCA}>Altă bancă</option>
          </select>
          {ciorna.banca === ALTA_BANCA ? (
            <>
              <label for="nume-banca">Numele băncii</label>
              <input id="nume-banca" type="text" autocomplete="off" value={ciorna.numeBanca} onInput={(e) => schimba({ numeBanca: e.currentTarget.value })} />
            </>
          ) : null}
        </div>
      ) : null}
      {onSterge ? (
        <button type="button" class="buton punctat" onClick={onSterge}>
          Ștergeți acest loc
        </button>
      ) : null}
    </Cadru>
  );
}

export function ListaLocuri({ intrebare, raspuns, onRaspuns, navigare, cursuri, azi, banci }: Proprietati) {
  const [mod, setMod] = useState<Mod>({ fel: "lista" });
  const [mesaj, setMesaj] = useState<string | null>(null);
  const locuri = raspuns ?? [];
  const laLista = () => setMod({ fel: "lista" });

  if (mod.fel === "tip") {
    return (
      <Cadru pozitie={navigare.pozitie} titlu="Ce fel de loc este?" onInapoi={laLista} etichetaInapoi="Renunțați">
        {TIPURI_DE_LOC.map((t) => (
          <button type="button" class="buton" onClick={() => setMod({ fel: "detalii", tip: t.valoare, index: null })}>
            {t.eticheta}
            {t.explicatie ? <small>{t.explicatie}</small> : null}
          </button>
        ))}
      </Cadru>
    );
  }

  if (mod.fel === "detalii") {
    const { index, tip } = mod;
    return (
      <Detalii
        tip={tip}
        initial={index === null ? undefined : locuri[index]}
        banci={banci}
        navigare={navigare}
        onRenunta={laLista}
        onSalveaza={(rand) => {
          onRaspuns(index === null ? [...locuri, rand] : locuri.map((r, i) => (i === index ? rand : r)));
          laLista();
        }}
        onSterge={
          index === null
            ? undefined
            : () => {
                const ramase = locuri.filter((_, i) => i !== index);
                // Dupa stergerea ultimului loc, intrebarea redevine fara raspuns.
                onRaspuns(ramase.length > 0 ? ramase : undefined);
                laLista();
              }
        }
      />
    );
  }

  const nimicDeoparte = raspuns !== undefined && raspuns.length === 0;
  return (
    <Cadru
      pozitie={navigare.pozitie}
      titlu={intrebare.titlu}
      indiciu={intrebare.indiciu}
      onInapoi={navigare.onInapoi}
      onInainte={() => (raspuns === undefined ? setMesaj("Adăugați un loc sau alegeți „Nu am bani puși deoparte”.") : navigare.onInainte())}
      mesaj={mesaj}
    >
      {locuri.map((rand, index) => {
        const d = descriere(rand, banci);
        return (
          <button type="button" class="buton loc" aria-label={`Schimbați: ${d.titlu} ${d.suma}`} onClick={() => setMod({ fel: "detalii", tip: rand.tip, index })}>
            <span class="nume">
              {d.titlu}
              {d.sub ? <small>{d.sub}</small> : null}
            </span>
            <span class="cat">{d.suma}</span>
          </button>
        );
      })}
      <button
        type="button"
        class="buton punctat"
        onClick={() => {
          setMesaj(null);
          setMod({ fel: "tip" });
        }}
      >
        {locuri.length > 0 ? "+ Adăugați alt loc" : "+ Adăugați un loc"}
      </button>
      {locuri.length === 0 ? (
        <button
          type="button"
          class="buton"
          aria-pressed={nimicDeoparte}
          onClick={() => {
            onRaspuns(nimicDeoparte ? undefined : []);
            setMesaj(null);
          }}
        >
          Nu am bani puși deoparte
        </button>
      ) : null}
      <Total locuri={locuri} cursuri={cursuri} azi={azi} />
    </Cadru>
  );
}
