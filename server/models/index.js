// models/index.js - File relasi dengan Many-to-Many
const CPL = require("./cpl");
const CPMK = require("./cpmk");
const MK = require("./mk");
const PL = require("./pl");
const Profile = require("./profile");
const SUBCPMK = require("./subcpmk");
const Users = require("./users");

// ===== ONE-TO-ONE & ONE-TO-MANY RELATIONS =====
// User relations (tetap one-to-many karena setiap record dimiliki oleh satu user)
Users.hasOne(Profile, { foreignKey: "userId", as: "profile" });
Profile.belongsTo(Users, { foreignKey: "userId", as: "user" });

Users.hasMany(PL, { foreignKey: "userId", as: "pl" });
PL.belongsTo(Users, { foreignKey: "userId", as: "user" });

Users.hasMany(CPL, { foreignKey: "userId", as: "cpl" });
CPL.belongsTo(Users, { foreignKey: "userId", as: "user" });

Users.hasMany(MK, { foreignKey: "userId", as: "mk" });
MK.belongsTo(Users, { foreignKey: "userId", as: "user" });

Users.hasMany(CPMK, { foreignKey: "userId", as: "cpmk" });
CPMK.belongsTo(Users, { foreignKey: "userId", as: "user" });

Users.hasMany(SUBCPMK, { foreignKey: "userId", as: "subcpmk" });
SUBCPMK.belongsTo(Users, { foreignKey: "userId", as: "user" });

// ===== MANY-TO-MANY RELATIONS =====

// 1. CPL - PL (Many-to-Many)
// Satu CPL bisa memiliki banyak PL, dan satu PL bisa dimiliki oleh banyak CPL
CPL.belongsToMany(PL, {
  through: "cpl_pl", // nama tabel junction
  foreignKey: "cplId",
  otherKey: "plId",
  as: "pl",
});
PL.belongsToMany(CPL, {
  through: "cpl_pl",
  foreignKey: "plId",
  otherKey: "cplId",
  as: "cpl",
});

// 2. MK - CPL (Many-to-Many)
// Satu MK bisa memiliki banyak CPL, dan satu CPL bisa digunakan oleh banyak MK
MK.belongsToMany(CPL, {
  through: "mk_cpl",
  foreignKey: "mkId",
  otherKey: "cplId",
  as: "cpl",
});
CPL.belongsToMany(MK, {
  through: "mk_cpl",
  foreignKey: "cplId",
  otherKey: "mkId",
  as: "mk",
});

// 3. MK - CPMK (Many-to-Many)
// Satu MK bisa memiliki banyak CPMK, dan satu CPMK bisa digunakan oleh banyak MK
MK.belongsToMany(CPMK, {
  through: "mk_cpmk",
  foreignKey: "mkId",
  otherKey: "cpmkId",
  as: "cpmk",
});
CPMK.belongsToMany(MK, {
  through: "mk_cpmk",
  foreignKey: "cpmkId",
  otherKey: "mkId",
  as: "mk",
});

// 4. CPL - CPMK (Many-to-Many)
// Satu CPL bisa memiliki banyak CPMK, dan satu CPMK bisa terkait dengan banyak CPL
CPL.belongsToMany(CPMK, {
  through: "cpl_cpmk",
  foreignKey: "cplId",
  otherKey: "cpmkId",
  as: "cpmk",
});
CPMK.belongsToMany(CPL, {
  through: "cpl_cpmk",
  foreignKey: "cpmkId",
  otherKey: "cplId",
  as: "cpl",
});

// Satu CPL bisa memiliki banyak CPMK, dan satu CPMK bisa terkait dengan banyak CPL
SUBCPMK.belongsToMany(CPMK, {
  through: "subcpmk_cpmk",
  foreignKey: "subcpmklId",
  otherKey: "cpmkId",
  as: "cpmk",
});
CPMK.belongsToMany(SUBCPMK, {
  through: "subcpmk_cpmk",
  foreignKey: "cpmkId",
  otherKey: "subcpmklId",
  as: "subcpmk",
});

module.exports = {
  PL,
  CPL,
  CPMK,
  SUBCPMK,
  MK,
  Users,
  Profile,
};
