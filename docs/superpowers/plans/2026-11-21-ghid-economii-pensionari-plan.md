# Ghid de economii pentru pensionari - plan de implementare

Data: 21.11.2026
Specificatie: `docs/superpowers/specs/2026-11-21-ghid-economii-pensionari-design.md`

Planul are 13 etape. Fiecare se incheie cu teste care trec si poate fi revizuita separat. Etapele 1-9 si 11 se pot face fara nicio decizie a proprietarului, in afara de acordul pentru `git init` de la etapa 1. Etapele 10, 12 si 13 au conditii, notate la fiecare.

Unelte gasite pe calculator la 21.11.2026: Node 26.11.1, npm 12.2.0, git 2.55.0. Nu este nevoie de nicio instalare de programe; dependentele proiectului se instaleaza local, in folderul lui, prin `npm install`.

## Ce trebuie de la proprietar

| Ce | Necesar pentru | Blocheaza |
|---|---|---|
| Acord pentru `git init` in folderul proiectului | Etapa 1 | Nimic altceva; se poate lucra si fara, dar fara istoric |
| Cei patru parametri de continut (luni de rezerva, prag numerar, marja, plafon cu sursa) | Etapa 10 | Publicarea |
| Verificarile din sectiunea 9 a specificatiei | Etapa 10 | Publicarea; pasul 8 depinde de incadrarea ASF |
| Cont GitHub personal si numele repo-ului | Etapa 12 | Publicarea si jobul lunar |
| Cel putin un om de peste 65 de ani dispus sa testeze | Etapa 13 | Declararea versiunii ca gata |

Pana la etapa 10, dezvoltarea foloseste parametri si texte de test, marcate vizibil "CIORNA". Build-ul de publicare refuza orice continut marcat astfel (vezi etapa 10).

## Structura de fisiere

```
src/
  domeniu/
    tipuri.ts          tipurile: raspunsuri, rand, cursuri, parametri, pas
    marimi.ts          marimile calculate din specificatie, sectiunea 5
    reguli.ts          motorul: raspunsuri + cursuri + parametri -> pasi
  cursuri/
    vechime.ts         cand este media "veche" (tabelul din sectiunea 7)
    incarcare.ts       citeste fisierul de cursuri, cu rezerva pe copia salvata
  stocare/
    stocare.ts         salvare, citire, versiune, stergere completa
  continut/
    intrebari.ts       definitiile celor 10 intrebari
    pasi.ts            textele celor 14 pasi, cu sursa si data verificarii
    banci.ts           lista bancilor, cu sursa si data verificarii
    parametri.ts       cei patru parametri, cu cine a decis si cand
    validare.ts        verificarile rulate la build
  ecrane/
    Intrebare.tsx  ListaLocuri.tsx  Plan.tsx  DetaliuPas.tsx
    Siguranta.tsx  StergeTot.tsx
  componente/          buton, camp de suma, antet, navigare
  stil/                variabile, baza, tiparire
  app.tsx  main.tsx
scripts/
  cursuri-lunare.ts    jobul: fisier BNR -> public/cursuri.json
teste/
  fixturi/             fisiere BNR salvate; tabelul de situatii
public/
  cursuri.json         produs de job
.github/workflows/
  publicare.yml        build, teste, publicare pe Pages
  cursuri.yml          jobul lunar
```

Regula de dependenta: `domeniu/` si `cursuri/vechime.ts` nu importa nimic din `ecrane/`, `stocare/` sau browser. Asa pot fi testate fara interfata.

## Etapa 1 - Schelet

- Proiect Vite cu Preact si TypeScript in mod strict; ESLint.
- Teste cu Vitest; pentru ecrane, mediul `jsdom` si `@testing-library/preact`.
- Toate adresele din aplicatie sunt relative la `base` din configuratia Vite, fiindca pe GitHub Pages aplicatia va fi servita sub `/<nume-repo>/`, nu la radacina.
- `git init`, daca proprietarul este de acord; `.gitignore` pentru `node_modules` si `dist`.
- Pagina goala care porneste local.

Gata cand: `npm run dev` afiseaza pagina, `npm test` ruleaza un test de fum, `npm run build` produce `dist/`.

## Etapa 2 - Tipuri

