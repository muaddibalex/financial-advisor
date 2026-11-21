// Cadrul comun al ecranelor din chestionar: unde suntem, titlul, continutul
// si cele doua butoane de jos, mereu in acelasi loc.

import type { ComponentChildren } from "preact";

export type Pozitie = { readonly numar: number; readonly total: number };

type Proprietati = {
  readonly pozitie: Pozitie;
  readonly titlu: string;
  readonly indiciu?: string | undefined;
  readonly children: ComponentChildren;
  /** Lipseste la prima intrebare. */
  readonly onInapoi?: (() => void) | undefined;
  /** Lipseste pe ecranele unde alegerea insasi duce mai departe. */
  readonly onInainte?: (() => void) | undefined;
  readonly etichetaInapoi?: string;
  readonly etichetaInainte?: string;
  /** Ce lipseste ca sa se poata merge mai departe. */
  readonly mesaj?: string | null;
};

export function Cadru({
  pozitie,
  titlu,
  indiciu,
  children,
  onInapoi,
  onInainte,
  etichetaInapoi = "Înapoi",
  etichetaInainte = "Mai departe",
  mesaj,
}: Proprietati) {
  const procent = Math.round((pozitie.numar / pozitie.total) * 100);
  return (
    <main class="ecran">
      <p class="pozitie">
        Întrebarea <b>{pozitie.numar} din {pozitie.total}</b>
      </p>
      <div class="progres" aria-hidden="true">
        <i style={{ width: `${procent}%` }} />
      </div>
      <h1>{titlu}</h1>
      {indiciu ? <p class="indiciu">{indiciu}</p> : null}
      {children}
      <div class="spatiu" />
      <p class="mesaj" role="alert">
        {mesaj ?? ""}
      </p>
      <div class="navigare">
        {onInapoi ? (
          <button type="button" class="buton inapoi" onClick={onInapoi}>
            {etichetaInapoi}
          </button>
        ) : (
          <span class="inapoi" />
        )}
        {onInainte ? (
          <button type="button" class="buton principal" onClick={onInainte}>
            {etichetaInainte}
          </button>
        ) : null}
      </div>
    </main>
  );
}
