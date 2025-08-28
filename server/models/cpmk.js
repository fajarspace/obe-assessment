// models/cpmk.js - Updated
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CPMK = sequelize.define(
  "CPMK",
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
    // Hapus mkId dan cplId karena sekarang many-to-many melalui junction table
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    tableName: "cpmk",
  }
);

module.exports = CPMK;
