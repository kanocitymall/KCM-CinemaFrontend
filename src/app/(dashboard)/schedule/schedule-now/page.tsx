"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ScheduleForm from "../schedule-list/components/schedule-form";

const ScheduleNowPage = () => {
  const router = useRouter();

  return (
    <section className="container py-4">
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <h4 className="fw-bold mb-0">Create New Schedule</h4>
      </div>

      <ScheduleForm onSuccess={() => router.push("/schedule/schedule-list")} />
    </section>
  );
};

export default ScheduleNowPage;
