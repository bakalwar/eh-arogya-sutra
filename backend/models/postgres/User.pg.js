const { DataTypes } = require('sequelize');

/**
 * Maps to `users` in database/schema.sql (PostgreSQL).
 * Model name `UserPg` avoids collision with Mongoose `User`.
 */
function defineUserPg(sequelize) {
  return sequelize.define(
    'UserPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: { type: DataTypes.STRING(255), allowNull: false },
      mobile: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: true },
      role: {
        type: DataTypes.STRING(32),
        allowNull: false,
        validate: { isIn: [['admin', 'doctor', 'patient', 'super_admin']] }
      },
      referral_code: { type: DataTypes.STRING(64), allowNull: true, unique: true },
      referred_by: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      subscription_status: { 
        type: DataTypes.STRING(32), 
        allowNull: true, 
        defaultValue: 'trial' // 'trial', 'basic', 'pro', 'expired'
      },
      trial_ends_at: { type: DataTypes.DATE, allowNull: true },
      patient_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      
      // Legacy / Additional fields
      failed_login_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      locked_until: { type: DataTypes.DATE, allowNull: true },
      totp_secret: { type: DataTypes.STRING(64), allowNull: true },
      full_name: { type: DataTypes.STRING(200), allowNull: true },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
      gender: { type: DataTypes.STRING(20), allowNull: true },
      address_street: { type: DataTypes.TEXT, allowNull: true },
      address_city: { type: DataTypes.STRING(100), allowNull: true },
      address_state: { type: DataTypes.STRING(100), allowNull: true },
      address_pin: { type: DataTypes.STRING(10), allowNull: true },
      primary_degree: { type: DataTypes.STRING(100), allowNull: true },
      primary_degree_other: { type: DataTypes.STRING(200), allowNull: true },
      additional_qualifications: { type: DataTypes.TEXT, allowNull: true },
      registration_number: { type: DataTypes.STRING(100), allowNull: true },
      registration_authority: { type: DataTypes.STRING(200), allowNull: true },
      registration_valid: { type: DataTypes.DATEONLY, allowNull: true },
      year_of_passing: { type: DataTypes.STRING(10), allowNull: true },
      university: { type: DataTypes.STRING(200), allowNull: true },
      specializations: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true, defaultValue: [] },
      specialization_other: { type: DataTypes.STRING(200), allowNull: true },
      experience_years: { type: DataTypes.INTEGER, allowNull: true },
      clinic_name: { type: DataTypes.STRING(200), allowNull: true },
      clinic_logo_path: { type: DataTypes.STRING(500), allowNull: true },
      clinic_phone: { type: DataTypes.STRING(20), allowNull: true },
      clinic_email: { type: DataTypes.STRING(200), allowNull: true },
      clinic_website: { type: DataTypes.STRING(200), allowNull: true },
      clinic_address_street: { type: DataTypes.TEXT, allowNull: true },
      clinic_address_city: { type: DataTypes.STRING(100), allowNull: true },
      clinic_address_state: { type: DataTypes.STRING(100), allowNull: true },
      clinic_address_pin: { type: DataTypes.STRING(10), allowNull: true },
      clinic_district: { type: DataTypes.STRING(100), allowNull: true },
      google_maps_link: { type: DataTypes.TEXT, allowNull: true },
      clinic_timing_weekdays: { type: DataTypes.STRING(200), allowNull: true },
      clinic_timing_sunday: { type: DataTypes.STRING(100), allowNull: true },
      consultation_fee: { type: DataTypes.INTEGER, allowNull: true },
      profile_photo_path: { type: DataTypes.STRING(500), allowNull: true },
      signature_path: { type: DataTypes.STRING(500), allowNull: true },
      seal_path: { type: DataTypes.STRING(500), allowNull: true },
      prescription_header_name: { type: DataTypes.STRING(300), allowNull: true },
      prescription_disclaimer: { type: DataTypes.TEXT, allowNull: true },
      prescription_show: { type: DataTypes.JSONB, allowNull: true },
      pharmacy_contact: { type: DataTypes.STRING(20), allowNull: true },
      pharmacy_whatsapp: { type: DataTypes.STRING(20), allowNull: true },
      pharmacy_message: { type: DataTypes.TEXT, allowNull: true },
      profile_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      is_suspended: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      last_login_at: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: 'users',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['mobile'] }]
    }
  );
}

module.exports = { defineUserPg };
