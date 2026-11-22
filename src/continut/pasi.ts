// Textele pasilor din plan (specificatie, sectiunea 5).
//
// APROBAT de proprietar la 22.11.2026: textele a 13 pasi, in forma de mai jos.
// Orice schimbare de text dupa aceasta data se aproba din nou.
//
// CIORNA ramane un singur pas, "bani-peste-rezerva": textul si linkul lui
// depind de raspunsul ASF despre incadrare (vezi src/continut/incadrare.ts).
// Pana atunci aplicatia nu poate fi publicata.
//
// Patru pasi trimit la o institutie si au nevoie de link: frauda, o singura
// banca, bani peste rezerva si produse neintelese. Ceilalti zece raman fara
// link, fiecare cu motivul scris (deciziile proprietarului din 22.11.2026).
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

/** Pas inca neaprobat, fara link si fara sursa. */
const neverificat = { link: null, sursa: null, verificatLa: null, ciorna: true } as const;
/** Sfat general aprobat de proprietar: fara link si fara sursa oficiala, cu motivul scris la pas. */
const sfatAprobat = { link: null, sursa: null, verificatLa: null, ciorna: false } as const;

export const PASI: Readonly<Record<IdPas, ContinutPas>> = {
  frauda: {
    titlu: "Atenție la telefonul sau mesajul primit",
    peScurt: "Nu trimiteți bani și nu spuneți coduri",
    deCe: "Cine vă sună sau vă scrie cu o ofertă de câștig sau „din partea băncii” poate fi un escroc, chiar dacă este politicos și pare să știe multe despre dumneavoastră.",
    cePutetiFace: [
      "Nu trimiteți bani și nu mutați bani într-un „cont sigur”.",
      "Nu spuneți nimănui coduri primite prin SMS, parole sau datele de pe card.",
      "Închideți și sunați dumneavoastră banca, la numărul scris pe card.",
      "Dacă ați spus deja coduri sau datele cardului, sunați banca imediat și cereți blocarea cardului.",
      "Dacă ați pierdut bani, mergeți și la Poliție, să depuneți o plângere.",
      "Vorbiți cu cineva de încredere înainte de a face orice.",
    ],
    // Linkul si sursa sunt verificate (vezi docs/verificari).
    link: {
      eticheta: "Deschideți pagina „Ce fac în caz de fraudă”",
      adresa: "https://sigurantaonline.ro/ce-fac-in-caz-de-frauda/",
      ceSaCautati: "Pe pagină, căutați situația care seamănă cu a dumneavoastră.",
    },
    sursa: "Campania #SigurantaOnline, inițiată de Poliția Română, DNSC și ARB",
    verificatLa: "2026-11-21",
    ciorna: false,
  },
  "luna-nu-se-inchide": {
    titlu: "Banii nu ajung până la sfârșitul lunii",
    peScurt: "Întâi cheltuielile lunii, apoi economiile",
    deCe: "Cât timp luna se încheie pe minus, economiile se micșorează sau apar datorii.",
    cePutetiFace: [
      "Scrieți pe hârtie, timp de o lună, pe ce se duc banii.",
      "Întrebați la primărie, la serviciul de asistență socială, dacă aveți dreptul la vreun ajutor.",
    ],
    // Sursa sustine doar trimiterea la primarie: acolo se depun cererile de ajutor (vezi docs/verificari).
    link: null,
    faraLink: "Nu exista o pagina oficiala de ansamblu cu ajutoarele pentru varstnici; textul trimite la primarie.",
    sursa: "ANPIS, pagina „Venitul minim de incluziune”",
    verificatLa: "2026-11-21",
    ciorna: false,
  },
  "datorii-scumpe": {
    titlu: "Datorii la IFN sau pe card",
    peScurt: "De ce se plătesc înaintea economisirii",
    deCe: "Un IFN este o firmă care dă împrumuturi, dar nu este bancă. Pentru orice datorie plătiți dobândă. Dacă dobânda datoriei este mai mare decât cea primită la economii, pierdeți bani cât timp le aveți pe amândouă.",
    cePutetiFace: [
      "Cereți în scris, de la fiecare firmă sau bancă la care aveți o datorie, cât mai aveți de plătit și ce dobândă plătiți.",
      "Comparați dobânda datoriei cu dobânda pe care o primiți la economii.",
    ],
    ...sfatAprobat,
    faraLink: "Este un rationament de aritmetica, nu regula unei institutii.",
  },
  "bani-pentru-urgente": {
    titlu: "Bani pentru urgențe",
    peScurt: "Câți bani să aveți la îndemână oricând",
    deCe: "O cheltuială neașteptată poate fi o reparație sau un tratament. Se plătește cel mai ușor din bani pe care îi puteți lua imediat, fără să vă împrumutați.",
    cePutetiFace: [
      "Socotiți cât cheltuiți într-o lună și hotărâți pentru câte luni vreți să aveți bani la îndemână.",
      "Comparați cu banii pe care îi aveți acasă și în cont.",
    ],
    ...sfatAprobat,
    faraLink: "Rezerva pentru urgente este o conventie, fara sursa oficiala.",
  },
  "cheltuiala-apropiata": {
    titlu: "Cheltuiala mare din următorul an",
    peScurt: "Banii aceia să rămână ușor de scos",
    deCe: "Banii de care aveți nevoie în curând trebuie să poată fi scoși la timp. Unele feluri de economii țin banii blocați sau vă costă dacă îi scoateți mai devreme.",
    cePutetiFace: [
      "Notați când aveți nevoie de bani și cam cât.",
      "Înainte de a pune bani undeva, întrebați ce se întâmplă dacă îi scoateți mai devreme.",
    ],
    ...sfatAprobat,
    faraLink: "Sfat de organizare.",
  },
  "bani-in-casa": {
    titlu: "Bani ținuți în casă",
    peScurt: "Riscurile și ce alte feluri de păstrare există",
    deCe: "Banii din casă pot fi furați sau pot fi distruși într-un incendiu ori o inundație.",
    cePutetiFace: [
      "Hotărâți câți bani aveți nevoie să țineți la îndemână, în casă.",
      "Restul poate sta la bancă, într-un cont sau într-un depozit. Un depozit înseamnă bani lăsați la bancă pe o perioadă stabilită.",
    ],
    ...sfatAprobat,
    faraLink: "Sfat de organizare.",
  },
  "o-singura-banca": {
    titlu: "Toți banii la o singură bancă",
    peScurt: "Ce înseamnă garantarea depozitelor",
    deCe: "Banii din bancă sunt garantați până la o anumită sumă, pentru fiecare bancă în parte. De garantare se ocupă Fondul de Garantare a Depozitelor Bancare, pe scurt FGDB.",
    cePutetiFace: [
      "Aflați, de pe pagina FGDB, care este suma garantată.",
      "Comparați cu ce aveți la aceeași bancă, în toate conturile și depozitele la un loc.",
      "Pentru bani veniți de curând din pensionare sau din vânzarea unei locuințe, suma garantată poate fi mai mare pentru o vreme. Pagina oficială explică.",
    ],
    // Linkul si sursa sunt verificate (vezi docs/verificari).
    link: {
      eticheta: "Deschideți pagina oficială FGDB",
      adresa: "https://fgdb.ro/cat-garantam/",
      ceSaCautati: "Pe pagină, căutați titlul „Plafonul general de acoperire”.",
    },
    sursa: "FGDB, pagina „Cât garantăm”",
    verificatLa: "2026-11-22",
    ciorna: false,
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
    // Fara link: pagina BNR pentru public nu a putut fi verificata, iar fisierul de cursuri nu poate fi
    // citit de un om. Sursa cursului este verificata (vezi docs/verificari).
    link: null,
    faraLink: "Pasul vorbeste despre riscul schimbarii cursului, nu despre cursul de azi.",
    sursa: "BNR, cursuri de referință",
    verificatLa: "2026-11-22",
    ciorna: false,
  },
  aur: {
    titlu: "Aur",
    peScurt: "Unde este păstrat și ce acte aveți",
    deCe: "Prețul aurului urcă și coboară, iar aurul nu aduce dobândă. De aceea aplicația îl notează, dar nu îi socotește valoarea în bani. Bijuteriile nu sunt socotite economii.",
    cePutetiFace: [
      "Notați unde este păstrat aurul.",
      "Păstrați actele de cumpărare sau de proveniență.",
      "Înainte de o vânzare, întrebați în mai multe locuri și cereți prețul în scris.",
    ],
    ...sfatAprobat,
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
      "Puteți suna gratuit la ASF, la 0800 825 627, de luni până joi între 8:30 și 17:00 și vineri între 8:30 și 14:30. ASF nu vă sună niciodată de la acest număr.",
    ],
    // Linkul si sursa sunt verificate (vezi docs/verificari).
    // Registrele ASF privesc asigurarile, piata de capital si pensiile private, nu produsele bancare.
    link: {
      eticheta: "Deschideți registrele ASF",
      adresa: "https://www.asfromania.ro/ro/a/1544/registre-entit%C4%83%C8%9Bi-autorizate",
      ceSaCautati:
        "ASF este Autoritatea de Supraveghere Financiară. Pe pagină sunt registrele firmelor autorizate, pe trei grupe: „Asigurări”, „Piață de capital” și „Pensii private”. Pentru un produs de la bancă, întrebați la bancă.",
    },
    sursa: "ASF, paginile „Registre entități autorizate” și „Informații petiții”",
    verificatLa: "2026-11-22",
    ciorna: false,
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
    ...sfatAprobat,
    faraLink: "Sfat de organizare.",
  },
  girant: {
    titlu: "Ați girat sau ați împrumutat bani",
    peScurt: "Ce risc v-ați asumat",
    deCe: "Dacă ați girat pentru cineva, v-ați angajat să plătiți dumneavoastră dacă acela nu își plătește împrumutul. Banii împrumutați cuiva se pot întoarce târziu sau deloc.",
    cePutetiFace: [
      "Aflați cât mai este de plătit din împrumutul pentru care ați girat.",
      "Păstrați contractul și orice înscris despre banii împrumutați.",
    ],
    // Sursa este verificata din reproduceri neoficiale ale Codului civil (vezi docs/verificari, sectiunea 8).
    link: null,
    faraLink: "Sursa este Codul civil; un link catre textul legii nu ajuta cititorul.",
    sursa: "Codul civil, art. 2.280 și 2.293",
    verificatLa: "2026-11-22",
    ciorna: false,
  },
  "situatie-neacoperita": {
    titlu: "Lucruri de care planul nu ține cont",
    peScurt: "Chirii, moșteniri, bani de recuperat, afaceri",
    deCe: "Ați spus că aveți și altceva: chirii încasate, o moștenire în curs, bani de recuperat sau o afacere. Aplicația nu știe nimic despre ele, deci planul nu le ia în seamă.",
    cePutetiFace: [
      "Vorbiți despre ele cu cineva de încredere.",
      "Pentru întrebări de acte sau de lege, întrebați un notar sau un avocat.",
    ],
    ...sfatAprobat,
    faraLink: "Pasul spune doar ca aplicatia nu acopera acele lucruri.",
  },
};

/** Exista texte neverificate? Atunci aplicatia arata ca este o versiune de proba. */
export const CONTINUT_IN_CIORNA: boolean = Object.values(PASI).some((p) => p.ciorna);
