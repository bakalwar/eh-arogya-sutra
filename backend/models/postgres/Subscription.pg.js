const { DataTypes } = require('sequelize');

/**
 * Maps to `subscriptions` in database/schema.sql (PostgreSQL).
 */
function defineSubscriptionPg(sequelize) {
  return sequelize.define(
    'SubscriptionPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      doctor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      plan_type: {
        type: DataTypes.STRING(32),
        allowNull: false // 'basic', 'pro', 'trial'
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false // 'active', 'expired', 'cancelled'
      },
      price_paid: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
      },
      start_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      payment_method: {
        type: DataTypes.STRING(64),
        allowNull: true
      }
    },
    {
      tableName: 'subscriptions',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );
}

module.exports = { defineSubscriptionPg };
