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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { Button, Screen, Input } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { useResponsiveThemeContext } from '../../context/ResponsiveThemeContext';
import { spacing, typography, radii } from '../../utils/theme';
import { strings } from '../../constants/strings';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuth();
  const themeColors = useThemeColors();
  const responsive = useResponsiveThemeContext();
  const effectiveSpacing = responsive?.spacing ?? spacing;

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

  const accent = themeColors.primary;

  return (
    <Screen
      scroll
      style={[styles.container, { backgroundColor: themeColors.appBackground }]}
      contentContainerStyle={[styles.content, { paddingBottom: effectiveSpacing.xxl }]}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      {/* Avatar + Change photo (mockup style) */}
      <View style={[styles.avatarSection, { marginBottom: effectiveSpacing.lg }]}>
        <TouchableOpacity
          onPress={handleChangePhoto}
          style={[styles.avatarTouch, styles.avatarRing, { borderColor: accent }]}
          activeOpacity={0.85}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.surface }]}>
              <Ionicons name="person" size={48} color={themeColors.textMuted} />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleChangePhoto} style={styles.changePhotoBtn}>
          <Text style={[styles.changePhotoText, { color: accent }]}>{strings.profile.changePhoto}</Text>
        </TouchableOpacity>
      </View>

      {/* Full Name */}
      <View style={styles.fieldWrap}>
        <Text style={[styles.labelOverline, { color: themeColors.textMuted }]}>Full Name</Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
          editable={!loading}
          style={[styles.inputRounded, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight, color: themeColors.text }]}
        />
      </View>

      {/* Email */}
      <View style={styles.fieldWrap}>
        <Text style={[styles.labelOverline, { color: themeColors.textMuted }]}>{strings.auth.email}</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
          style={[styles.inputRounded, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight, color: themeColors.text }]}
        />
      </View>

      {/* Phone */}
      <View style={styles.fieldWrap}>
        <Text style={[styles.labelOverline, { color: themeColors.textMuted }]}>Phone Number</Text>
        <Input
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
          editable={!loading}
          style={[styles.inputRounded, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight, color: themeColors.text }]}
        />
      </View>

      {/* Mini Bio (mockup; optional, not persisted in current API) */}
      <View style={styles.fieldWrap}>
        <Text style={[styles.labelOverline, { color: themeColors.textMuted }]}>{strings.profile.miniBio}</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="A short bio..."
          placeholderTextColor={themeColors.textMuted}
          multiline
          numberOfLines={4}
          editable={!loading}
          style={[
            styles.bioInput,
            {
              backgroundColor: themeColors.ghostBg,
              borderColor: themeColors.borderLight,
              color: themeColors.text,
            },
          ]}
        />
      </View>

      {error ? (
        <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text>
      ) : null}

      <Button
        title={loading ? strings.profile.saving : strings.profile.saveChanges}
        onPress={handleSave}
        disabled={loading}
        style={[styles.saveBtn, { borderRadius: radii.lg }]}
      />
      {loading ? (
        <ActivityIndicator size="small" color={themeColors.primary} style={styles.loader} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  avatarSection: { alignItems: 'center' },
  avatarTouch: {
    width: 100,
    height: 100,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 3,
  },
  avatarRing: {},
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: { marginTop: spacing.sm },
  changePhotoText: { ...typography.bodySmall, fontWeight: '700' },
  fieldWrap: { marginBottom: spacing.lg },
  labelOverline: { ...typography.overline, marginBottom: spacing.xs, paddingHorizontal: spacing.xs },
  inputRounded: { borderRadius: radii.lg, minHeight: 52 },
  bioInput: {
    ...typography.body,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: { ...typography.bodySmall, marginTop: spacing.sm, marginBottom: spacing.xs },
  saveBtn: { marginTop: spacing.lg },
  loader: { marginTop: spacing.sm },
});
