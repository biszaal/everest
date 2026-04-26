import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-brand', text: 'text-white', border: 'border-brand' },
  secondary: { bg: 'bg-bg-elevated', text: 'text-text', border: 'border-line' },
  ghost: { bg: 'bg-transparent', text: 'text-text', border: 'border-transparent' },
  danger: { bg: 'bg-transparent', text: 'text-[#F87171]', border: 'border-[#F87171]' },
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  fullWidth,
}) => {
  const s = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`${s.bg} ${s.border} border rounded-xl py-3 px-5 items-center justify-center ${
        fullWidth ? 'w-full' : ''
      } ${isDisabled ? 'opacity-50' : 'active:opacity-80'}`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className={`${s.text} font-semibold text-base`}>{title}</Text>
      )}
    </Pressable>
  );
};
