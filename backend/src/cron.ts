import cron from 'node-cron';
import prisma from './prisma';
import { BookingStatus, TripStatus } from '@prisma/client';

const UNPAID_EXPIRY_MINUTES = Number(process.env.UNPAID_BOOKING_EXPIRY_MINUTES) || 15;

/** Cancel unpaid bookings and release seats */
async function runUnpaidExpiry() {
  const cutoff = new Date(Date.now() - UNPAID_EXPIRY_MINUTES * 60 * 1000);
  const unpaid = await prisma.booking.findMany({
    where: { status: BookingStatus.PENDING_PAYMENT, createdAt: { lt: cutoff } },
    include: { trip: true }
  });
  for (const b of unpaid) {
    await prisma.$transaction([
      prisma.booking.update({ where: { id: b.id }, data: { status: BookingStatus.CANCELLED } }),
      prisma.trip.update({
        where: { id: b.tripId },
        data: { seatsAvailable: { increment: b.seats }, status: TripStatus.ACTIVE }
      })
    ]);
  }
  if (unpaid.length > 0) console.log(`[cron] Expired ${unpaid.length} unpaid booking(s)`);
}

/** Mark trips as completed when all tickets scanned and past estimated arrival */
async function runTripCompletion() {
  const now = Date.now();
  const activeTrips = await prisma.trip.findMany({
    where: { status: { in: [TripStatus.ACTIVE, TripStatus.FULL] } },
    include: { bookings: true }
  });
  for (const trip of activeTrips) {
    const nonCancelled = trip.bookings.filter((b) => b.status !== BookingStatus.CANCELLED);
    const totalBooked = nonCancelled.reduce((s, b) => s + b.seats, 0);
    const allScanned = totalBooked > 0 && nonCancelled.every((b) => b.validatedAt != null);
    const depDate = trip.departureDate || new Date().toISOString().slice(0, 10);
    const depMs = new Date(`${depDate}T${trip.departureTime || '00:00'}`).getTime();
    const durationMins = trip.durationMinutes || 0;
    const estimatedArrivalMs = depMs + durationMins * 60 * 1000;
    if (allScanned && now >= estimatedArrivalMs) {
      await prisma.trip.update({ where: { id: trip.id }, data: { status: TripStatus.COMPLETED } });
      console.log(`[cron] Trip ${trip.id} marked completed`);
    }
  }
}

export function startCrons() {
  cron.schedule('*/5 * * * *', runUnpaidExpiry);
  cron.schedule('*/5 * * * *', runTripCompletion);
  runUnpaidExpiry().catch(console.error);
  runTripCompletion().catch(console.error);
  console.log('Crons started (unpaid expiry + trip completion every 5 min)');
}
