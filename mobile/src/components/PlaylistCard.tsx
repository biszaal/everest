import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Playlist } from '@/types';

interface Props {
  playlist: Playlist;
  onPress?: () => void;
}

const gradients: [string, string][] = [
  ['#7C5CFF', '#22D3EE'],
  ['#F472B6', '#7C5CFF'],
  ['#22D3EE', '#10B981'],
  ['#F59E0B', '#EF4444'],
  ['#6366F1', '#0EA5E9'],
];

const pickGradient = (id: string): [string, string] => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return gradients[Math.abs(h) % gradients.length];
};

export const PlaylistCard: React.FC<Props> = ({ playlist, onPress }) => {
  const colors = pickGradient(playlist.playlistId);
  return (
    <Pressable onPress={onPress} className="w-40 mr-3 active:opacity-80">
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="aspect-square rounded-2xl p-3 justify-end">
        <Text numberOfLines={2} className="text-white font-semibold text-base">
          {playlist.name}
        </Text>
      </LinearGradient>
      {playlist.description ? (
        <View className="mt-2">
          <Text numberOfLines={1} className="text-text-muted text-xs">
            {playlist.description}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};
