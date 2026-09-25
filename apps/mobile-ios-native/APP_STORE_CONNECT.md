# Gym Pilot iOS App Store Connect Draft

Last updated: 2026-09-11

Use this file as the working draft for App Store Connect metadata for the native iOS app in [apps/mobile-ios-native/GymPilot.xcodeproj](apps/mobile-ios-native/GymPilot.xcodeproj).

Replace bracketed placeholders before submission.

## App Information

- App name: Gym Pilot
- Bundle identifier: com.gympilot.ios
- Primary category: Health & Fitness
- Secondary category: `[Optional secondary category]`

## Promotional Text

Review your latest Apple Health metrics in Gym Pilot and share them with your connected service when you choose.

## Description

Gym Pilot gives you a focused mobile view of your latest Apple Health activity.

If configured by the publisher, the app also provides a native Supabase sign-in screen before loading the embedded Gym Pilot web experience.

With your permission, the app reads your latest:

- Step count
- Heart rate
- Active energy

You can refresh those values on demand and view them in a simple dashboard designed for quick health-metric checks.

If your organization has configured a backend connection, you can also choose to send the displayed metrics to your connected service.

The iPhone app also supports an embedded web experience through a configured in-app web view when a web URL is provided by the app publisher.

Gym Pilot does not write data back to Apple Health, and the current upload payload does not include the user's device name.

This app is best suited to workflows where Apple Health data needs to be reviewed quickly on-device and optionally forwarded to a connected backend under user control.

## Subtitle

Apple Health snapshot

## Keywords

apple health,fitness,steps,heart rate,activity,wellness,gym

## What's New

Initial release of Gym Pilot for iPhone with Apple Health read access for steps, heart rate, and active energy.

## Support URL

`[Support URL]`

## Marketing URL

`[Optional marketing URL]`

## Privacy Policy URL

Publish and link the policy adapted from [apps/mobile-ios-native/PRIVACY_POLICY.md](apps/mobile-ios-native/PRIVACY_POLICY.md):

`[Privacy policy URL]`

## Content Rights

Confirm you have the rights to any uploaded app icon, screenshots, copy, and branding assets.

## Age Rating Guidance

This app currently appears suitable for a standard Health & Fitness submission with no gambling, mature themes, or unrestricted user-generated content. Confirm the final questionnaire against your production build.

## Export Compliance

The app currently sets `ITSAppUsesNonExemptEncryption` to `false` in [apps/mobile-ios-native/Info.plist](apps/mobile-ios-native/Info.plist). Re-evaluate this if you add custom cryptography or regulated encryption features beyond standard platform networking.

## Review Notes

Use or adapt this note in App Store Connect:

```text
Gym Pilot can present a native Supabase sign-in screen before loading the embedded web experience. After sign-in, the app reads step count, heart rate, and active energy data from Apple Health using HealthKit on a physical iPhone. The app displays the latest values on screen and can optionally send those values to a backend endpoint configured by the developer in Info.plist.

Reviewer steps:
1. Install on a physical iPhone with Apple Health data available.
2. If GPSupabaseURL and GPSupabaseAnonKey are configured, sign in with the supplied review account to load the embedded web experience.
3. Tap Connect Apple Health and allow read access for Steps, Heart Rate, and Active Energy.
4. Return to the app and confirm the latest values load on the dashboard.
5. If GPBackendUploadURL and GPBackendUploadAnonKey are configured for the review build, tap Send to backend to submit the displayed values.

The app does not write data to HealthKit. If backend upload is intentionally disabled in the review build, the Send to backend button remains unavailable by design.
```

## Screenshot Checklist

Capture these on a physical iPhone build:

1. Initial screen before Apple Health is connected.
2. Permission-approved dashboard showing populated metrics.
3. Backend upload state, if that feature is enabled in the submitted build.

## Submission Checklist

1. Verify signing and archive creation in Xcode.
2. Verify the review build uses the intended `GPBackendUploadURL` and `GPBackendUploadAnonKey` values.
3. Verify the app icon set in [apps/mobile-ios-native/Assets.xcassets/AppIcon.appiconset](apps/mobile-ios-native/Assets.xcassets/AppIcon.appiconset) matches final branding.
4. Publish your privacy policy and add its public URL.
5. Confirm App Privacy answers match the actual submitted build behavior.