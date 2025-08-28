// CourseSearchSelection.tsx - Enhanced Responsive Version
import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  List,
  Typography,
  Tag,
  Button,
  message,
  Empty,
  Spin,
  Form,
  Select,
  Row,
  Col,
  Divider,
  Space,
  Tooltip,
  Grid,
  Drawer,
  Collapse,
} from "antd";
import {
  SearchOutlined,
  BookOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  UserOutlined,
  FilterOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { MataKuliah, CourseInfo } from "@/types/interface";

const { Search } = Input;
const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface Props {
  availableCourses: Record<string, MataKuliah>;
  onCourseSelect: (courseCode: string, courseInfo: CourseInfo) => void;
  selectedCourse: string;
  userProdi?: string;
  userName?: string;
  loading?: boolean;
  courseInfo?: CourseInfo;
}

export const CourseSearchSelection: React.FC<Props> = ({
  availableCourses,
  onCourseSelect,
  selectedCourse,
  userProdi,
  userName,
  loading = false,
  courseInfo,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState<
    Array<{ code: string; data: MataKuliah }>
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  // Mobile-specific states
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<{
    code: string;
    data: MataKuliah;
  } | null>(null);

  // Check if mobile
  const isMobile = !screens.md;

  // Generate academic year options (current and next 2 years)
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear}/${currentYear + 1}`,
    `${currentYear - 1}/${currentYear}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];

  // Generate semester options
  const semesters = [
    { value: 1, label: "Ganjil" },
    { value: 2, label: "Genap" },
    { value: 3, label: "Antara" },
  ];

  // Filter courses based on search term and user's prodi
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCourses([]);
      setShowResults(false);
      return;
    }

    const allCourses = Object.entries(availableCourses);

    // If searchTerm is "*", show all courses
    if (searchTerm === "*") {
      let coursesToShow = allCourses.map(([code, data]) => ({ code, data }));

      // Filter by prodi if available
      if (userProdi) {
        coursesToShow = coursesToShow.filter(({ code, data }) => {
          const prodiLower = userProdi.toLowerCase();
          const universitas = (data.universitas || "").toLowerCase();
          const jenis = (data.jenis || "").toLowerCase();
          const nama = (data.nama || "").toLowerCase();
          const prodi = (data.prodi || "").toLowerCase();

          return (
            prodi.includes(prodiLower) ||
            universitas.includes(prodiLower) ||
            jenis.includes(prodiLower) ||
            nama.includes(prodiLower) ||
            code.toLowerCase().includes(prodiLower)
          );
        });
      }

      const sortedCourses = coursesToShow.sort((a, b) =>
        (a.data.nama || "").localeCompare(b.data.nama || "")
      );

      setFilteredCourses(sortedCourses);
      setShowResults(true);
      return;
    }

    // Regular search filtering
    let filtered = allCourses.filter(([code, data]) => {
      // First filter by prodi if available
      let prodiMatch = true;
      if (userProdi) {
        const prodiLower = userProdi.toLowerCase();
        const universitas = (data.universitas || "").toLowerCase();
        const jenis = (data.jenis || "").toLowerCase();
        const nama = (data.nama || "").toLowerCase();
        const prodi = (data.prodi || "").toLowerCase();

        prodiMatch =
          prodi.includes(prodiLower) ||
          universitas.includes(prodiLower) ||
          jenis.includes(prodiLower) ||
          nama.includes(prodiLower) ||
          code.toLowerCase().includes(prodiLower);
      }

      // Then filter by search term
      const searchLower = searchTerm.toLowerCase();
      const searchMatch =
        code.toLowerCase().includes(searchLower) ||
        (data.nama || "").toLowerCase().includes(searchLower) ||
        (data.jenis || "").toLowerCase().includes(searchLower) ||
        (data.universitas || "").toLowerCase().includes(searchLower) ||
        (data.prodi || "").toLowerCase().includes(searchLower);

      return prodiMatch && searchMatch;
    });

    const result = filtered
      .map(([code, data]) => ({ code, data }))
      .sort((a, b) => (a.data.nama || "").localeCompare(b.data.nama || ""));

    setFilteredCourses(result);
    setShowResults(true);
  }, [searchTerm, availableCourses, userProdi]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCourseClick = (courseCode: string) => {
    // Simple course selection without course info setup
    onCourseSelect(courseCode, {
      semester: 1,
      year: academicYears[0],
      lecturer: userName || "",
    });
    setSearchTerm("");
    setShowResults(false);
    setCourseDetailVisible(false);
    message.success(
      `Mata kuliah "${
        availableCourses[courseCode]?.nama || courseCode
      }" telah dipilih`
    );
  };

  const handleClearSelection = () => {
    onCourseSelect("", {
      semester: 1,
      year: academicYears[0],
      lecturer: userName || "",
    });
    message.info("Pemilihan mata kuliah dibatalkan");
  };

  const openCourseDetail = (courseCode: string, courseData: MataKuliah) => {
    setSelectedCourseDetail({ code: courseCode, data: courseData });
    setCourseDetailVisible(true);
  };

  // Initialize form with default values
  useEffect(() => {
    form.setFieldsValue({
      semester: courseInfo?.semester || 1,
      year: courseInfo?.year || academicYears[0],
      lecturer: courseInfo?.lecturer || userName || "",
    });
  }, [courseInfo, userName, form]);

  // Show loading state
  if (loading) {
    return (
      <Card
        title="Memuat Data Mata Kuliah"
        size="small"
        className={isMobile ? "mx-0" : ""}
      >
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4">Sedang memuat data mata kuliah...</div>
        </div>
      </Card>
    );
  }

  // Mobile List Component for Search Results
  const MobileSearchResults = () => (
    <div className="max-h-80 overflow-y-auto">
      <List
        dataSource={filteredCourses}
        renderItem={({ code, data }) => (
          <List.Item
            className="border-b border-gray-100 px-0 py-3"
            actions={[
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => openCourseDetail(code, data)}
                size="small"
              />,
              <Button
                type="primary"
                size="small"
                onClick={() => handleCourseClick(code)}
              >
                Pilih
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={<BookOutlined className="text-blue-500 text-lg" />}
              title={
                <div className="mb-1">
                  <Text strong className="text-sm">
                    {data.nama || code}
                  </Text>
                </div>
              }
              description={
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    <Tag color="blue" size="small">
                      {code}
                    </Tag>
                    <Tag color="green" size="small">
                      {data.sks || 0} SKS
                    </Tag>
                    <Tag color="orange" size="small">
                      Sem {data.semester || "N/A"}
                    </Tag>
                  </div>
                  <Text className="text-xs text-gray-600 block">
                    {data.jenis || "Jenis tidak tersedia"}
                  </Text>
                  {data.prodi && (
                    <Tag color="purple" size="small">
                      {data.prodi}
                    </Tag>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  // Desktop Search Results
  const DesktopSearchResults = () => (
    <div className="max-h-96 overflow-y-auto border rounded-lg">
      <List
        dataSource={filteredCourses}
        renderItem={({ code, data }) => (
          <List.Item
            className="cursor-pointer hover:bg-gray-50 px-4"
            onClick={() => handleCourseClick(code)}
          >
            <List.Item.Meta
              avatar={<BookOutlined className="text-blue-500 text-xl" />}
              title={
                <div className="flex items-center justify-between">
                  <span className="font-medium">{data.nama || code}</span>
                  <div className="flex gap-2">
                    <Tag color="blue">{code}</Tag>
                    <Tag color="green">{data.sks || 0} SKS</Tag>
                    {data.prodi && <Tag color="purple">{data.prodi}</Tag>}
                  </div>
                </div>
              }
              description={
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    {data.jenis || "Jenis tidak tersedia"} | Semester{" "}
                    {data.semester || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.universitas || "Universitas tidak tersedia"}
                  </div>
                  {data.prodi && (
                    <div className="text-xs text-blue-600">
                      Program Studi: {data.prodi}
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  // Mobile Course Detail Drawer
  const CourseDetailDrawer = () => (
    <Drawer
      title="Detail Mata Kuliah"
      placement="bottom"
      onClose={() => setCourseDetailVisible(false)}
      open={courseDetailVisible}
      height="auto"
    >
      {selectedCourseDetail && (
        <div className="space-y-4">
          <div className="text-center">
            <Text strong className="text-lg">
              {selectedCourseDetail.data.nama || selectedCourseDetail.code}
            </Text>
            <div className="flex justify-center gap-2 mt-2">
              <Tag color="blue">{selectedCourseDetail.code}</Tag>
              <Tag color="green">{selectedCourseDetail.data.sks || 0} SKS</Tag>
              <Tag color="orange">
                Sem {selectedCourseDetail.data.semester || "N/A"}
              </Tag>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Text type="secondary">Jenis:</Text>
              <Text className="ml-2">
                {selectedCourseDetail.data.jenis || "Tidak tersedia"}
              </Text>
            </div>
            <div>
              <Text type="secondary">Universitas:</Text>
              <Text className="ml-2">
                {selectedCourseDetail.data.universitas || "Tidak tersedia"}
              </Text>
            </div>
            {selectedCourseDetail.data.prodi && (
              <div>
                <Text type="secondary">Program Studi:</Text>
                <Text className="ml-2">{selectedCourseDetail.data.prodi}</Text>
              </div>
            )}
          </div>

          <Button
            type="primary"
            block
            size="large"
            onClick={() => handleCourseClick(selectedCourseDetail.code)}
          >
            Pilih Mata Kuliah Ini
          </Button>
        </div>
      )}
    </Drawer>
  );

  // If a course is already selected, show course info with edit option
  if (selectedCourse && availableCourses[selectedCourse]) {
    const courseData = availableCourses[selectedCourse];
    return (
      <Card
        title="Mata Kuliah Terpilih"
        size="small"
        className={isMobile ? "mx-0" : ""}
      >
        <div className="space-y-4">
          <div
            className={`${
              isMobile ? "space-y-3" : "flex items-center justify-between"
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircleOutlined className="text-green-500 text-xl" />
              <div>
                <div
                  className={`font-semibold ${
                    isMobile ? "text-base" : "text-lg"
                  }`}
                >
                  {courseData.nama || "Nama tidak tersedia"}
                </div>
                <div className="text-sm text-gray-600">
                  Kode: {selectedCourse} | SKS: {courseData.sks || "N/A"} |
                  Semester: {courseData.semester || "N/A"}
                </div>
                <div className="text-sm text-gray-500">
                  {courseData.jenis || "Jenis tidak tersedia"} -{" "}
                  {courseData.universitas || "Universitas tidak tersedia"}
                </div>
                {courseData.prodi && (
                  <div className="text-sm text-blue-600">
                    Program Studi: {courseData.prodi}
                  </div>
                )}
              </div>
            </div>
            <Button
              type="primary"
              ghost
              onClick={handleClearSelection}
              // size={isMobile ? "small" : "default"}
              block={isMobile}
            >
              Ganti Mata Kuliah
            </Button>
          </div>

          {/* Course Information Form */}
          <Divider />
          <Form form={form} layout="vertical" size="small">
            <Row gutter={isMobile ? [8, 12] : [16, 16]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="semester"
                  label="Semester"
                  rules={[{ required: true, message: "Pilih semester!" }]}
                >
                  <Select placeholder="Pilih Semester">
                    {semesters.map((sem) => (
                      <Option key={sem.value} value={sem.value}>
                        Semester {sem.value} ({sem.label})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="year"
                  label="Tahun Akademik"
                  rules={[{ required: true, message: "Pilih tahun akademik!" }]}
                >
                  <Select placeholder="Pilih Tahun">
                    {academicYears.map((year) => (
                      <Option key={year} value={year}>
                        {year}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="lecturer"
                  label="Dosen Pengampu"
                  rules={[{ required: true, message: "Masukkan nama dosen!" }]}
                >
                  <Input placeholder="Nama Dosen" prefix={<UserOutlined />} />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <SettingOutlined />
            <Text>
              Info Kelas: Semester {form.getFieldValue("semester") || 1},{" "}
              {form.getFieldValue("year") || academicYears[0]} -{" "}
              {form.getFieldValue("lecturer") || "Belum diset"}
            </Text>
          </div>

          {userProdi && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Text className="text-sm text-blue-700">
                Program Studi Anda: {userProdi}
              </Text>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Show search interface if no course is selected
  return (
    <>
      <Card
        title="Pilih Mata Kuliah"
        size="small"
        className={isMobile ? "mx-0" : ""}
      >
        <div className="space-y-4">
          {/* User Info */}
          {(userProdi || userName) && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <InfoCircleOutlined />
                <span>Informasi Pengguna</span>
              </div>
              <div className="space-y-1">
                {userName && (
                  <div className="text-sm">
                    <Text strong>Nama:</Text> {userName}
                  </div>
                )}
                {userProdi && (
                  <div className="text-sm">
                    <Text strong>Program Studi:</Text> {userProdi}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Course Count Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <InfoCircleOutlined />
              <span>
                Total mata kuliah tersedia:{" "}
                {Object.keys(availableCourses).length}
              </span>
            </div>
            {userProdi && (
              <div className="text-sm text-gray-500 mt-1">
                Filter berdasarkan program studi: <strong>{userProdi}</strong>
              </div>
            )}
          </div>

          {/* Search Interface */}
          <div className={`${isMobile ? "space-y-2" : "flex gap-2"}`}>
            <Search
              placeholder="Cari mata kuliah..."
              allowClear
              enterButton={<SearchOutlined />}
              size={isMobile ? "middle" : "large"}
              onSearch={handleSearch}
              onChange={(e) => setSearchTerm(e.target.value)}
              value={searchTerm}
              style={isMobile ? {} : { flex: 1 }}
            />
            <Button
              onClick={() => {
                setSearchTerm("*");
                setShowResults(true);
              }}
              type="default"
              icon={<FilterOutlined />}
              // size={isMobile ? "middle" : "default"}
              block={isMobile}
            >
              {isMobile ? "Semua" : "Tampilkan Semua"}
            </Button>
          </div>

          {/* Search Results */}
          {showResults && (
            <>
              {filteredCourses.length > 0 ? (
                isMobile ? (
                  <MobileSearchResults />
                ) : (
                  <DesktopSearchResults />
                )
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <div>
                        Tidak ditemukan mata kuliah
                        {userProdi && ` untuk program studi ${userProdi}`}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Coba gunakan kata kunci yang berbeda atau cek koneksi
                        API
                      </div>
                    </div>
                  }
                />
              )}
            </>
          )}

          {/* Empty States */}
          {!showResults &&
            !searchTerm &&
            Object.keys(availableCourses).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <InfoCircleOutlined className="text-4xl mb-2 text-red-400" />
                <div className="text-red-600">Tidak ada data mata kuliah</div>
                <div className="text-sm mt-1">
                  Pastikan koneksi API berjalan dengan baik
                </div>
              </div>
            )}

          {!showResults &&
            !searchTerm &&
            Object.keys(availableCourses).length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOutlined className="text-4xl mb-2" />
                <div>Mulai ketik untuk mencari mata kuliah</div>
                <div className="text-sm mt-1">
                  Anda dapat mencari berdasarkan kode, nama, atau jenis mata
                  kuliah
                </div>
                {userProdi && (
                  <div className="text-xs text-blue-600 mt-2">
                    Hasil akan difilter sesuai program studi: {userProdi}
                  </div>
                )}
              </div>
            )}
        </div>
      </Card>

      {/* Mobile Course Detail Drawer */}
      <CourseDetailDrawer />
    </>
  );
};
