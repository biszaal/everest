# Submitting Everest Flow to the App Store

Everything you need to ship to TestFlight + the App Store via Expo Application Services (EAS). I've assumed iOS only; the Android Play Store path is similar but uses `--platform android`.

> Realistic timeline: ~2–4 hours of setup work spread across waiting for builds, then 1–3 days for Apple review.

---

## 0. Prerequisites you must own

| Item | Cost | Get it from |
|---|---|---|
| Apple Developer Program account | $99 / year | https://developer.apple.com/programs/ |
| Expo account (free) | $0 | https://expo.dev/signup |
| App icon `1024×1024` PNG (no transparency, no rounded corners — Apple rounds it) | — | You |
| 6.7" + 6.1" iPhone screenshots (`1290×2796`, `1179×2556`) | — | iOS Simulator's `Cmd-S` |
| A public URL hosting [PRIVACY.md](PRIVACY.md) as plain HTML or markdown | — | GitHub Pages, Netlify, Vercel, etc. |

Apple's submission form will refuse to save without a privacy URL.

---

## 1. Set up EAS one-time

```bash
cd mobile
npm install -g eas-cli
eas login                           # use your Expo account
eas init                            # creates the project on Expo's side; copy the
                                    # printed projectId into mobile/app.json
                                    # under expo.extra.eas.projectId
```

Edit [mobile/eas.json](mobile/eas.json) and replace the three `REPLACE_*` strings under `submit.production.ios`:
- `appleId`: the email you use for App Store Connect
- `ascAppId`: the numeric "App Apple ID" you get after creating the app entry in step 2 (e.g. `6479830142`)
- `appleTeamId`: your 10-character team ID from https://developer.apple.com/account → Membership

---

## 2. Create the App Store Connect entry

You can't run `eas submit` until App Store Connect knows about your app.

