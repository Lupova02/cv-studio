// Erzeugt shared/catalogs/country-data.ts: Ländernamen (i18n-iso-countries), Vorwahlen und Staatsangehörigkeiten in de/en/tr.
// Manuell ausführen mit "node scripts/generate-countries.mjs", wenn sich die Länderdaten ändern sollen.
import { readFileSync, writeFileSync } from 'node:fs';
import countries from 'i18n-iso-countries';
import de from 'i18n-iso-countries/langs/de.json' with { type: 'json' };
import en from 'i18n-iso-countries/langs/en.json' with { type: 'json' };
import tr from 'i18n-iso-countries/langs/tr.json' with { type: 'json' };

countries.registerLocale(de);
countries.registerLocale(en);
countries.registerLocale(tr);

/** Internationale Vorwahlen ohne Pluszeichen je ISO-Code, als kompakte Liste "CODE:VORWAHL". */
const DIAL = Object.fromEntries(
  `
AF:93 AX:358 AL:355 DZ:213 AS:1 AD:376 AO:244 AI:1 AQ:672 AG:1 AR:54 AM:374 AW:297 AU:61 AT:43 AZ:994
BS:1 BH:973 BD:880 BB:1 BY:375 BE:32 BZ:501 BJ:229 BM:1 BT:975 BO:591 BQ:599 BA:387 BW:267 BR:55 IO:246
BN:673 BG:359 BF:226 BI:257 CV:238 KH:855 CM:237 CA:1 KY:1 CF:236 TD:235 CL:56 CN:86 CX:61 CC:61 CO:57
KM:269 CG:242 CD:243 CK:682 CR:506 CI:225 HR:385 CU:53 CW:599 CY:357 CZ:420 DK:45 DJ:253 DM:1 DO:1 EC:593
EG:20 SV:503 GQ:240 ER:291 EE:372 SZ:268 ET:251 FK:500 FO:298 FJ:679 FI:358 FR:33 GF:594 PF:689 TF:262
GA:241 GM:220 GE:995 DE:49 GH:233 GI:350 GR:30 GL:299 GD:1 GP:590 GU:1 GT:502 GG:44 GN:224 GW:245 GY:592
HT:509 VA:39 HN:504 HK:852 HU:36 IS:354 IN:91 ID:62 IR:98 IQ:964 IE:353 IM:44 IL:972 IT:39 JM:1 JP:81
JE:44 JO:962 KZ:7 KE:254 KI:686 KP:850 KR:82 KW:965 KG:996 LA:856 LV:371 LB:961 LS:266 LR:231 LY:218
LI:423 LT:370 LU:352 MO:853 MG:261 MW:265 MY:60 MV:960 ML:223 MT:356 MH:692 MQ:596 MR:222 MU:230 YT:262
MX:52 FM:691 MD:373 MC:377 MN:976 ME:382 MS:1 MA:212 MZ:258 MM:95 NA:264 NR:674 NP:977 NL:31 NC:687 NZ:64
NI:505 NE:227 NG:234 NU:683 NF:672 MK:389 MP:1 NO:47 OM:968 PK:92 PW:680 PS:970 PA:507 PG:675 PY:595 PE:51
PH:63 PN:64 PL:48 PT:351 PR:1 QA:974 RE:262 RO:40 RU:7 RW:250 BL:590 SH:290 KN:1 LC:1 MF:590 PM:508 VC:1
WS:685 SM:378 ST:239 SA:966 SN:221 RS:381 SC:248 SL:232 SG:65 SX:1 SK:421 SI:386 SB:677 SO:252 ZA:27 GS:500
SS:211 ES:34 LK:94 SD:249 SR:597 SJ:47 SE:46 CH:41 SY:963 TW:886 TJ:992 TZ:255 TH:66 TL:670 TG:228 TK:690
TO:676 TT:1 TN:216 TR:90 TM:993 TC:1 TV:688 UG:256 UA:380 AE:971 GB:44 US:1 UY:598 UZ:998 VU:678 VE:58
VN:84 VG:1 VI:1 WF:681 EH:212 YE:967 ZM:260 ZW:263 XK:383
`
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(':')),
);

/** Ländernamen je Sprache, jeweils als Objekt ISO-Code → Name. */
const names = {
  de: countries.getNames('de'),
  en: countries.getNames('en'),
  tr: countries.getNames('tr'),
};

// Die englische Liste gilt als maßgebliche Menge aller Länder; fehlende Vorwahlen sind nur eine Warnung.
const codes = Object.keys(names.en).sort();
const missing = codes.filter((code) => !DIAL[code]);
if (missing.length > 0) {
  console.warn('ohne Vorwahl:', missing.join(', '));
}

