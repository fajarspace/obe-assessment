const { Op } = require("sequelize");
const { Users, Profile } = require("../models");

const authController = {
  loginWithGoogle: (req, res, next) => {
    next();
  },

  handleGoogleCallback: (req, res) => {
    const clientUrl = process.env.CLIENT_URL; // Default fallback
    res.redirect(`${clientUrl}/dashboard?reload=true`);
  },

  logout: (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Error logging out" });

      // Hapus sesi dari store dan session cookie
      req.session.destroy((err) => {
        if (err)
          return res.status(500).json({ message: "Error destroying session" });

        // Hapus cookie sesi 'connect.sid'
        res.clearCookie("connect.sid", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });

        // Redirect ke halaman login
        const clientUrl = process.env.CLIENT_URL; // Default fallback
        res.redirect(`${clientUrl}`);
      });
    });
  },

  getLoggedInUser: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Ambil user lengkap dengan relasi Profile dan Dosen (pengampu)
      const userWithProfile = await Users.findByPk(req.user.id, {
        attributes: [
          "id",
          "name",
          "email",
          "picture",
          "role",
          "phone_number",
          "whoamiId",
        ],
        include: [
          {
            model: Profile,
            as: "profile",
          },
        ],
      });

      if (!userWithProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(userWithProfile);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  // Fungsi baru untuk update profile
  updateProfile: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { phone_number, whoamiId } = req.body;
      const userId = req.user.id;

      // Validasi input (opsional)
      const updateData = {};
      if (phone_number !== undefined) {
        updateData.phone_number = phone_number;
      }
      if (whoamiId !== undefined) {
        updateData.whoamiId = whoamiId;
      }

      // Jika tidak ada data yang akan diupdate
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          message: "No valid fields to update",
        });
      }

      // Update user di database
      const [updatedRowsCount] = await Users.update(updateData, {
        where: { id: userId },
      });

      if (updatedRowsCount === 0) {
        return res.status(404).json({ message: "Users not found" });
      }

      // Ambil data user yang sudah diupdate
      const updatedUser = await Users.findByPk(userId);

      // Update session user juga
      req.user.phone_number = updatedUser.phone_number;
      req.user.whoamiId = updatedUser.whoamiId;

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          picture: updatedUser.picture,
          role: updatedUser.role,
          whoamiId: updatedUser.whoamiId,
          phone_number: updatedUser.phone_number,
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  getAllusers: async (req, res) => {
    try {
      // Extract query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || "";
      const name = req.query.name || "";

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = {};

      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      if (name) {
        whereConditions.name = { [Op.like]: `%${name}%` };
      }

      // Fetch data with pagination
      const { count, rows } = await Users.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Profile,
            as: "profile",
          },
        ],
        limit,
        offset,
        order: [["createdAt", "DESC"]],
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

  createUser: async (req, res) => {
    try {
      const newUser = await Users.create(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  },

  updateProfileByAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, whoamiId, phone_number } = req.body;

      // Validasi input
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID user diperlukan",
        });
      }

      if (!role) {
        return res.status(400).json({
          success: false,
          message: "Role diperlukan",
        });
      }
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Akses ditolak. Hanya admin yang dapat mengupdate profil pengguna",
        });
      }

      // Periksa apakah user exists
      const existingUser = await Users.findByPk(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Prepare update data
      const updateData = {
        role,
        whoamiId: whoamiId ? Number(whoamiId) : null,
        phone_number: phone_number ? phone_number.trim() : null,
      };

      // Update user
      const [affectedRows] = await Users.update(updateData, {
        where: { id },
      });

      if (affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: "Tidak ada perubahan data",
        });
      }

      // Get updated user
      const updatedUser = await Users.findByPk(id);

      res.json({
        success: true,
        data: updatedUser,
        message: "Profil berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating profile:", error);

      // Handle specific database errors
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message:
            "Data tidak valid: " +
            error.errors.map((e) => e.message).join(", "),
        });
      }

      if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Referensi data tidak valid",
        });
      }

      res.status(500).json({
        success: false,
        message: "Gagal memperbarui profil",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  deleteProfile: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await Users.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan",
        });
      }

      // Prevent deletion of own account (optional security measure)
      if (req.user && req.user.id === id) {
        return res.status(403).json({
          success: false,
          message: "Tidak dapat menghapus akun sendiri",
        });
      }

      // Delete user
      await Users.destroy({ where: { id: id } });

      return res.status(200).json({
        success: true,
        message: "Profil pengguna berhasil dihapus",
      });
    } catch (error) {
      console.error("Error deleting user profile:", error);
      return res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat menghapus profil pengguna",
        error: error.message,
      });
    }
  },
};

module.exports = authController;
