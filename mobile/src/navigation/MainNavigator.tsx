import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FloatingPlayer } from '@/components/FloatingPlayer';
import { MainTabNavigator } from '@/navigation/MainTabNavigator';
import { CreateFolderScreen } from '@/screens/CreateFolderScreen';
import { FolderScreen } from '@/screens/FolderScreen';
import { MoveVideoScreen } from '@/screens/MoveVideoScreen';
import type { MainStackParamList } from '@/types';

const Stack = createNativeStackNavigator<MainStackParamList>();

// Tabs + FloatingPlayer live together so the video element stays mounted while
// the user switches between Browse and Library. Modal screens (Folder,
// CreateFolder, MoveVideo) push on top and temporarily cover the player, but
// audio continues because this component is never unmounted.
const TabsWithFloatingPlayer: React.FC = () => (
  <View style={{ flex: 1 }}>
    <MainTabNavigator />
    <FloatingPlayer />
  </View>
);

export const MainNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0B0B10' } }}
  >
    <Stack.Screen name="Tabs" component={TabsWithFloatingPlayer} />
    <Stack.Screen name="Folder" component={FolderScreen} />
    <Stack.Screen
      name="CreateFolder"
      component={CreateFolderScreen}
      options={{ presentation: 'modal' }}
    />
    <Stack.Screen
      name="MoveVideo"
      component={MoveVideoScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);
