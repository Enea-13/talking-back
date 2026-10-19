# Store release checklist

Talking Back ships to the App Store and Google Play as a Capacitor app: the same build as the web app (`dist/`), bundled into native iOS (`ios/`) and Android (`android/`) projects.

| | |
| --- | --- |
| Store name | Talking Back |
| Bundle ID / application ID | `io.github.enea13.talkingback` (permanent once published) |
| Version | 1.0 (build 1) on both platforms |
| Minimum OS | iOS 15, Android 7.0 (API 24); Android targets API 36 |

Only you can create the developer accounts, sign builds with real certificates and submit. Nothing in this repository does any of that.

## 1. Set up this Mac (once)

When the native projects were added (October 2026), this Mac had none of the native toolchains, only the Xcode Command Line Tools and an Intel-only Java 8 that can't run on Apple silicon without Rosetta. Xcode with a Simulator runtime takes about 20 GB, and Android Studio with the SDK and an emulator about 10 GB more, so free up space first.

**iOS**
- [ ] Install **Xcode 26 or later** from the Mac App Store. Since April 2026, App Store uploads must be built with the iOS 26 SDK.
- [ ] Open Xcode once, accept the licence, and add the **iOS** platform (Settings → Components) to get a Simulator.
- [ ] Point the command line at it: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
- [ ] CocoaPods is not needed. Capacitor 8 uses Swift Package Manager, which comes with Xcode.

**Android**
- [ ] Install the current **Android Studio** (Narwhal 3 / 2025.1.3 or newer, for Android Gradle Plugin 8.13). It includes JDK 21, which Capacitor 8 requires.
- [ ] In the SDK Manager, install **Android SDK Platform 36**, the latest **Build-Tools**, **Platform-Tools** and the **Emulator**.
- [ ] In the Device Manager, create an emulator (e.g. Pixel 9, API 36, arm64 image).
- [ ] For command-line builds, add this to `~/.zshrc`:
  ```bash
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  export ANDROID_HOME="$HOME/Library/Android/sdk"
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
  ```

## 2. Build and run

```bash
npm run sync          # npm run build (web) + copy it into ios/ and android/
npm run ios           # sync, then open the project in Xcode (Run ▶ on a Simulator)
npm run android       # sync, then open the project in Android Studio
```

The same steps from the command line:

```bash
npx cap run ios --list                    # Simulators and devices
npx cap run ios --target <id>             # build, install and launch
cd android && ./gradlew assembleDebug     # → android/app/build/outputs/apk/debug/app-debug.apk
npx cap run android --target <emulator>   # build, install and launch
```

After changing `public/icon.svg`, run `npm run native-assets` to redraw the native icons and splash screens.

## 3. Test on a Simulator or emulator, then on a real phone

