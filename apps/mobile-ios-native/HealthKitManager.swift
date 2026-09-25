import Foundation
import HealthKit
import SwiftUI

@MainActor
final class HealthKitManager: ObservableObject {
    struct BackendConfiguration {
        let endpoint: URL
        let anonKey: String

        static func load() -> BackendConfiguration? {
            guard
                let endpointString = Bundle.main.object(forInfoDictionaryKey: "GPBackendUploadURL") as? String,
                let anonKey = Bundle.main.object(forInfoDictionaryKey: "GPBackendUploadAnonKey") as? String
            else {
                return nil
            }

            let trimmedEndpoint = endpointString.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedAnonKey = anonKey.trimmingCharacters(in: .whitespacesAndNewlines)

            guard
                !trimmedEndpoint.isEmpty,
                !trimmedAnonKey.isEmpty,
                !trimmedEndpoint.contains("YOUR-PROJECT-REF"),
                !trimmedAnonKey.contains("YOUR_SUPABASE_ANON_KEY"),
                let endpoint = URL(string: trimmedEndpoint)
            else {
                return nil
            }

            return BackendConfiguration(endpoint: endpoint, anonKey: trimmedAnonKey)
        }
    }

    struct HealthMetric: Identifiable, Equatable {
        let id: String
        let title: String
        let value: String
        let icon: String
        let accentColor: Color
    }

    @Published var isAuthorized = false
    @Published var isLoading = false
    @Published var isUploading = false
    @Published var errorMessage: String?
    @Published var successMessage: String?
    @Published var lastUpdated = "Not yet"
    @Published private(set) var backendStatusMessage = "Backend upload is unavailable until GPBackendUploadURL and GPBackendUploadAnonKey are configured in Info.plist."
    @Published var metrics: [HealthMetric] = [
        HealthMetric(id: "steps", title: "Steps", value: "No data yet", icon: "figure.walk", accentColor: .green),
        HealthMetric(id: "heart-rate", title: "Heart rate", value: "No data yet", icon: "heart.fill", accentColor: .red),
        HealthMetric(id: "active-energy", title: "Active energy", value: "No data yet", icon: "flame.fill", accentColor: .orange)
    ]

    private let healthStore = HKHealthStore()
    private let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
    private let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
    private let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
    private let backendConfiguration = BackendConfiguration.load()

    var isBackendConfigured: Bool {
        backendConfiguration != nil
    }

    init() {
        if backendConfiguration != nil {
            backendStatusMessage = "Backend upload is configured."
        }
    }

    func checkAuthorizationStatus() {
        let status = healthStore.authorizationStatus(for: stepType)
        isAuthorized = status == .sharingAuthorized
        if isAuthorized {
            loadData()
        }
    }

