const sequelize = require('./db');
const News = require('./News');
const Recommendations = require('./Recommendations');
const Seasons = require('./Seasons');
const Users = require('./Users');
const UserInteractions = require('./UserInteractions');
const Favorites = require('./Favorites');
const BannedWords = require('./BannedWords');
const Notifications = require('./Notifications');
const Reports = require('./Reports');

module.exports = {
    sequelize,
    News,
    Recommendations,
    Seasons,
    Users,
    UserInteractions,
    Favorites,
    BannedWords,
    Notifications,
    Reports
};
