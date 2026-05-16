import React from 'react';
import { Image, Pressable, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/theme';
import type { Video } from '@/types';

/** Deterministic hue from a string id — same video always gets the same gradient. */
export const hueFor = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
};

const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;

const platformLabel = (p: Video['platform']): string => {
  if (p === 'youtube') return 'youtube';
  if (p === 'vimeo') return 'vimeo';
  if (p === 'direct') return 'direct';
  return 'link';
};

interface Props {
  video: Video;
  width?: number;
  height?: number;
  radius?: number;
  showProgress?: boolean;
  progress?: number;
  /** When true, render a small checkmark badge top-right indicating an offline copy is present. */
  downloaded?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Matches the design's `Thumb` — hue-gradient background, small platform badge
 * top-right, centered play circle, optional thin progress bar.
 * Falls back to the video's own thumbnail image if present (over the gradient).
 */
export const Thumb: React.FC<Props> = ({
  video,
  width = 120,
  height = 72,
  radius = 10,
  showProgress = false,
  progress = 0,
  downloaded = false,
  onPress,
  style,
}) => {
  const hue = hueFor(video.videoId);
  const content = (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: '#000',
          position: 'relative',
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[hsl(hue, 45, 10), hsl((hue + 30) % 360, 35, 17)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {video.thumbnail ? (
        <Image
          source={{ uri: video.thumbnail }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.92 }}
          resizeMode="cover"
        />
      ) : null}

      {/* platform tag (top-left) — uppercase via letterSpacing + textTransform */}
      <View
        style={{
          position: 'absolute',
          top: 5,
          left: 5,
          backgroundColor: 'rgba(0,0,0,0.55)',
          borderRadius: 3,
          paddingHorizontal: 5,
          paddingVertical: 1,
        }}
      >
        <Text
          style={{
            color: 'rgba(255,255,255,0.78)',
            fontSize: 9,
            fontWeight: '700',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {platformLabel(video.platform)}
        </Text>
      </View>

      {/* downloaded badge (top-right) — small brand-blue circle with a checkmark */}
      {downloaded ? (
        <View
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: theme.colors.brand,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 9, lineHeight: 11, fontWeight: '900' }}>✓</Text>
        </View>
      ) : null}

      {/* center play circle */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: Math.min(36, Math.min(width, height) * 0.42),
            height: Math.min(36, Math.min(width, height) * 0.42),
            borderRadius: 32,
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.28)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: Math.max(10, Math.min(width, height) * 0.18) }}>▶</Text>
        </View>
      </View>

      {showProgress && progress > 0 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <View
            style={{
              height: 3,
              width: `${Math.min(1, progress) * 100}%`,
              backgroundColor: theme.colors.brand,
            }}
          />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={{ width, height, borderRadius: radius }}>
      {content}
    </Pressable>
  );
};
