// components/CPL/CPLManagement.tsx
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
  Badge,
  Tabs,
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
import { cplApi, plApi, mkApi, cpmkApi } from "../services/api";
import type {
  CPL,
  PL,
  MK,
  CPMK,
  CreateCPLRequest,
  UpdateCPLRequest,
} from "../types/interfaces";
import withDashboardLayout from "@/components/hoc/withDashboardLayout";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

const CPLManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [pls, setPls] = useState<PL[]>([]);
  const [mks, setMks] = useState<MK[]>([]);
  const [cpmks, setCpmks] = useState<CPMK[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "matrix">("table");
  const screens = useBreakpoint();

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [editingCPL, setEditingCPL] = useState<CPL | null>(null);

  // Mobile-specific states
  const [selectedItemActions, setSelectedItemActions] = useState<CPL | null>(
    null
  );
  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);

  // Relation selections
  const [selectedPLs, setSelectedPLs] = useState<number[]>([]);
  const [selectedMKs, setSelectedMKs] = useState<number[]>([]);
  const [selectedCPMKs, setSelectedCPMKs] = useState<number[]>([]);

  // Matrix view states
  const [matrixRelationsPL, setMatrixRelationsPL] = useState<
    Record<string, boolean>
  >({});
  const [matrixRelationsMK, setMatrixRelationsMK] = useState<
    Record<string, boolean>
  >({});
  const [matrixRelationsCPMK, setMatrixRelationsCPMK] = useState<
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
  }, [cpls, pls, mks, cpmks, viewMode]);

  const fetchAllData = async () => {
    setTableLoading(true);
    try {
      const [cplResponse, plResponse, mkResponse, cpmkResponse] =
        await Promise.all([
          cplApi.getAll(),
          plApi.getAll(),
          mkApi.getAll(),
          cpmkApi.getAll(),
        ]);

      if (cplResponse.success) setCpls(cplResponse.data || []);
      if (plResponse.success) setPls(plResponse.data || []);
      if (mkResponse.success) setMks(mkResponse.data || []);
      if (cpmkResponse.success) setCpmks(cpmkResponse.data || []);
    } catch (error) {
      message.error("Gagal memuat data");
    } finally {
      setTableLoading(false);
    }
  };

  const updateMatrixRelations = () => {
    const relationsPL: Record<string, boolean> = {};
    const relationsMK: Record<string, boolean> = {};
    const relationsCPMK: Record<string, boolean> = {};

    cpls.forEach((cpl) => {
      pls.forEach((pl) => {
        const key = `${cpl.id}-${pl.id}`;
        relationsPL[key] = cpl.pl?.some((p) => p.id === pl.id) || false;
      });

      mks.forEach((mk) => {
        const key = `${cpl.id}-${mk.id}`;
        relationsMK[key] = cpl.mk?.some((m) => m.id === mk.id) || false;
      });

      cpmks.forEach((cpmk) => {
        const key = `${cpl.id}-${cpmk.id}`;
        relationsCPMK[key] = cpl.cpmk?.some((c) => c.id === cpmk.id) || false;
      });
    });

    setMatrixRelationsPL(relationsPL);
    setMatrixRelationsMK(relationsMK);
    setMatrixRelationsCPMK(relationsCPMK);
  };

  const handleMatrixChange = async (
    cplId: number,
    relatedId: number,
    relationType: "pl" | "mk" | "cpmk",
    checked: boolean
  ) => {
    const key = `${cplId}-${relatedId}`;

    try {
      // Update local state immediately
      if (relationType === "pl") {
        setMatrixRelationsPL((prev) => ({ ...prev, [key]: checked }));
      } else if (relationType === "mk") {
        setMatrixRelationsMK((prev) => ({ ...prev, [key]: checked }));
      } else if (relationType === "cpmk") {
        setMatrixRelationsCPMK((prev) => ({ ...prev, [key]: checked }));
      }

      // Get current relations for this CPL
      const cpl = cpls.find((c) => c.id === cplId);
      let currentIds: number[] = [];

      if (relationType === "pl") {
        currentIds = cpl?.pl?.map((p) => p.id) || [];
      } else if (relationType === "mk") {
        currentIds = cpl?.mk?.map((m) => m.id) || [];
      } else if (relationType === "cpmk") {
        currentIds = cpl?.cpmk?.map((c) => c.id) || [];
      }

      let newIds: number[];
      if (checked) {
        newIds = [...currentIds, relatedId];
      } else {
        newIds = currentIds.filter((id) => id !== relatedId);
      }

      // Update via API using PATCH
      const updateData: any = {};
      if (relationType === "pl") {
        updateData.plIds = newIds;
      } else if (relationType === "mk") {
        updateData.mkIds = newIds;
      } else if (relationType === "cpmk") {
        updateData.cpmkIds = newIds;
      }

      await cplApi.update(cplId, updateData);
      await fetchAllData();
      message.success("Relasi berhasil diperbarui");
    } catch (error) {
      // Revert local state on error
      if (relationType === "pl") {
        setMatrixRelationsPL((prev) => ({ ...prev, [key]: !checked }));
      } else if (relationType === "mk") {
        setMatrixRelationsMK((prev) => ({ ...prev, [key]: !checked }));
      } else if (relationType === "cpmk") {
        setMatrixRelationsCPMK((prev) => ({ ...prev, [key]: !checked }));
      }
      message.error("Gagal memperbarui relasi");
    }
  };

  const handleCreate = () => {
    setModalMode("create");
    setEditingCPL(null);
    form.resetFields();
    setSelectedPLs([]);
    setSelectedMKs([]);
    setSelectedCPMKs([]);
    setIsModalVisible(true);
  };

  const handleEdit = (cpl: CPL) => {
    setModalMode("edit");
    setEditingCPL(cpl);
    form.setFieldsValue({
      kode: cpl.kode,
      deskripsi: cpl.deskripsi,
    });
    setSelectedPLs(cpl.pl?.map((pl) => pl.id) || []);
    setSelectedMKs(cpl.mk?.map((mk) => mk.id) || []);
    setSelectedCPMKs(cpl.cpmk?.map((cpmk) => cpmk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const handleView = (cpl: CPL) => {
    setModalMode("view");
    setEditingCPL(cpl);
    form.setFieldsValue({
      kode: cpl.kode,
      deskripsi: cpl.deskripsi,
    });
    setSelectedPLs(cpl.pl?.map((pl) => pl.id) || []);
    setSelectedMKs(cpl.mk?.map((mk) => mk.id) || []);
    setSelectedCPMKs(cpl.cpmk?.map((cpmk) => cpmk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const openActionDrawer = (item: CPL) => {
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
        plIds: selectedPLs,
        mkIds: selectedMKs,
        cpmkIds: selectedCPMKs,
      };

      if (modalMode === "create") {
        const response = await cplApi.create(requestData as CreateCPLRequest);
        if (response.success) {
          message.success("CPL berhasil dibuat");
          setIsModalVisible(false);
          fetchAllData();
        }
      } else if (modalMode === "edit" && editingCPL) {
        const response = await cplApi.update(
          editingCPL.id,
          requestData as UpdateCPLRequest
        );
        if (response.success) {
          message.success("CPL berhasil diperbarui");
          setIsModalVisible(false);
          fetchAllData();
        }
      }
    } catch (error) {
      message.error(
        `Gagal ${modalMode === "create" ? "membuat" : "memperbarui"} CPL`
      );
    } finally {
      setLoading(false);
    }
  };

  // Desktop Table view columns
  const cplColumns = [
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
    //   render: (record: CPL) => (
    //     <Space direction="vertical" size={0}>
    //       <Badge count={record.pl?.length || 0} color="green" showZero>
    //         <span className="text-xs">PL</span>
    //       </Badge>
    //       <Badge count={record.mk?.length || 0} color="blue" showZero>
    //         <span className="text-xs">MK</span>
    //       </Badge>
    //       <Badge count={record.cpmk?.length || 0} color="orange" showZero>
    //         <span className="text-xs">CPMK</span>
    //       </Badge>
    //     </Space>
    //   ),
    // },
    {
      title: "Aksi",
      key: "actions",
      width: 150,
      render: (record: CPL) => (
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
      dataSource={cpls}
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
                <Tag color="blue">{item.kode}</Tag>
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
                <div className="flex gap-2">
                  <Badge
                    count={item.pl?.length || 0}
                    color="green"
                    showZero
                    size="small"
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      PL
                    </Text>
                  </Badge>
                  <Badge
                    count={item.mk?.length || 0}
                    color="blue"
                    showZero
                    size="small"
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      MK
                    </Text>
                  </Badge>
                  <Badge
                    count={item.cpmk?.length || 0}
                    color="orange"
                    showZero
                    size="small"
                  >
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      CPMK
                    </Text>
                  </Badge>
                </div>
              </div>
            }
          />
        </List.Item>
      )}
      pagination={{
        total: cpls.length,
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
      {cpls.map((cpl) => (
        <Panel
          key={cpl.id}
          header={
            <div>
              <Tag color="blue">{cpl.kode}</Tag>
              <Text style={{ marginLeft: 8, fontSize: "14px" }}>
                {cpl.deskripsi}
              </Text>
            </div>
          }
        >
          <div style={{ padding: "8px 0" }}>
            <Text
              strong
              style={{ fontSize: "14px", marginBottom: 8, display: "block" }}
            >
              Relasi dengan PL:
            </Text>
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              {pls.map((pl) => {
                const key = `${cpl.id}-${pl.id}`;
                return (
                  <Col span={12} key={pl.id}>
                    <div
                      style={{
                        padding: "8px",
                        border: "1px solid #f0f0f0",
                        borderRadius: "4px",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <Checkbox
                        checked={matrixRelationsPL[key] || false}
                        onChange={(e) =>
                          handleMatrixChange(
                            cpl.id,
                            pl.id,
                            "pl",
                            e.target.checked
                          )
                        }
                        style={{ width: "100%" }}
                      >
                        <Text style={{ fontSize: "12px" }}>{pl.kode}</Text>
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
  const createMatrixColumns = (relationType: "pl" | "mk" | "cpmk") => {
    const items =
      relationType === "pl" ? pls : relationType === "mk" ? mks : cpmks;
    const relations =
      relationType === "pl"
        ? matrixRelationsPL
        : relationType === "mk"
        ? matrixRelationsMK
        : matrixRelationsCPMK;

    return [
      {
        title: "Kode CPL",
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
        render: (_: any, record: CPL) => {
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
      ? "Tambah CPL Baru"
      : modalMode === "edit"
      ? `Edit CPL: ${editingCPL?.kode}`
      : `Detail CPL: ${editingCPL?.kode}`;

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
            {isMobile ? "CPL" : "Capaian Pembelajaran Lulusan"}
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
                Tambah CPL
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
              dataSource={cpls}
              columns={cplColumns}
              rowKey="id"
              loading={tableLoading}
              size={isTablet ? "small" : "middle"}
              pagination={{
                total: cpls.length,
                pageSize: 10,
                showSizeChanger: !isTablet,
                showQuickJumper: !isTablet,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} items`,
              }}
            />
          ) : (
            <Tabs defaultActiveKey="pl" size="small">
              <TabPane tab="Relasi CPL - PL" key="pl">
                <Table
                  dataSource={cpls}
                  columns={createMatrixColumns("pl")}
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
              label="Kode CPL"
              rules={[
                { required: true, message: "Kode CPL harus diisi" },
                {
                  min: 3,
                  max: 20,
                  message: "Kode CPL harus antara 3-20 karakter",
                },
              ]}
            >
              <Input placeholder="Contoh: CPL-001" />
            </Form.Item>

            <Form.Item
              name="deskripsi"
              label="Deskripsi CPL"
              rules={[
                { required: true, message: "Deskripsi CPL harus diisi" },
                { min: 10, message: "Deskripsi minimal 10 karakter" },
              ]}
            >
              <TextArea
                rows={isMobile ? 3 : 4}
                placeholder="Masukkan deskripsi CPL"
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

export default withDashboardLayout(CPLManagement);
