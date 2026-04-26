# Everest Flow — Privacy Policy

**Effective date:** 2026-04-23

## Summary

Everest Flow does not collect, transmit, sell, or share any personal data about you. We do not have user accounts, no analytics, no advertising, no crash reporting, and no third-party SDKs that would do any of those things on our behalf. Everything you save and watch stays on your device.

## What we store on your device

When you use Everest Flow, the app creates and reads the following data **only on your phone**, in storage that is sandboxed to this app and removed when you uninstall:

| What | Where | Why |
|---|---|---|
| A randomly generated device ID | iOS Keychain / Android Keystore (via `expo-secure-store`) | To tie locally-saved videos to a single anonymous identity. Not linked to your name, email, IP, or anything else. |
| The video URLs you save, their titles, and the platform name (YouTube / Vimeo / Direct / HLS) | A SQLite database file in the app's sandbox (`everest.db`) | To list them in your library and play them back. |
| Folders you create and which video belongs to which folder | Same SQLite database | To show your file-manager view. |
| Watch progress (timestamp, duration) for videos you've played | Same SQLite database | So you can resume from where you stopped. |
| Optional: full video files you've explicitly tapped **Download** on | The app's `documentDirectory/videos/` folder | So you can play them offline. |
| Web cookies and browser cache for sites you visit in the in-app browser | The WebView's storage | Same as any browser — for site logins and performance. The **Clear** button on the Browse tab wipes these for the current page. |

None of this data ever leaves your device. There is no server we run that knows you exist.

## Network requests we make

The app makes these and only these outbound requests:

1. **Fetching the page you typed into the address bar.** Same as any browser — the destination site sees the request and may set its own cookies; we don't see what they see.
2. **YouTube oEmbed** (`https://www.youtube.com/oembed`) — when you save a YouTube link, we ask YouTube's public oEmbed endpoint for the video title and thumbnail URL. One-shot, no cookies, no identifiers. YouTube logs the request like any other; we do not.
3. **Vimeo oEmbed** (`https://vimeo.com/api/oembed.json`) — same as above, for Vimeo links.
4. **The video itself** when you press play. The video host (e.g. archive.org, peertube.tld, your own server) sees a request for the video file. We don't proxy this; your phone connects directly.

We do not call our own server because we don't run one.

## Third parties

Everest Flow does **not** include any of the following:

- Analytics (Google Analytics, Mixpanel, Amplitude, Firebase Analytics, etc.)
- Crash reporters (Sentry, Bugsnag, Crashlytics, etc.)
- Advertising SDKs
- Marketing / attribution SDKs (AppsFlyer, Adjust, Branch, etc.)
- Push notification services
- Login providers (Apple Sign-In, Google Sign-In, etc.) — there is no login

## Data we never collect

We never collect or transmit your name, email address, phone number, location (precise or approximate), contacts, photos, microphone input, camera input, IP address, device identifiers (IDFA / GAID), advertising profile, browsing history, or watch history.

## Children

Everest Flow does not knowingly collect data from anyone, including children. Because we don't collect data, COPPA-style protections are inherent to the product.

## Your rights

Because we don't have your data, there's nothing to delete, export, or correct on a server. If you want to remove everything Everest Flow has ever saved about you, **uninstall the app** — that removes the SQLite database, the SecureStore device ID, the WebView cookies, and any downloaded files.

## Contact

If you have questions about this policy, open an issue on the project's repository or contact the maintainer at the email listed on the App Store / Play Store listing.

## Changes to this policy

If this policy changes, we'll publish a new version at the same URL with a new effective date. Past versions are visible in the repository's git history.
