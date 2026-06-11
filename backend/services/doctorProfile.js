const path = require('path');
const fs = require('fs');
const { getPostgresModels } = require('../utils/dataSource');

const DEFAULT_SHOW = {
  doctorName: true,
  registrationNumber: true,
  clinicName: true,
  clinicPhone: true,
  clinicAddress: true,
  timing: true,
  digitalSignature: true
};

const COMPLETION_CHECKS = [
  { key: 'fullName', label: 'Full name', test: (p) => !!(p.fullName || p.name)?.trim() },
  { key: 'mobile', label: 'Mobile number', test: (p) => !!p.mobile?.trim() },
  { key: 'email', label: 'Email address', test: (p) => !!p.email?.trim() },
  { key: 'address', label: 'Doctor address', test: (p) => p.addressStreet && p.addressCity && p.addressState },
  { key: 'primaryDegree', label: 'Primary degree', test: (p) => !!p.primaryDegree },
  { key: 'registrationNumber', label: 'Registration number', test: (p) => !!p.registrationNumber?.trim() },
  { key: 'university', label: 'University / institute', test: (p) => !!p.university?.trim() },
  { key: 'clinicName', label: 'Clinic name', test: (p) => !!p.clinicName?.trim() },
  { key: 'clinicPhone', label: 'Clinic phone', test: (p) => !!p.clinicPhone?.trim() },
  { key: 'clinicAddress', label: 'Clinic address', test: (p) => p.clinicAddressStreet && p.clinicAddressCity },
  { key: 'clinicTiming', label: 'Clinic timing', test: (p) => !!p.clinicTimingWeekdays?.trim() },
  { key: 'signature', label: 'Signature upload', test: (p) => !!p.signaturePath },
  { key: 'profilePhoto', label: 'Profile photo', test: (p) => !!p.profilePhotoPath }
];

function parseJsonArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function userRowToProfile(row) {
  const u = row.get ? row.get({ plain: true }) : row;
  const show = { ...DEFAULT_SHOW, ...(u.prescription_show || {}) };
  const addQual = parseJsonArray(u.additional_qualifications);
  const specs = Array.isArray(u.specializations) ? u.specializations : [];

  return {
    id: String(u.id),
    name: u.name || '',
    fullName: u.full_name || u.name || '',
    mobile: u.mobile || '',
    email: u.email || '',
    dateOfBirth: u.date_of_birth ? String(u.date_of_birth).slice(0, 10) : '',
    gender: u.gender || '',
    addressStreet: u.address_street || '',
    addressCity: u.address_city || '',
    addressState: u.address_state || '',
    addressPin: u.address_pin || '',
    primaryDegree: u.primary_degree || 'BEMS',
    primaryDegreeOther: u.primary_degree_other || '',
    additionalQualifications: addQual,
    registrationNumber: u.registration_number || '',
    registrationAuthority: u.registration_authority || '',
    registrationValid: u.registration_valid ? String(u.registration_valid).slice(0, 10) : '',
    yearOfPassing: u.year_of_passing || '',
    university: u.university || '',
    specializations: specs,
    specializationOther: u.specialization_other || '',
    experienceYears: u.experience_years != null ? String(u.experience_years) : '',
    clinicName: u.clinic_name || '',
    clinicLogoPath: u.clinic_logo_path || '',
    clinicPhone: u.clinic_phone || '',
    clinicEmail: u.clinic_email || '',
    clinicWebsite: u.clinic_website || '',
    clinicAddressStreet: u.clinic_address_street || '',
    clinicAddressCity: u.clinic_address_city || '',
    clinicAddressState: u.clinic_address_state || '',
    clinicAddressPin: u.clinic_address_pin || '',
    clinicDistrict: u.clinic_district || '',
    googleMapsLink: u.google_maps_link || '',
    clinicTimingWeekdays: u.clinic_timing_weekdays || '9:00 AM - 6:00 PM',
    clinicTimingSunday: u.clinic_timing_sunday || 'Closed',
    consultationFee: u.consultation_fee != null ? String(u.consultation_fee) : '',
    profilePhotoPath: u.profile_photo_path || '',
    signaturePath: u.signature_path || '',
    sealPath: u.seal_path || '',
    prescriptionHeaderName: u.prescription_header_name || '',
    prescriptionDisclaimer: u.prescription_disclaimer || '',
    prescriptionShow: show,
    pharmacyContact: u.pharmacy_contact || '',
    pharmacyWhatsapp: u.pharmacy_whatsapp || '',
    pharmacyMessage:
      u.pharmacy_message ||
      'Medicine ke behtar results ke liye E.H. AROGYA SUTRA se sampark karen',
    profileCompleted: !!u.profile_completed
  };
}

function computeCompletion(profile) {
  const missing = [];
  let done = 0;
  COMPLETION_CHECKS.forEach((c) => {
    if (c.test(profile)) done += 1;
    else missing.push(c.label);
  });
  const percent = Math.round((done / COMPLETION_CHECKS.length) * 100);
  return { percent, missing, total: COMPLETION_CHECKS.length, done };
}

