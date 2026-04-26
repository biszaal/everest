import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import './global.css';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    // Configure audio mode so the floating player can keep playing in the background
    // (required for OS-level Picture-in-Picture on iOS to work as expected) and
    // doesn't get silenced by the iOS hardware mute switch when the user wants sound.
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {
      // Some platforms / Expo Go without proper plugin support may reject this; non-fatal.
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
