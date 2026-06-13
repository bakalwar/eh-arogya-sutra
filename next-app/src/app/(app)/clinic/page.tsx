'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/DashboardPanels';
import { formatTodayDate } from '@/lib/formatDate';
import { fetchBranding } from '@/lib/api/branding';
import { getCurrentUser } from '@/lib/session/tokenManager';

export default function ClinicProfilePage() {
  const user = getCurrentUser();
  const [clinicName, setClinicName] = useState('E.H. Arogya Sutra');
  const [clinicPhone, setClinicPhone] = useState('—');

  useEffect(() => {
    fetchBranding().then((b) => {
      if (b.clinicName) setClinicName(b.clinicName);
      if (b.clinicPhone) setClinicPhone(b.clinicPhone);
    });
  }, []);

  return (
    <>
      <PageHeader
        title={
          <>
            Clinic <span>Profile</span>
          </>
        }
        subtitle="Practice details, contact information, and public clinic branding."
        date={formatTodayDate()}
        mobileTitle={
          <>
            Clinic · <span>Profile</span>
          </>
        }
      />

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏥 Clinic Details</div>
          </div>
          <div className="card-body">
            <div className="clinic-info-grid">
              <div className="info-row">
                <div className="info-label">Clinic Name</div>
                <div className="info-val">{clinicName}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Doctor</div>
                <div className="info-val">{user?.name || '—'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Phone</div>
                <div className="info-val">{clinicPhone}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Email</div>
                <div className="info-val">{user?.email || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">✨ Branding</div>
          </div>
          <div className="card-body">
            <div className="advice-box">
              <div className="advice-item">
                <span className="advice-dot">▶</span>
                Clinic name shown on prescriptions and PDF exports
              </div>
              <div className="advice-item">
                <span className="advice-dot">▶</span>
                UPI payments linked to your clinic account
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