- [ ] Launch in light mode, then in dark mode: the splash should match, with no white flash, and the status bar text should be readable.
- [ ] About → Appearance: choosing Light or Dark switches the status bar text (and the Android navigation bar) with the page.
- [ ] Search for a thought, then open a response card.
- [ ] **Speak it back** reads the verse; **Stop** stops it. On Android each word lights up as it is read. The iOS voice plugin doesn't report word positions, so on iOS the verse is read without highlighting.
- [ ] **Save** gives a light tap (real devices only; Simulators have no haptics), and the entry shows up under Saved after a relaunch.
- [ ] **Share** opens the system share sheet with the verse text and no `capacitor://` or `localhost` link.
- [ ] Search "suicide": the crisis panel appears. **Call 988** (or your country's line) opens the dialer: on iPhone, the "Call 988?" prompt (the Simulator has no Phone app, so nothing happens there). **findahelpline.com** opens in Safari or Chrome, not inside the app. Changing the country is remembered.
- [ ] Offline: turn on airplane mode, force-quit, relaunch. Everything must work, since the app makes no network requests.
- [ ] Rotate, and try a phone with a notch or Dynamic Island: nothing should sit under the status bar or home indicator.
- [ ] Android back button/gesture: goes back through pages, and leaves the app from Home.
- [ ] Android with no English text-to-speech voice: Speak it back resets without an error. If so, install voice data in Settings → Text-to-speech.

## 4. Developer accounts

**Apple Developer Program: $99 per year**
- [ ] Enrol at developer.apple.com/programs with a two-factor Apple ID. As an individual, your legal name is shown as the seller. An organization needs a D-U-N-S number.
- [ ] In App Store Connect → Apps → **+**, create the app with name "Talking Back", bundle ID `io.github.enea13.talkingback`, any SKU, primary language English. If the name is taken, the listing can be "Talking Back: Scripture" while the home-screen name stays "Talking Back".
- [ ] Complete the EU **Digital Services Act trader status**. If you declare yourself a trader, your address, phone and email are shown on the EU storefronts.
- [ ] Agreements, Tax and Banking: a free app needs only the Free Apps agreement.

**Google Play Console: $25 once**
- [ ] Register at play.google.com/console as a **personal** account. Identity verification with a government ID can take a few days, and Play may also ask you to confirm access to a real Android phone.
- [ ] New personal accounts (created after 13 November 2023) must run a **closed test with at least 12 testers who stay opted in for 14 days in a row** before they can apply for production access. If the count drops below 12, the 14 days restart. Recruit the testers before you need them.
- [ ] Then apply for production access in the Dashboard, answering questions about the closed test.

## 5. Signing and uploading (yours to do)

**iOS**
- [ ] Xcode → App target → Signing & Capabilities → Team: your team (automatic signing).
- [ ] Choose "Any iOS Device", then Product → Archive → Distribute App → App Store Connect. Test it in TestFlight first.

**Android**
- [ ] Create an upload key once and keep it outside the repo. `*.jks` and `*.keystore` are git-ignored. Back it up: losing it means asking Google to reset the upload key.
  ```bash
  keytool -genkeypair -v -keystore ~/keys/talking-back-upload.jks -keyalg RSA -keysize 4096 -validity 10000 -alias upload
  ```
- [ ] Build a signed App Bundle: Android Studio → Build → Generate Signed App Bundle / APK → Android App Bundle, with that key. (`npx cap build android` can do it too, but it takes the passwords as command-line flags, which end up in your shell history.)
- [ ] Upload the `.aab` to the closed testing track and let Google manage the app signing key (Play App Signing).

## 6. Privacy policy

Both stores need a public privacy-policy URL. Apple also wants it reachable **inside the app** (guideline 5.1.1).

- [ ] Fill in the brackets in [`docs/privacy.md`](privacy.md): your name, contact email and effective date.
- [ ] Host it. With GitHub Pages: repository Settings → Pages → Deploy from branch `main`, folder `/docs`. It is then at `https://enea-13.github.io/talking-back/privacy` (everything else in `docs/` becomes public too, which is harmless). Any other static host works.
- [ ] Add a "Privacy policy" link to the About screen (`src/screens/About.tsx`, next to "Everything stays on your device"). On the app, external links open in the browser.
- [ ] Paste the URL into App Store Connect (App Privacy) and Play Console (App content → Privacy policy).

## 7. Privacy answers

**App Store Connect → App Privacy**
- [ ] "Do you or your third-party partners collect data from this app?" **No**. The label then reads **Data Not Collected**.
- [ ] Tracking: none. `ios/App/App/PrivacyInfo.xcprivacy` declares no tracking, no collected data and no required-reason APIs. Capacitor ships its own matching manifest.
- [ ] Export compliance: answered in `Info.plist` (`ITSAppUsesNonExemptEncryption` = NO), so uploads don't ask.

**Play Console → App content → Data safety**
- [ ] "Does your app collect or share any of the required user data types?" **No**. The rest of the form is then skipped. Data saved only on the device (the Saved list, help country, theme, text size) is not "collected" in Google's sense, because it never leaves the device.
- [ ] Account creation: the app has no accounts.
- [ ] Other App content declarations: **Ads**: no ads. **App access**: everything is available without logging in. **Target audience**: 13 and over (not designed for children). **News app**: no. **Government app**: no. **Financial features**: none. **Health apps**: none. The crisis panel only points to public help lines; the app gives no medical or health service.

## 8. Age rating: expect 12+/Teen

Some entries name sexual temptation, drinking and thoughts of violence, and crisis searches show suicide-prevention lines. Nothing is explicit or graphic.

- [ ] **Apple**: answer the age-rating questionnaire honestly. Suggested answers: mature or suggestive themes **infrequent/mild**; references to alcohol **infrequent/mild**; sexual content **none** or **infrequent/mild** (text names sexual temptation but describes nothing); violence **none**; unrestricted web access **no** (links leave the app for Safari); no user-generated content, no chat, no gambling. If asked about health or wellness topics, say **yes, infrequent**: suicide-prevention lines. Apple replaced 12+ with **13+** in its 2025 rating update (the tiers are now 4+, 9+, 13+, 16+, 18+), so expect **13+**.
- [ ] **Google Play** (IARC questionnaire): expect **Teen** (ESRB) / **PEGI 12**. Answer the sex, alcohol and suicide questions the same way: textual references only, nothing depicted.

## 9. Store listing (draft)

**Name**: Talking Back (30 characters max)

**App Store subtitle** (30 max): Answer thoughts with Scripture

**App Store promotional text** (170 max):
> Name the thought that is pulling at you and answer it with a Bible verse, the way the desert monks did. 494 responses, fully offline, nothing tracked.

**App Store keywords** (100 max): `bible,verse,scripture,temptation,prayer,evagrius,christian,devotional,psalms,desert fathers,lent`

**Google Play short description** (80 max):
> Name the tempting thought and answer it with a Bible verse, in seconds.

**Description** (both stores, 4,000 max):
> When a tempting thought comes, answer it.
>
> In the fourth century the monk Evagrius of Pontus collected the thoughts that pull us away from God and paired each one with words of Scripture to speak back at it, the way Jesus answered the tempter in the desert. Talking Back puts that method in your pocket.
>
> • Describe the thought in your own words and find the verse that answers it within seconds.
> • Browse 494 thoughts under Evagrius's eight headings: cravings and comfort, lust and impurity, money and possessions, discouragement and fear, anger and resentment, restlessness, craving approval, and pride and self-reliance.
> • Tap Speak it back to hear the verse read aloud.
> • Save the verses you return to, and share them.
> • Works completely offline, with no account, no ads and no tracking. Everything stays on your device.
> • If a search suggests you may be at risk, the app shows crisis help lines for your country.
>
> Verses are from the World English Bible and Brenton's English Septuagint, both in the public domain. Talking Back is a companion for prayer, not a substitute for a pastor, a spiritual director or medical care.

**Categories**: App Store: Reference (secondary: Lifestyle). Google Play: Books & Reference.
**Support URL** (required by Apple): e.g. `https://github.com/Enea-13/talking-back`, or a page beside the privacy policy.
**Copyright**: © 2026 [your name]
**Content rights** (Apple asks): the app shows third-party content you have the right to use: public-domain Bible texts, a public-domain painting from the National Gallery of Art's open access program, and Literata under the SIL Open Font License.

## 10. Screenshots and graphics

Take screenshots from the Simulator (File → Save Screen) and the emulator. Show a search, a response card, the eight thoughts, Saved, and dark mode. Use no transparency.

**App Store** (1–10 per size; App Store Connect scales them down for smaller devices):
- [ ] iPhone 6.9-inch: **1320 × 2868** (iPhone 17 Pro Max Simulator; 1290 × 2796 and 1260 × 2736 are also accepted)
- [ ] iPhone 6.3-inch: **1206 × 2622** (iPhone 17 Pro Simulator). App Store Connect currently also asks for the medium Dynamic Island size; its media manager shows which slots are mandatory.
- [ ] iPad 13-inch: **2064 × 2752** (or 2048 × 2732), because the app is universal. To ship iPhone-only and skip iPad screenshots, set Targeted Device Family to iPhone in Xcode (`TARGETED_DEVICE_FAMILY = 1`). iPads would then run it in iPhone compatibility mode.

**Google Play**:
- [ ] Phone screenshots: 2–8, PNG or JPEG, 9:16 (each side 320–3,840 px; at least 1080 × 1920 to qualify for promotion)
- [ ] Feature graphic: **1024 × 500**, required
- [ ] App icon: **512 × 512** PNG (render from `public/icon.svg`, e.g. reuse `public/icon-512.png`)
- [ ] 7-inch and 10-inch tablet screenshots: optional, but recommended

## 11. Apple guideline 4.2 (minimum functionality)

Apple rejects apps that are "just a website in a wrapper." Talking Back is not one: nothing loads from the web, and it uses the phone's own features. Paste this into App Review → Notes:

> Talking Back is a fully offline Christian reference app: 494 tempting thoughts from Evagrius of Pontus's fourth-century handbook, each paired with Bible verses, with search, browsing and a Saved list. All content is bundled; the app makes no network requests and needs no login.
>
> Native features: on-device text-to-speech ("Speak it back" on any response), the iOS share sheet (Share), haptic feedback when saving, a status bar and launch screen that follow light and dark mode (About → Appearance), and safe-area layout for the Dynamic Island and home indicator.
>
> Crisis support: searching "suicide" or "self-harm" shows national crisis lines for the user's country (US 988, Canada 9-8-8, UK and Ireland 116 123, Australia 13 11 14, New Zealand 1737), which open the Phone app, plus findahelpline.com for other countries.

The native features are in `src/lib/native.ts` (share, haptics, status bar, splash) and `src/lib/speak.ts` (text-to-speech).

## 12. Before every release

- [ ] **Recheck the crisis lines** in `src/lib/care.ts`, last checked in October 2026, against each service's own site: 988lifeline.org (US 988), 988.ca (Canada 9-8-8), samaritans.org (UK and Ireland 116 123), lifeline.org.au (13 11 14), 1737.org.nz (1737), plus the emergency numbers (911, 999, 112, 000, 111) and findahelpline.com. Update the "checked" month in `care.ts` and in the README.
- [ ] Bump the version: iOS **Version** and **Build** (Xcode → App target → General); Android `versionName` and `versionCode` in `android/app/build.gradle`. Build numbers and `versionCode` must go up with every upload.
- [ ] `npm run sync`, then test section 3 on a real iPhone and a real Android phone.
- [ ] If the icon changed: `npm run native-assets`.
- [ ] Keep the privacy policy and the App Store and Play privacy answers true. Recheck them if you ever add analytics, crash reporting, accounts or any network request.
