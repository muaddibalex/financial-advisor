# Verificari din surse oficiale - etapa 10

Data citirii: 21.11.2026
Stare: partial, actualizata la 22.11.2026. Patru site-uri oficiale nu au putut fi citite automat (vezi "Necitite"). Nimic din aceasta fisa nu a fost inca trecut in continutul aplicatiei.

Cum se citeste fisa:

- **Confirmat** = text citit direct pe pagina oficiala indicata, la data de mai sus.
- **Neconfirmat** = pagina nu a putut fi citita sau nu spune acel lucru. Nu se foloseste in aplicatie pana la citire.
- Rezumatele motorului de cautare nu sunt socotite sursa. Unde apar, sunt marcate ca atare.

## Necitite

| Site | Ce s-a intamplat | Urmare |
|---|---|---|
| fgdb.ro | Citirea automata refuzata (403); browserul din aplicatie il blocheaza prin politica organizatiei | Pagina "Cat garantam" a fost citita la 22.11.2026 dintr-un PDF salvat de proprietar; lista bancilor ramane necitita |
| eur-lex.europa.eu | Raspuns gol la citirea automata; browserul il blocheaza prin politica organizatiei | Regulamentul (UE) 2017/565 este necitit |
| dnsc.ro (pagina principala si alertele) | Citirea automata refuzata (403) | Doar pnrisc.dnsc.ro a fost citit |
| politiaromana.ro | Eroare de certificat la citire | Canalul oficial de plangere este neconfirmat |

Aceste pagini trebuie citite de proprietar, dintr-un browser obisnuit. Blocarea din browserul aplicatiei este o regula a organizatiei si nu a fost ocolita.

## 1. Garantarea depozitelor (FGDB) - PARTIAL

Sursa: pagina "Cat garantam" a FGDB, https://fgdb.ro/cat-garantam/, salvata ca PDF de proprietar la 22.11.2026, ora 10:36, si citita din acel PDF. Pagina nu afiseaza o data a ultimei actualizari; subsolul spune "© FGDB 2026".

Confirmat (22.11.2026):

- Plafonul general: "100 000 €", "echivalent în lei". "Banii fiecărui deponent la bancă sunt garantați până la 100.000 de Euro."
- Pe ce se aplica: compensatia este de "maximum 100.000 Euro/persoană/ bancă"; "Nivelul de garantare este calculat per deponent, per bancă."
- Valuta: "Compensațiile vor fi plătite în lei la cursul BNR din ziua în care sumele depuse la bancă nu mai pot fi rambursate deponenților, indiferent de moneda în care a fost constituit depozitul."
- Plafonul suplimentar: inca 100.000 euro, cumulat cu cel general, "pentru o perioadă de 12 luni", pentru sume care vin din tranzactii imobiliare cu locuinte, din pensionare, disponibilizare, casatorie, divort, invaliditate sau deces, ori din indemnizatii de asigurare si compensatii pentru daune din infractiuni sau condamnari pe nedrept.
- Nu exista o valoare minima de la care se platesc compensatii, nici pentru conturile fara miscare in ultimele 24 de luni.

Neconfirmat:

- lista institutiilor participante si data ei (este pe alta pagina, "Unde garantam", necitita);
- ce nu este acoperit (pagina "Ce garantam", necitita);
- daca toate conturile si depozitele unui om la aceeasi banca se aduna. Formularea "per deponent, per bancă" o sugereaza, dar pagina citita nu o spune explicit.

Urmari pentru aplicatie:

