import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { theme } from '@/theme';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
}

/** Matches the design's `SectionHeader` — bold 17px, optional accent action on the right. */
export const SectionHeader: React.FC<Props> = ({ title, action, onAction }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    }}
  >
    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>
      {title}
    </Text>
    {action ? (
      <Pressable onPress={onAction}>
        <Text style={{ color: theme.colors.brand, fontSize: 13, fontWeight: '600' }}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);
