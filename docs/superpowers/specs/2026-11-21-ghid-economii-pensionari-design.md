# Ghid de economii pentru pensionari - specificatie de design

Data: 21.11.2026
Stare: de revizuit de proprietar inainte de planul de implementare

## 1. Scop

O aplicatie web pentru telefon care ajuta persoane de peste 65 de ani, fara cunostinte financiare, sa isi puna economiile in ordine. Omul raspunde la intrebari simple despre situatia lui si primeste o lista de pasi in ordinea prioritatii, cu explicatii in limbaj simplu si linkuri catre surse oficiale.

Prima versiune este pentru cativa oameni din familie si cunoscuti, pe care proprietarul ii poate observa folosind aplicatia.

## 2. Ce nu face aplicatia

- Nu recomanda produse, emitenti sau banci si nu spune cat sa puna omul intr-un produs.
- Nu ordoneaza tipurile de produse intre ele ("mai bun", "mai sigur").
- Nu afiseaza dobanzi, randamente, plafoane legale sau alte cifre de piata. Singura exceptie afisata este luna cursului mediu BNR folosit la totalul orientativ.
- Nu are conturi, server propriu, analytics sau scripturi de la terti.
- Nu cere si nu stocheaza parole, coduri, numere de card, CNP sau numere de cont.
- Nu exporta datele omului intr-un fisier (exclus din prima versiune, vezi 10).
- Nu foloseste un model AI pentru a genera raspunsuri.

Motiv: indrumarea ramane generala, pe pasi si pe tipuri, pentru a nu intra in zona de consultanta de investitii reglementata. Incadrarea trebuie verificata, vezi 9.

## 3. Utilizatori si mod de folosire

- Utilizator: pensionar 65+, pe telefon, in browser.
- Prima configurare se face impreuna cu un apropiat. Dupa aceea omul foloseste aplicatia singur.
- Limba: romana, cu diacritice, adresare cu "dumneavoastra".

## 4. Chestionarul

Zece intrebari, cate una pe ecran. Sumele se introduc exact; rotunjirea este acceptata. Orice intrebare despre sume are optiunea "Prefer sa nu spun".

| # | Intrebare | Raspuns |
|---|---|---|
| 1 | Cati bani va intra in fiecare luna? | Suma si moneda |
| 2 | Cati bani cheltuiti intr-o luna obisnuita? | Suma in lei |
| 3 | La sfarsitul lunii va raman bani? | Da, de obicei / Uneori / Nu, se termina / Nu imi ajung |
| 4 | Aveti rate sau datorii? La cine? | Banca / IFN / Card / Persoane / Nu (alegere multipla) |
| 5 | Unde aveti bani pusi deoparte? | Lista de locuri, vezi mai jos |
| 6 | Aveti o cheltuiala mare in urmatorul an? | Da / Nu / Poate; optional suma in lei |
| 7 | Stie cineva de incredere unde sunt banii dumneavoastra? | Da / Nu |
| 8 | V-a sunat sau v-a scris cineva recent cu o oferta de castig sau "de la banca"? | Da / Nu |
| 9 | Ati girat sau ati imprumutat bani cuiva? | Da / Nu |
| 10 | Aveti si altceva: chirii incasate, o mostenire in curs, bani de recuperat, o afacere? | Da / Nu |

Intrebarea 3 se pastreaza pe langa 1 si 2, fiindca sumele pot lipsi sau pot fi gresite, iar raspunsul omului despre cum se incheie luna este mai sigur.

### Lista de la intrebarea 5

Fiecare rand are:

- tip: Acasa (numerar) / Cont / Depozit / Titluri de stat / Aur / Altceva / Nu stiu sigur;
- suma si moneda (lei, euro, dolari, lire); pentru aur: forma (lingouri sau monede / bijuterii) si, optional, grame;
- banca, pentru Cont si Depozit, aleasa dintr-o lista. Lista bancilor sta in fisierul de continut, cu sursa si data verificarii. Optiunea "Alta banca" cere un nume scris; doua randuri "Alta banca" sunt socotite aceeasi banca doar daca numele sunt identice.

### Totalul orientativ

- Intra randurile de tip Acasa, Cont, Depozit si Titluri de stat.
- Nu intra Aur, Altceva si Nu stiu sigur; sub total apare o linie care spune ce nu a fost socotit.
- Sumele in valuta se transforma in lei la cursul mediu BNR al lunii de referinta. Textul spune "orientativ" si numeste luna.

