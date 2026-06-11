const { DataTypes } = require('sequelize');

function definePrescriptionPg(sequelize) {
  return sequelize.define(
    'PrescriptionPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      patient_id: { type: DataTypes.UUID, allowNull: false },
      doctor_id: { type: DataTypes.UUID, allowNull: true },
      items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      notes: { type: DataTypes.TEXT, allowNull: true },
      pdf_url: { type: DataTypes.TEXT, allowNull: true },
      patient_name: { type: DataTypes.STRING(255), allowNull: true },
      patient_age: { type: DataTypes.INTEGER, allowNull: true },
      patient_gender: { type: DataTypes.STRING(32), allowNull: true },
      patient_weight: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
      bp_systolic: { type: DataTypes.INTEGER, allowNull: true },
      bp_diastolic: { type: DataTypes.INTEGER, allowNull: true },
      bp_status: { type: DataTypes.STRING(64), allowNull: true },
      symptoms_json: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
      symptom_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      positive_symptom_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      negative_symptom_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      polarity: { type: DataTypes.STRING(32), allowNull: true },
      vitiation_type: { type: DataTypes.STRING(64), allowNull: true },
      phase: { type: DataTypes.STRING(32), allowNull: true },
      dilution: { type: DataTypes.STRING(64), allowNull: true },
      electricity: { type: DataTypes.STRING(64), allowNull: true },
      medicines_json: { type: DataTypes.JSONB, allowNull: true },
      improvement_percent: { type: DataTypes.INTEGER, allowNull: true },
      visit_number: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
      confidence_score: { type: DataTypes.INTEGER, allowNull: true },
      summary_en: { type: DataTypes.TEXT, allowNull: true },
      summary_hi: { type: DataTypes.TEXT, allowNull: true },
      summary_mr: { type: DataTypes.TEXT, allowNull: true },
      summary_gu: { type: DataTypes.TEXT, allowNull: true },
      summary_ta: { type: DataTypes.TEXT, allowNull: true },
      summary_te: { type: DataTypes.TEXT, allowNull: true },
      summary_kn: { type: DataTypes.TEXT, allowNull: true },
      summary_ur: { type: DataTypes.TEXT, allowNull: true },
      summary_bn: { type: DataTypes.TEXT, allowNull: true },
      summary_ar: { type: DataTypes.TEXT, allowNull: true },
      diet_do: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true },
      diet_dont: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true },
      follow_up_date: { type: DataTypes.DATEONLY, allowNull: true },
      doctor_action: { type: DataTypes.STRING(32), allowNull: true },
      modify_reason: { type: DataTypes.TEXT, allowNull: true },
      duration_label: { type: DataTypes.STRING(64), allowNull: true },
      duration_days: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
      tableName: 'prescriptions',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        { fields: ['patient_id'] },
        { fields: ['doctor_id'] },
        { fields: ['patient_name'] }
      ]
    }
  );
}

module.exports = { definePrescriptionPg };
