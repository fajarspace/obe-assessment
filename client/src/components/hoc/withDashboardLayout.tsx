// src/hoc/withDashboardLayout.tsx
import DashboardLayout from "@/pages/Layout/Dashboard";
import React from "react";

const withDashboardLayout = (Component: React.ComponentType) => {
  return (props: any) => (
    <DashboardLayout>
      <Component {...props} />
    </DashboardLayout>
  );
};

export default withDashboardLayout;
