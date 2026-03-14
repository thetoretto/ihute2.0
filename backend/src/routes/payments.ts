import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { Resend } from 'resend';
import prisma from '../prisma';
import { BookingStatus } from '@prisma/client';

const router = express.Router();

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET) : null;

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const PAWAPAY_API_KEY = process.env.PAWAPAY_API_KEY;
const PAWAPAY_WEBHOOK_SECRET = process.env.PAWAPAY_WEBHOOK_SECRET;

/** Mark booking paid and optionally deliver ticket */
async function confirmBookingAndDeliver(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip: {
        include: { departureHotpoint: true, destinationHotpoint: true, driver: true },
      },
    },
  });
  if (!booking || booking.status !== BookingStatus.PENDING_PAYMENT) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CONFIRMED, paymentStatus: 'paid' },
  });

  await deliverTicket(bookingId, booking);
}

/** Send ticket by deliveryMethod (email via Resend, SMS/WhatsApp stubbed) */
async function deliverTicket(
  bookingId: string,
  booking: {
    guestEmail?: string | null;
    guestPhone?: string | null;
    guestName?: string | null;
    deliveryMethod?: string | null;
    ticketId?: string | null;
    ticketNumber?: string | null;
    trip?: {
      departureHotpoint: { name: string };
      destinationHotpoint: { name: string };
      departureDate?: string;
      departureTime?: string;
    };
  }
): Promise<void> {
  const method = (booking.deliveryMethod || 'email').toLowerCase();
  const from = booking.trip?.departureHotpoint?.name ?? 'Departure';
  const to = booking.trip?.destinationHotpoint?.name ?? 'Destination';
  const details = `${from} → ${to}, ${booking.trip?.departureDate ?? ''} ${booking.trip?.departureTime ?? ''}. Ticket: ${booking.ticketNumber ?? booking.ticketId ?? bookingId}`;

  if (method === 'email' && booking.guestEmail && resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'Ihute <onboarding@resend.dev>',
        to: booking.guestEmail,
        subject: `Your ticket – ${booking.ticketNumber ?? bookingId}`,
        html: `<p>Hi ${booking.guestName ?? 'Guest'},</p><p>Your booking is confirmed.</p><p>${details}</p><p>Ticket ID: ${booking.ticketId ?? bookingId}</p>`,
      });
    } catch (e) {
      console.error('Resend send failed:', e);
    }
  } else if (method === 'sms' || method === 'whatsapp') {
    // TODO: Twilio or PawaPay SMS/WhatsApp when keys available
    console.log(`[Ticket delivery stub] ${method} to ${booking.guestPhone}: ${details}`);
  }
}

// ---------- GET /api/payments/status ----------
router.get('/status', async (req: Request, res: Response) => {
  const { depositId, bookingId } = req.query;
  if (!depositId && !bookingId) {
    res.status(400).json({ error: 'depositId or bookingId required' });
    return;
  }
  let payment = null;
  if (depositId) {
    payment = await prisma.payment.findFirst({
      where: { externalId: String(depositId) },
      orderBy: { createdAt: 'desc' },
    });
  }
  if (!payment && bookingId) {
    payment = await prisma.payment.findFirst({
      where: { bookingId: String(bookingId) },
      orderBy: { createdAt: 'desc' },
    });
  }
  const status = payment?.status === 'succeeded' ? 'succeeded' : payment?.status === 'failed' ? 'failed' : 'pending';
  res.json({ status, bookingId: payment?.bookingId ?? (bookingId ? String(bookingId) : undefined) });
});

