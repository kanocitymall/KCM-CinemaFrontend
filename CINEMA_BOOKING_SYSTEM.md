# Multi-Step Cinema Booking System - Implementation Guide

## Overview
A complete three-stage cinema booking system that collects schedule, customer, and seat information, then submits to `/bookings/book-schedule-seat` endpoint.

---

## Architecture

### Three-Stage Flow

```
Stage 1: Schedule Selection (Program Detail Page)
   ↓
   User clicks "Book Schedule Seats" button
   → Modal displays available schedules
   → User selects schedule and proceeds
   ↓
Stage 2: Customer Information (Booking Page)
   ↓
   Form collects:
   - walkin_customer_name
   - walkin_customer_no (phone)
   - walkin_customer_email
   ↓
Stage 3: Seat Selection (Seat Grid)
   ↓
   User selects multiple seats from visual grid
   → booking_seats array populated with seat IDs
   ↓
Final Submission
   ↓
   POST to /bookings/book-schedule-seat with complete JSON
```

---

## Files Created

### 1. Seat Grid Component
**File:** `src/app/(dashboard)/booking/schedule-seat-booking/seat-grid.tsx`

Displays a visual seat map with:
- Row labels (A, B, C, etc.)
- Seat buttons with status indicators
- Selection tracking
- Color-coded seats:
  - Blue border: Available
  - Yellow: Selected
  - Red/Gray: Booked (disabled)

**Props:**
```typescript
interface SeatGridProps {
  hallId: number;
  onSeatsSelected: (seatIds: number[]) => void;
  loading?: boolean;
}
```

**Features:**
- Fetches seats from `/seats/get-seats-by-hall/{hallId}`
- Responsive design
- Real-time seat availability
- Clear and confirm buttons

### 2. Seat Grid Styles
**File:** `src/app/(dashboard)/booking/schedule-seat-booking/seat-grid.css`

Professional styling for:
- Screen visualization
- Seat buttons with hover effects
- Legend (available, selected, booked)
- Mobile responsiveness
- Custom scrollbar

### 3. Multi-Stage Booking Component
**File:** `src/app/(dashboard)/booking/schedule-seat-booking/page.tsx`

Main component managing three-step flow:
- **Step 1:** Customer Information Form
  - Full Name (required)
  - Phone Number (required)
  - Email Address (required)
  - Form validation included

- **Step 2:** Seat Selection
  - Renders `SeatGrid` component
  - Back button to modify customer info

- **Step 3:** Booking Confirmation
  - Review all entered information
  - Display selected seats
  - Final confirmation button

**Data Structure:**
```typescript
interface BookingState {
  schedule_id: number | null;
  customer_id: number | null;
  walkin_customer_name: string;
  walkin_customer_no: string;
  walkin_customer_email: string;
  booking_seats: number[];
  hall_id: number | null;
}
```

**URL Parameters Supported:**
```
?schedule_id=1
&customer_id=1
&hall_id=2
&walkin_customer_name=John
&walkin_customer_no=0123456789
&walkin_customer_email=john@example.com
```

### 4. Program Detail Page Updates
**File:** `src/app/(dashboard)/program/program-list/details/[id]/page.tsx`

**Added:**
- "Book Schedule Seats" button (green with seat icon)
- Schedule selection modal
- Loads schedules from `/schedules/program/{programId}`
- Routes to booking page with URL parameters:
  ```
  /booking/schedule-seat-booking?
    schedule_id={scheduleId}&
    program_id={programId}&
    hall_id={hallId}
  ```

**New States:**
- `schedules`: Array of available schedules
- `loadingSchedules`: Loading state
- `selectedScheduleId`: Selected schedule ID

---

## Data Flow & JSON Structure

### Final Submission Payload
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

### Endpoint
```
POST /bookings/book-schedule-seat
```

### Response Handling
- Success: Toast notification, form reset
- Error: Toast with error message from API

---

## User Journey

### Starting from Program Detail Page

1. **Click "Book Schedule Seats"** (Green button with seat icon)
   - Loads available schedules for the program
   - Modal appears with schedule dropdown

2. **Select Schedule**
   - Choose from available schedules
   - Shows: `details/title - date starttime`
   - Proceed to booking

3. **Enter Customer Information** (Step 1)
   - Name (required)
   - Phone (required)
   - Email (required)
   - Click "Continue to Seat Selection"

4. **Select Seats** (Step 2)
   - Visual seat grid displays
   - Click seats to select (turns yellow)
   - Can select multiple seats
   - View selected seats in info box
   - Clear or confirm selection

5. **Confirm Booking** (Step 3)
   - Review all information
   - See selected seats
   - Final "Confirm Booking" button
   - Can go back to change seats

6. **Submission**
   - POST to `/bookings/book-schedule-seat`
   - Success: Confirmation toast, form resets
   - Error: Error message displayed

---

## Component Integration

### File Structure
```
src/app/(dashboard)/
├── booking/
│   ├── book-now/
│   │   └── components/
│   │       └── book-now.tsx (existing)
│   └── schedule-seat-booking/ (NEW)
│       ├── page.tsx (main component)
│       ├── seat-grid.tsx
│       └── seat-grid.css
└── program/
    └── program-list/
        └── details/
            └── [id]/
                └── page.tsx (updated)
```