## 5. Pasii

### Marimi calculate

- **Bani accesibili imediat:** randurile Acasa si Cont, in lei.
- **Rezerva tinta:** numarul de luni din parametri, inmultit cu raspunsul la intrebarea 2.
- **Suma la o banca:** randurile Cont si Depozit cu aceeasi banca, toate monedele, transformate la cursul mediu.
- **Bani peste rezerva:** totalul orientativ, minus suma de la intrebarea 6 (daca exista), minus rezerva tinta.

Daca o suma necesara unei marimi lipseste, pasii care depind de ea apar in forma generala, fara calcul si fara sume.

### Catalogul de pasi

Omul primeste doar pasii care i se aplica, in aceasta ordine.

| # | Pas | Se declanseaza cand | Ce contine |
|---|---|---|---|
| 1 | Posibila frauda | 8 = Da | Nu trimiteti bani, nu spuneti coduri, sunati banca la numarul de pe card. Mereu primul, marcat distinct. |
| 2 | Luna nu se inchide | 3 = Nu, se termina / Nu imi ajung | Lista cheltuielilor; link catre drepturi si ajutoare oficiale. |
| 3 | Datorii scumpe | 4 contine IFN sau Card | De ce se platesc inaintea economisirii, cu exemplu. |
| 4 | Bani pentru urgente | Banii accesibili imediat sunt sub rezerva tinta | Cati bani sa fie accesibili oricand. |
| 5 | Cheltuiala apropiata | 6 = Da / Poate | Banii aceia nu se blocheaza pe termen lung. |
| 6 | Multi bani in casa | Randurile Acasa depasesc pragul din parametri | Riscurile, fara alarmism; ce alternative exista ca tip. |
| 7 | Totul la o singura banca | Suma la o banca depaseste plafonul de garantare minus marja din parametri | Ce este garantarea depozitelor; link FGDB si ce sa caute acolo. |
| 8 | Bani peste rezerva | Banii peste rezerva sunt mai mari decat zero | Ce este un depozit, ce este un titlu de stat, diferentele; linkuri oficiale. Fara ordonare si fara "alegeti". |
| 9 | Economii in alta moneda | Exista un rand in alta moneda decat leul (cheltuielile sunt mereu in lei) | Riscul valutar in ambele directii. Fara "schimbati" sau "pastrati". |
| 10 | Aur | Exista un rand de tip Aur | Unde este pastrat, acte de provenienta, ce sa intrebe inainte de o vanzare. Bijuteriile nu sunt socotite economii. |
| 11 | Produse pe care nu le intelegeti | Exista un rand Altceva sau Nu stiu sigur | Ce documente sa ceara si ce intrebari sa puna. |
| 12 | Ordine in acte | 7 = Nu | Lista pe hartie cu unde sunt conturile, fara parole. Textul spune "sa stie unde sunt", nu "sa aiba acces". |
| 13 | Girant sau imprumuturi date | 9 = Da | Ce risc isi asuma. |
| 14 | Situatie pe care aplicatia nu o acopera | 10 = Da | Spune deschis ca planul nu tine cont de acele lucruri si indeamna omul sa vorbeasca cu cineva de incredere. Mereu ultimul. |

Reguli generale:

- Datoriile la banca si catre persoane nu produc niciun pas in prima versiune. Este o alegere, nu o scapare: fara dobanda si termen, aplicatia nu poate spune nimic util despre ele.
- Daca lista de pasi este goala, aplicatia afiseaza un mesaj neutru: din raspunsuri nu a reiesit niciun pas de facut, iar aplicatia verifica doar cateva lucruri de baza. Nu spune ca "totul este in ordine".
- Fiecare pas are: de ce conteaza, ce puteti face, link oficial cu "ce sa cautati pe pagina", sursa si data verificarii, si mentiunea ca aplicatia nu alege in locul omului.
- Omul poate bifa un pas ca facut. Bifa este declaratia lui, nu o verificare.

### Parametri de continut

Valorile de mai jos sunt decizii ale proprietarului, nu ale aplicatiei. Stau intr-un singur fisier de configurare, fiecare cu o nota despre cine a decis-o si cand. Build-ul esueaza daca vreuna lipseste.

