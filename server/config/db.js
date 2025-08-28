const { Sequelize } = require("sequelize");
require("dotenv").config();

// Set up a new Sequelize instance using environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME, // Database name
  process.env.DB_USER, // Username
  process.env.DB_PASSWORD, // Password
  {
    host: process.env.DB_HOST, // Host
    dialect: "mysql", // Dialect
  }
);

module.exports = sequelize;
