const { DataTypes } = require('sequelize');

/**
 * Maps to `payments` in database/schema.sql (PostgreSQL).
 */
function definePaymentPg(sequelize) {
  return sequelize.define(
    'PaymentPg',
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
      subscription_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'subscriptions', key: 'id' }
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      payment_platform: {
        type: DataTypes.STRING(64),
        allowNull: true // 'phonepe', 'gpay', 'paytm'
      },
      upi_ref_id: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      screenshot_url: {
        type: DataTypes.STRING(512),
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(32),
        defaultValue: 'pending' // 'pending', 'verified', 'failed'
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'payments',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );
}

module.exports = { definePaymentPg };
