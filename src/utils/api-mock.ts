/**
 * Mock API responses for testing frontend while backend is being developed
 * Remove this file once backend endpoints are implemented
 */

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
        row: row,
        number: number,
        isAvailable: !bookedSeats.includes(seatId),
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

export const mockBookingResponse = (payload: Record<string, unknown>) => {
  return {
    success: true,
    message: "Booking created successfully (mock)",
    data: {
      id: Math.floor(Math.random() * 10000),
      ...payload,
      status: "pending",
      created_at: new Date().toISOString(),
    },
  };
};
