import Capacitor
import UIKit
import WebKit

/// Startet die Capacitor-Bridge und meldet die app-eigenen Plugins an.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CvPrintPlugin())
    }
}

/// Erzeugt aus der Druckansicht (#/print) ein A4-PDF ohne Ränder im Cache-Ordner und liefert dessen Datei-URL.
/// Das Lebenslauf-Blatt wird mit WKWebView.createPDF als eine lange Seite aufgenommen und dann in A4-Seiten zerlegt
/// (die Druckansicht ist bereits auf ganze Seiten von 210 × 297 mm ausgelegt).
@objc(CvPrintPlugin)
public class CvPrintPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CvPrintPlugin"
    public let jsName = "CvPrint"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "printToPdf", returnType: CAPPluginReturnPromise)
    ]

    /// A4 in PDF-Punkten (1/72 Zoll).
    private let a4 = CGRect(x: 0, y: 0, width: 595.28, height: 841.89)

    @objc func printToPdf(_ call: CAPPluginCall) {
        let requested = call.getString("fileName") ?? "CV.pdf"
        // Nur einfache Dateinamen, damit nichts außerhalb des Export-Ordners landet.
        let fileName = String(requested.map { $0.isASCII && ($0.isLetter || $0.isNumber || "._-".contains($0)) ? $0 : "_" })
        DispatchQueue.main.async {
            guard let webView = self.bridge?.webView else {
                call.reject("Keine WebView verfügbar.")
                return
            }
            let measure = """
            (() => { const el = document.querySelector('app-template-host'); if (!el) return null;
              const r = el.getBoundingClientRect(); return [r.left + window.scrollX, r.top + window.scrollY, r.width, r.height]; })()
            """
            webView.evaluateJavaScript(measure) { result, _ in
                guard let values = result as? [Double], values.count == 4, values[2] > 0, values[3] > 0 else {
                    call.reject("Die Druckansicht ist nicht bereit.")
                    return
                }
                let configuration = WKPDFConfiguration()
                configuration.rect = CGRect(x: values[0], y: values[1], width: values[2], height: values[3])
                webView.createPDF(configuration: configuration) { outcome in
                    switch outcome {
                    case .success(let data):
                        guard let pages = self.splitIntoA4(data) else {
                            call.reject("Das PDF konnte nicht erstellt werden.")
                            return
                        }
                        do {
                            let directory = FileManager.default.temporaryDirectory.appendingPathComponent("exports", isDirectory: true)
                            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
                            let file = directory.appendingPathComponent(fileName)
                            try pages.write(to: file, options: .atomic)
                            call.resolve(["uri": file.absoluteString])
                        } catch {
                            call.reject("Das PDF konnte nicht gespeichert werden.", nil, error)
                        }
                    case .failure(let error):
                        call.reject("Das PDF konnte nicht erstellt werden.", nil, error)
                    }
                }
            }
        }
    }

    /// Zerlegt eine lange PDF-Seite (Breite = A4-Breite des Blatts) in einzelne A4-Seiten, als Vektorgrafik.
    private func splitIntoA4(_ data: Data) -> Data? {
        guard let provider = CGDataProvider(data: data as CFData),
              let document = CGPDFDocument(provider),
              let page = document.page(at: 1) else {
            return nil
        }
        let box = page.getBoxRect(.mediaBox)
        let pageHeight = box.width * 297 / 210
        let count = max(1, Int(ceil(box.height / pageHeight - 0.01)))
        let scale = a4.width / box.width
        let output = NSMutableData()
        var mediaBox = a4
        guard let consumer = CGDataConsumer(data: output as CFMutableData),
              let context = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else {
            return nil
        }
        for index in 0..<count {
            context.beginPDFPage(nil)
            context.saveGState()
            context.clip(to: a4)
            context.scaleBy(x: scale, y: scale)
            // PDF-Koordinaten beginnen unten links: die Seite `index` von oben auf den Seitenursprung schieben.
            context.translateBy(x: -box.minX, y: -(box.maxY - CGFloat(index + 1) * pageHeight))
            context.drawPDFPage(page)
            context.restoreGState()
            context.endPDFPage()
        }
        context.closePDF()
        return output as Data
    }
}
