import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { theme } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<Props> = ({ label, error, ...rest }) => {
  return (
    <View className="mb-4">
      {label ? <Text className="text-text-muted mb-2 text-sm">{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textFaint}
        className="bg-bg-elevated border border-line rounded-xl px-4 py-3 text-text text-base"
        {...rest}
      />
      {error ? <Text className="text-[#F87171] text-xs mt-1">{error}</Text> : null}
    </View>
  );
};
