const { Profile } = require("../models");

const profileController = {
  getAllProfile: async (req, res) => {
    try {
      // Extract query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
      const nama = req.query.nama || "";

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {};

      if (search) {
        whereConditions[Op.or] = [
          { nama: { [Op.like]: `%${search}%` } },
          // { email: { [Op.like]: `%${search}%` } },
        ];
      }

      if (nama) {
        whereConditions.nama = { [Op.like]: `%${nama}%` };
      }

      // Fetch data with pagination
      const { count, rows } = await Profile.findAndCountAll({
        where: whereConditions,
        limit,
        offset,
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      // Format response to match frontend expectations
      const response = {
        success: true,
        data: rows,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage,
        },
      };

      res.status(200).json(response);
    } catch (err) {
      console.error("Error fetching user:", err);

      // Return error response in consistent format
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memuat data user",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  },

  createProfile: async (req, res) => {
    try {
      const newProfile = await Profile.create(req.body);
      res.status(201).json(newProfile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(500).json({ message: "Failed to create profile" });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const profile = await Profile.findByPk(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      await profile.update(updateData);

      res.status(200).json({
        message: "Profile updated successfully",
        profile,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  },
};

module.exports = profileController;