- rezerva tinta, in luni de cheltuieli;
- pragul in lei pentru "multi bani in casa";
- marja fata de plafonul de garantare de la care apare pasul 7;
- plafonul de garantare, preluat din sursa oficiala, cu data verificarii.

Plafonul de garantare este folosit numai pentru declansarea pasului 7 si nu este afisat niciodata; omul il citeste pe pagina FGDB. Daca data verificarii lui este mai veche de 12 luni, build-ul esueaza, iar in aplicatia deja publicata pasul 7 apare in forma generala pentru oricine are toti banii din banca la o singura banca.

## 6. Ecrane

Patru tipuri de ecran, conform machetei din `machete/index.html`:

1. intrebare din chestionar;
2. lista "Unde aveti bani";
3. planul, cu buton de tiparire;
4. detaliul unui pas.

Plus un ecran permanent "Siguranta" (semne de frauda; aplicatia nu cere niciodata parole, coduri sau date de card) si un ecran "Stergeti tot".

Reguli de lizibilitate:

- text de baza 20 px, titluri 26 px, nimic sub 15 px in afara de sursa;
- butoane inalte de cel putin 56 px, pe toata latimea;
- o singura decizie pe ecran; fara meniuri ascunse si fara gesturi de glisare;
- contrast ridicat, o singura culoare de accent; rosu doar pentru frauda;
- niciun termen financiar fara explicatie pe acelasi ecran;
- "Inapoi" mereu in acelasi loc; raspunsurile se salveaza singure la fiecare pas.

Varianta tiparita a planului: alb-negru, text mare, pasii cu explicatiile lor si data generarii. Nu contine sumele introduse de om, fiindca o foaie cu situatia lui financiara poate ajunge la oricine.

## 7. Arhitectura

Aplicatie web statica, instalabila pe ecranul telefonului. TypeScript, Preact, Vite. Gazduire pe GitHub Pages, dintr-un cont personal.

| Componenta | Responsabilitate | Depinde de |
|---|---|---|
| Chestionar | Afiseaza intrebarile din definitii tinute ca date | Stocare |
| Motor de reguli | Functie pura: raspunsuri + cursuri + parametri + data de azi -> lista ordonata de pasi | Nimic |
| Continut | Textele pasilor, lista bancilor, linkurile; fiecare cu sursa si data verificarii | Nimic |
| Cursuri | Citeste fisierul de cursuri si spune daca este vechi | Fisierul produs de job |
| Stocare | Salveaza raspunsurile in browser, cu numar de versiune; stergere completa | Nimic |
| Plan si tiparire | Afiseaza pasii, detaliul si varianta de tiparit | Motor, Continut |
| Functionare fara internet | Service worker care pastreaza aplicatia. Ultimul fisier de cursuri citit este pastrat de Stocare si sters de "Stergeti tot" | Nimic |
| Job lunar | Calculeaza media lunara BNR si scrie fisierul de cursuri | BNR |

Regulile, textele si parametrii stau in fisiere separate de interfata, ca proprietarul sa le poata citi si corecta fara sa atinga codul interfetei.

### Cursul valutar

- Sursa: fisierul anual BNR, `https://curs.bnr.ro/files/xml/years/nbrfxrates<AN>.xml` (verificat la 21.11.2026: contine cursurile zilnice de la 05.01.2026 la 20.11.2026).
- Fisierul BNR nu poate fi citit direct din browser de pe alt domeniu (lipseste antetul de acces intre domenii; verificat la 21.11.2026). De aceea calculul se face intr-un job, nu in aplicatie.
- Jobul ruleaza lunar, prin GitHub Actions, in primele zile ale lunii. Calculeaza media aritmetica a cursurilor zilnice publicate in luna incheiata, pentru EUR, USD si GBP, si publica un fisier JSON langa aplicatie, cu luna de referinta si data generarii.
- In ianuarie, luna incheiata este decembrie si se citeste fisierul anului precedent.

Cand este media "veche": fie P luna calendaristica dinaintea celei curente.

| Luna de referinta din fisier | Comportament |
|---|---|
| P | Folosita, fara avertizare. |
| Luna dinaintea lui P, pana in ziua 10 inclusiv | Folosita, fara avertizare (jobul poate sa nu fi rulat inca). |
| Luna dinaintea lui P, dupa ziua 10 | Folosita, cu avertizare vizibila. |
| Mai veche | Folosita, cu avertizare vizibila. |

### Date si confidentialitate

