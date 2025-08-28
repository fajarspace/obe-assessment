import React, { useMemo } from "react";
import { Card, Select, Row, Col, Typography, Alert } from "antd";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type {
  Student,
  AssessmentWeights,
  CurriculumData,
} from "@/types/interface";

const { Option } = Select;
const { Text } = Typography;

interface Props {
  students: Student[];
  assessmentWeights: AssessmentWeights;
  relatedCPL: string[];
  getRelatedCPMK: (cpl: string) => string[];
  getRelatedSubCPMK: (cpmk: string) => string[];
  curriculumData: CurriculumData | null;
  hasSubCPMKData: boolean;
  assessmentTypes: string[];
  selectedCourse: string;
}

export const CPMKRadarChart: React.FC<Props> = ({
  students,
  assessmentWeights,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
  curriculumData,
  hasSubCPMKData,
  assessmentTypes,
}) => {
  const [selectedStudent, setSelectedStudent] = React.useState<string>("all");

  const calculateCPMKScores = (student: Student): Record<string, number> => {
    const cpmkScores: Record<string, number> = {};

    relatedCPL.forEach((cpl) => {
      const relatedCPMK = getRelatedCPMK(cpl);

      relatedCPMK.forEach((cpmk) => {
        const relatedSubCPMK = getRelatedSubCPMK(cpmk);
        let totalWeightedScore = 0;
        let totalWeight = 0;

        if (hasSubCPMKData && relatedSubCPMK.length > 0) {
          relatedSubCPMK.forEach((subCpmk) => {
            assessmentTypes.forEach((assessmentType) => {
              const weight =
                assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                  assessmentType
                ] || 0;
              const assessmentScore = Number(student[assessmentType]) || 0;
              totalWeightedScore += (assessmentScore * weight) / 100;
              totalWeight += weight / 100;
            });
          });
        } else {
          assessmentTypes.forEach((assessmentType) => {
            const weight =
              assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
            const assessmentScore = Number(student[assessmentType]) || 0;
            totalWeightedScore += (assessmentScore * weight) / 100;
            totalWeight += weight / 100;
          });
        }

        if (totalWeight > 0) {
          cpmkScores[cpmk] =
            Math.round((totalWeightedScore / totalWeight) * 10) / 10;
        } else {
          const avgScore =
            assessmentTypes.reduce(
              (sum, type) => sum + (Number(student[type]) || 0),
              0
            ) / assessmentTypes.length;
          cpmkScores[cpmk] = Math.round(avgScore * 10) / 10;
        }
      });
    });

    return cpmkScores;
  };

  const calculateClassAverageCPMKScores = (): Record<string, number> => {
    const validStudents = students.filter((student) =>
      assessmentTypes.every((type) => (student[type] || 0) > 0)
    );

    if (validStudents.length === 0) return {};

    const cpmkAverages: Record<string, number> = {};
    const allCPMK: string[] = [];

    relatedCPL.forEach((cpl) => {
      allCPMK.push(...getRelatedCPMK(cpl));
    });

    allCPMK.forEach((cpmk) => {
      const scores = validStudents.map((student) => {
        const studentScores = calculateCPMKScores(student);
        return studentScores[cpmk] || 0;
      });

      const avgScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      cpmkAverages[cpmk] = Math.round(avgScore * 10) / 10;
    });

    return cpmkAverages;
  };

  const radarData = useMemo(() => {
    if (relatedCPL.length === 0) return [];

    let cpmkScores: Record<string, number>;

    if (selectedStudent === "all") {
      cpmkScores = calculateClassAverageCPMKScores();
    } else {
      const student = students.find((s) => s.key === selectedStudent);
      if (!student) return [];
      cpmkScores = calculateCPMKScores(student);
    }

    const data: any[] = [];

    relatedCPL.forEach((cpl) => {
      const relatedCPMK = getRelatedCPMK(cpl);
      relatedCPMK.forEach((cpmk) => {
        const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
        const score = cpmkScores[cpmk] || 0;

        data.push({
          cpmk: cpmkCode,
          score: score,
        });
      });
    });

    return data;
  }, [
    selectedStudent,
    students,
    assessmentWeights,
    relatedCPL,
    hasSubCPMKData,
    curriculumData,
  ]);

  const validStudents = students.filter((student) =>
    assessmentTypes.every((type) => (student[type] || 0) > 0)
  );

  if (relatedCPL.length === 0) {
    return (
      <Alert
        message="Tidak ada data CPL/CPMK"
        description="Pilih mata kuliah yang memiliki data CPL/CPMK"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Radar Chart CPMK">
        {/* Student Selection */}
        <div className="mb-6">
          <Text strong className="mr-3">
            Pilih Mahasiswa:
          </Text>
          <Select
            value={selectedStudent}
            onChange={setSelectedStudent}
            style={{ width: 250 }}
          >
            <Option value="all">
              Rata-rata Kelas ({validStudents.length})
            </Option>
            {validStudents.map((student) => (
              <Option key={student.key} value={student.key}>
                {student.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="cpmk" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name={selectedStudent === "all" ? "Rata-rata" : "Mahasiswa"}
              dataKey="score"
              stroke="#1890ff"
              fill="#1890ff"
              fillOpacity={0.3}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>

        {/* Score Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {radarData.map((item, index) => (
            <div key={index} className="p-3 border rounded bg-gray-50">
              <div className="font-semibold">{item.cpmk}</div>
              <div className="text-2xl font-bold text-blue-600">
                {item.score}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Assessment Breakdown for Individual Student */}
      {selectedStudent !== "all" && (
        <Card title="Detail Penilaian">
          <Row gutter={16}>
            {assessmentTypes.map((type) => {
              const student = students.find((s) => s.key === selectedStudent);
              return (
                <Col key={type} xs={12} md={6}>
                  <div className="text-center p-3 border rounded">
                    <div className="text-xl font-bold">
                      {student?.[type] || 0}
                    </div>
                    <div className="text-sm capitalize">{type}</div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}
    </div>
  );
};
