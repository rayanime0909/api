const { Sequelize } = require("sequelize");
const sqlite3 = require('sqlite3').verbose();

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "../anime-app.db",
  logging: false,
  dialectOptions: {
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    flags: ['OPEN_READWRITE', 'OPEN_CREATE'],
  }
});

module.exports = sequelize;
