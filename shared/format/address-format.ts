// Länderspezifische Adressformulare: welche Adressfelder ein Land hat, in welcher Reihenfolge und mit welcher Beschriftung.
// Steuert sowohl die Eingabefelder im Editor als auch, welche Werte in den Vorlagen gedruckt werden.

/** Gespeicherte Felder einer Postadresse (Schlüssel in PostalAddress). */
export type AddressValueKey =
  | 'street'
  | 'houseNumber'
  | 'postalCode'
  | 'city'
  | 'region'
  | 'neighborhood'
  | 'apartment'
  | 'district'
  | 'province';

/** Beschriftungen für Adressfelder (Schlüssel in UiText.addressLabel); dasselbe Feld heißt je Land anders, z. B. PLZ, ZIP oder Postfach. */
export type AddressLabelKey =
  | 'street'
  | 'houseNumber'
  | 'postalCode'
  | 'zip'
  | 'city'
  | 'state'
  | 'region'
  | 'neighborhood'
  | 'buildingNumber'
  | 'apartment'
  | 'district'
  | 'province'
  | 'provinceTr'
  | 'postcode'
  | 'area'
  | 'emirate'
  | 'prefecture'
  | 'poBox';

/** Ein Eingabefeld des Adressformulars: welcher Wert gespeichert wird und wie das Feld beschriftet ist. */
export interface AddressField {
  key: AddressValueKey;
  label: AddressLabelKey;
}

/** Standardformular (z. B. Deutschland): Straße, Hausnummer, PLZ, Stadt. */
const POSTAL: AddressField[] = [
  { key: 'street', label: 'street' },
  { key: 'houseNumber', label: 'houseNumber' },
  { key: 'postalCode', label: 'postalCode' },
  { key: 'city', label: 'city' },
];

/** Großbritannien und Irland: Hausnummer vor der Straße, Postcode am Ende. */
const UK: AddressField[] = [
  { key: 'houseNumber', label: 'houseNumber' },
  { key: 'street', label: 'street' },
  { key: 'city', label: 'city' },
  { key: 'postalCode', label: 'postcode' },
];

/** Türkei: Mahalle, Straße, Gebäude- und Wohnungsnummer, İlçe (Kreis) und İl (Provinz); keine Postleitzahl. */
const TURKEY: AddressField[] = [
  { key: 'neighborhood', label: 'neighborhood' },
  { key: 'street', label: 'street' },
  { key: 'houseNumber', label: 'buildingNumber' },
  { key: 'apartment', label: 'apartment' },
  { key: 'district', label: 'district' },
  { key: 'province', label: 'provinceTr' },
];

/** Japan: vom Großen zum Kleinen – PLZ, Präfektur, Stadt, Straße, Hausnummer. */
const JAPAN: AddressField[] = [
  { key: 'postalCode', label: 'postalCode' },
  { key: 'region', label: 'prefecture' },
  { key: 'city', label: 'city' },
  { key: 'street', label: 'street' },
  { key: 'houseNumber', label: 'houseNumber' },
];

/** Länder ohne Postleitzahlensystem: statt PLZ ein Feld für Gebiet/Region. */
const NO_POSTAL: AddressField[] = [
  { key: 'street', label: 'street' },
  { key: 'houseNumber', label: 'houseNumber' },
  { key: 'city', label: 'city' },
  { key: 'region', label: 'area' },
];

/** Golfstaaten: Emirat statt Region, Postfach statt PLZ. */
const GULF = new Set(['AE', 'QA', 'KW', 'BH', 'OM']);
/** Länder, in denen Bundesstaat/Provinz/Region zur Adresse gehört. */
const REGION = new Set(['US', 'CA', 'AU', 'BR', 'MX', 'IN', 'CN', 'RU', 'UA', 'MY', 'NZ', 'ZA', 'AR', 'NG', 'PH', 'ID', 'KR', 'TH', 'VN', 'SA']);
/** Länder ohne (gebräuchliche) Postleitzahl. */
const NO_POSTAL_COUNTRIES = new Set([
  'AO', 'AG', 'AW', 'BF', 'BI', 'BJ', 'BQ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CK', 'CM', 'CW', 'DJ', 'DM', 'ER', 'FJ',
  'GA', 'GD', 'GM', 'GQ', 'GY', 'HK', 'KI', 'KM', 'KN', 'LC', 'LY', 'MO', 'ML', 'MR', 'MW', 'NR', 'NU', 'PA', 'RW',
  'SB', 'SC', 'SL', 'SO', 'SR', 'SS', 'ST', 'SX', 'TD', 'TG', 'TK', 'TO', 'TT', 'TV', 'UG', 'VU', 'WS', 'YE', 'ZW',
]);

/** Landesübliche Bezeichnung des Regionsfelds: Provinz (Kanada), Bundesstaat (z. B. USA) oder allgemein Region. */
function regionLabel(country: string): AddressLabelKey {
  if (country === 'CA') {
    return 'province';
  }
  if (country === 'US' || country === 'AU' || country === 'BR' || country === 'MX' || country === 'IN' || country === 'NG' || country === 'MY') {
    return 'state';
  }
  return 'region';
}

/** Adressfelder in Eingabe-Reihenfolge für ein Land (ISO-Code); unbekannte Länder bekommen das Standardformular. */
export function addressFields(country: string): AddressField[] {
  if (country === 'TR') {
    return TURKEY;
  }
  if (country === 'GB' || country === 'IE') {
    return UK;
  }
  if (country === 'JP') {
    return JAPAN;
  }
  if (GULF.has(country)) {
    return [
      { key: 'street', label: 'street' },
      { key: 'houseNumber', label: 'buildingNumber' },
      { key: 'city', label: 'city' },
      { key: 'region', label: 'emirate' },
      { key: 'postalCode', label: 'poBox' },
    ];
  }
  if (NO_POSTAL_COUNTRIES.has(country)) {
    return NO_POSTAL;
  }
  if (REGION.has(country)) {
    return [
      { key: 'houseNumber', label: 'houseNumber' },
      { key: 'street', label: 'street' },
      { key: 'city', label: 'city' },
      { key: 'region', label: regionLabel(country) },
      { key: 'postalCode', label: country === 'US' ? 'zip' : 'postalCode' },
    ];
  }
  return POSTAL;
}
