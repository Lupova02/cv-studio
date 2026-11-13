// Verwaltung mehrerer Lebensläufe: Verzeichnis (Name, Änderungsdatum, aktiver Lebenslauf) und die
// Operationen Anlegen, Duplizieren, Umbenennen, Löschen und Wechseln. Unabhängig vom Speicherort:
// Electron (Dateien), Browser (IndexedDB) und Mobile (Capacitor Filesystem) liefern je einen `CvDocumentStore`.
import { createId, emptyCv, type CvData, type CvLanguage } from './cv-data';
import { CvValidationError, migrate } from './cv-migrate';
import { uiText } from '../i18n/ui-text';

/** Kennung des ersten Lebenslaufs; er liegt aus Kompatibilitätsgründen weiter am alten Speicherort (z. B. cv-data.json). */
export const DEFAULT_CV_ID = 'default';
/** Höchstzahl gespeicherter Lebensläufe. */
export const MAX_CVS = 30;
/** Höchstlänge eines Lebenslauf-Namens. */
export const MAX_CV_NAME = 80;

/** Ein Lebenslauf im Verzeichnis. */
export interface CvLibraryEntry {
  id: string;
  name: string;
  /** Zeitpunkt der letzten Speicherung (ISO 8601). */
  updatedAt: string;
}

/** Das Verzeichnis aller Lebensläufe samt aktuell geöffnetem. */
export interface CvLibrary {
  activeId: string;
  entries: CvLibraryEntry[];
}

/** Speicher-Anbindung je Plattform. Alle Methoden dürfen bei Fehlern werfen. */
export interface CvDocumentStore {
  /** Liest das Verzeichnis; `null`/`undefined`, wenn es noch keins gibt. */
  readLibrary(): Promise<unknown>;
  writeLibrary(library: CvLibrary): Promise<void>;
  /** Liest einen Lebenslauf ungeprüft; `null`/`undefined`, wenn er fehlt. */
  readCv(id: string): Promise<unknown>;
  writeCv(id: string, data: CvData): Promise<void>;
  deleteCv(id: string): Promise<void>;
  /** Legt eine Kopie eines gespeicherten Fotos an und liefert ihren Namen; `null`, wenn das Foto fehlt. */
  copyPhoto(fileName: string): Promise<string | null>;
  removePhoto(fileName: string): Promise<void>;
}

/** Erlaubte Kennungen: `default` oder eine UUID; schützt Dateipfade vor eingeschleusten Zeichen. */
const ID_PATTERN = /^(default|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

/** Prüft, ob `value` eine gültige Lebenslauf-Kennung ist. */
export function isCvId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

/** Bereinigt einen Namen: Leerraum zusammenfassen, kürzen; leer = `fallback`. */
export function cleanCvName(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return (text || fallback).slice(0, MAX_CV_NAME);
}

/** Hängt bei Namensgleichheit „(2)“, „(3)“ … an, damit jeder Name im Verzeichnis eindeutig bleibt. */
export function uniqueCvName(library: CvLibrary, name: string, ignoreId?: string): string {
  const taken = new Set(
    library.entries
      .filter((entry) => entry.id !== ignoreId)
      .map((entry) => entry.name.toLocaleLowerCase()),
  );
  if (!taken.has(name.toLocaleLowerCase())) {
    return name;
  }
  for (let index = 2; ; index++) {
    const suffix = ` (${index})`;
    const candidate = `${name.slice(0, MAX_CV_NAME - suffix.length)}${suffix}`;
    if (!taken.has(candidate.toLocaleLowerCase())) {
      return candidate;
    }
  }
}

/** Vorschlag für den Namen eines Lebenslaufs: Vor- und Nachname, sonst `fallback`. */
export function suggestCvName(data: CvData, fallback: string): string {
  return cleanCvName(`${data.personal.firstName} ${data.personal.lastName}`, fallback);
}

/**
 * Prüft ein eingelesenes Verzeichnis. Ungültige oder doppelte Einträge entfallen; zeigt `activeId` ins Leere,
 * wird der erste Eintrag aktiv. Ohne gültige Einträge kommt `null` zurück (Verzeichnis neu anlegen).
 */
export function parseLibrary(raw: unknown, fallbackName: string): CvLibrary | null {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !Array.isArray((raw as { entries?: unknown }).entries)
  ) {
    return null;
  }
  const source = raw as { activeId?: unknown; entries: unknown[] };
  const seen = new Set<string>();
  const entries: CvLibraryEntry[] = [];
  for (const item of source.entries.slice(0, MAX_CVS)) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const entry = item as Record<string, unknown>;
    if (!isCvId(entry['id']) || seen.has(entry['id'])) {
      continue;
    }
    seen.add(entry['id']);
    const updatedAt =
      typeof entry['updatedAt'] === 'string' && !Number.isNaN(Date.parse(entry['updatedAt']))
        ? entry['updatedAt']
        : new Date(0).toISOString();
    entries.push({ id: entry['id'], name: cleanCvName(entry['name'], fallbackName), updatedAt });
  }
  if (entries.length === 0) {
    return null;
  }
  const activeId =
    isCvId(source.activeId) && seen.has(source.activeId) ? source.activeId : entries[0].id;
  return { activeId, entries };
}

