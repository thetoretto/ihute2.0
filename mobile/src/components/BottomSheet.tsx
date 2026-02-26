import React from 'react';
import { View, TouchableWithoutFeedback, Modal, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, radii } from '../utils/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export default function BottomSheet({ visible, onClose, children, contentStyle }: BottomSheetProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const overlayBg = c.overlayModal ?? c.overlay;
  const sheetBg = c.card ?? c.popupSurface;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: sheetBg,
              borderTopLeftRadius: radii.xlMobile,
              borderTopRightRadius: radii.xlMobile,
              paddingBottom: insets.bottom + spacing.xl,
            },
            contentStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, maxHeight: '85%' },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
});