    func requestAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            errorMessage = "Apple Health is not available on this device."
            return
        }

        let typesToRead: Set<HKObjectType> = [stepType, heartRateType, activeEnergyType]
        isLoading = true

        healthStore.requestAuthorization(toShare: [], read: typesToRead) { [weak self] success, error in
            DispatchQueue.main.async {
                guard let self else { return }

                if let error {
                    self.isLoading = false
                    self.errorMessage = error.localizedDescription
                    self.isAuthorized = false
                    return
                }

                self.isAuthorized = success
                self.errorMessage = nil

                if success {
                    self.loadData()
                } else {
                    self.isLoading = false
                }
            }
        }
    }

    func loadData() {
        isLoading = true
        errorMessage = nil
        successMessage = nil
        lastUpdated = "Loading..."

        let group = DispatchGroup()
        fetchLatestStepCount(group: group)
        fetchLatestHeartRate(group: group)
        fetchLatestActiveEnergy(group: group)

        group.notify(queue: .main) { [weak self] in
            guard let self else { return }
            self.isLoading = false
            self.lastUpdated = Self.formattedTimestamp()
        }
    }

    private func fetchLatestStepCount(group: DispatchGroup) {
        group.enter()

        let startDate = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date(), options: .strictStartDate)

        let query = HKSampleQuery(
            sampleType: stepType,
            predicate: predicate,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
        ) { [weak self] _, samples, _ in
            defer { group.leave() }
            guard let self else { return }

            let text: String
            if let sample = samples?.first as? HKQuantitySample {
                let count = sample.quantity.doubleValue(for: HKUnit.count())
                text = String(format: "%.0f steps", count)
            } else {
                text = "No data"
            }

            DispatchQueue.main.async {
                self.updateMetric(id: "steps", value: text)
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestHeartRate(group: DispatchGroup) {
        group.enter()

        let startDate = Calendar.current.date(byAdding: .hour, value: -6, to: Date()) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date(), options: .strictStartDate)

        let query = HKSampleQuery(
            sampleType: heartRateType,
            predicate: predicate,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
        ) { [weak self] _, samples, _ in
            defer { group.leave() }
            guard let self else { return }

            let text: String
            if let sample = samples?.first as? HKQuantitySample {
                let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: HKUnit.minute()))
                text = String(format: "%.0f bpm", bpm)
            } else {
                text = "No data"
            }

            DispatchQueue.main.async {
                self.updateMetric(id: "heart-rate", value: text)
            }
        }

        healthStore.execute(query)
    }

    private func fetchLatestActiveEnergy(group: DispatchGroup) {
        group.enter()

        let startDate = Calendar.current.date(byAdding: .day, value: -1, to: Date()) ?? Date()
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: Date(), options: .strictStartDate)

        let query = HKSampleQuery(
            sampleType: activeEnergyType,
            predicate: predicate,
            limit: 1,
            sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]
        ) { [weak self] _, samples, _ in
            defer { group.leave() }
            guard let self else { return }

            let text: String
            if let sample = samples?.first as? HKQuantitySample {
                let kilocalories = sample.quantity.doubleValue(for: HKUnit.kilocalorie())
                text = String(format: "%.0f kcal", kilocalories)
            } else {
                text = "No data"
            }

            DispatchQueue.main.async {
                self.updateMetric(id: "active-energy", value: text)
            }
        }

        healthStore.execute(query)
    }

    func uploadToBackend() {
        guard isAuthorized else {
            errorMessage = "Connect Apple Health first."
            return
        }

        guard let backendConfiguration else {
            errorMessage = backendStatusMessage
            return
        }

        isUploading = true
        errorMessage = nil
        successMessage = nil

        let payload: [String: Any] = [
            "source": "GymPilot iOS",
            "recorded_at": ISO8601DateFormatter().string(from: Date()),
            "steps": metricValue(for: "steps"),
            "heart_rate": metricValue(for: "heart-rate"),
            "active_energy": metricValue(for: "active-energy")
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted]) else {
            isUploading = false
            errorMessage = "Failed to prepare payload."
            return
        }

        var request = URLRequest(url: backendConfiguration.endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(backendConfiguration.anonKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            DispatchQueue.main.async {
                guard let self else { return }
                self.isUploading = false

                if let error {
                    self.errorMessage = error.localizedDescription
                    return
                }

                if let httpResponse = response as? HTTPURLResponse, 200...299 ~= httpResponse.statusCode {
                    self.successMessage = "Data sent successfully"
                } else {
                    self.errorMessage = "Upload failed"
                }
            }
        }.resume()
    }

    private func metricValue(for id: String) -> Any {
        metrics.first(where: { $0.id == id })?.value ?? ""
    }

    private func updateMetric(id: String, value: String) {
        metrics = metrics.map { metric in
            guard metric.id == id else { return metric }
            return HealthMetric(id: metric.id, title: metric.title, value: value, icon: metric.icon, accentColor: metric.accentColor)
        }
    }

    private static func formattedTimestamp() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: Date())
    }
}
