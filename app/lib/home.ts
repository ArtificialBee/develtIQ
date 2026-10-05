/** The greeting for the time of day. */
export const greetingFor = (date: Date) => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Dobro jutro";
  if (hour >= 12 && hour < 18) return "Dobar dan";
  return "Dobro veče";
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "21:04:09". */
export const formatClock = (date: Date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

const WEEKDAYS = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];

/** "Četvrtak, 24.09.2026.". */
export const formatDate = (date: Date) =>
  `${WEEKDAYS[date.getDay()]}, ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}.`;
