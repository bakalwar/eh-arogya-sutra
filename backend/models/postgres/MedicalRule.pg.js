const { DataTypes } = require('sequelize');

function defineMedicalRulePg(sequelize) {
  return sequelize.define(
    'MedicalRulePg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      key: { type: DataTypes.STRING(128), allowNull: false },
      rule_json: { type: DataTypes.JSONB, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
      tableName: 'medical_rules',
      freezeTableName: true,
      timestamps: false,
      updatedAt: false,
      createdAt: false,
      indexes: [{ unique: false, fields: ['key'] }]
    }
  );
}

module.exports = { defineMedicalRulePg };
