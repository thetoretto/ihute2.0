import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing } from '../utils/theme';
import { useThemeColors } from '../context/ThemeContext';
import { useResponsiveLayout } from '../utils/responsive';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  scrollProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;
}

export default function Screen({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  scrollProps,
}: ScreenProps) {
  const colors = useThemeColors();
  const { horizontalPadding, maxContentWidth } = useResponsiveLayout();
  const fixedInnerStyle: StyleProp<ViewStyle> = [
    styles.inner,
    styles.innerFill,
    { paddingHorizontal: horizontalPadding, maxWidth: maxContentWidth },
    style,
  ];
  const scrollInnerStyle: StyleProp<ViewStyle> = [
    styles.inner,
    { paddingHorizontal: horizontalPadding, maxWidth: maxContentWidth },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            style={[styles.scroll, style]}
            contentContainerStyle={[styles.scrollContent, scrollInnerStyle, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            overScrollMode="always"
            decelerationRate="fast"
            bounces={false}
            alwaysBounceVertical={false}
            {...scrollProps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={fixedInnerStyle}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  innerFill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 0,
    paddingBottom: spacing.xl,
  },
});

