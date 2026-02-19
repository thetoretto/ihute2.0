import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { getBookingsWithTickets } from '../services/adminData';
import { useAdminScope } from '../context/AdminScopeContext';
import type { BookingWithTicket } from '../services/adminData';

function downloadTicketPdf(booking: BookingWithTicket) {
  const doc = new jsPDF();
  const y = 20;
  doc.setFontSize(18);
  doc.text('ihute – Passenger Ticket', 20, y);
  doc.setFontSize(11);
  doc.text(`Ticket: ${booking.ticketNumber}`, 20, y + 10);
  doc.text(`Booking: ${booking.id}`, 20, y + 16);
  doc.text(`Passenger: ${booking.passenger.name}`, 20, y + 22);
  doc.text(`Route: ${booking.trip.departureHotpoint.name} → ${booking.trip.destinationHotpoint.name}`, 20, y + 28);
  doc.text(`Departure: ${booking.trip.departureTime}`, 20, y + 34);
  doc.text(`Seats: ${booking.seats}`, 20, y + 40);
  doc.text(`Payment: ${booking.paymentMethod}`, 20, y + 46);
  doc.text(`Amount: ${Number(booking.seats * booking.trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`, 20, y + 52);
  doc.save(`ticket-${booking.ticketNumber}.pdf`);
}

function downloadCsv(bookings: BookingWithTicket[]) {
  const headers = ['Ticket number', 'Booking ID', 'Passenger', 'Route', 'Departure', 'Seats', 'Amount'];
  const rows = bookings.map((b) => [
    b.ticketNumber ?? '',
    b.id,
    b.passenger.name,
    `${b.trip.departureHotpoint.name} → ${b.trip.destinationHotpoint.name}`,
    b.trip.departureTime,
    String(b.seats),
    `${Number(b.seats * b.trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TicketsPage() {
  const scope = useAdminScope();
  const [bookings, setBookings] = useState<BookingWithTicket[]>(() => getBookingsWithTickets(scope));

  useEffect(() => {
    setBookings([...getBookingsWithTickets(scope)]);
  }, [scope]);

  return (
    <section>
      <div className="header-row">
        <h2>Tickets</h2>
        <button type="button" className="btn-primary" onClick={() => downloadCsv(bookings)}>Export CSV</button>
      </div>
      <p className="subtle">Bookings with issued tickets. Download single PDF or export all as CSV.</p>
      <table>
        <thead>
          <tr>
            <th>Ticket number</th>
            <th>Booking</th>
            <th>Passenger</th>
            <th>Route</th>
            <th>Departure</th>
            <th>Seats</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.ticketNumber}</td>
              <td>{b.id}</td>
              <td>{b.passenger.name}</td>
              <td>{b.trip.departureHotpoint.name} → {b.trip.destinationHotpoint.name}</td>
              <td>{b.trip.departureTime}</td>
              <td>{b.seats}</td>
              <td>
                <span className={`tag tag-${b.paymentMethod === 'cash' ? 'a' : b.paymentMethod === 'mobile_money' ? 'b' : 'c'}`}>
                  {b.paymentMethod.replace('_', ' ')}
                </span>
                {' '}
                {Number(b.seats * b.trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF
              </td>
              <td>
                <button type="button" className="btn-sm btn-primary" onClick={() => downloadTicketPdf(b)}>Download PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
