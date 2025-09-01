// controllers/mk.controller.js
const { MK, CPMK, PL, CPL, SUBCPMK } = require("../models");

const mkController = {
  // Get all MK with related data
  getAll: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: userId tidak ditemukan",
        });
      }

      const mks = await MK.findAll({
        where: { userId }, // filter sesuai user login
        include: [
          {
            model: CPL,
            as: "cpl",
            through: { attributes: [] },
            include: [
              {
                model: PL,
                as: "pl",
                through: { attributes: [] },
              },
              {
                model: CPMK,
                as: "cpmk",
                through: { attributes: [] },
                include: [
                  {
                    model: SUBCPMK,
                    as: "subcpmk",
                  },
                ],
              },
            ],
          },
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
            include: [
              {
                model: CPL,
                as: "cpl",
                through: { attributes: [] },
              },
              {
                model: SUBCPMK,
                as: "subcpmk",
              },
            ],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Data Mata Kuliah berhasil diambil",
        data: mks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data Mata Kuliah",
        error: error.message,
      });
    }
  },

  getMkPenilaian: async (req, res) => {
    try {
      // const userId = req.user?.id;

      const mks = await MK.findAll({
        // where: { userId },
        include: [
          {
            model: CPL,
            as: "cpl",
            through: { attributes: [] },
            include: [
              {
                model: PL,
                as: "pl",
                through: { attributes: [] },
              },
              {
                model: CPMK,
                as: "cpmk",
                through: { attributes: [] },
                include: [
                  {
                    model: SUBCPMK,
                    as: "subcpmk",
                  },
                ],
              },
            ],
          },
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
            include: [
              {
                model: CPL,
                as: "cpl",
                through: { attributes: [] },
              },
              {
                model: SUBCPMK,
                as: "subcpmk",
              },
            ],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Data Mata Kuliah berhasil diambil",
        data: mks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil data Mata Kuliah",
        error: error.message,
      });
    }
  },

  // Get MK by ID
  getById: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const mk = await MK.findOne({
        where: { id, userId },
        include: [
          {
            model: CPL,
            as: "cpl",
            through: { attributes: [] },
            include: [
              {
                model: PL,
                as: "pl",
                through: { attributes: [] },
              },
              {
                model: CPMK,
                as: "cpmk",
                through: { attributes: [] },
                include: [
                  {
                    model: SUBCPMK,
                    as: "subcpmk",
                  },
                ],
              },
            ],
          },
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
            include: [
              {
                model: CPL,
                as: "cpl",
                through: { attributes: [] },
              },
              {
                model: SUBCPMK,
                as: "subcpmk",
              },
            ],
          },
        ],
      });

      if (!mk) {
        return res.status(404).json({
          success: false,
          message: "Mata Kuliah tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Mata Kuliah berhasil diambil",
        data: mk,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil Mata Kuliah",
        error: error.message,
      });
    }
  },

  // Create new MK
  create: async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID tidak ditemukan",
        });
      }

      const { cplIds, cpmkIds, ...mkData } = req.body;

      const mk = await MK.create({
        ...mkData,
        userId,
      });

      // Tambahkan relasi many-to-many
      if (cplIds && cplIds.length > 0) {
        const cpls = await CPL.findAll({ where: { id: cplIds, userId } });
        await mk.addCpl(cpls);
      }

      if (cpmkIds && cpmkIds.length > 0) {
        const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });
        await mk.addCpmk(cpmks);
      }

      const mkWithRelations = await MK.findByPk(mk.id, {
        include: [
          { model: CPL, as: "cpl", through: { attributes: [] } },
          { model: CPMK, as: "cpmk", through: { attributes: [] } },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Mata Kuliah berhasil dibuat",
        data: mkWithRelations,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal membuat Mata Kuliah",
        error: error.message,
      });
    }
  },

  // Update Mata Kuliah
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

      const mk = await MK.findOne({
        where: { id, userId },
      });

      if (!mk) {
        return res.status(404).json({
          success: false,
          message: "Mata Kuliah tidak ditemukan atau tidak punya akses",
        });
      }

      const { cplIds, cpmkIds, ...mkData } = req.body;

      await mk.update(mkData);

      // Update relasi many-to-many
      if (cplIds !== undefined) {
        const cpls = await CPL.findAll({ where: { id: cplIds, userId } });
        await mk.setCpl(cpls);
      }

      if (cpmkIds !== undefined) {
        const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });
        await mk.setCpmk(cpmks);
      }

      const updatedMk = await MK.findByPk(mk.id, {
        include: [
          { model: CPL, as: "cpl", through: { attributes: [] } },
          { model: CPMK, as: "cpmk", through: { attributes: [] } },
        ],
      });

      res.status(200).json({
        success: true,
        message: "Mata Kuliah berhasil diperbarui",
        data: updatedMk,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal memperbarui Mata Kuliah",
        error: error.message,
      });
    }
  },

  // Delete MK
  delete: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const mk = await MK.findOne({
        where: { id, userId },
      });

      if (!mk) {
        return res.status(404).json({
          success: false,
          message: "Mata Kuliah tidak ditemukan atau tidak punya akses",
        });
      }

      await mk.destroy();

      res.status(200).json({
        success: true,
        message: "Mata Kuliah berhasil dihapus",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal menghapus Mata Kuliah",
        error: error.message,
      });
    }
  },

  // Method untuk mendapatkan MK dengan semua relasi lengkap
  getFullDetail: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const mk = await MK.findOne({
        where: { id, userId },
        include: [
          {
            model: CPL,
            as: "cpl",
            through: { attributes: [] },
            include: [
              {
                model: PL,
                as: "pl",
                through: { attributes: [] },
              },
              {
                model: CPMK,
                as: "cpmk",
                through: { attributes: [] },
                include: [
                  {
                    model: SUBCPMK,
                    as: "subcpmk",
                  },
                ],
              },
            ],
          },
          {
            model: CPMK,
            as: "cpmk",
            through: { attributes: [] },
            include: [
              {
                model: SUBCPMK,
                as: "subcpmk",
              },
              {
                model: CPL,
                as: "cpl",
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!mk) {
        return res.status(404).json({
          success: false,
          message: "Mata Kuliah tidak ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Detail Mata Kuliah berhasil diambil",
        data: mk,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gagal mengambil detail Mata Kuliah",
        error: error.message,
      });
    }
  },

  // Method untuk mengelola relasi MK-CPL
  manageCPLRelations: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { mkId } = req.params;
      const { action, cplIds } = req.body; // action: 'add', 'remove', 'set'

      const mk = await MK.findOne({ where: { id: mkId, userId } });
      if (!mk) {
        return res.status(404).json({
          success: false,
          message: "Mata Kuliah tidak ditemukan",
        });
      }

      const cpls = await CPL.findAll({ where: { id: cplIds, userId } });

      switch (action) {
        case "add":
          await mk.addCpl(cpls);
          break;
        case "remove":
          await mk.removeCpl(cpls);
          break;
        case "set":
          await mk.setCpl(cpls);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Action tidak valid. Gunakan 'add', 'remove', atau 'set'",
          });
      }

      res.status(200).json({
        success: true,
        message: `Relasi MK-CPL berhasil ${action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengelola relasi MK-CPL",
        error: error.message,
      });
    }
  },

  // Method untuk mengelola relasi MK-CPMK
  manageCPMKRelations: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { mkId } = req.params;
      const { action, cpmkIds } = req.body; // action: 'add', 'remove', 'set'

      const mk = await MK.findOne({ where: { id: mkId, userId } });
      if (!mk) {
        return res.status(404).json({
          success: false,
          message: "Mata Kuliah tidak ditemukan",
        });
      }

      const cpmks = await CPMK.findAll({ where: { id: cpmkIds, userId } });

      switch (action) {
        case "add":
          await mk.addCpmk(cpmks);
          break;
        case "remove":
          await mk.removeCpmk(cpmks);
          break;
        case "set":
          await mk.setCpmk(cpmks);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Action tidak valid. Gunakan 'add', 'remove', atau 'set'",
          });
      }

      res.status(200).json({
        success: true,
        message: `Relasi MK-CPMK berhasil ${action}`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Gagal mengelola relasi MK-CPMK",
        error: error.message,
      });
    }
  },
};

module.exports = mkController;
