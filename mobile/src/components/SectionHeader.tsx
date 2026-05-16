import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { theme } from '@/theme';

interface Props {
  title: string;
  /** When true, render as a small ALL-CAPS label (matches the design's `caps` mode). */
  caps?: boolean;
  action?: string;
  onAction?: () => void;
  /** Reduce bottom margin (useful inline above a tight rail). */
  tight?: boolean;
}

/**
 * Matches the design's `SectionHeader` — has two modes:
 *  - default: bold 18pt 700, letter-spacing -0.3 (a regular page section title)
 *  - caps:    11pt 700 uppercase 1.2 letter-spacing in text-faint (subsection labels)
 */
export const SectionHeader: React.FC<Props> = ({ title, caps, action, onAction, tight }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: tight ? 8 : caps ? 10 : 14,
    }}
  >
    {caps ? (
      <Text
        style={{
          color: theme.colors.textFaint,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
    ) : (
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>
        {title}
      </Text>
    )}
    {action ? (
      <Pressable onPress={onAction}>
        <Text style={{ color: theme.colors.brand, fontSize: 13, fontWeight: '600' }}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);