// Staatsangehörigkeiten je Sprache aus scripts/data; die türkische Datei ist direkt ein Objekt ISO-Code → Adjektiv.
const nationalityDe = JSON.parse(readFileSync(new URL('./data/nationality-de.json', import.meta.url), 'utf8')).nationalities;
const nationalityEn = JSON.parse(readFileSync(new URL('./data/nationality-en.json', import.meta.url), 'utf8')).nationalities;
const nationalityTr = JSON.parse(readFileSync(new URL('./data/nationality-tr.json', import.meta.url), 'utf8'));

/** Manuelle Korrekturen für fehlende oder unpassende Staatsangehörigkeiten in den Quelldateien (gehen den Quelldaten vor). */
const DEMONYM_FIX = {
  AE: { de: 'Emiratisch', en: 'Emirati' },
  AI: { de: 'Anguillanisch', en: 'Anguillan' },
  AQ: { de: 'Antarktisch', en: 'Antarctic' },
  AS: { de: 'Amerikanisch-samoanisch', en: 'American Samoan' },
  AW: { de: 'Arubanisch', en: 'Aruban' },
  BA: { en: 'Bosnian' },
  BY: { de: 'Belarussisch' },
  PS: { de: 'Palästinensisch', en: 'Palestinian' },
  XK: { de: 'Kosovarisch', en: 'Kosovar' },
};

/** Ein Datensatz pro Land; bricht ab, wenn eine Staatsangehörigkeit fehlt, und fällt bei fehlenden de/tr-Namen auf Englisch zurück. */
const rows = codes.map((code) => {
  const fix = DEMONYM_FIX[code] ?? {};
  const demonym = {
    de: fix.de ?? nationalityDe[code],
    en: fix.en ?? nationalityEn[code],
    tr: nationalityTr[code],
  };
  if (!demonym.de || !demonym.en || !demonym.tr) {
    throw new Error(`Staatsangehörigkeit fehlt für ${code}: ${JSON.stringify(demonym)}`);
  }
  return {
    code,
    dial: DIAL[code] ? `+${DIAL[code]}` : '',
    name: {
      de: names.de[code] ?? names.en[code],
      en: names.en[code],
      tr: names.tr[code] ?? names.en[code],
    },
    demonym,
  };
});

/** Die Länderzeilen als TypeScript-Quelltext, eine Zeile pro Land (JSON.stringify sorgt für korrektes Escaping). */
const body = rows
  .map(
    (row) =>
      `  { code: '${row.code}', dial: '${row.dial}', name: { de: ${JSON.stringify(row.name.de)}, en: ${JSON.stringify(row.name.en)}, tr: ${JSON.stringify(row.name.tr)} }, demonym: { de: ${JSON.stringify(row.demonym.de)}, en: ${JSON.stringify(row.demonym.en)}, tr: ${JSON.stringify(row.demonym.tr)} } },`,
  )
  .join('\n');

