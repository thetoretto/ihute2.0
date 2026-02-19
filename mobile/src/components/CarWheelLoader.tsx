import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../utils/theme';

interface CarWheelLoaderProps {
  visible: boolean;
  label?: string;
}

export default function CarWheelLoader({ visible, label = 'Loading rides...' }: CarWheelLoaderProps) {
  const spin = React.useRef(new Animated.Value(0)).current;
  const fade = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 560,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    if (visible) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
      spinLoop.start();
    } else {
      Animated.timing(fade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        spinLoop.stop();
      });
    }

    return () => spinLoop.stop();
  }, [visible, fade, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
        <Ionicons name="sync" size={18} color={colors.primary} />
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  wheel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
