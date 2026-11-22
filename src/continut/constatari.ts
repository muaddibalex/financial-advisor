// Blocul "Ce am văzut în răspunsurile dumneavoastră" de pe ecranul planului.
//
// Cate o constatare pentru fiecare pas care se aplica. Sunt observatii neutre
// despre ce a spus omul sau ce a vazut aplicatia. Niciuna nu spune ca situatia
// este buna sau rea, niciuna nu indeamna, nu numeste produse si nu pune sume:
// ce poate face omul in continuare sta la fiecare pas, la "Ce puteti face".
//
// Constatarea unui pas apare doar cand pasul este in forma calculata (vezi
// constatarile() din src/plan/plan.ts). Un pas in forma generala nu a putut fi
// socotit, asa ca nu se face nicio afirmatie despre el. Frauda nu apare aici:
// ramane avertizarea distincta din capul planului.
//
// APROBAT de proprietar la 22.11.2026. Orice schimbare de text dupa aceasta data
// se aproba din nou: se pune CONSTATARI_IN_CIORNA pe true, iar verificarea de
// publicare opreste publicarea pana la o noua aprobare.

import type { IdPas } from "../domeniu/tipuri";

export const CONSTATARI: Readonly<Record<IdPas, string>> = {
  frauda: "Ați spus că v-a contactat cineva recent cu o ofertă sau în numele băncii.",
  "luna-nu-se-inchide": "Ați spus că la sfârșitul lunii nu vă mai rămân bani.",
  "datorii-scumpe": "Aveți datorii la un IFN sau pe card.",
  "bani-pentru-urgente": "Banii pe care îi puteți lua imediat sunt mai puțini decât rezerva folosită de aplicație.",
  "cheltuiala-apropiata": "Ați spus că s-ar putea să aveți o cheltuială mare în următorul an.",
  "bani-in-casa": "Țineți în casă mai mult decât pragul folosit de aplicație.",
  "o-singura-banca": "Aveți la aceeași bancă o sumă peste pragul folosit de aplicație.",
  "bani-peste-rezerva": "Aveți bani peste rezerva pentru urgențe.",
  "alta-moneda": "Aveți economii în altă monedă decât leul.",
  aur: "Aveți aur, pe care aplicația nu îl socotește în bani.",
  "produse-neintelese": "Aveți un loc pe care poate nu îl cunoașteți pe deplin.",
  "ordine-in-acte": "Nimeni de încredere nu știe unde vă sunt banii.",
  girant: "Ați girat sau ați împrumutat bani cuiva.",
  "situatie-neacoperita": "Aveți și lucruri de care planul nu ține cont.",
};

/** true cat timp textele de mai sus nu au fost aprobate de proprietar. */
export const CONSTATARI_IN_CIORNA = false;
