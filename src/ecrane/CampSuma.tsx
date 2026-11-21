// Campul in care omul scrie o suma. Arata inapoi ce a inteles aplicatia,
// ca o greseala de scriere sa fie vazuta inainte de a merge mai departe.

import { LIPSA, type Moneda, type Suma } from "../domeniu/tipuri";
import { MESAJ_EROARE, NUME_MONEDA, formateazaNumar, formateazaSuma, interpreteazaSuma } from "../chestionar/suma";

export type StareSuma = { readonly text: string; readonly moneda: Moneda; readonly refuz: boolean };

export function stareDinSuma(suma: Suma | undefined, monedaImplicita: Moneda): StareSuma {
  if (suma === undefined) return { text: "", moneda: monedaImplicita, refuz: false };
  if (suma.fel === "lipsa") return { text: "", moneda: monedaImplicita, refuz: true };
  return { text: formateazaNumar(suma.valoare), moneda: suma.moneda, refuz: false };
}

export type Citire =
  | { readonly fel: "suma"; readonly suma: Suma }
  | { readonly fel: "gol" }
  | { readonly fel: "eroare"; readonly mesaj: string };

/** Ce a raspuns omul. "Prefer sa nu spun" vine doar din buton, niciodata dintr-un camp gol. */
export function citesteStare(stare: StareSuma): Citire {
  if (stare.refuz) return { fel: "suma", suma: LIPSA };
  const rezultat = interpreteazaSuma(stare.text);
  if (rezultat.fel === "gol") return { fel: "gol" };
  if (rezultat.fel === "eroare") return { fel: "eroare", mesaj: MESAJ_EROARE[rezultat.motiv] };
  return { fel: "suma", suma: { fel: "suma", valoare: rezultat.valoare, moneda: stare.moneda } };
}

type Proprietati = {
  readonly id: string;
  readonly eticheta: string;
  readonly stare: StareSuma;
  readonly onSchimba: (stare: StareSuma) => void;
  readonly monede: readonly Moneda[];
  /** Arata butonul "Prefer sa nu spun". */
  readonly cuRefuz: boolean;
};

export function CampSuma({ id, eticheta, stare, onSchimba, monede, cuRefuz }: Proprietati) {
  const citire = citesteStare(stare);
  const inteles = citire.fel === "suma" && citire.suma.fel === "suma" ? formateazaSuma(citire.suma.valoare, citire.suma.moneda) : null;

  return (
    <div class="camp">
      <label for={id}>{eticheta}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autocomplete="off"
        value={stare.text}
        onInput={(e) => onSchimba({ ...stare, text: e.currentTarget.value, refuz: false })}
      />
      {monede.length > 1 ? (
        <div class="monede" role="group" aria-label="Moneda">
          {monede.map((m) => (
            <button
              type="button"
              class="buton mic"
              aria-pressed={stare.moneda === m}
              onClick={() => onSchimba({ ...stare, moneda: m })}
            >
              {NUME_MONEDA[m]}
            </button>
          ))}
        </div>
      ) : null}
      <p class="inteles" aria-live="polite">
        {inteles !== null ? `Am înțeles: ${inteles}` : " "}
      </p>
      {cuRefuz ? (
        <button
          type="button"
          class="buton punctat"
          aria-pressed={stare.refuz}
          onClick={() => onSchimba({ ...stare, text: "", refuz: !stare.refuz })}
        >
          Prefer să nu spun
        </button>
      ) : null}
    </div>
  );
}
