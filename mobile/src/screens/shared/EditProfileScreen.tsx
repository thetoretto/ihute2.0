import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useThemeColors } from '../../context/ThemeContext';
import { cardShadowStrong, spacing, typography, radii, sizes, borderWidths } from '../../utils/theme';
import { landingHeaderPaddingHorizontal } from '../../utils/layout';
import { strings } from '../../constants/strings';

function GlassCard({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  const themeColors = useThemeColors();
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      style={[
        styles.glassCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.borderLight },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
}

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const themeColors = useThemeColors();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>(user?.avatarUri);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setAvatarUri(user.avatarUri);
    }
  }, [user]);

  const requestMediaPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to your photos to change your profile picture.');
        return false;
      }
    }
    return true;
  };

  const handleChangePhoto = async () => {
    const ok = await requestMediaPermission();
    if (!ok) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail && !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await updateProfile({
        name: trimmedName,
        email: trimmedEmail || undefined,
        phone: phone.trim() || undefined,
        ...(avatarUri !== undefined ? { avatarUri } : {}),
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm, backgroundColor: themeColors.appBackground }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}
        >
          <FontAwesome name="chevron-left" size={14} color={themeColors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Edit Profile</Text>
        <View style={{ width: sizes.touchTarget.iconButton }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleChangePhoto} style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.avatarImage, { borderColor: themeColors.card }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.card }]}>
                <FontAwesome name="user" size={40} color={themeColors.textMuted} />
              </View>
            )}
            <View style={[styles.editIconBadge, { backgroundColor: themeColors.primary, borderColor: themeColors.card }]}>
              <FontAwesome name="camera" size={12} color={themeColors.text} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.changePhotoText, { color: themeColors.primary }]}>Tap to change photo</Text>
        </View>

        <GlassCard style={styles.formCard}>
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: themeColors.textMuted }]}>FULL NAME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
              editable={!loading}
              style={[styles.input, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight, color: themeColors.text }]}
              placeholderTextColor={themeColors.textMuted}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: themeColors.textMuted }]}>{strings.auth.email.toUpperCase()}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              style={[styles.input, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight, color: themeColors.text }]}
              placeholderTextColor={themeColors.textMuted}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: themeColors.textMuted }]}>PHONE NUMBER</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
              editable={!loading}
              style={[styles.input, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight, color: themeColors.text }]}
              placeholderTextColor={themeColors.textMuted}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: themeColors.textMuted }]}>{strings.profile.miniBio.toUpperCase()}</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="A short bio..."
              placeholderTextColor={themeColors.textMuted}
              multiline
              numberOfLines={4}
              editable={!loading}
              style={[styles.input, styles.bioInput, { backgroundColor: themeColors.surface, borderColor: themeColors.borderLight, color: themeColors.text }]}
            />
          </View>
        </GlassCard>

        {error ? (
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.saveButton,
            cardShadowStrong,
            { shadowColor: themeColors.cardShadowColor, backgroundColor: themeColors.dark },
            loading && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={themeColors.onAppPrimary} size="small" />
          ) : (
            <Text style={[styles.saveButtonText, { color: themeColors.onAppPrimary }]}>{strings.profile.saveChanges.toUpperCase()}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.thin,
  },
  headerTitle: {
    ...typography.body,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xlLg,
  },
  glassCard: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.thin,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.smMd,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: spacing.xlLg,
    borderWidth: 3,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: spacing.xlLg,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -spacing.xs,
    right: -spacing.xs,
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: radii.smMedium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.medium,
  },
  changePhotoText: {
    ...typography.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  fieldWrap: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.overline,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.bodySmall,
    fontWeight: '600',
    borderWidth: borderWidths.thin,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  saveButton: {
    paddingVertical: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    ...typography.captionBold,
    letterSpacing: 2,
  },
});
