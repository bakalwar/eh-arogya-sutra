const { DataTypes } = require('sequelize');

function defineSymptomPg(sequelize) {
  return sequelize.define(
    'SymptomPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: { type: DataTypes.STRING(512), allowNull: false },
      name_hi: { type: DataTypes.STRING(512), allowNull: true },
      aliases: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: true, defaultValue: [] }
    },
    {
      tableName: 'symptoms',
      freezeTableName: true,
      indexes: [{ fields: ['name'] }]
    }
  );
}

module.exports = { defineSymptomPg };
