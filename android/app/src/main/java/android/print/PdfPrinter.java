package android.print;

import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import java.io.File;

/**
 * Schreibt die Ausgabe eines {@link PrintDocumentAdapter} (z. B. aus WebView.createPrintDocumentAdapter)
 * ohne Druckdialog direkt in eine PDF-Datei. Liegt im Paket android.print, weil die Rückruf-Klassen
 * des Adapters nur dort erzeugt werden können. Scheitert das auf einem Gerät, nutzt das Plugin den Druckdialog.
 */
public final class PdfPrinter {

  /** Ergebnis der Erzeugung. */
  public interface Callback {
    void onDone(File file);

    void onError(String message);
  }

  private PdfPrinter() {}

  public static void print(PrintDocumentAdapter adapter, PrintAttributes attributes, File file, Callback callback) {
    adapter.onStart();
    adapter.onLayout(
      null,
      attributes,
      new CancellationSignal(),
      new PrintDocumentAdapter.LayoutResultCallback() {
        @Override
        public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
          ParcelFileDescriptor descriptor;
          try {
            descriptor = ParcelFileDescriptor.open(
              file,
              ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE | ParcelFileDescriptor.MODE_READ_WRITE
            );
          } catch (Exception error) {
            adapter.onFinish();
            callback.onError(String.valueOf(error.getMessage()));
            return;
          }
          adapter.onWrite(
            new PageRange[] { PageRange.ALL_PAGES },
            descriptor,
            new CancellationSignal(),
            new PrintDocumentAdapter.WriteResultCallback() {
              @Override
              public void onWriteFinished(PageRange[] pages) {
                close(descriptor);
                adapter.onFinish();
                callback.onDone(file);
              }

              @Override
              public void onWriteFailed(CharSequence error) {
                close(descriptor);
                adapter.onFinish();
                callback.onError(String.valueOf(error));
              }

              @Override
              public void onWriteCancelled() {
                close(descriptor);
                adapter.onFinish();
                callback.onError("cancelled");
              }
            }
          );
        }

        @Override
        public void onLayoutFailed(CharSequence error) {
          adapter.onFinish();
          callback.onError(String.valueOf(error));
        }

        @Override
        public void onLayoutCancelled() {
          adapter.onFinish();
          callback.onError("cancelled");
        }
      },
      null
    );
  }

  private static void close(ParcelFileDescriptor descriptor) {
    try {
      descriptor.close();
    } catch (Exception ignored) {
      // Datei ist bereits geschrieben oder unbrauchbar; nichts weiter zu tun.
    }
  }
}
