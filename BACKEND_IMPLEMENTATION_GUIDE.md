# Backend API Implementation Guide

## Current Status

The **frontend** is fully implemented and ready. The following **backend endpoints** still need to be implemented for the booking system to work with real data.

---

## Required Backend Endpoints

### 1. ❌ GET `/bookings/schedules`

**Status:** Not implemented (404)

**Purpose:** Fetch all schedules with pagination and filtering for schedule list page

**Request:**
```
GET /api/v1/bookings/schedules?page=1&status=All
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Schedules retrieved successfully",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "program_id": 1,
        "hall_id": 1,
        "date": "2026-01-28",
        "starttime": "14:00:00",
        "endtime": "17:00:00",
        "regular_price": "2000",
        "vip_price": "3500",
        "status": "Scheduled",
        "program": {
          "title": "Avengers Endgame",
          "duration": "3h 2m"
        },
        "hall": {
          "name": "Cinema Hall 1"
        }
      }
    ],
    "last_page": 1
  }
}
```

**Implementation Notes:**
- Paginate results (20 per page)
- Filter by status if provided
- Include nested program and hall relationships
- Return timestamps as strings (time format: HH:mm:ss)
- Regular and VIP prices as strings

---

### 2. ❌ GET `/schedules/program/{programId}`

**Status:** Not implemented (404)

**Purpose:** Fetch all schedules for a specific program (for booking flow)

**Request:**
```
GET /api/v1/schedules/program/1
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Schedules retrieved successfully",
  "data": [
    {
      "id": 1,
      "program_id": 1,
      "title": "Avengers Endgame - Evening Show",
      "details": "Evening Screening",
      "date": "2026-01-28",
      "starttime": "18:00",
      "endtime": "21:00",
      "price": 2500,
      "available_seats": 45,
      "hall_id": 1,
      "capacity": 100,
      "status": 1,
      "created_at": "2025-12-01T10:00:00Z"
    },
    {
      "id": 2,
      "program_id": 1,
      "title": "Avengers Endgame - Matinee",
      "details": "Afternoon Screening",
      "date": "2026-01-28",
      "starttime": "14:00",
      "endtime": "17:00",
      "price": 2000,
      "available_seats": 30,
      "hall_id": 1,
      "capacity": 100,
      "status": 1,
      "created_at": "2025-12-01T10:00:00Z"
    }
  ]
}
```

**Implementation Notes:**
- Filter schedules by `program_id`
- Include `hall_id` (required for seat fetching)
- Include `available_seats` count
- Return schedules sorted by date and time
- Only active schedules (status = 1)

---

### 3. ❌ GET `/seats/get-seats-by-hall/{hallId}`

**Status:** Not implemented (404)

**Purpose:** Fetch all seats in a specific cinema hall with availability status

**Request:**
```
GET /api/v1/seats/get-seats-by-hall/1
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Seats retrieved successfully",
  "data": {
    "data": [
      {
        "id": 1,
        "hall_id": 1,
        "seat_row": "A",
        "seat_number": 1,
        "label": "A1",
        "seat_type": "standard",
        "status": 1
      },
      {
        "id": 2,
        "hall_id": 1,
        "seat_row": "A",
        "seat_number": 2,
        "label": "A2",
        "seat_type": "standard",
        "status": 0
      },
      {
        "id": 3,
        "hall_id": 1,
        "seat_row": "A",
        "seat_number": 3,
        "label": "A3",
        "seat_type": "standard",
        "status": 1
      }
    ]
  }
}
```

**Field Definitions:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique seat identifier |
| `hall_id` | integer | Which hall this seat belongs to |
| `seat_row` | string | Row letter (A, B, C, etc.) |
| `seat_number` | integer | Seat number in row (1, 2, 3, etc.) |
| `label` | string | Display label (e.g., "A1") |
| `seat_type` | string | Seat type: "standard", "vip", "handicap" |
| `status` | integer | 1 = Available, 0 = Booked |

**Implementation Notes:**
- Return ALL seats in the hall, not just available ones
- Frontend determines availability from `status` field
- Sort by `seat_row` and `seat_number` for proper grid display
- Response wrapped in `data.data` structure
- Include all seat types in response