- Raspunsurile stau doar in stocarea locala a browserului de pe telefonul omului.
- Singura cerere catre exterior este fisierul de cursuri, identic pentru toti utilizatorii.
- Fonturile si toate resursele sunt servite din aplicatie.
- In repo nu ajunge nicio data personala.

## 8. Comportament la erori

| Situatie | Comportament |
|---|---|
| Niciun fisier de cursuri disponibil, nici salvat | Totaluri separate pe fiecare moneda, fara conversie, cu explicatie. Marimile care cer conversie sunt socotite lipsa, deci pasii respectivi apar in forma generala. |
| Media este veche (vezi 7) | Se foloseste, cu avertizare vizibila si luna ei. |
| Fara internet | Aplicatia porneste din copia pastrata si foloseste ultimul fisier de cursuri citit. |
| Date salvate dintr-o versiune veche sau stricate | Aplicatia spune asta si propune reluarea chestionarului. Nu ghiceste. |
| Jobul lunar esueaza sau nu mai ruleaza | Fisierul vechi ramane publicat. Singurul semnal sigur este avertizarea din aplicatie. |

## 9. Verificari obligatorii inainte de scrierea continutului

Niciuna dintre afirmatiile de mai jos nu este confirmata in acest document. Fiecare se verifica din sursa oficiala, iar sursa si data se trec in fisierul de continut.

- Incadrarea aplicatiei fata de consultanta de investitii reglementata (ASF, legislatia privind pietele de instrumente financiare). Daca incadrarea este neclara, pasul 8 se rescrie sau se scoate.
- Plafonul de garantare a depozitelor, regula de conversie pentru depozitele in valuta si lista bancilor participante (FGDB).
- Regimul fiscal al dobanzilor si al vanzarii aurului (ANAF, Codul fiscal), numai daca textul pasilor il mentioneaza.
- Drepturile si ajutoarele la care trimite pasul 2 (surse oficiale ale statului).
- Numerele si canalele oficiale pentru raportarea fraudelor.

De verificat la planul de implementare, din documentatia GitHub: daca job-urile programate sunt dezactivate dupa o perioada fara activitate in repo si daca GitHub Pages pe un repo privat cere un plan platit.

## 10. Riscuri cunoscute si acceptate

- Datele se pierd la stergerea datelor browserului sau la schimbarea telefonului, iar omul reia chestionarul cu un apropiat. Planul tiparit pastreaza pasii, nu si datele. Exportul in fisier este exclus din prima versiune, fiindca un fisier cu situatia financiara a unui varstnic este un risc mai mare decat reluarea chestionarului.
- Regulile fixe acopera doar situatiile prevazute. Intrebarea 10 prinde o parte din rest; celelalte raman nevazute.
- "Persoana de incredere" poate fi chiar cel care profita de un varstnic. Textele nu indeamna la acordarea accesului la bani.
- Totalul orientativ poate fi citit drept valoare exacta. Textul si pozitia lui pe ecran se valideaza cu utilizatori reali.
- Media lunii anterioare ramane in urma dupa o miscare brusca a cursului.
- O lista goala de pasi poate fi citita drept "totul este bine". Mesajul neutru reduce riscul, nu il elimina.

## 11. Testare

- Motor de reguli: tabel de situatii (raspunsuri -> pasi asteptati), rulat automat. Fiecare regula are cel putin un caz care o declanseaza si unul care nu; plus cazurile cu sume lipsa, lista goala si intrebarea 10.
- Job de cursuri: rulat pe fisiere BNR salvate; cazuri: luna obisnuita, ianuarie, luna cu zile lipsa, fisier indisponibil.
- Vechimea mediei: cele patru randuri din tabelul de la 7, inclusiv ziua 10 si ziua 11.
- Stocare: date din versiune veche, date stricate, stergere completa.
- Fara internet: aplicatia porneste si afiseaza planul dupa o prima incarcare.
- Tiparire: planul incape lizibil pe A4 si nu contine sume.
- Lizibilitate: cel putin un om de peste 65 de ani parcurge fiecare ecran inainte ca acesta sa fie considerat gata.

## 12. In afara primei versiuni

Public larg, conturi, sincronizare intre dispozitive, export de date, evaluarea aurului in bani, afisarea de dobanzi sau conditii de piata, pasi pentru datoriile la banca sau catre persoane, alte limbi, aplicatie nativa.
