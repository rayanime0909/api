const { DataTypes } = require("sequelize");
const sequelize = require('./db');

const Favorites = sequelize.define('Favorites', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  itemType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'favorites',
  timestamps: true,
});

module.exports = Favorites;
