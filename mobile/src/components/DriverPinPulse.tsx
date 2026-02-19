import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';

export default function DriverPinPulse() {
  const dropY = React.useRef(new Animated.Value(-20)).current;
  const scale = React.useRef(new Animated.Value(0.86)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(dropY, {
          toValue: 0,
          duration: 190,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 190,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [dropY, pulse, scale]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={[
          styles.pulse,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.25] }),
            transform: [
              {
                scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.12] }),
              },
            ],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ translateY: dropY }, { scale }] }}>
        <Ionicons name="location" size={22} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pulse: {
    position: 'absolute',
    bottom: 2,
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
