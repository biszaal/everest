import React from 'react';
import { Pressable, Text } from 'react-native';

import { theme } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

/** Rounded filter chip — matches the design's `Pill` (6px/14px padding, 100px radius). */
export const Pill: React.FC<Props> = ({ label, active, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 100,
        backgroundColor: active ? theme.colors.brand : theme.colors.bgCard2,
        borderWidth: 1,
        borderColor: active ? theme.colors.brand : theme.colors.line,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? '#fff' : theme.colors.textMuted,
          fontSize: 13,
          fontWeight: active ? '700' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};
