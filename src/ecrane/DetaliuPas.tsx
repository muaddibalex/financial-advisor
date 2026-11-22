// Detaliul unui pas: de ce conteaza, ce se poate face, unde se verifica oficial.

import { PASI } from "../continut/pasi";
import { dataRomaneasca, sePoateBifa, type PasInPlan } from "../plan/plan";
import { NU_ALEGE, VERSIUNE_DE_PROBA } from "./Plan";

type Proprietati = {
  readonly pas: PasInPlan;
  /** Cifrele din raspunsurile omului care au dus la acest pas. Goala in forma generala. */
  readonly cifre: readonly string[];
  readonly onInapoi: () => void;
  readonly onBifeaza: (facut: boolean) => void;
};

export function DetaliuPas({ pas, cifre, onInapoi, onBifeaza }: Proprietati) {
  const c = PASI[pas.id];
  return (
    <main class="ecran">
      <p class="pozitie">{pas.numar === null ? <b>Atenție</b> : <>Pasul <b>{pas.numar}</b></>}</p>
      {c.ciorna ? <p class="caseta atentie">{VERSIUNE_DE_PROBA}</p> : null}
      <h1>{c.titlu}</h1>
      <div class={pas.numar === null ? "caseta pericol" : "caseta"}>
        <b>De ce contează</b>
        <p>{c.deCe}</p>
      </div>
      {cifre.length > 0 ? (
        <div class="caseta">
          <b>Din răspunsurile dumneavoastră</b>
          {cifre.map((rand) => (
            <p>{rand}</p>
          ))}
        </div>
      ) : null}
      {pas.forma === "generala" ? (
        <p class="indiciu">Aplicația nu a putut face socoteala pentru dumneavoastră, așa că pasul apare fără sume.</p>
      ) : null}
      <div class="caseta">
        <b>Ce puteți face</b>
        <ul>
          {c.cePutetiFace.map((rand) => (
            <li>{rand}</li>
          ))}
        </ul>
      </div>
      <p class="caseta atentie">{NU_ALEGE}</p>
      {c.link ? (
        <>
          <a class="buton principal" href={c.link.adresa} target="_blank" rel="noopener noreferrer">
            {c.link.eticheta}
          </a>
          <p class="indiciu">{c.link.ceSaCautati}</p>
        </>
      ) : c.faraLink === undefined ? (
        <p class="indiciu">Linkul către pagina oficială urmează să fie adăugat.</p>
      ) : c.sursa === null ? (
        <p class="indiciu">Acesta este un sfat general de organizare. Nu vine dintr-o sursă oficială.</p>
      ) : null}
      <div class="spatiu" />
      {sePoateBifa(pas.id) ? (
        <button type="button" class="buton" aria-pressed={pas.facut} onClick={() => onBifeaza(!pas.facut)}>
          Am făcut acest pas
          {pas.facut ? <small>Apăsați din nou ca să scoateți bifa</small> : null}
        </button>
      ) : null}
      <button type="button" class="buton principal" onClick={onInapoi}>
        Înapoi la plan
      </button>
      <p class="sursa">
        {c.sursa
          ? `Sursa: ${c.sursa}. Verificat la: ${c.verificatLa ? dataRomaneasca(c.verificatLa) : "-"}`
          : c.faraLink === undefined
            ? "Sursa: text în lucru, neverificat."
            : "Sfat general, fără sursă oficială."}
      </p>
    </main>
  );
}
