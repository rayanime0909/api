const { DataTypes } = require("sequelize");
const sequelize = require('./db');

const Reports = sequelize.define("Reports", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reporterId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Reports;
