const { DataTypes } = require('sequelize');

/**
 * Electro-Homeopathy medicine library + generic rows.
 * `search_document` TSVECTOR — refreshed via seed / SQL after bulk writes.
 */
function defineMedicinePg(sequelize) {
  return sequelize.define(
    'MedicinePg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: { type: DataTypes.STRING(255), allowNull: false },
      system: { type: DataTypes.STRING(64), allowNull: false },
      polarity_hint: { type: DataTypes.STRING(64), allowNull: true },
      /** Mattei groups: Scrofoloso, Canceroso, Angiotico, Linfatico, Melancholic, Phosphoric, Mixed, … */
      medicine_group: { type: DataTypes.STRING(64), allowNull: true },
      /** e.g. 1:9, 1:47 */
      dilution: { type: DataTypes.STRING(32), allowNull: true },
      indications: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      tableName: 'medicines',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [{ fields: ['medicine_group'] }]
    }
  );
}

module.exports = { defineMedicinePg };
