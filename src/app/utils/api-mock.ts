/**
 * Mock API responses for testing frontend while backend is being developed
 * Remove this file once backend endpoints are implemented
 */

export const mockSchedulesList = () => {
  return {
    success: true,
    data: {
      current_page: 1,
      data: [
        {
          id: 1,
          program_id: 1,
          hall_id: 1,
          date: "2026-01-28",
          starttime: "14:00:00",
          endtime: "17:00:00",
          regular_price: "2000",
          vip_price: "3500",
          status: "Scheduled",
          program: {
            title: "Avengers Endgame",
            duration: "3h 2m",
          },
          hall: {
            name: "Cinema Hall 1",
          },
        },
        {
          id: 2,
          program_id: 1,
          hall_id: 1,
          date: "2026-01-28",
          starttime: "18:00:00",
          endtime: "21:00:00",
          regular_price: "2500",
          vip_price: "4000",
          status: "Scheduled",
          program: {
            title: "Avengers Endgame",
            duration: "3h 2m",
          },
          hall: {
            name: "Cinema Hall 1",
          },
        },
        {
          id: 3,
          program_id: 2,
          hall_id: 2,
          date: "2026-01-29",
          starttime: "14:00:00",
          endtime: "16:00:00",
          regular_price: "1800",
          vip_price: "3000",
          status: "Scheduled",
          program: {
            title: "The Lion King",
            duration: "2h 18m",
          },
          hall: {
            name: "Cinema Hall 2",
          },
        },
        {
          id: 4,
          program_id: 3,
          hall_id: 3,
          date: "2026-01-29",
          starttime: "19:00:00",
          endtime: "21:30:00",
          regular_price: "2200",
          vip_price: "3800",
          status: "Scheduled",
          program: {
            title: "Inception",
            duration: "2h 28m",
          },
          hall: {
            name: "Cinema Hall 3",
          },
        },
      ],
      last_page: 1,
    },
  };
};

export const mockSchedules = (programId: number) => {
  return {
    data: [
      {
        id: 1,
        program_id: programId,
        date: "2026-01-28",
        time: "14:00",
        hall_id: 1,
        available_seats: 45,
        price: 2500,
      },
      {
        id: 2,
        program_id: programId,
        date: "2026-01-28",
        time: "18:00",
        hall_id: 1,
        available_seats: 30,
        price: 2500,
      },
      {
        id: 3,
        program_id: programId,
        date: "2026-01-29",
        time: "14:00",
        hall_id: 2,
        available_seats: 50,
        price: 2000,
      },
    ],
  };
};

export const mockSeats = (hallId: number) => {
  const rows = ["A", "B", "C", "D", "E"];
  const seatsPerRow = 10;
  const bookedSeats = [5, 7, 12, 14, 22, 25];

  const seats = [];
  let seatId = 1;

  for (const row of rows) {
    for (let number = 1; number <= seatsPerRow; number++) {
      seats.push({
        id: seatId,
        hall_id: hallId,
        seat_row: row,
        seat_number: number,
        is_booked: bookedSeats.includes(seatId) ? 1 : 0,
        is_available: bookedSeats.includes(seatId) ? 0 : 1,
      });
      seatId++;
    }
  }

  return {
    data: {
      data: seats,
    },
  };
};

interface MockBookingPayload {
  schedule_id: number;
  customer_id?: number | null;
  walkin_customer_name?: string | null;
  walkin_customer_no?: string | null;
  walkin_customer_email?: string | null;
  booking_seats?: unknown;
}

export const mockBookingResponse = (payload: MockBookingPayload) => {
  return {
    success: true,
    message: "Booking created successfully (mock)",
    data: {
      id: Math.floor(Math.random() * 10000),
      schedule_id: payload.schedule_id,
      customer_id: payload.customer_id || null,
      walkin_customer_name: payload.walkin_customer_name,
      walkin_customer_no: payload.walkin_customer_no,
      walkin_customer_email: payload.walkin_customer_email,
      booking_seats: payload.booking_seats,
      status: "pending",
      created_at: new Date().toISOString(),
    },
  };
};
