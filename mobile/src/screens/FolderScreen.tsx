import React, { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '@/components/EmptyState';
import { LoadingView } from '@/components/LoadingView';
import { VideoCard } from '@/components/VideoCard';
import { hueFor } from '@/components/Thumb';
import { useFolders } from '@/hooks/useFolders';
import { useVideos } from '@/hooks/useVideos';
import { useQueue } from '@/hooks/useQueue';
import { usePlayerStore } from '@/store/playerStore';
import { theme } from '@/theme';
import type { MainStackParamList, Video } from '@/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type R = RouteProp<MainStackParamList, 'Folder'>;

export const FolderScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const { folderId } = route.params;

  const { folders, remove, rename } = useFolders();
  const folder = folders.find((f) => f.playlistId === folderId);

  const { videos, loading, refresh, removeVideo, moveVideo } = useVideos(folderId);
  const { setQueue } = useQueue();
  const setExpanded = usePlayerStore((s) => s.setExpanded);
  const [busyItem, setBusyItem] = useState<string | null>(null);

  if (loading && videos.length === 0 && !folder) return <LoadingView />;

  const h = hueFor(folderId);
  const grad: [string, string] = [`hsl(${h}, 50%, 35%)`, `hsl(${(h + 40) % 360}, 45%, 18%)`];

  const playAll = () => {
    if (videos.length === 0) return;
    setQueue(videos, 0);
    setExpanded(true);
  };

  const openFrom = (videoId: string) => {
    const idx = videos.findIndex((v) => v.videoId === videoId);
    setQueue(videos, idx >= 0 ? idx : 0);
    setExpanded(true);
  };

  const onRenameFolder = () => {
    if (!folder) return;
    Alert.prompt(
      'Rename folder',
      '',
      (next) => {
        if (next && next.trim() && next !== folder.name) rename(folder.playlistId, next.trim());
      },
      'plain-text',
      folder.name,
    );
  };

  const onDeleteFolder = () => {
    if (!folder) return;
    Alert.alert(`Delete "${folder.name}"?`, 'Choose how to handle the videos inside.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Keep videos (move to root)',
        onPress: async () => {
          await remove(folder.playlistId, true);
          nav.goBack();
        },
      },
      {
        text: 'Delete videos too',
        style: 'destructive',
        onPress: async () => {
          await remove(folder.playlistId, false);
          nav.goBack();
        },
      },
    ]);
  };

  const onVideoLongPress = (video: Video) => {
    setBusyItem(video.videoId);
    Alert.alert(
      video.title,
      undefined,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setBusyItem(null) },
        {
          text: 'Move to another folder',
          onPress: () => {
            setBusyItem(null);
            nav.navigate('MoveVideo', { videoId: video.videoId });
          },
        },
        {
          text: 'Move out of folder',
          onPress: async () => {
            await moveVideo(video.videoId, null);
            setBusyItem(null);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeVideo(video.videoId);
            setBusyItem(null);
          },
        },
      ],
      { cancelable: true, onDismiss: () => setBusyItem(null) },
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <FlatList
        data={videos}
        keyExtractor={(v) => v.videoId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 160 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#fff" />}
        ListHeaderComponent={
          <View>
            {/* Nav row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: 8,
                paddingBottom: 12,
              }}
            >
              <Pressable
                onPress={() => nav.goBack()}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.colors.textMuted, fontSize: 18 }}>←</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable
                onPress={onRenameFolder}
                style={{ paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Rename</Text>
              </Pressable>
              <Pressable
                onPress={onDeleteFolder}
                style={{ paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Text style={{ color: theme.colors.danger, fontSize: 13 }}>Delete</Text>
              </Pressable>
            </View>

            {/* Folder hero */}
            <LinearGradient
              colors={grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 26, marginBottom: 10 }}>
                📁
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  color: '#fff',
                  fontSize: 26,
                  fontWeight: '800',
                  letterSpacing: -0.5,
                  lineHeight: 30,
                }}
              >
                {folder?.name ?? 'Folder'}
              </Text>
              {folder?.description ? (
                <Text
                  numberOfLines={2}
                  style={{
                    color: 'rgba(255,255,255,0.75)',
                    fontSize: 13,
                    marginTop: 4,
                  }}
                >
                  {folder.description}
                </Text>
              ) : null}
              <Text
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 12,
                  marginTop: 10,
                }}
              >
                {videos.length} video{videos.length === 1 ? '' : 's'}
              </Text>

              <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <Pressable
                  onPress={playAll}
                  disabled={videos.length === 0}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: videos.length === 0 ? 0.5 : 1,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: '700', fontSize: 14 }}>▶ Play all</Text>
                </Pressable>
                <Pressable
                  onPress={() => nav.navigate('Tabs')}
                  style={{
                    paddingHorizontal: 18,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Browse</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ opacity: busyItem === item.videoId ? 0.5 : 1 }}>
            <VideoCard
              video={item}
              onPress={() => openFrom(item.videoId)}
              onLongPress={() => onVideoLongPress(item)}
              onMore={() => onVideoLongPress(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Empty folder"
            subtitle="Long-press a video in the Library and choose Move to drop it in here."
          />
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.colors.line, marginHorizontal: 2 }} />
        )}
      />
    </SafeAreaView>
  );
};
