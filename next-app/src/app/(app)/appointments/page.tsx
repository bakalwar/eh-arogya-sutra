'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/ui/DashboardPanels';
import { formatTodayDate } from '@/lib/formatDate';

export default function AppointmentsPage() {
  return (
    <>
      <PageHeader
        title={
          <>
            Appointments & <span>Follow-ups</span>
          </>
        }
        subtitle="Schedule visits and manage follow-up reminders."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Today · <span>Schedule</span>
          </>
        }
        action={
          <Link href="/records" className="btn-new">
            ➕ Schedule
          </Link>
        }
      />

      <div className="card">
        <div className="card-header">
          <div className="card-title">📅 Today&apos;s Schedule</div>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            No appointments scheduled for today. Open a patient record to schedule a visit.
          </p>
          <Link href="/records" className="btn-secondary" style={{ marginTop: 16, display: 'inline-block' }}>
            View Patient Records
          </Link>
        </div>
      </div>
    </>
  );
}
