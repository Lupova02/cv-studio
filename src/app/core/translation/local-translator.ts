// Offline-Übersetzung der Lebenslauftexte mit Bergamot (WebAssembly im Web Worker).
// Die Modelle liegen lokal in der App; es wird nichts ins Internet gesendet.
import type { BatchTranslator } from '@mkljczk/bergamot-translator/translator.js';
import type { CvLanguage } from '@shared/cv/cv-data';

/** Direkte Modelle unter public/translation/models; Deutsch ↔ Türkisch läuft als Pivot über Englisch. */
const MODEL_PAIRS = ['de-en', 'en-de', 'tr-en', 'en-tr'] as const;

/** Geladene Übersetzungs-Engine plus ein Promise, das bei einem Worker-Absturz abgelehnt wird. */
interface Engine {
  translator: BatchTranslator;
  failed: Promise<never>;
}

/** Wird beim ersten Bedarf erzeugt und wiederverwendet; nach einem Fehler zurückgesetzt. */
let engine: Promise<Engine> | null = null;

/** Löst einen Pfad relativ zur App auf (funktioniert auch unter `file://` in Electron). */
function assetUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

/** Lädt eine lokale Modelldatei als Binärdaten. */
async function loadBuffer(path: string): Promise<ArrayBuffer> {
  const response = await fetch(assetUrl(path));
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status}`);
  }
  return response.arrayBuffer();
}

/** Lädt die Bergamot-Bibliothek erst bei Bedarf und startet den Übersetzungs-Worker. */
async function createEngine(): Promise<Engine> {
  const { BatchTranslator, TranslatorBacking } = await import('@mkljczk/bergamot-translator/translator.js');

  // Ersetzt den Standard-Download aus dem Internet durch die mitgelieferten lokalen Modelle.
  class LocalBacking extends TranslatorBacking {
    override async loadModelRegistry() {
      return MODEL_PAIRS.map((pair) => {
        const [from, to] = pair.split('-');
        return { from, to, files: {} };
      });
    }

    override async loadTranslationModel({ from, to }: { from: string; to: string }) {
      const dir = `translation/models/${from}-${to}`;
      const key = `${from}${to}`;
      const [model, shortlist, vocab] = await Promise.all([
        loadBuffer(`${dir}/model.${key}.intgemm.alphas.bin`),
        loadBuffer(`${dir}/lex.50.50.${key}.s2t.bin`),
        loadBuffer(`${dir}/vocab.${key}.spm`),
      ]);
      return { model, shortlist, vocabs: [vocab], config: {} };
    }
  }

  // Ein Worker, der nicht startet, antwortet nie – deshalb muss sein Fehler-Event offene Aufträge ablehnen.
  let fail: (error: Error) => void = () => undefined;
  const failed = new Promise<never>((_, reject) => {
    fail = reject;
  });
  failed.catch(() => undefined);
  const onerror = (error: unknown) => fail(error instanceof Error ? error : new Error(String((error as ErrorEvent)?.message ?? error)));
  // Diese Optionen werden unverändert an den Worker geschickt und müssen daher strukturiert klonbar bleiben (keine Callbacks).
  const options = {
    workerUrl: assetUrl('translation/worker/translator-worker.js'),
    pivotLanguage: 'en',
    downloadTimeout: 0,
  };
  const backing = new LocalBacking(options);
  backing.onerror = onerror;
  return { translator: new BatchTranslator({ onerror }, backing), failed };
}

/**
 * Übersetzt eine Liste von Texten offline; die Reihenfolge der Ergebnisse entspricht der Eingabe.
 * Bei einem Fehler wird die Engine verworfen, damit der nächste Versuch neu startet.
 */
export async function translateTexts(texts: string[], from: CvLanguage, to: CvLanguage): Promise<string[]> {
  if (from === to || texts.length === 0) {
    return texts;
  }
  engine ??= createEngine();
  const current = engine;
  try {
    const { translator, failed } = await current;
    const work = Promise.all(texts.map((text) => translator.translate({ from, to, text, html: false })));
    const responses = await Promise.race([work, failed]);
    return responses.map((response) => response.target.text);
  } catch (error) {
    // Nur zurücksetzen, wenn nicht schon ein anderer Aufruf eine neue Engine angelegt hat.
    if (engine === current) {
      engine = null;
      void current.then(({ translator }) => translator.delete()).catch(() => undefined);
    }
    throw error;
  }
}
