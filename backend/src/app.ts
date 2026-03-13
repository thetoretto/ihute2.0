import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : true,
  credentials: true,
}));
app.use(morgan('dev'));

// Stripe webhook needs raw body for signature verification (must be before express.json())
app.post('/api/payments/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  void handleStripeWebhook(req, res);
});

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

import authRoutes from './routes/auth';
import agencyRoutes from './routes/agencies';
import hotpointRoutes from './routes/hotpoints';
import tripRoutes from './routes/trips';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';
import vehicleRoutes from './routes/vehicles';
import disputeRoutes from './routes/disputes';
import ticketRoutes from './routes/tickets';
import driverRoutes from './routes/driver';
import scannerRoutes from './routes/scanner';
import ratingRoutes from './routes/ratings';
import notificationRoutes from './routes/notifications';
import paymentRoutes, { handleStripeWebhook } from './routes/payments';

app.use('/api/auth', authRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/hotpoints', hotpointRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
