/**
 * Centralized user-facing copy for the app.
 * Replace or extend for localization (e.g. i18next) later.
 */
export const strings = {
  app: {
    name: 'iHute',
  },

  tabs: {
    trips: 'Trips',
    activities: 'Activities',
    messages: 'Messages',
    profile: 'Profile',
    dashboard: 'Dashboard',
    report: 'Report',
  },

  auth: {
    welcomeBack: 'Welcome back',
    signInContinue: 'Sign in to continue',
    signIn: 'Sign In',
    signingIn: 'Signing in...',
    logOut: 'Log out',
    logOutConfirm: 'Are you sure?',
    email: 'Email',
    password: 'Password',
    verifyCode: 'Verify code',
    completeProfile: 'Complete profile',
    helperAccounts: 'Passenger: passenger@ihute.com | Driver: driver@ihute.com',
    orSignInWith: 'Or sign in with',
    comingSoon: 'Coming soon',
    socialSignInMessage: (provider: string) =>
      `Sign in with ${provider} will be available soon. Use email and password for now.`,
    emailPasswordRequired: 'Email and password are required.',
    enterValidEmail: 'Enter a valid email address.',
    couldNotSignIn: 'Could not sign in. Try again.',
  },

  home: {
    greeting: (name: string) => `Hello, ${name}!`,
    tagline: 'Bus, train, carpool: iHute takes you where you want.',
  },

  profile: {
    account: 'Account',
    preferences: 'Preferences',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    support: 'Support',
    app: 'App',
    scanner: 'Scanner',
    openReport: 'Open Report',
    notifications: 'Notifications',
    privacy: 'Privacy',
    hotline: 'Hotline',
    withdrawalMethods: 'Withdrawal methods',
    linkedAccounts: 'Linked accounts',
    viewAllActivities: 'View all activities',
    myVehicles: 'My vehicles',
    driver: 'Driver',
    passenger: 'Passenger',
    agency: 'Agency',
    scannerRole: 'Scanner',
    activitiesWallet: 'Activities wallet',
    quickTotals: 'Quick totals',
    today: 'Today',
    week: 'Week',
    done: 'Done',
    active: 'Active',
    bookings: 'Bookings',
    income: 'Income',
    viewIncome: 'View income',
    hideIncome: 'Hide income',
  },

  nav: {
    ticketDetails: 'Ticket details',
    scanTicket: 'Scan ticket',
    notifications: 'Notifications',
    linkedAccounts: 'Linked accounts',
    withdrawalMethods: 'Withdrawal methods',
    privacy: 'Privacy',
    passengerActivities: 'Passenger Activities',
    driverActivities: 'Driver Activities',
    activities: 'Activities',
  },

  common: {
    ok: 'OK',
    cancel: 'Cancel',
    guest: 'Guest',
  },
} as const;
