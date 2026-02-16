"use client";

import React from "react";

export default function TodayBookingsPage() {
	return (
		<div className="min-vh-100 p-4">
			<div className="d-flex align-items-center mb-4">
				<div>
					<h3 className="mb-0">Today Events</h3>
					<small className="text-muted">Feature temporarily unavailable.</small>
				</div>
			</div>
			<div className="card shadow-sm border-0">
				<div className="card-body text-center py-5">
					<div className="text-muted">Bookings list is currently disabled. Please check back later.</div>
				</div>
			</div>
		</div>
	);
}