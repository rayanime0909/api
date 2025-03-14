const { DataTypes } = require("sequelize");
const sequelize = require('./db');
const Users = require('./Users');

const BannedWords = sequelize.define("BannedWords", {
  word: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  addedBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

BannedWords.belongsTo(Users, { foreignKey: "addedBy", as: "User" });
Users.hasMany(BannedWords, { foreignKey: "addedBy", as: "BannedWords"});

module.exports = BannedWords;
