# QR Code PDF Download Implementation Guide

## Overview
This guide explains how to use the QR code PDF download functionality in the cinema booking system. It integrates with the `/bookings/schedule-bookings/{schedule_id}` API endpoint to fetch and download booking QR codes.

## Features

### 1. **Booking Detail Page** (`src/app/(dashboard)/booking/booking-list/details/[id]/page.tsx`)
- **Download Individual QR Code PDFs**: Click the "PDF" button next to each seat to download that seat's QR code as a PDF
- **Download All QR Codes**: Use the "Download All (PDF)" button in the header to download all seat QR codes in one PDF (4 per page)
- **PNG Ticket Download**: Click the download icon to get a PNG image of the ticket
- **Check-in Status Display**: Shows whether a ticket has been checked in

### 2. **Utility Functions** (`src/app/utils/ticketHelper.ts`)

#### `downloadSingleQRCodePDF(booking, seat, info)`
Downloads QR code for a single seat as PDF with:
- Booking code and seat information
- Customer name
- Price
- QR code display
- Check-in instructions

#### `downloadTicketsAsPDF(booking, bookingSeats, info)`
Downloads all booking seats as PDF with:
- 4 tickets per page in landscape format
- QR codes for each seat
- Booking details (code, seat label, price)
- Check-in status
- Seat information

#### `generateQRCodeImage(data)`
Generates a QR code as data URL for display or further processing.

#### `generateTicketCanvas(ticketData, info)`
Generates a canvas-based ticket for PNG export.

### 3. **Booking Service** (`src/app/utils/bookingService.ts`)

#### `fetchScheduleBookings(scheduleId, page)`
Fetches all bookings for a specific schedule:
```typescript
import { fetchScheduleBookings } from '@/app/utils/bookingService';

const response = await fetchScheduleBookings(6, 1); // GET /bookings/schedule-bookings/6?page=1
// Response includes:
// - schedule: { id, program_id, hall_id, details, date, starttime, endtime, prices, etc. }
// - bookings: { current_page, data: [...], last_page, total }
```

#### `fetchBookingDetails(bookingId)`
Fetches details for a single booking:
```typescript
import { fetchBookingDetails } from '@/app/utils/bookingService';

const response = await fetchBookingDetails(56);
// Returns booking with all booking_seats containing qr_code field
```

#### `checkInBookingSeat(qrCode)`
Marks a booking seat as checked in:
```typescript
import { checkInBookingSeat } from '@/app/utils/bookingService';

const result = await checkInBookingSeat('sqr_698a07f817fb6a55823c3');
```

### 4. **QR Code Display Component** (`src/app/(dashboard)/booking/components/QRCodeDisplay.tsx`)

Reusable component for displaying QR codes in modals or inline:
```typescript
import { QRCodeDisplay } from '@/app/(dashboard)/booking/components/QRCodeDisplay';

<QRCodeDisplay
  qrCodeValue="sqr_698a07f817fb6a55823c3"
  bookingCode="KCM-EHBK056"
  seatLabel="H6"
  customerName="Anas Muazu Abdullahi"
  price="1000.00"
  onDownloadPDF={async (qrValue) => {
    // Handle PDF download
  }}
  showModal={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

## API Response Structure

### GET `/bookings/schedule-bookings/{schedule_id}`

```json
{
  "success": true,
  "data": {
    "schedule": {
      "id": 6,
      "program_id": 5,
      "hall_id": 1,
      "details": "Newly Released Movies",
      "date": "2026-02-04",
      "starttime": "2026-02-04 21:00:00",
      "endtime": "2026-02-04 22:30:00",
      "regular_price": "1000.00",
      "vip_price": "2000.00",
      "status": "Scheduled"
    },
    "bookings": {
      "current_page": 1,
      "data": [
        {
          "id": 56,
          "schedule_id": 6,
          "code": "KCM-EHBK056",
          "number_of_seats": 1,
          "dueamount": "1000.00",
          "walkin_customer_name": "Anas Muazu Abdullahi",
          "walkin_customer_no": "09121507215",
          "walkin_customer_email": "binmaleek.ama@gmail.com",
          "status": "Approved",
          "booking_seats": [
            {
              "id": 71,
              "booking_id": 56,
              "seat_id": 65,
              "price": "1000.00",
              "qr_code": "sqr_698a07f817fb6a55823c3",
              "checkin_status": "checked_in",
              "seat": {
                "id": 65,
                "hall_id": 1,
                "seat_row": "H",
                "seat_number": 6,
                "label": "H6",
                "seat_type": "Regular"
              }
            }
          ]
        }
      ],
      "last_page": 1,
      "total": 7
    }
  }
}
```

## Implementation Examples

### Example 1: Display Booking with QR Code Downloads

```typescript
'use client';
import { BookingShowPage } from '@/app/(dashboard)/booking/booking-list/details/[id]/page';

