import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';

import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { SectionHeader } from '@/components/SectionHeader';
import { Thumb } from '@/components/Thumb';
import { useVideos, useWatchProgress } from '@/hooks/useVideos';
import { useQueue } from '@/hooks/useQueue';
import { usePlayerStore } from '@/store/playerStore';
import { theme } from '@/theme';
import type { Video } from '@/types';

interface DetectedSource {
  kind: 'video' | 'source' | 'hls' | 'meta' | 'json-ld';
  url: string;
  title: string;
}

interface InjectedPayload {
  type: 'sources';
  currentUrl: string;
  title: string;
  sources: DetectedSource[];
}

const HOME_URL = 'everest://home';

const normaliseUserInput = (raw: string): string => {
  const v = raw.trim();
  if (!v) return HOME_URL;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return `https://${v}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(v)}`;
};

const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

const DETECT_SOURCES_JS = `
(function () {
  try {
    var sources = [];
    var title = document.title || location.hostname;
    var push = function (kind, url) {
      if (!url) return;
      var trimmed = String(url).trim();
      if (!/^https?:/i.test(trimmed)) return;
      sources.push({ kind: kind, url: trimmed, title: title });
    };
    document.querySelectorAll('video').forEach(function (v) {
      push('video', v.currentSrc);
      v.querySelectorAll('source').forEach(function (s) { push('source', s.src); });
    });
    ['og:video', 'og:video:url', 'og:video:secure_url', 'twitter:player:stream'].forEach(function (prop) {
      document.querySelectorAll('meta[property="' + prop + '"], meta[name="' + prop + '"]').forEach(function (m) {
        push('meta', m.getAttribute('content'));
      });
    });
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      try {
        var data = JSON.parse(s.textContent || '{}');
        var stack = [data];
        while (stack.length) {
          var node = stack.pop();
          if (!node || typeof node !== 'object') continue;
          if (Array.isArray(node)) { node.forEach(function (n) { stack.push(n); }); continue; }
          if (node['@type'] === 'VideoObject' || (Array.isArray(node['@type']) && node['@type'].indexOf('VideoObject') !== -1)) {
            push('json-ld', node.contentUrl);
            push('json-ld', node.embedUrl);
          }
          Object.keys(node).forEach(function (k) { if (node[k] && typeof node[k] === 'object') stack.push(node[k]); });
        }
      } catch (e) {}
    });
    var html = document.documentElement.innerHTML || '';
    var m3u8 = html.match(/https?:\\/\\/[^"'\\\\<> \\t\\n]+\\.m3u8[^"'\\\\<> \\t\\n]*/g) || [];
    m3u8.forEach(function (u) { push('hls', u); });
    sources = sources.filter(function (s) {
      if (/\\.(gif|png|jpe?g|webp|svg|ico)(\\?|$)/i.test(s.url)) return false;
      return true;
    });
    var seen = {};
    sources = sources.filter(function (s) {
      var key = s.url.split('?')[0];
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'sources', currentUrl: location.href, title: title, sources: sources
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'sources', error: String(e), currentUrl: location.href, title: '', sources: [] }));
  }
  true;
})();
`;

const CLEAR_SITE_DATA_JS = `
(function () {
  try {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(function (c) {
      var eq = c.indexOf('=');
      var name = eq > -1 ? c.substr(0, eq).trim() : c.trim();
      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
  } catch (e) {}
  true;
})();
`;

// Runs on every page load (via the WebView's `injectedJavaScript` prop).
// Listens for a long-press on any <video> element and posts the source URL back
// so the user can save the specific clip they tapped (Aloha-style "long-tap to download").
const LONG_PRESS_JS = `
(function () {
  if (window.__everestLongPressInstalled) return;
  window.__everestLongPressInstalled = true;
  var THRESHOLD_MS = 550;
  var MOVE_TOLERANCE = 12;
  var t = null;
  var startX = 0, startY = 0;
  var target = null;

  function clearTimer() { if (t) { clearTimeout(t); t = null; } target = null; }

  function findVideo(node) {
    while (node && node !== document.body) {
      if (node.tagName === 'VIDEO') return node;
      node = node.parentNode;
    }
    return null;
  }

  function bestSrc(v) {
    if (v.currentSrc) return v.currentSrc;
    var s = v.querySelector('source[src]');
    return s ? s.src : '';
  }

  document.addEventListener('touchstart', function (e) {
    var v = findVideo(e.target);
    if (!v) return clearTimer();
    target = v;
    if (e.touches && e.touches[0]) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }
    t = setTimeout(function () {
      if (!target) return;
      var src = bestSrc(target);
      if (!src) return;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'longpress',
        url: src,
        pageUrl: location.href,
        title: document.title || location.hostname
      }));
    }, THRESHOLD_MS);
  }, true);

  document.addEventListener('touchmove', function (e) {
    if (!t || !e.touches || !e.touches[0]) return;
    var dx = Math.abs(e.touches[0].clientX - startX);
    var dy = Math.abs(e.touches[0].clientY - startY);
    if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) clearTimer();
  }, true);

  document.addEventListener('touchend', clearTimer, true);
  document.addEventListener('touchcancel', clearTimer, true);
})();
true;
`;

