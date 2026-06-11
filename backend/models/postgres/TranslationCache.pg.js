const { DataTypes } = require('sequelize');

function defineTranslationCachePg(sequelize) {
  return sequelize.define(
    'TranslationCachePg',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      hash: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      original_text: { type: DataTypes.STRING(200), allowNull: true },
      language: { type: DataTypes.STRING(5), allowNull: false },
      translated_text: { type: DataTypes.TEXT, allowNull: false },
      prescription_id: { type: DataTypes.UUID, allowNull: true }
    },
    {
      tableName: 'translation_cache',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );
}

module.exports = { defineTranslationCachePg };
