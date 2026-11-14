// Texte der Bedienoberfläche (Editor, Werkzeugleiste, Dialoge, Meldungen) in de/en/tr.
// Die Oberfläche folgt der gewählten Lebenslauf-Sprache; Beschriftungen im gedruckten Lebenslauf stehen in labels.ts.
import type { AddressLabelKey } from '../format/address-format';
import type { CvLanguage, TemplateId } from '../cv/cv-data';

/** Alle Oberflächentexte einer Sprache; jede Sprache in UI_TEXT muss jeden Schlüssel liefern. */
export interface UiText {
  // --- Status, Muster-Lebenslauf und Werkzeugleiste ---
  loading: string;
  startEmpty: string;
  saving: string;
  saved: string;
  unsaved: string;
  ready: string;
  sample: string;
  sampleOnHint: string;
  sampleOffHint: string;
  sampleStatus: string;
  pdfHint: string;
  pdf: string;
  importJson: string;
  exportJson: string;
  deleteAll: string;
  version: string;
  // --- Persönliche Daten, Kontakt und Adresse ---
  personal: string;
  photo: string;
  choose: string;
  remove: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  /** Schaltet die Staatsangehörigkeit auf Freitext um („Sonstiges“). */
  other: string;
  /** Schaltet vom Freitext zurück zur Länderliste. */
  useList: string;
  addNationality: string;
  addPhone: string;
  dialCode: string;
  number: string;
  phoneKind: string;
  country: string;
  /** Beschriftungen der Adressfelder; welche davon ein Land nutzt, bestimmt address-format.ts. */
  addressLabel: Record<AddressLabelKey, string>;
  linkedIn: string;
  github: string;
  website: string;
  links: string;
  // --- Listeneinträge bearbeiten (Hinzufügen, Ziehen, Verschieben) ---
  add: string;
  drag: string;
  up: string;
  down: string;
  // --- Felder der Lebenslauf-Abschnitte ---
  position: string;
  company: string;
  location: string;
  city: string;
  from: string;
  until: string;
  current: string;
  description: string;
  bullet: string;
  addBullet: string;
  degree: string;
  institution: string;
  name: string;
  level: string;
  category: string;
  spokenLanguage: string;
  issuer: string;
  date: string;
  url: string;
  // --- Leere Abschnitte, Auswahl und Hinweise ---
  emptyExperience: string;
  emptyEducation: string;
  emptySkills: string;
  skillHint: string;
  chooseCategory: string;
  chooseLanguage: string;
  chooseLevel: string;
  languageHint: string;
  emptyLanguages: string;
  emptyCertificates: string;
  emptyProjects: string;
  emptyReferences: string;
  /** Platzhalter im Feld „Über mich“. */
  summaryHint: string;
  /** Schalter neben dem Geschlecht: Angabe im Lebenslauf zeigen oder ausblenden. */
  showGender: string;
  // --- Sprache, Ansicht und Gestaltung der Vorlage ---
  language: string;
  /** Bedienhilfe-Beschriftung des Trenners zwischen Editor und Vorschau. */
  resizePanes: string;
  /** Überschrift der Vorlagen-Auswahl im Design-Bereich. */
  templateLabel: string;
  accent: string;
  showPhoto: string;
  skillScale: string;
  skillStars: string;
  skillBars: string;
  skillOff: string;
  datePlace: string;
  dateAside: string;
  dateBelow: string;
  timeline: string;
  timelineOff: string;
  timelineLine: string;
  entryOrder: string;
  orderManual: string;
  orderNewest: string;
  font: string;
  pageNumbers: string;
  pageNumbersHint: string;
  pageNumbersOff: string;
  pageBadge: string;
  pagePill: string;
  pageNumberPlace: string;
  placeLeft: string;
  placeCenter: string;
  placeRight: string;
  // --- Bestätigungen und Meldungen (Sicherung, Löschen, Foto) ---
  confirmImport: string;
  confirmRemovePhoto: string;
  confirmEmpty: string;
  confirmDeleteAll: string;
  invalidExport: string;
  invalidLength: string;
  backupImported: string;
  backupSaved: string;
  backupInvalid: string;
  backupTooNew: string;
  backupTooLarge: string;
  dataDeleted: string;
  photoUnreadable: string;
  // --- Offline-Übersetzung eigener Texte ---
  translate: string;
  translateIntro: string;
  translateFrom: string;
  translateTo: string;
  /** Steht hinter der Anzahl übersetzbarer Texte, z. B. '12 Texte'. */
  translateTexts: string;
  translateNothing: string;
  translateReview: string;
  translateStart: string;
  translating: string;
  cancel: string;
  translated: string;
  undo: string;
  translateUndone: string;
  translateFailed: string;
  translateStale: string;
  // --- PDF-Export und Dateidialoge ---
  pdfSaved: string;
  pdfFailed: string;
  dialogImport: string;
  dialogExport: string;
  dialogPhoto: string;
  dialogImages: string;
  dialogPdf: string;
  /** Vorgeschlagener Dateiname (ohne Endung) für JSON-Sicherungen. */
  backupFileBase: string;
  // --- Mehrere Lebensläufe, Rückgängig, Qualitätscheck, Darstellung, Mobile ---
  /** Name eines Lebenslaufs ohne eigenen Namen. */
  cvDefaultName: string;
  cvLastOne: string;
  cvMissing: string;
  /** `{max}` wird durch die Höchstzahl ersetzt. */
  cvTooMany: string;
  documents: string;
  newCv: string;
  duplicateCv: string;
  renameCv: string;
  deleteCv: string;
  openCv: string;
  /** Markiert den gerade geöffneten Lebenslauf in der Liste. */
  cvOpen: string;
  /** Wird beim Duplizieren an den Namen angehängt. */
  copySuffix: string;
  lastEdited: string;
  /** `{name}` wird durch den Namen des Lebenslaufs ersetzt. */
  confirmDeleteCv: string;
  cvCreated: string;
  cvDuplicated: string;
  cvDeleted: string;
  close: string;
  save: string;
  redo: string;
  undoHint: string;
  redoHint: string;
  quality: string;
  qualityIntro: string;
  qualityAllGood: string;
  qMissingName: string;
  qMissingEmail: string;
  qInvalidEmail: string;
  qMissingPhone: string;
  qMissingPhoto: string;
  qMissingSummary: string;
  /** `{count}` und `{max}` werden ersetzt. */
  qLongSummary: string;
  qNoExperience: string;
  qNoEducation: string;
  qNoSkills: string;
  qNoLanguages: string;
  /** `{name}` = Sprache. */
  qLanguageLevel: string;
  /** `{entry}` = Abschnitt und Nummer, z. B. „Berufserfahrung 2“. */
  qEntryTitle: string;
  qEntryDates: string;
  qEntryOrder: string;
  qEntryFuture: string;
  qEntryLong: string;
  /** `{bullet}` = Nummer des Stichpunkts. */
  qBulletLong: string;
  qBulletEmpty: string;
  /** `{pages}` = Seitenzahl. */
  qPages: string;
  theme: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  /** Tabs auf schmalen Bildschirmen. */
  tabEdit: string;
  tabDesign: string;
  tabPreview: string;
  menu: string;
  /** Knopf „⋯“ auf schmalen Bildschirmen: öffnet das Menü mit den übrigen Funktionen. */
  more: string;
  /** Kurzbeschriftung des Muster-Schalters im Menü. */
  sampleSwitch: string;
  /** Titel des Teilen-Dialogs auf Mobilgeräten. */
  shareTitle: string;
  pdfReady: string;
  backupReady: string;
  /** Titel der Rückfrage vor dem Löschen aller Daten. */
  deleteAllTitle: string;
  /** Banner im Muster-Modus. */
  sampleBanner: string;
  sampleEnd: string;
  /** Name in der Lebenslauf-Auswahl, solange das Muster angezeigt wird. */
  sampleName: string;
  /** Vor der relativen Zeitangabe in der Lebenslauf-Liste, z. B. „Bearbeitet vor 5 Min.“. */
  editedAgo: string;
  deleteCvLast: string;
  /** Vorschau-Zoom (Gruppe, Knöpfe, Anzeige „Breite“). */
  zoom: string;
  zoomIn: string;
  zoomOut: string;
  zoomFit: string;
  zoomToggle: string;
  /** `{page}` und `{total}` werden ersetzt. */
  pageOf: string;
  /** Eigener Farbwähler neben den Vorgaben. */
  accentCustom: string;
  /** Schnellnavigation der Abschnitte und Ausfüllstand. */
  sectionNav: string;
  progressDone: string;
  progressPartial: string;
  progressEmpty: string;
  /** Foto-Quelle und Zuschnitt. */
  photoCamera: string;
  photoLibrary: string;
  cropTitle: string;
  cropHint: string;
  cropApply: string;
  /** Einstieg beim ersten Start (drei Karten). */
  onboarding1Title: string;
  onboarding1Text: string;
  onboarding2Title: string;
  onboarding2Text: string;
  onboarding3Title: string;
  onboarding3Text: string;
  onboardingSkip: string;
  onboardingNext: string;
  onboardingStart: string;
  // --- Namen von Vorlagen und Sprachen ---
  design: Record<TemplateId, string>;
  languageName: Record<CvLanguage, string>;
}

