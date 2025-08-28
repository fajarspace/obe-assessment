import React, { useState, useEffect } from "react";
import { Drawer, Button, message, Steps, Select, Avatar } from "antd";
import { UserOutlined, BookOutlined } from "@ant-design/icons";
import axios, { type AxiosResponse } from "axios";
import { useAuth } from "@/context/authContext";
import { prodiOptions } from "@/types/types";

// Interface untuk User Profile
interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: string;
  profile?: {
    nama?: string;
    nidn?: string;
    prodi?: string;
  };
}

// Interface untuk Update Profile Request
interface UpdateProfileRequest {
  userId?: string;
  nama?: string;
  nidn?: string;
  prodi?: string;
}

// Interface untuk Update Profile Response
interface UpdateProfileResponse {
  message: string;
  user: UserProfile;
}

// Interface untuk Form Errors
interface FormErrors {
  nama?: string;
  nidn?: string;
  prodi?: string;
  phone_number?: string;
}

interface UpdateProfileProps {
  visible: boolean;
  onClose: () => void;
}

const UpdateProfileProdi: React.FC<UpdateProfileProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    prodi: "",
  });
  const [step, setStep] = useState<number>(1);

  // Set initial form data when drawer opens
  useEffect(() => {
    if (visible && user) {
      setFormData({
        prodi: user.profile?.prodi || "",
      });
      setStep(1);
      setErrors({});
    }
  }, [visible, user]);

  // Function untuk validasi form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validasi prodi
    if (!formData.prodi.trim()) {
      newErrors.prodi = "Program Studi wajib dipilih";
    }

    // Validasi phone_number

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function untuk handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Clear error untuk field yang sedang diubah
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleUpdateProfile = async (): Promise<void> => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // First API call - Update auth profile (phone number)

      // Second API call - Create profile data
      const updateData: UpdateProfileRequest = {
        userId: user?.id,
        prodi: formData.prodi.trim(),
      };

      const response: AxiosResponse<UpdateProfileResponse> = await axios.post(
        `${process.env.VITE_API_URI}/api/profile`,
        updateData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        message.success("Profil berhasil dibuat!");
        window.location.reload();
        onClose();
        setFormData({ prodi: "" });
        setErrors({});
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Gagal membuat profil";
        message.error(errorMessage);
      } else {
        message.error("Terjadi kesalahan saat membuat profil");
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if profile is incomplete to prevent closing drawer
  const isProfileIncomplete = user
    ? !user.profile?.nama ||
      user.profile.nama.trim() === "" ||
      !user.profile?.nidn ||
      user.profile.nidn.trim() === "" ||
      !user.profile?.prodi ||
      user.profile.prodi.trim() === "" ||
      !user.phone_number ||
      user.phone_number.trim() === ""
    : false;

  const handleClose = () => {
    if (isProfileIncomplete) {
      message.warning("Mohon lengkapi informasi profil Anda terlebih dahulu");
      return;
    }
    onClose();
    setFormData({ prodi: "" });
    setErrors({});
    setStep(1);
  };

  return (
    <Drawer
      title={null}
      placement="right"
      open={visible}
      onClose={handleClose}
      closable={!isProfileIncomplete}
      maskClosable={false}
      width="100%"
      style={{ padding: 0 }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Background Image Container */}
      <div
        className="relative min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/bg-white.png)",
        }}
      >
        {/* Content Overlay */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <div className="p-6 text-gray-900">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <UserOutlined className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-semibold">Buat Profil</h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="w-full">
              {step === 1 && (
                <div className="text-center py-16 px-6 ">
                  <Avatar
                    src={user?.picture}
                    icon={!user?.picture && <UserOutlined />}
                    size={96}
                    className="!mx-auto !mb-6 !border-4 !border-whited"
                  />

                  <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
                    Halo, {user?.name || "User"} 👋
                  </h1>

                  <p className="text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
                    Sebelum lanjut, kamu perlu membuat profil. Yuk kita mulai!
                  </p>

                  <Button
                    type="primary"
                    size="large"
                    className="!px-10 !h-14 !text-lg !font-semibold !rounded-full !shadow-lg"
                    onClick={() => setStep(2)}
                  >
                    Mulai Sekarang
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white/95 max-w-md mx-auto backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                      Buat Profil
                    </h3>

                    {/* Program Studi */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Program Studi <span className="text-red-500">*</span>
                      </label>
                      <Select
                        placeholder="Pilih Program Studi"
                        size="large"
                        value={formData.prodi || undefined}
                        onChange={(value) => handleInputChange("prodi", value)}
                        status={errors.prodi ? "error" : ""}
                        className="w-full"
                        options={prodiOptions}
                        suffixIcon={<BookOutlined className="text-gray-400" />}
                      />
                      {errors.prodi && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.prodi}
                        </p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-3 mt-8">
                      <Button
                        size="large"
                        className="flex-1 h-12 rounded-xl"
                        onClick={() => setStep(1)}
                      >
                        Kembali
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        loading={loading}
                        onClick={handleUpdateProfile}
                        className="flex-1 h-12 rounded-xl font-medium"
                      >
                        Simpan
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer with Steps */}
          <div className="p-6">
            <div className="max-w-md mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <Steps
                  current={step - 1}
                  size="small"
                  className="[&_.ant-steps-item-title]:text-white [&_.ant-steps-item-description]:text-white/80 [&_.ant-steps-item-icon]:bg-white/20 [&_.ant-steps-item-icon]:border-white/30"
                  items={[{ title: "Halo" }, { title: "Buat Profil" }]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default UpdateProfileProdi;
