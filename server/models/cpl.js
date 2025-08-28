// models/cpl.js - Updated
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CPL = sequelize.define(
  "CPL",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    kode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // Hapus mkId karena sekarang many-to-many melalui junction table
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    tableName: "cpl",
  }
);

module.exports = CPL;