---

### 3. ❌ POST `/bookings/book-schedule-seat`

**Status:** Not implemented (404)

**Purpose:** Create a new cinema seat booking

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "schedule_id": 1,
  "walkin_customer_name": "John Doe",
  "walkin_customer_no": "0123456789",
  "walkin_customer_email": "john@example.com",
  "booking_seats": [1, 2, 3]
}
```

**Optional Fields (if customer has account):**
```json
{
  "schedule_id": 1,
  "customer_id": 5,
  "walkin_customer_name": "John Doe",
  "walkin_customer_no": "0123456789",
  "walkin_customer_email": "john@example.com",
  "booking_seats": [1, 2, 3]
}
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 123,
    "schedule_id": 1,
    "customer_id": null,
    "walkin_customer_name": "John Doe",
    "walkin_customer_no": "0123456789",
    "walkin_customer_email": "john@example.com",
    "booking_seats": [1, 2, 3],
    "total_seats": 3,
    "total_amount": 7500,
    "status": "pending",
    "payment_status": "unpaid",
    "created_at": "2026-01-27T10:30:00Z"
  }
}
```

**Error Response (Validation Failed - 422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": [
    "One or more seats do not belong to the schedule hall."
  ]
}
```

**Validation Rules:**
- ✅ `schedule_id` is required and must exist
- ✅ `walkin_customer_name` is required (min 1 char)
- ✅ `walkin_customer_no` is required (min 1 char)
- ✅ `walkin_customer_email` is required (valid email format)
- ✅ `booking_seats` array must contain at least 1 seat ID
- ✅ All seat IDs must belong to the schedule's hall
- ✅ All seats must be available (not already booked)
- ✅ `customer_id` (if provided) must exist and be valid (> 0)

**Implementation Logic:**
1. Validate input data
2. Verify schedule exists and is active
3. Verify all seats exist and belong to schedule's hall
4. Check if seats are already booked in this schedule
5. Create booking record with status = "pending"
6. Mark seats as booked (update `seats.status` to 0 where id IN booking_seats AND schedule_id = {schedule_id})
7. Calculate total amount (seat count × schedule price)
8. Return booking confirmation with ID

**Error Messages to Return:**
```
"The selected schedule id is invalid."
"The selected customer id is invalid."
"One or more seats do not belong to the schedule hall."
"One or more selected seats are already booked."
"Email address is not valid."
```

---

## Implementation Checklist

### Endpoint 1: GET /bookings/schedules
- [ ] Create controller method: `BookingController@getSchedules()` or `ScheduleController@index()`
- [ ] Create route: `Route::get('/bookings/schedules', 'ScheduleController@index')`
- [ ] Add pagination support (20 items per page)
- [ ] Add status filtering (parameter: `status`)
- [ ] Query database: `SELECT * FROM schedules WHERE (status = ? OR ? = 'All')`
- [ ] Include relationships: `with('program', 'hall')`
- [ ] Return timestamps as strings in HH:mm:ss format for `starttime` and `endtime`
- [ ] Return prices as strings
- [ ] Return paginated response with `current_page`, `data[]`, `last_page`
- [ ] Test with Postman: `GET /api/v1/bookings/schedules?page=1&status=All`

### Endpoint 2: GET /schedules/program/{programId}
- [ ] Create controller method: `ScheduleController@getByProgram()`
- [ ] Create route: `Route::get('/schedules/program/{id}', 'ScheduleController@getByProgram')`
- [ ] Add query validation for `programId`
- [ ] Query database: `SELECT * FROM schedules WHERE program_id = ? AND status = 1`
- [ ] Include hall relationship: `with('hall')`
- [ ] Format response with `success`, `message`, `data`
- [ ] Test with Postman: `GET /api/v1/schedules/program/1`

### Endpoint 3: GET /seats/get-seats-by-hall/{hallId}
- [ ] Create controller method: `SeatController@getByHall()`
- [ ] Create route: `Route::get('/seats/get-seats-by-hall/{id}', 'SeatController@getByHall')`
- [ ] Add query validation for `hallId`
- [ ] Query database: `SELECT * FROM seats WHERE hall_id = ?`
- [ ] Sort by `seat_row` ASC, then `seat_number` ASC
- [ ] Wrap response in nested `data.data` structure
- [ ] Include status (1=available, 0=booked)
- [ ] Test with Postman: `GET /api/v1/seats/get-seats-by-hall/1`

