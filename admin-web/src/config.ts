const DEFAULT_COMMISSION_RATE = 0.15;
let commissionRate = DEFAULT_COMMISSION_RATE;

export function getCommissionRate(): number {
  return commissionRate;
}

export function setCommissionRate(value: number): void {
  commissionRate = Math.max(0, Math.min(0.3, value));
}

export const APP_COMMISSION_RATE = DEFAULT_COMMISSION_RATE;
