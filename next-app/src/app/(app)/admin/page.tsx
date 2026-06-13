import { PageHeader } from '@/components/ui/DashboardPanels';
import { formatTodayDate } from '@/lib/formatDate';

export default function AdminPage() {
  return (
    <>
      <PageHeader
        title={
          <>
            Admin <span>Panel</span>
          </>
        }
        subtitle="System administration and clinic oversight."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Admin · <span>Panel</span>
          </>
        }
      />

      <div className="card">
        <div className="card-body">
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Admin metrics load from your authenticated admin session. Contact support if you need
            elevated access.
          </p>
        </div>
      </div>
    </>
  );
}
