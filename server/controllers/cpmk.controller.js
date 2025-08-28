// controllers/cpmk.controller.js
const { CPMK, CPL, MK, SUBCPMK } = require("../models");

const cpmkController = {
  // Get all CPMK with related data
  getAll: async (req, res) => {
    try {
      const userId = req.user?.id;

      const cpmks = await CPMK.findAll({
        where: { userId },
        include: [
          {
            model: CPL,
            as: "cpl",
            through: { attributes: [] },
          },
          {
            model: MK,
            as: "mk",
            through: { attributes: [] },
          },
          {
            model: SUBCPMK,
            as: "subcpmk",
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Data CPMK berhasil diambil",
        data: cpmks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data CPMK",
        error: error.message,
      });
    }
  },

  // Get CPMK by ID
  getById: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const cpmk = await CPMK.findOne({
        where: { id, userId },
        include: [
          { model: CPL, as: "cpl", through: { attributes: [] } },
          { model: MK, as: "mk", through: { attributes: [] } },
          { model: SUBCPMK, as: "subcpmk" },
        ],
      });

      if (!cpmk) {
        return res.status(404).json({
          success: false,
          message: "CPMK tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "CPMK berhasil diambil",
        data: cpmk,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil CPMK",
        error: error.message,
      });
    }
  },

  // Create new CPMK
  create: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      const { cplIds, mkIds, ...cpmkData } = req.body;

      const cpmk = await CPMK.create({
        ...cpmkData,
        userId,
      });

      // Tambahkan relasi many-to-many
      if (cplIds && cplIds.length > 0) {
        const cpls = await CPL.findAll({ where: { id: cplIds, userId } });
        await cpmk.addCpl(cpls);
      }

      if (mkIds && mkIds.length > 0) {
        const mks = await MK.findAll({ where: { id: mkIds, userId } });
        await cpmk.addMk(mks);
      }

      const cpmkWithRelations = await CPMK.findByPk(cpmk.id, {
        include: [
          { model: CPL, as: "cpl", through: { attributes: [] } },
          { model: MK, as: "mk", through: { attributes: [] } },
          { model: SUBCPMK, as: "subcpmk" },
        ],
      });

      res.status(201).json({
        success: true,
        message: "CPMK berhasil dibuat",
        data: cpmkWithRelations,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal membuat CPMK",
        error: error.message,
      });
    }
  },

  // Update CPMK
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

      const cpmk = await CPMK.findOne({
        where: { id, userId },
      });

      if (!cpmk) {
        return res.status(404).json({
          success: false,
          message: "CPMK tidak ditemukan atau tidak punya akses",
        });
      }

      const { cplIds, mkIds, ...cpmkData } = req.body;

      await cpmk.update(cpmkData);

      // Update relasi many-to-many
      if (cplIds !== undefined) {
        const cpls = await CPL.findAll({ where: { id: cplIds, userId } });
        await cpmk.setCpl(cpls);
      }

      if (mkIds !== undefined) {
        const mks = await MK.findAll({ where: { id: mkIds, userId } });
        await cpmk.setMk(mks);
      }

      const updatedCpmk = await CPMK.findByPk(cpmk.id, {
        include: [
          { model: CPL, as: "cpl", through: { attributes: [] } },
          { model: MK, as: "mk", through: { attributes: [] } },
          { model: SUBCPMK, as: "subcpmk" },
        ],
      });

      res.status(200).json({
        success: true,
        message: "CPMK berhasil diperbarui",
        data: updatedCpmk,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal memperbarui CPMK",
        error: error.message,
      });
    }
  },

  // Delete CPMK
  delete: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const cpmk = await CPMK.findOne({
        where: { id, userId },
      });

      if (!cpmk) {
        return res.status(404).json({
          success: false,
          message: "CPMK tidak ditemukan atau tidak punya akses",
        });
      }

      await cpmk.destroy();

      res.status(200).json({
        success: true,
        message: "CPMK berhasil dihapus",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal menghapus CPMK",
        error: error.message,
      });
    }
  },

  // Method untuk mengelola relasi CPMK-CPL
  manageCPLRelations: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { cpmkId } = req.params;
      const { action, cplIds } = req.body; // action: 'add', 'remove', 'set'

      const cpmk = await CPMK.findOne({ where: { id: cpmkId, userId } });
      if (!cpmk) {
        return res.status(404).json({
          success: false,
          message: "CPMK tidak ditemukan",
        });
      }

      const cpls = await CPL.findAll({ where: { id: cplIds, userId } });

      switch (action) {
        case "add":
          await cpmk.addCpl(cpls);
          break;
        case "remove":
          await cpmk.removeCpl(cpls);
          break;
        case "set":
          await cpmk.setCpl(cpls);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Action tidak valid. Gunakan 'add', 'remove', atau 'set'",
          });
      }

      res.status(200).json({
        success: true,
        message: `Relasi CPMK-CPL berhasil ${action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengelola relasi CPMK-CPL",
        error: error.message,
      });
    }
  },

  // Method untuk mengelola relasi CPMK-MK
  manageMKRelations: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { cpmkId } = req.params;
      const { action, mkIds } = req.body; // action: 'add', 'remove', 'set'

      const cpmk = await CPMK.findOne({ where: { id: cpmkId, userId } });
      if (!cpmk) {
        return res.status(404).json({
          success: false,
          message: "CPMK tidak ditemukan",
        });
      }

      const mks = await MK.findAll({ where: { id: mkIds, userId } });

      switch (action) {
        case "add":
          await cpmk.addMk(mks);
          break;
        case "remove":
          await cpmk.removeMk(mks);
          break;
        case "set":
          await cpmk.setMk(mks);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Action tidak valid. Gunakan 'add', 'remove', atau 'set'",
          });
      }

      res.status(200).json({
        success: true,
        message: `Relasi CPMK-MK berhasil ${action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengelola relasi CPMK-MK",
        error: error.message,
      });
    }
  },
};

module.exports = cpmkController;
