// Stocarea raspunsurilor in browserul telefonului. Nimic nu pleaca din telefon.
//
// Tot ce scrie aplicatia sta sub chei care incep cu PREFIX, ca "Stergeti tot"
// sa poata elimina totul, inclusiv ultima copie a cursurilor.

import type { PastrareCursuri } from "../cursuri/incarcare";
import { valideazaStare, type StareSalvata } from "./validare";

export const PREFIX = "ghid-economii:";
const CHEIE_STARE = `${PREFIX}stare`;
const CHEIE_CURSURI = `${PREFIX}cursuri`;

/** Se schimba cand forma datelor salvate se schimba. Datele cu alta versiune nu sunt citite. */
export const VERSIUNE = 2;

export type RezultatCitire =
  | { readonly fel: "lipsa" }
  | { readonly fel: "valida"; readonly stare: StareSalvata }
  | { readonly fel: "versiune-veche" }
  | { readonly fel: "stricata" };

export type Stocare = {
  /** false cand browserul nu permite salvarea (de exemplu in mod privat). Datele tin doar cat sesiunea. */
  readonly persistenta: boolean;
  citeste(): RezultatCitire;
  /** Intoarce false daca salvarea nu a reusit. */
  salveaza(stare: StareSalvata): boolean;
  /** Sterge raspunsurile, pasii bifati si copia cursurilor. */
  stergeTot(): void;
  readonly cursuri: PastrareCursuri;
};

/** Partea din interfata Storage a browserului de care are nevoie aplicatia. */
export type Depozit = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

/** Tine datele doar in memorie, cat timp este deschisa pagina. */
export function depozitInMemorie(): Depozit {
  const date = new Map<string, string>();
  return {
    get length() {
      return date.size;
    },
    getItem: (cheie) => date.get(cheie) ?? null,
    setItem: (cheie, valoare) => void date.set(cheie, valoare),
    removeItem: (cheie) => void date.delete(cheie),
    key: (index) => [...date.keys()][index] ?? null,
  };
}

/** Stocarea locala a browserului, sau null daca nu poate fi folosita. */
export function depozitulBrowserului(): Depozit | null {
  try {
    const depozit = globalThis.localStorage;
    const proba = `${PREFIX}proba`;
    depozit.setItem(proba, "1");
    depozit.removeItem(proba);
    return depozit;
  } catch {
    return null;
  }
}

export function creeazaStocare(depozitPersistent: Depozit | null = depozitulBrowserului()): Stocare {
  const depozit = depozitPersistent ?? depozitInMemorie();

  const scrie = (cheie: string, valoare: unknown): boolean => {
    try {
      depozit.setItem(cheie, JSON.stringify(valoare));
      return true;
    } catch {
      return false;
    }
  };

  const citesteJson = (cheie: string): { gasit: false } | { gasit: true; valoare: unknown; valid: boolean } => {
    let text: string | null;
    try {
      text = depozit.getItem(cheie);
    } catch {
      return { gasit: false };
    }
    if (text === null) return { gasit: false };
    try {
      return { gasit: true, valoare: JSON.parse(text) as unknown, valid: true };
    } catch {
      return { gasit: true, valoare: null, valid: false };
    }
  };

  return {
    persistenta: depozitPersistent !== null,

    citeste() {
      const citit = citesteJson(CHEIE_STARE);
      if (!citit.gasit) return { fel: "lipsa" };
      if (!citit.valid) return { fel: "stricata" };

      const date = citit.valoare;
      if (typeof date !== "object" || date === null || !("versiune" in date)) return { fel: "stricata" };
      if (typeof date.versiune !== "number") return { fel: "stricata" };
      if (date.versiune !== VERSIUNE) return { fel: "versiune-veche" };

      const stare = valideazaStare("stare" in date ? date.stare : undefined);
      return stare ? { fel: "valida", stare } : { fel: "stricata" };
    },

    salveaza(stare) {
      return scrie(CHEIE_STARE, { versiune: VERSIUNE, stare });
    },

    stergeTot() {
      const chei: string[] = [];
      for (let i = 0; i < depozit.length; i++) {
        const cheie = depozit.key(i);
        if (cheie !== null && cheie.startsWith(PREFIX)) chei.push(cheie);
      }
      for (const cheie of chei) depozit.removeItem(cheie);
    },

    cursuri: {
      citeste() {
        const citit = citesteJson(CHEIE_CURSURI);
        return citit.gasit && citit.valid ? citit.valoare : null;
      },
      scrie(cursuri) {
        scrie(CHEIE_CURSURI, cursuri);
      },
    },
  };
}
