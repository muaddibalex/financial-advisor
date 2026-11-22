// Verifica daca continutul aplicatiei poate fi publicat. Iese cu eroare si
// listeaza problemele daca nu. Il apeleaza publicarea (etapa 12), inainte de build.
//
// Rulare: npm run verifica-continut
//
// Modulele aplicatiei sunt incarcate prin Vite, la fel ca in aplicatie, fiindca
// Node singur nu gaseste importurile scrise fara extensie.

import { createServer } from "vite";

const server = await createServer({ configFile: false, appType: "custom", logLevel: "error", server: { middlewareMode: true } });
let probleme: readonly string[];
try {
  const incarca = <T>(cale: string) => server.ssrLoadModule(cale) as Promise<T>;
  const { BANCI } = await incarca<typeof import("../src/continut/banci.ts")>("/src/continut/banci.ts");
  const { INCADRARE_ASF } = await incarca<typeof import("../src/continut/incadrare.ts")>("/src/continut/incadrare.ts");
  const { PARAMETRI, PROVENIENTA_PARAMETRI } = await incarca<typeof import("../src/continut/parametri.ts")>("/src/continut/parametri.ts");
  const { PASI } = await incarca<typeof import("../src/continut/pasi.ts")>("/src/continut/pasi.ts");
  const { CONSTATARI, CONSTATARI_IN_CIORNA } = await incarca<typeof import("../src/continut/constatari.ts")>("/src/continut/constatari.ts");
  const { valideazaContinut } = await incarca<typeof import("../src/continut/validare.ts")>("/src/continut/validare.ts");

  const azi = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  probleme = valideazaContinut(
    {
      pasi: PASI,
      banci: BANCI,
      parametri: PARAMETRI,
      provenienta: PROVENIENTA_PARAMETRI,
      incadrare: INCADRARE_ASF,
      constatari: { texte: CONSTATARI, ciorna: CONSTATARI_IN_CIORNA },
    },
    azi,
  );
} finally {
  await server.close();
}

if (probleme.length > 0) {
  console.error(`Continutul NU poate fi publicat (${probleme.length} probleme):`);
  for (const p of probleme) console.error(` - ${p}`);
  process.exit(1);
}
console.log("Continutul poate fi publicat: nicio problema gasita de verificarea automata.");
console.log("Verificarea automata nu inlocuieste citirea textelor de catre proprietar.");
