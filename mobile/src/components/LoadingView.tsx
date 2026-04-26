import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { theme } from '@/theme';

export const LoadingView: React.FC<{ className?: string }> = ({ className }) => (
  <View className={`flex-1 items-center justify-center bg-bg ${className ?? ''}`}>
    <ActivityIndicator color={theme.colors.brand} size="large" />
  </View>
);
