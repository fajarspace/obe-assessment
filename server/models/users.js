// models/users.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Users = sequelize.define(
  "Users",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    picture: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.ENUM("dosen", "prodi", "admin"),
      allowNull: false,
      defaultValue: "dosen",
    },
    whoamiId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    tableName: "users",
  }
);

module.exports = Users;
