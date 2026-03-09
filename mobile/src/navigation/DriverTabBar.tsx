import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, typography, radii, cardShadowTeal } from '../utils/theme';

export type UnifiedTabBarProps = BottomTabBarProps & {
  /** Route name that renders as elevated center action (e.g. DriverPublish). Omit for 3-tab layout. */
  centerRouteName?: string | null;
};

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  DriverCenter: { active: 'home', inactive: 'home-outline' },
  DriverActivity: { active: 'clipboard', inactive: 'clipboard-outline' },
  DriverPublish: { active: 'add', inactive: 'add' },
  DriverProfile: { active: 'person', inactive: 'person-outline' },
  PassengerFind: { active: 'search', inactive: 'search-outline' },
  PassengerBookings: { active: 'pulse', inactive: 'pulse-outline' },
  PassengerProfile: { active: 'person', inactive: 'person-outline' },
  AgencyCenter: { active: 'car', inactive: 'car-outline' },
  AgencyReport: { active: 'document-text', inactive: 'document-text-outline' },
  AgencyProfile: { active: 'person', inactive: 'person-outline' },
  ScannerCenter: { active: 'car', inactive: 'car-outline' },
  ScannerReport: { active: 'document-text', inactive: 'document-text-outline' },
  ScannerProfile: { active: 'person', inactive: 'person-outline' },
};

export function UnifiedFloatingTabBar({ state, descriptors, navigation, centerRouteName = null }: UnifiedTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const activeColor = c.appAccent;
  const inactiveColor = c.navInactiveIcon;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.tabBarBlurBg,
          borderTopColor: c.borderLight,
          paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.md,
          paddingTop: spacing.md,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCenterAction = centerRouteName != null && route.name === centerRouteName;
        const label = (options.tabBarLabel as string) ?? route.name;
        const icons = TAB_ICONS[route.name];
        const iconName = icons ? (isFocused ? icons.active : icons.inactive) : 'ellipse-outline';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? activeColor : inactiveColor;

        if (isCenterAction) {
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.publishWrap}
              activeOpacity={0.85}
            >
              <View style={[styles.publishButton, { backgroundColor: c.appPrimary, borderColor: c.surface }, cardShadowTeal]}>
                <Ionicons name={iconName} size={26} color={c.onAppPrimary} />
              </View>
              <Text style={[styles.label, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Ionicons name={iconName} size={24} color={color} />
            <Text style={[styles.label, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -28,
  },
  publishButton: {
    width: 56,
    height: 56,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 4,
    ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
  },
  label: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

/** Driver tab bar: 4 tabs with elevated Publish. Kept for backward compatibility. */
export function DriverTabBar(props: BottomTabBarProps) {
  return <UnifiedFloatingTabBar {...props} centerRouteName="DriverPublish" />;
}