/**
 * Lebenslauf-Verwaltung über einem `CvDocumentStore`. Alle Operationen laufen nacheinander,
 * damit sich gleichzeitige Aufrufe (z. B. Speichern und Umbenennen) das Verzeichnis nicht gegenseitig überschreiben.
 */
export class CvLibraryService {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: CvDocumentStore,
    /** Sprache der Oberfläche für Standardnamen und Fehlermeldungen. */
    private readonly language: () => CvLanguage,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Das Verzeichnis; beim ersten Aufruf wird es aus dem vorhandenen Lebenslauf angelegt. */
  library(): Promise<CvLibrary> {
    return this.run(() => this.readLibrary());
  }

  /** Lädt den aktiven Lebenslauf (bereinigt). */
  load(): Promise<CvData> {
    return this.run(async () => this.readData((await this.readLibrary()).activeId));
  }

  /** Prüft und speichert den aktiven Lebenslauf und aktualisiert sein Änderungsdatum. */
  save(payload: unknown): Promise<void> {
    return this.run(async () => {
      const data = migrate(payload);
      const library = await this.readLibrary();
      await this.store.writeCv(library.activeId, data);
      await this.store.writeLibrary(this.touch(library, library.activeId));
    });
  }

  /** Macht einen anderen Lebenslauf aktiv und liefert dessen Daten. */
  switchTo(id: unknown): Promise<CvData> {
    return this.run(async () => {
      const library = await this.readLibrary();
      const entry = this.find(library, id);
      const data = await this.readData(entry.id);
      await this.store.writeLibrary({ ...library, activeId: entry.id });
      return data;
    });
  }

  /** Legt einen neuen Lebenslauf an (Daten werden geprüft) und macht ihn aktiv. */
  create(name: unknown, payload: unknown): Promise<CvLibrary> {
    return this.run(async () => {
      const library = await this.readLibrary();
      this.assertRoom(library);
      const data = migrate(payload ?? emptyCv());
      // Ein neuer Lebenslauf darf kein fremdes Foto mitbringen; Fotos kommen nur über Import oder Duplizieren.
      const clean: CvData = { ...data, personal: { ...data.personal, photoFile: '' } };
      return this.add(library, cleanCvName(name, this.fallbackName()), clean);
    });
  }

  /** Kopiert einen gespeicherten Lebenslauf samt eigener Fotokopie und macht die Kopie aktiv. */
  duplicate(id: unknown, name: unknown): Promise<CvLibrary> {
    return this.run(async () => {
      const library = await this.readLibrary();
      this.assertRoom(library);
      const source = this.find(library, id);
      const data = await this.readData(source.id);
      const photoFile = data.personal.photoFile
        ? ((await this.store.copyPhoto(data.personal.photoFile).catch(() => null)) ?? '')
        : '';
      const copy: CvData = { ...data, personal: { ...data.personal, photoFile } };
      return this.add(library, cleanCvName(name, source.name), copy);
    });
  }

  /** Benennt einen Lebenslauf um; der Name wird eindeutig gemacht. */
  rename(id: unknown, name: unknown): Promise<CvLibrary> {
    return this.run(async () => {
      const library = await this.readLibrary();
      const entry = this.find(library, id);
      const clean = uniqueCvName(library, cleanCvName(name, entry.name), entry.id);
      const next = {
        ...library,
        entries: library.entries.map((item) =>
          item.id === entry.id ? { ...item, name: clean } : item,
        ),
      };
      await this.store.writeLibrary(next);
      return next;
    });
  }

