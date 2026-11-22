// Parametrii de continut (specificatie, sectiunea 5). Sunt decizii ale
// proprietarului, nu ale aplicatiei. Hotarasc cand apare un pas in plan.
//
// Decisi de proprietar la 22.11.2026, pe baza unor recomandari pe care le-a
// cerut si le-a aprobat. Motivele, pe scurt:
//
//  - luniRezerva = 3
//      Pensia vine lunar, deci rezerva acopera o cheltuiala neasteptata, nu
//      pierderea venitului. La 6 luni pasul ar aparea aproape tuturor.
//      Nu exista o sursa oficiala pentru numarul de luni; este o conventie.
//
//  - pragNumerarAcasaLei = 5000
//      Peste cheltuielile unei luni pentru majoritatea pensionarilor, ca pasul
//      sa nu apara celor care tin acasa doar banii de trai. Este o estimare.
//
//  - marjaPlafonEur = 10000
//      Acopera diferenta dintre cursul zilei (folosit de FGDB) si media lunii
//      trecute (folosita de aplicatie), rotunjirea sumelor de catre om si
//      dobanda adunata. Pasul apare deci peste 90.000 euro la aceeasi banca.
//
//  - plafonGarantareEur = 100000
//      Nu este o alegere. Sursa: FGDB, pagina "Cat garantam",
//      https://fgdb.ro/cat-garantam/, citita la 22.11.2026
//      (vezi docs/verificari/2026-11-21-surse-oficiale.md).
//      Plafonul nu este afisat niciodata in aplicatie; omul il citeste la FGDB.
//      Verificarea lui se reface cel tarziu la 12 luni: dupa aceea, verificarea
//      de publicare refuza continutul, iar pasul apare in forma generala.

import type { Parametri } from "../domeniu/tipuri";
import type { ProvenientaParametri } from "./validare";

export const PARAMETRI: Parametri | null = {
  luniRezerva: 3,
  pragNumerarAcasaLei: 5000,
  plafonGarantareEur: 100000,
  marjaPlafonEur: 10000,
  plafonVerificatLa: "2026-11-22",
};

/** Cine a decis parametrii, cand, si sursa oficiala a plafonului. */
export const PROVENIENTA_PARAMETRI: ProvenientaParametri | null = {
  decisDe: "Proprietarul aplicației",
  decisLa: "2026-11-22",
  sursaPlafon: "FGDB, pagina „Cât garantăm”, https://fgdb.ro/cat-garantam/",
};
