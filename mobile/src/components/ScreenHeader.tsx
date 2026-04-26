import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}

export const ScreenHeader: React.FC<Props> = ({ title, subtitle, right, onBack }) => (
  <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
    <View className="flex-1 flex-row items-center">
      {onBack ? (
        <Pressable
          onPress={onBack}
          className="w-9 h-9 rounded-full bg-bg-card items-center justify-center mr-3 active:opacity-70"
        >
          <Text className="text-text text-lg">←</Text>
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Text className="text-text text-2xl font-bold">{title}</Text>
        {subtitle ? <Text className="text-text-muted text-sm mt-0.5">{subtitle}</Text> : null}
      </View>
    </View>
    {right ? <View>{right}</View> : null}
  </View>
);
