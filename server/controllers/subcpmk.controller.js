// controllers/subcpmk.controller.js
const { SUBCPMK, CPMK } = require("../models");

const subcpmkController = {
  // Get all SUBCPMK with related data
  getAll: async (req, res) => {
    try {
      const userId = req.user?.id;

      const subcpmks = await SUBCPMK.findAll({
        where: { userId },
        include: [
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] }, // Hide junction table attributes
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Data Sub CPMK berhasil diambil",
        data: subcpmks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data Sub CPMK",
        error: error.message,
      });
    }
  },

  // Get SUBCPMK by ID
  getById: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const subcpmk = await SUBCPMK.findOne({
        where: { id, userId },
        include: [
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
          },
        ],
      });

      if (!subcpmk) {
        return res.status(404).json({
          success: false,
          message: "Sub CPMK tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Sub CPMK berhasil diambil",
        data: subcpmk,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil Sub CPMK",
        error: error.message,
      });
    }
  },

  // Get SUBCPMK by CPMK ID (many-to-many approach)
  getByCPMKId: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { cpmkId } = req.params;

      // Validasi CPMK milik user
      const cpmk = await CPMK.findOne({ where: { id: cpmkId, userId } });
      if (!cpmk) {
        return res.status(404).json({
          success: false,
          message: "CPMK tidak ditemukan atau tidak memiliki akses",
        });
      }

      // Get SUBCPMK yang terkait dengan CPMK ini melalui many-to-many
      const subcpmks = await SUBCPMK.findAll({
        where: { userId },
        include: [
          {
            model: CPMK,
            as: "cpmk",
            where: { id: cpmkId },
            through: { attributes: [] },
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Data Sub CPMK berhasil diambil",
        data: subcpmks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data Sub CPMK",
        error: error.message,
      });
    }
  },

  // Create new SUBCPMK
  create: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      const { cpmkIds, ...subcpmkData } = req.body;

      // Create SUBCPMK
      const subcpmk = await SUBCPMK.create({
        ...subcpmkData,
        userId,
      });

      // Add many-to-many relations with CPMK
      if (cpmkIds && cpmkIds.length > 0) {
        const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });
        await subcpmk.addCpmk(cpmks);
      }

      const subcpmkWithRelations = await SUBCPMK.findByPk(subcpmk.id, {
        include: [
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Sub CPMK berhasil dibuat",
        data: subcpmkWithRelations,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal membuat Sub CPMK",
        error: error.message,
      });
    }
  },

  // Update SUBCPMK
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      const subcpmk = await SUBCPMK.findOne({ where: { id, userId } });

      if (!subcpmk) {
        return res.status(404).json({
          success: false,
          message: "Sub CPMK tidak ditemukan atau tidak memiliki akses",
        });
      }

      const { cpmkIds, ...subcpmkData } = req.body;

      // Update SUBCPMK data
      await subcpmk.update(subcpmkData);

      // Update many-to-many relations with CPMK
      if (cpmkIds !== undefined) {
        const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });
        await subcpmk.setCpmk(cpmks); // setCpmk replaces all existing relations
      }

      const updatedSubcpmk = await SUBCPMK.findByPk(subcpmk.id, {
        include: [
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Sub CPMK berhasil diupdate",
        data: updatedSubcpmk,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengupdate Sub CPMK",
        error: error.message,
      });
    }
  },

  // Delete SUBCPMK
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const subcpmk = await SUBCPMK.findOne({ where: { id, userId } });

      if (!subcpmk) {
        return res.status(404).json({
          success: false,
          message: "Sub CPMK tidak ditemukan atau tidak memiliki akses",
        });
      }

      await subcpmk.destroy();

      res.status(200).json({
        success: true,
        message: "Sub CPMK berhasil dihapus",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal menghapus Sub CPMK",
        error: error.message,
      });
    }
  },

  // Method untuk mengelola relasi SUBCPMK-CPMK
  manageCPMKRelations: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { subcpmkId } = req.params;
      const { action, cpmkIds } = req.body; // action: 'add', 'remove', 'set'

      const subcpmk = await SUBCPMK.findOne({
        where: { id: subcpmkId, userId },
      });
      if (!subcpmk) {
        return res.status(404).json({
          success: false,
          message: "Sub CPMK tidak ditemukan",
        });
      }

      const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });

      switch (action) {
        case "add":
          await subcpmk.addCpmk(cpmks);
          break;
        case "remove":
          await subcpmk.removeCpmk(cpmks);
          break;
        case "set":
          await subcpmk.setCpmk(cpmks);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Action tidak valid. Gunakan 'add', 'remove', atau 'set'",
          });
      }

      res.status(200).json({
        success: true,
        message: `Relasi SUBCPMK-CPMK berhasil ${action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengelola relasi SUBCPMK-CPMK",
        error: error.message,
      });
    }
  },

  // Bulk create SUBCPMK
  bulkCreate: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { subcpmks, cpmkIds } = req.body; // subcpmks adalah array, cpmkIds untuk relasi

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      // Siapkan data untuk bulk create
      const subcpmkData = subcpmks.map((subcpmk) => ({
        ...subcpmk,
        userId,
      }));

      const createdSubcpmks = await SUBCPMK.bulkCreate(subcpmkData, {
        returning: true, // Return created records
      });

      // Jika ada cpmkIds, tambahkan relasi untuk semua SUBCPMK yang dibuat
      if (cpmkIds && cpmkIds.length > 0) {
        const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });

        // Tambahkan relasi untuk setiap SUBCPMK yang dibuat
        for (const subcpmk of createdSubcpmks) {
          await subcpmk.addCpmk(cpmks);
        }
      }

      // Get created subcpmks with relations
      const subcpmksWithRelations = await SUBCPMK.findAll({
        where: {
          id: createdSubcpmks.map((s) => s.id),
          userId,
        },
        include: [
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: `${createdSubcpmks.length} Sub CPMK berhasil dibuat`,
        data: subcpmksWithRelations,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal membuat Sub CPMK secara bulk",
        error: error.message,
      });
    }
  },
};

module.exports = subcpmkController;