`src/domeniu/tipuri.ts`: raspunsurile la cele 10 intrebari, randul din lista (tip, suma, moneda, banca, forma si grame pentru aur), cursurile (luna de referinta, data generarii, EUR, USD, GBP), parametrii, pasul (identificator, forma calculata sau generala).

O suma lipsa ("Prefer sa nu spun") este o valoare distincta, nu zero. Tipurile trebuie sa faca imposibila confuzia dintre cele doua.

Gata cand: proiectul compileaza si tipurile acopera toate tabelele din sectiunile 4 si 5 ale specificatiei.

## Etapa 3 - Marimi calculate

`src/domeniu/marimi.ts`, functii pure: conversie in lei, total orientativ, bani accesibili imediat, rezerva tinta, suma pe fiecare banca, bani peste rezerva.

Fiecare functie intoarce fie o valoare, fie "lipsa", cand o suma necesara lipseste sau cand nu exista cursuri pentru o moneda folosita.

Teste: fiecare marime pe un caz simplu, pe unul cu mai multe monede si pe unul cu o suma lipsa; doua randuri "Alta banca" cu nume identice si cu nume diferite; aurul si "Altceva" nu intra in total.

Gata cand: testele trec si nicio marime nu intoarce zero in loc de "lipsa".

## Etapa 4 - Motorul de reguli

`src/domeniu/reguli.ts`: o functie care primeste raspunsurile, cursurile (sau lipsa lor), parametrii si data de azi si intoarce lista ordonata de pasi, fiecare in forma calculata sau generala. Data de azi este parametru, nu citita din ceas, fiindca regula celor 12 luni pentru plafon depinde de ea si trebuie sa poata fi testata.

Comportament de retinut: cand omul refuza sa spuna cheltuielile lunare sau toate sumele din lista, pasii 4 si 8 nu pot fi calculati si apar in forma generala. Este intentionat: aplicatia nu ascunde un pas doar pentru ca nu il poate calcula.

Teste: tabelul de situatii din `teste/fixturi/`. Pentru fiecare dintre cei 14 pasi, un caz care il declanseaza si unul care nu. In plus: frauda apare prima indiferent de rest; pasul 14 apare ultimul; lista goala; toate sumele lipsa; fara cursuri; plafon cu verificare mai veche de 12 luni (pasul 7 in forma generala); datorii doar la banca (niciun pas).

Gata cand: tabelul trece integral. Tabelul este si documentul pe care proprietarul il poate citi ca sa verifice ce face aplicatia.

## Etapa 5 - Jobul de cursuri

`scripts/cursuri-lunare.ts`, rulat cu `tsx`, cu `fast-xml-parser` pentru citirea fisierului BNR: primeste data curenta, descarca fisierul anual BNR potrivit, calculeaza media aritmetica a cursurilor zilnice din luna incheiata pentru EUR, USD si GBP si scrie `public/cursuri.json` cu luna de referinta si data generarii.

- Calculul este o functie pura, separata de descarcare, ca sa poata fi testata pe fisiere salvate.
- Daca descarcarea esueaza, fisierul BNR nu are nicio zi din luna ceruta sau lipseste o moneda, jobul se opreste cu eroare si nu atinge fisierul existent.
- Rularea repetata in aceeasi luna produce acelasi rezultat.

Teste, pe fisiere BNR salvate in `teste/fixturi/`: luna obisnuita, ianuarie (citeste anul precedent), luna cu zile lipsa, fisier fara luna ceruta, moneda lipsa.

Gata cand: testele trec si o rulare reala locala produce un fisier a carui medie pentru o luna poate fi verificata de mana pe cursurile publicate de BNR.

## Etapa 6 - Vechimea si incarcarea cursurilor

- `src/cursuri/vechime.ts`: functie pura (luna de referinta, data de azi) -> proaspat / vechi, dupa tabelul din sectiunea 7.
- `src/cursuri/incarcare.ts`: cere `cursuri.json`; la reusita salveaza o copie prin modulul de stocare; la esec foloseste ultima copie salvata; daca nu exista niciuna, intoarce "lipsa". Aceasta este singura copie a cursurilor: service worker-ul din etapa 11 nu pastreaza `cursuri.json`.

