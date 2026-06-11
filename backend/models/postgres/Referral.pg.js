const { DataTypes } = require('sequelize');

/**
 * Maps to `referrals` in database/schema.sql (PostgreSQL).
 */
function defineReferralPg(sequelize) {
  return sequelize.define(
    'ReferralPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      referrer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      referred_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      referral_code: {
        type: DataTypes.STRING(64),
        allowNull: false
      },
      reward_given: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'referrals',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );
}

module.exports = { defineReferralPg };
