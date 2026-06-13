'use client';

import { PageHeader } from '@/components/ui/DashboardPanels';
import { formatTodayDate } from '@/lib/formatDate';
import { referralTiers } from '@/lib/referralProgram';
import { getCurrentUser } from '@/lib/session/tokenManager';

export default function PaymentPage() {
  const user = getCurrentUser();

  return (
    <>
      <PageHeader
        title={
          <>
            Payment & <span>Referral</span>
          </>
        }
        subtitle="Subscription plans, UPI payments, and doctor referral rewards."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Payment · <span>Referral</span>
          </>
        }
        action={
          <button type="button" className="btn-new">
            💳 Manage Subscription
          </button>
        }
      />

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">💳 Subscription</div>
          </div>
          <div className="card-body">
            <div className="sidebar-plan" style={{ margin: 0 }}>
              <div className="sp-plan-title">Account</div>
              <div className="sp-plan-name">{user?.name || 'Doctor'}</div>
            </div>
            <div className="advice-box" style={{ marginTop: 16 }}>
              <div className="advice-title">Payment Methods</div>
              <div className="advice-item">
                <span className="advice-dot">▶</span>
                PhonePe · GPay · Paytm QR — direct to clinic account
              </div>
              <div className="advice-item">
                <span className="advice-dot">▶</span>
                NPCI UPI AutoPay for monthly renewal
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">🎁 Referral Rewards</div>
          </div>
          <div className="card-body">
            {referralTiers.map((tier) => (
              <div key={tier.count} className="appt-row">
                <div className="appt-info">
                  <div className="appt-name">{tier.count} verified referrals</div>
                  <div className="appt-reason">{tier.reward}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
