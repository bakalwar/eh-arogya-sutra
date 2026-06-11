const { DataTypes } = require('sequelize');

function definePatientPg(sequelize) {
  return sequelize.define(
    'PatientPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      doctor_id: { type: DataTypes.UUID, allowNull: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      age: { type: DataTypes.INTEGER, allowNull: true },
      gender: { type: DataTypes.STRING(32), allowNull: true },
      mobile: { type: DataTypes.STRING(20), allowNull: true },
      weight: { type: DataTypes.INTEGER, allowNull: true },
      personal_factor: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        validate: {
          isValid(v) {
            if (v == null) return;
            if (v < 1 || v > 9) throw new Error('personal_factor must be 1–9');
          }
        }
      },
      photo_url: { type: DataTypes.TEXT, allowNull: true },
      symptoms: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      tableName: 'patients',
      freezeTableName: true,
      indexes: [{ fields: ['doctor_id'] }]
    }
  );
}

module.exports = { definePatientPg };