### Endpoint 4: POST /bookings/book-schedule-seat
- [ ] Create controller method: `BookingController@bookScheduleSeat()`
- [ ] Create route: `Route::post('/bookings/book-schedule-seat', 'BookingController@bookScheduleSeat')`
- [ ] Validate request data with Laravel FormRequest class
- [ ] Verify schedule exists: `Schedule::findOrFail($schedule_id)`
- [ ] Verify all seats exist: `Seat::whereIn('id', $booking_seats)->where('hall_id', $schedule->hall_id)->count()`
- [ ] Check for double-bookings: `Booking::where('schedule_id', $schedule_id)->whereJsonContains('booking_seats', seat_id)`
- [ ] Create booking record in `bookings` table
- [ ] Mark seats as booked (update `seats.status = 0`)
- [ ] Create individual seat booking records in `booking_seats` pivot table
- [ ] Calculate `total_amount = seat_count × schedule_price`
- [ ] Return success response with booking details
- [ ] Handle all error cases with proper status codes (400/422)
- [ ] Test with Postman: `POST /api/v1/bookings/book-schedule-seat`

---

## Database Schema Reference

### schedules table
```sql
CREATE TABLE schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT FOREIGN KEY,
  hall_id INT FOREIGN KEY,
  date DATE NOT NULL,
  starttime TIME NOT NULL,
  endtime TIME NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status TINYINT DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### seats table
```sql
CREATE TABLE seats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hall_id INT FOREIGN KEY,
  seat_row VARCHAR(1) NOT NULL,
  seat_number INT NOT NULL,
  label VARCHAR(3) NOT NULL,
  seat_type VARCHAR(20) DEFAULT 'standard',
  status TINYINT DEFAULT 1, -- 1=available, 0=booked
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(hall_id, seat_row, seat_number)
);
```

### bookings table
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id INT FOREIGN KEY,
  customer_id INT FOREIGN KEY (nullable),
  walkin_customer_name VARCHAR(255) NOT NULL,
  walkin_customer_no VARCHAR(20) NOT NULL,
  walkin_customer_email VARCHAR(255) NOT NULL,
  booking_seats JSON NOT NULL, -- Array of seat IDs
  total_seats INT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Testing with cURL

### Test 1: Get All Schedules (Schedule List Page)
```bash
curl -X GET "https://cinemaapi.kanocitymall.com.ng/api/v1/bookings/schedules?page=1&status=All" \
  -H "Content-Type: application/json"
```

### Test 2: Get Schedules for Program (Booking Flow)
```bash
curl -X GET "https://cinemaapi.kanocitymall.com.ng/api/v1/schedules/program/1" \
  -H "Content-Type: application/json"
```

### Test 3: Get Seats by Hall
```bash
curl -X GET "https://cinemaapi.kanocitymall.com.ng/api/v1/seats/get-seats-by-hall/1" \
  -H "Content-Type: application/json"
```

### Test 4: Create Booking
```bash
curl -X POST "https://cinemaapi.kanocitymall.com.ng/api/v1/bookings/book-schedule-seat" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": 1,
    "walkin_customer_name": "John Doe",
    "walkin_customer_no": "0123456789",
    "walkin_customer_email": "john@example.com",
    "booking_seats": [1, 2, 3]
  }'
```

---

## Frontend Status

✅ **All frontend components are ready:**
- Program detail page with "Book Schedule Seats" button
- Schedule selection modal
- Three-stage booking flow (Customer → Seats → Confirm)
- Seat grid with visual seat selection
- Form validation with error handling
- API integration with proper error messages
- Mock data fallback for testing (displays warning that backend API not yet implemented)

**Testing with mock data:**
Frontend will automatically use mock data if backend returns 404, allowing UI/UX testing to continue while backend is being developed.

**Switching to real API:**
Once backend endpoints are implemented, remove the mock data handling and real API calls will be used automatically.