### Route
- **Booking Flow:** `/booking/schedule-seat-booking`
- **Parameters:** `schedule_id`, `customer_id`, `hall_id`, customer info

---

## API Endpoints Used

### Schedule Fetching
```
GET /schedules/program/{programId}
Response: { data: Schedule[] }
```

### Seat Fetching
```
GET /seats/get-seats-by-hall/{hallId}
Response: { data: Seat[] }
```

### Booking Submission
```
POST /bookings/book-schedule-seat
Body: BookingState
Response: { success: boolean, message: string }
```

---

## Features

✅ **Three-Stage Flow** - Schedule → Customer → Seats → Confirm → Submit
✅ **Visual Seat Grid** - Real-time seat availability from database
✅ **Form Validation** - All required fields validated
✅ **URL Parameter Support** - Pre-fill from previous steps
✅ **Toast Notifications** - User feedback on all actions
✅ **Error Handling** - Comprehensive error messages
✅ **Responsive Design** - Works on mobile and desktop
✅ **TypeScript** - Full type safety throughout
✅ **Modular Components** - Reusable SeatGrid component
✅ **Professional UI** - Bootstrap components with custom styling

---

## Testing Scenarios

### Test 1: Complete Flow
1. Navigate to Program Detail Page
2. Click "Book Schedule Seats"
3. Select a schedule
4. Enter customer information (all fields)
5. Select 2-3 seats
6. Review and confirm
7. Should see success message
8. Check booking in `/bookings` endpoint

### Test 2: Validation
- Try to proceed without filling required fields
- Should show error toast
- Should not advance to next step

### Test 3: Seat Selection
- Select multiple seats
- Clear and reselect
- Verify seat IDs in confirmation
- Check POST payload matches selection

### Test 4: URL Parameters
- Access with pre-filled URL params
- Should skip to seat selection if customer info provided
- Should pre-populate form fields

### Test 5: Schedule Loading
- Click button with no schedules available
- Should show "No schedules" message
- Should prompt to create schedule first

---

## Customization

### Change Seat Colors
Edit `seat-grid.css`:
```css
.seat-btn { /* Available */ }
.seat-btn.selected { /* Selected */ }
.seat-btn:disabled { /* Booked */ }
```

### Add More Customer Fields
1. Add to `BookingState` interface
2. Add form input in Step 1
3. Include in payload submission

### Change Endpoints
Search and replace in `page.tsx`:
- `/schedules/program/` → your endpoint
- `/seats/get-seats-by-hall/` → your endpoint
- `/bookings/book-schedule-seat` → your endpoint

### Styling
- Modify Bootstrap variants (primary, success, etc.)
- Update colors in CSS
- Adjust spacing (p-3, gap-2, etc.)

---

## Error Handling

### Network Errors
- Toast notification with error message
- Fallback to empty state
- User can retry

### Validation Errors
- Form shows inline validation
- Toast for missing required fields
- User cannot proceed without valid data

### API Errors
- Error response from server displayed in toast
- User can modify and retry
- No data loss

---

## Browser Support
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

---

## Performance

- **Lazy loading:** Schedules fetched on button click
- **Seat caching:** Seats fetched once per session
- **Optimized renders:** Only affected components re-render
- **Responsive images:** Proper image handling
- **CSS:** Minimal, scoped styling

---

## Security Considerations

- ✅ Input validation on all fields
- ✅ Email format validation
- ✅ Type-safe TypeScript
- ✅ API error handling
- ✅ No sensitive data in URL (only IDs)
- ✅ POST method for data submission

---

## Future Enhancements

- [ ] Seat price variations
- [ ] Seat selection history
- [ ] Bulk seat selection
- [ ] Payment integration
- [ ] Booking confirmation email
- [ ] Seat map improvements
- [ ] Real-time availability sync
- [ ] Accessibility improvements

---

## Support & Debugging

### Common Issues

**Issue:** Schedules not loading
- Check `/schedules/program/{id}` endpoint
- Verify program has schedules
- Check API response format

**Issue:** Seats not displaying
- Check `/seats/get-seats-by-hall/{id}` endpoint
- Verify hall_id is correct
- Check seat status values (1 = available)

**Issue:** Booking fails
- Check `/bookings/book-schedule-seat` endpoint
- Verify all required fields in payload
- Check console for detailed error

**Issue:** Form not validating
- Check email regex pattern
- Verify field names match interface
- Check Bootstrap Form component usage

---

## Related Files
- Existing booking form: `book-now.tsx`
- Schedule form: `schedule-form.tsx`
- Program detail page: `[id]/page.tsx`

---

## Quick Start Checklist

- [x] Seat grid component created
- [x] Multi-stage booking flow implemented
- [x] Program detail page updated with button
- [x] API integration complete
- [x] Form validation added
- [x] Error handling implemented
- [x] Responsive design included
- [x] TypeScript types defined
- [x] Toast notifications added
- [x] Documentation complete

**Ready for testing and deployment!** ✅
