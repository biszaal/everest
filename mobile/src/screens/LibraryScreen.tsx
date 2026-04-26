import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '@/components/EmptyState';
import { LoadingView } from '@/components/LoadingView';
import { Pill } from '@/components/Pill';
import { SectionHeader } from '@/components/SectionHeader';
import { VideoCard } from '@/components/VideoCard';
import { useFolders } from '@/hooks/useFolders';
import { useVideos } from '@/hooks/useVideos';
import { useQueue } from '@/hooks/useQueue';
import { useDownloads } from '@/hooks/useDownloads';
import { usePlayerStore } from '@/store/playerStore';
import { hueFor } from '@/components/Thumb';
import { theme } from '@/theme';
import type { Folder, MainStackParamList, Video, VideoPlatform } from '@/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Filter = 'All' | 'YouTube' | 'Vimeo' | 'Direct' | 'Downloaded' | 'Started';

const matches = (
  video: Video,
  f: Filter,
  isDownloaded: (id: string) => boolean,
): boolean => {
  if (f === 'All') return true;
  if (f === 'YouTube') return video.platform === 'youtube';
  if (f === 'Vimeo') return video.platform === 'vimeo';
  if (f === 'Direct') return video.platform === 'direct';
  if (f === 'Downloaded') return isDownloaded(video.videoId);
  return false;
};

const folderGradient = (id: string): [string, string] => {
  const h = hueFor(id);
  return [`hsl(${h}, 50%, 30%)`, `hsl(${(h + 40) % 360}, 45%, 18%)`];
};

export const LibraryScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const {
    folders,
    counts,
    loading: foldersLoading,
    refresh: refreshFolders,
    rename,
    remove,
  } = useFolders();
  const {
    videos,
    loading: videosLoading,
    refresh: refreshVideos,
    removeVideo,
  } = useVideos(); // all videos (both in folders and loose)
  const { setQueue } = useQueue();
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const { records: downloadRecords } = useDownloads();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('All');

  const isDownloaded = useMemo(() => {
    const ids = new Set(Object.keys(downloadRecords));
    return (id: string) => ids.has(id);
  }, [downloadRecords]);

  const filtered = useMemo(
    () => videos.filter((v) => matches(v, filter, isDownloaded)),
    [videos, filter, isDownloaded],
  );

  const loading = (foldersLoading || videosLoading) && folders.length === 0 && videos.length === 0;
  if (loading) return <LoadingView />;

  const openVideo = (videoId: string) => {
    const idx = filtered.findIndex((v) => v.videoId === videoId);
    setQueue(filtered, idx >= 0 ? idx : 0);
    setExpanded(true);
  };

  const onFolderLongPress = (folder: Folder) => {
    Alert.alert(
      folder.name,
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: () =>
            Alert.prompt(
              'Rename folder',
              '',
              (next) => {
                if (next && next.trim() && next !== folder.name) rename(folder.playlistId, next.trim());
              },
              'plain-text',
              folder.name,
            ),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            Alert.alert(`Delete "${folder.name}"?`, 'Choose how to handle the videos inside.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Keep videos (move to root)', onPress: () => remove(folder.playlistId, true) },
              { text: 'Delete videos too', style: 'destructive', onPress: () => remove(folder.playlistId, false) },
            ]),
        },
      ],
      { cancelable: true },
    );
  };

  const onVideoLongPress = (video: Video) => {
    setBusyId(video.videoId);
    Alert.alert(
      video.title,
      undefined,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setBusyId(null) },
        {
          text: 'Move to folder…',
          onPress: () => {
            setBusyId(null);
            nav.navigate('MoveVideo', { videoId: video.videoId });
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeVideo(video.videoId);
            setBusyId(null);
          },
        },
      ],
      { cancelable: true, onDismiss: () => setBusyId(null) },
    );
  };

  const FILTERS: Filter[] = ['All', 'YouTube', 'Vimeo', 'Direct', 'Downloaded', 'Started'];
  const platformCount = (p: VideoPlatform) => videos.filter((v) => v.platform === p).length;
  const downloadedCount = Object.keys(downloadRecords).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(v) => v.videoId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
        ListHeaderComponent={
          <View>
            {/* Page header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingTop: 18,
                marginBottom: 16,
              }}
            >
              <View>
                <Text
                  style={{ color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}
                >
                  Library
                </Text>
                <Text style={{ color: theme.colors.textFaint, fontSize: 13, marginTop: 2 }}>
                  {videos.length} saved · {folders.length} folder{folders.length === 1 ? '' : 's'}
                </Text>
              </View>
              <Pressable
                onPress={() => nav.navigate('CreateFolder')}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: theme.colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 18, lineHeight: 20 }}>+</Text>
              </Pressable>
            </View>

            {/* Folders rail */}
            {folders.length > 0 ? (
              <View style={{ marginBottom: 20 }}>
                <SectionHeader title="Folders" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 4, paddingRight: 8 }}
                >
                  {folders.map((f) => {
                    const [c1, c2] = folderGradient(f.playlistId);
                    const count = counts[f.playlistId] ?? 0;
                    return (
                      <Pressable
                        key={f.playlistId}
                        onPress={() => nav.navigate('Folder', { folderId: f.playlistId })}
                        onLongPress={() => onFolderLongPress(f)}
                        style={{ width: 140, marginRight: 10 }}
                      >
                        <LinearGradient
                          colors={[c1, c2]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: 140,
                            height: 140,
                            borderRadius: 16,
                            padding: 14,
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 20 }}>📁</Text>
                          <View>
                            <Text
                              numberOfLines={2}
                              style={{
                                color: '#fff',
                                fontSize: 15,
                                fontWeight: '700',
                                lineHeight: 19,
                              }}
                            >
                              {f.name}
                            </Text>
                            <Text
                              style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {count} video{count === 1 ? '' : 's'}
                            </Text>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => nav.navigate('CreateFolder')}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: theme.colors.lineStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: theme.colors.textMuted, fontSize: 24, marginBottom: 4 }}>
                      +
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                      New folder
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>
            ) : null}

            {/* Filters */}
            <View style={{ marginBottom: 16 }}>
              <SectionHeader title="All videos" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 2 }}
              >
                {FILTERS.map((f) => {
                  const n =
                    f === 'All'
                      ? videos.length
                      : f === 'YouTube'
                      ? platformCount('youtube')
                      : f === 'Vimeo'
                      ? platformCount('vimeo')
                      : f === 'Direct'
                      ? platformCount('direct')
                      : f === 'Downloaded'
                      ? downloadedCount
                      : 0;
                  return (
                    <Pill
                      key={f}
                      label={n > 0 && f !== 'Started' ? `${f} · ${n}` : f}
                      active={filter === f}
                      onPress={() => setFilter(f)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={foldersLoading || videosLoading}
            onRefresh={() => {
              refreshFolders();
              refreshVideos();
            }}
            tintColor="#fff"
          />
        }
        renderItem={({ item }) => (
          <View style={{ opacity: busyId === item.videoId ? 0.5 : 1 }}>
            <VideoCard
              video={item}
              onPress={() => openVideo(item.videoId)}
              onLongPress={() => onVideoLongPress(item)}
              onMore={() => onVideoLongPress(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={filter === 'All' ? 'Nothing here yet' : `No ${filter.toLowerCase()} videos`}
            subtitle={
              filter === 'All'
                ? 'Browse the web and save any video link to your library.'
                : 'Try a different filter or save more videos from Browse.'
            }
          />
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.colors.line, marginHorizontal: 2 }} />
        )}
      />
    </SafeAreaView>
  );
};
