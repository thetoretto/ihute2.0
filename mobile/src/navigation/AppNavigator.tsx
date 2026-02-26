import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useThemeColors } from '../context/ThemeContext';
import { spacing, typography, radii } from '../utils/theme';
import { useResponsiveTheme } from '../utils/responsiveTheme';
import { strings } from '../constants/strings';

import { OnboardingContext } from '../context/OnboardingContext';
import { RootNavigationProvider } from '../context/RootNavigationContext';

const ONBOARDING_STORAGE_KEY = '@ihute_has_seen_onboarding';

function useStackScreenOptions() {
  const c = useThemeColors();
  return {
    headerStyle: { backgroundColor: c.primary },
    headerTintColor: c.dark,
    headerTitleStyle: { color: c.dark, ...typography.h3 },
    headerTitle: () => <LogoHeader />,
    headerShadowVisible: false,
    headerTitleAlign: 'center' as const,
    contentStyle: { backgroundColor: c.background },
    animation: 'slide_from_right' as const,
    animationDuration: 250,
  };
}

/** Base tab bar config; height and label/icon styles are overridden with responsive values in each tab navigator. */
function useTabBarScreenOptionsBase() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  return {
    tabBarStyle: {
      backgroundColor: c.tabBarBackground,
      borderTopColor: c.tabBarBorder,
      borderTopWidth: 1,
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.sm),
    },
    tabBarActiveTintColor: c.primary,
    tabBarInactiveTintColor: c.textMuted,
    headerStyle: { backgroundColor: c.primary },
    headerTintColor: c.dark,
    headerTitle: () => <LogoHeader />,
    headerTitleAlign: 'center' as const,
    animation: 'fade' as const,
    sceneStyle: { backgroundColor: c.background },
  };
}

/** Shared tab navigator screenOptions (height, padding, label style, item style). Pass tintColor for role-specific active tint (e.g. c.agency). */
function useTabNavigatorScreenOptions(opts?: { tintColor?: string; headerTintColor?: string }) {
  const c = useThemeColors();
  const responsiveTheme = useResponsiveTheme();
  const base = useTabBarScreenOptionsBase();
  const tint = opts?.tintColor ?? c.primary;
  const headerTint = opts?.headerTintColor ?? c.dark;
  return {
    ...base,
    tabBarActiveTintColor: tint,
    tabBarInactiveTintColor: c.textMuted,
    headerTintColor: headerTint,
    tabBarStyle: {
      ...base.tabBarStyle,
      height: responsiveTheme.layout.tabBarHeight,
      paddingTop: responsiveTheme.spacing.sm,
    },
    tabBarLabelStyle: { ...responsiveTheme.typography.caption, fontWeight: '600' as const },
    tabBarItemStyle: { borderRadius: responsiveTheme.radii.md, marginHorizontal: 2, minHeight: 48 },
  };
}

const LogoHeader = () => (
  <Image
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    source={require('../../assets/logo.png')}
    style={{ height: 32, width: 56, resizeMode: 'contain', borderRadius: radii.sm }}
  />
);

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import CompleteProfileScreen from '../screens/auth/CompleteProfileScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Passenger
import PassengerHomeScreen from '../screens/passenger/PassengerHomeScreen';
import SearchResultsScreen from '../screens/passenger/SearchResultsScreen';
import InstantQueueScreen from '../screens/passenger/InstantQueueScreen';
import RideDetailScreen from '../screens/passenger/RideDetailScreen';
import PassengerBookingScreen from '../screens/passenger/PassengerBookingScreen';
import PassengerMyRidesScreen from '../screens/passenger/PassengerMyRidesScreen';
import TicketDetailScreen from '../screens/passenger/TicketDetailScreen';

// Driver
import DriverHomeScreen from '../screens/driver/DriverHomeScreen';
import VehicleGarageScreen from '../screens/driver/VehicleGarageScreen';
import PublishRideScreen from '../screens/driver/PublishRideScreen';
import DriverMyRidesScreen from '../screens/driver/DriverMyRidesScreen';
import DriverActivityDetailsScreen from '../screens/driver/DriverActivityDetailsScreen';
import DriverScanTicketScreen from '../screens/driver/DriverScanTicketScreen';
import DriverNotificationsScreen from '../screens/driver/DriverNotificationsScreen';
import ScannerReportScreen from '../screens/driver/ScannerReportScreen';

// Shared
import MessagesScreen from '../screens/shared/MessagesScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import HotlineScreen from '../screens/shared/HotlineScreen';
import PaymentMethodsScreen from '../screens/shared/PaymentMethodsScreen';
import WithdrawalMethodsScreen from '../screens/shared/WithdrawalMethodsScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import PrivacyScreen from '../screens/shared/PrivacyScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AuthNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <AuthStack.Navigator screenOptions={screenOptions} initialRouteName="Login">
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen
        name="VerifyOTP"
        component={VerifyOTPScreen}
        options={{ title: strings.auth.verifyCode }}
      />
    </AuthStack.Navigator>
  );
}

const CompleteProfileStack = createNativeStackNavigator();

function CompleteProfileNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <CompleteProfileStack.Navigator screenOptions={{ ...screenOptions, headerShown: true }}>
      <CompleteProfileStack.Screen
        name="CompleteProfile"
        component={CompleteProfileScreen}
        options={{ title: strings.auth.completeProfile }}
      />
    </CompleteProfileStack.Navigator>
  );
}

function PassengerHomeStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="PassengerHome"
        component={PassengerHomeScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InstantQueue" component={InstantQueueScreen} options={{ title: 'Drivers available now' }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} />
      <Stack.Screen name="PassengerBooking" component={PassengerBookingScreen} options={{ headerShown: false, title: 'Book trip' }} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: strings.nav.ticketDetails }} />
    </Stack.Navigator>
  );
}

function DriverHomeStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen name="VehicleGarage" component={VehicleGarageScreen} />
      <Stack.Screen name="PublishRide" component={PublishRideScreen} options={{ title: 'Publish ride' }} />
      <Stack.Screen name="DriverNotifications" component={DriverNotificationsScreen} options={{ title: strings.nav.notifications }} />
      <Stack.Screen name="DriverScanTicket" component={DriverScanTicketScreen} options={{ title: strings.nav.scanTicket }} />
    </Stack.Navigator>
  );
}

function DriverPublishStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="PublishRide" component={PublishRideScreen} options={{ title: 'Publish ride', headerShown: true }} />
    </Stack.Navigator>
  );
}

/** Scanner role only: Scan ticket and dashboard. Scanner has no access to PublishRide — do not add it here. */
function ScannerHomeStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{ headerShown: true }}
      />
      <Stack.Screen name="DriverScanTicket" component={DriverScanTicketScreen} options={{ title: strings.nav.scanTicket }} />
    </Stack.Navigator>
  );
}

function ScannerReportStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ScannerReport"
        component={ScannerReportScreen}
        options={{ title: strings.tabs.report }}
      />
    </Stack.Navigator>
  );
}

function DriverActivityListStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DriverActivityList"
        component={DriverMyRidesScreen}
        options={{ title: strings.nav.activities }}
      />
      <Stack.Screen
        name="DriverScanTicket"
        component={DriverScanTicketScreen}
        options={{ title: strings.nav.scanTicket }}
      />
    </Stack.Navigator>
  );
}

function PassengerMyRidesStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="PassengerMyRides"
        component={PassengerMyRidesScreen}
        options={{ title: strings.nav.passengerActivities }}
      />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{ title: strings.nav.ticketDetails }}
      />
    </Stack.Navigator>
  );
}

function DriverMyRidesStack() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DriverMyRides"
        component={DriverMyRidesScreen}
        options={{ title: strings.nav.driverActivities }}
      />
      <Stack.Screen
        name="DriverScanTicket"
        component={DriverScanTicketScreen}
        options={{ title: strings.nav.scanTicket }}
      />
    </Stack.Navigator>
  );
}

