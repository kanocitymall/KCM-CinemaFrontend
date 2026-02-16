"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { useRouter } from "next/navigation";
import { MdEventSeat, MdBlock } from "react-icons/md"; // Added MdBlock for inactive seats
import { getApiClientInstance } from "@/app/utils/axios/axios-client";
import { mockSeats } from "@/app/utils/api-mock";
import { toast } from "react-toastify";
import "./seat-grid.css";

interface Seat {
  id: number;
  seat_row?: string;
  row?: string;
  seat_number?: number;
  number?: number;
  label?: string;
  status?: number | string; 
}

interface SeatGridProps {
  hallId: number;
  scheduleId?: number | null;
  onSeatsSelected: (seatIds: number[], seatNumbers: string[]) => void;
  loading?: boolean;
  refreshTrigger?: number;
  justBookedSeatIds?: number[];
  blockedSeatIds?: number[];
}

export default function SeatGrid({ 
  hallId, 
  scheduleId = null,
  onSeatsSelected, 
  loading = false, 
  refreshTrigger = 0, 
  justBookedSeatIds = [], 
  blockedSeatIds = [],
}: SeatGridProps) {
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [bookedSeatIds, setBookedSeatIds] = useState<number[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchSeats = useCallback(async () => {
    try {
      // Guard for invalid hall ids to avoid spurious 404s
      if (!Number.isFinite(hallId) || hallId <= 0) {
        setSeats([]);
        setBookedSeatIds([]);
        setLoadingSeats(false);
        setIsRefreshing(false);
        return;
      }

      if (refreshTrigger > 0) setIsRefreshing(true);
      else setLoadingSeats(true);

      const api = getApiClientInstance();
      
      let response;
      try {
        response = await api.get(`/seats/get-seats-by-hall/${hallId}`);
      } catch (apiError: unknown) {
        const status = (apiError as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          // Backend may not have seats endpoint yet for this hall — use mock seats
          response = mockSeats(hallId);
        } else {
          // For other errors, rethrow to be handled by outer catch
          throw apiError;
        }
      }

      const seatsArray: Seat[] = response.data?.data?.data || response.data?.data || [];
      setSeats(seatsArray);

      const bookedIds: number[] = [];
      if (scheduleId) {
        try {
          const bookingsResp = await api.get(`/bookings/schedule-bookings/${scheduleId}`, { 
            params: { status: 'All' } 
          });
          const bookingsList = bookingsResp.data?.data?.bookings?.data || [];
          
          if (Array.isArray(bookingsList)) {
            bookingsList.forEach((bk: Record<string, unknown>) => {
              const bSeats = (bk['booking_seats'] as unknown[]) || [];
              bSeats.forEach((bs) => {
                const bsRec = bs as Record<string, unknown>;
                const sid = bsRec['seat_id'] ?? (bsRec['seat'] && (bsRec['seat'] as Record<string, unknown>)['id']);
                if (sid) bookedIds.push(Number(sid));
              });
            });
          }
        } catch (e: unknown) {
          const status = (e as { response?: { status?: number } })?.response?.status;
          // If there are no bookings for this schedule the backend sometimes returns 404.
          // Treat that as "no booked seats" and fail silently to avoid noisy console logs.
          if (status === 404) {
            // no-op: leave bookedIds empty
          } else {
            // Show a friendly message for unexpected errors (no raw backend logging)
            console.debug('Booking fetch error for schedule', scheduleId, e);
            toast.warn("Could not determine booked seats for this schedule.");
          }
        }
      }

      setBookedSeatIds(Array.from(new Set(bookedIds.map(Number))));
    } catch (err: unknown) {
      console.debug('fetchSeats failed for hall', hallId, err);
      // Show a friendly message; avoid printing raw backend messages
      toast.error("Failed to load seats. Please try again later.");
    } finally {
      setLoadingSeats(false);
      setIsRefreshing(false);
    }
  }, [hallId, refreshTrigger, scheduleId]);

  useEffect(() => {
    if (Number.isFinite(hallId) && hallId > 0) fetchSeats();
  }, [fetchSeats, hallId]);

  const rows = Array.from(new Set(seats.map(s => (s.seat_row || s.row || 'Unknown')))).sort();

  const handleSeatClick = (seatId: number, canSelect: boolean) => {
    if (!canSelect) return;
    setSelectedSeats(prev => 
      prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]
    );
  };

  if (loadingSeats) return (
    <div className="text-center py-5"><Spinner animation="border" variant="warning" /><p>Loading Grid...</p></div>
  );

  return (
    <div className="seat-grid-container">
      {isRefreshing && <div className="refresh-overlay"><Spinner animation="border" variant="warning" /></div>}

      <div className="screen-section mb-5 text-center">
        <div className="screen-bar"></div>
        <div className="screen-label text-muted small">SCREEN</div>
      </div>

      <div className="seats-section mb-4">
        {rows.map(row => (
          <div key={row} className="seat-row">
            <div className="row-label">{row}</div>
            <div className="seats-group">
              {seats
                .filter(s => (s.seat_row || s.row) === row)
                .sort((a, b) => (a.seat_number || a.number || 0) - (b.seat_number || b.number || 0))
                .map(seat => {
                  const seatId = Number(seat.id);
                  
                  // 1. Check if booked
                  const isBooked = (justBookedSeatIds || []).includes(seatId) || 
                                   (blockedSeatIds || []).includes(seatId) || 
                                   bookedSeatIds.includes(seatId);
                  
                  // 2. Check if inactive/broken (Status 0 usually means inactive)
                  const isInactive = Number(seat.status) === 0;
                  
                  // 3. Overall availability
                  const isSelected = selectedSeats.includes(seatId);
                  const canSelect = !isBooked && !isInactive;
                  
                  const seatNum = seat.seat_number || seat.number;
                  const seatLabel = `${row}${seatNum}`;

                  // Determine CSS class
                  let seatClass = "available";
                  if (isInactive) seatClass = "inactive";
                  else if (isBooked) seatClass = "booked";
                  else if (isSelected) seatClass = "selected";

                  return (
                    <button
                      key={seatId}
                      type="button"
                      disabled={!canSelect}
                      onClick={() => handleSeatClick(seatId, canSelect)}
                      className={`seat-btn ${seatClass}`}
                      title={isInactive ? "Seat Unavailable/Broken" : ""}
                    >
                      {isInactive ? <MdBlock size={20} /> : isBooked ? <span>❌</span> : <MdEventSeat size={22} />}
                      <span className="seat-number">{seatLabel}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="legend-section d-flex justify-content-around flex-wrap mb-4 border p-2 rounded bg-light">
        <div className="legend-item"><div className="box available"></div><span>Available</span></div>
        <div className="legend-item"><div className="box selected"></div><span>Selected</span></div>
        <div className="legend-item"><div className="box booked"></div><span>Booked</span></div>
        <div className="legend-item"><div className="box inactive"></div><span>Inactive</span></div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-danger w-100" onClick={() => router.back()}>Back</button>
        <button className="btn btn-outline-secondary w-100" onClick={() => setSelectedSeats([])}>Clear</button>
        <button 
          className="btn btn-success w-100" 
          disabled={selectedSeats.length === 0 || loading}
          onClick={() => {
            const seatLabels = selectedSeats.map(id => {
              const s = seats.find(seat => seat.id === id);
              return `${s?.seat_row || s?.row}${s?.seat_number || s?.number}`;
            });
            onSeatsSelected(selectedSeats, seatLabels);
          }}
        >
          {loading ? <Spinner size="sm" /> : `Confirm ${selectedSeats.length} Seats`}
        </button>
      </div>
    </div>
  );
}