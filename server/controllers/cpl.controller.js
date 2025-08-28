// controllers/cpl.controller.js
const { CPL, PL, MK, CPMK } = require("../models");

const cplController = {
  // Get all CPL with related data
  getAll: async (req, res) => {
    try {
      const userId = req.user?.id;

      const cpls = await CPL.findAll({
        where: { userId },
        include: [
          {
            model: PL,
            as: "pl",
            through: { attributes: [] }, // Menghilangkan atribut junction table
          },
          {
            model: MK,
            as: "mk",
            through: { attributes: [] },
          },
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Data CPL berhasil diambil",
        data: cpls,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data CPL",
        error: error.message,
      });
    }
  },

  // Create new CPL
  create: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      const { plIds, mkIds, cpmkIds, ...cplData } = req.body;

      // Buat CPL terlebih dahulu
      const cpl = await CPL.create({
        ...cplData,
        userId,
      });

      // Tambahkan relasi many-to-many jika ada
      if (plIds && plIds.length > 0) {
        const pls = await PL.findAll({ where: { id: plIds, userId } });
        await cpl.addPl(pls);
      }

      if (mkIds && mkIds.length > 0) {
        const mks = await MK.findAll({ where: { id: mkIds, userId } });
        await cpl.addMk(mks);
      }

      if (cpmkIds && cpmkIds.length > 0) {
        const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });
        await cpl.addCpmk(cpmks);
      }

      // Ambil data CPL yang sudah dibuat beserta relasi
      const cplWithRelations = await CPL.findByPk(cpl.id, {
        include: [
          { model: PL, as: "pl", through: { attributes: [] } },
          { model: MK, as: "mk", through: { attributes: [] } },
          { model: CPMK, as: "cpmk", through: { attributes: [] } },
        ],
      });

      res.status(201).json({
        success: true,
        message: "CPL berhasil dibuat",
        data: cplWithRelations,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal membuat CPL",
        error: error.message,
      });
    }
  },

  // Update CPL
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

      const cpl = await CPL.findOne({
        where: { id, userId },
      });

      if (!cpl) {
        return res.status(404).json({
          success: false,
          message: "CPL tidak ditemukan atau tidak punya akses",
        });
      }

      const { plIds, mkIds, cpmkIds, ...cplData } = req.body;

      // Update data CPL
      await cpl.update(cplData);

      // Update relasi many-to-many jika ada
      if (plIds !== undefined) {
        const pls = await PL.findAll({ where: { id: plIds, userId } });
        await cpl.setPl(pls); // setPl mengganti semua relasi yang ada
      }

      if (mkIds !== undefined) {
        const mks = await MK.findAll({ where: { id: mkIds, userId } });
        await cpl.setMk(mks);
      }

      if (cpmkIds !== undefined) {
        const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });
        await cpl.setCpmk(cpmks);
      }

      // Ambil data yang sudah diupdate
      const updatedCpl = await CPL.findByPk(cpl.id, {
        include: [
          { model: PL, as: "pl", through: { attributes: [] } },
          { model: MK, as: "mk", through: { attributes: [] } },
          { model: CPMK, as: "cpmk", through: { attributes: [] } },
        ],
      });

      res.status(200).json({
        success: true,
        message: "CPL berhasil diperbarui",
        data: updatedCpl,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal memperbarui CPL",
        error: error.message,
      });
    }
  },

  // Delete CPL
  delete: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const cpl = await CPL.findOne({
        where: { id, userId },
      });

      if (!cpl) {
        return res.status(404).json({
          success: false,
          message: "CPL tidak ditemukan atau tidak punya akses",
        });
      }

      await cpl.destroy();

      res.status(200).json({
        success: true,
        message: "CPL berhasil dihapus",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal menghapus CPL",
        error: error.message,
      });
    }
  },

  // Method untuk mengelola relasi CPL-PL
  managePLRelations: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { cplId } = req.params;
      const { action, plIds } = req.body; // action: 'add', 'remove', 'set'

      const cpl = await CPL.findOne({ where: { id: cplId, userId } });
      if (!cpl) {
        return res.status(404).json({
          success: false,
          message: "CPL tidak ditemukan",
        });
      }

      const pls = await PL.findAll({ where: { id: plIds, userId } });

      switch (action) {
        case "add":
          await cpl.addPl(pls);
          break;
        case "remove":
          await cpl.removePl(pls);
          break;
        case "set":
          await cpl.setPl(pls);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Action tidak valid. Gunakan 'add', 'remove', atau 'set'",
          });
      }

      res.status(200).json({
        success: true,
        message: `Relasi CPL-PL berhasil ${action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengelola relasi CPL-PL",
        error: error.message,
      });
    }
  },

  // Get CPL by ID
  getById: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const cpl = await CPL.findOne({
        where: { id, userId },
        include: [
          { model: PL, as: "pl", through: { attributes: [] } },
          { model: MK, as: "mk", through: { attributes: [] } },
          { model: CPMK, as: "cpmk", through: { attributes: [] } },
        ],
      });

      if (!cpl) {
        return res.status(404).json({
          success: false,
          message: "CPL tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "CPL berhasil diambil",
        data: cpl,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil CPL",
        error: error.message,
      });
    }
  },
};

module.exports = cplController;
