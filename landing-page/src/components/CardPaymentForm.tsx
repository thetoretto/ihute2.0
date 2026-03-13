import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getPaymentStatus } from '../api';

const POLL_INTERVAL_MS = 2000;

function PaymentFormInner({ clientSecret, bookingId, onSuccess, onError }: {
  clientSecret: string;
  bookingId: string;
  onSuccess: (bookingId: string) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    onError('');
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}?bookingId=${bookingId}`,
          receipt_email: undefined,
        },
      });
      if (error) {
        onError(error.message ?? 'Payment failed');
        setLoading(false);
        return;
      }
      let polls = 0;
      while (polls < 30) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const result = await getPaymentStatus({ bookingId });
        if (result.status === 'succeeded' && result.bookingId) {
          onSuccess(result.bookingId);
          return;
        }
        if (result.status === 'failed') {
          onError('Payment was not successful.');
          break;
        }
        polls += 1;
      }
      if (polls >= 30) onError('Verifying payment… Check your email for confirmation.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 px-4 bg-gray-900 text-white font-semibold rounded-xl disabled:opacity-50"
      >
        {loading ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

export default function CardPaymentForm({
  clientSecret,
  bookingId,
  publishableKey,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  bookingId: string;
  publishableKey: string;
  onSuccess: (bookingId: string) => void;
  onError: (message: string) => void;
}) {
  const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
  if (!stripePromise) {
    return (
      <p className="text-gray-600">
        Card payment is not configured. You can go to the confirmation page and we will verify your booking shortly.
      </p>
    );
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormInner
        clientSecret={clientSecret}
        bookingId={bookingId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
