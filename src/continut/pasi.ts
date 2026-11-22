// Textele pasilor din plan (specificatie, sectiunea 5).
//
// CIORNA: toate textele de mai jos sunt o prima forma, scrisa pentru ca
// ecranele sa poata fi construite si incercate. Nu sunt verificate din surse
// oficiale si nu au fost aprobate de proprietar. Linkurile, sursele si datele
// de verificare lipsesc intentionat: se completeaza la etapa 10, din sursa
// oficiala, nu din memorie. Pana atunci aplicatia nu poate fi publicata.
//
// Cinci pasi trimit la o institutie si au nevoie de link: frauda, o singura
// banca, bani peste rezerva, alta moneda si produse neintelese. Ceilalti noua
// raman fara link, fiecare cu motivul scris (decizia proprietarului, 22.11.2026).
//
// Reguli pentru texte: fara produse, emitenti sau banci numite; fara sume,
// dobanzi sau plafoane; fara indemnuri de a pune bani intr-un produs.

import type { IdPas } from "../domeniu/tipuri";

export type LinkOficial = {
  readonly eticheta: string;
  readonly adresa: string;
  /** Ce sa caute omul pe pagina. */
  readonly ceSaCautati: string;
};

export type ContinutPas = {
  readonly titlu: string;
  /** Un rand, afisat sub titlu in lista de pasi. */
  readonly peScurt: string;
  readonly deCe: string;
  readonly cePutetiFace: readonly string[];
  readonly link: LinkOficial | null;
  /**
   * De ce pasul nu are link, cand lipsa este o alegere: pasul este un sfat de
   * organizare sau nu exista o pagina oficiala potrivita. Fara acest motiv,
   * un pas fara link este socotit neterminat.
   */
  readonly faraLink?: string;
  readonly sursa: string | null;
  /** Data verificarii, AAAA-LL-ZZ. */
  readonly verificatLa: string | null;
  /** true cat timp textul nu a fost verificat si aprobat. */
  readonly ciorna: boolean;
};

const neverificat = { link: null, sursa: null, verificatLa: null, ciorna: true } as const;

