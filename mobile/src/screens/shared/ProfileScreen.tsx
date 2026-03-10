import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../context/RoleContext';
import { useRootNavigation } from '../../context/RootNavigationContext';
import { getDriverRatingSummary, getUserBookings, getUserVehicles } from '../../services/api';
import { formatRatingValue } from '../../components';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, typography, radii, sizes, borderWidths, cardShadow, cardShadowStrong } from '../../utils/theme';
import { landingHeaderPaddingHorizontal, profileScrollPaddingBottom, fabBottomOffset } from '../../utils/layout';
import { openWhatsAppDispute } from '../../utils/whatsapp';
import { strings } from '../../constants/strings';

function GlassCard({ children, style, onPress }: { children: React.ReactNode; style?: any; onPress?: () => void }) {
  const themeColors = useThemeColors();
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      style={[
        styles.glassCard,
        cardShadow,
        { shadowColor: themeColors.cardShadowColor, backgroundColor: themeColors.card, borderColor: themeColors.borderLight },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Container>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { rootNavigate } = useRootNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { currentRole, agencySubRole } = useRole();
  const themeColors = useThemeColors();
  
  const [driverRatingSummary, setDriverRatingSummary] = useState<{ average: number; count: number } | null>(null);
  const [completedRidesCount, setCompletedRidesCount] = useState<number>(0);
  const [firstVehicle, setFirstVehicle] = useState<{ make: string; model: string; licensePlate: string } | null>(null);

  const isScanner = currentRole === 'agency' && agencySubRole === 'agency_scanner';

  // Load Data
  useEffect(() => {
    const loadDriverData = async () => {
      if (currentRole === 'driver' && user) {
        const summary = await getDriverRatingSummary(user.id);
        setDriverRatingSummary(summary);
        
        const list = await getUserVehicles(user.id);
        const approved = list.filter((v) => v.approvalStatus === 'approved');
        if (approved[0]) {
          setFirstVehicle({ make: approved[0].make, model: approved[0].model, licensePlate: approved[0].licensePlate });
        } else {
          setFirstVehicle(null);
        }
      } else {
        setDriverRatingSummary(null);
        setFirstVehicle(null);
      }
    };
    void loadDriverData();
  }, [currentRole, user]);

  useEffect(() => {
    const loadPassengerData = async () => {
      if (currentRole === 'passenger' && user) {
        const bookings = await getUserBookings(user.id);
        setCompletedRidesCount(bookings.filter((b) => b.status === 'completed').length);
      } else {
        setCompletedRidesCount(0);
      }
    };
    void loadPassengerData();
  }, [currentRole, user]);

  const handleLogout = () => {
    Alert.alert(strings.auth.logOut, strings.auth.logOutConfirm, [
      { text: strings.common.cancel, style: 'cancel' },
      { text: strings.auth.logOut, style: 'destructive', onPress: logout },
    ]);
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: themeColors.appBackground }]}>
      <View style={styles.headerLeft}>
        <GlassCard style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="chevron-left" size={14} color={themeColors.textMuted} />
        </GlassCard>
        <View>
          <Text style={[styles.headerTitleSmall, { color: themeColors.textMuted }]}>EcoRide</Text>
          <Text style={[styles.headerTitleLarge, { color: themeColors.text }]}>Profile</Text>
        </View>
      </View>
      <GlassCard style={styles.menuButton} onPress={() => rootNavigate('EditProfile')}>
        <FontAwesome name="ellipsis-h" size={14} color={themeColors.textMuted} />
      </GlassCard>
    </View>
  );

  const renderDriverContent = () => (
    <View style={styles.screenContent}>
      <GlassCard style={styles.profileCard}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: user?.avatarUri ?? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop' }}
              style={[styles.avatarLarge, { borderColor: themeColors.card }]}
            />
            <View style={[styles.verifiedBadge, { backgroundColor: themeColors.success, borderColor: themeColors.card }]}>
              <FontAwesome name="check" size={10} color={themeColors.onAccent} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: themeColors.text }]}>{user?.name ?? 'Guest Driver'}</Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={12} color={themeColors.starRating} />
              <Text style={[styles.ratingText, { color: themeColors.starRating }]}>{formatRatingValue(driverRatingSummary?.average ?? 0, '0.0')}</Text>
              <Text style={[styles.ratingLabel, { color: themeColors.textMuted }]}>• Ambassador</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight }]}>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>TOTAL TRIPS</Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>{driverRatingSummary?.count ?? 0}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight }]}>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>RIDER LOVE</Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>98%</Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.vehicleCard} onPress={() => rootNavigate('VehicleGarage')}>
        <View style={[styles.vehicleIconBox, { backgroundColor: themeColors.dark }]}>
          <FontAwesome name="car" size={24} color={themeColors.onAccent} />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleLabel, { color: themeColors.textMuted }]}>CURRENT VEHICLE</Text>
          <Text style={[styles.vehicleName, { color: themeColors.text }]}>{firstVehicle ? `${firstVehicle.make} ${firstVehicle.model}` : 'No Vehicle Selected'}</Text>
          <Text style={[styles.vehiclePlate, { color: themeColors.primary }]}>{firstVehicle?.licensePlate ?? 'Add a vehicle'}</Text>
        </View>
        <FontAwesome name="chevron-right" size={12} color={themeColors.textMuted} />
      </GlassCard>
      
      {/* Driver Actions */}
      <View style={styles.actionSection}>
        <GlassCard style={styles.actionRow} onPress={() => rootNavigate('Earnings')}>
          <View style={styles.rowLeft}>
            <Ionicons name="cash-outline" size={20} color={themeColors.text} />
            <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.nav.earnings}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
        </GlassCard>
        <GlassCard style={styles.actionRow} onPress={() => rootNavigate('DriverActivityListStack')}>
          <View style={styles.rowLeft}>
            <Ionicons name="stats-chart-outline" size={20} color={themeColors.text} />
            <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.viewMyRides}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
        </GlassCard>
        <GlassCard style={styles.actionRow} onPress={() => rootNavigate('ActivitiesFeedStack')}>
          <View style={styles.rowLeft}>
            <Ionicons name="pulse-outline" size={20} color={themeColors.text} />
            <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.activities}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
        </GlassCard>
        <GlassCard style={styles.actionRow} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
            <Text style={[styles.rowText, styles.signOutRowText, { color: themeColors.error }]}>Sign out</Text>
          </View>
        </GlassCard>
      </View>

    </View>
  );

  const renderAgencyContent = () => (
    <View style={styles.screenContent}>
      <GlassCard style={styles.profileCard}>
        <View style={[styles.agencyIconContainer, { backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]}>
          <FontAwesome name="building" size={24} color={themeColors.text} />
        </View>
        <Text style={[styles.agencyName, { color: themeColors.text }]}>{user?.name ?? 'Global Trans Co.'}</Text>
        <Text style={[styles.agencyTag, { color: themeColors.textMuted }]}>Verified Logistics Partner</Text>
        
        <View style={styles.agencyStatsCol}>
          <View style={[styles.agencyStatRow, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight }]}>
            <View style={styles.agencyStatLeft}>
              <View style={[styles.agencyStatIcon, { backgroundColor: themeColors.primaryTint }]}>
                <FontAwesome name="users" size={14} color={themeColors.primary} />
              </View>
              <Text style={[styles.agencyStatLabel, { color: themeColors.text }]}>Total Drivers</Text>
            </View>
            <Text style={[styles.agencyStatValue, { color: themeColors.text }]}>152</Text>
          </View>
          <View style={[styles.agencyStatRow, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight }]}>
            <View style={styles.agencyStatLeft}>
              <View style={[styles.agencyStatIcon, { backgroundColor: themeColors.successTint }]}>
                <FontAwesome name="shield" size={14} color={themeColors.success} />
              </View>
              <Text style={[styles.agencyStatLabel, { color: themeColors.text }]}>Certification</Text>
            </View>
            <View style={[styles.agencyTierBadge, { backgroundColor: themeColors.successTint }]}>
              <Text style={[styles.agencyTierText, { color: themeColors.success }]}>GOLD TIER</Text>
            </View>
          </View>
        </View>
      </GlassCard>
      
      <GlassCard style={styles.actionRow} onPress={() => rootNavigate('ActivitiesFeedStack')}>
        <View style={styles.rowLeft}>
          <Ionicons name="pulse-outline" size={20} color={themeColors.text} />
          <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.activities}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
      </GlassCard>
      {isScanner && (
        <GlassCard style={styles.actionRow} onPress={() => (navigation.getParent() as any)?.navigate('ScannerReport')}>
          <View style={styles.rowLeft}>
            <Ionicons name="document-text-outline" size={20} color={themeColors.text} />
            <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.openReport}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
        </GlassCard>
      )}
      <GlassCard style={styles.actionRow} onPress={handleLogout}>
        <View style={styles.rowLeft}>
          <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
          <Text style={[styles.rowText, styles.signOutRowText, { color: themeColors.error }]}>Sign out</Text>
        </View>
      </GlassCard>
    </View>
  );

  const renderPassengerContent = () => (
    <View style={styles.screenContent}>
      <GlassCard style={styles.profileCard}>
        <View style={styles.profileHeaderRow}>
          <Image
            source={{ uri: user?.avatarUri ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop' }}
            style={[styles.avatarMedium, { backgroundColor: themeColors.ghostBg }]}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileNameSmall, { color: themeColors.text }]}>{user?.name ?? 'Sarah Jenkins'}</Text>
            <View style={[styles.eliteBadge, { backgroundColor: themeColors.primaryTint }]}>
              <Text style={[styles.eliteBadgeText, { color: themeColors.primary }]}>ELITE TRAVELER</Text>
            </View>
          </View>
        </View>
        
        <Text style={[styles.sectionTitleSmall, { color: themeColors.textMuted }]}>RIDE PREFERENCES</Text>
        <View style={styles.prefGrid}>
          <View style={[styles.prefItem, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight }]}>
            <Text style={[styles.prefText, { color: themeColors.text }]}>MUSIC</Text>
            <FontAwesome name="music" size={14} color={themeColors.primary} />
          </View>
          <View style={[styles.prefItem, { backgroundColor: themeColors.ghostBg, borderColor: themeColors.borderLight }]}>
            <Text style={[styles.prefText, { color: themeColors.text }]}>QUIET</Text>
            <FontAwesome name="volume-off" size={14} color={themeColors.textMuted} />
          </View>
        </View>
      </GlassCard>
      
      <View style={styles.actionSection}>
        <GlassCard style={styles.actionRow} onPress={() => rootNavigate('Wallet')}>
          <View style={styles.rowLeft}>
            <Ionicons name="wallet-outline" size={20} color={themeColors.text} />
            <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.nav.wallet}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
        </GlassCard>
        <GlassCard style={styles.actionRow} onPress={() => navigation.navigate('Privacy')}>
          <View style={styles.rowLeft}>
            <Ionicons name="shield-outline" size={20} color={themeColors.text} />
            <Text style={[styles.rowText, { color: themeColors.text }]}>{strings.profile.privacy}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
        </GlassCard>
        <GlassCard style={styles.actionRow} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
            <Text style={[styles.rowText, styles.signOutRowText, { color: themeColors.error }]}>Sign out</Text>
          </View>
        </GlassCard>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.appBackground }]}>
      {renderHeader()}
      
      <ScrollView
         style={styles.scrollView}
         contentContainerStyle={[styles.scrollContent, { paddingTop: spacing.md }]}
         showsVerticalScrollIndicator={false}
       >
          {currentRole === 'driver' && renderDriverContent()}
          {currentRole === 'agency' && renderAgencyContent()}
          {currentRole === 'passenger' && renderPassengerContent()}

       </ScrollView>

      <View style={styles.floatingActions}>
        <TouchableOpacity style={[styles.fabWhite, cardShadowStrong, { shadowColor: themeColors.cardShadowColor, backgroundColor: themeColors.card, borderColor: themeColors.borderLight }]} onPress={() => navigation.navigate('Hotline')}>
          <FontAwesome name="phone" size={20} color={themeColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fabGreen, cardShadowStrong, { shadowColor: themeColors.cardShadowColor, backgroundColor: themeColors.whatsappGreen }]} onPress={() => openWhatsAppDispute()}>
          <FontAwesome name="whatsapp" size={24} color={themeColors.onAccent} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: spacing.md,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
  },
  headerTitleSmall: {
    ...typography.bodySmall,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  headerTitleLarge: {
    ...typography.h3,
    fontWeight: '900',
    marginTop: -spacing.xs,
  },
  glassCard: {
    borderRadius: radii.glassCard,
    borderWidth: borderWidths.thin,
  },
  backButton: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: sizes.touchTarget.iconButton,
    height: sizes.touchTarget.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: landingHeaderPaddingHorizontal,
    paddingBottom: profileScrollPaddingBottom,
  },
  screenContent: {},
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: sizes.avatar.xxl,
    height: sizes.avatar.xxl,
    borderRadius: spacing.xl,
    borderWidth: borderWidths.medium,
  },
  avatarMedium: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.lg,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -spacing.xs,
    right: -spacing.xs,
    width: radii.glassCard,
    height: radii.glassCard,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.medium,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.timeLg,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  profileNameSmall: {
    ...typography.time,
    fontWeight: '900',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.smDense,
  },
  ratingText: {
    ...typography.bodySmall,
    fontWeight: '900',
  },
  ratingLabel: {
    ...typography.captionBold,
  },
  eliteBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  eliteBadgeText: {
    ...typography.overline,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.smMd,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: borderWidths.thin,
  },
  statLabel: {
    ...typography.overline,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.time,
    fontWeight: '900',
  },
  vehicleCard: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  vehicleIconBox: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleLabel: {
    ...typography.captionBold,
    textTransform: 'uppercase',
  },
  vehicleName: {
    ...typography.bodyBold,
    fontWeight: '900',
  },
  vehiclePlate: {
    ...typography.overline,
    fontWeight: '700',
    marginTop: spacing.xxs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  agencyIconContainer: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: borderWidths.thin,
  },
  agencyName: {
    ...typography.display,
    lineHeight: 34,
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  agencyTag: {
    ...typography.bodySmall,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  agencyStatsCol: {
    gap: spacing.smMd,
  },
  agencyStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
  },
  agencyStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
  },
  agencyStatIcon: {
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agencyStatLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  agencyStatValue: {
    ...typography.bodySmall,
    fontWeight: '900',
  },
  agencyTierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.xs,
  },
  agencyTierText: {
    ...typography.overline,
  },
  sectionTitleSmall: {
    ...typography.captionBold,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  prefGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  prefItem: {
    flex: 1,
    paddingVertical: spacing.smMd,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefText: {
    ...typography.overline,
  },
  actionSection: {
    gap: spacing.smMd,
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.smMd,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smMd,
  },
  rowText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  signOutRowText: {
    fontWeight: '600',
  },
  floatingActions: {
    position: 'absolute',
    bottom: fabBottomOffset,
    right: spacing.lg,
    gap: spacing.smMd,
  },
  fabWhite: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.thin,
  },
  fabGreen: {
    width: sizes.avatar.xl,
    height: sizes.avatar.xl,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