function bodyToUpdate(body) {
  const specs = Array.isArray(body.specializations) ? body.specializations : [];
  const addQual = Array.isArray(body.additionalQualifications)
    ? body.additionalQualifications
    : parseJsonArray(body.additionalQualifications);

  const show = { ...DEFAULT_SHOW, ...(body.prescriptionShow || {}) };

  const patch = {
    full_name: body.fullName?.trim() || body.name?.trim() || null,
    name: body.fullName?.trim() || body.name?.trim() || undefined,
    email: body.email?.trim() || null,
    date_of_birth: body.dateOfBirth || null,
    gender: body.gender || null,
    address_street: body.addressStreet || null,
    address_city: body.addressCity || null,
    address_state: body.addressState || null,
    address_pin: body.addressPin || null,
    primary_degree: body.primaryDegree || null,
    primary_degree_other: body.primaryDegreeOther || null,
    additional_qualifications: JSON.stringify(addQual.filter(Boolean)),
    registration_number: body.registrationNumber || null,
    registration_authority: body.registrationAuthority || null,
    registration_valid: body.registrationValid || null,
    year_of_passing: body.yearOfPassing || null,
    university: body.university || null,
    specializations: specs,
    specialization_other: body.specializationOther || null,
    experience_years: body.experienceYears ? parseInt(body.experienceYears, 10) : null,
    clinic_name: body.clinicName || null,
    clinic_logo_path: body.clinicLogoPath || null,
    clinic_phone: body.clinicPhone || null,
    clinic_email: body.clinicEmail || null,
    clinic_website: body.clinicWebsite || null,
    clinic_address_street: body.clinicAddressStreet || null,
    clinic_address_city: body.clinicAddressCity || null,
    clinic_address_state: body.clinicAddressState || null,
    clinic_address_pin: body.clinicAddressPin || null,
    clinic_district: body.clinicDistrict || null,
    google_maps_link: body.googleMapsLink || null,
    clinic_timing_weekdays: body.clinicTimingWeekdays || null,
    clinic_timing_sunday: body.clinicTimingSunday || null,
    consultation_fee: body.consultationFee ? parseInt(body.consultationFee, 10) : null,
    profile_photo_path: body.profilePhotoPath || null,
    signature_path: body.signaturePath || null,
    seal_path: body.sealPath || null,
    prescription_header_name: body.prescriptionHeaderName || null,
    prescription_disclaimer: body.prescriptionDisclaimer || null,
    prescription_show: show,
    pharmacy_contact: body.pharmacyContact || null,
    pharmacy_whatsapp: body.pharmacyWhatsapp || null,
    pharmacy_message: body.pharmacyMessage || null
  };

  Object.keys(patch).forEach((k) => {
    if (patch[k] === undefined) delete patch[k];
  });

  return patch;
}

async function loadUserProfile(userId) {
  const { UserPg } = getPostgresModels();
  const user = await UserPg.findByPk(userId);
  if (!user) return null;
  const profile = userRowToProfile(user);
  const completion = computeCompletion(profile);
  return { profile, completion };
}

function profileToBranding(profile) {
  const doctorName = profile.fullName || profile.name || 'Doctor';
  const clinicName = profile.clinicName || 'E.H. AROGYA SUTRA';
  const clinicPhone = profile.clinicPhone || profile.pharmacyContact || '';
  const header =
    profile.prescriptionHeaderName?.trim() || `${doctorName} · ${clinicName}`;
  const addressParts = [
    profile.clinicAddressStreet,
    profile.clinicAddressCity,
    profile.clinicAddressState,
    profile.clinicAddressPin
  ].filter(Boolean);

  return {
    clinicName,
    clinicPhone,
    doctorName,
    registrationNumber: profile.registrationNumber,
    headerName: header,
    address: addressParts.join(', '),
    timing: [profile.clinicTimingWeekdays, profile.clinicTimingSunday && `Sun: ${profile.clinicTimingSunday}`]
      .filter(Boolean)
      .join(' · '),
    footerLine: `${clinicName} · ${clinicPhone}`,
    pharmacyContact: profile.pharmacyContact,
    pharmacyWhatsapp: profile.pharmacyWhatsapp,
    pharmacyMessage: profile.pharmacyMessage
  };
}

function profileToPdfPayload(profile) {
  const branding = profileToBranding(profile);
  const show = profile.prescriptionShow || DEFAULT_SHOW;
  const timing = branding.timing;

  return {
    clinicName: show.clinicName !== false ? branding.clinicName : branding.headerName,
    clinicPhone: show.clinicPhone !== false ? branding.clinicPhone : '',
    doctorName: show.doctorName !== false ? branding.doctorName : '',
    regNumber: show.registrationNumber !== false ? branding.registrationNumber : '',
    headerName: branding.headerName,
    address: show.clinicAddress !== false ? branding.address : '',
    timing: show.timing !== false ? timing : '',
    signaturePath: show.digitalSignature !== false ? profile.signaturePath : '',
    sealPath: profile.sealPath || '',
    disclaimer: profile.prescriptionDisclaimer || '',
    pharmacyContact: profile.pharmacyContact || '',
    pharmacyMessage: profile.pharmacyMessage || '',
    consultationFee: profile.consultationFee || ''
  };
}

async function loadPdfPayloadForDoctor(doctorId) {
  const loaded = await loadUserProfile(doctorId);
  if (!loaded) return null;
  return profileToPdfPayload(loaded.profile);
}

function resolveUploadPath(webPath) {
  if (!webPath) return null;
  const rel = webPath.replace(/^\//, '');
  const abs = path.join(__dirname, '../..', rel);
  return fs.existsSync(abs) ? abs : null;
}

module.exports = {
  DEFAULT_SHOW,
  userRowToProfile,
  computeCompletion,
  bodyToUpdate,
  loadUserProfile,
  profileToBranding,
  profileToPdfPayload,
  loadPdfPayloadForDoctor,
  resolveUploadPath
};
