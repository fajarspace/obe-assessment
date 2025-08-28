import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import idID from "antd/locale/id_ID";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import NotFound from "./404";
import Dashboard from "./pages/Dashboard";
import GoogleSignInPage from "./pages/Auth/Google";
import GradingAssessmentTable from "./pages/Dashboard/penilaian";
import ProtectedRoute from "./routes/protectedRoute";

import { ConfigProvider } from "antd";
import Pl from "./pages/Dashboard/pl";
import Cpl from "./pages/Dashboard/cpl";

import Mk from "./pages/Dashboard/mk";
import Cpmk from "./pages/Dashboard/cpmk";

import Subcpmk from "./pages/Dashboard/subcpmk";
import AssessmentTable from "./pages/Dashboard/rubrik-penilaian/AssessmentTable";
import SimpleOBEAssessment from "./pages/Dashboard/rubrik-penilaian";

// import GradingAssessmentTable from "./main";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

function App() {
  return (
    <React.StrictMode>
      <ConfigProvider
        locale={idID}
        theme={{
          // algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: "#1c398e",
            colorLink: "#1c398e",
            fontFamily: "'Outfit', sans-serif",
          },
        }}
      >
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </React.StrictMode>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<GoogleSignInPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "prodi", "dosen"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/pl"
        element={
          <ProtectedRoute allowedRoles={["admin", "prodi", "dosen"]}>
            <Pl />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/cpl"
        element={
          <ProtectedRoute allowedRoles={["admin", "prodi", "dosen"]}>
            <Cpl />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/mk"
        element={
          <ProtectedRoute allowedRoles={["admin", "prodi", "dosen"]}>
            <Mk />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/cpmk"
        element={
          <ProtectedRoute allowedRoles={["admin", "prodi", "dosen"]}>
            <Cpmk />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/subcpmk"
        element={
          <ProtectedRoute allowedRoles={["admin", "prodi", "dosen"]}>
            <Subcpmk />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/penilaian"
        element={
          <ProtectedRoute allowedRoles={["admin", "prodi", "dosen"]}>
            <GradingAssessmentTable />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} /> {/* 404 route */}
    </Routes>
  );
}

root.render(<App />);
