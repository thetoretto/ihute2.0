type MockEventName =
  | 'auth_login_attempt'
  | 'auth_login_success'
  | 'auth_otp_sent'
  | 'auth_register_success'
  | 'trip_search'
  | 'trip_book'
  | 'trip_publish'
  | 'driver_rate'
  | 'ticket_scan';

interface MockEvent {
  name: MockEventName;
  payload?: Record<string, unknown>;
  timestamp: string;
}

const events: MockEvent[] = [];

export function trackMockEvent(name: MockEventName, payload?: Record<string, unknown>) {
  const event: MockEvent = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };
  events.push(event);
  console.log('[mock-event]', event);
}

export function getMockEvents() {
  return [...events];
}

export function clearMockEvents() {
  events.length = 0;
}
