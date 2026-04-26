import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';

import { Button } from '@/components/Button';
import { LoadingView } from '@/components/LoadingView';
import { MainNavigator } from '@/navigation/MainNavigator';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/theme';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.bg,
    card: theme.colors.bgElevated,
    text: theme.colors.text,
    border: theme.colors.line,
    primary: theme.colors.brand,
    notification: theme.colors.accent,
  },
};

export const RootNavigator: React.FC = () => {
  const { status, error, bootstrap } = useAuth();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'loading') return <LoadingView />;

  if (status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-8">
        <Text className="text-text text-xl font-bold mb-2">Couldn't start your session</Text>
        <Text className="text-text-muted text-center mb-6">
          {error ?? 'Please check your connection and try again.'}
        </Text>
        <Button title="Retry" onPress={bootstrap} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <MainNavigator />
    </NavigationContainer>
  );
};
