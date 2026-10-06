import { useEffect, useState } from "react";

/**
 * The current time, updated every `intervalMs`. Pass `startAt` (an ISO date-time)
 * to run a demo clock: it starts at that moment and then moves with real time.
 * It is null on the server and on the first client render, so the server HTML
 * and the first client render are the same.
 */
export function useNow(intervalMs = 1000, startAt?: string) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const offset = startAt ? Date.parse(startAt) - Date.now() : 0;
    const tick = () => setNow(new Date(Date.now() + offset));
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, startAt]);

  return now;
}