// ---------- POST /api/payments/create-intent (Stripe) ----------
router.post('/create-intent', async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    res.status(400).json({ error: 'bookingId required' });
    return;
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true },
  });
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  if (booking.status !== BookingStatus.PENDING_PAYMENT) {
    res.status(400).json({ error: 'Booking already paid or cancelled' });
    return;
  }
  const amountCents = Math.round((booking.trip.pricePerSeat * booking.seats) * 100);
  if (amountCents <= 0) {
    res.status(400).json({ error: 'Invalid amount' });
    return;
  }

  if (!stripe) {
    res.status(503).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY.' });
    return;
  }

  try {
    const existing = await prisma.payment.findFirst({
      where: { bookingId, provider: 'stripe', status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.externalId) {
      const pi = await stripe.paymentIntents.retrieve(existing.externalId);
      if (pi.status !== 'succeeded' && pi.status !== 'canceled') {
        res.json({ clientSecret: pi.client_secret! });
        return;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      metadata: { bookingId },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.payment.create({
      data: {
        bookingId,
        provider: 'stripe',
        externalId: paymentIntent.id,
        amount: booking.trip.pricePerSeat * booking.seats,
        status: 'pending',
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (e: any) {
    console.error('Stripe create-intent error:', e);
    res.status(500).json({ error: e?.message ?? 'Failed to create payment intent' });
  }
});

// ---------- POST /api/payments/webhook/stripe (raw body) - mount in app before express.json() ----------
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!STRIPE_WEBHOOK_SECRET || !stripe) {
    res.status(503).send('Stripe webhook not configured');
    return;
  }
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e: any) {
    console.error('Stripe webhook signature error:', e.message);
    res.status(400).send(`Webhook Error: ${e.message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const payment = await prisma.payment.findFirst({
      where: { externalId: pi.id, provider: 'stripe' },
    });
    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'succeeded' },
      });
      await confirmBookingAndDeliver(payment.bookingId);
    }
  }

  res.sendStatus(200);
}

// ---------- POST /api/payments/create-deposit (PawaPay) ----------
router.post('/create-deposit', async (req: Request, res: Response) => {
  const { bookingId, phone } = req.body;
  if (!bookingId) {
    res.status(400).json({ error: 'bookingId required' });
    return;
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true },
  });
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  if (booking.status !== BookingStatus.PENDING_PAYMENT) {
    res.status(400).json({ error: 'Booking already paid or cancelled' });
    return;
  }
  const amount = booking.trip.pricePerSeat * booking.seats;

  if (PAWAPAY_API_KEY) {
    // TODO: call PawaPay API to create deposit; use returned depositId and redirectUrl
    // const deposit = await pawapay.createDeposit({ ... });
    // await prisma.payment.create({ data: { bookingId, provider: 'pawapay', externalId: deposit.id, amount, status: 'pending' } });
    // return res.json({ depositId: deposit.id, redirectUrl: deposit.redirectUrl });
  }

  // Stub: generate a fake deposit id for polling; status stays pending until webhook
  const depositId = `pp_${Date.now()}_${bookingId.slice(0, 8)}`;
  await prisma.payment.create({
    data: {
      bookingId,
      provider: 'pawapay',
      externalId: depositId,
      amount,
      status: 'pending',
    },
  });
  res.json({
    depositId,
    bookingId,
    redirectUrl: process.env.PAWAPAY_REDIRECT_BASE
      ? `${process.env.PAWAPAY_REDIRECT_BASE}?depositId=${depositId}`
      : undefined,
  });
});

// ---------- POST /api/payments/webhook/pawapay ----------
router.post('/webhook/pawapay', async (req: Request, res: Response) => {
  if (PAWAPAY_WEBHOOK_SECRET) {
    // TODO: verify PawaPay webhook signature
  }
  const body = req.body as { event?: string; depositId?: string; transaction_id?: string; status?: string };
  const depositId = body.depositId ?? body.transaction_id;
  if (!depositId) {
    res.status(400).json({ error: 'depositId or transaction_id required' });
    return;
  }
  const payment = await prisma.payment.findFirst({
    where: { externalId: depositId, provider: 'pawapay' },
  });
  if (!payment) {
    res.sendStatus(200);
    return;
  }
  const status = (body.event ?? body.status ?? '').toUpperCase();
  if (status === 'COMPLETED' || status === 'SUCCEEDED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'succeeded' },
    });
    await confirmBookingAndDeliver(payment.bookingId);
  } else if (status === 'FAILED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    });
  }
  res.sendStatus(200);
});

// ---------- POST /api/payments/webhook/pawapay-payout (driver withdrawal result) ----------
router.post('/webhook/pawapay-payout', async (req: Request, res: Response) => {
  const body = req.body as { transaction_id?: string; status?: string; event?: string };
  const transactionId = body.transaction_id;
  const status = (body.event ?? body.status ?? '').toUpperCase();
  if (!transactionId) {
    res.status(400).json({ error: 'transaction_id required' });
    return;
  }
  const withdrawal = await prisma.driverWithdrawal.findFirst({
    where: { externalId: transactionId, provider: 'pawapay' },
  });
  if (withdrawal) {
    const newStatus = status === 'COMPLETED' || status === 'SUCCEEDED' ? 'succeeded' : status === 'FAILED' ? 'failed' : withdrawal.status;
    await prisma.driverWithdrawal.update({
      where: { id: withdrawal.id },
      data: { status: newStatus },
    });
  }
  res.sendStatus(200);
});

export default router;
