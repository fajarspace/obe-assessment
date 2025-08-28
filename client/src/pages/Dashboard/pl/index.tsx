// components/PL/PLManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Table,
  Space,
  Typography,
  Modal,
  Tag,
  Grid,
  Drawer,
  List,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { plApi } from "../services/api";
import type { PL, CreatePLRequest, UpdatePLRequest } from "../types/interfaces";
import withDashboardLayout from "@/components/hoc/withDashboardLayout";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const PLManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [pls, setPls] = useState<PL[]>([]);
  const screens = useBreakpoint();

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [editingPL, setEditingPL] = useState<PL | null>(null);

  // Mobile-specific states
  const [selectedItemActions, setSelectedItemActions] = useState<PL | null>(
    null
  );
  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);

  // Check if mobile/tablet
  const isMobile = !screens.md;
  const isTablet = !screens.lg;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setTableLoading(true);
    try {
      const plResponse = await plApi.getAll();
      if (plResponse.success) setPls(plResponse.data || []);
    } catch (error) {
      message.error("Gagal memuat data");
    } finally {
      setTableLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode("create");
    setEditingPL(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (pl: PL) => {
    setModalMode("edit");
    setEditingPL(pl);
    form.setFieldsValue({
      kode: pl.kode,
      deskripsi: pl.deskripsi,
    });
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const handleView = (pl: PL) => {
    setModalMode("view");
    setEditingPL(pl);
    form.setFieldsValue({
      kode: pl.kode,
      deskripsi: pl.deskripsi,
    });
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const openActionDrawer = (item: PL) => {
    setSelectedItemActions(item);
    setActionDrawerVisible(true);
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const requestData = {
        kode: values.kode,
        nama: values.nama,
        deskripsi: values.deskripsi,
      };

      if (modalMode === "create") {
        const response = await plApi.create(requestData as CreatePLRequest);
        if (response.success) {
          message.success("Profile Lulusan berhasil dibuat");
          setIsModalVisible(false);
          fetchAllData();
        }
      } else if (modalMode === "edit" && editingPL) {
        const response = await plApi.update(
          editingPL.id,
          requestData as UpdatePLRequest
        );
        if (response.success) {
          message.success("Profile Lulusan berhasil diperbarui");
          setIsModalVisible(false);
          fetchAllData();
        }
      }
    } catch (error) {
      message.error(
        `Gagal ${
          modalMode === "create" ? "membuat" : "memperbarui"
        } Profile Lulusan`
      );
    } finally {
      setLoading(false);
    }
  };

  // Desktop table columns
  const plColumns = [
    {
      title: "Kode",
      dataIndex: "kode",
      key: "kode",
      width: 120,
      render: (kode: string) => <Tag color="gray">{kode}</Tag>,
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Aksi",
      key: "actions",
      width: 150,
      render: (record: PL) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="Lihat Detail"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Edit"
          />
        </Space>
      ),
    },
  ];

  // Mobile List Component
  const MobileList = () => (
    <List
      dataSource={pls}
      loading={tableLoading}
      renderItem={(item) => (
        <List.Item
          key={item.id}
          style={{ padding: "12px 0" }}
          actions={[
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={() => openActionDrawer(item)}
            />,
          ]}
        >
          <List.Item.Meta
            title={
              <Space>
                <Tag color="purple">{item.kode}</Tag>
              </Space>
            }
            description={
              <div>
                <Paragraph
                  ellipsis={{ rows: 3, expandable: true }}
                  style={{ marginBottom: 0 }}
                >
                  {item.deskripsi}
                </Paragraph>
              </div>
            }
          />
        </List.Item>
      )}
      pagination={{
        total: pls.length,
        pageSize: 10,
        size: "small",
        showSizeChanger: false,
        showQuickJumper: false,
        showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total}`,
      }}
    />
  );

  const modalTitle =
    modalMode === "create"
      ? "Tambah Profile Lulusan"
      : modalMode === "edit"
      ? `Edit PL: ${editingPL?.kode}`
      : `Detail PL: ${editingPL?.kode}`;

  return (
    <div className="min-h-screen">
      <div className={`${isMobile ? "px-4" : "max-w-7xl mx-auto"}`}>
        {/* Header Section */}
        <div
          className={`mb-6 ${
            isMobile ? "space-y-4" : "flex justify-between items-center"
          }`}
        >
          <Title level={isMobile ? 3 : 2} className="!mb-0">
            {isMobile ? "Profil Lulusan" : "Profil Lulusan"}
          </Title>

          {/* Desktop Controls */}
          {!isMobile && (
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchAllData}
                loading={tableLoading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Tambah Profile Lulusan
              </Button>
            </Space>
          )}

          {/* Mobile Controls */}
          {isMobile && (
            <div className="flex justify-between items-center">
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={fetchAllData}
                loading={tableLoading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Tambah PL
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Card className={isMobile ? "mx-0" : ""}>
          {isMobile ? (
            <MobileList />
          ) : (
            <Table
              dataSource={pls}
              columns={plColumns}
              rowKey="id"
              loading={tableLoading}
              size={isTablet ? "small" : "middle"}
              pagination={{
                total: pls.length,
                pageSize: 10,
                showSizeChanger: !isTablet,
                showQuickJumper: !isTablet,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} items`,
              }}
            />
          )}
        </Card>

        {/* Create/Edit/View Modal */}
        <Modal
          title={modalTitle}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={isMobile ? "100%" : 600}
          style={isMobile ? { top: 0, maxWidth: "100vw", margin: 0 } : {}}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            disabled={modalMode === "view"}
          >
            <Form.Item
              name="kode"
              label="Kode Profile Lulusan"
              rules={[
                { required: true, message: "Kode PL harus diisi" },
                {
                  min: 3,
                  max: 20,
                  message: "Kode PL harus antara 3-20 karakter",
                },
              ]}
            >
              <Input placeholder="Contoh: PL01" />
            </Form.Item>

            <Form.Item
              name="deskripsi"
              label="Deskripsi Profile Lulusan"
              rules={[
                { required: true, message: "Deskripsi PL harus diisi" },
                { min: 10, message: "Deskripsi minimal 10 karakter" },
              ]}
            >
              <TextArea
                rows={isMobile ? 4 : 6}
                placeholder="Masukkan deskripsi profil lulusan"
              />
            </Form.Item>

            {modalMode !== "view" && (
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SaveOutlined />}
                  >
                    {modalMode === "create" ? "Simpan" : "Perbarui"}
                  </Button>
                  <Button onClick={() => setIsModalVisible(false)}>
                    Batal
                  </Button>
                </Space>
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Mobile Action Drawer */}
        <Drawer
          title={`Aksi: ${selectedItemActions?.kode}`}
          placement="bottom"
          onClose={() => setActionDrawerVisible(false)}
          open={actionDrawerVisible}
          height="auto"
        >
          {selectedItemActions && (
            <div className="space-y-4">
              <Button
                block
                icon={<EyeOutlined />}
                onClick={() => handleView(selectedItemActions)}
              >
                Lihat Detail
              </Button>
              <Button
                block
                type="primary"
                icon={<EditOutlined />}
                onClick={() => handleEdit(selectedItemActions)}
              >
                Edit
              </Button>
            </div>
          )}
        </Drawer>
      </div>
    </div>
  );
};

export default withDashboardLayout(PLManagement);
