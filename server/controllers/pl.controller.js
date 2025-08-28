// controllers/pl.controller.js
const { PL, CPL } = require("../models");

const plController = {
  // Get all PL with related CPL
  getAll: async (req, res) => {
    try {
      const userId = req.user?.id;

      const pls = await PL.findAll({
        where: { userId },
        include: [
          {
            model: CPL,
            as: "cpl",
            through: { attributes: [] },
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Data PL berhasil diambil",
        data: pls,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data PL",
        error: error.message,
      });
    }
  },

  // Get PL by ID
  getById: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const pl = await PL.findOne({
        where: { id, userId },
        include: [{ model: CPL, as: "cpl", through: { attributes: [] } }],
      });

      if (!pl) {
        return res.status(404).json({
          success: false,
          message: "PL tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "PL berhasil diambil",
        data: pl,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil PL",
        error: error.message,
      });
    }
  },

  // Create new PL
  create: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      const { cplIds, ...plData } = req.body;

      const pl = await PL.create({
        ...plData,
        userId,
      });

      // Tambahkan relasi many-to-many dengan CPL
      if (cplIds && cplIds.length > 0) {
        const cpls = await CPL.findAll({ where: { id: cplIds, userId } });
        await pl.addCpl(cpls);
      }

      const plWithRelations = await PL.findByPk(pl.id, {
        include: [{ model: CPL, as: "cpl", through: { attributes: [] } }],
      });

      res.status(201).json({
        success: true,
        message: "PL berhasil dibuat",
        data: plWithRelations,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal membuat PL",
        error: error.message,
      });
    }
  },

  // Update PL
  update: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      const pl = await PL.findOne({
        where: { id, userId },
      });

      if (!pl) {
        return res.status(404).json({
          success: false,
          message: "PL tidak ditemukan atau tidak punya akses",
        });
      }

      const { cplIds, ...plData } = req.body;

      await pl.update(plData);

      // Update relasi many-to-many dengan CPL
      if (cplIds !== undefined) {
        const cpls = await CPL.findAll({ where: { id: cplIds, userId } });
        await pl.setCpl(cpls);
      }

      const updatedPl = await PL.findByPk(pl.id, {
        include: [{ model: CPL, as: "cpl", through: { attributes: [] } }],
      });

      res.status(200).json({
        success: true,
        message: "PL berhasil diperbarui",
        data: updatedPl,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal memperbarui PL",
        error: error.message,
      });
    }
  },

  // Delete PL
  delete: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const pl = await PL.findOne({
        where: { id, userId },
      });

      if (!pl) {
        return res.status(404).json({
          success: false,
          message: "PL tidak ditemukan atau tidak punya akses",
        });
      }

      await pl.destroy();

      res.status(200).json({
        success: true,
        message: "PL berhasil dihapus",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal menghapus PL",
        error: error.message,
      });
    }
  },

  // Method untuk mengelola relasi PL-CPL
  manageCPLRelations: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { plId } = req.params;
      const { action, cplIds } = req.body; // action: 'add', 'remove', 'set'

      const pl = await PL.findOne({ where: { id: plId, userId } });
      if (!pl) {
        return res.status(404).json({
          success: false,
          message: "PL tidak ditemukan",
        });
      }

      const cpls = await CPL.findAll({ where: { id: cplIds, userId } });

      switch (action) {
        case "add":
          await pl.addCpl(cpls);
          break;
        case "remove":
          await pl.removeCpl(cpls);
          break;
        case "set":
          await pl.setCpl(cpls);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Action tidak valid. Gunakan 'add', 'remove', atau 'set'",
          });
      }

      res.status(200).json({
        success: true,
        message: `Relasi PL-CPL berhasil ${action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengelola relasi PL-CPL",
        error: error.message,
      });
    }
  },
};

module.exports = plController;
