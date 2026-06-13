import { redirect } from 'next/navigation';

/** Primary entry — Report Analysis (clinical upload + OCR pipeline) */
export default function Home() {
  redirect('/reports');
}
