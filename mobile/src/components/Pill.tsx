import React from 'react';
import { Pressable, Text } from 'react-native';

import { theme } from '@/theme';

interface Props {
  label: string;
  /** Optional count badge — appended after the label as " · N". Hidden when 0 or undefined. */
  count?: number;
  active?: boolean;
  onPress?: () => void;
}

/**
 * Matches the design's `Pill`:
 *  - inactive: bg `surface` + 1px `line` border + text-muted, 12pt 600
 *  - active:   bg `brandSoft` + 1px `brand` border + brand text (NOT solid brand bg).
 * 30pt tall, 12pt horizontal padding, pill radius.
 */
export const Pill: React.FC<Props> = ({ label, count, active, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: active ? theme.colors.brandSoft : theme.colors.bgCard,
        borderWidth: 1,
        borderColor: active ? theme.colors.brand : theme.colors.line,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? theme.colors.brand : theme.colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 ? (
        <Text
          style={{
            color: active ? theme.colors.brand : theme.colors.textMuted,
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          · {count}
        </Text>
      ) : null}
    </Pressable>
  );
};