- `plafonGarantareEur` = 100000, verificat la 2026-11-22, sursa: pagina de mai sus. Se trece in `parametri.ts` odata cu ceilalti trei parametri, care sunt decizia proprietarului.
- Compensatia se socoteste la cursul BNR al zilei, iar aplicatia foloseste media lunii anterioare. Diferenta dintre ele este exact ce trebuie sa acopere marja aleasa de proprietar.
- Plafonul suplimentar priveste direct publicul aplicatiei (bani din pensionare sau din vanzarea unei locuinte). Aplicatia nu il ia in calcul: pasul despre o singura banca poate aparea si cuiva care este acoperit temporar de plafonul suplimentar. Fiindca pasul doar trimite omul sa verifice, nu este o eroare, dar textul pasului ar trebui sa pomeneasca plafonul suplimentar. De hotarat de proprietar la citirea textelor.
- Linkul pasului despre o singura banca a fost completat cu aceasta pagina.

## 2. Consultanta de investitii - PARTIAL

Sursa: Legea nr. 126/2018 privind pietele de instrumente financiare, Portalul Legislativ, forma consolidata.
https://legislatie.just.ro/Public/DetaliiDocument/305317 (istoricul paginii arata ca ultima consolidare 16.01.2026; pagina nu afiseaza explicit "in vigoare").

Confirmat:

- Art. 3 alin. (1) pct. 13: "consultanță de investiții - furnizarea de recomandări personale unui client, la cererea sa sau la inițiativa firmei de investiții, în ceea ce privește una sau mai multe tranzacții cu instrumente financiare".
- Art. 3 alin. (1) pct. 12: consultantul de investitii este o persoana "autorizată de A.S.F." care presteaza aceste servicii cu titlu profesional.
- Art. 3 alin. (1) pct. 34: instrumentele financiare sunt cele din anexa nr. 1 sectiunea C.
- Art. 3 alin. (1) pct. 33: instrumentele pietei monetare cuprind, intre altele, "certificatele de trezorerie".
- Art. 3 alin. (1) pct. 84 lit. b): valorile mobiliare cuprind "obligațiunile și alte titluri de creanță securitizate".
- Art. 6 alin. (1) lit. k): legea nu se aplica persoanelor care dau consultanta de investitii in cadrul altei activitati profesionale, "cu condiția ca furnizarea acestor servicii de consultanță să nu fie remunerată".
- Art. 7 alin. (2): persoanele de la art. 7 alin. (1) lit. b) care dau consultanta trebuie autorizate de A.S.F. ca "consultanți de investiții".
- In definitiile de la art. 3 apare doar "depozit structurat" (pct. 19); depozitul bancar obisnuit nu este definit acolo.

Neconfirmat:

- Anexa nr. 1, sectiunile A si C (lista serviciilor si lista instrumentelor financiare): textul primit s-a oprit la art. 150. Nu se poate afirma din lege ca depozitele bancare obisnuite lipsesc din sectiunea C, nici ca titlurile de stat pentru populatie intra in ea.
- Regulamentul delegat (UE) 2017/565, art. 9 (ce este o "recomandare personala") si considerentele despre informatiile generale: necitite.
- Orice pozitie a ASF despre aplicatii sau materiale de educatie financiara: necautata inca.

Ce reiese si ce nu (interpretare, nu fapt): definitia cere trei lucruri la un loc - recomandare personala, catre un client, despre tranzactii cu instrumente financiare. Aplicatia este construita sa nu faca niciunul: nu numeste produse, nu spune cat si nu indeamna la o tranzactie. Dar tocmai criteriul care desparte "informatie generala" de "recomandare personala" sta in regulamentul necitit, iar aplicatia isi potriveste pasii dupa raspunsurile omului. Incadrarea nu poate fi socotita lamurita. Decizia apartine proprietarului; o intrebare scrisa catre ASF sau un jurist ar inchide subiectul.

## 3. Raportarea fraudelor - PARTIAL

Confirmat:

- https://pnrisc.dnsc.ro/ - platforma DNSC pentru raportarea incidentelor de securitate cibernetica. Afiseaza "1911" si "24/7", iar la "Contact" numarul 1911. Pagina spune ca raportarea prin formular "nu înlocuiește formularea unei plângeri penale".
- https://sigurantaonline.ro/ - "O campanie inițiată de Poliția Română, DNSC, ARB".
- https://sigurantaonline.ro/ce-fac-in-caz-de-frauda/ - pentru bani scosi din cont, pasii sunt: "Contactează imediat banca pentru blocarea cardului", apoi contactarea Politiei pentru plangere, apoi DNSC pentru notificare.

