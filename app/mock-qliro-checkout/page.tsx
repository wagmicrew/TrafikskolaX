import { notFound } from 'next/navigation';

// This page is deprecated. The project no longer supports any mock/fallback Qliro flows.
// Keeping the route but returning 404 avoids accidental usage while preventing broken imports.
export default function Page() {
  notFound();
}
