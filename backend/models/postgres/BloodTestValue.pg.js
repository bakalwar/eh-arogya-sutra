const { DataTypes } = require('sequelize');

function defineBloodTestValuePg(sequelize) {
  return sequelize.define(
    'BloodTestValuePg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      test_key: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      label: { type: DataTypes.STRING(128), allowNull: false },
      label_hi: { type: DataTypes.STRING(128), allowNull: true },
      unit: { type: DataTypes.STRING(32), allowNull: true },
      high_vitiation: { type: DataTypes.STRING(32), allowNull: true },
      low_vitiation: { type: DataTypes.STRING(32), allowNull: true },
      high_meaning: { type: DataTypes.TEXT, allowNull: true },
      low_meaning: { type: DataTypes.TEXT, allowNull: true },
      high_medicine_hint: { type: DataTypes.STRING(128), allowNull: true },
      low_medicine_hint: { type: DataTypes.STRING(128), allowNull: true },
      min_normal: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
      max_normal: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
      low_rog_polarity: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'negative'
      },
      high_rog_polarity: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'positive'
      },
      sort_order: { type: DataTypes.SMALLINT, allowNull: true, defaultValue: 0 }
    },
    {
      tableName: 'blood_test_values',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );
}

module.exports = { defineBloodTestValuePg };
