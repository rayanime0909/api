const { DataTypes } = require("sequelize");
const sequelize = require('./db');

const Recommendations = sequelize.define("Recommendations", {
  url: { type: DataTypes.STRING },
  routes: { type: DataTypes.STRING, defaultValue: "recommendations" },
  publisherId: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING },
  title_english: { type: DataTypes.STRING },
  imageUrl: { type: DataTypes.STRING },
  studio: { type: DataTypes.TEXT },
  genres: { type: DataTypes.TEXT },
  episodes: { type: DataTypes.INTEGER },
  season: { type: DataTypes.STRING },
  year: { type: DataTypes.INTEGER },
  age: { type: DataTypes.STRING },
  aired_from: { type: DataTypes.STRING },
  aired_to: { type: DataTypes.STRING },
  trailer: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING },
  duration: { type: DataTypes.STRING },
  type: { type: DataTypes.STRING },
  source: { type: DataTypes.STRING },
  summary: { type: DataTypes.TEXT },
  views: { type: DataTypes.INTEGER },
  date: { type: DataTypes.STRING },
  score: { type: DataTypes.STRING },
  scored_by: { type: DataTypes.STRING },
  rank: { type: DataTypes.STRING },
  popularity: { type: DataTypes.STRING },
  members: { type: DataTypes.STRING },
  favorites: { type: DataTypes.STRING },
  totalScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalRaters: { type: DataTypes.INTEGER, defaultValue: 0 },
  averageScore: { type: DataTypes.FLOAT, defaultValue: 0 },
});

module.exports = Recommendations;
