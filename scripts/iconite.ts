// Deseneaza iconitele aplicatiei: un patrat verde cu un inel alb, ca o moneda.
// Sunt generate aici, fara nicio imagine luata din alta parte.
//
// Rulare: node scripts/iconite.ts  (scrie public/iconita-192.png si public/iconita-512.png)

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const VERDE = [0x0b, 0x5a, 0x4a] as const;
const ALB = [0xff, 0xff, 0xff] as const;

const TABEL_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(date: Uint8Array): number {
  let c = 0xffffffff;
  for (const octet of date) c = (TABEL_CRC[(c ^ octet) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bucata(tip: string, date: Uint8Array): Buffer {
  const corp = Buffer.concat([Buffer.from(tip, "ascii"), date]);
  const lungime = Buffer.alloc(4);
  lungime.writeUInt32BE(date.length);
  const suma = Buffer.alloc(4);
  suma.writeUInt32BE(crc32(corp));
  return Buffer.concat([lungime, corp, suma]);
}

/** Cat din pixel este acoperit de inel, intre 0 si 1, pentru margini netede. */
function acoperire(x: number, y: number, latura: number): number {
  // Inelul sta in mijlocul iconitei, in zona care ramane vizibila si cand telefonul o decupeaza rotund.
  const centru = latura / 2;
  const exterior = latura * 0.3;
  const interior = latura * 0.19;
  const PROBE = 4;
  let inauntru = 0;
  for (let i = 0; i < PROBE; i++) {
    for (let j = 0; j < PROBE; j++) {
      const d = Math.hypot(x + (i + 0.5) / PROBE - centru, y + (j + 0.5) / PROBE - centru);
      if (d <= exterior && d >= interior) inauntru++;
    }
  }
  return inauntru / (PROBE * PROBE);
}

function iconita(latura: number): Buffer {
  const rand = 1 + latura * 3;
  const pixeli = Buffer.alloc(rand * latura);
  for (let y = 0; y < latura; y++) {
    for (let x = 0; x < latura; x++) {
      const a = acoperire(x, y, latura);
      for (let canal = 0; canal < 3; canal++) {
        pixeli[y * rand + 1 + x * 3 + canal] = Math.round((VERDE[canal] ?? 0) * (1 - a) + (ALB[canal] ?? 0) * a);
      }
    }
  }
  const antet = Buffer.alloc(13);
  antet.writeUInt32BE(latura, 0);
  antet.writeUInt32BE(latura, 4);
  antet.set([8, 2, 0, 0, 0], 8); // 8 biti pe canal, culoare RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bucata("IHDR", antet),
    bucata("IDAT", deflateSync(pixeli, { level: 9 })),
    bucata("IEND", new Uint8Array()),
  ]);
}

for (const latura of [192, 512]) {
  const cale = `public/iconita-${latura}.png`;
  writeFileSync(cale, iconita(latura));
  console.log(`scris ${cale}`);
}
