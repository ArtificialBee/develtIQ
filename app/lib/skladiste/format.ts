/**
 * The warehouse's number and date styles, the same as divetiq-cicak's, so every
 * value reads exactly as in the demo.
 */

/** `yyyy-mm-dd` (or a full ISO time) → `dd.mm.yyyy.`; `—` when empty. */
export function datum(iso: string | null | undefined): string {
  if (!iso) return "—";
  const day = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "—";
  const [y, m, d] = day.split("-");
  return `${d}.${m}.${y}.`;
}

/** An ISO time → `dd.mm.yyyy. hh:mm`, in local time; `—` when empty. */
export function vrijeme(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${datum(local)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** `1.034,00 KM`. */
export function km(iznos: number): string {
  return `${iznos.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM`;
}

/** `1 240`: quantities with a space between thousands, up to 3 decimals. */
export function kol(n: number): string {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 3 }).replace(/\./g, " ");
}

/** Bosnian plural (cicak's `plural`): 1, 21 → `jedan`; 2–4, 22–24 → `nekoliko`; everything else → `mnogo`. */
export function plural(n: number, jedan: string, nekoliko: string, mnogo: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return jedan;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return nekoliko;
  return mnogo;
}
