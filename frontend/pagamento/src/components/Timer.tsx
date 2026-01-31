import React, { useState, useEffect } from "react";

export function Timer() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(15);
  const [seconds, setSeconds] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const startTimeKey = "payment_timer_start";
    let startTime = localStorage.getItem(startTimeKey);

    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(startTimeKey, startTime);
    }

    const startTimestamp = parseInt(startTime);

    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
      const totalSeconds = 15 * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

      const hrs = Math.floor(remainingSeconds / 3600);
      const mins = Math.floor((remainingSeconds % 3600) / 60);
      const secs = remainingSeconds % 60;

      setHours(hrs);
      setMinutes(mins);
      setSeconds(secs);

      if (remainingSeconds === 0) {
        setIsExpired(true);
        localStorage.removeItem(startTimeKey);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  if (isExpired) {
    return (
      <div style={{ backgroundColor: '#dc2626', width: '100%', padding: '10px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
            Tempo expirado - Oferta encerrada
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#dc2626', width: '100%', padding: '10px 16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
          Compre em até{" "}
          <span style={{ fontWeight: 'bold' }}>
            {formatNumber(hours)}:{formatNumber(minutes)}:{formatNumber(seconds)}
          </span>
          {" "}para não perder essa oferta
        </span>
      </div>
    </div>
  );
}
