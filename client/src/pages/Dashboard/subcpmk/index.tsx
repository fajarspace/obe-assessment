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
  Popconfirm,
  Tag,
  Grid,
  Drawer,
  List,
  Divider,
  Row,
  Col,
  Collapse,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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

  // Matrix view state
  const [matrixRelations, setMatrixRelations] = useState<
    Record<string, boolean>
  >({});

  // Check if mobile
  const isMobile = !screens.md;
  const isTablet = !screens.lg;

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // Update matrix relations when data changes
    if (viewMode === "matrix") {
      updateMatrixRelations();
    }
  }, [subcpmks, cpmks, viewMode]);

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

  const updateMatrixRelations = () => {
    const relations: Record<string, boolean> = {};

    subcpmks.forEach((subcpmk) => {
      cpmks.forEach((cpmk) => {
        const key = `${subcpmk.id}-${cpmk.id}`;
        relations[key] = subcpmk.cpmk?.some((c) => c.id === cpmk.id) || false;
      });
    });

    setMatrixRelations(relations);
  };

  const handleMatrixChange = async (
    subcpmkId: number,
    cpmkId: number,
    checked: boolean
  ) => {
    const key = `${subcpmkId}-${cpmkId}`;

    try {
      // Update local state immediately for better UX
      setMatrixRelations((prev) => ({
        ...prev,
        [key]: checked,
      }));

      // Get current relations for this SUBCPMK
      const subcpmk = subcpmks.find((s) => s.id === subcpmkId);
      const currentCpmkIds = subcpmk?.cpmk?.map((c) => c.id) || [];

      let newCpmkIds: number[];
      if (checked) {
        newCpmkIds = [...currentCpmkIds, cpmkId];
      } else {
        newCpmkIds = currentCpmkIds.filter((id) => id !== cpmkId);
      }

      // Update via API using PATCH request
      const updateData = { cpmkIds: newCpmkIds };
      await subcpmkApi.update(subcpmkId, updateData);

      // Refresh data to ensure consistency
      await fetchAllData();
      message.success("Relasi berhasil diperbarui");
    } catch (error) {
      // Revert local state on error
      setMatrixRelations((prev) => ({
        ...prev,
        [key]: !checked,
      }));
      message.error("Gagal memperbarui relasi");
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

      if (modalMode === "create") {
        const response = await subcpmkApi.create(
          requestData as CreateSUBCPMKRequest
        );
        if (response.success) {
          message.success("Sub CPMK berhasil dibuat");
          setIsModalVisible(false);
          fetchAllData();
        }
      } else if (modalMode === "edit" && editingSubCPMK) {
        const response = await subcpmkApi.update(
          editingSubCPMK.id,
          requestData as UpdateSUBCPMKRequest
        );
        if (response.success) {
          message.success("Sub CPMK berhasil diperbarui");
          setIsModalVisible(false);
          fetchAllData();
        }
      }
    } catch (error) {
      message.error(
        `Gagal ${modalMode === "create" ? "membuat" : "memperbarui"} Sub CPMK`
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
    // {
    //   title: "CPMK Terkait",
    //   dataIndex: "cpmk",
    //   key: "cpmk",
    //   width: 200,
    //   render: (cpmkList: CPMK[]) => (
    //     <div className="flex flex-wrap gap-1">
    //       {cpmkList?.map((cpmk) => (
    //         <Tag key={cpmk.id} color="gray">
    //           {cpmk.kode}
    //         </Tag>
    //       )) || <Text type="secondary">-</Text>}
    //     </div>
    //   ),
    // },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi",
      key: "deskripsi",
      ellipsis: true,
      width: 250,
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

  // Matrix view columns
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
        const key = `${record.id}-${cpmk.id}`;
        return (
          <Checkbox
            checked={matrixRelations[key] || false}
            onChange={(e) =>
              handleMatrixChange(record.id, cpmk.id, e.target.checked)
            }
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
                        <Tag key={cpmk.id} color="gray">
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

  // Mobile Matrix Component
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
                const key = `${subcpmk.id}-${cpmk.id}`;
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
                        checked={matrixRelations[key] || false}
                        onChange={(e) =>
                          handleMatrixChange(
                            subcpmk.id,
                            cpmk.id,
                            e.target.checked
                          )
                        }
                        style={{ width: "100%" }}
                      >
                        <Text style={{ fontSize: "12px" }}>{cpmk.kode}</Text>
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