/** Die Oberflächentexte aller drei Sprachen. */
const UI_TEXT: Record<CvLanguage, UiText> = {
  de: {
    loading: 'Lebenslauf wird geladen…',
    startEmpty: 'Mit leerem Lebenslauf neu beginnen',
    saving: 'Speichert…',
    saved: 'Gespeichert',
    unsaved: 'Nicht gespeichert',
    ready: 'Bereit',
    sample: 'Muster',
    sampleOnHint:
      'Muster-Lebenslauf ist aktiv. Klicken, um ihn zu entfernen und die eigenen Eingaben zurückzuholen.',
    sampleOffHint: 'Muster-Lebenslauf einblenden. Die eigenen Eingaben bleiben erhalten.',
    sampleStatus: 'Muster aktiv · wird nicht gespeichert',
    pdfHint: 'Lebenslauf als PDF herunterladen (Strg/⌘ + P)',
    pdf: 'PDF',
    importJson: 'Sicherung (JSON) importieren',
    exportJson: 'Sicherung (JSON) exportieren',
    deleteAll: 'Alle Daten löschen',
    version: 'Version',
    personal: 'Persönliches',
    photo: 'Foto',
    choose: 'Wählen',
    remove: 'Entfernen',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    phone: 'Telefon',
    address: 'Adresse',
    other: 'Sonstiges',
    useList: 'Liste',
    addNationality: 'Zweite Staatsangehörigkeit',
    addPhone: 'Weitere Nummer',
    dialCode: 'Vorwahl',
    number: 'Nummer',
    phoneKind: 'Art',
    country: 'Land',
    addressLabel: {
      street: 'Straße',
      houseNumber: 'Hausnummer',
      postalCode: 'PLZ',
      city: 'Stadt',
      region: 'Region',
      state: 'Bundesstaat',
      province: 'Provinz',
      prefecture: 'Präfektur',
      emirate: 'Emirat',
      neighborhood: 'Mahalle',
      buildingNumber: 'Gebäudenummer',
      apartment: 'Wohnung',
      district: 'İlçe',
      provinceTr: 'İl',
      postcode: 'Postleitzahl',
      zip: 'ZIP',
      poBox: 'Postfach',
      area: 'Gebiet',
    },
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    website: 'Website',
    links: 'Links',
    add: 'Hinzufügen',
    drag: 'Ziehen',
    up: 'Hoch',
    down: 'Runter',
    position: 'Position',
    company: 'Firma',
    location: 'Ort',
    city: 'Stadt',
    from: 'Von',
    until: 'Bis',
    current: 'Aktuell',
    description: 'Beschreibung',
    bullet: 'Stichpunkt',
    addBullet: 'Stichpunkt hinzufügen',
    degree: 'Abschluss',
    institution: 'Institution',
    name: 'Name',
    level: 'Niveau',
    category: 'Kategorie',
    spokenLanguage: 'Sprache',
    issuer: 'Aussteller',
    date: 'Datum',
    url: 'URL',
    emptyExperience: 'Noch keine Stationen.',
    emptyEducation: 'Noch keine Ausbildung.',
    emptySkills: 'Noch keine Kenntnisse.',
    skillHint: 'Zuerst eine Kategorie wählen, dann die Kenntnisse mit Sternen bewerten.',
    chooseCategory: 'Kategorie wählen',
    chooseLanguage: 'Sprache wählen',
    chooseLevel: 'Stufe wählen',
    languageHint:
      'Sprache auswählen und die passende Stufe setzen. Die Liste sortiert sich alphabetisch.',
    emptyLanguages: 'Noch keine Sprachen.',
    emptyCertificates: 'Noch keine Zertifikate.',
    emptyProjects: 'Noch keine Projekte.',
    emptyReferences: 'Noch keine Referenzen.',
    summaryHint: 'Ein paar Sätze über dich: Erfahrung, Stärken und was du suchst.',
    showGender: 'Anzeigen',
    language: 'Sprache',
    resizePanes: 'Bereichsbreite',
    templateLabel: 'Vorlage',
    accent: 'Akzentfarbe',
    showPhoto: 'Foto anzeigen',
    skillScale: 'Niveau',
    skillStars: 'Sterne',
    skillBars: 'Balken',
    skillOff: 'Aus',
    datePlace: 'Datum',
    dateAside: 'Neben Titel',
    dateBelow: 'Unter Titel',
    timeline: 'Zeitachse',
    timelineOff: 'Ohne',
    timelineLine: 'Linie',
    entryOrder: 'Reihenfolge',
    orderManual: 'Eigene',
    orderNewest: 'Neueste zuerst',
    font: 'Schrift',
    pageNumbers: 'Seitenzahl',
    pageNumbersHint: 'Erscheint, sobald der Lebenslauf mehr als eine Seite hat.',
    pageNumbersOff: 'Keine',
    pageBadge: 'Kreis',
    pagePill: 'Rahmen',
    pageNumberPlace: 'Position',
    placeLeft: 'Links',
    placeCenter: 'Mitte',
    placeRight: 'Rechts',
    confirmImport: 'Die aktuellen Eingaben werden durch die Sicherungsdatei ersetzt.',
    confirmRemovePhoto: 'Das Profilfoto wird entfernt.',
    confirmEmpty: 'Die vorhandene Datei wird mit einem leeren Lebenslauf überschrieben.',
    confirmDeleteAll:
      'Alle Eingaben und das Foto werden dauerhaft gelöscht. Tipp: Vorher eine Sicherung (JSON) exportieren.',
    invalidExport: 'Bitte die zu langen Felder kürzen, bevor exportiert wird.',
    invalidLength: 'Einige Felder überschreiten die erlaubte Länge.',
    backupImported: 'Sicherung übernommen.',
    backupSaved: 'Sicherung gespeichert.',
    backupInvalid: 'Die Datei ist keine gültige CV-Studio-Sicherung.',
    backupTooNew:
      'Diese Sicherung stammt aus einer neueren Programmversion und kann nicht geöffnet werden.',
    backupTooLarge: 'Die Sicherungsdatei ist zu groß.',
    dataDeleted: 'Alle Daten wurden gelöscht.',
    photoUnreadable: 'Das Bild konnte nicht gelesen werden.',
    translate: 'Eigene Texte übersetzen',
    translateIntro:
      '„Über mich“, Positionen, Abschlüsse, Beschreibungen und Stichpunkte werden direkt auf diesem Gerät übersetzt. Es werden keine Daten verschickt.',
    translateFrom: 'Von',
    translateTo: 'Nach',
    translateTexts: 'Texte',
    translateNothing: 'Noch keine eigenen Texte zum Übersetzen vorhanden.',
    translateReview:
      'Maschinelle Übersetzung – bitte danach gegenlesen. Die Sprache des Lebenslaufs wird mit umgestellt.',
    translateStart: 'Übersetzen',
    translating: 'Übersetzt…',
    cancel: 'Abbrechen',
    translated: 'Texte übersetzt. Bitte gegenlesen.',
    undo: 'Rückgängig',
    translateUndone: 'Übersetzung rückgängig gemacht.',
    translateFailed: 'Die Übersetzung ist fehlgeschlagen. Bitte erneut versuchen.',
    translateStale: 'Während der Übersetzung wurde etwas geändert. Bitte erneut übersetzen.',
    pdfSaved: 'PDF gespeichert.',
    pdfFailed: 'Die PDF konnte nicht vorbereitet werden. Bitte erneut versuchen.',
    dialogImport: 'Lebenslauf importieren',
    dialogExport: 'Lebenslauf exportieren',
    dialogPhoto: 'Profilfoto wählen',
    dialogImages: 'Bilder',
    dialogPdf: 'Lebenslauf als PDF speichern',
    cvDefaultName: 'Mein Lebenslauf',
    cvLastOne: 'Der letzte Lebenslauf kann nicht gelöscht werden.',
    cvMissing: 'Dieser Lebenslauf existiert nicht mehr.',
    cvTooMany: 'Es können höchstens {max} Lebensläufe gespeichert werden.',
    documents: 'Lebensläufe',
    newCv: 'Neuer Lebenslauf',
    duplicateCv: 'Duplizieren',
    renameCv: 'Umbenennen',
    deleteCv: 'Löschen',
    openCv: 'Öffnen',
    cvOpen: 'Geöffnet',
    copySuffix: 'Kopie',
    lastEdited: 'Zuletzt bearbeitet',
    confirmDeleteCv: 'Lebenslauf „{name}“ samt Foto endgültig löschen?',
    cvCreated: 'Neuer Lebenslauf angelegt.',
    cvDuplicated: 'Lebenslauf dupliziert.',
    cvDeleted: 'Lebenslauf gelöscht.',
    close: 'Schließen',
    save: 'Speichern',
    redo: 'Wiederholen',
    undoHint: 'Rückgängig (Strg/⌘ + Z)',
    redoHint: 'Wiederholen (Strg/⌘ + Umschalt + Z)',
    quality: 'Qualitätscheck',
    qualityIntro: 'Hinweise zu fehlenden Angaben und langen Texten. Nichts davon ist Pflicht.',
    qualityAllGood: 'Sieht gut aus – keine Hinweise.',
    qMissingName: 'Vor- und Nachname fehlen.',
    qMissingEmail: 'Keine E-Mail-Adresse angegeben.',
    qInvalidEmail: 'Die E-Mail-Adresse sieht ungültig aus.',
    qMissingPhone: 'Keine Telefonnummer angegeben.',
    qMissingPhoto: 'Kein Foto – im deutschsprachigen Raum oft erwartet.',
    qMissingSummary: '„Über mich“ ist leer – zwei, drei Sätze machen neugierig.',
    qLongSummary: '„Über mich“ ist lang ({count} Zeichen, empfohlen bis {max}).',
    qNoExperience: 'Noch keine Berufserfahrung eingetragen.',
    qNoEducation: 'Noch keine Ausbildung eingetragen.',
    qNoSkills: 'Noch keine Kenntnisse gewählt.',
    qNoLanguages: 'Noch keine Sprachen gewählt.',
    qLanguageLevel: '{name}: Niveau fehlt.',
    qEntryTitle: '{entry}: Titel fehlt.',
    qEntryDates: '{entry}: Zeitraum fehlt.',
    qEntryOrder: '{entry}: Ende liegt vor dem Beginn.',
    qEntryFuture: '{entry}: Beginn liegt in der Zukunft.',
    qEntryLong: '{entry}: Beschreibung ist lang ({count} Zeichen).',
    qBulletLong: '{entry}: Stichpunkt {bullet} ist lang ({count} Zeichen).',
    qBulletEmpty: '{entry}: Stichpunkt {bullet} ist leer.',
    qPages: 'Der Lebenslauf hat {pages} Seiten – üblich sind 1–2.',
    theme: 'Darstellung',
    themeSystem: 'System',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    tabEdit: 'Bearbeiten',
    tabDesign: 'Design',
    tabPreview: 'Vorschau',
    menu: 'Menü',
    more: 'Weitere Funktionen',
    sampleSwitch: 'Muster-Lebenslauf anzeigen',
    shareTitle: 'Lebenslauf teilen',
    pdfReady: 'PDF erstellt.',
    backupReady: 'Sicherung erstellt.',
    backupFileBase: 'lebenslauf-sicherung',
    deleteAllTitle: 'Alle Daten löschen?',
    sampleBanner: 'Muster – Änderungen werden nicht gespeichert',
    sampleEnd: 'Muster beenden',
    sampleName: 'Muster',
    editedAgo: 'Bearbeitet',
    deleteCvLast: 'Der letzte Lebenslauf kann nicht gelöscht werden.',
    zoom: 'Zoom',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    zoomFit: 'Breite',
    zoomToggle: 'Seite auf Breite / 100 % (auch Doppeltipp)',
    pageOf: 'Seite {page} von {total}',
    accentCustom: 'Eigene Farbe',
    sectionNav: 'Abschnitte',
    progressDone: 'ausgefüllt',
    progressPartial: 'teilweise ausgefüllt',
    progressEmpty: 'leer',
    photoCamera: 'Foto aufnehmen',
    photoLibrary: 'Aus Galerie wählen',
    cropTitle: 'Foto zuschneiden',
    cropHint: 'Verschieben und mit zwei Fingern oder dem Regler vergrößern. Der Rahmen entspricht der gewählten Vorlage.',
    cropApply: 'Übernehmen',
    onboarding1Title: 'Vorlage wählen',
    onboarding1Text: 'Fünf Vorlagen, Akzentfarbe und Schrift findest du unter „Design“. Mit „Muster“ siehst du sie gefüllt.',
    onboarding2Title: 'Ausfüllen',
    onboarding2Text: 'Trag deine Angaben unter „Bearbeiten“ ein. Alles wird automatisch auf diesem Gerät gespeichert; der Qualitätscheck gibt Tipps.',
    onboarding3Title: 'Als PDF teilen',
    onboarding3Text: 'Ein Tipp auf „PDF“ erzeugt den fertigen Lebenslauf im A4-Format – offline, ohne Konto.',
    onboardingSkip: 'Überspringen',
    onboardingNext: 'Weiter',
    onboardingStart: 'Los geht’s',
    design: { classic: 'Klassisch', modern: 'Modern', minimal: 'Minimal', elegant: 'Elegant', banner: 'Banner' },
    languageName: { de: 'Deutsch', en: 'Englisch', tr: 'Türkisch' },
  },
  en: {
    loading: 'Loading the CV…',
    startEmpty: 'Start again with an empty CV',
    saving: 'Saving…',
    saved: 'Saved',
    unsaved: 'Not saved',
    ready: 'Ready',
    sample: 'Sample',
    sampleOnHint: 'The sample CV is active. Click to remove it and bring back your own entries.',
    sampleOffHint: 'Show the sample CV. Your own entries are kept.',
    sampleStatus: 'Sample active · not saved',
    pdfHint: 'Download the CV as PDF (Ctrl/⌘ + P)',
    pdf: 'PDF',
    importJson: 'Import backup (JSON)',
    exportJson: 'Export backup (JSON)',
    deleteAll: 'Delete all data',
    version: 'Version',
    personal: 'Personal details',
    photo: 'Photo',
    choose: 'Choose',
    remove: 'Remove',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    other: 'Other',
    useList: 'List',
    addNationality: 'Second nationality',
    addPhone: 'Another number',
    dialCode: 'Dial code',
    number: 'Number',
    phoneKind: 'Type',
    country: 'Country',
    addressLabel: {
      street: 'Street',
      houseNumber: 'House number',
      postalCode: 'Postal code',
      city: 'City',
      region: 'Region',
      state: 'State',
      province: 'Province',
      prefecture: 'Prefecture',
      emirate: 'Emirate',
      neighborhood: 'Neighbourhood',
      buildingNumber: 'Building no.',
      apartment: 'Apartment',
      district: 'District',
      provinceTr: 'Province',
      postcode: 'Postcode',
      zip: 'ZIP',
      poBox: 'PO Box',
      area: 'Area',
    },
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    website: 'Website',
    links: 'Links',
    add: 'Add',
    drag: 'Drag',
    up: 'Up',
    down: 'Down',
    position: 'Position',
    company: 'Company',
    location: 'Location',
    city: 'City',
    from: 'From',
    until: 'To',
    current: 'Current',
    description: 'Description',
    bullet: 'Bullet',
    addBullet: 'Add bullet',
    degree: 'Degree',
    institution: 'Institution',
    name: 'Name',
    level: 'Level',
    category: 'Category',
    spokenLanguage: 'Language',
    issuer: 'Issuer',
    date: 'Date',
    url: 'URL',
    emptyExperience: 'No positions yet.',
    emptyEducation: 'No education yet.',
    emptySkills: 'No skills yet.',
    skillHint: 'Choose a category first, then rate its skills with stars.',
    chooseCategory: 'Choose a category',
    chooseLanguage: 'Choose a language',
    chooseLevel: 'Choose a level',
    languageHint: 'Choose a language and the level that fits. The list stays alphabetical.',
    emptyLanguages: 'No languages yet.',
    emptyCertificates: 'No certificates yet.',
    emptyProjects: 'No projects yet.',
    emptyReferences: 'No references yet.',
    summaryHint: 'A few sentences about you: experience, strengths and what you are looking for.',
    showGender: 'Show',
    language: 'Language',
    resizePanes: 'Pane width',
    templateLabel: 'Template',
    accent: 'Accent color',
    showPhoto: 'Show photo',
    skillScale: 'Level',
    skillStars: 'Stars',
    skillBars: 'Bars',
    skillOff: 'Off',
    datePlace: 'Dates',
    dateAside: 'Beside title',
    dateBelow: 'Under title',
    timeline: 'Timeline',
    timelineOff: 'Off',
    timelineLine: 'Line',
    entryOrder: 'Order',
    orderManual: 'Custom',
    orderNewest: 'Newest first',
    font: 'Font',
    pageNumbers: 'Page number',
    pageNumbersHint: 'Appears as soon as the CV has more than one page.',
    pageNumbersOff: 'None',
    pageBadge: 'Circle',
    pagePill: 'Outline',
    pageNumberPlace: 'Position',
    placeLeft: 'Left',
    placeCenter: 'Center',
    placeRight: 'Right',
    confirmImport: 'The current entries will be replaced by the backup file.',
    confirmRemovePhoto: 'The profile photo will be removed.',
    confirmEmpty: 'The existing file will be overwritten with an empty CV.',
    confirmDeleteAll:
      'All entries and the photo will be deleted permanently. Tip: export a backup (JSON) first.',
    invalidExport: 'Shorten the fields that are too long before exporting.',
    invalidLength: 'Some fields exceed the allowed length.',
    backupImported: 'Backup imported.',
    backupSaved: 'Backup saved.',
    backupInvalid: 'The file is not a valid CV-Studio backup.',
    backupTooNew: 'This backup comes from a newer version of the app and cannot be opened.',
    backupTooLarge: 'The backup file is too large.',
    dataDeleted: 'All data has been deleted.',
    photoUnreadable: 'The image could not be read.',
    translate: 'Translate your texts',
    translateIntro:
      '“About me”, positions, degrees, descriptions and bullet points are translated directly on this device. No data is sent anywhere.',
    translateFrom: 'From',
    translateTo: 'To',
    translateTexts: 'texts',
    translateNothing: 'There are no texts of your own to translate yet.',
    translateReview:
      'Machine translation – please proofread afterwards. The CV language is switched as well.',
    translateStart: 'Translate',
    translating: 'Translating…',
    cancel: 'Cancel',
    translated: 'Texts translated. Please proofread.',
    undo: 'Undo',
    translateUndone: 'Translation undone.',
    translateFailed: 'The translation failed. Please try again.',
    translateStale: 'Something changed during the translation. Please translate again.',
    pdfSaved: 'PDF saved.',
    pdfFailed: 'The PDF could not be prepared. Please try again.',
    dialogImport: 'Import CV',
    dialogExport: 'Export CV',
    dialogPhoto: 'Choose profile photo',
    dialogImages: 'Images',
    dialogPdf: 'Save CV as PDF',
    cvDefaultName: 'My CV',
    cvLastOne: 'The last CV cannot be deleted.',
    cvMissing: 'This CV no longer exists.',
    cvTooMany: 'You can store at most {max} CVs.',
    documents: 'CVs',
    newCv: 'New CV',
    duplicateCv: 'Duplicate',
    renameCv: 'Rename',
    deleteCv: 'Delete',
    openCv: 'Open',
    cvOpen: 'Open now',
    copySuffix: 'copy',
    lastEdited: 'Last edited',
    confirmDeleteCv: 'Delete the CV “{name}” and its photo permanently?',
    cvCreated: 'New CV created.',
    cvDuplicated: 'CV duplicated.',
    cvDeleted: 'CV deleted.',
    close: 'Close',
    save: 'Save',
    redo: 'Redo',
    undoHint: 'Undo (Ctrl/⌘ + Z)',
    redoHint: 'Redo (Ctrl/⌘ + Shift + Z)',
    quality: 'Quality check',
    qualityIntro: 'Hints about missing details and long texts. None of them are mandatory.',
    qualityAllGood: 'Looks good – no hints.',
    qMissingName: 'First and last name are missing.',
    qMissingEmail: 'No email address given.',
    qInvalidEmail: 'The email address looks invalid.',
    qMissingPhone: 'No phone number given.',
    qMissingPhoto: 'No photo – often expected in German-speaking countries.',
    qMissingSummary: '“About me” is empty – two or three sentences spark interest.',
    qLongSummary: '“About me” is long ({count} characters, recommended up to {max}).',
    qNoExperience: 'No work experience entered yet.',
    qNoEducation: 'No education entered yet.',
    qNoSkills: 'No skills selected yet.',
    qNoLanguages: 'No languages selected yet.',
    qLanguageLevel: '{name}: level is missing.',
    qEntryTitle: '{entry}: title is missing.',
    qEntryDates: '{entry}: dates are missing.',
    qEntryOrder: '{entry}: end is before start.',
    qEntryFuture: '{entry}: start lies in the future.',
    qEntryLong: '{entry}: description is long ({count} characters).',
    qBulletLong: '{entry}: bullet {bullet} is long ({count} characters).',
    qBulletEmpty: '{entry}: bullet {bullet} is empty.',
    qPages: 'The CV has {pages} pages – 1–2 are common.',
    theme: 'Appearance',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    tabEdit: 'Edit',
    tabDesign: 'Design',
    tabPreview: 'Preview',
    menu: 'Menu',
    more: 'More',
    sampleSwitch: 'Show sample CV',
    shareTitle: 'Share CV',
    pdfReady: 'PDF created.',
    backupReady: 'Backup created.',
    backupFileBase: 'cv-backup',
    deleteAllTitle: 'Delete all data?',
    sampleBanner: 'Sample – changes are not saved',
    sampleEnd: 'Exit sample',
    sampleName: 'Sample',
    editedAgo: 'Edited',
    deleteCvLast: 'The last CV cannot be deleted.',
    zoom: 'Zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    zoomFit: 'Fit',
    zoomToggle: 'Fit width / 100 % (or double-tap)',
    pageOf: 'Page {page} of {total}',
    accentCustom: 'Custom colour',
    sectionNav: 'Sections',
    progressDone: 'complete',
    progressPartial: 'partly complete',
    progressEmpty: 'empty',
    photoCamera: 'Take photo',
    photoLibrary: 'Choose from library',
    cropTitle: 'Crop photo',
    cropHint: 'Drag to move; pinch or use the slider to zoom. The frame matches the selected template.',
    cropApply: 'Use photo',
    onboarding1Title: 'Pick a template',
    onboarding1Text: 'Five templates, accent colour and font are under “Design”. “Sample” shows them filled in.',
    onboarding2Title: 'Fill it in',
    onboarding2Text: 'Enter your details under “Edit”. Everything is saved automatically on this device; the quality check gives tips.',
    onboarding3Title: 'Share as PDF',
    onboarding3Text: 'Tap “PDF” to create the finished CV in A4 – offline, no account needed.',
    onboardingSkip: 'Skip',
    onboardingNext: 'Next',
    onboardingStart: 'Get started',
    design: { classic: 'Classic', modern: 'Modern', minimal: 'Minimal', elegant: 'Elegant', banner: 'Banner' },
    languageName: { de: 'German', en: 'English', tr: 'Turkish' },
  },
  tr: {
    loading: 'Özgeçmiş yükleniyor…',
    startEmpty: 'Boş bir özgeçmişle yeniden başla',
    saving: 'Kaydediliyor…',
    saved: 'Kaydedildi',
    unsaved: 'Kaydedilmedi',
    ready: 'Hazır',
    sample: 'Örnek',
    sampleOnHint:
      'Örnek özgeçmiş etkin. Kaldırmak ve kendi girişlerinizi geri getirmek için tıklayın.',
    sampleOffHint: 'Örnek özgeçmişi göster. Kendi girişleriniz korunur.',
    sampleStatus: 'Örnek etkin · kaydedilmiyor',
    pdfHint: 'Özgeçmişi PDF olarak indir (Ctrl/⌘ + P)',
    pdf: 'PDF',
    importJson: 'Yedeği (JSON) içe aktar',
    exportJson: 'Yedeği (JSON) dışa aktar',
    deleteAll: 'Tüm verileri sil',
    version: 'Sürüm',
    personal: 'Kişisel bilgiler',
    photo: 'Fotoğraf',
    choose: 'Seç',
    remove: 'Kaldır',
    firstName: 'Ad',
    lastName: 'Soyad',
    email: 'E-posta',
    phone: 'Telefon',
    address: 'Adres',
    other: 'Diğer',
    useList: 'Liste',
    addNationality: 'İkinci uyruk',
    addPhone: 'Başka numara',
    dialCode: 'Alan kodu',
    number: 'Numara',
    phoneKind: 'Tür',
    country: 'Ülke',
    addressLabel: {
      street: 'Sokak / Cadde',
      houseNumber: 'Kapı no',
      postalCode: 'Posta kodu',
      city: 'Şehir',
      region: 'Bölge',
      state: 'Eyalet',
      province: 'İl',
      prefecture: 'Prefektörlük',
      emirate: 'Emirlik',
      neighborhood: 'Mahalle',
      buildingNumber: 'Bina no',
      apartment: 'Daire',
      district: 'İlçe',
      provinceTr: 'İl',
      postcode: 'Posta kodu',
      zip: 'ZIP',
      poBox: 'Posta kutusu',
      area: 'Bölge',
    },
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    website: 'Web sitesi',
    links: 'Bağlantılar',
    add: 'Ekle',
    drag: 'Sürükle',
    up: 'Yukarı',
    down: 'Aşağı',
    position: 'Pozisyon',
    company: 'Şirket',
    location: 'Yer',
    city: 'Şehir',
    from: 'Başlangıç',
    until: 'Bitiş',
    current: 'Devam ediyor',
    description: 'Açıklama',
    bullet: 'Madde',
    addBullet: 'Madde ekle',
    degree: 'Derece',
    institution: 'Kurum',
    name: 'Ad',
    level: 'Seviye',
    category: 'Kategori',
    spokenLanguage: 'Dil',
    issuer: 'Veren kurum',
    date: 'Tarih',
    url: 'URL',
    emptyExperience: 'Henüz deneyim yok.',
    emptyEducation: 'Henüz eğitim yok.',
    emptySkills: 'Henüz yetenek yok.',
    skillHint: 'Önce bir kategori seçin, sonra yıldızlarla değerlendirin.',
    chooseCategory: 'Kategori seçin',
    chooseLanguage: 'Dil seçin',
    chooseLevel: 'Seviye seçin',
    languageHint: 'Bir dil ve uygun seviyeyi seçin. Liste alfabetik sıralanır.',
    emptyLanguages: 'Henüz dil yok.',
    emptyCertificates: 'Henüz sertifika yok.',
    emptyProjects: 'Henüz proje yok.',
    emptyReferences: 'Henüz referans yok.',
    summaryHint: 'Kendin hakkında birkaç cümle: deneyimin, güçlü yönlerin ve aradığın pozisyon.',
    showGender: 'Göster',
    language: 'Dil',
    resizePanes: 'Alan genişliği',
    templateLabel: 'Şablon',
    accent: 'Vurgu rengi',
    showPhoto: 'Fotoğrafı göster',
    skillScale: 'Seviye',
    skillStars: 'Yıldız',
    skillBars: 'Çubuk',
    skillOff: 'Kapalı',
    datePlace: 'Tarih',
    dateAside: 'Unvan yanında',
    dateBelow: 'Unvan altında',
    timeline: 'Zaman çizelgesi',
    timelineOff: 'Kapalı',
    timelineLine: 'Çizgi',
    entryOrder: 'Sıralama',
    orderManual: 'Özel',
    orderNewest: 'En yeni önce',
    font: 'Yazı tipi',
    pageNumbers: 'Sayfa numarası',
    pageNumbersHint: 'Özgeçmiş birden fazla sayfa olduğunda görünür.',
    pageNumbersOff: 'Yok',
    pageBadge: 'Daire',
    pagePill: 'Çerçeve',
    pageNumberPlace: 'Konum',
    placeLeft: 'Sol',
    placeCenter: 'Orta',
    placeRight: 'Sağ',
    confirmImport: 'Geçerli girişler yedek dosyasıyla değiştirilecek.',
    confirmRemovePhoto: 'Profil fotoğrafı kaldırılacak.',
    confirmEmpty: 'Mevcut dosyanın üzerine boş bir özgeçmiş yazılacak.',
    confirmDeleteAll:
      'Tüm girişler ve fotoğraf kalıcı olarak silinecek. İpucu: Önce bir yedek (JSON) dışa aktarın.',
    invalidExport: 'Dışa aktarmadan önce çok uzun alanları kısaltın.',
    invalidLength: 'Bazı alanlar izin verilen uzunluğu aşıyor.',
    backupImported: 'Yedek içe aktarıldı.',
    backupSaved: 'Yedek kaydedildi.',
    backupInvalid: 'Dosya geçerli bir CV-Studio yedeği değil.',
    backupTooNew: 'Bu yedek programın daha yeni bir sürümünden geliyor ve açılamıyor.',
    backupTooLarge: 'Yedek dosyası çok büyük.',
    dataDeleted: 'Tüm veriler silindi.',
    photoUnreadable: 'Görsel okunamadı.',
    translate: 'Kendi metinlerinizi çevirin',
    translateIntro:
      '“Hakkımda”, pozisyonlar, dereceler, açıklamalar ve maddeler doğrudan bu cihazda çevrilir. Hiçbir veri gönderilmez.',
    translateFrom: 'Kaynak',
    translateTo: 'Hedef',
    translateTexts: 'metin',
    translateNothing: 'Henüz çevrilecek kendi metniniz yok.',
    translateReview:
      'Makine çevirisi – lütfen sonrasında kontrol edin. Özgeçmişin dili de değiştirilir.',
    translateStart: 'Çevir',
    translating: 'Çevriliyor…',
    cancel: 'İptal',
    translated: 'Metinler çevrildi. Lütfen kontrol edin.',
    undo: 'Geri al',
    translateUndone: 'Çeviri geri alındı.',
    translateFailed: 'Çeviri başarısız oldu. Lütfen tekrar deneyin.',
    translateStale: 'Çeviri sırasında bir şey değişti. Lütfen yeniden çevirin.',
    pdfSaved: 'PDF kaydedildi.',
    pdfFailed: 'PDF hazırlanamadı. Lütfen tekrar deneyin.',
    dialogImport: 'Özgeçmişi içe aktar',
    dialogExport: 'Özgeçmişi dışa aktar',
    dialogPhoto: 'Profil fotoğrafı seç',
    dialogImages: 'Görseller',
    dialogPdf: 'Özgeçmişi PDF olarak kaydet',
    cvDefaultName: 'Özgeçmişim',
    cvLastOne: 'Son özgeçmiş silinemez.',
    cvMissing: 'Bu özgeçmiş artık mevcut değil.',
    cvTooMany: 'En fazla {max} özgeçmiş kaydedilebilir.',
    documents: 'Özgeçmişler',
    newCv: 'Yeni özgeçmiş',
    duplicateCv: 'Çoğalt',
    renameCv: 'Yeniden adlandır',
    deleteCv: 'Sil',
    openCv: 'Aç',
    cvOpen: 'Açık',
    copySuffix: 'kopya',
    lastEdited: 'Son düzenleme',
    confirmDeleteCv: '“{name}” özgeçmişi fotoğrafıyla birlikte kalıcı olarak silinsin mi?',
    cvCreated: 'Yeni özgeçmiş oluşturuldu.',
    cvDuplicated: 'Özgeçmiş çoğaltıldı.',
    cvDeleted: 'Özgeçmiş silindi.',
    close: 'Kapat',
    save: 'Kaydet',
    redo: 'Yinele',
    undoHint: 'Geri al (Ctrl/⌘ + Z)',
    redoHint: 'Yinele (Ctrl/⌘ + Shift + Z)',
    quality: 'Kalite kontrolü',
    qualityIntro: 'Eksik bilgiler ve uzun metinlerle ilgili ipuçları. Hiçbiri zorunlu değildir.',
    qualityAllGood: 'İyi görünüyor – ipucu yok.',
    qMissingName: 'Ad ve soyad eksik.',
    qMissingEmail: 'E-posta adresi girilmemiş.',
    qInvalidEmail: 'E-posta adresi geçersiz görünüyor.',
    qMissingPhone: 'Telefon numarası girilmemiş.',
    qMissingPhoto: 'Fotoğraf yok – birçok ülkede beklenir.',
    qMissingSummary: '“Hakkımda” boş – iki üç cümle ilgi uyandırır.',
    qLongSummary: '“Hakkımda” uzun ({count} karakter, önerilen en fazla {max}).',
    qNoExperience: 'Henüz iş deneyimi girilmedi.',
    qNoEducation: 'Henüz eğitim girilmedi.',
    qNoSkills: 'Henüz beceri seçilmedi.',
    qNoLanguages: 'Henüz dil seçilmedi.',
    qLanguageLevel: '{name}: seviye eksik.',
    qEntryTitle: '{entry}: başlık eksik.',
    qEntryDates: '{entry}: tarih aralığı eksik.',
    qEntryOrder: '{entry}: bitiş başlangıçtan önce.',
    qEntryFuture: '{entry}: başlangıç gelecekte.',
    qEntryLong: '{entry}: açıklama uzun ({count} karakter).',
    qBulletLong: '{entry}: madde {bullet} uzun ({count} karakter).',
    qBulletEmpty: '{entry}: madde {bullet} boş.',
    qPages: 'Özgeçmiş {pages} sayfa – genellikle 1–2 sayfa olur.',
    theme: 'Görünüm',
    themeSystem: 'Sistem',
    themeLight: 'Açık',
    themeDark: 'Koyu',
    tabEdit: 'Düzenle',
    tabDesign: 'Tasarım',
    tabPreview: 'Önizleme',
    menu: 'Menü',
    more: 'Diğer işlevler',
    sampleSwitch: 'Örnek özgeçmişi göster',
    shareTitle: 'Özgeçmişi paylaş',
    pdfReady: 'PDF oluşturuldu.',
    backupReady: 'Yedek oluşturuldu.',
    backupFileBase: 'ozgecmis-yedek',
    deleteAllTitle: 'Tüm veriler silinsin mi?',
    sampleBanner: 'Örnek – değişiklikler kaydedilmez',
    sampleEnd: 'Örnekten çık',
    sampleName: 'Örnek',
    editedAgo: 'Düzenlendi:',
    deleteCvLast: 'Son özgeçmiş silinemez.',
    zoom: 'Yakınlaştırma',
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    zoomFit: 'Sığdır',
    zoomToggle: 'Genişliğe sığdır / %100 (çift dokunma da olur)',
    pageOf: 'Sayfa {page} / {total}',
    accentCustom: 'Özel renk',
    sectionNav: 'Bölümler',
    progressDone: 'tamamlandı',
    progressPartial: 'kısmen dolduruldu',
    progressEmpty: 'boş',
    photoCamera: 'Fotoğraf çek',
    photoLibrary: 'Galeriden seç',
    cropTitle: 'Fotoğrafı kırp',
    cropHint: 'Sürükleyerek taşıyın, iki parmakla veya kaydırıcıyla yakınlaştırın. Çerçeve seçili şablona uyar.',
    cropApply: 'Kullan',
    onboarding1Title: 'Şablon seçin',
    onboarding1Text: 'Beş şablon, vurgu rengi ve yazı tipi “Tasarım” altında. “Örnek” ile dolu hâlini görürsünüz.',
    onboarding2Title: 'Doldurun',
    onboarding2Text: 'Bilgilerinizi “Düzenle” altında girin. Her şey bu cihazda otomatik kaydedilir; kalite kontrolü ipuçları verir.',
    onboarding3Title: 'PDF olarak paylaşın',
    onboarding3Text: '“PDF”e dokunun; özgeçmişiniz A4 olarak hazırlanır – çevrimdışı, hesap gerekmez.',
    onboardingSkip: 'Geç',
    onboardingNext: 'İleri',
    onboardingStart: 'Başlayalım',
    design: { classic: 'Klasik', modern: 'Modern', minimal: 'Minimal', elegant: 'Zarif', banner: 'Bant' },
    languageName: { de: 'Almanca', en: 'İngilizce', tr: 'Türkçe' },
  },
};

/** Oberflächentexte für die gewählte Sprache (in der App die Lebenslauf-Sprache). */
export function uiText(language: CvLanguage): UiText {
  return UI_TEXT[language];
}
