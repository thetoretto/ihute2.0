import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ihute_mock_store';

export interface DriverNotification {
  id: string;
  type: 'booking';
  bookingId: string;
  tripId: string;
  driverId: string;
  passengerName: string;
  seats: number;
  createdAt: string;
  read?: boolean;
}

type MockStore = {
  onboardingSeen?: boolean;
  onboardingIndex?: number;
  authUserId?: string | null;
  /** User IDs that have completed profile (email + password set). */
  profileCompleteByUserId?: Record<string, boolean>;
  passengerPrefs?: {
    tripType?: 'insta' | 'scheduled';
    passengerCount?: number;
  };
  notificationPrefs?: {
    tripUpdates: boolean;
    messageAlerts: boolean;
    promotions: boolean;
  };
  /** In-app notifications for drivers (e.g. new booking) */
  driverNotifications?: DriverNotification[];
  /** Withdrawal methods for drivers/agencies, keyed by userId */
  withdrawalMethodsByUserId?: Record<
    string,
    {
      mobileMoney?: { phone: string };
      bankTransfer?: { bankName: string; accountNumber: string; accountName?: string };
    }
  >;
  /** Pending OTP for sign-up (key = normalized phone or email). */
  pendingOtp?: { key: string; code: string; expiresAt: number };
  /** Scanner: number of tickets scanned today (for dashboard count). */
  scannerTicketCountToday?: number;
};

let cache: MockStore = {};
let hydrated = false;

async function readStore(): Promise<MockStore> {
  if (hydrated) {
    return cache;
  }
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        cache = parsed as MockStore;
      }
    }
  } catch {
    cache = {};
  }
  return cache;
}

async function writeStore(next: MockStore) {
  cache = next;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Persist best-effort; in-memory state still updated
  }
}

export async function getMockStore(): Promise<MockStore> {
  const current = await readStore();
  return { ...current };
}

export async function updateMockStore(patch: Partial<MockStore>) {
  const current = await readStore();
  const next = { ...current, ...patch };
  await writeStore(next);
}

export async function pushDriverNotification(notification: Omit<DriverNotification, 'id'>) {
  const current = await readStore();
  const list = current.driverNotifications ?? [];
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const nextList = [...list, { ...notification, id, read: false }];
  await writeStore({ ...current, driverNotifications: nextList });
}

export async function getDriverNotifications(driverId: string): Promise<DriverNotification[]> {
  const current = await readStore();
  const list = current.driverNotifications ?? [];
  return list.filter((n) => n.driverId === driverId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUnreadDriverNotificationCount(driverId: string): Promise<number> {
  const list = await getDriverNotifications(driverId);
  return list.filter((n) => !n.read).length;
}

export async function markDriverNotificationsRead(driverId: string) {
  const current = await readStore();
  const list = current.driverNotifications ?? [];
  const nextList = list.map((n) => (n.driverId === driverId ? { ...n, read: true } : n));
  await writeStore({ ...current, driverNotifications: nextList });
}

export async function getWithdrawalMethods(userId: string) {
  const current = await readStore();
  return current.withdrawalMethodsByUserId?.[userId] ?? {};
}

export async function updateWithdrawalMethods(
  userId: string,
  methods: {
    mobileMoney?: { phone: string };
    bankTransfer?: { bankName: string; accountNumber: string; accountName?: string };
  }
) {
  const current = await readStore();
  const byUser = current.withdrawalMethodsByUserId ?? {};
  byUser[userId] = methods;
  await writeStore({ ...current, withdrawalMethodsByUserId: byUser });
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function setPendingOtp(key: string, code: string, ttlMs: number = OTP_TTL_MS): Promise<void> {
  const current = await readStore();
  await writeStore({
    ...current,
    pendingOtp: { key, code, expiresAt: Date.now() + ttlMs },
  });
}

export async function getPendingOtp(key: string): Promise<{ code: string; expiresAt: number } | null> {
  const current = await readStore();
  const pending = current.pendingOtp;
  if (!pending || pending.key !== key) return null;
  return { code: pending.code, expiresAt: pending.expiresAt };
}

export async function clearPendingOtp(key: string): Promise<void> {
  const current = await readStore();
  if (current.pendingOtp?.key === key) {
    await writeStore({ ...current, pendingOtp: undefined });
  }
}

/** Scanner: tickets scanned today count for dashboard. */
export async function getScannerTicketCount(): Promise<number> {
  const current = await readStore();
  return current.scannerTicketCountToday ?? 0;
}

/** Scanner: increment today's count (call after a successful scan). */
export async function incrementScannerTicketCount(): Promise<number> {
  const current = await readStore();
  const next = (current.scannerTicketCountToday ?? 0) + 1;
  await writeStore({ ...current, scannerTicketCountToday: next });
  return next;
}
