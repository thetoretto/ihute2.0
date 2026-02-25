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

  const th = 'pb-4 text-[10px] uppercase font-black text-muted tracking-widest text-left';
  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-soft">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-dark">Tickets</h3>
        <button type="button" className="px-4 py-2 bg-primary text-dark rounded-xl font-bold text-sm" onClick={() => downloadCsv(bookings)}>Export CSV</button>
      </div>
      <p className="text-muted text-sm mb-6">Bookings with issued tickets. Download single PDF or export all as CSV.</p>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface">
              <th className={th}>Ticket number</th>
              <th className={th}>Booking</th>
              <th className={th}>Passenger</th>
              <th className={th}>Route</th>
              <th className={th}>Departure</th>
              <th className={th}>Seats</th>
              <th className={th}>Amount</th>
              <th className={th}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface">
            {bookings.map((b) => (
              <tr key={b.id} className="group hover:bg-surface/50 transition-colors">
                <td className="py-5 font-medium text-sm">{b.ticketNumber}</td>
                <td className="py-5 text-sm">{b.id}</td>
                <td className="py-5 font-bold text-sm">{b.passenger.name}</td>
                <td className="py-5 text-sm">{b.trip.departureHotpoint.name} → {b.trip.destinationHotpoint.name}</td>
                <td className="py-5 text-sm">{b.trip.departureTime}</td>
                <td className="py-5 text-sm">{b.seats}</td>
                <td className="py-5">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[11px] font-bold mr-1 ${b.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : b.paymentMethod === 'mobile_money' ? 'bg-blue-100 text-blue-700' : 'bg-soft text-dark'}`}>
                    {b.paymentMethod.replace('_', ' ')}
                  </span>
                  {Number(b.seats * b.trip.pricePerSeat).toLocaleString('en-RW', { maximumFractionDigits: 0 })} RWF
                </td>
                <td className="py-5">
                  <button type="button" className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-dark" onClick={() => downloadTicketPdf(b)}>Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