function PassengerTabsNavigator() {
  const responsiveTheme = useResponsiveTheme();
  const c = useThemeColors();
  const screenOptions = useTabNavigatorScreenOptions();
  const tabBarIconSize = responsiveTheme.layout.isTablet ? 26 : 24;
  return (
    <Tabs.Navigator screenOptions={screenOptions}>
      <Tabs.Screen
        name="PassengerFind"
        component={PassengerHomeStack}
        options={{
          tabBarLabel: strings.tabs.trips,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="search" size={tabBarIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="PassengerBookings"
        component={PassengerMyRidesStack}
        options={{
          tabBarLabel: strings.tabs.activities,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="pulse" size={tabBarIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="PassengerMessages"
        component={MessagesScreen}
        options={{
          tabBarLabel: strings.tabs.messages,
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={tabBarIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="PassengerProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: strings.tabs.profile,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={tabBarIconSize} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

function DriverTabsNavigator() {
  const responsiveTheme = useResponsiveTheme();
  const c = useThemeColors();
  const screenOptions = useTabNavigatorScreenOptions();
  const tabBarIconSize = responsiveTheme.layout.isTablet ? 26 : 24;
  return (
    <Tabs.Navigator screenOptions={screenOptions}>
      <Tabs.Screen
        name="DriverCenter"
        component={DriverHomeStack}
        options={{
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={tabBarIconSize} color={focused ? c.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="DriverPublish"
        component={DriverPublishStack}
        options={{
          tabBarLabel: strings.tabs.publish,
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons name="add-circle" size={28} color={c.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="DriverMessages"
        component={MessagesScreen}
        options={{
          tabBarLabel: strings.tabs.messages,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={tabBarIconSize} color={focused ? c.primary : color} />
          ),
        }}
      />
      <Tabs.Screen
        name="DriverProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: strings.tabs.profile,
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={tabBarIconSize} color={focused ? c.primary : color} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

function AgencyTabsNavigator() {
  const responsiveTheme = useResponsiveTheme();
  const c = useThemeColors();
  const screenOptions = useTabNavigatorScreenOptions({ tintColor: c.agency, headerTintColor: c.agency });
  const tabBarIconSize = responsiveTheme.layout.isTablet ? 26 : 24;
  return (
    <Tabs.Navigator screenOptions={screenOptions}>
      <Tabs.Screen
        name="AgencyCenter"
        component={DriverHomeStack}
        options={{
          tabBarLabel: strings.tabs.dashboard,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="car" size={tabBarIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="AgencyReport"
        component={ScannerReportStack}
        options={{
          tabBarLabel: strings.tabs.report,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={tabBarIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="AgencyProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: strings.tabs.profile,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={tabBarIconSize} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

function ScannerTabsNavigator() {
  const responsiveTheme = useResponsiveTheme();
  const c = useThemeColors();
  const screenOptions = useTabNavigatorScreenOptions({ tintColor: c.agency, headerTintColor: c.agency });
  const tabBarIconSize = responsiveTheme.layout.isTablet ? 26 : 24;
  return (
    <Tabs.Navigator screenOptions={screenOptions}>
      <Tabs.Screen
        name="ScannerCenter"
        component={ScannerHomeStack}
        options={{
          tabBarLabel: strings.tabs.dashboard,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="car" size={tabBarIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ScannerReport"
        component={ScannerReportStack}
        options={{
          tabBarLabel: strings.tabs.report,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={tabBarIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ScannerProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: strings.tabs.profile,
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={tabBarIconSize} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}

function MainRoleNavigator() {
  const { currentRole, agencySubRole } = useRole();
  const opacity = React.useRef(new Animated.Value(1)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 190,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentRole, opacity, translateY]);

  const isScanner = currentRole === 'agency' && agencySubRole === 'agency_scanner';

  return currentRole === 'driver' ? (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <DriverTabsNavigator key="driver-tabs" />
    </Animated.View>
  ) : isScanner ? (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <ScannerTabsNavigator key="scanner-tabs" />
    </Animated.View>
  ) : currentRole === 'agency' ? (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <AgencyTabsNavigator key="agency-tabs" />
    </Animated.View>
  ) : (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <PassengerTabsNavigator key="passenger-tabs" />
    </Animated.View>
  );
}

/** Shared header options for RootStack modal screens so they match the rest of the app on mobile. */
function useRootHeaderOptions() {
  const c = useThemeColors();
  return {
    headerShown: true as const,
    headerStyle: { backgroundColor: c.primary },
    headerTintColor: c.dark,
    headerTitleStyle: { color: c.dark, ...typography.h3 },
    headerShadowVisible: false,
    headerTitleAlign: 'center' as const,
  };
}

export default function AppNavigator() {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth();
  const { currentRole } = useRole();
  const rootHeaderOptions = useRootHeaderOptions();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const rootNavRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then((v) => {
      setHasSeenOnboarding(v === 'true');
    });
  }, []);

  const completeOnboarding = React.useCallback(() => {
    setHasSeenOnboarding(true);
  }, []);

  if (isLoading || hasSeenOnboarding === null) {
    return null;
  }

  const initialRoute =
    hasSeenOnboarding === false
      ? 'Onboarding'
      : !isAuthenticated
        ? 'Auth'
        : !isProfileComplete
          ? 'CompleteProfileFlow'
          : 'Main';

  return (
    <OnboardingContext.Provider value={hasSeenOnboarding === false ? { completeOnboarding } : null}>
      <RootNavigationProvider rootNavRef={rootNavRef}>
        <NavigationContainer ref={rootNavRef}>
          <RootStack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          {hasSeenOnboarding === false && (
            <RootStack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'fade' }}
            />
          )}
        {!isAuthenticated ? (
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ animation: 'fade' }}
          />
        ) : !isProfileComplete ? (
          <RootStack.Screen
            name="CompleteProfileFlow"
            component={CompleteProfileNavigator}
            options={{ animation: 'fade' }}
          />
        ) : (
          <>
            <RootStack.Screen
              name="Main"
              component={MainRoleNavigator}
              key={`main-${currentRole}`}
              options={{ animation: 'fade' }}
            />
            <RootStack.Screen
              name="VehicleGarage"
              component={VehicleGarageScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: strings.profile.myVehicles }}
            />
            <RootStack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: 'Chat' }}
            />
            <RootStack.Screen
              name="Hotline"
              component={HotlineScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: strings.profile.hotline }}
            />
            <RootStack.Screen
              name="PaymentMethods"
              component={PaymentMethodsScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: strings.nav.linkedAccounts }}
            />
            <RootStack.Screen
              name="WithdrawalMethods"
              component={WithdrawalMethodsScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: strings.profile.withdrawalMethods }}
            />
            <RootStack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: strings.nav.notifications }}
            />
            <RootStack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: strings.nav.privacy }}
            />
            <RootStack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: 'Edit profile' }}
            />
            <RootStack.Screen
              name="DriverActivityDetails"
              component={DriverActivityDetailsScreen}
              options={{ animation: 'slide_from_right', ...rootHeaderOptions, title: strings.app.name }}
            />
            <RootStack.Screen
              name="DriverActivityListStack"
              component={DriverActivityListStack}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
        </RootStack.Navigator>
        </NavigationContainer>
      </RootNavigationProvider>
    </OnboardingContext.Provider>
  );
}
