import client from './client';

const base = '/api/super-admin';

export const superAdminApi = {
  login: (body) => client.post(`${base}/login`, body),
  overview: () => client.get(`${base}/overview`),
  doctors: (params) => client.get(`${base}/doctors`, { params }),
  doctor: (id) => client.get(`${base}/doctors/${id}`),
  updateDoctor: (id, body) => client.patch(`${base}/doctors/${id}`, body),
  revenue: () => client.get(`${base}/revenue`),
  subscriptions: () => client.get(`${base}/subscriptions`),
  extendSubscription: (body) => client.post(`${base}/subscriptions/extend`, body),
  pricing: () => client.get(`${base}/pricing`),
  savePricing: (body) => client.put(`${base}/pricing`, body),
  createCoupon: (body) => client.post(`${base}/coupons`, body),
  referrals: () => client.get(`${base}/referrals`),
  saveReferralRules: (body) => client.put(`${base}/referrals/rules`, body),
  medicines: () => client.get(`${base}/medicines`),
  deleteMedicine: (id) => client.delete(`${base}/medicines/${id}`),
  books: () => client.get(`${base}/books`),
  videos: () => client.get(`${base}/videos`),
  approveVideo: (id) => client.post(`${base}/videos/${id}/approve`),
  rejectVideo: (id, body) => client.post(`${base}/videos/${id}/reject`, body),
  pharmacy: () => client.get(`${base}/pharmacy`),
  savePharmacySettings: (body) => client.put(`${base}/pharmacy/settings`, body),
  settings: () => client.get(`${base}/settings`),
  saveSettings: (body) => client.put(`${base}/settings`, body),
  security: () => client.get(`${base}/security`),
  announcements: () => client.get(`${base}/announcements`),
  sendAnnouncement: (body) => client.post(`${base}/announcements`, body),
  bloodTests: () => client.get(`${base}/blood-tests`)
};
