import React, { useState, useEffect } from 'react';
import { FiUsers, FiCheckCircle, FiAlertCircle, FiClock, FiActivity } from 'react-icons/fi';

interface SummaryStatsProps {
  totalParticipants: number;
  checkedInCount: number;
  notCheckedInCount: number;
  peakCheckInTime?: string;
  onNewCheckIn?: (count: number) => void;
}

// CSS for flash animation
const flashAnimation = `
  @keyframes flash-pulse {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(75, 192, 75, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 8px rgba(75, 192, 75, 0.3);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(75, 192, 75, 0);
    }
  }

  .flash-badge {
    animation: flash-pulse 0.6s ease-out;
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = flashAnimation;
  document.head.appendChild(style);
}

export default function SummaryStats({
  totalParticipants,
  checkedInCount,
  notCheckedInCount,
  peakCheckInTime,
  onNewCheckIn,
}: SummaryStatsProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [prevCheckedInCount, setPrevCheckedInCount] = useState(checkedInCount);

  // Trigger flash animation when checkedInCount increases
  useEffect(() => {
    if (checkedInCount > prevCheckedInCount) {
      setIsFlashing(true);
      onNewCheckIn?.(checkedInCount);
      // Remove flash class after animation
      const timer = setTimeout(() => setIsFlashing(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCheckedInCount(checkedInCount);
  }, [checkedInCount, prevCheckedInCount, onNewCheckIn]);

  const checkInPercentage = totalParticipants > 0 
    ? Math.round((checkedInCount / totalParticipants) * 100) 
    : 0;

  const stats = [
    {
      label: 'Total Participants',
      value: totalParticipants,
      icon: FiUsers,
      color: '#0d6efd',
      bgColor: 'bg-primary',
    },
    {
      label: 'Checked In',
      value: checkedInCount,
      icon: FiCheckCircle,
      color: '#198754',
      bgColor: 'bg-success',
    },
    {
      label: 'Not Checked In',
      value: notCheckedInCount,
      icon: FiAlertCircle,
      color: '#dc3545',
      bgColor: 'bg-danger',
    },
    {
      label: 'Attendance %',
      value: `${checkInPercentage}%`,
      icon: FiCheckCircle,
      color: '#6f42c1',
      bgColor: 'bg-secondary',
    },
    {
      label: 'Peak Check-in Time',
      value: peakCheckInTime || 'N/A',
      icon: FiClock,
      color: '#fd7e14',
      bgColor: 'bg-warning',
    },
  ];

  return (
    <div className="mb-4">
      {/* Real-time Counter Badge */}
      <div className="mb-3">
        <div
          className={`badge bg-success ${isFlashing ? 'flash-badge' : ''}`}
          style={{
            fontSize: '1.2rem',
            padding: '12px 20px',
            borderRadius: '50px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'default',
          }}
        >
          <FiActivity size={20} />
          <span>Real-time: {checkedInCount} Checked In</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5 g-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx}>
              <div className="card shadow-sm border-0 h-100" style={{ borderRadius: '10px' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div
                      className={`${stat.bgColor} bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center me-3`}
                      style={{ width: '60px', height: '60px' }}
                    >
                      <Icon size={28} color={stat.color} />
                    </div>
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>
                        {stat.label}
                      </p>
                      <h3 className="mb-0 fw-bold" style={{ color: stat.color, fontSize: '2rem' }}>
                        {stat.value}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Check-in Progress Bar */}
      {totalParticipants > 0 && (
        <div className="mt-4">
          <div className="card shadow-sm border-0" style={{ borderRadius: '10px' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-bold">Check-in Progress</h6>
                <span className="badge bg-info">{checkInPercentage}%</span>
              </div>
              <div className="progress" style={{ height: '25px', borderRadius: '5px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{ width: `${checkInPercentage}%` }}
                  aria-valuenow={checkInPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {checkInPercentage > 10 && (
                    <span className="small fw-bold text-white">{checkInPercentage}%</span>
                  )}
                </div>
              </div>
              <small className="text-muted d-block mt-2">
                {checkedInCount} of {totalParticipants} participants checked in
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
