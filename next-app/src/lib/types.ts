export type PolarityType = 'positive' | 'negative' | 'mixed';

export interface DoctorProfile {
  initials: string;
  name: string;
  plan: string;
  planDaysRemaining: number;
  planProgress: number;
}

export interface StatItem {
  icon: string;
  value: number | string;
  label: string;
  change: string;
  trend: 'up' | 'down';
}

export interface PatientRecord {
  id: string;
  initials: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  symptoms: string;
  polarity: PolarityType;
  formula: string[];
}

export interface FormulaItem {
  name: string;
  medicines: string[];
  potency: string;
  dose: string;
}

export interface PolarityReading {
  blood: { value: string; sub: string };
  lymph: { value: string; sub: string };
  disease: { value: string; sub: string };
}

export interface CaseSummary {
  patientId: string;
  patientName: string;
  mulank: number;
  numerologyCalc: string;
  numerologyResult: string;
  polarity: PolarityReading;
  formulas: FormulaItem[];
  dietDo: string[];
  dietDont: string[];
  advice: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  polarity: 'positive' | 'negative';
  formula: string[];
}

export interface Appointment {
  id: string;
  time: string;
  patientName: string;
  reason: string;
  status: 'pending' | 'done' | 'overdue';
}

export interface ClinicInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  registration: string;
  timings: string;
  specialties: string[];
}

export interface ReferralTier {
  count: number;
  reward: string;
}

export interface AdminMetric {
  label: string;
  value: string | number;
}

export interface NavItem {
  href: string;
  icon: string;
  label: string;
  sidebarLabel: string;
  section: 'main' | 'tools' | 'account';
  badge?: number;
  bottomNav?: boolean;
  moreMenu?: boolean;
}
