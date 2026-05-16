import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { SectionHeader } from '@/components/SectionHeader';
import { Thumb } from '@/components/Thumb';
import { useVideos, useWatchProgress } from '@/hooks/useVideos';
import { useQueue } from '@/hooks/useQueue';
import { usePlayerStore } from '@/store/playerStore';
import { theme } from '@/theme';
import { hostOf } from '@/utils/url';
import type { TabParamList, Video } from '@/types';

type Nav = BottomTabNavigationProp<TabParamList, 'Home'>;

interface Bookmark {
  label: string;
  url: string;
  icon: string;
  color: string;
  bg: string;
  note?: string;
}

// Curated discovery destinations. Each tile uses the bookmark's brand tint at 13% opacity.
const BOOKMARKS: Bookmark[] = [
  { label: 'Archive', url: 'https://archive.org/details/movies', icon: '◉', color: '#FBB03B', bg: 'rgba(251,176,59,0.13)' },
  { label: 'Vimeo', url: 'https://vimeo.com/watch', icon: '◈', color: '#1AB7EA', bg: 'rgba(26,183,234,0.13)' },
  { label: 'PeerTube', url: 'https://sepiasearch.org', icon: '◆', color: '#F1680D', bg: 'rgba(241,104,13,0.13)' },
  { label: 'Media CCC', url: 'https://media.ccc.de', icon: '★', color: '#00C1A2', bg: 'rgba(0,193,162,0.13)' },
  { label: 'Commons', url: 'https://commons.wikimedia.org/wiki/Category:Videos', icon: '⬢', color: '#3B82F6', bg: 'rgba(59,130,246,0.13)' },
  { label: 'YouTube', url: 'https://m.youtube.com', icon: '▶', color: '#FF0000', bg: 'rgba(255,0,0,0.13)', note: 'stream only' },
];

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { videos } = useVideos();
  const { progress: progressList } = useWatchProgress();
  const { setQueue } = useQueue();
  const setExpanded = usePlayerStore((s) => s.setExpanded);

  const continueWatching = useMemo<
    { video: Video; progress: number; duration?: number }[]
  >(() => {
    const byId = new Map(videos.map((v) => [v.videoId, v]));
    const out: { video: Video; progress: number; duration?: number }[] = [];
    for (const p of progressList) {
      const video = byId.get(p.videoId);
      if (!video) continue;
      if (p.duration && p.progress > 0 && p.progress / p.duration < 0.95) {
        out.push({ video, progress: p.progress, duration: p.duration });
        if (out.length >= 8) break;
      }
    }
    return out;
  }, [progressList, videos]);

  const recent = videos.slice(0, 6);

  const openSaved = (videoId: string) => {
    const idx = videos.findIndex((v) => v.videoId === videoId);
    setQueue(videos, idx >= 0 ? idx : 0);
    setExpanded(true);
  };

  // Bookmarks deep-link into the Browse tab with the chosen URL preloaded.
  const openInBrowse = (url: string) => {
    nav.navigate('Browse', { url });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: '#fff',
            letterSpacing: -0.5,
            marginBottom: 6,
          }}
        >
          Browse the web
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: theme.colors.textMuted,
            marginBottom: 24,
          }}
        >
          Save any direct video to your library.
        </Text>

        {/* Bookmark grid 3×2 */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 28,
          }}
        >
          {BOOKMARKS.map((bm) => (
            <Pressable
              key={bm.label}
              onPress={() => openInBrowse(bm.url)}
              style={{
                width: '31.5%',
                aspectRatio: 1,
                borderRadius: 16,
                padding: 14,
                backgroundColor: theme.colors.bgCard,
                borderWidth: 1,
                borderColor: theme.colors.line,
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  backgroundColor: bm.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 20, color: bm.color }}>{bm.icon}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{bm.label}</Text>
                {bm.note ? (
                  <Text style={{ fontSize: 10, color: theme.colors.textFaint, marginTop: 1 }}>
                    {bm.note}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Continue watching */}
        {continueWatching.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <SectionHeader title="Continue watching" caps />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4, paddingRight: 8 }}
            >
              {continueWatching.map((x) => {
                const pct =
                  x.duration && x.duration > 0 ? Math.min(1, x.progress / x.duration) : 0;
                return (
                  <Pressable
                    key={x.video.videoId}
                    onPress={() => openSaved(x.video.videoId)}
                    style={{ width: 160, marginRight: 10 }}
                  >
                    <Thumb
                      video={x.video}
                      width={160}
                      height={90}
                      radius={10}
                      showProgress
                      progress={pct}
                    />
                    <Text
                      numberOfLines={2}
                      style={{
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: '600',
                        lineHeight: 15,
                        marginTop: 6,
                      }}
                    >
                      {x.video.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Recently saved */}
        {recent.length > 0 ? (
          <View>
            <SectionHeader title="Recently saved" caps />
            {recent.map((v, i) => {
              const p = progressList.find((x) => x.videoId === v.videoId);
              const pct = p?.duration ? p.progress / p.duration : 0;
              return (
                <Pressable
                  key={v.videoId}
                  onPress={() => openSaved(v.videoId)}
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    paddingVertical: 10,
                    borderBottomWidth: i < recent.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.line,
                  }}
                >
                  <Thumb
                    video={v}
                    width={96}
                    height={58}
                    radius={8}
                    showProgress
                    progress={pct}
                  />
                  <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: '600',
                        lineHeight: 18,
                      }}
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
    </SafeAreaView>
  );
};
