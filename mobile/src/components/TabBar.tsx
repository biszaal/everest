import React, { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface IconPair {
  outline: IoniconsName;
  filled: IoniconsName;
}

const ICONS: Record<string, IconPair> = {
  Browse: { outline: 'globe-outline', filled: 'globe' },
  Library: { outline: 'library-outline', filled: 'library' },
};

const iconFor = (routeName: string, focused: boolean): IoniconsName => {
  const pair = ICONS[routeName];
  if (!pair) return focused ? 'ellipse' : 'ellipse-outline';
  return focused ? pair.filled : pair.outline;
};

interface TabButtonProps {
  label: string;
  iconName: IoniconsName;
  focused: boolean;
  accessibilityLabel?: string;
  testID?: string;
  onPress: () => void;
  onLongPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  label,
  iconName,
  focused,
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
}) => {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = focused
      ? withSpring(1, { stiffness: 260, damping: 22 })
      : withTiming(0, { duration: 180 });
  }, [focused, progress]);

  // Indicator pill above the icon — slim, brand blue, scales in.
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scaleX: interpolate(progress.value, [0, 1], [0.4, 1]) },
      { scaleY: interpolate(progress.value, [0, 1], [0.5, 1]) },
    ],
  }));

  // Subtle icon lift on select (consistent with the spring on the indicator).
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, -1]) }],
  }));

  const tint = focused ? theme.colors.brand : theme.colors.textFaint;

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        onPress={onPress}
        onLongPress={onLongPress}
        android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: true }}
        style={({ pressed }) => ({
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 8,
          paddingBottom: 4,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {/* Top indicator: 24×3 brand pill, only visible on active. */}
        <Animated.View
          style={[
            {
              width: 24,
              height: 3,
              borderRadius: 2,
              backgroundColor: theme.colors.brand,
              marginBottom: 7,
            },
            indicatorStyle,
          ]}
        />

        <Animated.View style={iconStyle}>
          <Ionicons name={iconName} size={24} color={tint} />
        </Animated.View>

        <Text
          style={{
            fontSize: 11,
            marginTop: 4,
            color: tint,
            fontWeight: focused ? '700' : '500',
            letterSpacing: -0.1,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
};

/**
 * Bottom tab bar — clean, balanced, and aligned to the rest of the design.
 *
 * Design choices that fix the previous version:
 * • Both tabs share identical layout (24×3 indicator slot + icon + label).
 *   No tab gets bigger or smaller depending on state — only color and a thin
 *   brand-blue indicator above the icon change. This eliminates the
 *   left/right imbalance the previous "active pill" caused.
 * • Outlined → filled icon swap on select communicates state at a glance.
 * • Spring-in indicator + 1px upward icon lift give a subtle, premium feel
 *   without resorting to oversized backdrops.
 * • Crisp 1px hairline at the top edge using `lineStrong` so the bar reads
 *   as its own surface, not bleeding into the page above.
 */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: theme.colors.bgElevated,
        borderTopWidth: 1,
        borderTopColor: theme.colors.lineStrong,
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 4),
      }}
    >
      <View style={{ flexDirection: 'row', width: '100%' }}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabButton
              key={route.key}
              label={String(label)}
              iconName={iconFor(route.name, focused)}
              focused={focused}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};
