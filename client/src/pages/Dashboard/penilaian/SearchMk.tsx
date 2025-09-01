// CourseSearchSelection.tsx - Enhanced Version with Recent Courses
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
  Grid,
  Drawer,
  Badge,
  Tooltip,
  Space,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  BookOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  StarOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { MataKuliah, CourseInfo } from "@/types/interface";
import { indexedDBService } from "./services/IndexedDb";
import { Link } from "react-router-dom";

const { Search } = Input;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface CourseSelection {
  id: string;
  courseCode: string;
  courseName: string;
  courseInfo: CourseInfo;
  hasData: boolean;
  lastAccessed: Date;
  progress: {
    totalStudents: number;
    completedStudents: number;
    assessmentTypesSet: boolean;
    weightsConfigured: boolean;
  };
}

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
  const [recentCourses, setRecentCourses] = useState<CourseSelection[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
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

  // Load recent courses from IndexedDB
  useEffect(() => {
    const loadRecentCourses = async () => {
      try {
        setLoadingRecent(true);
        const recent = await indexedDBService.getRecentCourseSelections(8);
        setRecentCourses(recent);
      } catch (error) {
        console.error("Failed to load recent courses:", error);
      } finally {
        setLoadingRecent(false);
      }
    };

    loadRecentCourses();
  }, []);

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

  const handleCourseClick = async (courseCode: string) => {
    const courseData = availableCourses[courseCode];
    const defaultCourseInfo = {
      semester: 1,
      year: academicYears[0],
      kelas: "",
      lecturer: userName || "",
    };

    try {
      // Save course selection to IndexedDB
      await indexedDBService.saveCourseSelection(
        courseCode,
        courseData?.nama || courseCode,
        defaultCourseInfo
      );

      // Update recent courses
      const updatedRecent = await indexedDBService.getRecentCourseSelections(8);
      setRecentCourses(updatedRecent);
    } catch (error) {
      console.error("Failed to save course selection:", error);
      // Don't block the selection process
    }

    // Proceed with course selection
    onCourseSelect(courseCode, defaultCourseInfo);
    setSearchTerm("");
    setShowResults(false);
    setCourseDetailVisible(false);
    message.success(
      `Mata kuliah "${
        availableCourses[courseCode]?.nama || courseCode
      }" telah dipilih`
    );
  };

  const handleRecentCourseClick = async (recentCourse: CourseSelection) => {
    try {
      // Update access time
      await indexedDBService.saveCourseSelection(
        recentCourse.courseCode,
        recentCourse.courseName,
        recentCourse.courseInfo
      );

      // Update recent courses list
      const updatedRecent = await indexedDBService.getRecentCourseSelections(8);
      setRecentCourses(updatedRecent);
    } catch (error) {
      console.error("Failed to update course access:", error);
    }

    onCourseSelect(recentCourse.courseCode, recentCourse.courseInfo);
    message.success(`Melanjutkan penilaian "${recentCourse.courseName}"`);
  };

  const handleDeleteRecentCourse = async (
    courseCode: string,
    courseName: string
  ) => {
    try {
      await indexedDBService.deleteCourseSelection(courseCode);
      await indexedDBService.deleteGradingData(courseCode);

      // Update recent courses list
      const updatedRecent = await indexedDBService.getRecentCourseSelections(8);
      setRecentCourses(updatedRecent);

      message.success(`Data penilaian "${courseName}" berhasil dihapus`);
    } catch (error) {
      console.error("Failed to delete course:", error);
      message.error("Gagal menghapus data penilaian");
    }
  };

  const handleClearSelection = async () => {
    try {
      // Hapus data dari IndexedDB jika ada
      if (selectedCourse) {
        await indexedDBService.deleteCourseSelection(selectedCourse);
        await indexedDBService.deleteGradingData(selectedCourse);

        // Update recent courses list
        const updatedRecent = await indexedDBService.getRecentCourseSelections(
          8
        );
        setRecentCourses(updatedRecent);

        message.success("Data mata kuliah berhasil dihapus");
      }
    } catch (error) {
      console.error("Failed to clear course selection:", error);
      message.warning(
        "Gagal menghapus data, tetapi pemilihan mata kuliah dibatalkan"
      );
    }

    // Reset course selection
    onCourseSelect("", {
      semester: 1,
      year: academicYears[0],
      kelas: "",
      lecturer: userName || "",
    });
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

  // Recent Courses Component
  const RecentCoursesSection = () => {
    if (loadingRecent) {
      return (
        <Card size="small" title="Mata Kuliah Terbaru">
          <div className="text-center py-4">
            <Spin />
          </div>
        </Card>
      );
    }

    if (recentCourses.length === 0) {
      return null;
    }

    return (
      <Card
        size="small"
        title={
          <Space>
            <ClockCircleOutlined />
            Lanjutkan Penilaian
            <Badge count={recentCourses.filter((c) => c.hasData).length} />
          </Space>
        }
        className="!mb-4"
      >
        <div className={isMobile ? "!space-y-3" : "!space-y-2"}>
          {recentCourses.slice(0, isMobile ? 3 : 5).map((course) => {
            return (
              <div
                key={course.courseCode}
                className="flex items-center justify-between p-3 border rounded-lg text-white cursor-pointer bg-yellow-300"
                onClick={() => handleRecentCourseClick(course)}
              >
                <div className="flex items-center gap-2 ml-3">
                  {course.hasData ? (
                    <Tooltip title="Lanjutkan Penilaian">
                      <Link to={`/dashboard/penilaian/${course.courseCode}`}>
                        <PlayCircleOutlined className="text-green-500 text-lg cursor-pointer" />
                      </Link>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Mulai Penilaian">
                      <Link to={`/dashboard/penilaian/${course.courseCode}`}>
                        <StarOutlined className="text-blue-500 text-lg cursor-pointer" />
                      </Link>
                    </Tooltip>
                  )}
                  <a
                    href={`/dashboard/penilaian/${course.courseCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {course.courseName}
                  </a>{" "}
                  <Tag color="gray">{course.courseCode}</Tag>
                </div>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRecentCourse(
                      course.courseCode,
                      course.courseName
                    );
                  }}
                >
                  Hapus
                </Button>
              </div>
            );
          })}
          {recentCourses.length > (isMobile ? 3 : 5) && (
            <div className="text-center text-xs text-gray-500 pt-2">
              +{recentCourses.length - (isMobile ? 3 : 5)} mata kuliah lainnya
            </div>
          )}
        </div>
      </Card>
    );
  };

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
                    <Tag color="gray">{code}</Tag>
                    <Tag color="green">{data.sks || 0} SKS</Tag>
                    <Tag color="orange">Sem {data.semester || "N/A"}</Tag>
                  </div>
                  <Text className="text-xs text-gray-600 block">
                    {data.jenis || "Jenis tidak tersedia"}
                  </Text>
                  {data.prodi && <Tag color="purple">{data.prodi}</Tag>}
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
            className="!cursor-pointer hover:bg-gray-50 !px-4"
            onClick={() => handleCourseClick(code)}
          >
            <List.Item.Meta
              avatar={<BookOutlined className="text-blue-500 text-xl" />}
              title={
                <div className="flex items-center justify-between">
                  <span className="font-medium">{data.nama || code}</span>
                  <div className="flex gap-2">
                    <Tag color="gray">{code}</Tag>
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
        <div className="!space-y-4">
          <div className="text-center">
            <Text strong className="text-lg">
              {selectedCourseDetail.data.nama || selectedCourseDetail.code}
            </Text>
            <div className="flex justify-center gap-2 mt-2">
              <Tag color="gray">{selectedCourseDetail.code}</Tag>
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
        <div className="!space-y-4">
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
            <Popconfirm
              title="Hapus Data Penilaian"
              description="Apakah Anda yakin ingin menghapus semua data penilaian untuk mata kuliah [nama]?"
              okText="Ya, Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
              onConfirm={handleClearSelection}
            >
              <Button type="primary" ghost block={isMobile}>
                Ganti Mata Kuliah
              </Button>
            </Popconfirm>
          </div>
        </div>
      </Card>
    );
  }

  // Show search interface if no course is selected
  return (
    <>
      {/* Recent Courses Section */}
      <RecentCoursesSection />

      <Card
        title="Pilih Mata Kuliah"
        size="small"
        className={isMobile ? "mx-0" : ""}
      >
        <div className="!space-y-4">
          {/* Search Interface */}
          <div className={`${isMobile ? "!space-y-2" : "flex gap-2"}`}>
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
                    </div>
                  }
                />
              )}
            </>
          )}

          {/* Empty States */}

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
