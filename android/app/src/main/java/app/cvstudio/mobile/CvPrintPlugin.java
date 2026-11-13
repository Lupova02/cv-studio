package app.cvstudio.mobile;

import android.content.Context;
import android.net.Uri;
import android.print.PdfPrinter;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Erzeugt aus der aktuell angezeigten Seite (Druckansicht #/print) ein A4-PDF ohne Ränder im Cache-Ordner.
 * Gelingt die direkte Erzeugung nicht, öffnet sich der System-Druckdialog („Als PDF speichern“); dann ist `uri` leer.
 */
@CapacitorPlugin(name = "CvPrint")
public class CvPrintPlugin extends Plugin {

  @PluginMethod
  public void printToPdf(PluginCall call) {
    String requested = call.getString("fileName", "CV.pdf");
    // Nur einfache Dateinamen, damit nichts außerhalb des Export-Ordners landet.
    String fileName = requested.replaceAll("[^A-Za-z0-9._-]", "_");
    getActivity()
      .runOnUiThread(() -> {
        WebView webView = getBridge().getWebView();
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(fileName);
        PrintAttributes attributes = new PrintAttributes.Builder()
          .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
          .setResolution(new PrintAttributes.Resolution("pdf", "pdf", 300, 300))
          .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
          .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
          .build();
        File directory = new File(getContext().getCacheDir(), "exports");
        if (!directory.exists() && !directory.mkdirs()) {
          call.reject("Export-Ordner konnte nicht angelegt werden.");
          return;
        }
        File file = new File(directory, fileName);
        try {
          PdfPrinter.print(
            adapter,
            attributes,
            file,
            new PdfPrinter.Callback() {
              @Override
              public void onDone(File result) {
                JSObject value = new JSObject();
                value.put("uri", Uri.fromFile(result).toString());
                call.resolve(value);
              }

              @Override
              public void onError(String message) {
                openPrintDialog(webView, fileName, attributes, call);
              }
            }
          );
        } catch (Throwable error) {
          // Manche Geräte erlauben die direkte Erzeugung nicht: dann übernimmt der Druckdialog.
          openPrintDialog(webView, fileName, attributes, call);
        }
      });
  }

  private void openPrintDialog(WebView webView, String fileName, PrintAttributes attributes, PluginCall call) {
    PrintManager manager = (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
    if (manager == null) {
      call.reject("Drucken wird auf diesem Gerät nicht unterstützt.");
      return;
    }
    manager.print(fileName, webView.createPrintDocumentAdapter(fileName), attributes);
    JSObject value = new JSObject();
    value.put("uri", "");
    call.resolve(value);
  }
}
