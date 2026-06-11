const { DataTypes } = require('sequelize');

function defineReportPg(sequelize) {
  return sequelize.define(
    'ReportPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      patient_id: { type: DataTypes.UUID, allowNull: true },
      file_url: { type: DataTypes.TEXT, allowNull: true },
      analysis: { type: DataTypes.TEXT, allowNull: true },
      analysis_json: { type: DataTypes.JSONB, allowNull: true },
      report_type: { type: DataTypes.STRING(32), allowNull: true }
    },
    {
      tableName: 'reports',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [{ fields: ['patient_id'] }]
    }
  );
}

module.exports = { defineReportPg };
