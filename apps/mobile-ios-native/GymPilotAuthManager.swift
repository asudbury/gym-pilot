import Foundation

struct SupabaseAuthConfiguration {
    let url: URL
    let anonKey: String

    var storageKey: String {
        let projectRef = url.host?.split(separator: ".").first.map(String.init) ?? "gym-pilot"
        return "sb-\(projectRef)-auth-token"
    }

    static func load() -> SupabaseAuthConfiguration? {
        guard
            let urlString = Bundle.main.object(forInfoDictionaryKey: "GPSupabaseURL") as? String,
            let anonKey = Bundle.main.object(forInfoDictionaryKey: "GPSupabaseAnonKey") as? String
        else {
            return nil
        }

        let trimmedURL = urlString.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedAnonKey = anonKey.trimmingCharacters(in: .whitespacesAndNewlines)

        guard
            !trimmedURL.isEmpty,
            !trimmedAnonKey.isEmpty,
            let url = URL(string: trimmedURL)
        else {
            return nil
        }

        return SupabaseAuthConfiguration(url: url, anonKey: trimmedAnonKey)
    }
}

struct SupabaseSession: Equatable {
    let rawJSONString: String
    let userEmail: String?
}

@MainActor
final class GymPilotAuthManager: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var errorMessage: String?
    @Published var isLoading = false
    @Published private(set) var session: SupabaseSession?

    private let configuration: SupabaseAuthConfiguration?
    private let sessionStorage = UserDefaults.standard
    private let persistedSessionKey = "gym-pilot.native-supabase-session"

    init(configuration: SupabaseAuthConfiguration?) {
        self.configuration = configuration
        restorePersistedSession()
    }

    var isAuthenticated: Bool {
        session != nil
    }

    var isConfigured: Bool {
        configuration != nil
    }

    var sessionStorageKey: String? {
        configuration?.storageKey
    }

    var sessionJSONString: String? {
        session?.rawJSONString
    }

    func signIn() async {
        errorMessage = nil

        guard let configuration else {
            errorMessage = "Supabase login is unavailable until GPSupabaseURL and GPSupabaseAnonKey are configured in Info.plist."
            return
        }

        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedEmail.isEmpty, !password.isEmpty else {
            errorMessage = "Enter your email and password."
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            var urlComponents = URLComponents(url: configuration.url.appending(path: "auth/v1/token"), resolvingAgainstBaseURL: false)
            urlComponents?.queryItems = [URLQueryItem(name: "grant_type", value: "password")]

            guard let loginURL = urlComponents?.url else {
                throw NSError(domain: "GymPilotAuth", code: -1, userInfo: [NSLocalizedDescriptionKey: "Supabase login URL is invalid."])
            }

            var request = URLRequest(url: loginURL)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue(configuration.anonKey, forHTTPHeaderField: "apikey")

            let requestBody: [String: String] = [
                "email": trimmedEmail,
                "password": password
            ]

            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw NSError(domain: "GymPilotAuth", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid authentication response."])
            }

            let jsonObject = try JSONSerialization.jsonObject(with: data) as? [String: Any]

            guard 200...299 ~= httpResponse.statusCode else {
                let serverMessage = (jsonObject?["msg"] as? String)
                    ?? (jsonObject?["error_description"] as? String)
                    ?? (jsonObject?["message"] as? String)
                    ?? "Login failed."
                throw NSError(domain: "GymPilotAuth", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: serverMessage])
            }

            guard let rawJSONString = String(data: data, encoding: .utf8), !rawJSONString.isEmpty else {
                throw NSError(domain: "GymPilotAuth", code: -3, userInfo: [NSLocalizedDescriptionKey: "Could not decode the authentication session."])
            }

            let user = jsonObject?["user"] as? [String: Any]
            let authenticatedEmail = (user?["email"] as? String) ?? trimmedEmail
            let nextSession = SupabaseSession(rawJSONString: rawJSONString, userEmail: authenticatedEmail)

            session = nextSession
            email = authenticatedEmail
            password = ""
            persist(session: nextSession)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() {
        session = nil
        password = ""
        errorMessage = nil
        sessionStorage.removeObject(forKey: persistedSessionKey)
    }

    private func persist(session: SupabaseSession) {
        sessionStorage.set(
            [
                "session": session.rawJSONString,
                "email": session.userEmail ?? ""
            ],
            forKey: persistedSessionKey
        )
    }

    private func restorePersistedSession() {
        guard
            let storedValue = sessionStorage.dictionary(forKey: persistedSessionKey),
            let rawJSONString = storedValue["session"] as? String,
            !rawJSONString.isEmpty
        else {
            return
        }

        let storedEmail = storedValue["email"] as? String
        session = SupabaseSession(rawJSONString: rawJSONString, userEmail: storedEmail)
        email = storedEmail ?? ""
    }
}