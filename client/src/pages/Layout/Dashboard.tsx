import { useState, useEffect, type ReactNode } from "react";
import {
  Layout,
  Menu as AntMenu,
  Button,
  Dropdown,
  Avatar,
  Drawer,
  Space,
  Typography,
  type MenuProps,
  Grid,
} from "antd";
import {
  HomeOutlined,
  MenuOutlined,
  UserOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  SettingOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/authContext";
import { useNavigate } from "react-router-dom";
import UpdateProfileProdi from "../Dashboard/get-started/updateProfileProdi";
import UpdateProfileDosen from "../Dashboard/get-started/updateProfileDosen";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface Props {
  children: ReactNode;
}

const DashboardLayout: React.FC<Props> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const [updateProfileVisible, setUpdateProfileVisible] = useState(false);
  const handleCloseUpdateProfile = () => {
    setUpdateProfileVisible(false);
  };

  // Determine if we're on mobile
  const isMobile = !screens.md;

  // Check profile completeness for both dosen and mahasiswa
  useEffect(() => {
    if (user?.role === "dosen") {
      checkDosenProfileCompleteness();
    } else if (user?.role === "prodi") {
      checkProdiProfileCompleteness();
    }
  }, [user]);

  const checkDosenProfileCompleteness = (): void => {
    if (!user || user.role !== "dosen") return;

    const isNamaEmpty = !user.profile?.nama || user.profile.nama.trim() === "";
    const isNidnEmpty =
      !user?.profile?.nidn || user?.profile?.nidn.trim() === "";

    if (isNidnEmpty || isNamaEmpty) {
      setUpdateProfileVisible(true);
    }
  };

  const checkProdiProfileCompleteness = (): void => {
    if (!user || user.role !== "prodi") return;

    const isProfileEmpty = !user.profile;
    const isProdiEmpty =
      !user.profile?.prodi || user.profile.prodi.trim() === "";

    if (isProfileEmpty || isProdiEmpty) {
      setUpdateProfileVisible(true);
    }
  };

  // Function to get active menu from current URL
  const getActiveMenuFromUrl = () => {
    if (typeof window === "undefined") return "dashboard";

    const path = window.location.pathname;
    const segment = path.replace("/dashboard/", "").split("/")[0];
    if (!segment || segment === "") return "dashboard";

    return segment;
  };

  useEffect(() => {
    const updateActiveMenu = () => {
      setActiveMenu(getActiveMenuFromUrl());
    };

    updateActiveMenu();

    const handlePopState = () => {
      updateActiveMenu();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigation = (url: string, itemId: string) => {
    window.history.pushState({}, "", url);
    setActiveMenu(itemId);
    setMobileMenuOpen(false); // Close mobile menu on navigation
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  // Menu items for different sections
  const dashboardItems = [
    {
      key: "dashboard",
      icon: <HomeOutlined />,
      label: "Dashboard",
      onClick: () => handleNavigation("/dashboard", "dashboard"),
    },
  ];

  const profilLulusanItems = [
    {
      key: "pl",
      icon: <AppstoreOutlined />,
      label: "PL",
      onClick: () => handleNavigation("/dashboard/pl", "pl"),
    },
    {
      key: "cpl",
      icon: <AppstoreOutlined />,
      label: "CPL",
      onClick: () => handleNavigation("/dashboard/cpl", "cpl"),
    },
  ];

  const mataKuliahItems = [
    {
      key: "mk",

      label: "MK",
      onClick: () => handleNavigation("/dashboard/mk", "mk"),
    },
    {
      key: "cpmk",

      label: "CPMK",
      onClick: () => handleNavigation("/dashboard/cpmk", "cpmk"),
    },
    {
      key: "subcpmk",

      label: "Sub-CPMK",
      onClick: () => handleNavigation("/dashboard/subcpmk", "SubCPMK"),
    },
  ];

  const penilaianItems = [
    {
      key: "penilaian",
      icon: <AppstoreOutlined />,
      label: "Rubrik penilaian",
      onClick: () => handleNavigation("/dashboard/penilaian", "assessment"),
    },
  ];

  // User dropdown menu
  const userMenuItems: MenuProps["items"] = [
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: () => {
        logout();
        navigate("/");
      },
    },
  ];

  // Sidebar content component
  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="h-full flex flex-col !bg-yellow-300">
      {/* Dashboard Section */}
      <div className="mb-4 pt-4">
        <AntMenu
          mode="inline"
          selectedKeys={[activeMenu]}
          items={dashboardItems}
          style={{
            background: "#ffe020", // bg-blue-950
            border: "none",
          }}
          className="[&_.ant-menu-item]:!text-black [&_.ant-menu-submenu-title]:!text-black [&_.ant-menu-item:hover]:!bg-blue-900 [&_.ant-menu-item:hover]:!text-white [&_.ant-menu-item-selected]:!bg-blue-900 [&_.ant-menu-item-selected]:!text-white"
          inlineCollapsed={collapsed}
        />
      </div>

      {/* Profil Lulusan Section - Only for prodi or admin */}
      {(user?.role === "prodi" || user?.role === "admin") && (
        <>
          <div className="mb-4">
            {!collapsed && (
              <div className="px-4 py-2 mx-2">
                <Text strong className="text-base">
                  Profil Lulusan
                </Text>
              </div>
            )}
            <div className={collapsed ? "" : "mt-2"}>
              <AntMenu
                mode="inline"
                selectedKeys={[activeMenu]}
                items={profilLulusanItems}
                style={{
                  background: "#ffe020", // bg-blue-950
                  border: "none",
                }}
                className="[&_.ant-menu-item]:!text-black [&_.ant-menu-submenu-title]:!text-black [&_.ant-menu-item:hover]:!bg-blue-900 [&_.ant-menu-item:hover]:!text-white [&_.ant-menu-item-selected]:!bg-blue-900 [&_.ant-menu-item-selected]:!text-white"
                inlineCollapsed={collapsed}
              />
            </div>
          </div>

          <div className="mb-4">
            {!collapsed && (
              <div className="px-4 py-2 mx-2">
                <Text strong className="text-base" style={{ color: "#000" }}>
                  Mata Kuliah
                </Text>
              </div>
            )}
            <div className={collapsed ? "" : "mt-2"}>
              <AntMenu
                mode="inline"
                selectedKeys={[activeMenu]}
                items={mataKuliahItems}
                style={{
                  background: "#ffe020", // bg-blue-950
                  border: "none",
                }}
                className="[&_.ant-menu-item]:!text-black [&_.ant-menu-submenu-title]:!text-black [&_.ant-menu-item:hover]:!bg-blue-900 [&_.ant-menu-item:hover]:!text-white [&_.ant-menu-item-selected]:!bg-blue-900 [&_.ant-menu-item-selected]:!text-white"
                inlineCollapsed={collapsed}
              />
            </div>
          </div>
        </>
      )}

      {/* Penilaian Section */}
      <div className="mb-4">
        {!collapsed && (
          <div className="px-4 py-2 mx-2">
            <Text strong className="text-base" style={{ color: "#000" }}>
              Penilaian
            </Text>
          </div>
        )}
        <div className={collapsed ? "" : "mt-2"}>
          <AntMenu
            mode="inline"
            selectedKeys={[activeMenu]}
            items={penilaianItems}
            style={{
              background: "#ffe020", // bg-blue-950
              border: "none",
            }}
            className="[&_.ant-menu-item]:!text-black [&_.ant-menu-submenu-title]:!text-black [&_.ant-menu-item:hover]:!bg-blue-900 [&_.ant-menu-item:hover]:!text-white [&_.ant-menu-item-selected]:!bg-blue-900 [&_.ant-menu-item-selected]:!text-white"
            inlineCollapsed={collapsed}
          />
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="mt-auto p-4 border-t">
          <Text type="secondary" className="text-sm">
            Beta ver.
          </Text>
        </div>
      )}
    </div>
  );

  return (
    <Layout className="min-h-screen">
      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && (
        <Sider
          width={240}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            position: "fixed",
            height: "100vh",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b bg-yellow-300">
            <Space align="center">
              <AppstoreOutlined className="text-xl" />
              {!collapsed && (
                <Text strong className="!text-lg">
                  Penilaian OBE
                </Text>
              )}
            </Space>
          </div>

          {/* Sidebar Content */}
          <div className="h-full overflow-y-auto">
            <SidebarContent collapsed={collapsed} />
          </div>
        </Sider>
      )}

      {/* Mobile Drawer */}
      <Drawer
        title={
          <Space align="center">
            <AppstoreOutlined />
            <Text strong>Penilaian OBE</Text>
          </Space>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        className="md:hidden"
        bodyStyle={{ padding: 0 }}
        width={280}
      >
        <SidebarContent collapsed={false} />
      </Drawer>

      <Layout
        style={{
          marginLeft: !isMobile ? (collapsed ? 80 : 240) : 0,
          transition: "margin-left 0.2s",
        }}
      >
        {/* Header */}
        <Header
          className="sticky top-0 z-10 !bg-white border-b flex items-center justify-between"
          style={{
            padding: isMobile ? "0 16px" : "0 24px",
            height: "64px",
          }}
        >
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              size="large"
            />
          )}

          <div className="flex-1" />

          {/* User Menu */}
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Avatar
              src={user?.picture}
              icon={<UserOutlined />}
              className="cursor-pointer"
              size={isMobile ? "default" : "large"}
            >
              {user?.name?.charAt(0)}
            </Avatar>
          </Dropdown>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            padding: isMobile ? "16px" : "24px",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* Update Profile Components */}
      {user?.role === "prodi" && (
        <UpdateProfileProdi
          visible={updateProfileVisible}
          onClose={handleCloseUpdateProfile}
        />
      )}

      {user?.role === "dosen" && (
        <UpdateProfileDosen
          visible={updateProfileVisible}
          onClose={handleCloseUpdateProfile}
        />
      )}
    </Layout>
  );
};

export default DashboardLayout;
