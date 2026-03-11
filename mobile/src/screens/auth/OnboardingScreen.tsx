import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingContext } from '../../context/OnboardingContext';
import { colors, spacing, radii, typography, sizes } from '../../utils/theme';
import { Button } from '../../components';
import { strings } from '../../constants/strings';

const ONBOARDING_STORAGE_KEY = '@ihute_has_seen_onboarding';

const SLIDES = [
  {
    id: '1',
    icon: 'location' as const,
    title: 'Hotpoints',
    text: 'Pick up and drop off at designated Hotpoints for safe, reliable rides.',
  },
  {
    id: '2',
    icon: 'wallet' as const,
    title: 'Flexible Payment',
    text: 'Pay with cash, mobile money, or card. Your choice.',
  },
  {
    id: '3',
    icon: 'swap-horizontal' as const,
    title: 'Passenger or Driver',
    text: 'Switch between roles anytime. Travel or earn by sharing your ride.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const onboardingContext = useContext(OnboardingContext);
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const setOnboardingIndex = (nextIndex: number) => {
    setIndex(nextIndex);
  };

  const completeOnboarding = () => {
    AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true').then(() => {
      onboardingContext?.completeOnboarding();
      navigation.replace('Auth');
    });
  };

  const onNext = () => {
    if (index < SLIDES.length - 1) {
      const nextIndex = index + 1;
      flatRef.current?.scrollToIndex({ index: nextIndex });
      setOnboardingIndex(nextIndex);
    } else {
      completeOnboarding();
    }
  };

  const onSkip = () => {
    completeOnboarding();
  };

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/e2426e2f-6eb8-4ea6-91af-e79e0dbac3a5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cd236f'},body:JSON.stringify({sessionId:'cd236f',location:'OnboardingScreen.tsx',message:'Onboarding branding shown',data:{appName:strings.app.name,slogan:strings.app.slogan,logoPath:'../../../assets/logo.png'},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  }, []);
  // #endregion

  return (
    <View style={styles.container}>
      <View style={styles.brandBar}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandTitle}>{strings.app.name}</Text>
        <Text style={styles.brandSubtitle}>{strings.app.slogan}</Text>
      </View>
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setOnboardingIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.heroCard}>
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={56} color={colors.primaryTextOnLight} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.text}>{item.text}</Text>
            </View>
          </View>
        )}
      />
      <View style={[styles.footer, { paddingHorizontal: Math.max(14, Math.min(28, Math.round(width * 0.055))) }]}>
        <View style={styles.dots}>
          <Text style={styles.stepLabel}>{index + 1}/{SLIDES.length}</Text>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <Button title={index < SLIDES.length - 1 ? 'Next' : 'Get Started'} onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  brandBar: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: sizes.logo.width * 1.5,
    height: sizes.logo.height * 1.5,
    marginBottom: spacing.sm,
  },
  brandTitle: {
    ...typography.h1,
    color: colors.primaryTextOnLight,
    letterSpacing: 0.8,
    textTransform: 'lowercase',
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  heroCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    alignItems: 'center',
    minHeight: 340,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stepLabel: { ...typography.caption, color: colors.textMuted, marginRight: spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary },
  skip: { alignSelf: 'flex-end', marginBottom: spacing.sm },
  skipText: { ...typography.body, color: colors.primaryTextOnLight },
});
