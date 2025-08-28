import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

interface Props {
  children: JSX.Element;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      navigate("/404", { replace: true });
    }
  }, [user, allowedRoles, navigate]);

  // Optional: render nothing while redirecting
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return children;
};

export default ProtectedRoute;
