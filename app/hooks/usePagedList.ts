import { useState } from "react";

/**
 * Splits `items` into pages of `perPage`. When the page size changes (the box got
 * smaller or bigger), the current page is kept inside the new page count.
 */
export function usePagedList<T>(items: T[], perPage: number) {
  const [requestedPage, setPage] = useState(0);
  const size = Math.max(1, perPage);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(requestedPage, pages - 1);

  return {
    pageItems: items.slice(page * size, page * size + size),
    page,
    pages,
    previous: () => setPage(Math.max(0, page - 1)),
    next: () => setPage(Math.min(pages - 1, page + 1)),
  };
}
