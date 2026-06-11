const { defineUserPg } = require('./User.pg');
const { definePatientPg } = require('./Patient.pg');
const { defineMedicinePg } = require('./Medicine.pg');
const { definePrescriptionPg } = require('./Prescription.pg');
const { defineReportPg } = require('./Report.pg');
const { defineAuditLogPg } = require('./AuditLog.pg');
const { defineMedicalRulePg } = require('./MedicalRule.pg');
const { defineSymptomPg } = require('./Symptom.pg');
const { defineRefreshTokenPg } = require('./RefreshToken.pg');
const { defineLoginOtpPg } = require('./LoginOtp.pg');
const { defineBloodTestValuePg } = require('./BloodTestValue.pg');
const { defineTranslationCachePg } = require('./TranslationCache.pg');
const { defineSubscriptionPg } = require('./Subscription.pg');
const { definePaymentPg } = require('./Payment.pg');
const { defineReferralPg } = require('./Referral.pg');

/**
 * Register all PostgreSQL Sequelize models + associations.
 * Table layout must match `database/schema.sql` (+ optional migrations).
 */
function initModels(sequelize) {
  const UserPg = defineUserPg(sequelize);
  const PatientPg = definePatientPg(sequelize);
  const MedicinePg = defineMedicinePg(sequelize);
  const SymptomPg = defineSymptomPg(sequelize);
  const PrescriptionPg = definePrescriptionPg(sequelize);
  const ReportPg = defineReportPg(sequelize);
  const AuditLogPg = defineAuditLogPg(sequelize);
  const MedicalRulePg = defineMedicalRulePg(sequelize);
  const RefreshTokenPg = defineRefreshTokenPg(sequelize);
  const LoginOtpPg = defineLoginOtpPg(sequelize);
  const BloodTestValuePg = defineBloodTestValuePg(sequelize);
  const TranslationCachePg = defineTranslationCachePg(sequelize);
  const SubscriptionPg = defineSubscriptionPg(sequelize);
  const PaymentPg = definePaymentPg(sequelize);
  const ReferralPg = defineReferralPg(sequelize);

  UserPg.hasMany(PatientPg, { foreignKey: 'doctor_id', as: 'patients' });
  PatientPg.belongsTo(UserPg, { foreignKey: 'doctor_id', as: 'doctor' });

  PatientPg.hasMany(PrescriptionPg, { foreignKey: 'patient_id', as: 'prescriptions' });
  PrescriptionPg.belongsTo(PatientPg, { foreignKey: 'patient_id', as: 'patient' });
  PrescriptionPg.belongsTo(UserPg, { foreignKey: 'doctor_id', as: 'prescribingDoctor' });

  PatientPg.hasMany(ReportPg, { foreignKey: 'patient_id', as: 'reports' });
  ReportPg.belongsTo(PatientPg, { foreignKey: 'patient_id', as: 'patient' });

  AuditLogPg.belongsTo(UserPg, { foreignKey: 'user_id', as: 'actor', constraints: false });

  UserPg.hasMany(RefreshTokenPg, { foreignKey: 'user_id', as: 'refreshTokens' });
  RefreshTokenPg.belongsTo(UserPg, { foreignKey: 'user_id', as: 'user' });

  UserPg.hasMany(LoginOtpPg, { foreignKey: 'user_id', as: 'loginOtps' });
  LoginOtpPg.belongsTo(UserPg, { foreignKey: 'user_id', as: 'user' });

  TranslationCachePg.belongsTo(PrescriptionPg, {
    foreignKey: 'prescription_id',
    as: 'prescription',
    constraints: false
  });

  // Admin / Subscription Associations
  UserPg.hasMany(SubscriptionPg, { foreignKey: 'doctor_id', as: 'subscriptions' });
  SubscriptionPg.belongsTo(UserPg, { foreignKey: 'doctor_id', as: 'doctor' });

  UserPg.hasMany(PaymentPg, { foreignKey: 'doctor_id', as: 'payments' });
  PaymentPg.belongsTo(UserPg, { foreignKey: 'doctor_id', as: 'doctor' });
  PaymentPg.belongsTo(SubscriptionPg, { foreignKey: 'subscription_id', as: 'subscription' });

  UserPg.hasMany(ReferralPg, { foreignKey: 'referrer_id', as: 'referralsGiven' });
  UserPg.hasOne(ReferralPg, { foreignKey: 'referred_id', as: 'referralReceived' });
  ReferralPg.belongsTo(UserPg, { foreignKey: 'referrer_id', as: 'referrer' });
  ReferralPg.belongsTo(UserPg, { foreignKey: 'referred_id', as: 'referredUser' });

  return {
    UserPg,
    PatientPg,
    MedicinePg,
    SymptomPg,
    PrescriptionPg,
    ReportPg,
    AuditLogPg,
    MedicalRulePg,
    RefreshTokenPg,
    LoginOtpPg,
    BloodTestValuePg,
    TranslationCachePg,
    SubscriptionPg,
    PaymentPg,
    ReferralPg
  };
}

module.exports = { initModels };
