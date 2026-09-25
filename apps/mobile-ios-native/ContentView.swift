import SwiftUI

struct ContentView: View {
    @StateObject private var healthManager = HealthKitManager()
    @StateObject private var authManager = GymPilotAuthManager(configuration: SupabaseAuthConfiguration.load())
    @StateObject private var webViewModel = GymPilotWebViewModel()
    private let webViewURL = WebViewConfiguration.loadURL()

    var body: some View {
        Group {
            if webViewURL != nil {
                webContentView
            } else {
                healthDashboard
            }
        }
        .tint(Color("AccentColor"))
        .onAppear {
            healthManager.checkAuthorizationStatus()
        }
    }

    private var healthDashboard: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 10) {
                        Image(systemName: "heart.text.square")
                            .font(.system(size: 48))
                            .foregroundStyle(.red)

                        Text("Gym Pilot Health")
                            .font(.title2.bold())

                        Text("Connect Apple Health to review your latest step count, heart rate, and active energy in Gym Pilot.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    Button {
                        if healthManager.isAuthorized {
                            healthManager.loadData()
                        } else {
                            healthManager.requestAuthorization()
                        }
                    } label: {
                        HStack {
                            Image(systemName: healthManager.isAuthorized ? "arrow.clockwise" : "checkmark.shield")
                            Text(healthManager.isAuthorized ? "Refresh data" : "Connect Apple Health")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)

                    if let errorMessage = healthManager.errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .font(.footnote)
                            .multilineTextAlignment(.center)
                    }

                    if healthManager.isLoading {
                        ProgressView("Loading Apple Health data...")
                            .frame(maxWidth: .infinity, alignment: .center)
                    }

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        ForEach(healthManager.metrics) { metric in
                            VStack(alignment: .leading, spacing: 10) {
                                HStack(spacing: 8) {
                                    Image(systemName: metric.icon)
                                        .foregroundStyle(metric.accentColor)
                                    Text(metric.title)
                                        .font(.headline)
                                }

                                Text(metric.value)
                                    .font(.title3.bold())
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
                        }
                    }

                    if healthManager.isAuthorized {
                        VStack(spacing: 8) {
                            Text("Last refreshed: \(healthManager.lastUpdated)")
                                .font(.caption)
                                .foregroundStyle(.secondary)

                            if !healthManager.isBackendConfigured {
                                Text(healthManager.backendStatusMessage)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .multilineTextAlignment(.center)
                            }

                            Button {
                                healthManager.uploadToBackend()
                            } label: {
                                HStack {
                                    Image(systemName: healthManager.isUploading ? "arrow.triangle.2.circlepath" : "paperplane")
                                    Text(healthManager.isUploading ? "Sending..." : "Send to backend")
                                }
                                .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                            .disabled(healthManager.isUploading || !healthManager.isBackendConfigured)

                            if let successMessage = healthManager.successMessage {
                                Text(successMessage)
                                    .font(.caption)
                                    .foregroundStyle(.green)
                            }
                        }
                    }
                }
                .padding(24)
            }
            .navigationTitle("Gym Pilot")
        }
    }

    private var webContentView: some View {
        NavigationStack {
            Group {
                if webViewURL == nil {
                    ContentUnavailableView(
                        "Web content unavailable",
                        systemImage: "globe.slash",
                        description: Text("Set GPWebViewURL in Info.plist to load Gym Pilot web content inside the native app.")
                    )
                    .padding(24)
                } else if !authManager.isConfigured {
                    ContentUnavailableView(
                        "Supabase login unavailable",
                        systemImage: "lock.slash",
                        description: Text("Set GPSupabaseURL and GPSupabaseAnonKey in Info.plist to enable native login before loading web content.")
                    )
                    .padding(24)
                } else if !authManager.isAuthenticated {
                    loginView
                } else {
                    VStack(spacing: 0) {
                        if webViewModel.isLoading {
                            ProgressView("Loading web content...")
                                .frame(maxWidth: .infinity)
                                .padding(.horizontal, 16)
                                .padding(.top, 12)
                        }

                        if let errorMessage = webViewModel.errorMessage {
                            Text(errorMessage)
                                .foregroundStyle(.red)
                                .font(.footnote)
                                .multilineTextAlignment(.center)
                                .padding(16)
                        }

                        if let webViewURL {
                            GymPilotWebView(
                                url: webViewURL,
                                model: webViewModel,
                                sessionStorageKey: authManager.sessionStorageKey,
                                sessionJSONString: authManager.sessionJSONString
                            )
                            .ignoresSafeArea(edges: .bottom)
                        }
                    }
                }
            }
            .navigationTitle("Gym Pilot")
            .toolbar {
                ToolbarItemGroup(placement: .bottomBar) {
                    Button {
                        webViewModel.goBack()
                    } label: {
                        Image(systemName: "chevron.backward")
                    }
                    .disabled(!webViewModel.canGoBack)

                    Button {
                        webViewModel.goForward()
                    } label: {
                        Image(systemName: "chevron.forward")
                    }
                    .disabled(!webViewModel.canGoForward)

                    Spacer()

                    Button {
                        webViewModel.reload()
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(webViewURL == nil || !authManager.isAuthenticated)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    if authManager.isAuthenticated {
                        Button("Log out") {
                            if let sessionStorageKey = authManager.sessionStorageKey {
                                webViewModel.clearSession(storageKey: sessionStorageKey)
                            }
                            authManager.signOut()
                        }
                    }
                }
            }
        }
    }

    private var loginView: some View {
        ScrollView {
            VStack(spacing: 20) {
                Image(systemName: "person.crop.circle.badge.checkmark")
                    .font(.system(size: 56))
                    .foregroundStyle(Color("AccentColor"))

                Text("Sign in to Gym Pilot")
                    .font(.title2.bold())

                Text("Use your Supabase account to unlock the embedded Gym Pilot web experience.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                VStack(spacing: 12) {
                    TextField("Email", text: $authManager.email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled(true)
                        .textContentType(.username)
                        .padding(14)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))

                    SecureField("Password", text: $authManager.password)
                        .textContentType(.password)
                        .padding(14)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
                }

                if let errorMessage = authManager.errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                        .font(.footnote)
                        .multilineTextAlignment(.center)
                }

                Button {
                    Task {
                        await authManager.signIn()
                    }
                } label: {
                    HStack {
                        Image(systemName: authManager.isLoading ? "arrow.triangle.2.circlepath" : "lock.open")
                        Text(authManager.isLoading ? "Signing in..." : "Sign in")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(authManager.isLoading)
            }
            .padding(24)
        }
    }
}

#Preview {
    ContentView()
}

private enum WebViewConfiguration {
    static func loadURL() -> URL? {
        guard let rawValue = Bundle.main.object(forInfoDictionaryKey: "GPWebViewURL") as? String else {
            return nil
        }

        let trimmedValue = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedValue.isEmpty else {
            return nil
        }

        return URL(string: trimmedValue)
    }
}
