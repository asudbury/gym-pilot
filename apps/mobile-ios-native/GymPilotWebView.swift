import SwiftUI
import UIKit
import WebKit

@MainActor
final class GymPilotWebViewModel: ObservableObject {
    @Published var canGoBack = false
    @Published var canGoForward = false
    @Published var isLoading = false
    @Published var errorMessage: String?

    weak var webView: WKWebView?

    func reload() {
        webView?.reload()
    }

    func goBack() {
        webView?.goBack()
    }

    func goForward() {
        webView?.goForward()
    }

    func clearSession(storageKey: String) {
        let script = "window.localStorage.removeItem(\(storageKey.javaScriptStringLiteral)); window.sessionStorage.removeItem(\(storageKey.javaScriptStringLiteral));"
        webView?.evaluateJavaScript(script)
    }

    func syncSession(storageKey: String, sessionJSONString: String) {
        let script = "window.localStorage.setItem(\(storageKey.javaScriptStringLiteral), \(sessionJSONString.javaScriptStringLiteral)); window.sessionStorage.setItem(\(storageKey.javaScriptStringLiteral), \(sessionJSONString.javaScriptStringLiteral));"
        webView?.evaluateJavaScript(script)
    }

    func updateNavigationState(from webView: WKWebView) {
        self.webView = webView
        canGoBack = webView.canGoBack
        canGoForward = webView.canGoForward
    }
}

struct GymPilotWebView: UIViewRepresentable {
    let url: URL
    @ObservedObject var model: GymPilotWebViewModel
    let sessionStorageKey: String?
    let sessionJSONString: String?

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        if let sessionStorageKey, let sessionJSONString {
            let contentController = WKUserContentController()
            let scriptSource = "window.localStorage.setItem(\(sessionStorageKey.javaScriptStringLiteral), \(sessionJSONString.javaScriptStringLiteral)); window.sessionStorage.setItem(\(sessionStorageKey.javaScriptStringLiteral), \(sessionJSONString.javaScriptStringLiteral));"
            let userScript = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: false)
            contentController.addUserScript(userScript)
            configuration.userContentController = contentController
        }

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.allowsBackForwardNavigationGestures = true
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        model.updateNavigationState(from: webView)

        if let sessionStorageKey, let sessionJSONString {
            model.syncSession(storageKey: sessionStorageKey, sessionJSONString: sessionJSONString)
        }

        if webView.url != url {
            webView.load(URLRequest(url: url))
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(model: model, allowedHost: url.host)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private let model: GymPilotWebViewModel
        private let allowedHost: String?

        init(model: GymPilotWebViewModel, allowedHost: String?) {
            self.model = model
            self.allowedHost = allowedHost?.lowercased()
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            model.errorMessage = nil
            model.isLoading = true
            model.updateNavigationState(from: webView)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.isLoading = false
            model.updateNavigationState(from: webView)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            model.isLoading = false
            model.errorMessage = error.localizedDescription
            model.updateNavigationState(from: webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            model.isLoading = false
            model.errorMessage = error.localizedDescription
            model.updateNavigationState(from: webView)
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let requestURL = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            guard shouldAllowNavigation(to: requestURL) else {
                if UIApplication.shared.canOpenURL(requestURL) {
                    UIApplication.shared.open(requestURL)
                }
                decisionHandler(.cancel)
                return
            }

            decisionHandler(.allow)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            guard navigationAction.targetFrame == nil else {
                return nil
            }

            webView.load(navigationAction.request)
            return nil
        }

        private func shouldAllowNavigation(to url: URL) -> Bool {
            guard let allowedHost else {
                return true
            }

            guard let host = url.host?.lowercased() else {
                return true
            }

            return host == allowedHost
        }
    }
}

private extension String {
    var javaScriptStringLiteral: String {
        let escaped = self
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
        return "\"\(escaped)\""
    }
}