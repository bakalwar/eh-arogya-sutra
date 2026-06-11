const { DataTypes } = require('sequelize');

function defineLoginOtpPg(sequelize) {
  return sequelize.define(
    'LoginOtpPg',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: { type: DataTypes.UUID, allowNull: false },
      otp_secret: { type: DataTypes.STRING(64), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      verify_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      consumed_at: { type: DataTypes.DATE, allowNull: true }
    },
    {
      tableName: 'login_otps',
      freezeTableName: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false
    }
  );
}

module.exports = { defineLoginOtpPg };