  /** Löscht einen Lebenslauf samt Foto. Der letzte bleibt immer bestehen; wird der aktive gelöscht, wird der nächste aktiv. */
  remove(id: unknown): Promise<CvLibrary> {
    return this.run(async () => {
      const library = await this.readLibrary();
      const entry = this.find(library, id);
      if (library.entries.length <= 1) {
        throw new CvValidationError(this.copy().cvLastOne);
      }
      const photo = (await this.readData(entry.id).catch(() => null))?.personal.photoFile;
      const entries = library.entries.filter((item) => item.id !== entry.id);
      const index = library.entries.findIndex((item) => item.id === entry.id);
      const activeId =
        library.activeId === entry.id
          ? (entries[Math.min(index, entries.length - 1)] ?? entries[0]).id
          : library.activeId;
      const next = { activeId, entries };
      // Zuerst das Verzeichnis schreiben: Bricht danach etwas ab, bleibt höchstens eine verwaiste Datei übrig.
      await this.store.writeLibrary(next);
      await this.store.deleteCv(entry.id);
      if (photo) {
        await this.store.removePhoto(photo).catch(() => undefined);
      }
      return next;
    });
  }

  /**
   * Löscht alle Lebensläufe und Fotos. Übrig bleibt ein leerer Lebenslauf mit dem übergebenen Design,
   * damit Sprache und Gestaltung erhalten bleiben.
   */
  reset(template: CvData['template']): Promise<CvLibrary> {
    return this.run(async () => {
      const library = await this.readLibrary();
      for (const entry of library.entries) {
        const photo = (await this.readData(entry.id).catch(() => null))?.personal.photoFile;
        if (photo) {
          await this.store.removePhoto(photo).catch(() => undefined);
        }
      }
      const data: CvData = { ...emptyCv(), template: migrate({ template }).template };
      await this.store.writeCv(DEFAULT_CV_ID, data);
      const next: CvLibrary = {
        activeId: DEFAULT_CV_ID,
        entries: [
          { id: DEFAULT_CV_ID, name: this.fallbackName(), updatedAt: this.now().toISOString() },
        ],
      };
      await this.store.writeLibrary(next);
      for (const entry of library.entries) {
        if (entry.id !== DEFAULT_CV_ID) {
          await this.store.deleteCv(entry.id).catch(() => undefined);
        }
      }
      return next;
    });
  }

  private copy() {
    return uiText(this.language());
  }

  private fallbackName(): string {
    return this.copy().cvDefaultName;
  }

  /** Reiht eine Operation hinter die laufenden ein; ein Fehler blockiert die folgenden nicht. */
  private run<T>(action: () => Promise<T>): Promise<T> {
    const result = this.queue.then(action, action);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async readLibrary(): Promise<CvLibrary> {
    const parsed = parseLibrary(await this.store.readLibrary(), this.fallbackName());
    if (parsed) {
      return parsed;
    }
    // Erster Start mit Verzeichnis: der bisherige Lebenslauf wird zum ersten Eintrag.
    const raw = await this.store.readCv(DEFAULT_CV_ID).catch(() => null);
    let existing: CvData | null = null;
    try {
      existing = raw ? migrate(raw) : null;
    } catch {
      existing = null;
    }
    const library: CvLibrary = {
      activeId: DEFAULT_CV_ID,
      entries: [
        {
          id: DEFAULT_CV_ID,
          // Ein vorhandener Lebenslauf bringt seine eigene Sprache mit; sie bestimmt den Standardnamen.
          name: existing
            ? suggestCvName(existing, uiText(existing.template.language).cvDefaultName)
            : this.fallbackName(),
          updatedAt: this.now().toISOString(),
        },
      ],
    };
    await this.store.writeLibrary(library);
    return library;
  }

  private async readData(id: string): Promise<CvData> {
    return migrate((await this.store.readCv(id)) ?? null);
  }

  private find(library: CvLibrary, id: unknown): CvLibraryEntry {
    const entry = library.entries.find((item) => item.id === id);
    if (!entry) {
      throw new CvValidationError(this.copy().cvMissing);
    }
    return entry;
  }

  private assertRoom(library: CvLibrary): void {
    if (library.entries.length >= MAX_CVS) {
      throw new CvValidationError(this.copy().cvTooMany.replace('{max}', String(MAX_CVS)));
    }
  }

  private async add(library: CvLibrary, name: string, data: CvData): Promise<CvLibrary> {
    let id = createId();
    while (library.entries.some((entry) => entry.id === id)) {
      id = createId();
    }
    await this.store.writeCv(id, data);
    const next: CvLibrary = {
      activeId: id,
      entries: [
        ...library.entries,
        { id, name: uniqueCvName(library, name), updatedAt: this.now().toISOString() },
      ],
    };
    await this.store.writeLibrary(next);
    return next;
  }

  private touch(library: CvLibrary, id: string): CvLibrary {
    const updatedAt = this.now().toISOString();
    return {
      ...library,
      entries: library.entries.map((entry) => (entry.id === id ? { ...entry, updatedAt } : entry)),
    };
  }
}
