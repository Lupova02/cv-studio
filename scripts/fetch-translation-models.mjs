// Lädt die Bergamot-Übersetzungsmodelle (de↔en, tr↔en) von Mozilla nach public/translation/models und prüft sie per SHA-256.
// Läuft vor "ng serve" und dem Build (npm run models); bereits vorhandene, unveränderte Dateien werden übersprungen.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

// Modelle von Firefox Translations (MPL-2.0), auf veröffentlichte Versionen festgelegt, damit Builds reproduzierbar sind.
const BASE_URL = 'https://storage.googleapis.com/moz-fx-translations-data--303e-prod-translations-data/models';
const TARGET = path.resolve(import.meta.dirname, '..', 'public', 'translation', 'models');

/** Je Sprachrichtung: Trainingslauf (Ordner auf dem Server) und erwartete SHA-256-Prüfsumme jeder entpackten Datei (Modell, Lexikon, Vokabular). */
const MODELS = {
  'de-en': {
    run: 'retrain_hr2_WZOW24i4QJmIib61LeHfwg',
    files: {
      'model.deen.intgemm.alphas.bin': '3e6f7c2c2425d10824797270b382bee718ff34af2cab9308841c82ca46dc6f20',
      'lex.50.50.deen.s2t.bin': '113b98460468360cca68c042e1cddf49c4e1931cbb975ed04349c9a3bd607010',
      'vocab.deen.spm': '69f730becafa48e3bb2c244eab66456877c08959a02f2bd5519b5a3088b62f9c',
    },
  },
  'en-de': {
    run: 'retrain_hr_fix_names_SCgGhxUPQ2WAECHLRtzrMg',
    files: {
      'model.ende.intgemm.alphas.bin': '8df29d9494d19f47fd5d97c6a73474c6f657e9f81c1a607c431d02befdf3810f',
      'lex.50.50.ende.s2t.bin': '7ed39f1cffbd68a27ddf05bbfe068de2060f1d7e69f1a20e27ae923551dd7393',
      'vocab.ende.spm': '69f730becafa48e3bb2c244eab66456877c08959a02f2bd5519b5a3088b62f9c',
    },
  },
  'tr-en': {
    run: 'statmt_xxxxxxxxRxSxxxxxxxxxxA',
    files: {
      'model.tren.intgemm.alphas.bin': 'bd18594ac5a7f1d9997e7ea5bd80272082219cf8b1ce604766e4f207eb86abbf',
      'lex.50.50.tren.s2t.bin': 'd3374ab5267a73ee1aa1d926a298bd349426835f40856991ee959bc5cd4f9fce',
      'vocab.tren.spm': 'ed328e589a3ccd70fd3ce7773fc3c01d8b7b18c687464cacf17fd40a8c0daadd',
    },
  },
  'en-tr': {
    run: 'spring-2024_LiFGeNrEQpKdNlziG2qP_A',
    files: {
      'model.entr.intgemm.alphas.bin': 'ea3cd4ee09de190df265c78d84260e277a9a8a3ddff05eb55d72afe7fc0fdbf4',
      'lex.50.50.entr.s2t.bin': '3aba0be842bd4c192659c781e6fdce8eb9b2b1fff29a40d22f75da369d59f46f',
      'vocab.entr.spm': 'a220363d60391f7ce3df8ec9785424dbc00c24d5786d1a4308cf8ca3ed3385c2',
    },
  },
};

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/** Prüft, ob die Datei schon lokal mit der erwarteten Prüfsumme liegt; false auch, wenn sie fehlt. */
async function isCurrent(file, hash) {
  try {
    return sha256(await readFile(file)) === hash;
  } catch {
    return false;
  }
}

/** Lädt eine gzip-komprimierte Modelldatei, entpackt und prüft sie; true, wenn sie neu geschrieben wurde, false, wenn sie schon aktuell war. */
async function fetchFile(pair, run, name, hash) {
  const file = path.join(TARGET, pair, name);
  if (await isCurrent(file, hash)) {
    return false;
  }
  const url = `${BASE_URL}/${pair}/${run}/exported/${name}.gz`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url}: HTTP ${response.status}`);
  }
  const data = gunzipSync(Buffer.from(await response.arrayBuffer()));
  if (sha256(data) !== hash) {
    throw new Error(`${pair}/${name}: Prüfsumme stimmt nicht.`);
  }
  await mkdir(path.dirname(file), { recursive: true });
  // Erst in eine Temp-Datei schreiben und dann umbenennen, damit ein Abbruch keine halbe Modelldatei hinterlässt.
  await writeFile(`${file}.tmp`, data);
  await rename(`${file}.tmp`, file);
  return true;
}

let fetched = 0;
for (const [pair, { run, files }] of Object.entries(MODELS)) {
  for (const [name, hash] of Object.entries(files)) {
    if (await fetchFile(pair, run, name, hash)) {
      fetched += 1;
      console.log(`Übersetzungsmodell geladen: ${pair}/${name}`);
    }
  }
}
console.log(fetched ? `${fetched} Modelldateien aktualisiert.` : 'Übersetzungsmodelle sind aktuell.');
