# Online Payment Flow Guide

## Current Implementation

### Frontend Flow

1. **Booking Page** (`/dashboard/booking/schedule-seat-booking`)
   - User selects seats
   - Enters customer info
   - Clicks "Pay Online (Zainpay)" button

2. **Online Payment Modal** (`OnlinePaymentModal.tsx`)
   - Collects booking payload (seats, customer name, email, etc.)
   - Calls backend: `POST /bookings/online-schedule-ticket`
   - Expected response structure:
     ```json
     {
       "success": true,
       "data": {
         "code": "KCM-EHBK040",           // Booking code
         "id": 40,                        // Booking ID
         "dueamount": 1000,              // Amount to pay
         "qr_code": "qr_69877ff4398e...", // QR code for ticket
         "data": "https://zainpay.url",  // Optional: Real payment gateway URL
         "booking_seats": [...],
         "schedule": {...}
       }
     }
     ```

3. **Payment Gateway** (`/zainpay-payment`)
   - Shows Zainpay form (Card or Bank Transfer)
   - For demo: Accepts test card/bank details
   - For production: Redirects to real Zainpay API
   - On success: Redirects to `/zainpay-callback?reference={payment_ref}`
   - Reference used: `booking_code` or `payment_ref` from booking response

4. **Payment Callback** (`/zainpay-callback`)
   - Receives payment reference from Zainpay redirect
   - Calls backend: `GET /bookings/verify-payment/{payment_ref}` to verify payment
   - If approved: Shows success message with booking details and QR code
   - If failed: Shows error with troubleshooting tips
   - Provides "Redirect to Dashboard" button to return to merchant site
   - Transaction details displayed: reference, amount, timestamp

5. **Legacy Payment Status Page** (`/payment-status`)
   - Alternative verification page (kept for backward compatibility)
   - Can be accessed directly if needed

---

## Callback Flow Architecture (Recommended)

**URL Pattern:**
```
/zainpay-callback?reference={PAYMENT_REF}&status=success&amount={AMOUNT}&paymentMethodId={METHOD_ID}
```

**Page Behavior:**
1. Receives payment reference from Zainpay redirect
2. Calls `GET /bookings/verify-payment/{payment_ref}` to verify payment status
3. Shows appropriate state:

   **Success (Status = "Approved"):**
   - Transaction Successful page
   - Displays transaction details (reference, amount, timestamp)
   - Shows complete booking details (code, seat, movie, hall)
   - Displays QR code for check-in
   - "Go to Dashboard" button
   - "Print Ticket" button

   **Error (Status ≠ "Approved"):**
   - Payment Verification Failed page
   - Shows error message
   - Displays payment reference for customer support
   - Troubleshooting tips (check bank account, wait and retry, contact support)
   - "Try Again" button for retry
   - "Go to Dashboard" button

**Why Callback Approach?**
- Matches standard payment gateway workflows
- Zainpay redirects directly to confirmation page
- Single point of verification after payment
- Professional user experience
- Clear transaction tracking

---

## Backend Requirements

### Endpoint 1: `/bookings/online-schedule-ticket` (POST)

**Purpose:** Create a booking and initiate online payment

**Request:**
```json
{
  "schedule_id": 6,
  "customer_id": 3,
  "booking_seats": [44],
  "booking_seat_numbers": ["E6"],
  "walkin_customer_name": "John Doe",
  "walkin_customer_no": "0801234567",
  "walkin_customer_email": "john@example.com",
  "hall_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 40,
    "code": "KCM-EHBK040",
    "booking_code": "KCM-EHBK040",
    "dueamount": 1000,
    "status": "Pending",
    "qr_code": "qr_69877ff4398e6cf1c95f8",
    "data": "https://zainpay.com/pay?ref=ZP-12345",  // Real gateway URL
    "booking_seats": [...],
    "schedule": {...}
  },
  "message": "Booking created. Redirect to Zainpay."
}
```

