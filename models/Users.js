const { DataTypes } = require("sequelize");
const sequelize = require('./db');

const Users = sequelize.define("User", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  loginMethod: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "email",
    validate: {
      isIn: [["email", "google"]],
    }
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: "",
  },
  repliesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ratingsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  role: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
});

module.exports = Users;
