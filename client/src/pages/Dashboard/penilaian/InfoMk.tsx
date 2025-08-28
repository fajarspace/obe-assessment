// CourseDetailInfo.tsx
import React from "react";
import { Card, Typography, Row, Col, Button, Form, Select, Input } from "antd";
import { ToolOutlined, EditOutlined } from "@ant-design/icons";
import type { MataKuliah, CourseInfo } from "@/types/interface";

const { Text } = Typography;
const { Option } = Select;

interface Props {
  selectedCourse: string;
  selectedCourseData: MataKuliah | undefined;
  courseInfo: CourseInfo;
  setCourseInfo: (info: CourseInfo) => void;
  assessmentTypes: string[];
  assessmentComments: Record<string, string>;
  onAssessmentTypesModalOpen: () => void;
}

export const CourseDetailInfo: React.FC<Props> = ({
  selectedCourse,
  selectedCourseData,
  courseInfo,
  setCourseInfo,
  assessmentTypes,
  assessmentComments,
  onAssessmentTypesModalOpen,
}) => {
  const [form] = Form.useForm();
  const [editMode, setEditMode] = React.useState(false);

  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
    `${currentYear + 1}/${currentYear + 2}`,
  ];

  const semesters = [
    { value: 1, label: "Ganjil" },
    { value: 2, label: "Genap" },
    { value: 3, label: "Antara" },
  ];

  const classes = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  React.useEffect(() => {
    form.setFieldsValue({
      semester: courseInfo.semester,
      year: courseInfo.year,
      lecturer: courseInfo.lecturer,
      kelas: courseInfo.kelas,
    });
  }, [courseInfo, form]);

  const handleSave = () => {
    const values = form.getFieldsValue();
    setCourseInfo(values);
    setEditMode(false);
  };

  const handleCancel = () => {
    form.setFieldsValue({
      semester: courseInfo.semester,
      year: courseInfo.year,
      lecturer: courseInfo.lecturer,
      kelas: courseInfo.kelas,
    });
    setEditMode(false);
  };

  return (
    <Card title="Detail Matakuliah" className="mb-6">
      <div className="space-y-4">
        {/* Basic Info */}
        <Row gutter={16}>
          <Col span={6}>
            <Text strong>Nama:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">
              {selectedCourseData?.nama}
            </div>
          </Col>

          <Col span={6}>
            <Text strong>Kode:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">{selectedCourse}</div>
          </Col>

          <Col span={6}>
            <Text strong>Jenis:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">
              {selectedCourseData?.jenis}
            </div>
          </Col>

          <Col span={6}>
            <Text strong>Assessment:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">
              {assessmentTypes.join(", ") || "-"}
            </div>
            <Button
              size="small"
              icon={<ToolOutlined />}
              onClick={onAssessmentTypesModalOpen}
              className="mt-2"
            >
              Edit
            </Button>
          </Col>
        </Row>

        {/* Assessment Comments */}
        {Object.keys(assessmentComments).length > 0 && (
          <div className="space-y-2">
            {assessmentTypes.map((type) => {
              const comment = assessmentComments[type];
              if (!comment) return null;
              return (
                <div key={type} className="p-2 bg-blue-50 rounded text-sm">
                  <Text strong className="capitalize">
                    {type}:
                  </Text>{" "}
                  {comment}
                </div>
              );
            })}
          </div>
        )}

        {/* Class Info */}
        <Row gutter={16}>
          <Col span={6}>
            <Text strong>Semester:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">
              {courseInfo.semester} (
              {courseInfo.semester === 1
                ? "Ganjil"
                : courseInfo.semester === 2
                ? "Genap"
                : "Antara"}
              )
            </div>
          </Col>

          <Col span={6}>
            <Text strong>Tahun:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">{courseInfo.year}</div>
          </Col>

          <Col span={6}>
            <Text strong>Kelas:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">
              {courseInfo.kelas || "-"}
            </div>
          </Col>

          <Col span={6}>
            <Text strong>Dosen:</Text>
            <div className="mt-1 p-2 bg-gray-50 rounded">
              {courseInfo.lecturer || "Belum diset"}
            </div>
          </Col>
        </Row>

        {/* Edit Form */}
        {editMode && (
          <div className="p-4 bg-gray-50 rounded">
            <Form form={form} layout="inline">
              <Form.Item name="semester" label="Semester">
                <Select style={{ width: 120 }}>
                  {semesters.map((sem) => (
                    <Option key={sem.value} value={sem.value}>
                      {sem.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="year" label="Tahun">
                <Select style={{ width: 120 }}>
                  {academicYears.map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="kelas" label="Kelas">
                <Select style={{ width: 100 }}>
                  {classes.map((cls) => (
                    <Option key={cls} value={cls}>
                      {cls}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="lecturer" label="Dosen">
                <Input style={{ width: 150 }} />
              </Form.Item>

              <Form.Item>
                <Button type="primary" onClick={handleSave}>
                  Simpan
                </Button>
                <Button onClick={handleCancel} className="ml-2">
                  Batal
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}

        {/* Edit Button */}
        <div className="text-right">
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Tutup" : "Edit"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
