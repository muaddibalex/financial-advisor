// Ecranele permanente: "Siguranta" si "Stergeti tot", plus butoanele din
// subsol prin care se ajunge la ele de pe orice ecran.
//
// Textul ecranului "Siguranta" a fost aprobat de proprietar la 22.11.2026.
// Nu contine numere de telefon: numarul 1911 al DNSC nu a putut fi verificat
// pentru inselatoriile prin telefon (vezi docs/verificari).

import { useState } from "preact/hooks";

export function Subsol({ onSiguranta, onSterge }: { onSiguranta: () => void; onSterge: () => void }) {
  return (
    <nav class="subsol fara-tipar" aria-label="Siguranță și date">
      <button type="button" class="buton" onClick={onSiguranta}>
        Siguranță
      </button>
      <button type="button" class="buton" onClick={onSterge}>
        Ștergeți tot
      </button>
    </nav>
  );
}

export function Siguranta({ onInapoi }: { onInapoi: () => void }) {
  return (
    <main class="ecran">
      <h1>Siguranță</h1>
      <div class="caseta">
        <b>Ce nu vă cere niciodată aplicația</b>
        <ul>
          <li>Parole sau coduri PIN.</li>
          <li>Coduri primite prin SMS.</li>
          <li>Numărul cardului sau alte date de pe card.</li>
          <li>Codul numeric personal sau numere de cont.</li>
        </ul>
        <p>Dacă o pagină care seamănă cu aceasta vă cere așa ceva, închideți-o.</p>
      </div>
      <div class="caseta pericol">
        <b>Semne că cineva încearcă să vă înșele</b>
        <ul>
          <li>Vă grăbește: „acum, altfel pierdeți banii”.</li>
          <li>Vă cere coduri, parole sau datele cardului.</li>
          <li>Vă cere să mutați banii într-un „cont sigur”.</li>
          <li>Vă promite un câștig sigur și mare.</li>
          <li>Vă cere să nu spuneți nimănui.</li>
        </ul>
      </div>
      <div class="caseta">
        <b>Ce puteți face</b>
        <ul>
          <li>Închideți telefonul. Nu sunteți nepoliticos.</li>
          <li>Sunați dumneavoastră banca, la numărul scris pe card.</li>
          <li>Dacă ați spus deja coduri sau datele cardului, cereți băncii să blocheze cardul.</li>
          <li>Vorbiți cu cineva de încredere înainte de a face orice.</li>
        </ul>
      </div>
      <div class="caseta">
        <b>Unde stau răspunsurile dumneavoastră</b>
        <p>Doar pe acest telefon. Aplicația nu le trimite nicăieri.</p>
      </div>
      <div class="spatiu" />
      <button type="button" class="buton principal" onClick={onInapoi}>
        Înapoi
      </button>
    </main>
  );
}

export function StergeTot({ onSterge, onRenunta }: { onSterge: () => void; onRenunta: () => void }) {
  const [confirmare, setConfirmare] = useState(false);
  return (
    <main class="ecran">
      <h1>{confirmare ? "Sigur ștergeți tot?" : "Ștergeți tot"}</h1>
      {confirmare ? (
        <p>Răspunsurile și bifele nu mai pot fi aduse înapoi. Va trebui să răspundeți din nou la întrebări.</p>
      ) : (
        <>
          <p>De pe acest telefon se șterg toate răspunsurile dumneavoastră, bifele de la pași și cursul valutar păstrat.</p>
          <p>Un plan deja tipărit pe hârtie rămâne la dumneavoastră.</p>
        </>
      )}
      <div class="spatiu" />
      {confirmare ? (
        <button type="button" class="buton" onClick={onSterge}>
          Da, ștergeți tot
        </button>
      ) : (
        <button type="button" class="buton" onClick={() => setConfirmare(true)}>
          Ștergeți tot
        </button>
      )}
      <button type="button" class="buton principal" onClick={onRenunta}>
        {confirmare ? "Nu, păstrați" : "Înapoi"}
      </button>
    </main>
  );
}