export const PASI: Readonly<Record<IdPas, ContinutPas>> = {
  frauda: {
    titlu: "Atenție la telefonul sau mesajul primit",
    peScurt: "Nu trimiteți bani și nu spuneți coduri",
    deCe: "Cine vă sună sau vă scrie cu o ofertă de câștig sau „din partea băncii” poate fi un escroc, chiar dacă este politicos și pare să știe multe despre dumneavoastră.",
    cePutetiFace: [
      "Nu trimiteți bani și nu mutați bani într-un „cont sigur”.",
      "Nu spuneți nimănui coduri primite prin SMS, parole sau datele de pe card.",
      "Închideți și sunați dumneavoastră banca, la numărul scris pe card.",
      "Vorbiți cu cineva de încredere înainte de a face orice.",
    ],
    // Linkul si sursa sunt verificate (vezi docs/verificari). Textul ramane ciorna pana il aproba proprietarul.
    link: {
      eticheta: "Deschideți pagina „Ce fac în caz de fraudă”",
      adresa: "https://sigurantaonline.ro/ce-fac-in-caz-de-frauda/",
      ceSaCautati: "Pe pagină, căutați situația care seamănă cu a dumneavoastră.",
    },
    sursa: "Campania #SigurantaOnline, inițiată de Poliția Română, DNSC și ARB",
    verificatLa: "2026-11-21",
    ciorna: true,
  },
  "luna-nu-se-inchide": {
    titlu: "Banii nu ajung până la sfârșitul lunii",
    peScurt: "Întâi cheltuielile lunii, apoi economiile",
    deCe: "Cât timp luna se încheie pe minus, economiile se micșorează sau apar datorii.",
    cePutetiFace: [
      "Scrieți pe hârtie, timp de o lună, pe ce se duc banii.",
      "Aflați dacă aveți dreptul la ajutoare sau reduceri, de la stat ori de la primărie.",
    ],
    ...neverificat,
    faraLink: "Nu exista o pagina oficiala de ansamblu cu ajutoarele pentru varstnici; textul trimite la primarie.",
  },
  "datorii-scumpe": {
    titlu: "Datorii la IFN sau pe card",
    peScurt: "De ce se plătesc înaintea economisirii",
    deCe: "Pentru o datorie plătiți dobândă. Dacă dobânda datoriei este mai mare decât cea primită la economii, pierdeți bani cât timp le aveți pe amândouă.",
    cePutetiFace: [
      "Cereți în scris, de la fiecare creditor, cât mai aveți de plătit și ce dobândă plătiți.",
      "Comparați dobânda datoriei cu dobânda pe care o primiți la economii.",
    ],
    ...neverificat,
    faraLink: "Este un rationament de aritmetica, nu regula unei institutii.",
  },
  "bani-pentru-urgente": {
    titlu: "Bani pentru urgențe",
    peScurt: "Câți bani să aveți la îndemână oricând",
    deCe: "O cheltuială neașteptată, de exemplu o reparație sau un tratament, se plătește cel mai ușor din bani pe care îi puteți scoate imediat, fără să desfaceți un depozit și fără să vă împrumutați.",
    cePutetiFace: [
      "Socotiți cât cheltuiți într-o lună și hotărâți pentru câte luni vreți să aveți bani la îndemână.",
      "Comparați cu banii pe care îi aveți acasă și în cont.",
    ],
    ...neverificat,
    faraLink: "Rezerva pentru urgente este o conventie, fara sursa oficiala.",
  },
  "cheltuiala-apropiata": {
    titlu: "Cheltuiala mare din următorul an",
    peScurt: "Banii aceia să rămână ușor de scos",
    deCe: "Banii de care aveți nevoie în curând nu se potrivesc cu un produs care îi ține blocați mult timp.",
    cePutetiFace: [
      "Notați când aveți nevoie de bani și cam cât.",
      "Înainte de a pune bani undeva, întrebați ce se întâmplă dacă îi scoateți mai devreme.",
    ],
    ...neverificat,
    faraLink: "Sfat de organizare.",
  },
  "bani-in-casa": {
    titlu: "Bani ținuți în casă",
    peScurt: "Riscurile și ce alte feluri de păstrare există",
    deCe: "Banii din casă pot fi furați sau pot fi distruși într-un incendiu ori o inundație.",
    cePutetiFace: [
      "Hotărâți câți bani aveți nevoie să țineți la îndemână, în casă.",
      "Pentru rest există, ca feluri de păstrare, contul și depozitul la bancă.",
    ],
    ...neverificat,
    faraLink: "Sfat de organizare.",
  },
  "o-singura-banca": {
    titlu: "Toți banii la o singură bancă",
    peScurt: "Ce înseamnă garantarea depozitelor",
    deCe: "Banii din bancă sunt garantați până la o anumită sumă, pentru fiecare bancă în parte.",
    cePutetiFace: [
      "Aflați, din sursa oficială, care este suma garantată.",
      "Comparați cu ce aveți la aceeași bancă, în toate conturile și depozitele la un loc.",
      "Pentru bani veniți de curând din pensionare sau din vânzarea unei locuințe, suma garantată poate fi mai mare pentru o vreme. Pagina oficială explică.",
    ],
    // Linkul si sursa sunt verificate (vezi docs/verificari). Textul ramane ciorna pana il aproba proprietarul.
    link: {
      eticheta: "Deschideți pagina oficială FGDB",
      adresa: "https://fgdb.ro/cat-garantam/",
      ceSaCautati: "Pe pagină, căutați titlul „Plafonul general de acoperire”.",
    },
    sursa: "FGDB, pagina „Cât garantăm”",
    verificatLa: "2026-11-22",
    ciorna: true,
  },
  "bani-peste-rezerva": {
    titlu: "Bani peste rezerva pentru urgențe",
    peScurt: "Ce este un depozit și ce este un titlu de stat",
    deCe: "Banii de care nu aveți nevoie curând pot fi ținuți în mai multe feluri. Fiecare are reguli diferite despre dobândă și despre cât de repede puteți scoate banii.",
    cePutetiFace: [
      "Un depozit este o sumă lăsată la bancă pe o perioadă stabilită, pentru care banca plătește dobândă.",
      "Un titlu de stat este un împrumut dat statului pe o perioadă stabilită, pentru care statul plătește dobândă.",
      "Pentru fiecare, întrebați: pe ce perioadă, ce dobândă și ce se întâmplă dacă scot banii mai devreme.",
    ],
    ...neverificat,
  },
  "alta-moneda": {
    titlu: "Economii în altă monedă",
    peScurt: "Ce se întâmplă când cursul se schimbă",
    deCe: "Cheltuielile dumneavoastră sunt în lei. Valoarea în lei a economiilor în altă monedă crește când acea monedă se scumpește și scade când se ieftinește. Nimeni nu știe dinainte în ce parte merge cursul.",
    cePutetiFace: [
      "Notați câți bani aveți în fiecare monedă.",
      "Gândiți-vă pentru ce cheltuieli sunt acei bani și în ce monedă le veți plăti.",
    ],
    ...neverificat,
  },
  aur: {
    titlu: "Aur",
    peScurt: "Unde este păstrat și ce acte aveți",
    deCe: "Aplicația notează aurul, dar nu îi socotește valoarea în bani. Bijuteriile nu sunt socotite economii.",
    cePutetiFace: [
      "Notați unde este păstrat aurul.",
      "Păstrați actele de cumpărare sau de proveniență.",
      "Înainte de o vânzare, întrebați în mai multe locuri și cereți prețul în scris.",
    ],
    ...neverificat,
    faraLink: "Nicio pagina oficiala potrivita; textul nu vorbeste despre impozite.",
  },
  "produse-neintelese": {
    titlu: "Produse pe care nu le înțelegeți",
    peScurt: "Ce documente să cereți și ce să întrebați",
    deCe: "Dacă nu știți sigur ce fel de produs aveți, nu puteți ști nici cât de repede puteți scoate banii, nici dacă puteți pierde din ei.",
    cePutetiFace: [
      "Cereți, de la cine vi l-a vândut, contractul și un document care descrie produsul.",
      "Întrebați: pot pierde din bani? Când și cum îi pot scoate? Ce comisioane plătesc?",
      "Nu semnați nimic nou până nu înțelegeți răspunsurile.",
    ],
    ...neverificat,
  },
  "ordine-in-acte": {
    titlu: "Ordine în acte",
    peScurt: "Cineva de încredere să știe unde sunt banii",
    deCe: "Dacă aveți nevoie de ajutor, cineva apropiat trebuie să știe unde sunt banii dumneavoastră.",
    cePutetiFace: [
      "Scrieți pe hârtie la ce bănci aveți conturi și ce alte economii aveți.",
      "Nu scrieți parole, coduri PIN sau numere de card.",
      "Spuneți unei persoane de încredere unde este foaia. Este destul să știe unde sunt banii; nu are nevoie să poată umbla la ei.",
    ],
    ...neverificat,
    faraLink: "Sfat de organizare.",
  },
  girant: {
    titlu: "Ați girat sau ați împrumutat bani",
    peScurt: "Ce risc v-ați asumat",
    deCe: "Dacă ați girat pentru cineva și acela nu își plătește împrumutul, datoria poate fi cerută de la dumneavoastră. Banii împrumutați cuiva se pot întoarce târziu sau deloc.",
    cePutetiFace: [
      "Aflați cât mai este de plătit din împrumutul pentru care ați girat.",
      "Păstrați contractul și orice înscris despre banii împrumutați.",
    ],
    ...neverificat,
    faraLink: "Sursa este Codul civil; un link catre textul legii nu ajuta cititorul.",
  },
  "situatie-neacoperita": {
    titlu: "Lucruri de care planul nu ține cont",
    peScurt: "Chirii, moșteniri, bani de recuperat, afaceri",
    deCe: "Ați spus că aveți și altceva: chirii încasate, o moștenire în curs, bani de recuperat sau o afacere. Aplicația nu știe nimic despre ele, deci planul nu le ia în seamă.",
    cePutetiFace: ["Vorbiți despre ele cu cineva de încredere."],
    ...neverificat,
    faraLink: "Pasul spune doar ca aplicatia nu acopera acele lucruri.",
  },
};

/** Exista texte neverificate? Atunci aplicatia arata ca este o versiune de proba. */
export const CONTINUT_IN_CIORNA: boolean = Object.values(PASI).some((p) => p.ciorna);
