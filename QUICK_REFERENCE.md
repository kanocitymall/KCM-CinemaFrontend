# Quick Reference - Cinema Booking System

## 🎯 What Was Built

A complete three-stage cinema booking system with:
- Schedule selection (Program Detail Page)
- Customer information collection
- Visual seat grid selection
- Single JSON submission to `/bookings/book-schedule-seat`

---

## 🚀 How to Use

### From Program Detail Page
1. Click **"Book Schedule Seats"** button (green with seat icon)
2. Select a schedule from dropdown
3. Click **"Proceed to Seat Booking"**
4. Enter customer info (Name, Phone, Email)
5. Click **"Continue to Seat Selection"**
6. Click seats to select (turn yellow)
7. Click **"Confirm Seats"**
8. Review information
9. Click **"Confirm Booking"**
10. See success message

---

## 📁 Files Created

```
src/app/(dashboard)/booking/schedule-seat-booking/
├── page.tsx .......................... Main booking flow component
├── seat-grid.tsx ..................... Seat selection component
└── seat-grid.css ..................... Seat grid styling
```

---

## 📋 Data Structure

**Final JSON submitted to `/bookings/book-schedule-seat`:**

```json
{
  "schedule_id": 1,
  "customer_id": 1,
  "walkin_customer_name": "John Doe",
  "walkin_customer_no": "0123456789",
  "walkin_customer_email": "john@example.com",
  "booking_seats": [1, 2, 3]
}
```

---

## 🔗 URL Parameters

Accessing booking page with pre-filled data:

```
/booking/schedule-seat-booking?
  schedule_id=1&
  customer_id=1&
  hall_id=2&
  walkin_customer_name=John&
  walkin_customer_no=0123456789&
  walkin_customer_email=john@example.com
```

---

## 🎨 User Interface

### Stage 1: Customer Information
- Text input: Full Name
- Text input: Phone Number  
- Email input: Email Address
- Button: "Continue to Seat Selection"

### Stage 2: Seat Selection
- Visual seat grid with rows (A, B, C, etc.)
- Available: Blue border
- Selected: Yellow background
- Booked: Red/Gray (disabled)
- Legend showing seat status
- Button: "Confirm Seats"

### Stage 3: Confirmation
- Review customer info
- Display selected seats as badges
- Button: "Confirm Booking" (final submit)

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/schedules/program/{id}` | Fetch program schedules |
| GET | `/seats/get-seats-by-hall/{id}` | Fetch hall seats |
| POST | `/bookings/book-schedule-seat` | Submit booking |

---

## ✅ Validation

- **Name:** Required, min 1 character
- **Phone:** Required, min 1 character
- **Email:** Required, must be valid email format
- **Seats:** At least 1 seat must be selected

---

## 🎯 Seat Colors

| Color | Meaning | Action |
|-------|---------|--------|
| Blue | Available | Clickable |
| Yellow | Selected | Click to deselect |
| Red/Gray | Booked | Disabled |

---

## 📱 Responsive Design

- ✅ Mobile devices
- ✅ Tablets
- ✅ Desktop screens
- ✅ Small screens (<768px)

---

## 🐛 Troubleshooting

### Schedules not showing
→ Check `/schedules/program/{id}` endpoint
→ Verify program has schedules created

### Seats not displaying
→ Check `/seats/get-seats-by-hall/{id}` endpoint
→ Ensure hall_id is passed correctly

### Booking fails to submit
→ Check browser console for error
→ Verify all fields are filled
→ Check `/bookings/book-schedule-seat` endpoint

### Form validation not working
→ Try valid email format: user@domain.com
→ Ensure all required fields have values

---

## 🔧 Customization

### Change button colors
In `page.tsx`, modify `variant` prop:
```tsx
<Button variant="success">  // Change to: primary, danger, warning, etc.
```

### Add more customer fields
1. Add to form in Stage 1
2. Add to `BookingState` interface
3. Include in payload submission

### Customize seat layout
Edit `seat-grid.tsx`:
- Adjust button size: `width: 50px`
- Adjust spacing: `gap: 0.75rem`
- Change rows per screen: modify flex-wrap

---

## 📊 Testing

### Test Case 1: Happy Path
1. Book schedule seats
2. Fill all fields correctly
3. Select seats
4. Confirm booking
5. ✅ Should succeed

### Test Case 2: Validation
1. Try to skip customer info
2. ✅ Should show error
3. Try to confirm with blank email
4. ✅ Should show validation error

### Test Case 3: Seat Selection
1. Select 5 seats
2. Clear and select 2
3. Confirm
4. ✅ Should show only 2 in submission

---

## 🚀 Deployment Checklist

- [x] All files created
- [x] No TypeScript errors
- [x] Routes configured
- [x] API endpoints ready
- [x] Form validation working
- [x] Responsive design tested
- [x] Toast notifications working
- [x] Error handling complete

**Ready to deploy!** 🎉

---

## 📚 Related Documentation

- See: `CINEMA_BOOKING_SYSTEM.md` for detailed guide
- Program detail page: `src/app/(dashboard)/program/program-list/details/[id]/page.tsx`
- Existing booking: `src/app/(dashboard)/booking/book-now/components/book-now.tsx`

---

## 💡 Tips

**Pre-fill from URL:**
```
Instead of filling form manually, pass URL params:
/booking/schedule-seat-booking?walkin_customer_name=John&...
```

**Direct seat selection:**
```
Skip to seats by providing customer data in URL
System detects and shows seat selection directly
```

**Mobile optimization:**
```
All components are mobile-responsive
Seat grid adjusts on smaller screens
Touch-friendly button sizes
```

---

## 🆘 Support

### Issue: Can't navigate to booking page
→ Check program detail page has the button
→ Verify route `/booking/schedule-seat-booking` exists

### Issue: Selected seats not showing in confirmation
→ Check `booking_seats` in state
→ Verify seat IDs are being captured

### Issue: API returns error
→ Check response format matches expectations
→ Verify all required fields in payload
→ Log response in browser console

---

## ✨ Features Included

✅ Three-stage booking flow
✅ Visual seat grid with real-time availability
✅ Form validation on all inputs
✅ Professional error messages
✅ Toast notifications
✅ Mobile responsive design
✅ Full TypeScript support
✅ URL parameter support
✅ Back navigation between steps
✅ Seat selection confirmation
✅ Loading states during API calls
✅ Accessible HTML structure

---

**Happy Booking! 🎬**
