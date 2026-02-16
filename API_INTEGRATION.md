# API Integration Reference

## Complete JSON Payload

### Exact Structure Sent to Backend

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

### Field Definitions

| Field | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `schedule_id` | integer | Yes | 1 | Schedule ID from selection |
| `customer_id` | integer | No | 1 | Existing customer ID or 0 |
| `walkin_customer_name` | string | Yes | "John Doe" | Full name of walk-in customer |
| `walkin_customer_no` | string | Yes | "0123456789" | Phone number |
| `walkin_customer_email` | string | Yes | "john@example.com" | Email address |
| `booking_seats` | array | Yes | [1, 2, 3] | Array of seat IDs selected |

---

## API Endpoint

### Request

```
POST /bookings/book-schedule-seat
Content-Type: application/json

{
  "schedule_id": 1,
  "customer_id": 1,
  "walkin_customer_name": "John Doe",
  "walkin_customer_no": "0123456789",
  "walkin_customer_email": "john@example.com",
  "booking_seats": [1, 2, 3]
}
```

### Success Response (200 OK)

```json
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

### Error Response (400/422)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "walkin_customer_email": ["Email format is invalid"],
    "booking_seats": ["At least one seat is required"]
  }
}
```

---

## Data Collection Steps

### Step 1: Schedule Selection
**Source:** `/schedules/program/{programId}`

```json
{
  "id": 1,
  "program_id": 5,
  "hall_id": 2,
  "date": "2024-02-15",
  "starttime": "18:00",
  "endtime": "20:00",
  "details": "Evening Screening"
}
```

**Captured:** `schedule_id = 1`

### Step 2: Customer Information
**Source:** User form input

```json
{
  "walkin_customer_name": "John Doe",
  "walkin_customer_no": "0123456789",
  "walkin_customer_email": "john@example.com",
  "customer_id": 1  // Optional, can be 0 for walk-ins
}
```

### Step 3: Seat Selection
**Source:** `/seats/get-seats-by-hall/{hallId}`

```json
[
  {
    "id": 1,
    "seat_row": "A",
    "seat_number": 1,
    "label": "A1",
    "seat_type": "Regular",
    "status": 1
  },
  {
    "id": 2,
    "seat_row": "A",
    "seat_number": 2,
    "label": "A2",
    "seat_type": "Regular",
    "status": 1
  }
]
```

**Captured:** `booking_seats = [1, 2, 3]` (user selected seat IDs)

---

## Component State Management

### BookingState Interface

```typescript
interface BookingState {
  schedule_id: number | null;           // From step 1
  customer_id: number | null;           // From user input
  walkin_customer_name: string;         // From step 2 form
  walkin_customer_no: string;           // From step 2 form
  walkin_customer_email: string;        // From step 2 form
  booking_seats: number[];              // From step 3 selection
  hall_id: number | null;               // From schedule data
}
```

### State Updates by Step

**After Step 1 (Schedule Selection):**
```typescript
{
  schedule_id: 1,
  hall_id: 2,
  customer_id: null,
  walkin_customer_name: "",
  walkin_customer_no: "",
  walkin_customer_email: "",
  booking_seats: []
}
```

**After Step 2 (Customer Info):**
```typescript
{
  schedule_id: 1,
  hall_id: 2,
  customer_id: 1,  // or 0 if no existing customer
  walkin_customer_name: "John Doe",
  walkin_customer_no: "0123456789",
  walkin_customer_email: "john@example.com",
  booking_seats: []
}
```

**After Step 3 (Seat Selection):**
```typescript
{
  schedule_id: 1,
  hall_id: 2,
  customer_id: 1,
  walkin_customer_name: "John Doe",
  walkin_customer_no: "0123456789",
  walkin_customer_email: "john@example.com",
  booking_seats: [1, 2, 3]  // ← Populated by seat selection
}
```

---

## Code Implementation

### API Call (in page.tsx)

```typescript
const handleSubmitBooking = async () => {
  try {
    const payload = {
      schedule_id: bookingData.schedule_id,
      customer_id: bookingData.customer_id || 0,
      walkin_customer_name: bookingData.walkin_customer_name,
      walkin_customer_no: bookingData.walkin_customer_no,
      walkin_customer_email: bookingData.walkin_customer_email,
      booking_seats: bookingData.booking_seats,
    };

    const api = getApiClientInstance();
    const response = await api.post("/bookings/book-schedule-seat", payload);

    if (response.data?.success) {
      toast.success("✅ Booking confirmed successfully!");
      // Handle success...
    } else {
      toast.error(response.data?.message || "Booking failed");
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || "Failed to submit booking";
    toast.error(errorMsg);
  }
};
```

