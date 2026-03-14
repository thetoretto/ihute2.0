import { PrismaClient, UserType, UserStatus } from '@prisma/client';
import { hashPassword } from '../src/utils/auth';

const prisma = new PrismaClient();

async function main() {
  // Super Admin
  const adminEmail = 'admin@ihute.com';
  const adminPass = await hashPassword('admin123');
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPass, status: UserStatus.APPROVED },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      passwordHash: adminPass,
      userType: UserType.SUPER_ADMIN,
      status: UserStatus.APPROVED,
    },
  });

  // Agency
  const agency = await prisma.agency.create({
    data: {
      name: 'Kigali Express',
      contactInfo: 'contact@kigaliexpress.com',
    }
  });

  // Agency Admin
  const agencyEmail = 'agency@ihute.com';
  const agencyPass = await hashPassword('agency123');
  await prisma.user.create({
    data: {
      email: agencyEmail,
      name: 'Kigali Express Admin',
      passwordHash: agencyPass,
      userType: UserType.AGENCY_ADMIN,
      status: UserStatus.APPROVED,
      agencyId: agency.id,
    }
  });

  // Driver
  const driverEmail = 'driver@ihute.com';
  const driverPass = await hashPassword('driver123');
  const driver = await prisma.user.create({
    data: {
      email: driverEmail,
      name: 'Camille Driver',
      passwordHash: driverPass,
      userType: UserType.DRIVER,
      status: UserStatus.APPROVED,
      agencyId: agency.id,
      statusBadge: 'Verified',
    }
  });

  // Passenger (USER) – for testing login and bookings from landing/mobile
  const passengerEmail = 'passenger@ihute.com';
  const passengerPass = await hashPassword('passenger123');
  await prisma.user.upsert({
    where: { email: passengerEmail },
    update: { passwordHash: passengerPass, status: UserStatus.APPROVED },
    create: {
      email: passengerEmail,
      name: 'Test Passenger',
      passwordHash: passengerPass,
      userType: UserType.USER,
      status: UserStatus.APPROVED,
    }
  });

  // Hotpoints
  const kgl = await prisma.hotpoint.create({
    data: { name: 'Kigali (Nyabugogo)', latitude: -1.9397, longitude: 30.0445, address: 'Nyabugogo Bus Park' }
  });
  const rub = await prisma.hotpoint.create({
    data: { name: 'Rubavu', latitude: -1.6763, longitude: 29.2635, address: 'Rubavu Town' }
  });

  // Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      brand: 'Toyota',
      model: 'Coaster',
      capacity: 28,
      plateNumber: 'RAB 123 A',
      agencyId: agency.id,
      driverId: driver.id,
    }
  });

  // Trip
  await prisma.trip.create({
    data: {
      driverId: driver.id,
      vehicleId: vehicle.id,
      departureHotpointId: kgl.id,
      destinationHotpointId: rub.id,
      departureDate: new Date().toISOString().slice(0, 10),
      departureTime: '09:00',
      seatsAvailable: 28,
      pricePerSeat: 5000,
      paymentMethods: ['cash', 'mobile_money'],
    }
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
