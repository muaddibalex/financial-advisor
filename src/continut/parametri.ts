// Parametrii de continut (specificatie, sectiunea 5). Sunt decizii ale
// proprietarului, nu ale aplicatiei:
//
//  - luniRezerva:          rezerva tinta, in luni de cheltuieli;
//  - pragNumerarAcasaLei:  pragul in lei pentru "multi bani in casa";
//  - marjaPlafonEur:       marja fata de plafonul de garantare;
//  - plafonGarantareEur:   plafonul de garantare, din sursa oficiala,
//    cu plafonVerificatLa: data la care a fost verificat.
//
// NEDECISI. Cat timp valoarea de mai jos este null, pasii care depind de
// parametri apar in forma generala, fara calcul. Aici nu se scriu valori de
// proba: o valoare scrisa aici ajunge in aplicatie.
//
// La completare (etapa 10) se noteaza, pentru fiecare valoare, cine a decis-o
// si cand, iar pentru plafon sursa oficiala si data verificarii.

import type { Parametri } from "../domeniu/tipuri";

export const PARAMETRI: Parametri | null = null;