Teste: cele patru randuri ale tabelului, inclusiv ziua 10 si ziua 11, si trecerea peste an (ianuarie, februarie). Incarcarea: raspuns bun, raspuns stricat, fara retea cu si fara copie.

Gata cand: testele trec.

## Etapa 7 - Stocare

`src/stocare/stocare.ts`: salveaza raspunsurile in stocarea locala a browserului, sub o singura cheie, cu numar de versiune. La citire: date lipsa, date valide, versiune veche, date stricate. Stergerea completa elimina si copia cursurilor.

Teste: cele patru cazuri de citire; dupa stergere nu ramane nicio cheie a aplicatiei; stocare indisponibila (mod privat) - aplicatia functioneaza pe durata sesiunii si spune ca nu poate salva.

Gata cand: testele trec.

## Etapa 8 - Chestionarul

- `src/continut/intrebari.ts`: cele 10 intrebari, ca date.
- Ecranele `Intrebare` si `ListaLocuri`, conform machetei, cu regulile de lizibilitate din sectiunea 6.
- Camp de suma care accepta punct, virgula si spatii ca separatori si refuza valorile negative; buton "Prefer sa nu spun".
- Salvare automata la fiecare raspuns; "Inapoi" pastreaza raspunsul.

Teste: parcurgerea completa a chestionarului; revenirea la o intrebare; adaugarea, modificarea si stergerea unui rand; interpretarea sumelor ("20.000", "20 000", "20000,50").

Gata cand: testele trec si chestionarul poate fi parcurs pe un telefon real, cu textul sistemului marit, fara derulare orizontala.

## Etapa 9 - Planul, detaliul si tiparirea

- Ecranele `Plan` si `DetaliuPas`; bifarea unui pas ca facut; "Schimbati raspunsurile".
- Mesajul neutru pentru lista goala.
- Avertizarea de vechime a cursului, cu luna lui.
- Foaie de stil pentru tiparire: alb-negru, text mare, fara sume, cu data generarii.
- Ecranele `Siguranta` si `StergeTot`, cu confirmare inainte de stergere.

Teste: fiecare stare a planului (cu pasi, gol, cu frauda, cu pasul 14); varianta de tiparit nu contine nicio suma introdusa; stergerea cere confirmare.

Gata cand: testele trec si planul tiparit incape lizibil pe A4.

## Etapa 10 - Continutul real

Conditie: parametrii si verificarile din sectiunea 9 a specificatiei, furnizate sau aprobate de proprietar.

- `src/continut/pasi.ts`, `banci.ts`, `parametri.ts`: fiecare text, link si valoare are sursa si data verificarii.
- `src/continut/validare.ts`, rulat la build. Build-ul de publicare esueaza daca: lipseste un parametru; un text, un link sau un parametru nu are sursa ori data; plafonul are verificarea mai veche de 12 luni; exista continut marcat "CIORNA"; un text al pasilor 8 sau 9 contine formulari de recomandare dintr-o lista interzisa ("va recomandam", "cel mai bun", "alegeti", "cumparati", "schimbati").
- Textele se scriu cu diacritice si se citesc integral de proprietar inainte de publicare.

Lista interzisa prinde doar formularile evidente. Nu inlocuieste citirea textelor de catre proprietar si nici verificarea incadrarii ASF.

Gata cand: validarea trece pe continutul real si proprietarul a aprobat textele in scris.

## Etapa 11 - Functionare fara internet

Service worker (prin `vite-plugin-pwa`) care pastreaza aplicatia dupa prima incarcare; manifest pentru adaugarea pe ecranul principal. `cursuri.json` este exclus din ce pastreaza service worker-ul si se cere mereu din retea; copia lui este cea din etapa 6.

Teste: dupa o prima incarcare, aplicatia porneste si afiseaza planul fara retea; o versiune noua publicata inlocuieste versiunea veche la urmatoarea deschidere.

Gata cand: verificat pe calculator, pe `localhost`, cu reteaua oprita din uneltele browserului. Un service worker functioneaza doar pe `localhost` sau pe HTTPS, deci verificarea pe telefon, in mod avion, se face la etapa 12, dupa publicare.

## Etapa 12 - GitHub

Conditie: contul si numele repo-ului, de la proprietar. Crearea repo-ului si prima publicare se fac doar cu acordul lui explicit.

