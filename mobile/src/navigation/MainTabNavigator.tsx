import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { TabBar } from '@/components/TabBar';
import { BrowseScreen } from '@/screens/BrowseScreen';
import { LibraryScreen } from '@/screens/LibraryScreen';
import type { TabParamList } from '@/types';

const Tab = createBottomTabNavigator<TabParamList>();

export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    initialRouteName="Browse"
    tabBar={(props) => <TabBar {...props} />}
    screenOptions={{ headerShown: false, lazy: false }}
  >
    <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse' }} />
    <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Library' }} />
  </Tab.Navigator>
);