interface Bookmark {
  label: string;
  url: string;
  icon: string;
  color: string;
  bg: string;
}

const BOOKMARKS: Bookmark[] = [
  { label: 'Archive', url: 'https://archive.org/details/movies', icon: '◉', color: '#FBB03B', bg: 'rgba(251,176,59,0.13)' },
  { label: 'Vimeo', url: 'https://vimeo.com/watch', icon: '◈', color: '#1AB7EA', bg: 'rgba(26,183,234,0.13)' },
  { label: 'PeerTube', url: 'https://sepiasearch.org', icon: '◆', color: '#F1680D', bg: 'rgba(241,104,13,0.13)' },
  { label: 'Media CCC', url: 'https://media.ccc.de', icon: '★', color: '#00C1A2', bg: 'rgba(0,193,162,0.13)' },
  { label: 'Commons', url: 'https://commons.wikimedia.org/wiki/Category:Videos', icon: '⬢', color: '#3B82F6', bg: 'rgba(59,130,246,0.13)' },
  { label: 'YouTube', url: 'https://m.youtube.com', icon: '▶', color: '#FF0000', bg: 'rgba(255,0,0,0.13)' },
];

export const BrowseScreen: React.FC = () => {
  const webRef = useRef<WebView | null>(null);
  const { addVideo } = useVideos();
  const { videos } = useVideos();
  const { progress: progressList } = useWatchProgress();
  const { setQueue } = useQueue();
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [addressText, setAddressText] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSources, setPickerSources] = useState<DetectedSource[]>([]);
  const [pickerPageUrl, setPickerPageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [detectedSources, setDetectedSources] = useState<DetectedSource[]>([]);
  const [scanning, setScanning] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);
  const saveOnNextResult = useRef(false);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHome = currentUrl === HOME_URL;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isHome && canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      if (!isHome) {
        setCurrentUrl(HOME_URL);
        setAddressText('');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack, isHome]);

  const loadUrl = useCallback((raw: string) => {
    const next = normaliseUserInput(raw);
    setAddressText(next === HOME_URL ? '' : next);
    setCurrentUrl(next);
    setDetectedSources([]);
  }, []);

  const goHome = useCallback(() => {
    setCurrentUrl(HOME_URL);
    setAddressText('');
    setDetectedSources([]);
  }, []);

  const onSubmitAddress = () => loadUrl(addressText);

  const onNav = (e: WebViewNavigation) => {
    setAddressText(e.url);
    setCanGoBack(e.canGoBack);
    setCanGoForward(e.canGoForward);
  };

  const runScan = useCallback(() => {
    setScanning(true);
    webRef.current?.injectJavaScript(DETECT_SOURCES_JS);
  }, []);

  useEffect(() => {
    return () => {
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, []);

  const persistVideoUrl = useCallback(
    async (url: string) => {
      setSaving(true);
      try {
        await addVideo(url);
        Alert.alert('Saved', 'Added to your library.');
      } catch (err) {
        Alert.alert('Could not save', err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSaving(false);
      }
    },
    [addVideo],
  );

  const onMessage = (e: WebViewMessageEvent) => {
    let payload: InjectedPayload | { type: 'longpress'; url: string; pageUrl: string; title: string } | null = null;
    try {
      payload = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (!payload) return;

    if (payload.type === 'longpress') {
      const url = payload.url;
      Alert.alert('Save this video?', url, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save to library', onPress: () => persistVideoUrl(url) },
      ]);
      return;
    }

    if (payload.type !== 'sources') return;
    const pageUrl = payload.currentUrl || currentUrl;
    const sources = payload.sources ?? [];
    setDetectedSources(sources);
    setScanning(false);
    if (!saveOnNextResult.current) return;
    saveOnNextResult.current = false;
    if (sources.length === 0) {
      Alert.alert('No video detected', 'Save the page URL instead?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save page URL', onPress: () => persistVideoUrl(pageUrl) },
      ]);
      return;
    }
    if (sources.length === 1) {
      const only = sources[0];
      Alert.alert('Save this video?', only.url, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => persistVideoUrl(only.url) },
      ]);
      return;
    }
    setPickerSources(sources);
    setPickerPageUrl(pageUrl);
    setPickerOpen(true);
  };

  const onSavePress = () => {
    saveOnNextResult.current = true;
    runScan();
  };

  const onClearBrowsingData = () => {
    Alert.alert(
      'Clear browsing data?',
      'Cookies, localStorage, and sessionStorage will be wiped for the current page.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            webRef.current?.injectJavaScript(CLEAR_SITE_DATA_JS);
            webRef.current?.clearCache?.(true);
            webRef.current?.reload();
            Alert.alert('Cleared', 'The page will reload.');
          },
        },
      ],
    );
  };

  const continueWatching: { video: Video; progress: number; duration?: number }[] = useMemo(() => {
    const byId = new Map(videos.map((v) => [v.videoId, v]));
    const out: { video: Video; progress: number; duration?: number }[] = [];
    for (const p of progressList) {
      const video = byId.get(p.videoId);
      if (!video) continue;
      out.push({ video, progress: p.progress, duration: p.duration });
      if (out.length >= 8) break;
    }
    return out;
  }, [progressList, videos]);

  const recent = videos.slice(0, 6);

  const openVideoFromHome = (videoId: string) => {
    const idx = videos.findIndex((v) => v.videoId === videoId);
    setQueue(videos, idx >= 0 ? idx : 0);
    setExpanded(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {/* === Top chrome (URL bar) === */}
      <View
        style={{
          backgroundColor: theme.colors.bgElevated,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.line,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Pressable
          onPress={goHome}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>⌂</Text>
        </Pressable>

        <View
          style={{
            flex: 1,
            height: 38,
            borderRadius: 12,
            backgroundColor: theme.colors.bgCard,
            borderWidth: 1,
            borderColor: urlFocused ? theme.colors.brand : theme.colors.lineStrong,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.textFaint} style={{ marginRight: 8 }} />
          ) : (
            <Text style={{ color: theme.colors.textFaint, fontSize: 11, marginRight: 7 }}>
              {isHome ? '◯' : '🔒'}
            </Text>
          )}
          <TextInput
            value={addressText}
            onChangeText={setAddressText}
            onSubmitEditing={onSubmitAddress}
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setUrlFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            selectTextOnFocus
            returnKeyType="go"
            placeholder={isHome ? 'Search or enter address' : ''}
            placeholderTextColor={theme.colors.textFaint}
            style={{ flex: 1, color: '#fff', fontSize: 13 }}
          />
        </View>

        <Pressable
          onPress={() => (isHome ? onClearBrowsingData() : webRef.current?.reload())}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>{isHome ? '🔒' : '⟲'}</Text>
        </Pressable>
      </View>

      {/* === Video-detected banner (only when not on home and a video was found) === */}
      {!isHome && detectedSources.length > 0 ? (
        <View
          style={{
            backgroundColor: theme.colors.brandSoft,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(59,130,246,0.19)',
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: theme.colors.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ color: theme.colors.brand, fontSize: 14 }}>▶</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.brand, fontSize: 12, fontWeight: '700' }}>
              Video detected
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }} numberOfLines={1}>
              {detectedSources.length} playable source{detectedSources.length === 1 ? '' : 's'} on this page
            </Text>
          </View>
          <Pressable
            onPress={onSavePress}
            disabled={saving}
            style={{
              height: 32,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: theme.colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* === Body === */}
      {isHome ? (
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.colors.bg }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginVertical: 18 }}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>⛰</Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: '#fff',
                letterSpacing: -0.5,
              }}
            >
              Everest Flow
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.textFaint, marginTop: 3 }}>
              Your video universe
            </Text>
          </View>

          {/* Search hint (the real input is up top — this row directs attention) */}
          <Pressable
            onPress={() => undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.bgCard,
              borderWidth: 1,
              borderColor: theme.colors.lineStrong,
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 48,
              marginBottom: 28,
            }}
          >
            <Text style={{ color: theme.colors.textFaint, fontSize: 14, marginRight: 8 }}>⌕</Text>
            <Text style={{ color: theme.colors.textFaint, fontSize: 14 }}>
              Tap the address bar to search or paste a link…
            </Text>
          </Pressable>

          {/* Quick Access */}
          <View style={{ marginBottom: 28 }}>
            <SectionHeader title="Quick Access" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4, paddingRight: 8 }}
            >
              {BOOKMARKS.map((bm) => (
                <Pressable
                  key={bm.label}
                  onPress={() => loadUrl(bm.url)}
                  style={{
                    alignItems: 'center',
                    gap: 7,
                    padding: 14,
                    borderRadius: 14,
                    backgroundColor: theme.colors.bgCard,
                    borderWidth: 1,
                    borderColor: theme.colors.line,
                    minWidth: 78,
                    marginRight: 10,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: bm.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20, color: bm.color }}>{bm.icon}</Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.colors.textMuted,
                    }}
                  >
                    {bm.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Continue watching */}
          {continueWatching.length > 0 ? (
            <View style={{ marginBottom: 28 }}>
              <SectionHeader title="Continue Watching" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                {continueWatching.map((x) => {
                  const pct = x.duration && x.duration > 0 ? Math.min(1, x.progress / x.duration) : 0;
                  return (
                    <Pressable
                      key={x.video.videoId}
                      onPress={() => openVideoFromHome(x.video.videoId)}
                      style={{
                        width: 200,
                        marginRight: 10,
                        borderRadius: 14,
                        backgroundColor: theme.colors.bgCard,
                        borderWidth: 1,
                        borderColor: theme.colors.line,
                        overflow: 'hidden',
                      }}
                    >
                      <Thumb
                        video={x.video}
                        width={200}
                        height={113}
                        radius={0}
                        showProgress
                        progress={pct}
                      />
                      <View style={{ padding: 10 }}>
                        <Text
                          numberOfLines={2}
                          style={{ color: '#fff', fontSize: 12, fontWeight: '600', lineHeight: 16 }}
                        >
                          {x.video.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={{ color: theme.colors.textFaint, fontSize: 11, marginTop: 2 }}
                        >
                          {hostOf(x.video.url)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Recently saved */}
          {recent.length > 0 ? (
            <View>
              <SectionHeader title="Recently Saved" />
              {recent.map((v) => {
                const p = progressList.find((x) => x.videoId === v.videoId);
                return (
                  <Pressable
                    key={v.videoId}
                    onPress={() => openVideoFromHome(v.videoId)}
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.line,
                    }}
                  >
                    <Thumb
                      video={v}
                      width={96}
                      height={58}
                      radius={8}
                      showProgress
                      progress={p && p.duration ? p.progress / p.duration : 0}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={2}
                        style={{ color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18 }}
                      >
                        {v.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ color: theme.colors.textFaint, fontSize: 11, marginTop: 2 }}
                      >
                        {hostOf(v.url)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <KeyboardSafeView>
          <WebView
            ref={webRef}
            source={{ uri: currentUrl }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction
            incognito={false}
            injectedJavaScript={LONG_PRESS_JS}
            onNavigationStateChange={onNav}
            onLoadStart={() => {
              setLoading(true);
              setDetectedSources([]);
            }}
            onLoadEnd={() => {
              setLoading(false);
              if (scanTimer.current) clearTimeout(scanTimer.current);
              scanTimer.current = setTimeout(runScan, 600);
            }}
            onMessage={onMessage}
            style={{ backgroundColor: '#000' }}
          />
        </KeyboardSafeView>
      )}

      {/* Bottom host strip — only when browsing AND no video detected */}
      {!isHome && detectedSources.length === 0 ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: theme.colors.line,
            backgroundColor: theme.colors.bg,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            numberOfLines={1}
            style={{ flex: 1, color: theme.colors.textFaint, fontSize: 11 }}
          >
            {hostOf(currentUrl)}
          </Text>
          <Pressable
            onPress={runScan}
            disabled={scanning || loading}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: theme.colors.line,
            }}
          >
            <Text style={{ color: theme.colors.textFaint, fontSize: 11 }}>
              {scanning || loading ? 'Scanning…' : 'Rescan'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <View
            style={{
              backgroundColor: theme.colors.bgCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 36,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: theme.colors.bgCard3,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 18,
              }}
            />
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 }}>
              Pick a source
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 }}>
              {hostOf(pickerPageUrl)}
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {pickerSources.map((s, idx) => (
                <Pressable
                  key={`${s.url}-${idx}`}
                  onPress={() => {
                    setPickerOpen(false);
                    persistVideoUrl(s.url);
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.line,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.brand,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      fontWeight: '700',
                    }}
                  >
                    {s.kind}
                  </Text>
                  <Text numberOfLines={2} style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>
                    {s.url}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={{
                marginTop: 12,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: theme.colors.bgCard2,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.colors.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
