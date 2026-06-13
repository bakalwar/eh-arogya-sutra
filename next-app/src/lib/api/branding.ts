import { apiRequest } from '@/lib/api/client';

export interface BrandingData {
  clinicName?: string;
  clinicPhone?: string;
  footerLine?: string;
}

export async function fetchBranding(): Promise<BrandingData> {
  try {
    const res = await apiRequest<{ success: boolean; data?: BrandingData }>('/api/branding', {
      auth: false,
    });
    return res?.data || {};
  } catch {
    return {
      clinicName: 'E.H. Arogya Sutra',
      clinicPhone: '9098791989',
    };
  }
}
