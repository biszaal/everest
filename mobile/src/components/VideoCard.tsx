import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { theme } from '@/theme';
import { Thumb } from '@/components/Thumb';
import { relativeTime } from '@/utils/format';
import type { Video } from '@/types';

interface Props {
  video: Video;
  onPress?: () => void;
  onLongPress?: () => void;
  onMore?: () => void;
  /** Compact = transparent row inside a list (no card chrome). Default = surface card. */
  compact?: boolean;
  index?: number;
  progress?: number;
  duration?: number;
}

const platformLabel = (p: Video['platform']): string => {
  if (p === 'youtube') return 'YouTube';
  if (p === 'vimeo') return 'Vimeo';
  if (p === 'direct') return 'Direct';
  return 'Link';
};

/**
 * Matches the design's `VideoRow`: gradient thumb on the left, two-line title +
 * channel + meta line on the right, optional index column and ⋯ overflow button.
 */
export const VideoCard: React.FC<Props> = ({
  video,
  onPress,
  onLongPress,
  onMore,
  compact = false,
  index,
  progress,
  duration,
}) => {
  const pct = progress && duration && duration > 0 ? Math.min(1, progress / duration) : 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: compact ? 0 : 12,
        marginBottom: compact ? 0 : 10,
        backgroundColor: compact ? 'transparent' : theme.colors.bgCard,
        borderRadius: compact ? 0 : 14,
        borderWidth: compact ? 0 : 1,
        borderColor: theme.colors.line,
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {index !== undefined ? (
        <Text
          style={{
            color: theme.colors.textFaint,
            fontSize: 13,
            width: 20,
            textAlign: 'center',
            fontWeight: '600',
            paddingTop: 6,
          }}
        >
          {index}
        </Text>
      ) : null}

      <Thumb
        video={video}
        width={compact ? 96 : 110}
        height={compact ? 58 : 66}
        radius={compact ? 8 : 10}
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
            marginBottom: 3,
          }}
        >
          {video.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 3 }}
        >
          {platformLabel(video.platform)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: theme.colors.textFaint, fontSize: 11 }}>
            {relativeTime(video.createdAt)}
          </Text>
          {pct > 0 ? (
            <Text style={{ color: theme.colors.brand, fontSize: 11 }}>
              {Math.round(pct * 100)}%
            </Text>
          ) : null}
        </View>
      </View>

      {onMore ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onMore();
          }}
          hitSlop={8}
          style={{ paddingTop: 6 }}
        >
          <Text style={{ color: theme.colors.textFaint, fontSize: 16, lineHeight: 16 }}>⋮</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
};
