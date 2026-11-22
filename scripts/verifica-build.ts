// Verifica rezultatul build-ului (dist/) inainte de publicare. Se ruleaza dupa
// "npm run build"; iese cu eroare daca vreo regula este incalcata.
//
// Reguli:
//  - service worker-ul pastreaza pagina, codul, stilurile, manifestul si
//    iconitele, dar NU cursuri.json (se cere mereu din retea);
//  - codul aplicatiei este un singur fisier: o pagina deja deschisa nu mai cere
//    nimic dupa ce o versiune noua sterge cache-ul vechi;
//  - nicio adresa nu incepe cu "/": pe GitHub Pages aplicatia sta sub /<nume-repo>/;
//  - nimic nu se incarca de pe alt site: fara scripturi, fonturi sau imagini de la terti;
//  - pagina cere motoarelor de cautare sa nu o listeze.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = process.argv[2] ?? "dist";
const probleme: string[] = [];
const cere = (conditie: boolean, mesaj: string) => {
  if (!conditie) probleme.push(mesaj);
};

function fisiere(dosar: string): string[] {
  return readdirSync(dosar).flatMap((nume) => {
    const cale = join(dosar, nume);
    return statSync(cale).isDirectory() ? fisiere(cale) : [cale];
  });
}

if (!existsSync(join(DIST, "sw.js"))) {
  console.error(`Nu exista ${DIST}/sw.js. Rulati intai "npm run build".`);
  process.exit(1);
}

const sw = readFileSync(join(DIST, "sw.js"), "utf8");
const pastrate = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1] ?? "");
const cod = pastrate.filter((u) => u.endsWith(".js"));
const stiluri = pastrate.filter((u) => u.endsWith(".css"));

cere(pastrate.includes("index.html"), "pagina (index.html) nu este pastrata pentru folosirea fara internet");
cere(pastrate.includes("manifest.webmanifest"), "manifestul nu este pastrat");
cere(pastrate.some((u) => u.endsWith(".png")), "iconitele nu sunt pastrate");
cere(cod.length === 1, `codul aplicatiei trebuie sa fie un singur fisier, sunt ${cod.length}`);
cere(stiluri.length === 1, `stilurile trebuie sa fie un singur fisier, sunt ${stiluri.length}`);
cere(!pastrate.some((u) => u.includes("cursuri")), "cursuri.json nu are voie in copia pastrata de service worker");
cere(!/registerRoute\((?!new \w+\.NavigationRoute)/.test(sw), "service worker-ul are reguli de cache in plus fata de pagina aplicatiei");
for (const u of pastrate) {
  cere(!u.startsWith("/") && !/^[a-z]+:/i.test(u), `adresa pastrata nu este relativa: ${u}`);
  cere(existsSync(join(DIST, u)), `fisier pastrat, dar inexistent: ${u}`);
}
cere(existsSync(join(DIST, "cursuri.json")), "cursuri.json lipseste din build");

const html = readFileSync(join(DIST, "index.html"), "utf8");
for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const adresa = m[1] ?? "";
  cere(adresa.startsWith("./"), `index.html: adresa nu este relativa: ${adresa}`);
}
// Decizia despre incadrare se sprijina pe faptul ca aplicatia ramane pentru cateva persoane.
cere(/<meta name="robots" content="noindex/.test(html), "index.html nu cere motoarelor de cautare sa nu listeze aplicatia (lipseste noindex)");
cere(!/serviceWorker|registerSW/.test(html), "index.html inregistreaza si el service worker-ul; inregistrarea se face o singura data, din aplicatie");

const manifest = JSON.parse(readFileSync(join(DIST, "manifest.webmanifest"), "utf8")) as Record<string, unknown>;
cere(manifest.start_url === "./", `manifest: start_url trebuie sa fie "./", este ${String(manifest.start_url)}`);
cere(manifest.scope === "./", `manifest: scope trebuie sa fie "./", este ${String(manifest.scope)}`);
for (const iconita of (manifest.icons as { src: string }[] | undefined) ?? []) {
  cere(!iconita.src.startsWith("/") && existsSync(join(DIST, iconita.src)), `manifest: iconita lipsa sau cu adresa absoluta: ${iconita.src}`);
}

// Nicio cerere catre alt site. Sunt ingaduite doar adresele care apar ca text pentru om
// sau in comentarii de licenta, trecute aici una cate una.
const ADRESE_INGADUITE: readonly RegExp[] = [
  /^https?:\/\/www\.w3\.org\//,
  // Text dintr-un mesaj de eroare al bibliotecii workbox. Nu este o cerere.
  /^https:\/\/bit\.ly\/wb-precache$/,
];
// Linkurile oficiale ale pasilor sunt adrese pe care le deschide omul, nu incarcari facute de aplicatie.
// Sunt ingaduite exact cele declarate in fisierul de continut, nimic in plus.
const LINKURI_DIN_PASI = new Set(
  [...readFileSync(join("src", "continut", "pasi.ts"), "utf8").matchAll(/adresa:\s*"(https:\/\/[^"]+)"/g)].map((m) => m[1] ?? ""),
);

for (const cale of fisiere(DIST)) {
  if (!/\.(html|js|css|webmanifest|json)$/.test(cale)) continue;
  for (const m of readFileSync(cale, "utf8").matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)) {
    const ingaduita = ADRESE_INGADUITE.some((r) => r.test(m[0])) || LINKURI_DIN_PASI.has(m[0]);
    cere(ingaduita, `${cale}: adresa catre alt site: ${m[0]}`);
  }
}

if (probleme.length > 0) {
  console.error(`Build-ul din ${DIST}/ nu poate fi publicat:`);
  for (const p of probleme) console.error(` - ${p}`);
  process.exit(1);
}
console.log(`Build-ul din ${DIST}/ este in regula: ${pastrate.length} fisiere pastrate pentru folosirea fara internet, fara cursuri.json.`);
