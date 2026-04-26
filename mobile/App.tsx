import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import './global.css';

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/navigation/RootNavigator';

// Background-audio + silent-mode overrides are configured per-player on the
// `useVideoPlayer(...)` setup hook in FloatingPlayer (`p.staysActiveInBackground = true`),
// matching the new expo-video architecture in Expo SDK 55+.

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
