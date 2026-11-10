"use client";

import { useEffect, useState } from "react";

// Зворотний відлік у секундах (для «Resend in 59 seconds»)
export const useCountdown = (initialSeconds: number) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timerId = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timerId);
  }, [secondsLeft]);

  return { secondsLeft, restart: setSecondsLeft };
};
