import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<Props> = ({ title, subtitle, children }) => (
  <View className="items-center justify-center px-8 py-16">
    <Text className="text-text text-lg font-semibold text-center">{title}</Text>
    {subtitle ? (
      <Text className="text-text-muted text-sm text-center mt-2">{subtitle}</Text>
    ) : null}
    {children ? <View className="mt-6 w-full">{children}</View> : null}
  </View>
);
