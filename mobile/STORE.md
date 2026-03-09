# Store readiness checklist

Use this checklist when submitting the iHute app to the **Apple App Store** and **Google Play**. Code and config (e.g. `app.json`, `eas.json`) are already set for store builds; complete the steps below in the store consoles and with your assets.

---

## Both stores

- [ ] **Privacy policy URL** – Required if the app collects user data. Host a public URL and add it in both store listings.
- [ ] **App category** – Choose the appropriate category in each store.
- [ ] **Short description** – Brief tagline (character limits vary per store).
- [ ] **Full description** – Full app description and features.
- [ ] **Screenshots** – Phone and, if supporting tablet, tablet screenshots per store guidelines (see links below for sizes).

---

## Apple App Store

- [ ] **Apple Developer account** – Enrolled at [developer.apple.com](https://developer.apple.com).
- [ ] **App Store Connect** – Create the app record and link the same `bundleIdentifier` as in `app.json` (`com.ihute.app`).
- [ ] **Sign in with Apple / Push** – If the app uses these, configure them in the Developer portal and App Store Connect.
- [ ] **Export compliance & content rights** – Answer the export compliance and content rights questions in App Store Connect.
- [ ] **Build** – Run `eas build --platform ios --profile production` (EAS will prompt for credentials on first run). Upload the build to App Store Connect (via `eas submit` or manually).

**Screenshot sizes:** [App Store screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications)

---

## Google Play

- [ ] **Play Developer account** – Registered at [play.google.com/console](https://play.google.com/console).
- [ ] **Play Console app** – Create the app and use the same `package` as in `app.json` (`com.ihute.app`).
- [ ] **Content rating** – Complete the IARC questionnaire and assign the rating.
- [ ] **Target SDK & permissions** – Expo default is sufficient for a first submission; document any sensitive permissions your app uses and ensure the store listing and in-app disclosures match.
- [ ] **Build** – Run `eas build --platform android --profile production` to produce an AAB. Upload to Play Console (via `eas submit` or manually).

**Screenshot sizes:** [Play Store listing assets](https://support.google.com/googleplay/android-developer/answer/9866151)

---

## Build commands (reference)

From the `mobile` directory:

- **Production iOS:** `eas build --platform ios --profile production`
- **Production Android:** `eas build --platform android --profile production`
- **Both:** `eas build --platform all --profile production`

First run will prompt for Apple and/or Android credentials; EAS can manage signing (recommended).
