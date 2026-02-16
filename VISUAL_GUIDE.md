# 🎬 Implementation Complete - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PROGRAM DETAIL PAGE                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Program: Avengers Endgame                          │   │
│  │ Category: Action | Duration: 3h 2m                 │   │
│  │                                                     │   │
│  │ [Back] [⋮] [Edit] [Upload Photos]                 │   │
│  │                                                     │   │
│  │ [🎬 Book Schedule Seats] [Create Schedule]        │   │
│  │ [View Schedules]                                    │   │
│  │                                                     │   │
│  │ [Gallery Images...]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                        ↓ (Click Button)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        SCHEDULE SELECTION MODAL                    │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │ Select a Schedule                            │  │   │
│  │  │ [▼ Evening Screening - 2024-02-15 18:00]    │  │   │
│  │  │                                              │  │   │
│  │  │ [Proceed to Seat Booking]                    │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│         BOOKING PAGE: /booking/schedule-seat-booking         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Cinema Booking System          [Step 1 of 3]│   │
│  │                                                     │   │
│  │  📋 Step 1: Your Information                       │   │
│  │                                                     │   │
│  │  Full Name *                                        │   │
│  │  [John Doe                                    ]    │   │
│  │                                                     │   │
│  │  Phone Number *                                     │   │
│  │  [0123456789                                  ]    │   │
│  │                                                     │   │
│  │  Email Address *                                    │   │
│  │  [john@example.com                            ]    │   │
│  │                                                     │   │
│  │              [Continue to Seat Selection]          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│         BOOKING PAGE: Step 2 of 3 - SEAT SELECTION          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🎬 Step 2: Select Your Seats                      │   │
│  │                                                     │   │
│  │  ≈≈≈≈≈≈≈≈≈≈≈ CINEMA SCREEN ≈≈≈≈≈≈≈≈≈≈≈           │   │
│  │                                                     │   │
│  │  A  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]     │   │
│  │  B  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]     │   │
│  │  C  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]     │   │
│  │  D  [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]     │   │
│  │                                                     │   │
│  │  Legend:                                            │   │
│  │  [Blue] Available  [Yellow] Selected  [Red] Booked │   │
│  │                                                     │   │
│  │  Selected Seats: A1, A2, A3 (3 seats)              │   │
│  │                                                     │   │
│  │  [Clear Selection]     [Confirm Seats]             │   │
│  │  [← Back to Information]                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│         BOOKING PAGE: Step 3 of 3 - CONFIRMATION            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓ Step 3: Confirm Your Booking                   │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │ Full Name         │ John Doe                  │ │   │
│  │  │ Phone Number      │ 0123456789                │ │   │
│  │  │ Email Address     │ john@example.com          │ │   │
│  │  │                                               │ │   │
│  │  │ Selected Seats    │ [A1] [A2] [A3]            │ │   │
│  │  │                   │ 3 seats selected          │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  │                                                     │   │
│  │  [← Change Seats]       [Confirm Booking ✓]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ✅ Booking submitted successfully!                        │
│  Your confirmation has been sent to your email.             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              POST /bookings/book-schedule-seat               │
│                                                               │
│  REQUEST BODY:                                               │
│  {                                                            │
│    "schedule_id": 1,                                         │
│    "customer_id": 1,                                         │
│    "walkin_customer_name": "John Doe",                      │
│    "walkin_customer_no": "0123456789",                      │
│    "walkin_customer_email": "john@example.com",             │
│    "booking_seats": [1, 2, 3]                               │
│  }                                                            │
│                                                               │
│  RESPONSE:                                                    │
│  {                                                            │
│    "success": true,                                          │
│    "message": "Booking created successfully",               │
│    "data": { "id": 123, ... }                               │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── ProgramDetailsPage [id]
│   ├── Button: "Book Schedule Seats"
│   └── Modal (Schedule Selection)
│       └── Form.Select (schedule dropdown)
│           └── Redirects to ScheduleSeatBooking
│
└── ScheduleSeatBookingPage
    ├── State: BookingState
    ├── currentStep: "customer" | "seats" | "confirm"
    │
    ├── Step 1: Customer Form
    │   ├── Input: walkin_customer_name
    │   ├── Input: walkin_customer_no
    │   ├── Input: walkin_customer_email
    │   └── Button: Continue to Seat Selection
    │
    ├── Step 2: Seat Selection
    │   └── SeatGrid Component
    │       ├── Fetches from /seats/get-seats-by-hall/{hallId}
    │       ├── Displays seat rows with buttons
    │       ├── Tracks selectedSeats state
    │       └── Button: Confirm Seats
    │
    └── Step 3: Confirmation
        ├── Display: All booking info
        ├── Display: Selected seats as badges
        └── Button: Confirm Booking
            └── POST to /bookings/book-schedule-seat
```

---

## State Management Flow

```
Initial State
↓
┌─────────────────────────────────────────┐
│ bookingData = {                          │
│   schedule_id: null,                    │
│   customer_id: null,                    │
│   walkin_customer_name: "",             │
│   walkin_customer_no: "",               │
│   walkin_customer_email: "",            │
│   booking_seats: [],                    │
│   hall_id: null                         │
│ }                                        │
└─────────────────────────────────────────┘
↓
Stage 1: URL Params Loaded
↓
┌─────────────────────────────────────────┐
│ bookingData = {                          │
│   schedule_id: 1,  ← From URL            │
│   customer_id: 1,  ← From URL            │
│   walkin_customer_name: "",             │
│   walkin_customer_no: "",               │
│   walkin_customer_email: "",            │
│   booking_seats: [],                    │
│   hall_id: 2       ← From URL            │
│ }                                        │
└─────────────────────────────────────────┘
↓
Stage 2: User Fills Customer Form
↓
┌─────────────────────────────────────────┐
│ bookingData = {                          │
│   schedule_id: 1,                       │
│   customer_id: 1,                       │
│   walkin_customer_name: "John Doe",     │
│   walkin_customer_no: "0123456789",     │
│   walkin_customer_email: "john@...",    │
│   booking_seats: [],                    │
│   hall_id: 2                            │
│ }                                        │
└─────────────────────────────────────────┘
↓
Stage 3: User Selects Seats
↓
┌─────────────────────────────────────────┐
│ bookingData = {                          │
│   schedule_id: 1,                       │
│   customer_id: 1,                       │
│   walkin_customer_name: "John Doe",     │
│   walkin_customer_no: "0123456789",     │
│   walkin_customer_email: "john@...",    │
│   booking_seats: [1, 2, 3],  ← Updated  │
│   hall_id: 2                            │
│ }                                        │
└─────────────────────────────────────────┘
↓
Stage 4: Submit Booking
↓
POST /bookings/book-schedule-seat
Complete JSON payload → Success ✅
```

---

## Button States & Actions

```
Program Detail Page
│
├─ "Book Schedule Seats" (Green, enabled when hall active)
│  └─ OnClick: Fetch schedules, show modal
│
     Schedule Selection Modal
     │
     ├─ Dropdown (enabled if schedules exist)
     │
     └─ "Proceed to Seat Booking" (Green)
        └─ Onclick: Navigate to booking page with params
        │
        └─ /booking/schedule-seat-booking
           │
           Step 1: Customer Form
           │
           ├─ "Continue to Seat Selection" (Primary Blue)
           │  └─ Enabled when all fields valid
           │     Onclick: Validate form → Next step
           │
           Step 2: Seat Selection
           │
           ├─ "Clear Selection" (Secondary)
           │  └─ Disabled when no seats selected
           │     Onclick: Reset selectedSeats to []
           │
           ├─ "Confirm Seats" (Success Green)
           │  └─ Disabled when no seats selected
           │     Onclick: Move to confirmation
           │
           └─ "← Back to Information" (Secondary)
              └─ Onclick: Return to Step 1
              │
              Step 3: Confirmation
              │
              ├─ "← Change Seats" (Secondary)
              │  └─ Onclick: Return to Step 2
              │
              └─ "Confirm Booking ✓" (Success Green)
                 └─ Enabled always
                    Onclick: POST to API, show result
```

---

## Data Transformation Timeline

```
User starts booking
│
Step 1: Schedule Selected
├─ Extracted from database: id, hall_id, date, time
├─ Stored in state: schedule_id, hall_id
└─ Fetch seats for this hall
   │
   Step 2: Customer Info Entered
   ├─ User types: name, phone, email
   ├─ Validated: format checks, required fields
   ├─ Stored in state: walkin_customer_*
   └─ Ready for seat selection
      │
      Step 3: Seats Selected
      ├─ User clicks seats
      ├─ Tracking: [1, 2, 3] in selectedSeats
      ├─ Visual feedback: yellow highlighting
      ├─ Stored in state: booking_seats
      └─ Ready for confirmation
         │
         Step 4: Confirmation Reviewed
         ├─ Display all collected data
         ├─ Show seats with row+number
         ├─ User verifies everything
         └─ Ready for submission
            │
            Step 5: Submit to API
            ├─ Construct payload:
            │  {
            │    schedule_id: 1,
            │    customer_id: 1,
            │    walkin_customer_name: "John Doe",
            │    walkin_customer_no: "0123456789",
            │    walkin_customer_email: "john@example.com",
            │    booking_seats: [1, 2, 3]
            │  }
            │
            ├─ POST to /bookings/book-schedule-seat
            │
            └─ Response handling:
               ├─ Success: Toast notification, reset form
               └─ Error: Show error message, allow retry
```

---

## File Dependency Graph

```
program/program-list/details/[id]/page.tsx
    ↓ (imports)
    ├─ react components (Button, Modal, Form, etc.)
    ├─ react-icons (MdEventSeat)
    ├─ getApiClientInstance
    ├─ toast notifications
    └─ Fetches: /schedules/program/{id}
        │
        └─ Redirects to ↓
        
booking/schedule-seat-booking/page.tsx
    ↓ (imports)
    ├─ SeatGrid component
    ├─ react-bootstrap components
    ├─ getApiClientInstance
    ├─ toast notifications
    ├─ Fetches: /schedules/program/{id}
    ├─ Fetches: /seats/get-seats-by-hall/{id}
    └─ Posts: /bookings/book-schedule-seat
        │
        ├─ Uses ↓
        │
        └─ booking/schedule-seat-booking/seat-grid.tsx
            ├─ Fetches: /seats/get-seats-by-hall/{id}
            ├─ Imports: seat-grid.css
            ├─ react-bootstrap (Button, Spinner)
            ├─ react-icons (MdEventSeat)
            └─ Callback: onSeatsSelected(seatIds)
```

---

## Form Validation Rules

```
Customer Information Form
│
├─ Full Name
│  ├─ Type: text
│  ├─ Required: YES
│  ├─ Min length: 1
│  ├─ Max length: ∞
│  └─ Rule: Trim whitespace
│
├─ Phone Number
│  ├─ Type: tel
│  ├─ Required: YES
│  ├─ Min length: 1
│  ├─ Max length: ∞
│  └─ Rule: Any format accepted
│
└─ Email Address
   ├─ Type: email
   ├─ Required: YES
   ├─ Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   ├─ Error: "Please enter a valid email address"
   └─ Examples:
      ✅ user@domain.com
      ✅ john.doe@company.co.uk
      ❌ invalid@email
      ❌ user@domain
      ❌ @domain.com

Seat Selection
│
└─ Seats
   ├─ Type: array of integers
   ├─ Required: YES
   ├─ Min items: 1
   ├─ Max items: unlimited
   └─ Error: "Please select at least one seat"
```

---

## Error Handling Flow

```
User Action
    ↓
Try/Catch Block
    ├─ Try: Execute API call
    └─ Catch: Capture error
        ↓
    ├─ Is Axios error?
    │  └─ Extract: error.response.data.message
    │     └─ Display in toast
    │
    ├─ Is JavaScript error?
    │  └─ Extract: error.message
    │     └─ Display in toast
    │
    └─ Generic error
       └─ Display: "Failed to submit booking"

Validation Error
    ↓
Show Toast
    ├─ "Customer name is required"
    ├─ "Customer phone number is required"
    ├─ "Customer email is required"
    ├─ "Please enter a valid email address"
    └─ "Please select at least one seat"

API Error Response
    ↓
Show Toast with message
    ├─ "Schedule not found"
    ├─ "Seat already booked"
    ├─ "Invalid customer information"
    └─ "Server error. Please try again."

Success
    ↓
Show Toast: "✅ Booking confirmed successfully!"
    └─ Reset form and go back to Step 1
```

---

## Mobile Responsive Layout

```
Desktop (> 768px)
┌──────────────────────────────────────┐
│  Full width seat grid                │
│  Full width forms                    │
│  Side-by-side buttons                │
└──────────────────────────────────────┘

Tablet (769px - 1024px)
┌──────────────────────────────────────┐
│  75% width seat grid                 │
│  75% width forms                     │
│  Stacked buttons                     │
└──────────────────────────────────────┘

Mobile (< 768px)
┌──────────────────────────────────────┐
│  Full width seat grid                │
│  Scrollable horizontal               │
│  Full width forms                    │
│  Stacked buttons (100% width)        │
│  Smaller seat buttons (45px)         │
│  Reduced padding                     │
└──────────────────────────────────────┘
```

---

## API Response Examples

### Success Response
```
Status: 200
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 123,
    "schedule_id": 1,
    "customer_id": 1,
    "walkin_customer_name": "John Doe",
    "walkin_customer_no": "0123456789",
    "walkin_customer_email": "john@example.com",
    "booking_seats": [1, 2, 3],
    "status": "pending",
    "created_at": "2024-01-27T10:30:00Z"
  }
}
```

### Validation Error Response
```
Status: 422
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "walkin_customer_email": [
      "The email must be a valid email address"
    ],
    "booking_seats": [
      "At least one seat must be selected"
    ]
  }
}
```

### Server Error Response
```
Status: 500
{
  "success": false,
  "message": "An unexpected error occurred"
}
```

---

## Testing Workflow

```
1. Unit Testing
   ├─ Form validation logic
   ├─ State updates
   └─ Component rendering
   
2. Integration Testing
   ├─ Schedule fetching
   ├─ Seat grid display
   ├─ API submission
   └─ Error handling

3. E2E Testing
   ├─ Complete booking flow
   ├─ Form validation
   ├─ Seat selection
   └─ API submission

4. User Acceptance Testing
   ├─ UI/UX verification
   ├─ Cross-browser testing
   ├─ Mobile responsiveness
   └─ Performance testing
```

---

**Implementation Complete! Ready for Deployment.** ✅