// Vorlage der erzeugten Datei. Kommentare darin landen 1:1 in country-data.ts und dürfen weder Backticks noch Platzhalter-Syntax enthalten.
const file = `// Länderkatalog (ISO-3166-Codes) mit Namen, Telefonvorwahlen und Staatsangehörigkeiten in de/en/tr.
// AUTOMATISCH ERZEUGT von scripts/generate-countries.mjs – Änderungen dort vornehmen, nicht in dieser Datei.
import type { CvLanguage } from '../cv/cv-data';

/** Ein Land mit ISO-Code, internationaler Vorwahl und lokalisierten Bezeichnungen. */
export interface CountryRecord {
  /** ISO-3166-1-Alpha-2-Code, z. B. 'DE'. */
  code: string;
  /** Internationale Vorwahl mit Pluszeichen, z. B. '+49'; leer, wenn keine bekannt ist. */
  dial: string;
  name: Record<CvLanguage, string>;
  /** Staatsangehörigkeit als Adjektiv, z. B. 'Deutsch' / 'German' / 'Alman'. */
  demonym: Record<CvLanguage, string>;
}

/** Alle Länder, alphabetisch nach ISO-Code sortiert. */
export const COUNTRIES: readonly CountryRecord[] = [
${body}
];

/** Schnellzugriff auf Länder über ihren ISO-Code. */
const BY_CODE = new Map(COUNTRIES.map((country) => [country.code, country]));

/** Kompletter Ländereintrag zum ISO-Code oder undefined, wenn der Code unbekannt ist. */
export function countryRecord(code: string): CountryRecord | undefined {
  return BY_CODE.get(code);
}

/** Ländername in der gewünschten Sprache; leerer String bei unbekanntem Code. */
export function countryName(code: string, language: CvLanguage): string {
  return BY_CODE.get(code)?.name[language] ?? '';
}

/** Staatsangehörigkeit als Adjektiv (z. B. 'Deutsch', 'Türk') in der gewünschten Sprache; leer bei unbekanntem Code. */
export function nationalityAdjective(code: string, language: CvLanguage): string {
  return BY_CODE.get(code)?.demonym[language] ?? '';
}

/** Internationale Vorwahl des Landes (z. B. '+90'); leer bei unbekanntem Code. */
export function countryDial(code: string): string {
  return BY_CODE.get(code)?.dial ?? '';
}

/** Kopie aller Länder, alphabetisch nach dem Namen in der gewünschten Sprache sortiert – für Auswahllisten im Editor. */
export function countriesFor(language: CvLanguage): CountryRecord[] {
  return [...COUNTRIES].sort((left, right) => left.name[language].localeCompare(right.name[language], language));
}

/** Bevorzugtes Land für Vorwahlen, die sich mehrere Länder teilen (z. B. +1 für USA, Kanada und Karibikstaaten). */
const PREFERRED_DIAL: Record<string, string> = {
  '+1': 'US',
  '+7': 'RU',
  '+44': 'GB',
  '+47': 'NO',
  '+61': 'AU',
  '+212': 'MA',
  '+262': 'RE',
  '+358': 'FI',
  '+590': 'GP',
  '+599': 'CW',
};

/** Zusätzliche Schreibweisen von Staatsangehörigkeiten (bereits normalisiert wie durch fold), damit Freitext aus älteren Daten einem Land zugeordnet werden kann. */
const ADJECTIVES: Record<string, string> = {
  deutsch: 'DE',
  german: 'DE',
  alman: 'DE',
  tuerkisch: 'TR',
  turkisch: 'TR',
  turkish: 'TR',
  oesterreichisch: 'AT',
  osterreichisch: 'AT',
  schweizerisch: 'CH',
  schweizer: 'CH',
  franzoesisch: 'FR',
  franzosisch: 'FR',
  italienisch: 'IT',
  spanisch: 'ES',
  polnisch: 'PL',
  russisch: 'RU',
  ukrainisch: 'UA',
  amerikanisch: 'US',
  britisch: 'GB',
  griechisch: 'GR',
  niederlaendisch: 'NL',
  niederlandisch: 'NL',
  syrisch: 'SY',
  irakisch: 'IQ',
  iranisch: 'IR',
  afghanisch: 'AF',
  chinesisch: 'CN',
  japanisch: 'JP',
  indisch: 'IN',
  brasilianisch: 'BR',
  kanadisch: 'CA',
  australisch: 'AU',
};

/** Normalisiert Text für den Vergleich: getrimmt, kleingeschrieben, ohne Akzente und Umlautpunkte, ß als ss. */
function fold(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('de')
    .normalize('NFKD')
    .replace(/\\p{M}/gu, '')
    .replaceAll('ß', 'ss');
}

/** Nachschlagetabelle: normalisierter Länder- oder Nationalitätsname (alle Sprachen) zum ISO-Code. */
const NAME_TO_CODE = new Map<string, string>();
for (const country of COUNTRIES) {
  for (const language of ['de', 'en', 'tr'] as const) {
    NAME_TO_CODE.set(fold(country.name[language]), country.code);
  }
}
for (const [alias, code] of Object.entries(ADJECTIVES)) {
  NAME_TO_CODE.set(alias, code);
}

/** ISO-Code zu einer Vorwahl wie '+49'; bei geteilten Vorwahlen gilt PREFERRED_DIAL, sonst das erste passende Land. Leer, wenn unbekannt. */
export function countryForDial(dial: string): string {
  return PREFERRED_DIAL[dial] ?? COUNTRIES.find((country) => country.dial === dial)?.code ?? '';
}

/** Ordnet Freitext (Ländername in de/en/tr oder gängige Nationalität) einem ISO-Code zu, z. B. beim Übernehmen alter Daten; leer, wenn nichts passt. */
export function matchCountry(value: string): string {
  return NAME_TO_CODE.get(fold(value)) ?? '';
}
`;

writeFileSync(new URL('../shared/catalogs/country-data.ts', import.meta.url), file);
console.log(`wrote ${rows.length} countries`);
