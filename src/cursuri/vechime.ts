// Cand este media lunara "veche". Functie pura; urmeaza tabelul din
// specificatie, sectiunea 7 ("Cursul valutar").
//
// Fie P luna calendaristica dinaintea celei curente.
//   luna de referinta = P                      -> proaspata
//   luna dinaintea lui P, pana in ziua 10      -> proaspata (jobul poate sa nu fi rulat inca)
//   luna dinaintea lui P, dupa ziua 10         -> veche
//   mai veche                                  -> veche

export type StareCursuri = "proaspat" | "vechi";

/** Ultima zi din luna in care media lunii dinaintea lui P mai este acceptata fara avertizare. */
export const ZI_LIMITA = 10;

function indexLuna(an: number, luna: number): number {
  return an * 12 + (luna - 1);
}

/**
 * @param lunaReferinta luna mediei, in forma AAAA-LL
 * @param azi data de azi, in forma AAAA-LL-ZZ
 */
export function stareCursuri(lunaReferinta: string, azi: string): StareCursuri {
  const ref = /^(\d{4})-(\d{2})$/.exec(lunaReferinta);
  const data = /^(\d{4})-(\d{2})-(\d{2})$/.exec(azi);
  // O luna sau o data care nu pot fi citite nu pot fi socotite proaspete.
  if (!ref || !data) return "vechi";

  const referinta = indexLuna(Number(ref[1]), Number(ref[2]));
  const lunaPrecedenta = indexLuna(Number(data[1]), Number(data[2])) - 1;
  const zi = Number(data[3]);

  if (referinta >= lunaPrecedenta) return "proaspat";
  if (referinta === lunaPrecedenta - 1 && zi <= ZI_LIMITA) return "proaspat";
  return "vechi";
}
