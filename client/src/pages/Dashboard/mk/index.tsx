// components/MK/MKManagement.tsx
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Table,
  Checkbox,
  Row,
  Col,
  Space,
  Typography,
  Modal,
  Badge,
  Tabs,
  Tag,
  Select,
  InputNumber,
  Grid,
  Drawer,
  List,
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
import { mkApi, cplApi, cpmkApi } from "../services/api";
import type {
  MK,
  CPL,
  CPMK,
  CreateMKRequest,
  UpdateMKRequest,
} from "../types/interfaces";
import withDashboardLayout from "@/components/hoc/withDashboardLayout";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

// Program Studi options
const PRODI_OPTIONS = [
  { value: "Teknik Informatika", label: "Teknik Informatika" },
  { value: "Teknik Industri", label: "Teknik Industri" },
  { value: "Teknik Sipil", label: "Teknik Sipil" },
  { value: "Teknik Lingkungan", label: "Teknik Lingkungan" },
  { value: "Teknik Arsitektur", label: "Teknik Arsitektur" },
  { value: "Teknologi Hasil Pertanian", label: "Teknologi Hasil Pertanian" },
];

const MKManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [mks, setMks] = useState<MK[]>([]);
  const [cpls, setCpls] = useState<CPL[]>([]);
  const [cpmks, setCpmks] = useState<CPMK[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "matrix">("table");
  const screens = useBreakpoint();

  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [editingMK, setEditingMK] = useState<MK | null>(null);

  // Mobile-specific states
  const [selectedItemActions, setSelectedItemActions] = useState<MK | null>(
    null
  );
  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);

  // Relation selections
  const [selectedCPLs, setSelectedCPLs] = useState<number[]>([]);
  const [selectedCPMKs, setSelectedCPMKs] = useState<number[]>([]);

  // Matrix view states
  const [matrixRelationsCPL, setMatrixRelationsCPL] = useState<
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
  }, [mks, cpls, cpmks, viewMode]);

  const fetchAllData = async () => {
    setTableLoading(true);
    try {
      const [mkResponse, cplResponse, cpmkResponse] = await Promise.all([
        mkApi.getAll(),
        cplApi.getAll(),
        cpmkApi.getAll(),
      ]);

      if (mkResponse.success) setMks(mkResponse.data || []);
      if (cplResponse.success) setCpls(cplResponse.data || []);
      if (cpmkResponse.success) setCpmks(cpmkResponse.data || []);
    } catch (error) {
      message.error("Gagal memuat data");
    } finally {
      setTableLoading(false);
    }
  };

  const updateMatrixRelations = () => {
    const relationsCPL: Record<string, boolean> = {};
    const relationsCPMK: Record<string, boolean> = {};

    mks.forEach((mk) => {
      cpls.forEach((cpl) => {
        const key = `${mk.id}-${cpl.id}`;
        relationsCPL[key] = mk.cpl?.some((c) => c.id === cpl.id) || false;
      });

      cpmks.forEach((cpmk) => {
        const key = `${mk.id}-${cpmk.id}`;
        relationsCPMK[key] = mk.cpmk?.some((c) => c.id === cpmk.id) || false;
      });
    });

    setMatrixRelationsCPL(relationsCPL);
    setMatrixRelationsCPMK(relationsCPMK);
  };

  const handleMatrixChange = async (
    mkId: number,
    relatedId: number,
    relationType: "cpl" | "cpmk",
    checked: boolean
  ) => {
    const key = `${mkId}-${relatedId}`;

    try {
      // Update local state immediately
      if (relationType === "cpl") {
        setMatrixRelationsCPL((prev) => ({ ...prev, [key]: checked }));
      } else if (relationType === "cpmk") {
        setMatrixRelationsCPMK((prev) => ({ ...prev, [key]: checked }));
      }

      // Get current relations for this MK
      const mk = mks.find((m) => m.id === mkId);
      let currentIds: number[] = [];

      if (relationType === "cpl") {
        currentIds = mk?.cpl?.map((c) => c.id) || [];
      } else if (relationType === "cpmk") {
        currentIds = mk?.cpmk?.map((c) => c.id) || [];
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
      } else if (relationType === "cpmk") {
        updateData.cpmkIds = newIds;
      }

      await mkApi.update(mkId, updateData);
      await fetchAllData();
      message.success("Relasi berhasil diperbarui");
    } catch (error) {
      // Revert local state on error
      if (relationType === "cpl") {
        setMatrixRelationsCPL((prev) => ({ ...prev, [key]: !checked }));
      } else if (relationType === "cpmk") {
        setMatrixRelationsCPMK((prev) => ({ ...prev, [key]: !checked }));
      }
      message.error("Gagal memperbarui relasi");
    }
  };

  const handleCreate = () => {
    setModalMode("create");
    setEditingMK(null);
    form.resetFields();
    form.setFieldsValue({
      sks: 3,
      jenis: "MK Program Studi",
      prodi: undefined, // Reset prodi to undefined for better UX
    });
    setSelectedCPLs([]);
    setSelectedCPMKs([]);
    setIsModalVisible(true);
  };

  const handleEdit = (mk: MK) => {
    setModalMode("edit");
    setEditingMK(mk);
    form.setFieldsValue({
      kode: mk.kode,
      nama: mk.nama,
      sks: mk.sks,
      prodi: mk.prodi,
      jenis: mk.jenis,
    });
    setSelectedCPLs(mk.cpl?.map((cpl) => cpl.id) || []);
    setSelectedCPMKs(mk.cpmk?.map((cpmk) => cpmk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const handleView = (mk: MK) => {
    setModalMode("view");
    setEditingMK(mk);
    form.setFieldsValue({
      kode: mk.kode,
      nama: mk.nama,
      sks: mk.sks,
      prodi: mk.prodi,
      jenis: mk.jenis,
    });
    setSelectedCPLs(mk.cpl?.map((cpl) => cpl.id) || []);
    setSelectedCPMKs(mk.cpmk?.map((cpmk) => cpmk.id) || []);
    setIsModalVisible(true);
    setActionDrawerVisible(false);
  };

  const openActionDrawer = (item: MK) => {
    setSelectedItemActions(item);
    setActionDrawerVisible(true);
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);

      const requestData = {
        kode: values.kode,
        nama: values.nama,
        sks: values.sks,
        prodi: values.prodi,
        jenis: values.jenis,
        cplIds: selectedCPLs,
        cpmkIds: selectedCPMKs,
      };

      if (modalMode === "create") {
        const response = await mkApi.create(requestData as CreateMKRequest);
        if (response.success) {
          message.success("Mata Kuliah berhasil dibuat");
          setIsModalVisible(false);
          fetchAllData();
        }
      } else if (modalMode === "edit" && editingMK) {
        const response = await mkApi.update(
          editingMK.id,
          requestData as UpdateMKRequest
        );
        if (response.success) {
          message.success("Mata Kuliah berhasil diperbarui");
          setIsModalVisible(false);
          fetchAllData();
        }
      }
    } catch (error) {
      message.error(
        `Gagal ${
          modalMode === "create" ? "membuat" : "memperbarui"
        } Mata Kuliah`
      );
    } finally {
      setLoading(false);
    }
  };

  // Desktop Table view columns
  const mkColumns = [
    {
      title: "Kode",
      dataIndex: "kode",
      key: "kode",
      width: 120,
      render: (kode: string) => <Tag color="gray">{kode}</Tag>,
    },
    {
      title: "Nama Mata Kuliah",
      dataIndex: "nama",
      key: "nama",
      ellipsis: true,
    },
    {
      title: "SKS",
      dataIndex: "sks",
      key: "sks",
      width: 60,
      align: "center" as const,
    },
    {
      title: "Prodi",
      dataIndex: "prodi",
      key: "prodi",
      width: 150,
      ellipsis: true,
      // Add filter for prodi column
      filters: PRODI_OPTIONS.map((option) => ({
        text: option.label,
        value: option.value,
      })),
      onFilter: (value: any, record: MK) => record.prodi === value,
    },
    {
      title: "Jenis",
      dataIndex: "jenis",
      key: "jenis",
      width: 120,
      render: (jenis: string) => {
        const color =
          jenis === "Wajib" ? "red" : jenis === "Pilihan" ? "orange" : "blue";
        return <Tag color={color}>{jenis}</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "actions",
      width: 150,
      render: (record: MK) => (
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
      dataSource={mks}
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
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Tag color="green">{item.kode}</Tag>
                <Tag
                  color={
                    item.jenis === "Wajib"
                      ? "red"
                      : item.jenis === "Pilihan"
                      ? "orange"
                      : "blue"
                  }
                >
                  {item.jenis}
                </Tag>
                <Tag>{item.sks} SKS</Tag>
              </div>
            }
            description={
              <div>
                <Text strong style={{ display: "block", marginBottom: 4 }}>
                  {item.nama}
                </Text>
                <Text
                  type="secondary"
                  style={{
                    fontSize: "12px",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Program Studi: {item.prodi}
                </Text>
                <div className="flex gap-2">
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
        total: mks.length,
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
      {mks.map((mk) => (
        <Panel
          key={mk.id}
          header={
            <div>
              <Tag color="green">{mk.kode}</Tag>
              <Text style={{ marginLeft: 8, fontSize: "14px" }}>{mk.nama}</Text>
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
                const key = `${mk.id}-${cpl.id}`;
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
                            mk.id,
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
          </div>
        </Panel>
      ))}
    </Collapse>
  );

  // Matrix view columns
  const createMatrixColumns = (relationType: "cpl" | "cpmk") => {
    const items = relationType === "cpl" ? cpls : cpmks;
    const relations =
      relationType === "cpl" ? matrixRelationsCPL : matrixRelationsCPMK;

    return [
      {
        title: "Kode MK",
        dataIndex: "kode",
        key: "kode",
        width: 120,
        fixed: "left" as const,
        render: (kode: string) => <Tag color="green">{kode}</Tag>,
      },
      ...items.map((item) => ({
        title: item.kode,
        key: `${relationType}-${item.id}`,
        width: 80,
        align: "center" as const,
        render: (_: any, record: MK) => {
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
      ? "Tambah Mata Kuliah Baru"
      : modalMode === "edit"
      ? `Edit MK: ${editingMK?.kode}`
      : `Detail MK: ${editingMK?.kode}`;

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
            {isMobile ? "Mata Kuliah" : "Mata Kuliah"}
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
                Tambah Mata Kuliah
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
              dataSource={mks}
              columns={mkColumns}
              rowKey="id"
              loading={tableLoading}
              size={isTablet ? "small" : "middle"}
              pagination={{
                total: mks.length,
                pageSize: 10,
                showSizeChanger: !isTablet,
                showQuickJumper: !isTablet,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} items`,
              }}
            />
          ) : (
            <Tabs defaultActiveKey="cpl" size="small">
              <TabPane tab="Relasi MK - CPL" key="cpl">
                <Table
                  dataSource={mks}
                  columns={createMatrixColumns("cpl")}
                  rowKey="id"
                  loading={tableLoading}
                  scroll={{ x: "max-content" }}
                  size={isTablet ? "small" : "middle"}
                  pagination={{ pageSize: 20 }}
                />
              </TabPane>
              <TabPane tab="Relasi MK - CPMK" key="cpmk">
                <Table
                  dataSource={mks}
                  columns={createMatrixColumns("cpmk")}
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
              label="Kode Mata Kuliah"
              rules={[
                { required: true, message: "Kode MK harus diisi" },
                {
                  min: 3,
                  max: 20,
                  message: "Kode MK harus antara 3-20 karakter",
                },
              ]}
            >
              <Input placeholder="Contoh: MK01" />
            </Form.Item>

            <Form.Item
              name="nama"
              label="Nama Mata Kuliah"
              rules={[
                { required: true, message: "Nama MK harus diisi" },
                {
                  min: 5,
                  max: 255,
                  message: "Nama MK harus antara 5-255 karakter",
                },
              ]}
            >
              <Input placeholder="Masukkan nama mata kuliah" />
            </Form.Item>

            <Row gutter={isMobile ? 8 : 16}>
              <Col span={12}>
                <Form.Item
                  name="sks"
                  label="SKS"
                  rules={[{ required: true, message: "SKS harus diisi" }]}
                >
                  <InputNumber
                    min={1}
                    max={6}
                    className="w-full"
                    placeholder="SKS"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="jenis"
                  label="Jenis Mata Kuliah"
                  rules={[
                    { required: true, message: "Jenis MK harus dipilih" },
                  ]}
                >
                  <Select placeholder="Pilih jenis MK">
                    <Option value="Wajib">Wajib</Option>
                    <Option value="Pilihan">Pilihan</Option>
                    <Option value="MK Program Studi">MK Program Studi</Option>
                    <Option value="MKDU Universitas">MKDU Universitas</Option>
                    <Option value="MKDU Fakultas">MKDU Fakultas</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="prodi"
              label="Program Studi"
              rules={[
                { required: true, message: "Program Studi harus dipilih" },
              ]}
            >
              <Select
                placeholder="Pilih Program Studi"
                showSearch
                allowClear
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                style={{ width: "100%" }}
              >
                {PRODI_OPTIONS.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
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

export default withDashboardLayout(MKManagement);
