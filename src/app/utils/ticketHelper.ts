"use client";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// --- Restored Interfaces (Fixes your TS Errors) ---
export interface SeatInfo {
  id: number;
  label: string;
  seat_row: string;
  seat_number: number;
  seat_type: string;
}

export interface BookingSeat {
  id: number;
  price: string;
  status: string;
  qr_code?: string;
  seat: SeatInfo;
  checkin_status?: string;
}

export interface BookingInfo {
  id: number;
  code: string;
  number_of_seats: number;
  dueamount: string;
  booking_time: string;
  walkin_customer_name?: string;
  customer?: { name: string } | null;
  status: string;
  schedule: {
    details: string;
    date: string;
    starttime: string;
    endtime: string;
    hall_id?: number;
    hall_name?: string;
  };
  booking_seats: BookingSeat[];
}

export interface CompanyInfo {
  companyName: string;
  date: string;
  programName?: string; // optional override for schedule details
}

// --- Helper Functions ---

const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return 'N/A';
  const timePart = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
  const match = timePart.match(/(\d{2}):(\d{2})/);
  if (!match) return timePart;
  
  const h24 = parseInt(match[1]);
  const mins = match[2];
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${h12}:${mins}${period}`;
};

// --- Main Exports ---

/**
 * Downloads booking seats as a Thermal-style PDF
 */
export const downloadTicketsAsPDF = async (
  booking: BookingInfo, 
  bookingSeats: BookingSeat[], 
  info: CompanyInfo
): Promise<void> => {
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [200, 100] });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentMargin = 15;

    for (let i = 0; i < bookingSeats.length; i++) {
      const seat = bookingSeats[i];
      if (i > 0) doc.addPage([200, 100]);

      // Dashed Border
      doc.setLineDashPattern([2, 2], 0);
      doc.setDrawColor(0);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      doc.setLineDashPattern([], 0);

      let y = 12;

      // Header - 🎬 COMPANY + BOOKING TICKET
      doc.setFont('courier', 'normal');
      doc.setFontSize(20);
      // use company info if provided
      if (info?.companyName) {
        doc.text(info.companyName, pageWidth / 2, y, { align: 'center' });
        y += 5;
      }
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text('BOOKING TICKET', pageWidth / 2, y, { align: 'center' });
      
      y += 6;
      doc.setLineDashPattern([1, 1], 0);
      doc.line(contentMargin, y, pageWidth - contentMargin, y);
      doc.setLineDashPattern([], 0);
      
      y += 6;

      // Details Section - matching the card above
      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      
      const customerName = booking.walkin_customer_name || booking.customer?.name || 'GUEST';
      const hallName = booking.schedule?.hall_name || (booking.schedule?.hall_id ? `Hall ${booking.schedule.hall_id}` : 'N/A');
      const seatLabel = seat.seat?.label || 'N/A';
      const dateValue = booking.schedule?.date || 'N/A';
      const priceValue = Number(seat.price || 0).toLocaleString('en-NG');
      
      // Customer
      doc.setFont('courier', 'bold');
      doc.text('Customer:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(customerName, contentMargin + 25, y);
      y += 4;
      
      // Booking Code
      doc.setFont('courier', 'bold');
      doc.text('Booking:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(booking.code ?? 'N/A', contentMargin + 25, y);
      y += 4;
      
      // Program/Show - use schedule.details if available
      // determine program name: prefer explicit override from CompanyInfo
      let programName = info.programName || 'N/A';
      if (!programName || programName.toLowerCase() === 'n/a') {
        // fallback to schedule.details unless it's null or literal 'null'
        if (booking.schedule?.details && booking.schedule.details.toLowerCase() !== 'null') {
          programName = booking.schedule.details;
        }
      }
      doc.setFont('courier', 'bold');
      doc.text('Program:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(programName, contentMargin + 25, y);
      y += 4;
      
      // Hall
      doc.setFont('courier', 'bold');
      doc.text('Hall:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(hallName, contentMargin + 25, y);
      y += 4;
      
      // Seat
      doc.setFont('courier', 'bold');
      doc.text('Seat:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(seatLabel, contentMargin + 25, y);
      y += 4;
      
      // Price
      doc.setFont('courier', 'bold');
      doc.text('Price:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(priceValue, contentMargin + 25, y);
      y += 4;
      
      // Date
      doc.setFont('courier', 'bold');
      doc.text('Date:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(dateValue, contentMargin + 25, y);
      y += 4;
      
      // Start Time
      const startTime = formatTo12Hour(booking.schedule?.starttime || '');
      doc.setFont('courier', 'bold');
      doc.text('Start:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(startTime, contentMargin + 25, y);
      y += 4;

      // End Time
      const endTime = formatTo12Hour(booking.schedule?.endtime || '');
      doc.setFont('courier', 'bold');
      doc.text('End:', contentMargin, y);
      doc.setFont('courier', 'normal');
      doc.text(endTime, contentMargin + 25, y);
      y += 6;

      // QR Code - centered
      if (seat.qr_code) {
        const qrCodeDataUrl = await QRCode.toDataURL(seat.qr_code, { margin: 1 });
        const qrSize = 20;
        doc.addImage(qrCodeDataUrl, 'PNG', (pageWidth - qrSize) / 2, y, qrSize, qrSize);
      }
    }

    doc.save(`${booking.code}-tickets.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
  }
};

/**
 * Downloads a single seat QR code as PDF
 */
export const downloadSingleQRCodePDF = async (
  booking: BookingInfo, 
  seat: BookingSeat, 
  info: CompanyInfo
): Promise<void> => {
  await downloadTicketsAsPDF(booking, [seat], info);
};

/**
 * Generates an image data URL for a single ticket canvas
 */
export const generateTicketCanvas = async (
  ticketData: { name?: string; qr_code?: string }, 
  info: CompanyInfo
): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(info.companyName, canvas.width / 2, 40);

  return canvas.toDataURL('image/png');
};

/**
 * Generates a QR code image data URL
 */
export const generateQRCodeImage = async (data: string): Promise<string> => {
  return await QRCode.toDataURL(data, { width: 250, margin: 2 });
};

