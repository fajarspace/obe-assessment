// components/CPMK/CPMKManagement.tsx
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
  Badge,
  Tabs,
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
  BranchesOutlined,
  TableOutlined,
  AppstoreOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { cpmkApi, cplApi, mkApi } from "../services/api";
import type {
  CPMK,
  CPL,
  MK,
  CreateCPMKRequest,
  UpdateCPMKRequest,
} from "../types/interfaces";
import withDashboardLayout from "@/components/hoc/withDashboardLayout";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

const CPMKManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [cpmks, setCpmks] = useState<CPMK[]>([]);
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [mks, setMks] = useState<MK[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "matrix">("table");
  const screens = useBreakpoint();

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [editingCPMK, setEditingCPMK] = useState<CPMK | null>(null);

  // Mobile-specific states
  const [selectedItemActions, setSelectedItemActions] = useState<CPMK | null>(
    null
  );
  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);

  // Relation selections
  const [selectedCPLs, setSelectedCPLs] = useState<number[]>([]);
  const [selectedMKs, setSelectedMKs] = useState<number[]>([]);

  // Matrix view states
  const [matrixRelationsCPL, setMatrixRelationsCPL] = useState<
    Record<string, boolean>
  >({});
  const [matrixRelationsMK, setMatrixRelationsMK] = useState<
    Record<string, boolean>
  >({});

  // Check if mobile/tablet
  const isMobile = !screens.md;
  const isTablet = !screens.lg;

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (viewMode === "matrix") {
      updateMatrixRelations();
    }
  }, [cpmks, cpls, mks, viewMode]);

  const fetchAllData = async () => {
    setTableLoading(true);
    try {
      const [cpmkResponse, cplResponse, mkResponse] = await Promise.all([
        cpmkApi.getAll(),
        cplApi.getAll(),
        mkApi.getAll(),
      ]);

      if (cpmkResponse.success) setCpmks(cpmkResponse.data || []);
      if (cplResponse.success) setCpls(cplResponse.data || []);
      if (mkResponse.success) setMks(mkResponse.data || []);
    } catch (error) {
      message.error("Gagal memuat data");
    } finally {
      setTableLoading(false);
    }
  };

  const updateMatrixRelations = () => {
    const relationsCPL: Record<string, boolean> = {};
    const relationsMK: Record<string, boolean> = {};

    cpmks.forEach((cpmk) => {
      cpls.forEach((cpl) => {
        const key = `${cpmk.id}-${cpl.id}`;
        relationsCPL[key] = cpmk.cpl?.some((c) => c.id === cpl.id) || false;
      });

      mks.forEach((mk) => {
        const key = `${cpmk.id}-${mk.id}`;
        relationsMK[key] = cpmk.mk?.some((m) => m.id === mk.id) || false;
      });
    });

    setMatrixRelationsCPL(relationsCPL);
    setMatrixRelationsMK(relationsMK);
  };

  const handleMatrixChange = async (
    cpmkId: number,
    relatedId: number,
    relationType: "cpl" | "mk",
    checked: boolean
  ) => {
    const key = `${cpmkId}-${relatedId}`;

    try {
      // Update local state immediately
      if (relationType === "cpl") {
        setMatrixRelationsCPL((prev) => ({ ...prev, [key]: checked }));
      } else if (relationType === "mk") {
        setMatrixRelationsMK((prev) => ({ ...prev, [key]: checked }));
      }

      // Get current relations for this CPMK
      const cpmk = cpmks.find((c) => c.id === cpmkId);
      let currentIds: number[] = [];

      if (relationType === "cpl") {
        currentIds = cpmk?.cpl?.map((c) => c.id) || [];
      } else if (relationType === "mk") {
        currentIds = cpmk?.mk?.map((m) => m.id) || [];
      }

      let newIds: number[];
      if (checked) {
        newIds = [...currentIds, relatedId];
      } else {
        newIds = currentIds.filter((id) => id !== relatedId);
      }

      // Update via API using PATCH
      const updateData: any = {};
      if (relationType === "cpl") {
        updateData.cplIds = newIds;
      } else if (relationType === "mk") {
        updateData.mkIds = newIds;
      }

      await cpmkApi.update(cpmkId, updateData);
      await fetchAllData();
      message.success("Relasi berhasil diperbarui");
    } catch (error) {
      // Revert local state on error
      if (relationType === "cpl") {
        setMatrixRelationsCPL((prev) => ({ ...prev, [key]: !checked }));
      } else if (relationType === "mk") {
        setMatrixRelationsMK((prev) => ({ ...prev, [key]: !checked }));
      }
      message.error("Gagal memperbarui relasi");
    }
  };

  const handleCreate = () => {
    setModalMode("create");
    setEditingCPMK(null);
    form.resetFields();
    setSelectedCPLs([]);
    setSelectedMKs([]);
    setIsModalVisible(true);
  };

  const handleEdit = (cpmk: CPMK) => {
    setModalMode("edit");
    setEditingCPMK(cpmk);
    form.setFieldsValue({
      kode: cpmk.kode,
      deskripsi: cpmk.deskripsi,
    });
    setSelectedCPLs(cpmk.cpl?.map((cpl) => cpl.id) || []);
    setSelectedMKs(cpmk.mk?.map((mk) => mk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const handleView = (cpmk: CPMK) => {
    setModalMode("view");
    setEditingCPMK(cpmk);
    form.setFieldsValue({
      kode: cpmk.kode,
      deskripsi: cpmk.deskripsi,
    });
    setSelectedCPLs(cpmk.cpl?.map((cpl) => cpl.id) || []);
    setSelectedMKs(cpmk.mk?.map((mk) => mk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const handleSubCPMK = (cpmk: CPMK) => {
    window.open(`/subcpmk?cpmkId=${cpmk.id}`, "_blank");
    setActionDrawerVisible(false);
  };

  const openActionDrawer = (item: CPMK) => {
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
        cplIds: selectedCPLs,
        mkIds: selectedMKs,
      };

      if (modalMode === "create") {
        const response = await cpmkApi.create(requestData as CreateCPMKRequest);
        if (response.success) {
          message.success("CPMK berhasil dibuat");
          setIsModalVisible(false);
          fetchAllData();
        }
      } else if (modalMode === "edit" && editingCPMK) {
        const response = await cpmkApi.update(
          editingCPMK.id,
          requestData as UpdateCPMKRequest
        );
        if (response.success) {
          message.success("CPMK berhasil diperbarui");
          setIsModalVisible(false);
          fetchAllData();
        }
      }
    } catch (error) {
      message.error(
        `Gagal ${modalMode === "create" ? "membuat" : "memperbarui"} CPMK`
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleCPLSelection = (cplId: number, checked: boolean) => {
  //   if (checked) {
  //     setSelectedCPLs((prev) => [...prev, cplId]);
  //   } else {
  //     setSelectedCPLs((prev) => prev.filter((id) => id !== cplId));
  //   }
  // };

  // const handleMKSelection = (mkId: number, checked: boolean) => {
  //   if (checked) {
  //     setSelectedMKs((prev) => [...prev, mkId]);
  //   } else {
  //     setSelectedMKs((prev) => prev.filter((id) => id !== mkId));
  //   }
  // };

  // Desktop Table view columns
  const cpmkColumns = [
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
      width: 200,
    },
    // {
    //   title: "Relasi",
    //   key: "relations",
    //   width: 120,
    //   render: (record: CPMK) => (
    //     <Space direction="vertical" size={0}>
    //       <Badge count={record.cpl?.length || 0} color="blue" showZero>
    //         <span className="text-xs">CPL</span>
    //       </Badge>
    //       <Badge count={record.mk?.length || 0} color="green" showZero>
    //         <span className="text-xs">MK</span>
    //       </Badge>
    //       <Badge count={record.subcpmk?.length || 0} color="purple" showZero>
    //         <span className="text-xs">Sub</span>
    //       </Badge>
    //     </Space>
    //   ),
    // },
    {
      title: "Aksi",
      key: "actions",
      width: 180,
      render: (record: CPMK) => (
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
          <Button
            type="text"
            icon={<BranchesOutlined />}
            onClick={() => handleSubCPMK(record)}
            title="Kelola Sub CPMK"
          />
        </Space>
      ),
    },
  ];

  // Mobile List Component
  const MobileList = () => (
    <List
      dataSource={cpmks}
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
                <div className="flex gap-2 mb-2">
                  <Badge
                    count={item.cpl?.length || 0}
                    color="blue"
                    showZero
                    size="small"
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      CPL
                    </Text>
                  </Badge>
                  <Badge
                    count={item.mk?.length || 0}
                    color="green"
                    showZero
                    size="small"
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      MK
                    </Text>
                  </Badge>
                  <Badge
                    count={item.subcpmk?.length || 0}
                    color="purple"
                    showZero
                    size="small"
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Sub
                    </Text>
                  </Badge>
                </div>
                {item.subcpmk && item.subcpmk.length > 0 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Sub-CPMK:{" "}
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      {item.subcpmk.slice(0, 3).map((sub) => (
                        <Tag
                          key={sub.id}
                          color="purple"
                          style={{ marginBottom: 2 }}
                        >
                          {sub.kode}
                        </Tag>
                      ))}
                      {item.subcpmk.length > 3 && (
                        <Tag color="default">
                          +{item.subcpmk.length - 3} lainnya
                        </Tag>
                      )}
                    </div>
                  </div>
                )}
              </div>
            }
          />
        </List.Item>
      )}
      pagination={{
        total: cpmks.length,
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
      {cpmks.map((cpmk) => (
        <Panel
          key={cpmk.id}
          header={
            <div>
              <Tag color="gray">{cpmk.kode}</Tag>
              <Text style={{ marginLeft: 8, fontSize: "14px" }}>
                {cpmk.deskripsi}
              </Text>
            </div>
          }
        >
          <div style={{ padding: "8px 0" }}>
            <Text
              strong
              style={{ fontSize: "14px", marginBottom: 8, display: "block" }}
            >
              Relasi dengan CPL:
            </Text>
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              {cpls.map((cpl) => {
                const key = `${cpmk.id}-${cpl.id}`;
                return (
                  <Col span={12} key={cpl.id}>
                    <div
                      style={{
                        padding: "8px",
                        border: "1px solid #f0f0f0",
                        borderRadius: "4px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Checkbox
                        checked={matrixRelationsCPL[key] || false}
                        onChange={(e) =>
                          handleMatrixChange(
                            cpmk.id,
                            cpl.id,
                            "cpl",
                            e.target.checked
                          )
                        }
                        style={{ width: "100%" }}
                      >
                        <Text style={{ fontSize: "12px" }}>{cpl.kode}</Text>
                      </Checkbox>
                    </div>
                  </Col>
                );
              })}
            </Row>

            <Text
              strong
              style={{ fontSize: "14px", marginBottom: 8, display: "block" }}
            >
              Relasi dengan MK:
            </Text>
            <Row gutter={[8, 8]}>
              {mks.map((mk) => {
                const key = `${cpmk.id}-${mk.id}`;
                return (
                  <Col span={12} key={mk.id}>
                    <div
                      style={{
                        padding: "8px",
                        border: "1px solid #f0f0f0",
                        borderRadius: "4px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Checkbox
                        checked={matrixRelationsMK[key] || false}
                        onChange={(e) =>
                          handleMatrixChange(
                            cpmk.id,
                            mk.id,
                            "mk",
                            e.target.checked
                          )
                        }
                        style={{ width: "100%" }}
                      >
                        <Text style={{ fontSize: "12px" }}>{mk.kode}</Text>
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

  // Matrix view columns
  const createMatrixColumns = (relationType: "cpl" | "mk") => {
    const items = relationType === "cpl" ? cpls : mks;
    const relations =
      relationType === "cpl" ? matrixRelationsCPL : matrixRelationsMK;

    return [
      {
        title: "Kode CPMK",
        dataIndex: "kode",
        key: "kode",
        width: 120,
        fixed: "left" as const,
        render: (kode: string) => <Tag color="gray">{kode}</Tag>,
      },
      ...items.map((item) => ({
        title: item.kode,
        key: `${relationType}-${item.id}`,
        width: 80,
        align: "center" as const,
        render: (_: any, record: CPMK) => {
          const key = `${record.id}-${item.id}`;
          return (
            <Checkbox
              checked={relations[key] || false}
              onChange={(e) =>
                handleMatrixChange(
                  record.id,
                  item.id,
                  relationType,
                  e.target.checked
                )
              }
            />
          );
        },
      })),
    ];
  };

  const modalTitle =
    modalMode === "create"
      ? "Tambah CPMK Baru"
      : modalMode === "edit"
      ? `Edit CPMK: ${editingCPMK?.kode}`
      : `Detail CPMK: ${editingCPMK?.kode}`;

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
            {isMobile ? "CPMK" : "Capaian Pembelajaran Mata Kuliah"}
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
                Tambah CPMK
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
          ) : viewMode === "table" ? (
            <Table
              dataSource={cpmks}
              columns={cpmkColumns}
              rowKey="id"
              loading={tableLoading}
              size={isTablet ? "small" : "middle"}
              pagination={{
                total: cpmks.length,
                pageSize: 10,
                showSizeChanger: !isTablet,
                showQuickJumper: !isTablet,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} items`,
              }}
            />
          ) : (
            <Tabs defaultActiveKey="cpl" size="small">
              <TabPane tab="Relasi CPMK - CPL" key="cpl">
                <Table
                  dataSource={cpmks}
                  columns={createMatrixColumns("cpl")}
                  rowKey="id"
                  loading={tableLoading}
                  scroll={{ x: "max-content" }}
                  size={isTablet ? "small" : "middle"}
                  pagination={{ pageSize: 20 }}
                />
              </TabPane>
              <TabPane tab="Relasi CPMK - MK" key="mk">
                <Table
                  dataSource={cpmks}
                  columns={createMatrixColumns("mk")}
                  rowKey="id"
                  loading={tableLoading}
                  scroll={{ x: "max-content" }}
                  size={isTablet ? "small" : "middle"}
                  pagination={{ pageSize: 20 }}
                />
              </TabPane>
            </Tabs>
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
              label="Kode CPMK"
              rules={[
                { required: true, message: "Kode CPMK harus diisi" },
                {
                  min: 3,
                  max: 20,
                  message: "Kode CPMK harus antara 3-20 karakter",
                },
              ]}
            >
              <Input placeholder="Contoh: CPMK01" />
            </Form.Item>

            <Form.Item
              name="deskripsi"
              label="Deskripsi CPMK"
              rules={[
                { required: true, message: "Deskripsi CPMK harus diisi" },
                { min: 10, message: "Deskripsi minimal 10 karakter" },
              ]}
            >
              <TextArea
                rows={isMobile ? 3 : 4}
                placeholder="Masukkan deskripsi CPMK"
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

          {/* Sub CPMK Preview */}
          {modalMode === "view" &&
            editingCPMK?.subcpmk &&
            editingCPMK.subcpmk.length > 0 && (
              <Card title="Sub CPMK" size="small" className="mt-4">
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {editingCPMK.subcpmk.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-2 bg-gray-50 rounded border-l-2 border-gray-200"
                    >
                      <div className="text-sm font-medium">{sub.kode}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
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
              <Button
                block
                icon={<BranchesOutlined />}
                onClick={() => handleSubCPMK(selectedItemActions)}
              >
                Kelola Sub CPMK
              </Button>
            </div>
          )}
        </Drawer>
      </div>
    </div>
  );
};

export default withDashboardLayout(CPMKManagement);
