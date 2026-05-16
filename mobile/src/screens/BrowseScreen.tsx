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

import { useRoute, type RouteProp } from '@react-navigation/native';

import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { Thumb } from '@/components/Thumb';
import { useVideos } from '@/hooks/useVideos';
import { theme } from '@/theme';
import { hostOf, isLikelyUrl } from '@/utils/url';
import type { TabParamList, Video } from '@/types';

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

// Default landing for the Browse tab — a privacy-friendly search engine that
// gives the user something useful to act on without needing to type a URL first.
const DEFAULT_URL = 'https://duckduckgo.com';

const normaliseUserInput = (raw: string): string => {
  const v = raw.trim();
  if (!v) return DEFAULT_URL;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) return `https://${v}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(v)}`;
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

// ════════════════════════════════════════════════════════════════════════════════
// AutosuggestSheet — rendered when the URL bar is focused. Pure on-device:
// suggestions come from the user's saved videos and the curated BOOKMARKS list.
// Nothing leaves the device — no Google/Bing/DDG autocomplete network call.
// ════════════════════════════════════════════════════════════════════════════════
interface AutosuggestProps {
  urlText: string;
  videos: Video[];
  onSelectUrl: (url: string) => void;
  onSelectBookmark: (bm: Bookmark) => void;
}

