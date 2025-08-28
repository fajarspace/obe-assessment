import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUser, logoutUser } from "../api/Auth";
import { Spin } from "antd";
import type { Profile, User } from "@/types/Users";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  error: string;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Add loading state

  const getUser = async () => {
    try {
      const userData = await fetchUser();
      setUser(userData);
      setProfile(userData);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message || "Failed to fetch user");
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // Set loading to false when done
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsAuthenticated(false);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to logout");
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, isAuthenticated, error, logout }}
    >
      {!loading ? (
        children
      ) : (
        <div className="flex justify-center items-center h-screen bg-blue-950">
          <Spin size="default" />
        </div>
      )}
      {/* Show loading message if still loading */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
