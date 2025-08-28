import axios from "axios";

// URL basis untuk API autentikasi
const API_BASE_URL = `${process.env.VITE_API_URI}/auth/google`;

export const fetchUser = async () => {
  try {
    // console.log("Fetching user data...");
    const response = await axios.get(`${API_BASE_URL}/me`, {
      withCredentials: true,
    });

    // console.log("User data fetched:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user:", error);
    throw error.response?.data?.error || "Failed to fetch user data";
  }
};

export const logoutUser = async () => {
  try {
    await axios.get(`${API_BASE_URL}/logout`, {
      withCredentials: true,
    });
  } catch (error: any) {
    throw error.response?.data?.error || "Failed to log out";
  }
};