const AutosuggestSheet: React.FC<AutosuggestProps> = ({
  urlText,
  videos,
  onSelectUrl,
  onSelectBookmark,
}) => {
  const q = urlText.trim().toLowerCase();
  const looksLikeUrl = q.length > 0 && (q.startsWith('http') || /^[\w-]+(\.[\w-]+)+/.test(q));

  const matchedVideos = q
    ? videos
        .filter(
          (v) =>
            v.title.toLowerCase().includes(q) || hostOf(v.url).toLowerCase().includes(q),
        )
        .slice(0, 4)
    : [];

  const matchedBookmarks = q
    ? BOOKMARKS.filter(
        (bm) =>
          bm.label.toLowerCase().includes(q) || bm.url.toLowerCase().includes(q),
      )
    : BOOKMARKS;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      keyboardShouldPersistTaps="always"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Go to typed URL */}
      {looksLikeUrl ? (
        <Pressable
          onPress={() => onSelectUrl(urlText.trim())}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.line,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: theme.colors.brandSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.colors.brand, fontSize: 14, fontWeight: '700' }}>↗</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>
              Go to {urlText.trim()}
            </Text>
            <Text style={{ fontSize: 11, color: theme.colors.textFaint, marginTop: 1 }}>
              Open this address
            </Text>
          </View>
        </Pressable>
      ) : null}

      {/* From your library */}
      {matchedVideos.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Text style={{ fontSize: 11, color: theme.colors.textFaint }}>🛡</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: theme.colors.textFaint,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              From your library
            </Text>
          </View>
          {matchedVideos.map((v) => (
            <Pressable
              key={v.videoId}
              onPress={() => onSelectUrl(v.url)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.line,
              }}
            >
              <Thumb video={v} width={44} height={26} radius={4} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}
                >
                  {v.title}
                </Text>
                <Text style={{ fontSize: 11, color: theme.colors.textFaint, marginTop: 1 }}>
                  {hostOf(v.url)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Shortcuts */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: theme.colors.textFaint,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Shortcuts
        </Text>
        {matchedBookmarks.map((bm) => (
          <Pressable
            key={bm.label}
            onPress={() => onSelectBookmark(bm)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.line,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                backgroundColor: bm.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 16, color: bm.color }}>{bm.icon}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{bm.label}</Text>
              <Text style={{ fontSize: 11, color: theme.colors.textFaint, marginTop: 1 }}>
                {hostOf(bm.url)}
              </Text>
            </View>
          </Pressable>
        ))}

        {/* Privacy note */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 14,
            padding: 10,
            backgroundColor: theme.colors.bgCard2,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: theme.colors.accent, fontSize: 12 }}>🛡</Text>
          <Text style={{ flex: 1, fontSize: 11, color: theme.colors.textMuted, lineHeight: 15 }}>
            Suggestions come only from your device. Nothing is sent over the network.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export const BrowseScreen: React.FC = () => {
  const webRef = useRef<WebView | null>(null);
  const route = useRoute<RouteProp<TabParamList, 'Browse'>>();
  const { addVideo, videos } = useVideos();

  // Initial URL: from Home tab's nav param if present, otherwise the default landing.
  const incomingUrl = route.params?.url;

  const [currentUrl, setCurrentUrl] = useState(incomingUrl || DEFAULT_URL);
  const [addressText, setAddressText] = useState(incomingUrl || DEFAULT_URL);
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

  // React to the Home tab navigating to Browse with a fresh URL param.
  useEffect(() => {
    if (incomingUrl && incomingUrl !== currentUrl) {
      setCurrentUrl(incomingUrl);
      setAddressText(incomingUrl);
      setDetectedSources([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingUrl]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const loadUrl = useCallback((raw: string) => {
    const next = normaliseUserInput(raw);
    setAddressText(next);
    setCurrentUrl(next);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {/* === Top chrome (URL bar): back + forward chevrons, URL pill, refresh === */}
      <View
        style={{
          backgroundColor: theme.colors.bgElevated,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.line,
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          gap: 4,
        }}
      >
        <Pressable
          onPress={() => webRef.current?.goBack()}
          disabled={!canGoBack}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canGoBack ? 1 : 0.3,
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: 22, lineHeight: 22 }}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => webRef.current?.goForward()}
          disabled={!canGoForward}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: canGoForward ? 1 : 0.3,
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: 22, lineHeight: 22 }}>›</Text>
        </Pressable>

        <View
          style={{
            flex: 1,
            height: 38,
            borderRadius: 100,
            backgroundColor: theme.colors.bgCard2,
            borderWidth: 1,
            borderColor: urlFocused ? theme.colors.brand : theme.colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            gap: 6,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.textFaint} />
          ) : !urlFocused ? (
            <Text style={{ color: theme.colors.textFaint, fontSize: 11 }}>🔒</Text>
          ) : null}
          <TextInput
            value={addressText}
            onChangeText={setAddressText}
            onSubmitEditing={onSubmitAddress}
            onFocus={() => setUrlFocused(true)}
            onBlur={() => setTimeout(() => setUrlFocused(false), 120)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            selectTextOnFocus
            returnKeyType="go"
            placeholder="Search or type URL"
            placeholderTextColor={theme.colors.textFaint}
            style={{
              flex: 1,
              color: urlFocused ? '#fff' : theme.colors.textMuted,
              fontSize: 14,
              padding: 0,
            }}
          />
          {urlFocused && addressText.length > 0 ? (
            <Pressable onPress={() => setAddressText('')} hitSlop={6}>
              <Text style={{ color: theme.colors.textFaint, fontSize: 14 }}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => webRef.current?.reload()}
          onLongPress={onClearBrowsingData}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>⟲</Text>
        </Pressable>
      </View>

      {/* === Video-detected banner — slim, brand-soft strip under the URL row === */}
      {!urlFocused && detectedSources.length > 0 ? (
        <View
          style={{
            backgroundColor: theme.colors.brandSoft,
            borderTopWidth: 1,
            borderTopColor: theme.colors.brand,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.brand,
            height: 44,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Text style={{ color: theme.colors.brand, fontSize: 14 }}>✦</Text>
          <Text
            numberOfLines={1}
            style={{ color: theme.colors.brand, fontSize: 13, fontWeight: '600', flex: 1 }}
          >
            {detectedSources.length} video{detectedSources.length === 1 ? '' : 's'} detected on this page
          </Text>
        </View>
      ) : null}

      {/* === Body === */}
      {urlFocused ? (
        <AutosuggestSheet
          urlText={addressText}
          videos={videos}
          onSelectUrl={(u) => loadUrl(u)}
          onSelectBookmark={(bm) => loadUrl(bm.url)}
        />
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

      {/* Floating Save button — wide pill at the bottom whenever a video is detected. */}
      {!urlFocused && detectedSources.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 50,
          }}
        >
          <Pressable
            onPress={onSavePress}
            disabled={saving}
            style={{
              height: 48,
              borderRadius: 100,
              backgroundColor: theme.colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              shadowColor: '#000',
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>+</Text>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              {saving ? 'Saving…' : 'Save video'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Bottom host strip — only when browsing AND no video detected */}
      {detectedSources.length === 0 ? (
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
