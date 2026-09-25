# Gym Pilot iOS (SwiftUI)

This folder contains an iOS app written in SwiftUI that requests HealthKit permission and displays:

- the latest step count
- the latest heart-rate sample
- the latest active energy burn

The app display name is set to `Gym Pilot`, and the target and product name are set to `GymPilot`. The current bundle identifier is `com.gympilot.ios`. Change the bundle identifier before release if your Apple Developer account uses a different reverse-DNS prefix.

## Setup in Xcode

1. Open Xcode on a Mac.
2. Open the project file at [apps/mobile-ios-native/GymPilot.xcodeproj](apps/mobile-ios-native/GymPilot.xcodeproj).
3. Select a real iPhone device as the run destination.
4. Set your Apple developer team under Signing & Capabilities.
5. Confirm the HealthKit capability is present through [apps/mobile-ios-native/GymPilot.entitlements](apps/mobile-ios-native/GymPilot.entitlements).
6. Confirm the app icon asset catalog is present at [apps/mobile-ios-native/Assets.xcassets](apps/mobile-ios-native/Assets.xcassets).
7. Build and run the app, making sure the target resolves [apps/mobile-ios-native/Info.plist](apps/mobile-ios-native/Info.plist) as its Info.plist file.
8. Approve the HealthKit permission prompt when it appears.

## Using VS Code with Xcode

- Use VS Code to edit the Swift files.
- Use Xcode to build, sign, and run the app on a physical device.
- VS Code alone cannot fully run or debug an iOS app without Xcode and Apple’s toolchain.

## SwiftFormat and SwiftLint

Install the tools on a Mac before using them from Xcode or the repo root:

```bash
brew install swiftformat swiftlint
```

Run them from the repository root:

```bash
npm run format:swift
npm run format:swift:check
npm run lint:swift
```

The Xcode project also includes build phases that run SwiftFormat in lint mode and SwiftLint when those binaries are available on your machine. If they are not installed, the build continues and prints a warning.

## Sending data to Supabase

- Set these keys in [apps/mobile-ios-native/Info.plist](apps/mobile-ios-native/Info.plist):
  - `GPBackendUploadURL`
  - `GPBackendUploadAnonKey`

- Example values:

```xml
<key>GPBackendUploadURL</key>
<string>https://YOUR-PROJECT-REF.supabase.co/functions/v1/healthkit-ingest</string>
<key>GPBackendUploadAnonKey</key>
<string>YOUR_SUPABASE_ANON_KEY</string>
```

- The app disables backend upload until both values are configured.
- The app sends a JSON payload shaped like:

```json
{
  "source": "GymPilot iOS",
  "recorded_at": "2026-09-10T12:00:00Z",
  "steps": "12345 steps",
  "heart_rate": "72 bpm",
  "active_energy": "320 kcal"
}
```

- Your Supabase Edge Function should accept this payload and write it to your database or downstream service.
- If your function expects a different field shape or auth scheme, I can adjust it to match.

## WebView support

- Set `GPWebViewURL` in [apps/mobile-ios-native/Info.plist](apps/mobile-ios-native/Info.plist) to load web content inside the native app.
- Set `GPSupabaseURL` and `GPSupabaseAnonKey` in [apps/mobile-ios-native/Info.plist](apps/mobile-ios-native/Info.plist) to enable the native Supabase login page.
- When `GPWebViewURL` is configured, the app uses `WKWebView` as the primary content surface.
- When Supabase auth is configured, the app shows a native login screen before loading the embedded web content.
- The embedded web view supports back, forward, and reload controls through the native bottom toolbar.
- The embedded web view keeps navigation constrained to the configured `GPWebViewURL` host. External hosts are opened outside the container.
- Prefer an `https://` URL for production. If you need to load non-HTTPS content during development, handle that explicitly in Xcode and App Transport Security rather than weakening the default plist here.
- Example value:

```xml
<key>GPSupabaseURL</key>
<string>https://YOUR-PROJECT-REF.supabase.co</string>
<key>GPSupabaseAnonKey</key>
<string>YOUR_SUPABASE_ANON_KEY</string>
<key>GPWebViewURL</key>
<string>https://your-web-app.example.com</string>
```

- Leave the value empty to fall back to the native Apple Health dashboard.

## Notes

