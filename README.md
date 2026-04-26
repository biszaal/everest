# Everest Flow

A privacy-first in-app browser + video organiser. Browse the web, save playable videos, organise them into folders, and watch in a persistent floating player that keeps playing while you browse.

> **No account. No telemetry. No autoplay.** Nothing plays, saves, or leaves your device without an explicit tap.

---

## Shape of the app

**Two tabs, one persistent floating player.**

| Tab | What it does |
|---|---|
| 🌐 **Browse** | Full in-app web browser (Chromium on Android, WebKit on iOS). Address bar, back/forward/reload, **Clear** to wipe cookies + storage for the current page. When a page exposes a playable video (HTML5 `<video>`, `.m3u8`, OG / Twitter card / JSON-LD), a blue **Video detected** banner slides under the URL row with a Save button. **Long-press** any `<video>` element in the page (~550ms hold) to skip the scanner and save just that clip — Aloha-style. |
| 📁 **Library** | File-manager view of your videos. Folders at top, loose (uncategorised) videos below. Filter pills along the top: **All / YouTube / Vimeo / Direct / Downloaded / Started**. Long-press a video for Move / Delete; long-press a folder for Rename / Delete. |

Floating on top of whichever tab you're viewing:

- **FloatingPlayer (PIP mode)** — a 220×124 mini card anchored bottom-right above the tab bar, draggable anywhere on screen. Shows the current video's thumbnail/stream, title, play/pause, skip-next, and close.
- **FloatingPlayer (Expanded mode)** — tap the PIP to fill the screen. Full custom controls: ⏮ −10 ⏯ +10 ⏭, seek bar with position / remaining time, autoplay-next toggle, up-next queue list. Bottom action pills: **{rate}× Speed** (0.5 / 1 / 1.25 / 1.5 / 2, pitch-corrected), **↓ Download** (direct + HLS, becomes "✓ Saved offline" once complete; long-press to remove), **⛶ PIP** (system Picture-in-Picture — see [Dev-build features](#dev-build-features) below), **📁 Move** to folder. Swipe up/down on the **left half** for brightness, **right half** for volume, with an on-screen indicator. Collapse arrow returns you to PIP; the video never stops.

Stack routes layered on top: **Folder** (drill-down into a folder's contents), **CreateFolder** + **MoveVideo** (modals).

---

## Nothing plays until you tap

Two pieces of state keep the app "silent until asked":

- **`queueStore.autostart`** (default `false`, reset on every `setQueue`, flipped to `true` when the user taps play, preserved through skipNext/skipPrev so auto-play-next still works once playback has started).
- **`mediaPlaybackRequiresUserAction={true}`** on every `react-native-webview` the app renders (Browse tab and the YouTube/Vimeo embed inside the FloatingPlayer). iframe videos can't autoplay themselves; the user has to tap inside the iframe to start.

Tap a saved video in Library → FloatingPlayer opens in Expanded mode, paused, first frame shown. You press ▶ to start. Video ends → next one in queue auto-plays because `autostart` is still `true`.

---

## Privacy

- **No accounts.** A per-install device id lives in SecureStore. Nothing is tied to an email, phone, IP, or name.
- **No analytics, crash reporting, or ads.** None in the dependency tree, and there never will be without an explicit opt-in.
- **All data is on-device.** SQLite (`everest.db`) + SecureStore + the app's filesystem. The Supabase code path in `src/services/remote/` is dormant; the active `src/services/local/` implementations handle everything.
- **Two outbound calls only.** YouTube oEmbed and Vimeo oEmbed for title/thumbnail when you save a link from those platforms. No cookies, no identifiers, one-shot.
- **WebView isolation.** A **Clear** button on the Browse header wipes cookies, localStorage, sessionStorage, and the WebView's cache for the current page.
- **No background tasks.** Nothing runs when the app is closed.

---

## Visual language (Signal palette from the design handoff)

| Token | Hex / value |
|---|---|
| Background | `#0B0B0F` |
| Chrome | `#111116` |
| Surface / card | `#141418` |
| Surface 2 | `#1C1C24` |
| Surface 3 | `#252530` |
| Text | `#FFFFFF` |
| Text muted | `#9CA3AF` |
| Text faint | `#6B7280` |
| Border | `rgba(255,255,255,0.07)` |
| Border strong | `rgba(255,255,255,0.13)` |
| Accent (Signal Blue) | `#3B82F6` |
| Accent soft | `rgba(59,130,246,0.13)` |
| Success | `#10B981` · Danger | `#EF4444` · Amber | `#F59E0B` |
| Card radius | `16px` · Pill radius | `100px` |

Defined once in [theme/index.ts](mobile/src/theme/index.ts) and [tailwind.config.js](mobile/tailwind.config.js).

---

## Run it

```bash
cd mobile
npm install
npx expo start -c        # -c clears Metro cache; recommended after config changes
```

No `.env` is required in local mode.

---

## Architecture

```
mobile/src/
├── components/
│   ├── FloatingPlayer.tsx       persistent player; PIP + Expanded modes, brightness/volume gestures, drag
│   ├── KeyboardSafeView.tsx     platform-correct keyboard avoidance
│   ├── VideoCard.tsx, PlaylistCard.tsx, ScreenHeader.tsx, Button.tsx, Input.tsx, EmptyState.tsx, LoadingView.tsx
├── screens/
│   ├── BrowseScreen.tsx         in-app browser (Tab 1)
│   ├── LibraryScreen.tsx        folders + loose videos (Tab 2)
│   ├── FolderScreen.tsx         inside-a-folder view (stack)
│   └── CreateFolderScreen.tsx, MoveVideoScreen.tsx (modal stack)
├── navigation/
│   ├── MainTabNavigator.tsx     Browse | Library
│   ├── MainNavigator.tsx        stack: Tabs (wrapped with FloatingPlayer), Folder, CreateFolder, MoveVideo
│   └── RootNavigator.tsx        auth bootstrap + NavigationContainer
├── store/
│   ├── queueStore.ts            queue + autostart + autoplay-next (Zustand)
│   ├── playerStore.ts           transient playback + expanded (PIP/fullscreen) flag
│   └── authStore.ts             device-id session bootstrap
├── hooks/
│   └── useVideos, useFolders, useQueue, useAuth, useDownloads (dormant)
├── services/
│   ├── auth.ts, videos.ts, playlists.ts, progress.ts    re-exports pointing at ./local
│   ├── local/                   SQLite-backed implementations
│   ├── remote/                  Supabase code (dormant; swap re-exports to activate)
│   ├── metadata.ts              client-side oEmbed + URL classifier
│   └── downloads/               HLS + direct MP4 savers (dormant, hidden in the current build)
└── types/
    └── index.ts
```

### Data model

```
videos(videoId PK, userId, url, title, thumbnail, platform,
       streamUrl, embedUrl, durationSec, createdAt, folderId)
playlists(playlistId PK, userId, name, description, cover, createdAt, updatedAt)
watch_progress(userId + videoId PK, progress, duration, updatedAt)
```

One video belongs to one folder (or none — those show up as "Videos" under the folders section). `playlist_items` remains as an unused table, kept for future multi-playlist support.

### Queue engine invariants

- `currentIndex ∈ [-1, queue.length - 1]`; `-1` means empty.
- Reorder updates `currentIndex` so the currently playing item never changes due to shuffles of other items.
- `skipNext` stops at the end of the queue (autoplay off → pause; on → no-op).
- `removeAt(currentIndex)` advances to the next video or ends gracefully.

---

## Supported URLs

| Platform | Stream | Save |
|---|---|---|
| YouTube (`/watch`, `/shorts/`, `youtu.be`) | ✅ via embed | ✅ URL saved; plays in iframe |
| Vimeo (`vimeo.com/{id}`) | ✅ via embed | ✅ URL saved; plays in iframe |
| Direct `.mp4` / `.mov` / `.webm` | ✅ native player with full custom UI | ✅ + ⤓ download |
| HLS `.m3u8` | ✅ native player | ✅ + ⤓ download (segments + manifest, rewritten to local paths) |

---

## Scripts

```bash
npm run start       # Expo dev server
npm run ios         # iOS simulator
npm run android     # Android emulator
npm run typecheck   # tsc --noEmit
```

---

## Dev-build features

Two features below need an Expo dev client (not Expo Go) because they touch native config:

- **OS-level Picture-in-Picture** — the **⛶ PIP** action pill in the FloatingPlayer's expanded mode calls `Video.setPictureInPictureModeAsync(true)`. iOS works once you build with the `expo-av` plugin and the `UIBackgroundModes: ["audio"]` plist key (both already in `app.json`). On Android the WebKit/Chromium activity needs `android:supportsPictureInPicture="true"` and matching `configChanges` flags — that's a custom config plugin away. The button silently no-ops in Expo Go because `setPictureInPictureModeAsync` isn't supported there; the try/catch in `FloatingPlayer.tsx` swallows the error.
- **Background audio** — same dev-build requirement. The `Audio.setAudioModeAsync({ staysActiveInBackground: true })` call on app boot is honoured once the proper plist key is compiled in.

To run with both: `npx expo prebuild --clean && npx expo run:ios` (or `run:android`).

---

## Deliberately not shipped

- **YouTube / Vimeo downloading** — violates their ToS; never will. The Download pill is hidden for these platforms; only `direct` MP4 / HLS sources show it.
- **Sidecar subtitle / multi-audio support** — `expo-av` only handles tracks baked into HLS. Real `.vtt` / `.srt` and audio-track switching would need migrating to `react-native-video`.
- **Wi-Fi file transfer** — out of scope for now.
- **Supabase sync** — implementation is in `services/remote/`; activate by flipping four re-exports in `services/auth.ts`, `videos.ts`, `playlists.ts`, `progress.ts`.
- **Analytics / ads / crash reporting** — intentionally absent.

## Deferred from the design handoff (intentionally)

The design suggested a 5-tab layout (Browser, Library, Queue, Playlists, Profile). The product direction landed on **2 tabs + persistent FloatingPlayer** instead — the player floats on top of every tab, so a dedicated "Queue" tab would be redundant, and "Playlists" are expressed as Folders in the Library. Profile and Onboarding are not built yet because the app has no accounts.
