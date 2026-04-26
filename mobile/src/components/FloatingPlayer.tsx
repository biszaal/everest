import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ResizeMode, Video as AVVideo, type AVPlaybackStatus } from 'expo-av';
import * as Brightness from 'expo-brightness';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useQueue } from '@/hooks/useQueue';
import { useDownloads } from '@/hooks/useDownloads';
import { usePlayerStore } from '@/store/playerStore';
import { progressService } from '@/services/progress';
import { formatDuration } from '@/utils/format';
import { theme } from '@/theme';
import type { MainStackParamList, Video } from '@/types';

const PIP_WIDTH = 220;
const PIP_HEIGHT = 124; // 16:9
const PIP_MARGIN = 12;
const TAB_BAR_HEIGHT = 64;
const SEEK_STEP_MS = 10_000;
const AUTO_HIDE_MS = 3500;
const PROGRESS_PERSIST_MS = 5000;
const BRIGHTNESS_THROTTLE_MS = 60;
const ANIM_DURATION = 240;

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const FloatingPlayer: React.FC = () => {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();

  const {
    current,
    nextVideo,
    currentIndex,
    upcoming,
    autoPlay,
    autostart,
    skipNext,
    skipPrevious,
    removeAt,
    jumpTo,
    setAutoPlay,
    setAutostart,
    clear,
  } = useQueue();

  const expanded = usePlayerStore((s) => s.expanded);
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setPlayingState = usePlayerStore((s) => s.setPlaying);
  const setBuffering = usePlayerStore((s) => s.setBuffering);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
  const resetPlayer = usePlayerStore((s) => s.reset);

  const { statusFor: downloadStatusFor, isDownloadable, startDownload, cancelDownload, deleteDownload } =
    useDownloads();

  const videoRef = useRef<AVVideo>(null);
  const lastPersistRef = useRef(0);
  const lastBrightnessApplied = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indicatorHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [brightnessLevel, setBrightnessLevel] = useState(0.5);
  const [indicator, setIndicator] = useState<{ kind: 'brightness' | 'volume'; value: number } | null>(null);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [pipActive, setPipActive] = useState(false);

  // ---- Animation shared values ----
  const expandedProgress = useSharedValue(0); // 0 = pip, 1 = expanded
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    expandedProgress.value = withTiming(expanded ? 1 : 0, { duration: ANIM_DURATION });
  }, [expanded, expandedProgress]);

  useEffect(() => {
    Brightness.getBrightnessAsync()
      .then((v) => setBrightnessLevel(v))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    resetPlayer();
    lastPersistRef.current = 0;
  }, [current?.videoId, resetPlayer]);

  // ---- Auto-hide controls ----
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), AUTO_HIDE_MS);
  }, []);

  const surfaceControls = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (expanded) surfaceControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (indicatorHideTimer.current) clearTimeout(indicatorHideTimer.current);
    };
  }, [expanded, surfaceControls]);

  // ---- Indicator (brightness/volume swipe) ----
  const showIndicator = useCallback((kind: 'brightness' | 'volume', value: number) => {
    setIndicator({ kind, value });
    if (indicatorHideTimer.current) clearTimeout(indicatorHideTimer.current);
    indicatorHideTimer.current = setTimeout(() => setIndicator(null), 600);
  }, []);

  const applyBrightness = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setBrightnessLevel(clamped);
      showIndicator('brightness', clamped);
      const now = Date.now();
      if (now - lastBrightnessApplied.current > BRIGHTNESS_THROTTLE_MS) {
        lastBrightnessApplied.current = now;
        Brightness.setBrightnessAsync(clamped).catch(() => undefined);
      }
    },
    [showIndicator],
  );

  const applyVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolume(clamped);
      showIndicator('volume', clamped);
    },
    [showIndicator],
  );

  // ---- Playback ----
  const persist = useCallback(
    (pos: number, dur: number) => {
      if (!current) return;
      const now = Date.now();
      if (now - lastPersistRef.current < PROGRESS_PERSIST_MS) return;
      lastPersistRef.current = now;
      progressService.upsert(current.videoId, pos, dur).catch(() => undefined);
    },
    [current],
  );

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      setBuffering(status.isBuffering ?? false);
      setPlayingState(status.isPlaying);
      const pos = (status.positionMillis ?? 0) / 1000;
      const dur = (status.durationMillis ?? 0) / 1000;
      setProgress(pos, dur);
      if (pos > 0) persist(pos, dur);
      if (status.didJustFinish && !status.isLooping) {
        if (autoPlay) skipNext();
        else setPlayingState(false);
      }
    },
    [autoPlay, persist, setBuffering, setPlayingState, setProgress, skipNext],
  );

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
      setAutostart(false);
    } else {
      await videoRef.current.playAsync();
      setAutostart(true);
    }
    surfaceControls();
  }, [isPlaying, setAutostart, surfaceControls]);

  const seekRelative = useCallback(
    async (deltaMs: number) => {
      if (!videoRef.current) return;
      const nextMs = Math.max(0, position * 1000 + deltaMs);
      await videoRef.current.setPositionAsync(nextMs);
      surfaceControls();
    },
    [position, surfaceControls],
  );

  const closePlayer = useCallback(() => {
    setExpanded(false);
    setAutostart(false);
    clear();
  }, [clear, setAutostart, setExpanded]);

  const openMoveSheet = useCallback(() => {
    if (!current) return;
    setExpanded(false);
    nav.navigate('MoveVideo', { videoId: current.videoId });
  }, [current, nav, setExpanded]);

  // ---- Container animated style (PIP <-> Expanded) ----
  const defaultLeft = W - PIP_WIDTH - PIP_MARGIN;
  const defaultTop = H - PIP_HEIGHT - PIP_MARGIN - TAB_BAR_HEIGHT - (insets.bottom ?? 0);

  const containerStyle = useAnimatedStyle(() => {
    const p = expandedProgress.value;
    const width = PIP_WIDTH + (W - PIP_WIDTH) * p;
    const height = PIP_HEIGHT + (H - PIP_HEIGHT) * p;
    const left = (defaultLeft + dragX.value) * (1 - p);
    const top = (defaultTop + dragY.value) * (1 - p);
    return {
      position: 'absolute',
      left,
      top,
      width,
      height,
    };
  });

  // ---- Gestures ----
  const dragPan = Gesture.Pan()
    .enabled(!expanded)
    .onBegin(() => {
      startX.value = dragX.value;
      startY.value = dragY.value;
    })
    .onUpdate((e) => {
      const maxX = W - PIP_WIDTH - PIP_MARGIN - defaultLeft;
      const minX = -defaultLeft + PIP_MARGIN;
      const maxY = H - PIP_HEIGHT - PIP_MARGIN - TAB_BAR_HEIGHT - (insets.bottom ?? 0) - defaultTop;
      const minY = -defaultTop + PIP_MARGIN + (insets.top ?? 0);
      dragX.value = Math.max(minX, Math.min(maxX, startX.value + e.translationX));
      dragY.value = Math.max(minY, Math.min(maxY, startY.value + e.translationY));
    });

  const expandTap = Gesture.Tap()
    .enabled(!expanded)
    .maxDuration(250)
    .onEnd(() => runOnJS(setExpanded)(true));

  const pipGesture = Gesture.Race(expandTap, dragPan);

  const brightnessStart = useSharedValue(0);
  const volumeStart = useSharedValue(0);
  const isLeftZone = useSharedValue(false);

  const expandedPan = Gesture.Pan()
    .enabled(expanded && !!current?.streamUrl)
    .activeOffsetY([-10, 10])
    .failOffsetX([-15, 15])
    .onBegin((e) => {
      isLeftZone.value = e.x < W / 2;
      brightnessStart.value = brightnessLevel;
      volumeStart.value = volume;
    })
    .onUpdate((e) => {
      const span = Math.max(120, H * 0.5);
      const dy = -e.translationY / span;
      if (isLeftZone.value) {
        runOnJS(applyBrightness)(brightnessStart.value + dy);
      } else {
        runOnJS(applyVolume)(volumeStart.value + dy);
      }
    })
    .onEnd(() => runOnJS(surfaceControls)());

  const expandedTap = Gesture.Tap()
    .enabled(expanded)
    .maxDuration(250)
    .onEnd(() => runOnJS(surfaceControls)());

  const expandedGesture = Gesture.Race(expandedPan, expandedTap);

  if (!current) return null;

  // Prefer the downloaded local copy if available — works offline + skips network fetch.
  const downloadStatus = downloadStatusFor(current.videoId);
  const localPath =
    downloadStatus.status === 'done' ? downloadStatus.record?.localPath ?? null : null;
  const directSourceUri = localPath ?? current.streamUrl ?? null;

  const hasDirect = Boolean(directSourceUri);
  const hasEmbed = !hasDirect && Boolean(current.embedUrl);
  const downloadable = isDownloadable(current);

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="box-none">
      <GestureDetector gesture={expanded ? expandedGesture : pipGesture}>
        <View style={{ flex: 1 }} collapsable={false}>
          {/* === Persistent media element. Stays mounted across mode swaps. === */}
          <View style={StyleSheet.absoluteFillObject}>
            {hasDirect ? (
              <AVVideo
                ref={videoRef}
                source={{ uri: directSourceUri! }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={false}
                shouldPlay={autostart}
                volume={volume}
                rate={playbackRate}
                shouldCorrectPitch
                onPlaybackStatusUpdate={onPlaybackStatus}
              />
            ) : hasEmbed ? (
              <WebView
                source={{ uri: current.embedUrl! }}
                originWhitelist={['https://*', 'http://*']}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction
                javaScriptEnabled
                domStorageEnabled
                thirdPartyCookiesEnabled
                sharedCookiesEnabled
                style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}
              />
            ) : current.thumbnail ? (
              <Image
                source={{ uri: current.thumbnail }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]} />
            )}
          </View>

          {/* Buffer indicator */}
          {hasDirect && isBuffering ? (
            <View
              style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}
              pointerEvents="none"
            >
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : null}

          {/* Brightness / volume indicator (expanded mode only) */}
          {expanded && indicator ? (
            <View pointerEvents="none" style={styles.indicator}>
              <Text style={styles.indicatorText}>
                {indicator.kind === 'brightness' ? '☀ ' : '🔊 '}
                {Math.round(indicator.value * 100)}%
              </Text>
              <View style={styles.indicatorBar}>
                <View style={[styles.indicatorFill, { width: `${indicator.value * 100}%` }]} />
              </View>
            </View>
          ) : null}

          {/* === PIP chrome (collapsed mode) — shadowed card with subtle overlay === */}
          {!expanded ? (
            <View style={styles.pipChrome} pointerEvents="box-none">
              {/* top gradient for close button visibility */}
              <View style={styles.pipTop} pointerEvents="box-none">
                <Pressable
                  onPress={closePlayer}
                  hitSlop={8}
                  style={styles.pipCloseBtn}
                >
                  <Text style={styles.pipCloseText}>✕</Text>
                </Pressable>
              </View>
              {/* bottom info strip with title + progress + play */}
              <View style={styles.pipBottom} pointerEvents="box-none">
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={styles.pipTitle}>
                    {current.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.pipSub}>
                    {current.platform}
                  </Text>
                </View>
                <Pressable
                  onPress={togglePlay}
                  hitSlop={6}
                  style={styles.pipPlay}
                >
                  <Text style={styles.pipPlayText}>{isPlaying ? '⏸' : '▶'}</Text>
                </Pressable>
              </View>
              {/* thin progress bar at very bottom */}
              {duration > 0 ? (
                <View style={styles.pipProgress}>
                  <View
                    style={[
                      styles.pipProgressFill,
                      { width: `${Math.min(1, position / duration) * 100}%` },
                    ]}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {/* === Expanded chrome === */}
          {expanded ? (
            <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
              {showControls ? (
                <>
                  {/* Top bar */}
                  <View
                    style={[styles.expTop, { paddingTop: (insets.top ?? 0) + 8 }]}
                    pointerEvents="box-none"
                  >
                    <Pressable onPress={() => setExpanded(false)} style={styles.expCircle}>
                      <Text style={styles.expCircleText}>⌄</Text>
                    </Pressable>
                    <Text numberOfLines={1} style={styles.expTitle}>
                      {current.title}
                    </Text>
                    <Pressable onPress={closePlayer} style={styles.expCircle}>
                      <Text style={styles.expCircleText}>✕</Text>
                    </Pressable>
                  </View>

                  {/* Center controls (direct only — embeds use the iframe's UI) */}
                  {hasDirect ? (
                    <View style={styles.expCenter} pointerEvents="box-none">
                      <Pressable
                        onPress={() => {
                          skipPrevious();
                          surfaceControls();
                        }}
                        disabled={currentIndex <= 0}
                        style={[styles.expBtn, { opacity: currentIndex <= 0 ? 0.3 : 1 }]}
                      >
                        <Text style={styles.expBtnText}>⏮</Text>
                      </Pressable>
                      <Pressable onPress={() => seekRelative(-SEEK_STEP_MS)} style={styles.expBtn}>
                        <Text style={styles.expBtnText}>−10</Text>
                      </Pressable>
                      <Pressable onPress={togglePlay} style={styles.expPlay}>
                        <Text style={{ color: '#000', fontSize: 28 }}>{isPlaying ? '⏸' : '▶'}</Text>
                      </Pressable>
                      <Pressable onPress={() => seekRelative(SEEK_STEP_MS)} style={styles.expBtn}>
                        <Text style={styles.expBtnText}>+10</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          skipNext();
                          surfaceControls();
                        }}
                        disabled={!nextVideo}
                        style={[styles.expBtn, { opacity: !nextVideo ? 0.3 : 1 }]}
                      >
                        <Text style={styles.expBtnText}>⏭</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </>
              ) : null}

              {/* Bottom sheet — always visible in expanded mode */}
              <View
                style={[styles.expBottom, { paddingBottom: (insets.bottom ?? 0) + 8 }]}
                pointerEvents="box-none"
              >
                {hasDirect && duration > 0 ? (
                  <View style={{ marginBottom: 10 }}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(1, position / duration) * 100}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.progressTimes}>
                      <Text style={styles.progressTimesText}>{formatDuration(position)}</Text>
                      <Text style={styles.progressTimesText}>
                        -{formatDuration(Math.max(0, duration - position))}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {hasEmbed ? (
                  <View style={styles.embedBar}>
                    <Pressable
                      onPress={skipPrevious}
                      disabled={currentIndex <= 0}
                      style={[styles.embedBtn, { opacity: currentIndex <= 0 ? 0.3 : 1 }]}
                    >
                      <Text style={{ color: '#fff' }}>⏮</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Linking.openURL(current.url).catch(() => undefined)}
                      style={styles.embedBtn}
                    >
                      <Text style={{ color: theme.colors.brand, fontWeight: '600', fontSize: 12 }}>
                        Open in {current.platform} ↗
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => skipNext()}
                      disabled={!nextVideo}
                      style={[styles.embedBtn, { opacity: !nextVideo ? 0.3 : 1 }]}
                    >
                      <Text style={{ color: '#fff' }}>⏭</Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* Speed picker — only relevant for direct/local playback (rate is ignored on embeds) */}
                {hasDirect && speedMenuOpen ? (
                  <View style={styles.speedMenu}>
                    {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                      <Pressable
                        key={r}
                        onPress={() => {
                          setPlaybackRate(r);
                          setSpeedMenuOpen(false);
                        }}
                        style={[
                          styles.speedItem,
                          playbackRate === r && {
                            backgroundColor: theme.colors.brandSoft,
                            borderColor: theme.colors.brand,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: playbackRate === r ? theme.colors.brand : '#fff',
                            fontSize: 12,
                            fontWeight: '700',
                          }}
                        >
                          {r}×
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* Action pills row */}
                <View style={styles.actionPills}>
                  {hasDirect ? (
                    <Pressable
                      onPress={() => setSpeedMenuOpen((v) => !v)}
                      style={styles.actionPill}
                    >
                      <Text style={styles.actionPillText}>{playbackRate}× Speed</Text>
                    </Pressable>
                  ) : null}

                  {downloadable ? (
                    downloadStatus.status === 'done' ? (
                      <Pressable
                        onLongPress={() => deleteDownload(current.videoId)}
                        style={[styles.actionPill, { backgroundColor: theme.colors.brandSoft, borderColor: theme.colors.brand }]}
                      >
                        <Text style={{ color: theme.colors.brand, fontSize: 12, fontWeight: '700' }}>
                          ✓ Saved offline
                        </Text>
                      </Pressable>
                    ) : downloadStatus.status === 'downloading' ? (
                      <Pressable
                        onPress={() => cancelDownload(current.videoId)}
                        style={[styles.actionPill, { backgroundColor: theme.colors.amber + '22', borderColor: theme.colors.amber }]}
                      >
                        <Text style={{ color: theme.colors.amber, fontSize: 12, fontWeight: '700' }}>
                          {Math.round((downloadStatus.progress ?? 0) * 100)}% · cancel
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => startDownload(current).catch(() => undefined)}
                        style={styles.actionPill}
                      >
                        <Text style={styles.actionPillText}>↓ Download</Text>
                      </Pressable>
                    )
                  ) : null}

                  {hasDirect ? (
                    <Pressable
                      onPress={async () => {
                        try {
                          if (pipActive) {
                            // @ts-expect-error setPictureInPictureModeAsync added in expo-av 14; types may lag
                            await videoRef.current?.setPictureInPictureModeAsync?.(false);
                            setPipActive(false);
                          } else {
                            // @ts-expect-error see above
                            await videoRef.current?.setPictureInPictureModeAsync?.(true);
                            setPipActive(true);
                          }
                        } catch {
                          // Ignored: PIP unavailable in current build (e.g. Expo Go without dev client)
                        }
                      }}
                      style={[
                        styles.actionPill,
                        pipActive && {
                          backgroundColor: theme.colors.brandSoft,
                          borderColor: theme.colors.brand,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionPillText,
                          pipActive && { color: theme.colors.brand },
                        ]}
                      >
                        ⛶ PIP
                      </Text>
                    </Pressable>
                  ) : null}

                  <Pressable onPress={openMoveSheet} style={styles.moveBtn}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>📁 Move</Text>
                  </Pressable>
                </View>

                {/* Autoplay-next toggle */}
                <View style={styles.autoplayRow}>
                  <Switch value={autoPlay} onValueChange={setAutoPlay} />
                  <Text style={{ color: '#ccc', fontSize: 12, marginLeft: 8 }}>Autoplay next</Text>
                </View>

                {upcoming.length > 0 ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: '#999', fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                      UP NEXT · {upcoming.length}
                    </Text>
                    <ScrollView style={{ maxHeight: 180 }}>
                      {upcoming.map((v: Video, i) => {
                        const absoluteIdx = currentIndex + 1 + i;
                        return (
                          <View key={v.videoId} style={styles.upNextRow}>
                            <Pressable
                              onPress={() => jumpTo(absoluteIdx)}
                              style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                            >
                              <View style={styles.upNextThumb}>
                                {v.thumbnail ? (
                                  <Image
                                    source={{ uri: v.thumbnail }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                  />
                                ) : null}
                              </View>
                              <Text numberOfLines={2} style={styles.upNextTitle}>
                                {v.title}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => removeAt(absoluteIdx)}
                              style={styles.upNextRemove}
                            >
                              <Text style={{ color: '#888', fontSize: 16 }}>✕</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: theme.colors.lineStrong,
  },
  pipChrome: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  pipTop: { flexDirection: 'row', justifyContent: 'flex-end', padding: 6 },
  pipCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipCloseText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pipBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  pipTitle: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pipSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  pipPlay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.brandSoft,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pipPlayText: { color: theme.colors.brand, fontSize: 12, fontWeight: '700' },
  pipProgress: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pipProgressFill: { height: 3, backgroundColor: theme.colors.brand },

  expTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  expTitle: { color: '#fff', fontSize: 13, flex: 1, marginHorizontal: 12 },
  expCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expCircleText: { color: '#fff', fontSize: 16 },

  expCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  expBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginHorizontal: 6,
  },
  expBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  expPlay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },

  expBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: theme.colors.brand, borderRadius: 2 },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressTimesText: { color: '#ccc', fontSize: 11 },
  embedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  embedBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  expActionsRow: { flexDirection: 'row', alignItems: 'center' },
  actionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  speedMenu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 8,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  speedItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  autoplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  moveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.brand,
  },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 6,
    marginBottom: 6,
  },
  upNextThumb: {
    width: 56,
    height: 32,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  upNextTitle: { color: '#fff', fontSize: 12, marginLeft: 8, flex: 1 },
  upNextRemove: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  indicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 140,
    marginLeft: -70,
    marginTop: -32,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  indicatorText: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  indicatorBar: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  indicatorFill: { height: 4, backgroundColor: '#fff', borderRadius: 2 },
});
