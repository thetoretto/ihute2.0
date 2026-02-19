import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

type RefreshVisualState = 'idle' | 'refreshing' | 'done';

interface CarRefreshIndicatorProps {
  state: RefreshVisualState;
}

export default function CarRefreshIndicator({ state }: CarRefreshIndicatorProps) {
  const translateY = React.useRef(new Animated.Value(20)).current;
  const bodyOpacity = React.useRef(new Animated.Value(0)).current;
  const headlightOpacity = React.useRef(new Animated.Value(0)).current;
  const sparkleOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (state === 'refreshing') {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(bodyOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (state === 'done') {
      Animated.sequence([
        Animated.timing(headlightOpacity, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(headlightOpacity, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
      ]).start();
      Animated.sequence([
        Animated.timing(sparkleOpacity, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(bodyOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }).start(() => translateY.setValue(20));
      });
      return;
    }

    Animated.timing(bodyOpacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => translateY.setValue(20));
  }, [state, bodyOpacity, headlightOpacity, sparkleOpacity, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity: bodyOpacity, transform: [{ translateY }] }]}
    >
      <Ionicons name="car-sport" size={20} color={colors.primary} />
      <Animated.View style={[styles.headlight, { opacity: headlightOpacity }]} />
      <Animated.View style={[styles.sparkleA, { opacity: sparkleOpacity }]} />
      <Animated.View style={[styles.sparkleB, { opacity: sparkleOpacity }]} />
      <Animated.View style={[styles.sparkleC, { opacity: sparkleOpacity }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 8,
    width: 36,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlight: {
    position: 'absolute',
    right: 0,
    top: 9,
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sparkleA: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.neutral,
  },
  sparkleB: {
    position: 'absolute',
    top: 2,
    right: 14,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  sparkleC: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
});
