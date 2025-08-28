// models/subcpmk.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SUBCPMK = sequelize.define(
  "SUBCPMK",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    kode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    tableName: "subcpmk",
  }
);

module.exports = SUBCPMK;