- HealthKit access requires a physical Apple device and a valid Apple developer account.
- The app reads from HealthKit and does not write data by default.
- You can extend this example to read additional types such as sleep, workouts, or body mass.
- The current iOS app icon set is generated from [apps/web/public/slack-workspace-iconv2.png](apps/web/public/slack-workspace-iconv2.png). Replace those generated PNGs in [apps/mobile-ios-native/Assets.xcassets/AppIcon.appiconset](apps/mobile-ios-native/Assets.xcassets/AppIcon.appiconset) if you need store-ready branding changes.
- The shared iOS accent color is defined in [apps/mobile-ios-native/Assets.xcassets/AccentColor.colorset](apps/mobile-ios-native/Assets.xcassets/AccentColor.colorset).

## App Review Notes

Suggested App Review Notes for App Store Connect:

```text
Gym Pilot reads step count, heart rate, and active energy data from Apple Health using HealthKit on a physical iPhone. The app displays the latest values on screen and can optionally send those values to a backend endpoint configured by the developer in Info.plist.

Reviewer steps:
1. Install on a physical iPhone with Apple Health data available.
2. Tap Connect Apple Health and allow read access for Steps, Heart Rate, and Active Energy.
3. Return to the app and confirm the latest values load on the dashboard.
4. If GPBackendUploadURL and GPBackendUploadAnonKey are configured for the review build, tap Send to backend to submit the displayed values.

The app does not write data to HealthKit.
```

Release checklist before submission:

1. Confirm `GPBackendUploadURL` and `GPBackendUploadAnonKey` are set for the review build.
2. Confirm the bundle identifier matches an App ID in your Apple Developer account.
3. Add a privacy policy URL that discloses HealthKit data usage and any backend transfer.
4. Complete App Privacy answers in App Store Connect to reflect Health and Fitness data collection and transmission, if applicable for your production backend.
5. Publish the draft policy in [apps/mobile-ios-native/PRIVACY_POLICY.md](apps/mobile-ios-native/PRIVACY_POLICY.md) after replacing its placeholders.

## App Privacy Answers

Use these as the baseline App Privacy answers for the current code in this folder. Adjust them if your production backend stores more data, links it to an account, or uses it for analytics.

### Data types used by this app

- Health and Fitness: Step count, heart rate, active energy.
- Identifiers: None in the current payload format, unless your backend adds account linkage, auth-derived identity, or persistent identifiers outside this app code.

### Collection behavior

- The app reads HealthKit data on-device after user permission is granted.
- The app can transmit the displayed health values to a configured backend when the user taps `Send to backend`.
- The app does not write data back to HealthKit.

### Suggested App Store Connect answers

If your review build only displays data locally and `Send to backend` is disabled:

1. Health and Fitness Data: `Not Collected`.
2. No other data types should be declared unless your release build adds them elsewhere.

If your review or production build enables backend upload:

1. Health and Fitness Data: `Collected`.
2. Data linked to the user: choose `Yes` if your backend can associate the upload with an account, auth session, profile, or stable identifier; otherwise choose `No`.
3. Tracking: `No`, unless you share this data with third parties for cross-app tracking or advertising.
4. Purpose: usually `App Functionality`.

### Privacy policy minimum content

Your privacy policy should explicitly state:

1. The app requests read access to step count, heart rate, and active energy from Apple Health.
2. The app displays those values in the app.
3. Whether tapping `Send to backend` sends those values to your server.
4. Whether uploaded health data is stored, for how long, and whether it is linked to a user account.
5. How a user can request deletion of any backend-stored health data.

### HealthKit review reminders

Apple is stricter with HealthKit than with generic profile data. Keep these constraints in mind:

1. Do not use HealthKit data for advertising or marketing.
2. Do not claim to write or modify Health data unless the app actually does so.
3. Keep the permission text, privacy policy, and App Store Connect disclosures consistent with the real behavior of the submitted build.

## Privacy Policy Draft

A draft policy you can adapt and publish is available in [apps/mobile-ios-native/PRIVACY_POLICY.md](apps/mobile-ios-native/PRIVACY_POLICY.md).

## App Store Connect Draft

A draft App Store Connect metadata file is available in [apps/mobile-ios-native/APP_STORE_CONNECT.md](apps/mobile-ios-native/APP_STORE_CONNECT.md).
