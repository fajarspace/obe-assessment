// models/mk.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MK = sequelize.define(
  "MK",
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
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 6,
      },
    },
    prodi: {
      type: DataTypes.ENUM(
        "Teknik Informatika",
        "Teknik Industri",
        "Teknik Sipil",
        "Arsitektur",
        "Teknik Lingkungan",
        "Teknologi Hasil Pertanian"
      ),
      allowNull: false,
    },
    jenis: {
      type: DataTypes.ENUM(
        "Wajib",
        "Pilihan",
        "MK Program Studi",
        "MKDU Universitas",
        "MKDU fakultas"
      ),
      allowNull: false,
      defaultValue: "MK Program Studi",
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    tableName: "mk",
  }
);

module.exports = MK;
