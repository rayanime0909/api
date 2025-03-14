const { DataTypes } = require("sequelize");
const sequelize = require('./db');

const News = sequelize.define("News", {
  id: { type: DataTypes.STRING, primaryKey: true },
  routes: { type: DataTypes.STRING, defaultValue: "news" },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => {
      const now = new Date();
      return now.toISOString().split("T")[0];
    },
  },
  content: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.BIGINT, allowNull: false },
  numRaters: { type: DataTypes.STRING, defaultValue: "0" },
  overallRating: { type: DataTypes.STRING, defaultValue: "0" },
  publisherId: { type: DataTypes.STRING, allowNull: false },
  views: { type: DataTypes.INTEGER, defaultValue: 0 },
  allowAds: { type: DataTypes.BOOLEAN, defaultValue: true },
  totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalRaters: { type: DataTypes.INTEGER, defaultValue: 0 },
  averageScore: { type: DataTypes.FLOAT, defaultValue: 0 },
});

module.exports = News;
