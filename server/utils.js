const BOOKING_ID_PREFIX = 'b_';

function normalizePaymentStatus(method) {
  return method === 'cash' ? 'cash_on_pickup' : 'paid';
}

function buildPaymentReference(method) {
  const stamp = `${Date.now()}`.slice(-8);
  if (method === 'mobile_money') return `MM-${stamp}`;
  if (method === 'card') return `CARD-${stamp}`;
  return `CASH-${stamp}`;
}

function buildTicketNumber(bookingId) {
  return `IHT-${bookingId.toUpperCase().replace(/^b_/, 'B_')}-${new Date().getFullYear()}`;
}

function buildQrChecksum(seed) {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) {
    sum = (sum + seed.charCodeAt(i) * (i + 1)) % 100000;
  }
  return `${sum}`.padStart(5, '0');
}

function buildTicketQrPayload(params) {
  const seed = `${params.ticketId}|${params.bookingId}|${params.passengerId}|${params.driverId}|${params.issuedAt}`;
  return `IHTQR|${seed}|${buildQrChecksum(seed)}`;
}

function normalizeOtpKey(phoneOrEmail) {
  const t = (phoneOrEmail || '').trim();
  return t.includes('@') ? t.toLowerCase() : t;
}

module.exports = {
  BOOKING_ID_PREFIX,
  normalizePaymentStatus,
  buildPaymentReference,
  buildTicketNumber,
  buildQrChecksum,
  buildTicketQrPayload,
  normalizeOtpKey,
};