---

## Example Scenarios

### Scenario 1: New Walk-in Customer

**Input:**
- Schedule: ID 5
- Name: "Jane Smith"
- Phone: "0987654321"
- Email: "jane@example.com"
- Seats: [10, 11, 12]

**Payload:**
```json
{
  "schedule_id": 5,
  "customer_id": 0,
  "walkin_customer_name": "Jane Smith",
  "walkin_customer_no": "0987654321",
  "walkin_customer_email": "jane@example.com",
  "booking_seats": [10, 11, 12]
}
```

### Scenario 2: Existing Customer

**Input:**
- Schedule: ID 3
- Customer: ID 42 (existing)
- Override Name: "Mr. Smith"
- Seats: [5, 6]

**Payload:**
```json
{
  "schedule_id": 3,
  "customer_id": 42,
  "walkin_customer_name": "Mr. Smith",
  "walkin_customer_no": "1234567890",
  "walkin_customer_email": "smith@example.com",
  "booking_seats": [5, 6]
}
```

### Scenario 3: Single Seat Booking

**Input:**
- Schedule: ID 8
- Single seat: [20]

**Payload:**
```json
{
  "schedule_id": 8,
  "customer_id": 0,
  "walkin_customer_name": "John Doe",
  "walkin_customer_no": "0123456789",
  "walkin_customer_email": "john@example.com",
  "booking_seats": [20]
}
```

---

## Validation Rules

### Frontend Validation

| Field | Rule | Example |
|-------|------|---------|
| `walkin_customer_name` | Required, min 1 char | "John Doe" ✅ |
| `walkin_customer_no` | Required, min 1 char | "0123456789" ✅ |
| `walkin_customer_email` | Required, valid email | "john@example.com" ✅ |
| `booking_seats` | Min 1 seat selected | [1, 2, 3] ✅ |
| `schedule_id` | Must be set | 1 ✅ |

### Email Validation Regex

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches: user@domain.com ✅
// Rejects: invalid@email ❌
// Rejects: user@domain ❌
```

---

## Error Scenarios

### Missing Required Field

**Request:**
```json
{
  "schedule_id": 1,
  "customer_id": 1,
  "walkin_customer_name": "",  // ← Empty
  "walkin_customer_no": "0123456789",
  "walkin_customer_email": "john@example.com",
  "booking_seats": [1, 2, 3]
}
```

**Response (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "walkin_customer_name": ["The walkin_customer_name field is required"]
  }
}
```

### Invalid Email

**Request:**
```json
{
  "walkin_customer_email": "invalid-email"  // ← Invalid format
}
```

**Response (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "walkin_customer_email": ["The email must be a valid email address"]
  }
}
```

### No Seats Selected

**Request:**
```json
{
  "booking_seats": []  // ← Empty array
}
```

**Response (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "booking_seats": ["Please select at least one seat"]
  }
}
```

---

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Show confirmation, redirect |
| 400 | Bad Request | Show error message |
| 422 | Validation Failed | Show field errors |
| 500 | Server Error | Show generic error, suggest retry |

---

## Testing with cURL

### Basic Test

```bash
curl -X POST http://localhost:8000/bookings/book-schedule-seat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "schedule_id": 1,
    "customer_id": 1,
    "walkin_customer_name": "John Doe",
    "walkin_customer_no": "0123456789",
    "walkin_customer_email": "john@example.com",
    "booking_seats": [1, 2, 3]
  }'
```

### Using Postman

1. Create new POST request
2. URL: `{BASE_URL}/bookings/book-schedule-seat`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer {token}`
4. Body (raw JSON):
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

## Backend Implementation Notes

### Expected Database Operations

1. **Verify schedule exists**
2. **Verify seats exist and are available**
3. **Create or update customer**
4. **Create booking record**
5. **Mark seats as booked**
6. **Return confirmation**

### Response Should Include

- Booking ID
- Confirmation details
- Booking status
- Created timestamp

---

## Integration Checklist

- [x] Frontend form collects all required fields
- [x] Validation on all inputs
- [x] Seat selection captured in array
- [x] JSON structure matches spec
- [x] POST request to correct endpoint
- [x] Error handling implemented
- [x] Success/failure notifications
- [x] Data properly formatted

**Ready for backend integration!** ✅
