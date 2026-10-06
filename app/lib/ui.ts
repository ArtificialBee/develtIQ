/** Shared text and chip styles, so every card reads the same. */

export const CARD_TITLE = "text-[1.1rem] font-semibold text-gray-900 dark:text-white";

export const CARD_DESCRIPTION = "text-sm text-gray-500 dark:text-white/60";

/** The small blue square that holds an icon in a card or a list row. */
export const ICON_CHIP =
  "flex shrink-0 items-center justify-center rounded-lg bg-[#3B9DF8]/10 text-[#3B9DF8] ring-1 ring-[#3B9DF8]/25";

/** Lets a long word with no spaces (an e-mail, a link, a code) break instead of spilling out. */
export const WRAP_ANYWHERE = "min-w-0 [overflow-wrap:anywhere]";

// Bosnian writes 1.500. Chrome accepts "bs-BA" but formats it as 1,500, so the
// Croatian rules, which are the same for numbers, are used instead.
const numberFormat = new Intl.NumberFormat("hr-HR");

/** "12.345": a count with the local thousands separator. */
export const formatBroj = (n: number) => numberFormat.format(n);

/**
 * A font size for a big number that still fits its box: the longer the text,
 * the smaller the size. `limits` are the longest texts each size still holds.
 */
export const bigNumberSize = (
  text: string,
  limits: readonly [number, number] = [5, 8],
  sizes: readonly [string, string, string] = ["text-5xl", "text-4xl", "text-3xl"],
) => (text.length <= limits[0] ? sizes[0] : text.length <= limits[1] ? sizes[1] : sizes[2]);
