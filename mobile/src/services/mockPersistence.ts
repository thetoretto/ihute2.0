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
  /** Payment methods per user (for mock). */
  paymentMethodsByUserId?: Record<string, Array<{ id: string; type: string; label?: string; detail?: string; isDefault?: boolean }>>;
  /** Wallet balance per user (passenger). */
  walletBalanceByUserId?: Record<string, number>;
  /** Wallet transactions per user. */
  walletTransactionsByUserId?: Record<string, Array<{ id: string; type: 'credit' | 'debit'; amount: number; label: string; date: string }>>;
  /** Password reset: email -> { token, expiresAt }. */
  passwordResetByEmail?: Record<string, { token: string; expiresAt: number }>;
  /** User-created vehicles (driver/agency); key = userId, value = Vehicle[]. */
  userVehiclesByUserId?: Record<string, Array<{
    id: string; make: string; model: string; color: string; licensePlate: string;
    seats: number; approvalStatus: 'pending' | 'approved' | 'rejected'; driverId?: string; ownerId?: string;
  }>>;
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

// Payment methods (mock)
export type StoredPaymentMethod = { id: string; type: string; label?: string; detail?: string; isDefault?: boolean };

export async function getStoredPaymentMethods(userId: string): Promise<StoredPaymentMethod[]> {
  const current = await readStore();
  return current.paymentMethodsByUserId?.[userId] ?? [];
}

export async function addStoredPaymentMethod(
  userId: string,
  method: { type: string; label?: string; detail?: string; isDefault?: boolean }
): Promise<StoredPaymentMethod> {
  const current = await readStore();
  const list = current.paymentMethodsByUserId?.[userId] ?? [];
  const isFirst = list.length === 0;
  const id = `pm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newMethod: StoredPaymentMethod = {
    id,
    type: method.type,
    label: method.label,
    detail: method.detail,
    isDefault: isFirst ?? method.isDefault,
  };
  const nextList = list.map((m) => ({ ...m, isDefault: m.id === (list.find((x) => x.isDefault)?.id) ? false : m.isDefault }));
  nextList.push(newMethod);
  const byUser = { ...current.paymentMethodsByUserId, [userId]: nextList };
  await writeStore({ ...current, paymentMethodsByUserId: byUser });
  return newMethod;
}

export async function removeStoredPaymentMethod(userId: string, methodId: string): Promise<void> {
  const current = await readStore();
  const list = current.paymentMethodsByUserId?.[userId] ?? [];
  const nextList = list.filter((m) => m.id !== methodId);
  const byUser = { ...current.paymentMethodsByUserId, [userId]: nextList };
  await writeStore({ ...current, paymentMethodsByUserId: byUser });
}

export async function setStoredDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
  const current = await readStore();
  const list = current.paymentMethodsByUserId?.[userId] ?? [];
  const nextList = list.map((m) => ({ ...m, isDefault: m.id === methodId }));
  const byUser = { ...current.paymentMethodsByUserId, [userId]: nextList };
  await writeStore({ ...current, paymentMethodsByUserId: byUser });
}

// Wallet (mock)
export async function getStoredWalletBalance(userId: string): Promise<number> {
  const current = await readStore();
  return current.walletBalanceByUserId?.[userId] ?? 0;
}

export async function setStoredWalletBalance(userId: string, balance: number): Promise<void> {
  const current = await readStore();
  const byUser = { ...current.walletBalanceByUserId, [userId]: balance };
  await writeStore({ ...current, walletBalanceByUserId: byUser });
}

export type WalletTransaction = { id: string; type: 'credit' | 'debit'; amount: number; label: string; date: string };

export async function getStoredWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const current = await readStore();
  const list = current.walletTransactionsByUserId?.[userId] ?? [];
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addStoredWalletTransaction(
  userId: string,
  tx: { type: 'credit' | 'debit'; amount: number; label: string }
): Promise<WalletTransaction> {
  const current = await readStore();
  const list = current.walletTransactionsByUserId?.[userId] ?? [];
  const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newTx: WalletTransaction = { ...tx, id, date: new Date().toISOString() };
  const nextList = [newTx, ...list];
  const balance = (current.walletBalanceByUserId?.[userId] ?? 0) + (tx.type === 'credit' ? tx.amount : -tx.amount);
  const next = {
    ...current,
    walletTransactionsByUserId: { ...current.walletTransactionsByUserId, [userId]: nextList },
    walletBalanceByUserId: { ...current.walletBalanceByUserId, [userId]: balance },
  };
  await writeStore(next);
  return newTx;
}

// Password reset (mock)
export async function setPasswordResetToken(email: string, ttlMs: number = 30 * 60 * 1000): Promise<string> {
  const key = email.trim().toLowerCase();
  const token = `reset_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  const current = await readStore();
  const byEmail = { ...current.passwordResetByEmail, [key]: { token, expiresAt: Date.now() + ttlMs } };
  await writeStore({ ...current, passwordResetByEmail: byEmail });
  return token;
}

export async function getPasswordResetToken(email: string): Promise<{ token: string; expiresAt: number } | null> {
  const current = await readStore();
  const key = email.trim().toLowerCase();
  const entry = current.passwordResetByEmail?.[key];
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry;
}

export async function clearPasswordResetToken(email: string): Promise<void> {
  const current = await readStore();
  const key = email.trim().toLowerCase();
  const byEmail = { ...current.passwordResetByEmail };
  delete byEmail[key];
  await writeStore({ ...current, passwordResetByEmail: byEmail });
}

// User-created vehicles (mock)
export type StoredVehicle = {
  id: string;
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  seats: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  driverId?: string;
  ownerId?: string;
};

export async function getStoredUserVehicles(userId: string): Promise<StoredVehicle[]> {
  const current = await readStore();
  return current.userVehiclesByUserId?.[userId] ?? [];
}

export async function addStoredUserVehicle(userId: string, vehicle: Omit<StoredVehicle, 'id'>): Promise<StoredVehicle> {
  const current = await readStore();
  const list = current.userVehiclesByUserId?.[userId] ?? [];
  const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const newV: StoredVehicle = { ...vehicle, id, driverId: userId, ownerId: userId };
  const nextList = [...list, newV];
  const byUser = { ...current.userVehiclesByUserId, [userId]: nextList };
  await writeStore({ ...current, userVehiclesByUserId: byUser });
  return newV;
}

export async function updateStoredUserVehicle(
  userId: string,
  vehicleId: string,
  updates: Partial<Omit<StoredVehicle, 'id'>>
): Promise<StoredVehicle | null> {
  const current = await readStore();
  const list = current.userVehiclesByUserId?.[userId] ?? [];
  const idx = list.findIndex((v) => v.id === vehicleId);
  if (idx < 0) return null;
  const updated = { ...list[idx], ...updates };
  const nextList = [...list];
  nextList[idx] = updated;
  const byUser = { ...current.userVehiclesByUserId, [userId]: nextList };
  await writeStore({ ...current, userVehiclesByUserId: byUser });
  return updated;
}

export async function getStoredVehicleById(vehicleId: string): Promise<StoredVehicle | null> {
  const current = await readStore();
  const byUser = current.userVehiclesByUserId ?? {};
  for (const list of Object.values(byUser)) {
    const v = list.find((x) => x.id === vehicleId);
    if (v) return v;
  }
  return null;
}

export async function getStoredVehicleOwnerId(vehicleId: string): Promise<string | null> {
  const current = await readStore();
  const byUser = current.userVehiclesByUserId ?? {};
  for (const [userId, list] of Object.entries(byUser)) {
    if (list.some((x) => x.id === vehicleId)) return userId;
  }
  return null;
}
