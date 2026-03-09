import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii } from '../../utils/theme';
import { strings } from '../../constants/strings';

const actions = [
  { id: 'privacy-1', title: strings.profile.accountVisibility, subtitle: strings.profile.accountVisibilityDesc, icon: 'eye-outline' as const, danger: false },
  { id: 'privacy-2', title: strings.profile.dataExport, subtitle: strings.profile.dataExportDesc, icon: 'download-outline' as const, danger: false },
  { id: 'privacy-3', title: strings.profile.deleteAccount, subtitle: strings.profile.deleteAccountDesc, icon: 'trash-outline' as const, danger: true },
];

export default function PrivacyScreen() {
  const themeColors = useThemeColors();
  const [isExporting, setIsExporting] = React.useState(false);

  const onActionPress = (id: string, title: string) => {
    if (id === 'privacy-2') {
      Alert.alert(strings.profile.dataExport, 'Generate and download your mock data package?', [
        { text: strings.common.cancel, style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            setIsExporting(true);
            setTimeout(() => {
              setIsExporting(false);
              Alert.alert(strings.profile.exportReady, 'Mock data export completed.');
            }, 900);
          },
        },
      ]);
      return;
    }
    if (id === 'privacy-3') {
      Alert.alert(strings.profile.deleteAccount, 'This mock action is irreversible. Continue?', [
        { text: strings.common.cancel, style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account deleted', 'Mock delete completed.') },
      ]);
      return;
    }
    Alert.alert(title, `Mock flow: ${title.toLowerCase()}.`);
  };

  return (
    <Screen scroll style={[styles.container, { backgroundColor: themeColors.appBackground }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: themeColors.text }]}>{strings.profile.privacy}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{strings.profile.privacySubtitle}</Text>
      {isExporting ? <Text style={[styles.exportInfo, { color: themeColors.text }]}>{strings.profile.exportPreparing}</Text> : null}

      {actions.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}
          onPress={() => onActionPress(item.id, item.title)}
          activeOpacity={0.85}
        >
          <View style={[styles.iconBox, { backgroundColor: themeColors.ghostBg }]}>
            <Ionicons name={item.icon} size={20} color={item.danger ? themeColors.error : themeColors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.cardTitle, item.danger && { color: themeColors.error }]}>{item.title}</Text>
            <Text style={[styles.cardSub, { color: themeColors.textMuted }]}>{item.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  exportInfo: { ...typography.caption, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.smMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textWrap: { flex: 1 },
  cardTitle: { ...typography.body, fontWeight: '600' },
  cardSub: { ...typography.caption, marginTop: spacing.xxs },
});
