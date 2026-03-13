import { useEffect, useState } from 'react';
import { getPaymentStatus } from '../api';

interface PaymentCallbackPageProps {
  depositId: string | null;
  bookingId: string | null;
  onSuccess: (bookingId: string) => void;
  onBackHome: () => void;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 min

export default function PaymentCallbackPage({ depositId, bookingId, onSuccess, onBackHome }: PaymentCallbackPageProps) {
  const [status, setStatus] = useState<'checking' | 'pending' | 'succeeded' | 'failed' | 'error'>('checking');
  const [resolvedBookingId, setResolvedBookingId] = useState<string | null>(bookingId);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!depositId && !bookingId) {
      setStatus('error');
      return;
    }
    let count = 0;
    let cancelled = false;
    const poll = async (): Promise<boolean> => {
      if (cancelled) return true;
      try {
        const result = await getPaymentStatus({ depositId: depositId || undefined, bookingId: bookingId || undefined });
        if (cancelled) return true;
        if (result.bookingId) setResolvedBookingId(result.bookingId);
        setStatus(result.status as 'pending' | 'succeeded' | 'failed');
        setPollCount((c) => c + 1);
        count += 1;
        if (result.status === 'succeeded' && result.bookingId) {
          onSuccess(result.bookingId);
          return true;
        }
        if (result.status === 'failed' || count >= MAX_POLLS) return true;
      } catch {
        if (!cancelled) setStatus('error');
        return true;
      }
      return false;
    };
    const id = setInterval(async () => {
      const done = await poll();
      if (done) clearInterval(id);
    }, POLL_INTERVAL_MS);
    poll().then((done) => { if (done) clearInterval(id); });
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [depositId, bookingId, onSuccess]);

  return (
    <section className="max-w-lg mx-auto px-4 py-12 text-center">
      <h2 className="text-2xl font-bold mb-4">
        {status === 'checking' || status === 'pending' ? 'Verifying payment…' : status === 'succeeded' ? 'Payment successful' : status === 'failed' ? 'Payment failed' : 'Something went wrong'}
      </h2>
      {(status === 'checking' || status === 'pending') && (
        <p className="text-gray-600 mb-6">Please wait while we confirm your payment.</p>
      )}
      {status === 'succeeded' && !resolvedBookingId && (
        <p className="text-gray-600 mb-6">Redirecting to your ticket…</p>
      )}
      {status === 'failed' && (
        <p className="text-gray-600 mb-6">Your payment could not be completed. Please try again or choose another payment method.</p>
      )}
      {status === 'error' && (
        <p className="text-gray-600 mb-6">We could not verify your payment. If you completed payment, use the link in your email/SMS or contact support.</p>
      )}
      <button
        type="button"
        onClick={onBackHome}
        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
      >
        Back to home
      </button>
      {resolvedBookingId && (status === 'failed' || status === 'error') && (
        <p className="mt-4 text-sm text-gray-500">Booking reference: {resolvedBookingId}</p>
      )}
    </section>
  );
}
