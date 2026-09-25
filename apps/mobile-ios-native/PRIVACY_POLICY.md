# Gym Pilot iOS Privacy Policy

Last updated: 2026-09-11

This Privacy Policy describes how Gym Pilot iOS handles information when you use the app.

Replace the bracketed placeholders before publishing this policy:

- `[Company name]`
- `[Contact email]`
- `[Privacy policy URL]`
- `[Data retention period]`
- `[Deletion request method]`

## Who we are

Gym Pilot iOS is provided by `[Company name]`. If you have questions about this Privacy Policy or your data, contact `[Contact email]`.

## Account sign-in

If enabled by the app publisher, Gym Pilot iOS may present a native sign-in screen that uses Supabase authentication.

When you sign in, the app may process:

- Your email address
- Your password
- Authentication session tokens returned by Supabase

The app uses those credentials only to authenticate you and establish access to the embedded web experience. The password is submitted to Supabase for authentication and is not stored by the app after sign-in completes.

## Health data we access

With your permission, Gym Pilot iOS may read the following HealthKit data from Apple Health:

- Step count
- Heart rate
- Active energy

The app reads this data only after you grant permission through the Apple Health permission prompt.

## How we use HealthKit data

Gym Pilot iOS uses HealthKit data to:

- Display your latest health metrics inside the app
- Let you choose to send those displayed values to your configured backend service

The app does not write, edit, or delete data in Apple Health.

## Data sent to your backend

If backend upload is configured and you tap `Send to backend`, the app may send the following information to your backend service:

- A fixed source label identifying the app as Gym Pilot iOS
- Timestamp of the upload
- The currently displayed step count value
- The currently displayed heart rate value
- The currently displayed active energy value

The backend endpoint is configured by the app publisher. You should describe your backend storage, processing, access controls, and location in the public version of this policy if you enable backend upload in production.

## When data is collected

HealthKit data is read only after you authorize access.

Data is sent to your backend only when:

1. Backend upload is configured in the app.
2. You tap `Send to backend`.

## Legal basis and purpose

We use this information to provide the core app functionality of viewing health metrics and, if enabled, sending those metrics to your connected service.

We do not use HealthKit data for advertising, marketing, or cross-app tracking.

## Sharing of data

We do not sell HealthKit data.

We only share the data needed to authenticate you and the data you choose to send with the backend services and processors needed to operate Gym Pilot iOS. If you use third-party hosting, analytics, or logging systems in production, list them clearly in the published version of this policy.

## Data retention

If you enable backend upload, uploaded data may be retained for `[Data retention period]` or as otherwise required for the operation of your service and compliance obligations.

If the app is used without backend upload, HealthKit data is read from Apple Health for display in the app and is not stored by the app beyond normal app runtime behavior, except as required by the operating system.

## Your choices

You can:

- Decline HealthKit access
- Revoke HealthKit access at any time in Apple Health or iOS Settings
- Avoid sending data to the backend by not tapping `Send to backend`
- Sign out of the native Supabase-authenticated session
- Request deletion of backend-stored data using `[Deletion request method]`

## Data security

We take reasonable steps to protect information sent through the app. If you enable backend upload, you are responsible for ensuring your backend uses appropriate technical and organizational security measures, including encrypted transport and controlled access.

## Children

Gym Pilot iOS is not intended for use by children unless explicitly provided as part of a supervised service that complies with applicable law.

## International transfers

If your backend or service providers process data outside the country where the user is located, describe those transfers and the safeguards you rely on in the published version of this policy.

## Changes to this policy

We may update this Privacy Policy from time to time. We will post the current version at `[Privacy policy URL]`.

## Contact

For privacy questions or requests, contact `[Contact email]`.