import React from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '@/components/EmptyState';
import { hueFor } from '@/components/Thumb';
import { useFolders } from '@/hooks/useFolders';
import { videosService } from '@/services/videos';
import { theme } from '@/theme';
import type { MainStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type R = RouteProp<MainStackParamList, 'MoveVideo'>;

const folderGradient = (id: string): [string, string] => {
  const h = hueFor(id);
  return [`hsl(${h}, 50%, 30%)`, `hsl(${(h + 40) % 360}, 45%, 18%)`];
};

export const MoveVideoScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();
  const { videoId } = route.params;
  const { folders } = useFolders();

  const move = async (folderId: string | null) => {
    try {
      await videosService.moveToFolder(videoId, folderId);
      nav.goBack();
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <Pressable
          onPress={() => nav.goBack()}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={22} color={theme.colors.textMuted} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: '800',
              letterSpacing: -0.4,
            }}
          >
            Move to…
          </Text>
          <Text style={{ color: theme.colors.textFaint, fontSize: 12, marginTop: 1 }}>
            Choose where this video belongs.
          </Text>
        </View>
      </View>

      <FlatList
        data={folders}
        keyExtractor={(f) => f.playlistId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            {/* Library root */}
            <Pressable
              onPress={() => move(null)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                marginBottom: 10,
                backgroundColor: theme.colors.bgCard,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.line,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.colors.bgCard2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="home-outline" size={20} color={theme.colors.textMuted} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Library root</Text>
                <Text
                  style={{ color: theme.colors.textFaint, fontSize: 12, marginTop: 2 }}
                  numberOfLines={1}
                >
                  Remove from any folder
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
            </Pressable>

            {/* New folder */}
            <Pressable
              onPress={() => nav.navigate('CreateFolder')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                marginBottom: 18,
                backgroundColor: theme.colors.brandSoft,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.brand,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: theme.colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: theme.colors.brand, fontSize: 14, fontWeight: '700' }}>
                  New folder…
                </Text>
                <Text
                  style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}
                  numberOfLines={1}
                >
                  Create one and move here
                </Text>
              </View>
            </Pressable>

            {folders.length > 0 ? (
              <Text
                style={{
                  color: theme.colors.textFaint,
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Existing folders
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          const [c1, c2] = folderGradient(item.playlistId);
          return (
            <Pressable
              onPress={() => move(item.playlistId)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                marginBottom: 8,
                backgroundColor: theme.colors.bgCard,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.line,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <LinearGradient
                colors={[c1, c2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18 }}>📁</Text>
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}
                >
                  {item.name}
                </Text>
                {item.description ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      color: theme.colors.textFaint,
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No folders yet"
            subtitle="Create one above to drop this video into it."
          />
        }
      />
    </SafeAreaView>
  );
};