// Already implemented with:
// - Individual QR Code PDF downloads per seat
// - Bulk PDF download for all seats
// - PNG ticket downloads
// - Check-in status display
```

### Example 2: Custom Schedule Bookings Page

```typescript
'use client';
import { useEffect, useState } from 'react';
import { fetchScheduleBookings } from '@/app/utils/bookingService';
import { downloadSingleQRCodePDF } from '@/app/utils/ticketHelper';

export default function ScheduleBookingsPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await fetchScheduleBookings(parseInt(params.id));
        setData(response);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [params.id]);

  const handleDownloadQR = async (booking, seat, schedule) => {
    await downloadSingleQRCodePDF(booking, seat, {
      companyName: 'Kano City Mall',
      date: schedule.date
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.bookings.data.map((booking) =>
        booking.booking_seats.map((seat) => (
          <button
            key={seat.id}
            onClick={() => handleDownloadQR(booking, seat, data.data.schedule)}
          >
            Download QR for {seat.seat.label}
          </button>
        ))
      )}
    </div>
  );
}
```

### Example 3: QR Code Modal Display

```typescript
import { useState } from 'react';
import { QRCodeDisplay } from '@/app/(dashboard)/booking/components/QRCodeDisplay';
import { downloadSingleQRCodePDF } from '@/app/utils/ticketHelper';

export function BookingSeatRow({ seat, booking, schedule }) {
  const [showQRModal, setShowQRModal] = useState(false);

  const handleDownloadQRPDF = async () => {
    await downloadSingleQRCodePDF(booking, seat, {
      companyName: 'Kano City Mall',
      date: schedule.date
    });
  };

  return (
    <>
      <button onClick={() => setShowQRModal(true)}>View QR Code</button>

      <QRCodeDisplay
        qrCodeValue={seat.qr_code}
        bookingCode={booking.code}
        seatLabel={seat.seat.label}
        customerName={booking.walkin_customer_name || booking.customer?.name}
        price={seat.price}
        onDownloadPDF={handleDownloadQRPDF}
        showModal={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </>
  );
}
```

## UI Components Added

### Booking Detail Page Updates
1. **Individual QR Code Download Buttons**: Green "PDF" button next to each seat
2. **Bulk Download Button**: "Download All (PDF)" in the seats header
3. **Check-in Status Display**: Shows ✓ or warning indicator
4. **QR Code Preview**: Displays truncated QR code string with hover tooltip

### Toast Notifications
- ✅ Success messages for successful downloads
- ❌ Error messages for failed operations
- ℹ️ Info messages during PDF generation

## Dependencies

The implementation uses these packages (already in `package.json`):
- `jspdf`: PDF generation
- `qrcode`: QR code generation
- `react-toastify`: Toast notifications
- `react-icons/io5`: Icon components

## File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── booking/
│   │       ├── booking-list/
│   │       │   └── details/
│   │       │       └── [id]/
│   │       │           └── page.tsx (UPDATED)
│   │       ├── components/
│   │       │   └── QRCodeDisplay.tsx (NEW)
│   │       └── chack-in/
│   │           └── cameraScanner.tsx
│   └── utils/
│       ├── ticketHelper.ts (NEW)
│       ├── bookingService.ts (NEW)
│       └── axios/
│           └── axios-client.ts
└── ...
```

## Next Steps

1. **Test the implementation** by navigating to a booking detail page
2. **Click the "PDF" buttons** to download individual QR code PDFs
3. **Use "Download All (PDF)"** to get all booking QR codes
4. **Integrate with check-in scanner** to verify QR codes match
5. **Add email delivery** of QR code PDFs to customers

## Troubleshooting

### QR Code not generating
- Ensure the `qr_code` field is populated from the API
- Check browser console for errors
- Verify QR code string format

### PDF download fails
- Check if browser allows downloads
- Verify PDF library is properly imported
- Check for CORS issues with API

### Modal not displaying
- Ensure Bootstrap CSS is imported
- Check z-index conflicts with other modals
- Verify component props are passed correctly
