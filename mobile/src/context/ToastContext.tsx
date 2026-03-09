import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from './ThemeContext';
import { radii, spacing, typography } from '../utils/theme';
import { TOAST_BOTTOM } from '../utils/layout';

const TOAST_DURATION_MS = 2500;

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue | null {
  return useContext(ToastContext);
}

/** Renders a single slide-up toast above the floating nav. Used by all roles. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(24)).current;
  const c = useThemeColors();

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    opacity.setValue(0);
    translateY.setValue(24);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setMessage(null));
    }, TOAST_DURATION_MS);
  }, [opacity, translateY]);

  const value = React.useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      <React.Fragment>
        {children}
      </React.Fragment>
      {message != null && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            {
              backgroundColor: c.toastBackground,
              borderRadius: radii.panel,
              borderColor: c.toastBorder,
              bottom: TOAST_BOTTOM,
              shadowColor: c.dark,
            },
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: c.appSuccess }]} />
          <Text style={[styles.text, { color: c.onAppPrimary }]} numberOfLines={1}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    flex: 1,
    ...typography.caption,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
