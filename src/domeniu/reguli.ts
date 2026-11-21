// Motorul de reguli: raspunsuri + cursuri + parametri + data de azi -> pasi.
// Functie pura. Urmeaza catalogul din specificatie, sectiunea 5.
//
// Un pas care depinde de un calcul are doua forme:
//  - "calculata": calculul s-a putut face si a declansat pasul;
//  - "generala":  calculul nu s-a putut face (suma nespusa, lipsa cursuri,
//                 plafon neverificat), iar pasul apare fara sume.
// Aplicatia nu ascunde un pas doar pentru ca nu il poate calcula.

import {
  TIPURI_IN_TOTAL,
  baniAccesibili,
  baniPesteRezerva,
  numerarAcasa,
  rezervaTinta,
  sumePeBanci,
} from "./marimi";
import type { Cursuri, IdPas, Parametri, Pas, Raspunsuri } from "./tipuri";

/** Ordinea prioritatii. Frauda este mereu prima, situatia neacoperita mereu ultima. */
export const ORDINEA_PASILOR: readonly IdPas[] = [
  "frauda",
  "luna-nu-se-inchide",
  "datorii-scumpe",
  "bani-pentru-urgente",
  "cheltuiala-apropiata",
  "bani-in-casa",
  "o-singura-banca",
  "bani-peste-rezerva",
  "alta-moneda",
  "aur",
  "produse-neintelese",
  "ordine-in-acte",
  "girant",
  "situatie-neacoperita",
];

type Forma = Pas["forma"] | null;

/** Plafonul este socotit vechi daca verificarea lui a trecut de 12 luni. Datele sunt AAAA-LL-ZZ. */
export function plafonulEsteVechi(plafonVerificatLa: string, azi: string): boolean {
  const an = Number(plafonVerificatLa.slice(0, 4));
  const limita = `${String(an + 1).padStart(4, "0")}${plafonVerificatLa.slice(4)}`;
  return azi > limita;
}

function baniPentruUrgente(r: Raspunsuri, cursuri: Cursuri | null, p: Parametri): Forma {
  const accesibili = baniAccesibili(r.locuri, cursuri);
  const rezerva = rezervaTinta(r.cheltuieli, p.luniRezerva, cursuri);
  if (accesibili.fel === "lipsa" || rezerva.fel === "lipsa") return "generala";
  return accesibili.lei < rezerva.lei ? "calculata" : null;
}

function baniInCasa(r: Raspunsuri, cursuri: Cursuri | null, p: Parametri): Forma {
  // Lipsa apare doar daca exista un rand "Acasa" a carui suma nu poate fi socotita.
  const acasa = numerarAcasa(r.locuri, cursuri);
  if (acasa.fel === "lipsa") return "generala";
  return acasa.lei > p.pragNumerarAcasaLei ? "calculata" : null;
}

function oSinguraBanca(r: Raspunsuri, cursuri: Cursuri | null, p: Parametri, azi: string): Forma {
  const banci = sumePeBanci(r.locuri, cursuri);
  if (banci.length === 0) return null;

  // Pragul in lei nu se poate calcula fara cursul euro sau cu un plafon neverificat la timp.
  const pragLei =
    cursuri === null || plafonulEsteVechi(p.plafonVerificatLa, azi)
      ? null
      : (p.plafonGarantareEur - p.marjaPlafonEur) * cursuri.leiPe.EUR;

  let necunoscut = false;
  for (const { suma } of banci) {
    if (pragLei === null || suma.fel === "lipsa") necunoscut = true;
    else if (suma.lei > pragLei) return "calculata";
  }
  // Cand nu se poate calcula, pasul apare doar daca toti banii din banca sunt la o singura banca.
  return necunoscut && banci.length === 1 ? "generala" : null;
}

function baniPesteRezervaForma(r: Raspunsuri, cursuri: Cursuri | null, p: Parametri): Forma {
  // Fara niciun rand care intra in total nu exista "bani peste rezerva", nici in forma generala.
  if (!r.locuri.some((rand) => TIPURI_IN_TOTAL.includes(rand.tip))) return null;
  const peste = baniPesteRezerva(r, p.luniRezerva, cursuri);
  if (peste.fel === "lipsa") return "generala";
  return peste.lei > 0 ? "calculata" : null;
}

function areAltaMoneda(r: Raspunsuri): boolean {
  return r.locuri.some((rand) => rand.tip !== "aur" && rand.suma.fel === "suma" && rand.suma.moneda !== "RON");
}

const simplu = (conditie: boolean): Forma => (conditie ? "calculata" : null);

/**
 * Intoarce pasii care se aplica, in ordinea prioritatii.
 * Lista goala inseamna ca din raspunsuri nu a reiesit niciun pas; nu inseamna ca "totul este in ordine".
 * Datoriile la banca si catre persoane nu produc niciun pas in prima versiune.
 */
export function calculeazaPasi(r: Raspunsuri, cursuri: Cursuri | null, p: Parametri, azi: string): readonly Pas[] {
  const forme: Record<IdPas, Forma> = {
    frauda: simplu(r.contactSuspect),
    "luna-nu-se-inchide": simplu(r.ramanBani === "nu-se-termina" || r.ramanBani === "nu-ajung"),
    "datorii-scumpe": simplu(r.datorii.includes("ifn") || r.datorii.includes("card")),
    "bani-pentru-urgente": baniPentruUrgente(r, cursuri, p),
    "cheltuiala-apropiata": simplu(r.cheltuialaMare.raspuns !== "nu"),
    "bani-in-casa": baniInCasa(r, cursuri, p),
    "o-singura-banca": oSinguraBanca(r, cursuri, p, azi),
    "bani-peste-rezerva": baniPesteRezervaForma(r, cursuri, p),
    "alta-moneda": simplu(areAltaMoneda(r)),
    aur: simplu(r.locuri.some((rand) => rand.tip === "aur")),
    "produse-neintelese": simplu(r.locuri.some((rand) => rand.tip === "altceva" || rand.tip === "nu-stiu-sigur")),
    "ordine-in-acte": simplu(!r.stieCineva),
    girant: simplu(r.girant),
    "situatie-neacoperita": simplu(r.altaSituatie),
  };

  const pasi: Pas[] = [];
  for (const id of ORDINEA_PASILOR) {
    const forma = forme[id];
    if (forma !== null) pasi.push({ id, forma });
  }
  return pasi;
}
