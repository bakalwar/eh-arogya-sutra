const { DataTypes } = require('sequelize');

function defineAuditLogPg(sequelize) {
  return sequelize.define(
    'AuditLogPg',
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.UUID, allowNull: true },
      action: { type: DataTypes.STRING(128), allowNull: false },
      meta: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    },
    {
      tableName: 'audit_logs',
      freezeTableName: true,
      timestamps: false,
      updatedAt: false,
      createdAt: false
    }
  );
}

module.exports = { defineAuditLogPg };