---

### Endpoint 2: `/bookings/verify-payment/{transactionId}` (GET)

**Purpose:** Verify payment and return booking details

**Parameters:**
- `transactionId`: Can be:
  - Booking code (e.g., "KCM-EHBK040")
  - Payment transaction ID from Zainpay
  - Payment reference ID

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "status": "Approved",
    "code": "KCM-EHBK040",
    "booking_code": "KCM-EHBK040",
    "seat_label": "E6",
    "movie_title": "Fast and Furious 6",
    "hall_name": "Kcm cinema B",
    "qr_code": "qr_69877ff4398e6cf1c95f8",
    "number_of_seats": 1,
    "dueamount": 1000
  }
}
```

**Response (Not Found/Pending):**
```json
{
  "success": false,
  "data": null,
  "message": "Booking not found or payment not yet verified."
}
```

---

## Common Issues & Solutions

### Issue: "Booking not created" Error

**Cause:** Backend didn't return booking code in response

**Solution:** 
- Ensure `/bookings/online-schedule-ticket` returns `code` or `booking_code`
- Check backend validation of seat IDs and customer data

---

### Issue: "Payment verification failed" at Status Page

**Possible Causes:**
1. **transactionId doesn't match** → Verify endpoint expects different format
2. **Payment not marked as completed** → Backend needs to confirm payment with Zainpay
3. **Booking not found** → Still using old transactionId format

**Solutions:**
- Use booking `code` or `id` as the transactionId parameter
- Verify payment status with Zainpay API before marking as "Approved"
- Log what transactionId format the backend expects

---

## Testing Checklist

- [ ] Create booking via `/bookings/online-schedule-ticket`
- [ ] Verify response contains `code`, `dueamount`, `qr_code`
- [ ] Navigate to Zainpay payment form with correct amount
- [ ] Complete test payment (card or bank transfer)
- [ ] Verify callback page receives payment reference
- [ ] Verify `/bookings/verify-payment/{ref}` returns booking with "Approved" status
- [ ] Display ticket with booking code and QR code on callback page
- [ ] Test error scenarios (failed payment, pending status)

---

## Production Integration Notes

### Zainpay Callback Setup

1. **Configure Zainpay Callback URL**
   - Set in Zainpay merchant dashboard: `https://yourdomain.com/zainpay-callback`
   - Ensure HTTPS and valid SSL certificate
   - Zainpay will POST/redirect with: `?reference={payment_ref}&status=success/failed`

2. **Backend Integration**
   - `/bookings/online-schedule-ticket` should:
     - Create booking with status "Processing"
     - Return Zainpay redirect URL in `data.data` field
     - Store `payment_method_id` with booking
   
   - `/bookings/verify-payment/{payment_ref}` should:
     - Query Zainpay API for payment status
     - If payment successful: Update booking to "Approved"
     - Return booking details with status and QR code

3. **Payment Verification Flow**
   - Frontend creates booking → Gets payment URL
   - User redirected to Zainpay → Completes payment
   - Zainpay redirects to `/zainpay-callback?reference={ref}`
   - Callback page verifies with backend
   - Backend queries Zainpay webhook/API to confirm payment
   - Show success/failure to user

4. **Webhook Integration (Optional)**
   - Implement webhook endpoint for Zainpay to notify on payment completion
   - Updates booking status without user interaction

5. **Additional Features**
   - Email notifications with ticket and QR code
   - SMS alerts (optional)
   - Refund handling for cancelled bookings
   - Payment reconciliation reports

---

## API Contract Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bookings/online-schedule-ticket` | POST | Create booking & get payment URL |
| `/bookings/verify-payment/{ref}` | GET | Verify payment & return ticket |
| `/bookings/counter-schedule-ticketing` | POST | Offline counter booking (existing) |
| `POST /bookings/online-schedule-ticket` expects status `Accepted` on booking_seats |
