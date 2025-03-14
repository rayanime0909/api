const { DataTypes } = require("sequelize");
const sequelize = require('./db');

const UserInteractions = sequelize.define("UserInteractions", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  commentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  likeType: {
    type: DataTypes.ENUM("like", "dislike"),
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = UserInteractions;