- Repo public. In el nu ajunge nicio data personala, iar publicarea pe Pages dintr-un repo public este varianta standard. Nu pot confirma daca un cont gratuit poate publica Pages dintr-un repo privat; pagina de documentatie consultata la 21.11.2026 nu spune nimic despre planuri. Daca proprietarul vrea repo privat, se verifica intai.
- `publicare.yml`: la fiecare modificare pe ramura principala ruleaza testele, validarea continutului si build-ul, apoi publica. Orice esec opreste publicarea. Poate fi apelat si din alt workflow.
- `cursuri.yml`: ruleaza programat in zilele 2 si 5 ale fiecarei luni, la o ora si un minut alese in afara inceputului de ora, si poate fi pornit si manual. Ruleaza jobul din etapa 5, salveaza `cursuri.json` in repo doar daca s-a schimbat, apoi apeleaza el insusi `publicare.yml`.

De ce apeleaza publicarea direct: din cate stiu, o modificare salvata in repo de un workflow cu jetonul lui implicit nu porneste alte workflow-uri, deci noul fisier de cursuri nu ar ajunge pe site. Nu am verificat asta in documentatie in aceasta sesiune. Apelarea directa functioneaza in ambele cazuri, iar criteriul de la finalul etapei o confirma.

Limite confirmate din documentatia GitHub (pagina "Events that trigger workflows", sectiunea "schedule", citita la 21.11.2026):

- Intr-un repo public, workflow-urile programate sunt dezactivate automat dupa 60 de zile fara activitate in repo.
- Rularile programate pot fi intarziate in perioadele aglomerate, inclusiv la inceputul fiecarei ore, iar unele pot fi abandonate.

Consecinte pentru plan:

- A doua rulare, din ziua 5, acopera o rulare intarziata sau abandonata in ziua 2.
- Publicarea ruleaza validarea continutului. Cand verificarea plafonului de garantare depaseste 12 luni, publicarea esueaza, deci nici cursurile noi nu mai ajung pe site pana cand proprietarul reverifica plafonul. Este o legatura acceptata: esecul apare in GitHub Actions, iar aplicatia avertizeaza ca media este veche.
- Salvarea lunara a fisierului de cursuri este o modificare in repo. Nu pot confirma ca o modificare facuta de job conteaza ca "activitate" pentru regula celor 60 de zile. Daca nu conteaza, jobul va fi dezactivat dupa doua luni fara alte modificari, fara nicio rulare esuata vizibila.
- De aceea singurul semnal sigur ramane avertizarea de vechime din aplicatie. Proprietarul trebuie sa deschida aplicatia cel putin o data pe luna, dupa ziua 10, sau sa isi puna o reamintire.

Gata cand: aplicatia este accesibila la adresa Pages; o rulare manuala a jobului actualizeaza `cursuri.json` si aplicatia publicata afiseaza luna noua; pe un telefon real, dupa o prima deschidere, aplicatia porneste in mod avion.

## Etapa 13 - Test cu utilizatori reali

- Cel putin un om de peste 65 de ani parcurge fiecare ecran, cu proprietarul de fata, fara ca acesta sa intervina decat cand omul se blocheaza.
- Se noteaza: unde s-a oprit, ce a citit gresit, ce termen nu a inteles, daca a citit totalul orientativ ca valoare exacta, daca a inteles ca aplicatia nu ii spune ce sa aleaga.
- Corecturile se fac in texte si ecrane, apoi se repeta testul pe ecranele schimbate.

Gata cand: omul termina chestionarul cu ajutor doar la prima configurare, apoi deschide si citeste singur planul.

## Ordine si dependente

- 1 -> 2 -> 3 -> 4 este lantul motorului de reguli.
- 5 si 6 depind doar de 2 si pot fi facute in paralel cu 3 si 4.
- 7 depinde doar de 2.
- 8 depinde de 2 si 7; 9 depinde de 4, 6 si 8.
- 10 depinde de 4 si de proprietar; 11 depinde de 9; 12 depinde de 5, 10 si 11; 13 depinde de 12.

## Ce nu acopera planul

Tot ce este in sectiunea 12 a specificatiei, plus: monitorizare automata a jobului in afara avertizarii din aplicatie, statistici de folosire si orice canal prin care utilizatorii ar putea trimite date catre proprietar.