Neconfirmat:

- pentru ce anume este linia 1911, cine poate suna si daca este gratuita;
- daca 1911 este potrivit pentru o inselatorie prin telefon (pagina citita vorbeste despre incidente cibernetice);
- cum se depune oficial o plangere la Politie (in persoana, online);
- rolul numarului 112.

Urmare pentru continut: textul de acum al pasului de frauda si al ecranului "Siguranta" ("sunati banca la numarul scris pe card", "vorbiti cu cineva de incredere") se potriveste cu sursa citita. Numarul 1911 nu se adauga pana nu se confirma, pe dnsc.ro, pentru ce este.

## 4. Ajutoare la care trimite pasul 2 - PARTIAL

Confirmat:

- https://www.mmanpis.ro/venitul-minim-de-incluziune/ - venitul minim de incluziune (VMI) "este un beneficiu prevăzut în Legea nr. 196/2016". Cererea se inregistreaza la "serviciul public de asistență socială de la nivelul primăriei". Pagina da praguri de venit fara data; nu se folosesc in aplicatie.
- https://mmuncii.gov.ro/asistenta-sociala/beneficii-de-asistenta-sociala - pagina de legatura, fara lista de beneficii.
- https://www.cnpp.ro/statistici/evolutia-indemnizatiei-sociale/ - tabel cu evolutia indemnizatiei sociale pentru pensionari ("Data ultimei modificări: 28.08.2026"). Nu spune cine o primeste si nici daca se acorda din oficiu.

Neconfirmat:

- ajutorul pentru incalzirea locuintei: nicio pagina oficiala citita nu spune cine il poate cere, unde si cand;
- indemnizatia sociala pentru pensionari: conditii si mod de acordare;
- o pagina oficiala unica, pe intelesul unui varstnic, cu ajutoarele la care poate avea dreptul: nu a fost gasita.

Urmare pentru continut: fara o pagina oficiala de ansamblu, pasul 2 nu are inca un link bun. Varianta sustinuta de sursa citita este indrumarea catre serviciul de asistenta sociala al primariei, fara cifre.

## 5. Regimul fiscal - nu este necesar acum

Textele pasilor nu mentioneaza impozite pe dobanzi sau pe vanzarea aurului. Daca vor fi adaugate, se verifica intai din Codul fiscal si ANAF.

## Ce ramane de facut

1. Proprietarul citeste paginile FGDB si confirma plafonul, regula pentru valuta si lista bancilor, cu data.
2. Proprietarul citeste art. 9 din Regulamentul (UE) 2017/565 si anexa nr. 1 din Legea nr. 126/2018, sau cere un punct de vedere, si decide asupra incadrarii.
3. Proprietarul citeste pe dnsc.ro pentru ce este linia 1911 si pe politiaromana.ro cum se depune o plangere.
4. Se cauta o pagina oficiala de ansamblu pentru ajutoare; in lipsa ei, pasul 2 trimite la primarie.

## Decizii ale proprietarului (22.11.2026)

- **Incadrarea ASF:** construirea continua, proprietarul intreaba ASF, iar aplicatia nu ajunge la nimeni pana la raspuns. Decizia este trecuta in `src/continut/incadrare.ts`; verificarea de publicare (`npm run verifica-continut`) refuza continutul cat timp incadrarea nu este marcata ca lamurita.
- **Foaia tiparita:** titlurile pasilor raman pe foaie, inclusiv "Bani tinuti in casa".
- **FGDB:** la 22.11.2026 pagina este in continuare blocata in browserul aplicatiei. Proprietarul a salvat pagina "Cat garantam" ca PDF, din care a fost citita (vezi sectiunea 1).
