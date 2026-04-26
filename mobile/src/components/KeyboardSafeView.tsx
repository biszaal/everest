import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  type KeyboardAvoidingViewProps,
  Platform,
  TouchableWithoutFeedback,
  type ViewStyle,
} from 'react-native';

type Props = Omit<KeyboardAvoidingViewProps, 'behavior'> & {
  children: React.ReactNode;
  /**
   * Override KeyboardAvoidingView behavior. Defaults: iOS='padding',
   * Android=undefined (relies on the manifest's `windowSoftInputMode=adjustResize`,
   * which Expo ships with by default — manually forcing `height` on Android
   * tends to introduce layout jumps).
   */
  behavior?: KeyboardAvoidingViewProps['behavior'];
  /** Extra vertical offset above the keyboard. Use this when a fixed header sits above the content. */
  offset?: number;
  /** When true, tapping any non-input area dismisses the keyboard. */
  dismissOnTap?: boolean;
  /** NativeWind className applied to the inner container. Defaults to `flex-1`. */
  className?: string;
  style?: ViewStyle;
};

/**
 * Wraps a scrollable form body so that inputs stay visible above the on-screen keyboard.
 *
 * Usage:
 *   <KeyboardSafeView>
 *     <ScrollView keyboardShouldPersistTaps="handled">
 *       <Input ... />
 *     </ScrollView>
 *   </KeyboardSafeView>
 *
 * Tip: child `ScrollView` / `FlatList` components should set
 * `keyboardShouldPersistTaps="handled"` so buttons remain tappable while the keyboard is up.
 */
export const KeyboardSafeView: React.FC<Props> = ({
  children,
  behavior,
  offset = 0,
  dismissOnTap = false,
  className = 'flex-1',
  style,
  ...rest
}) => {
  const resolvedBehavior = behavior ?? (Platform.OS === 'ios' ? 'padding' : undefined);

  const avoidingView = (
    <KeyboardAvoidingView
      behavior={resolvedBehavior}
      keyboardVerticalOffset={offset}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </KeyboardAvoidingView>
  );

  if (!dismissOnTap) return avoidingView;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {avoidingView}
    </TouchableWithoutFeedback>
  );
};