1. Go to https://appstoreconnect.apple.com/apps → `+` → **New App**
2. Fill in:
   - **Platform:** iOS
   - **Name:** Everest Flow (must be unique on the App Store; if taken, you'll need a variant)
   - **Primary Language:** English
   - **Bundle ID:** `com.everestflow.app` (must match `app.json` exactly; you'll need to register it first at https://developer.apple.com/account/resources/identifiers/bundleId/)
   - **SKU:** anything internal, e.g. `everest-flow-ios-001`
3. After creation, the page URL will contain the **App Apple ID** (the numeric one). Paste it into `eas.json` as `ascAppId`.

---

## 3. Build the iOS production binary

```bash
eas build --platform ios --profile production
```

What happens:
- EAS asks if it should generate / manage your distribution certificate and provisioning profile. **Yes** is correct unless you have your own pipeline.
- Your code is uploaded to Expo's build farm.
- A signed `.ipa` is produced — usually 15–25 minutes for a Sonnet-sized project.
- The build URL is printed; you can also see it at https://expo.dev/builds.

Repeat with `--platform android` later when you want a Play Store AAB.

---

## 4. Submit to TestFlight (recommended) or App Store directly

```bash
eas submit --platform ios --profile production --latest
```

`--latest` uses the most recent successful build. This uploads the `.ipa` to App Store Connect via Apple's `altool`. Roughly 5–10 minutes. The build appears in App Store Connect under **TestFlight** → **Builds** → **iOS** after it finishes processing (another 10–30 minutes).

**Always TestFlight first.** Add yourself as an internal tester, install via the TestFlight app on your phone, hit every screen including the FloatingPlayer's PIP / Download / speed picker on real direct-MP4 content, and confirm the WebView renders complex sites (YouTube, news article with embedded video, archive.org).

---

## 5. App Store metadata

In App Store Connect → your app → **App Store** → **iOS App** → **1.0 Prepare for Submission**:

| Field | What to write |
|---|---|
| **Subtitle** | "Browser + folders for your videos" (short, ≤30 chars) |
| **Promotional text** | (one line; can be edited without re-submission) |
| **Description** | See draft below |
| **Keywords** | `video, player, browser, offline, folder, organizer, library, hls, mp4, picture in picture` |
| **Support URL** | A page on your site / GitHub repo |
| **Marketing URL** | Optional |
| **Privacy Policy URL** | The hosted [PRIVACY.md](PRIVACY.md) URL |
| **Screenshots** | 6.7" iPhone (`1290×2796`) — at least 1, ideally 5 |
| **App Review Information → Notes** | See "Notes for Reviewer" below |
| **App Review Information → Demo Account** | Leave blank — there is no login |
| **Age Rating** | Walk through the questionnaire honestly. Web browser → 17+ on most providers. |
| **Content Rights** | "Yes, this app contains, displays, or accesses third-party content." |

### Description draft (paste verbatim, edit as you like)

```
Everest Flow is a privacy-first media organizer with a built-in browser.

Save any direct video link from the open web — Archive.org, PeerTube,
Vimeo, Wikimedia Commons, or any site that publishes a plain HTML5 video.
Organize what you save into folders. Watch in a floating player that
keeps playing while you keep browsing.

• A real in-app browser. Address bar, tabs, cookies isolated per site.
• Save any direct .mp4 / .m3u8 / .mov / .webm link. Long-press a video
  on a page to save just that clip.
• Folder-based file manager. Move, rename, delete.
• Floating player with both Picture-in-Picture and full-screen modes.
  Swipe left for brightness, right for volume. Playback speed picker.
  Optional offline downloads with progress.
• 100% on-device. No accounts. No telemetry. No ads. No third-party SDKs.
  No data collection — verified in our public privacy policy.

YouTube and Vimeo videos are streamed via their official embed players,
not downloaded. Everest Flow respects platform Terms of Service.
```

### Notes for Reviewer (critical — Apple will read this)

```
Hi reviewer,

Everest Flow is a media organizer first and a browser second. The browser
exists so the user can save direct video URLs they find on the open web
into a local library, organize them into folders, and watch them in a
custom player. The browser does not duplicate Safari — it is a tool that
feeds the library.

Notes:

1. No account required. The app generates an anonymous device ID on
   first launch. There is no login screen.

2. No data leaves the device. The only outbound calls are to YouTube
   and Vimeo's public oEmbed endpoints (for title + thumbnail) and to
   the host of whichever video the user is streaming.

3. Downloads only support direct MP4 / HLS URLs that the user explicitly
   chooses to save. We do not extract YouTube or Vimeo video streams,
   which would violate their ToS. The download UI is hidden for those
   platforms.

4. NSAllowsArbitraryLoads is enabled because the in-app browser must
   render arbitrary HTTP and HTTPS pages, similar to how Safari and
   other browsers work. The user controls which sites are visited.

5. UIBackgroundModes:audio is enabled so Picture-in-Picture playback
   continues when the user multitasks, which is the standard pattern
   for a video app.

To exercise the app:
   • Tap the address bar, paste:
     https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4
   • Tap Save Video → it appears in Library
   • Tap it → floating player opens
   • Try the Speed pill, the Download pill, the PIP pill
   • Swipe up on the left half (brightness) and right half (volume)

Thank you.
```

---

## 6. Submit for review

After all metadata is filled in and the TestFlight build is selected as the production build, click **Add for Review** → **Submit for Review** at the top of the page.

Apple's median review time is **24–48 hours** as of 2026. Expect 1–3 business days.

---

## Review-risk items I'd be ready for

These are not red flags but they're things Apple's reviewers commonly probe. Have a one-line answer for each:

1. **"Your app duplicates the functionality of Safari (Guideline 4.3 / spam)."**
   Response: "Everest Flow is a media organizer; the browser is a tool to feed the library. Differentiated features include the floating player with PIP, swipe gestures for brightness/volume, folder-based organization, offline downloads, playback speed control, and a queue with autoplay-next."

2. **"Why does your app need NSAllowsArbitraryLoads?"**
   Response: "The in-app browser must render arbitrary HTTP and HTTPS pages, identical to Safari's behavior. The user is in control of which sites are loaded."

3. **"Your app appears to download YouTube videos."**
   Response: "It does not. The Download UI is hidden for YouTube and Vimeo videos and never invoked for them. Only direct MP4 and HLS URLs are supported. The metadata fetch uses YouTube's public oEmbed endpoint, which only returns title and thumbnail."

4. **"Privacy practices don't match what's in your binary."**
   On the App Store Connect → App Privacy questionnaire, select **"Data Not Collected"** for every category. This matches our binary exactly.

---

## Versioning between submissions

For each new release, bump version + buildNumber:
```
mobile/app.json  →  expo.version: "0.1.1", expo.ios.buildNumber: "2"
```
Or set `autoIncrement: true` in `eas.json` (already done) and EAS will bump `buildNumber` for you on each build. Apple requires a unique buildNumber per upload to App Store Connect.

---

## What I deliberately have not automated

- **App icon and screenshots** — these are creative assets, not code. Place icon at `mobile/assets/icon.png` (1024×1024) and reference it via `expo.icon` in `app.json`. Screenshots are uploaded directly into App Store Connect.
- **Hosting the privacy policy** — point Apple at any public URL that serves PRIVACY.md as readable HTML. GitHub Pages on the project repo is the simplest option.
- **Apple Developer Program enrollment** — only the account holder can do this.
