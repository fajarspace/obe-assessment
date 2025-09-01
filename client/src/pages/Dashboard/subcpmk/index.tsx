// components/SUBCPMK/SUBCPMKManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Table,
  Checkbox,
  Space,
  Typography,
  Modal,
  Tag,
  Grid,
  Drawer,
  List,
  Row,
  Col,
  Collapse,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  TableOutlined,
  AppstoreOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { subcpmkApi, cpmkApi } from "../services/api";
import type {
  SUBCPMK,
  CPMK,
  CreateSUBCPMKRequest,
  UpdateSUBCPMKRequest,
} from "../types/interfaces";
import withDashboardLayout from "@/components/hoc/withDashboardLayout";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

const SUBCPMKManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [subcpmks, setSubcpmks] = useState<SUBCPMK[]>([]);
  const [cpmks, setCpmks] = useState<CPMK[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "matrix">("table");
  const screens = useBreakpoint();

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [editingSubCPMK, setEditingSubCPMK] = useState<SUBCPMK | null>(null);

  // Mobile-specific states
  const [selectedItemActions, setSelectedItemActions] =
    useState<SUBCPMK | null>(null);
  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);

  // Relation selections
  const [selectedCPMKs, setSelectedCPMKs] = useState<number[]>([]);

  // Matrix loading states for individual checkboxes
  const [matrixLoading, setMatrixLoading] = useState<Record<string, boolean>>(
    {}
  );

  // Check if mobile
  const isMobile = !screens.md;
  const isTablet = !screens.lg;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setTableLoading(true);
    try {
      const [subcpmkResponse, cpmkResponse] = await Promise.all([
        subcpmkApi.getAll(),
        cpmkApi.getAll(),
      ]);

      if (subcpmkResponse.success) setSubcpmks(subcpmkResponse.data || []);
      if (cpmkResponse.success) setCpmks(cpmkResponse.data || []);
    } catch (error) {
      message.error("Gagal memuat data");
    } finally {
      setTableLoading(false);
    }
  };

  // Optimized relation update function
  const handleMatrixChange = async (
    subcpmkId: number,
    cpmkId: number,
    checked: boolean
  ) => {
    const loadingKey = `${subcpmkId}-${cpmkId}`;

    try {
      // Set loading state for this specific checkbox
      setMatrixLoading((prev) => ({ ...prev, [loadingKey]: true }));

      // Get current relations for this SUBCPMK
      const currentSubcpmk = subcpmks.find((s) => s.id === subcpmkId);
      if (!currentSubcpmk) {
        throw new Error("Sub CPMK tidak ditemukan");
      }

      const currentCpmkIds = currentSubcpmk.cpmk?.map((c) => c.id) || [];

      // Calculate new IDs array
      let newCpmkIds: number[];
      if (checked) {
        // Add if not already present
        newCpmkIds = currentCpmkIds.includes(cpmkId)
          ? currentCpmkIds
          : [...currentCpmkIds, cpmkId];
      } else {
        // Remove if present
        newCpmkIds = currentCpmkIds.filter((id) => id !== cpmkId);
      }

      // Prepare update data
      const updateData = { cpmkIds: newCpmkIds };

      // Update via API
      const response = await subcpmkApi.update(subcpmkId, updateData);

      if (response.success && response.data) {
        // Update local state with the response data
        setSubcpmks((prevSubcpmks) =>
          prevSubcpmks.map((subcpmk) =>
            subcpmk.id === subcpmkId ? response.data! : subcpmk
          )
        );

        // Show success message
        message.success(`Relasi CPMK ${checked ? "ditambahkan" : "dihapus"}`);
      } else {
        throw new Error(response.message || "Update failed");
      }
    } catch (error: any) {
      console.error("Matrix update error:", error);
      message.error(
        `Gagal memperbarui relasi: ${error.message || "Unknown error"}`
      );

      // Optionally refresh data on error to ensure consistency
      fetchAllData();
    } finally {
      // Remove loading state
      setMatrixLoading((prev) => {
        const newState = { ...prev };
        delete newState[loadingKey];
        return newState;
      });
    }
  };

  const handleCreate = () => {
    setModalMode("create");
    setEditingSubCPMK(null);
    form.resetFields();
    setSelectedCPMKs([]);
    setIsModalVisible(true);
  };

  const handleEdit = (subcpmk: SUBCPMK) => {
    setModalMode("edit");
    setEditingSubCPMK(subcpmk);
    form.setFieldsValue({
      kode: subcpmk.kode,
      deskripsi: subcpmk.deskripsi,
    });
    setSelectedCPMKs(subcpmk.cpmk?.map((cpmk) => cpmk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const handleView = (subcpmk: SUBCPMK) => {
    setModalMode("view");
    setEditingSubCPMK(subcpmk);
    form.setFieldsValue({
      kode: subcpmk.kode,
      deskripsi: subcpmk.deskripsi,
    });
    setSelectedCPMKs(subcpmk.cpmk?.map((cpmk) => cpmk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const openActionDrawer = (item: SUBCPMK) => {
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
        cpmkIds: selectedCPMKs,
      };

      let response;
      if (modalMode === "create") {
        response = await subcpmkApi.create(requestData as CreateSUBCPMKRequest);
        if (response.success) {
          message.success("Sub CPMK berhasil dibuat");
        }
      } else if (modalMode === "edit" && editingSubCPMK) {
        response = await subcpmkApi.update(
          editingSubCPMK.id,
          requestData as UpdateSUBCPMKRequest
        );
        if (response.success) {
          message.success("Sub CPMK berhasil diperbarui");
        }
      }

      if (response?.success) {
        setIsModalVisible(false);
        await fetchAllData(); // Refresh data after create/edit
      }
    } catch (error: any) {
      message.error(
        `Gagal ${
          modalMode === "create" ? "membuat" : "memperbarui"
        } Sub CPMK: ${error.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Desktop Table view columns
  const subcpmkColumns = [
    {
      title: "Kode",
      dataIndex: "kode",
      key: "kode",
      width: 150,
      render: (kode: string) => <Tag color="gray">{kode}</Tag>,
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      ellipsis: true,
      width: 250,
    },
    {
      title: "CPMK Terkait",
      key: "relations",
      width: 200,
      render: (record: SUBCPMK) => (
        <div>
          {record.cpmk?.length ? (
            <div>
              {record.cpmk.slice(0, 2).map((cpmk) => (
                <Tag key={cpmk.id} color="blue" style={{ marginBottom: 2 }}>
                  {cpmk.kode}
                </Tag>
              ))}
              {record.cpmk.length > 2 && (
                <Tag color="default">+{record.cpmk.length - 2} lainnya</Tag>
              )}
            </div>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      width: 150,
      render: (record: SUBCPMK) => (
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

  // Matrix view columns with loading states
  const matrixColumns = [
    {
      title: "No",
      key: "no",
      width: 60,
      //@ts-ignore
      render: (_: any, record: SUBCPMK, index: number) => index + 1,
    },
    {
      title: "Kode Sub CPMK",
      dataIndex: "kode",
      key: "kode",
      width: 150,
      fixed: "left" as const,
      render: (kode: string) => <Tag color="gray">{kode}</Tag>,
    },
    ...cpmks.map((cpmk) => ({
      title: cpmk.kode,
      key: `cpmk-${cpmk.id}`,
      width: 80,
      align: "center" as const,
      render: (_: any, record: SUBCPMK) => {
        // Use actual data instead of matrix state for more reliability
        const isChecked = record.cpmk?.some((c) => c.id === cpmk.id) || false;
        const loadingKey = `${record.id}-${cpmk.id}`;
        const isLoading = matrixLoading[loadingKey];

        return (
          <Checkbox
            checked={isChecked}
            disabled={isLoading}
            onChange={(e) =>
              handleMatrixChange(record.id, cpmk.id, e.target.checked)
            }
            style={isLoading ? { opacity: 0.6 } : {}}
          />
        );
      },
    })),
  ];

  // Mobile List Component
  const MobileList = () => (
    <List
      dataSource={subcpmks}
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
                <Tag color="gray">{item.kode}</Tag>
              </Space>
            }
            description={
              <div>
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true }}
                  style={{ marginBottom: 8 }}
                >
                  {item.deskripsi}
                </Paragraph>
                <div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    CPMK Terkait:{" "}
                  </Text>
                  {item.cpmk?.length ? (
                    <div style={{ marginTop: 4 }}>
                      {item.cpmk.map((cpmk) => (
                        <Tag
                          key={cpmk.id}
                          color="blue"
                          style={{ marginBottom: 2 }}
                        >
                          {cpmk.kode}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">-</Text>
                  )}
                </div>
              </div>
            }
          />
        </List.Item>
      )}
      pagination={{
        total: subcpmks.length,
        pageSize: 10,
        size: "small",
        showSizeChanger: false,
        showQuickJumper: false,
        showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total}`,
      }}
    />
  );

  // Mobile Matrix Component with loading states
  const MobileMatrix = () => (
    <Collapse accordion>
      {subcpmks.map((subcpmk) => (
        <Panel
          key={subcpmk.id}
          header={
            <div>
              <Tag color="gray">{subcpmk.kode}</Tag>
              <Text style={{ marginLeft: 8, fontSize: "14px" }}>
                {subcpmk.deskripsi}
              </Text>
            </div>
          }
        >
          <div style={{ padding: "8px 0" }}>
            <Text
              strong
              style={{ fontSize: "14px", marginBottom: 8, display: "block" }}
            >
              Relasi dengan CPMK:
            </Text>
            <Row gutter={[8, 8]}>
              {cpmks.map((cpmk) => {
                const isChecked =
                  subcpmk.cpmk?.some((c) => c.id === cpmk.id) || false;
                const loadingKey = `${subcpmk.id}-${cpmk.id}`;
                const isLoading = matrixLoading[loadingKey];

                return (
                  <Col span={12} key={cpmk.id}>
                    <div
                      style={{
                        padding: "8px",
                        border: "1px solid #f0f0f0",
                        borderRadius: "4px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        disabled={isLoading}
                        onChange={(e) =>
                          handleMatrixChange(
                            subcpmk.id,
                            cpmk.id,
                            e.target.checked
                          )
                        }
                        style={{ width: "100%" }}
                      >
                        <Text style={{ fontSize: "12px" }}>
                          {isLoading ? (
                            <span style={{ opacity: 0.6 }}>
                              {cpmk.kode}{" "}
                              <span className="animate-pulse">...</span>
                            </span>
                          ) : (
                            cpmk.kode
                          )}
                        </Text>
                      </Checkbox>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </Panel>
      ))}
    </Collapse>
  );

  const modalTitle =
    modalMode === "create"
      ? "Tambah Sub CPMK Baru"
      : modalMode === "edit"
      ? `Edit Sub CPMK: ${editingSubCPMK?.kode}`
      : `Detail Sub CPMK: ${editingSubCPMK?.kode}`;

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
            {isMobile ? "Sub-CPMK" : "Sub-Capaian Pembelajaran Mata Kuliah"}
          </Title>

          {/* Desktop Controls */}
          {!isMobile && (
            <Space>
              <Button.Group>
                <Button
                  type={viewMode === "table" ? "primary" : "default"}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode("table")}
                >
                  Tabel
                </Button>
                <Button
                  type={viewMode === "matrix" ? "primary" : "default"}
                  icon={<TableOutlined />}
                  onClick={() => setViewMode("matrix")}
                >
                  Matrix
                </Button>
              </Button.Group>
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
                Tambah Sub CPMK
              </Button>
            </Space>
          )}

          {/* Mobile Controls */}
          {isMobile && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Button.Group size="small">
                  <Button
                    type={viewMode === "table" ? "primary" : "default"}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode("table")}
                  >
                    List
                  </Button>
                  <Button
                    type={viewMode === "matrix" ? "primary" : "default"}
                    icon={<TableOutlined />}
                    onClick={() => setViewMode("matrix")}
                  >
                    Matrix
                  </Button>
                </Button.Group>
                <Space>
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={fetchAllData}
                    loading={tableLoading}
                  />
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                  >
                    Tambah
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Card className={isMobile ? "mx-0" : ""}>
          {isMobile ? (
            viewMode === "table" ? (
              <MobileList />
            ) : (
              <MobileMatrix />
            )
          ) : (
            <Table
              dataSource={subcpmks}
              columns={viewMode === "table" ? subcpmkColumns : matrixColumns}
              rowKey="id"
              loading={tableLoading}
              scroll={viewMode === "matrix" ? { x: "max-content" } : undefined}
              size={isTablet ? "small" : "middle"}
              pagination={{
                total: subcpmks.length,
                pageSize: viewMode === "matrix" ? 20 : 10,
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
              label="Kode Sub CPMK"
              rules={[
                { required: true, message: "Kode Sub CPMK harus diisi" },
                {
                  min: 3,
                  max: 20,
                  message: "Kode Sub CPMK harus antara 3-20 karakter",
                },
              ]}
            >
              <Input placeholder="Contoh: SUBCPMK01" />
            </Form.Item>

            <Form.Item
              name="deskripsi"
              label="Deskripsi Sub CPMK"
              rules={[
                {
                  required: true,
                  message: "Deskripsi Sub CPMK harus diisi",
                },
                { min: 10, message: "Deskripsi minimal 10 karakter" },
              ]}
            >
              <TextArea rows={4} placeholder="Masukkan deskripsi Sub CPMK" />
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

export default withDashboardLayout(SUBCPMKManagement);
