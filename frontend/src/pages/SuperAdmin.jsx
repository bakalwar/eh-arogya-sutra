import { Navigate, Route, Routes } from 'react-router-dom';
import SuperAdminLayout from '../components/superadmin/SuperAdminLayout';
import {
  OverviewPage,
  DoctorsPage,
  RevenuePage,
  SubscriptionsPage,
  PricingPage,
  ReferralsPage,
  MedicinesPage,
  BooksPage,
  VideosPage,
  PharmacyPage,
  SettingsPage,
  SecurityPage,
  AnnouncementsPage
} from './superadmin/SuperAdminPages';

export default function SuperAdmin() {
  return (
    <Routes>
      <Route element={<SuperAdminLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="books" element={<BooksPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="pharmacy" element={<PharmacyPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
      </Route>
    </Routes>
  );
}
