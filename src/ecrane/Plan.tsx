// Ecranul planului: pasii in ordinea prioritatii, cu frauda mereu prima.
// Contine si varianta de tiparit, vizibila doar pe hartie.

import { numeleLunii } from "../chestionar/total";
import { PASI } from "../continut/pasi";
import type { Cursuri, IdPas } from "../domeniu/tipuri";
import { constatarile, dataRomaneasca, type Plan as PlanCalculat } from "../plan/plan";

type Proprietati = {
  readonly plan: PlanCalculat;
  readonly cursuri: Cursuri | null;
  /** Data de azi, AAAA-LL-ZZ. */
  readonly azi: string;
  readonly inCiorna: boolean;
  readonly onDeschide: (id: IdPas) => void;
  readonly onSchimba: () => void;
  readonly onTipareste: () => void;
};

/** Textul comun tuturor pasilor. Este text de interfata, nu textul unui pas. */
export const NU_ALEGE = "Aplicația nu vă spune ce să alegeți. Hotărâți dumneavoastră, fără grabă.";
export const VERSIUNE_DE_PROBA = "Versiune de probă. Nu toate textele sunt verificate.";

function titlul(plan: PlanCalculat): string {
  if (plan.pasi.length === 0) return "Din răspunsuri nu a reieșit niciun pas de făcut";
  if (plan.ramase === 0) return "Ați bifat toți pașii";
  return plan.ramase === 1 ? "Aveți un pas de făcut" : `Aveți ${plan.ramase} pași de făcut`;
}

function subTitlu(plan: PlanCalculat): string {
  // Niciunul dintre aceste texte nu spune ca situatia omului este buna.
  if (plan.pasi.length === 0) return "Aplicația verifică doar câteva lucruri de bază și nu vă cunoaște toată situația.";
  if (plan.ramase === 0) return "Bifele arată ce ați spus dumneavoastră că ați făcut. Aplicația nu verifică.";
  // Cu o avertizare de frauda deasupra, planul nu spune ca "nu este nicio graba".
  if (plan.pasi.some((p) => p.id === "frauda")) return "Citiți întâi avertizarea de sus. Pe ceilalți îi puteți lua pe rând.";
  return "Luați-i pe rând. Nu este nicio grabă.";
}

function AvertizareCurs({ plan, cursuri }: { plan: PlanCalculat; cursuri: Cursuri | null }) {
  if (plan.curs === "vechi" && cursuri !== null) {
    return (
      <p class="caseta atentie" role="note">
        Cursul valutar folosit este cel din {numeleLunii(cursuri.lunaReferinta)} și este vechi. Socotelile în lei pot fi diferite de cele de azi.
      </p>
    );
  }
  if (plan.curs === "lipsa") {
    return (
      <p class="caseta atentie" role="note">
        Cursul valutar nu a putut fi citit. Pașii care depind de el apar fără socoteli.
      </p>
    );
  }
  return null;
}

/** Varianta de tiparit: pasii cu explicatiile lor si data. Fara nicio suma si fara nume de banci. */
function DeTiparit({ plan, azi, inCiorna }: { plan: PlanCalculat; azi: string; inCiorna: boolean }) {
  return (
    <section class="doar-tipar" data-testid="de-tiparit" hidden>
      <h1>Planul dumneavoastră</h1>
      <p>Întocmit la {dataRomaneasca(azi)}, din răspunsurile date în aplicație.</p>
      {inCiorna ? <p>{VERSIUNE_DE_PROBA}</p> : null}
      {plan.pasi.length === 0 ? (
        <>
          <p>{titlul(plan)}.</p>
          <p>{subTitlu(plan)}</p>
        </>
      ) : null}
      {plan.pasi.map((pas) => {
        const c = PASI[pas.id];
        return (
          <article>
            <h2>
              {pas.numar === null ? "Atenție: " : `${pas.numar}. `}
              {c.titlu}
              {pas.facut ? " (bifat ca făcut)" : ""}
            </h2>
            <p>
              <b>De ce contează. </b>
              {c.deCe}
            </p>
            <p>
              <b>Ce puteți face</b>
            </p>
            <ul>
              {c.cePutetiFace.map((rand) => (
                <li>{rand}</li>
              ))}
            </ul>
            {c.link ? (
              <p>
                {c.link.eticheta}: {c.link.adresa}. {c.link.ceSaCautati}
              </p>
            ) : null}
            {c.sursa ? (
              <p class="sursa">
                Sursa: {c.sursa}. Verificat la: {c.verificatLa ? dataRomaneasca(c.verificatLa) : "-"}
              </p>
            ) : null}
          </article>
        );
      })}
      <p>
        <b>{NU_ALEGE}</b>
      </p>
    </section>
  );
}

export function Plan({ plan, cursuri, azi, inCiorna, onDeschide, onSchimba, onTipareste }: Proprietati) {
  const constatari = constatarile(plan);
  const pasButon = (pas: PlanCalculat["pasi"][number]) => {
    const c = PASI[pas.id];
    const clasa = pas.numar === null ? "buton pas urgent" : pas.facut ? "buton pas facut" : "buton pas";
    return (
      <button type="button" class={clasa} key={pas.id} onClick={() => onDeschide(pas.id)}>
        <span class="numar" aria-hidden="true">
          {pas.numar ?? "!"}
        </span>
        <span>
          {c.titlu}
          <small>{pas.facut ? "Făcut" : c.peScurt}</small>
        </span>
      </button>
    );
  };
  return (
    <>
      <main class="ecran fara-tipar">
        <p class="pozitie">
          <b>Planul dumneavoastră</b>
        </p>
        {inCiorna ? <p class="caseta atentie">{VERSIUNE_DE_PROBA}</p> : null}
        <h1>{titlul(plan)}</h1>
        <p class="indiciu">{subTitlu(plan)}</p>
        <AvertizareCurs plan={plan} cursuri={cursuri} />
        {/* Avertizarea de frauda ramane prima, deasupra blocului de constatari. */}
        {plan.pasi.filter((pas) => pas.id === "frauda").map(pasButon)}
        {constatari.length > 0 ? (
          <section class="caseta constatari" aria-label="Ce am văzut în răspunsurile dumneavoastră">
            <b>Ce am văzut în răspunsurile dumneavoastră</b>
            <ul>
              {constatari.map((c) => (
                <li>{c.text}</li>
              ))}
            </ul>
            <p class="indiciu">La fiecare pas de mai jos scrie ce puteți face. Hotărârea este a dumneavoastră.</p>
          </section>
        ) : null}
        {plan.pasi.filter((pas) => pas.id !== "frauda").map(pasButon)}
        <div class="spatiu" />
        {plan.pasi.length > 0 ? (
          <button type="button" class="buton" onClick={onTipareste}>
            Tipăriți planul
          </button>
        ) : null}
        <button type="button" class="buton" onClick={onSchimba}>
          Schimbați răspunsurile
        </button>
      </main>
      <DeTiparit plan={plan} azi={azi} inCiorna={inCiorna} />
    </>
  );
}
