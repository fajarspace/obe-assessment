// components/EnhancedStudentsGradesTable.tsx - Fixed Class Average Calculations
import React from "react";
import {
  Table,
  Input,
  Tag,
  Card,
  Collapse,
  Row,
  Col,
  Typography,
  Grid,
} from "antd";
import type {
  Student,
  AssessmentWeights,
  CurriculumData,
} from "@/types/interface";
import { getPerformanceIndicator } from "./helper";

const { useBreakpoint } = Grid;
const { Panel } = Collapse;
const { Text, Title } = Typography;

interface Props {
  students: Student[];
  assessmentWeights: AssessmentWeights;
  relatedCPL: string[];
  getRelatedCPMK: (cpl: string) => string[];
  getRelatedSubCPMK: (cpmk: string) => string[];
  updateStudent: (
    key: string,
    field: keyof Student,
    value: string | number
  ) => void;
  calculateAverage: (field: string) => number;
  isGradeInputMode?: boolean;
  curriculumData: CurriculumData | null;
  hasSubCPMKData: boolean;
  assessmentTypes: string[];
  updateAssessmentScoreFromCPMK?: (
    studentKey: string,
    assessmentType: string
  ) => void;
}

export const EnhancedStudentsGradesTable: React.FC<Props> = ({
  students,
  assessmentWeights,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
  updateStudent,
  isGradeInputMode = true,
  curriculumData,
  hasSubCPMKData,
  assessmentTypes,
  updateAssessmentScoreFromCPMK,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Helper function to get performance indicator based on score (aligned with PerformanceIndicatorTable)
  const getPerformanceIndicatorLabel = (
    score: number
  ): { label: string; color: string; nilai: number } => {
    if (score >= 76.25) {
      return {
        label: "Sangat Menguasai",
        color: "text-green-700 bg-green-50",
        nilai: 4,
      };
    } else if (score >= 65) {
      return {
        label: "Menguasai",
        color: "text-blue-700 bg-blue-50",
        nilai: 3,
      };
    } else if (score >= 51.25) {
      return {
        label: "Cukup Menguasai",
        color: "text-yellow-700 bg-yellow-50",
        nilai: 2,
      };
    } else if (score >= 40) {
      return {
        label: "Kurang Menguasai",
        color: "text-orange-700 bg-orange-50",
        nilai: 1,
      };
    } else {
      return {
        label: "Tidak Menguasai",
        color: "text-red-700 bg-red-50",
        nilai: 0,
      };
    }
  };

  const hasAllScores = (student: Student) =>
    assessmentTypes.every((type) => {
      const score = student[type as keyof Student] as number;
      return score !== undefined && score !== null && score > 0;
    });

  const getAssessmentColor = (type: string): string => {
    const colors: Record<string, string> = {
      tugas: "bg-yellow-100",
      kuis: "bg-yellow-100",
      uts: "bg-yellow-100",
      uas: "bg-yellow-100",
      projek: "bg-sky-100",
      praktikum: "bg-green-100",
      presentasi: "bg-gray-100",
      quiz: "bg-orange-100",
      ujian: "bg-slate-100",
    };
    return colors[type.toLowerCase()] || "bg-yellow-100";
  };

  // Calculate field average with proper filtering
  const calculateFieldAverage = (field: string): number => {
    if (field === "nilaiAkhir") {
      // For final grades, only include students with complete assessment scores
      const studentsWithCompleteScores = students.filter(hasAllScores);
      if (studentsWithCompleteScores.length === 0) return 0;

      const total = studentsWithCompleteScores.reduce(
        (sum, student) => sum + (Number(student[field]) || 0),
        0
      );
      return Math.round((total / studentsWithCompleteScores.length) * 10) / 10;
    } else if (assessmentTypes.includes(field)) {
      // For assessment types, include all students who have a score > 0 for that field
      const studentsWithScore = students.filter((student) => {
        const score = Number(student[field]) || 0;
        return score > 0;
      });

      if (studentsWithScore.length === 0) return 0;

      const total = studentsWithScore.reduce(
        (sum, student) => sum + (Number(student[field]) || 0),
        0
      );
      return Math.round((total / studentsWithScore.length) * 10) / 10;
    }

    return 0;
  };

  // Mobile Student Card Component
  const MobileStudentCard = ({
    student,
    index,
  }: {
    student: Student;
    index: number;
  }) => {
    const isAverageRow = student.key === "average";

    return (
      <Card
        key={student.key}
        size="small"
        className={`mb-4 ${isAverageRow ? "bg-gray-50 border-gray-200" : ""}`}
        title={
          <div className="flex justify-between items-center">
            <div>
              <Text strong className={isAverageRow ? "text-gray-700" : ""}>
                {isAverageRow
                  ? "Rata-rata Kelas"
                  : `${index + 1}. ${student.name || "Nama Mahasiswa"}`}
              </Text>
              {!isAverageRow && (
                <div className="text-sm text-gray-500 mt-1">
                  NIM: {student.nim || "Belum diisi"}
                </div>
              )}
            </div>
            {hasAllScores(student) && !isAverageRow && (
              <div className="text-right">
                <div className="font-bold text-lg">{student.nilaiAkhir}</div>
                <Tag
                  color={
                    ["D", "D+", "E"].includes(student.nilaiMutu || "")
                      ? "red"
                      : ["C", "C+", "C-", "B-"].includes(
                          student.nilaiMutu || ""
                        )
                      ? "orange"
                      : "green"
                  }
                >
                  {student.nilaiMutu}
                </Tag>
              </div>
            )}
          </div>
        }
      >
        <Collapse size="small">
          {/* Basic Info Panel */}
          {!isAverageRow && (
            <Panel header="Info Mahasiswa" key="info">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div className="space-y-1">
                    <Text className="text-sm text-gray-600">NIM:</Text>
                    <Input
                      value={student.nim}
                      onChange={(e) =>
                        updateStudent(student.key, "nim", e.target.value)
                      }
                      size="small"
                      className="bg-yellow-300"
                      style={{ backgroundColor: "#fde047" }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div className="space-y-1">
                    <Text className="text-sm text-gray-600">Nama:</Text>
                    <Input
                      value={student.name}
                      onChange={(e) =>
                        updateStudent(student.key, "name", e.target.value)
                      }
                      size="small"
                      className="bg-yellow-300"
                      style={{ backgroundColor: "#fde047" }}
                    />
                  </div>
                </Col>
              </Row>
            </Panel>
          )}

          {/* Assessment Scores Panel */}
          <Panel
            header={`Nilai Assessment ${
              isGradeInputMode ? "(Input Mode)" : "(CPMK Mode)"
            }`}
            key="assessments"
          >
            <div className="space-y-3">
              {assessmentTypes.map((assessmentType) => {
                const assessmentPercentage = relatedCPL.reduce((total, cpl) => {
                  const relatedCPMK = getRelatedCPMK(cpl);
                  return (
                    total +
                    relatedCPMK.reduce((cpmkTotal, cpmk) => {
                      const relatedSubCPMK = getRelatedSubCPMK(cpmk);
                      if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                        return (
                          cpmkTotal +
                          relatedSubCPMK.reduce((subTotal, subCpmk) => {
                            return (
                              subTotal +
                              //@ts-ignore
                              (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                subCpmk
                              ]?.[assessmentType] || 0)
                            );
                          }, 0)
                        );
                      } else {
                        return (
                          cpmkTotal +
                          //@ts-ignore
                          (assessmentWeights[cpl]?.[cpmk]?.[assessmentType] ||
                            0)
                        );
                      }
                    }, 0)
                  );
                }, 0);

                return (
                  <div key={assessmentType} className="p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <Text strong className="text-sm">
                        {assessmentType.charAt(0).toUpperCase() +
                          assessmentType.slice(1)}
                      </Text>
                      <Tag color="gray">{assessmentPercentage}%</Tag>
                    </div>
                    <Input
                      type="number"
                      value={
                        (student[assessmentType as keyof Student] as number) ||
                        ""
                      }
                      onChange={(e) =>
                        updateStudent(
                          student.key,
                          assessmentType as keyof Student,
                          Number(e.target.value) || 0
                        )
                      }
                      min={0}
                      max={100}
                      size="small"
                      suffix="poin"
                      disabled={!isGradeInputMode}
                      className={
                        isGradeInputMode ? "bg-yellow-300" : "bg-gray-100"
                      }
                      style={{
                        backgroundColor: isGradeInputMode
                          ? "#fde047"
                          : "#f3f4f6",
                      }}
                      placeholder={isAverageRow ? "Rata-rata" : "0"}
                    />
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* CPMK Input Panel - For CPMK Input Mode */}
          {!isGradeInputMode && !isAverageRow && (
            <Panel header="Input Nilai CPMK" key="cpmk-input">
              <div className="space-y-4">
                {assessmentTypes.map((assessmentType) => (
                  <div key={assessmentType} className="p-3 bg-gray-50 rounded">
                    <Text strong className="block mb-3 text-blue-600">
                      {assessmentType.charAt(0).toUpperCase() +
                        assessmentType.slice(1)}
                    </Text>

                    {relatedCPL.map((cpl) => {
                      const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
                      const relatedCPMK = getRelatedCPMK(cpl);

                      return (
                        <div key={cpl} className="mb-4">
                          <Text className="block mb-2 text-sm font-medium">
                            CPL: {cplCode}
                          </Text>
                          <div className="space-y-2 ml-2">
                            {relatedCPMK.map((cpmk) => {
                              const cpmkCode =
                                curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
                              const relatedSubCPMK = getRelatedSubCPMK(cpmk);

                              if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                                // Sub-CPMK Mode
                                return relatedSubCPMK
                                  .map((subCpmk) => {
                                    const subCpmkCode =
                                      curriculumData?.subcpmk?.[subCpmk]
                                        ?.kode || subCpmk;
                                    const weight =
                                      //@ts-ignore
                                      assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                        subCpmk
                                      ]?.[assessmentType] || 0;

                                    if (weight === 0) return null;

                                    const currentPercentageValue =
                                      (student[
                                        `${cpl}_${cpmk}_${subCpmk}_${assessmentType}_percentage`
                                      ] as number) || 0;
                                    const actualScore =
                                      (currentPercentageValue * weight) / 100;
                                    const performanceIndicator =
                                      getPerformanceIndicatorLabel(
                                        currentPercentageValue
                                      );

                                    return (
                                      <div
                                        key={subCpmk}
                                        className="p-3 bg-white rounded border"
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <Text className="text-sm font-medium">
                                            {subCpmkCode}
                                          </Text>
                                          <Tag color="gray">{weight}%</Tag>
                                        </div>
                                        <Row gutter={8}>
                                          <Col span={12}>
                                            <div className="space-y-1">
                                              <Text className="text-sm text-gray-600">
                                                Input (0-100):
                                              </Text>
                                              <Input
                                                type="number"
                                                value={
                                                  currentPercentageValue || ""
                                                }
                                                onChange={(e) => {
                                                  const inputValue =
                                                    Number(e.target.value) || 0;
                                                  const clampedValue = Math.min(
                                                    100,
                                                    Math.max(0, inputValue)
                                                  );

                                                  updateStudent(
                                                    student.key,
                                                    `${cpl}_${cpmk}_${subCpmk}_${assessmentType}_percentage` as keyof Student,
                                                    clampedValue
                                                  );

                                                  const calculatedScore =
                                                    (clampedValue * weight) /
                                                    100;
                                                  updateStudent(
                                                    student.key,
                                                    `${cpl}_${cpmk}_${subCpmk}_${assessmentType}` as keyof Student,
                                                    calculatedScore
                                                  );

                                                  if (
                                                    updateAssessmentScoreFromCPMK
                                                  ) {
                                                    setTimeout(() => {
                                                      updateAssessmentScoreFromCPMK(
                                                        student.key,
                                                        assessmentType
                                                      );
                                                    }, 50);
                                                  }
                                                }}
                                                min={0}
                                                max={100}
                                                size="small"
                                                className="bg-yellow-300"
                                                style={{
                                                  backgroundColor: "#fde047",
                                                }}
                                                placeholder="0"
                                              />
                                            </div>
                                          </Col>
                                          <Col span={12}>
                                            <div className="space-y-1">
                                              <Text className="text-sm text-gray-600">
                                                Hasil:
                                              </Text>
                                              <div className="text-sm p-2 bg-gray-100 rounded text-center">
                                                {actualScore.toFixed(1)} poin
                                              </div>
                                            </div>
                                          </Col>
                                        </Row>
                                        {/* Performance Indicator Label */}
                                        {currentPercentageValue > 0 && (
                                          <div className="mt-3">
                                            <div className="text-sm text-gray-600 mb-1">
                                              <strong>
                                                Indikator Penguasaan Materi:
                                              </strong>
                                            </div>
                                            <div
                                              className={`text-sm p-2 rounded border ${performanceIndicator.color}`}
                                            >
                                              <div className="flex justify-between items-center">
                                                <span>
                                                  {performanceIndicator.label}
                                                </span>
                                                <Tag color="gray">
                                                  Nilai:{" "}
                                                  {performanceIndicator.nilai}
                                                </Tag>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                  .filter(Boolean);
                              } else {
                                // Direct CPMK Mode
                                const weight =
                                  //@ts-ignore
                                  assessmentWeights[cpl]?.[cpmk]?.[
                                    assessmentType
                                  ] || 0;
                                if (weight === 0) return null;

                                const currentPercentageValue =
                                  (student[
                                    `${cpl}_${cpmk}_${assessmentType}_percentage`
                                  ] as number) || 0;
                                const actualScore =
                                  (currentPercentageValue * weight) / 100;
                                const performanceIndicator =
                                  getPerformanceIndicatorLabel(
                                    currentPercentageValue
                                  );

                                return (
                                  <div
                                    key={cpmk}
                                    className="p-3 bg-white rounded border"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <Text className="text-sm font-medium">
                                        {cpmkCode}
                                      </Text>
                                      <Tag color="gray">{weight}%</Tag>
                                    </div>
                                    <Row gutter={8}>
                                      <Col span={12}>
                                        <div className="space-y-1">
                                          <Text className="text-sm text-gray-600">
                                            Input (0-100):
                                          </Text>
                                          <Input
                                            type="number"
                                            value={currentPercentageValue || ""}
                                            onChange={(e) => {
                                              const inputValue =
                                                Number(e.target.value) || 0;
                                              const clampedValue = Math.min(
                                                100,
                                                Math.max(0, inputValue)
                                              );

                                              updateStudent(
                                                student.key,
                                                `${cpl}_${cpmk}_${assessmentType}_percentage` as keyof Student,
                                                clampedValue
                                              );

                                              const calculatedScore =
                                                (clampedValue * weight) / 100;
                                              updateStudent(
                                                student.key,
                                                `${cpl}_${cpmk}_${assessmentType}` as keyof Student,
                                                calculatedScore
                                              );

                                              if (
                                                updateAssessmentScoreFromCPMK
                                              ) {
                                                setTimeout(() => {
                                                  updateAssessmentScoreFromCPMK(
                                                    student.key,
                                                    assessmentType
                                                  );
                                                }, 50);
                                              }
                                            }}
                                            min={0}
                                            max={100}
                                            size="small"
                                            className="bg-yellow-300"
                                            style={{
                                              backgroundColor: "#fde047",
                                            }}
                                            placeholder="0"
                                          />
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <div className="space-y-1">
                                          <Text className="text-sm text-gray-600">
                                            Hasil:
                                          </Text>
                                          <div className="text-sm p-2 bg-gray-100 rounded text-center">
                                            {actualScore.toFixed(1)} poin
                                          </div>
                                        </div>
                                      </Col>
                                    </Row>
                                    {/* Performance Indicator Label */}
                                    {currentPercentageValue > 0 && (
                                      <div className="mt-3">
                                        <div className="text-sm text-gray-600 mb-1">
                                          <strong>
                                            Indikator Penguasaan Materi:
                                          </strong>
                                        </div>
                                        <div
                                          className={`text-sm p-2 rounded border ${performanceIndicator.color}`}
                                        >
                                          <div className="flex justify-between items-center">
                                            <span>
                                              {performanceIndicator.label}
                                            </span>
                                            <Tag color="default">
                                              Nilai:{" "}
                                              {performanceIndicator.nilai}
                                            </Tag>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* CPMK Scores Panel - For Grade Input Mode */}
          {isGradeInputMode && (
            <Panel header="Nilai CPMK (Calculated)" key="cpmk">
              <div className="space-y-4">
                {relatedCPL.map((cpl) => {
                  const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
                  const relatedCPMK = getRelatedCPMK(cpl);

                  return (
                    <div key={cpl}>
                      <Text strong className="block mb-2 text-sm text-blue-600">
                        CPL: {cplCode}
                      </Text>
                      <div className="space-y-2 ml-2">
                        {relatedCPMK.map((cpmk) => {
                          const cpmkCode =
                            curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
                          let totalCpmkWeight = 0;
                          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

                          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                            relatedSubCPMK.forEach((subCpmk) => {
                              assessmentTypes.forEach((type) => {
                                totalCpmkWeight +=
                                  //@ts-ignore
                                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                    subCpmk
                                  ]?.[type] || 0;
                              });
                            });
                          } else {
                            assessmentTypes.forEach((type) => {
                              totalCpmkWeight +=
                                //@ts-ignore
                                assessmentWeights[cpl]?.[cpmk]?.[type] || 0;
                            });
                          }

                          if (totalCpmkWeight > 0) {
                            // Calculate final CPMK score
                            let totalWeightedScore = 0;
                            let totalWeight = 0;

                            if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                              relatedSubCPMK.forEach((subCpmk) => {
                                assessmentTypes.forEach((assessmentType) => {
                                  const weight =
                                    //@ts-ignore
                                    assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                      subCpmk
                                    ]?.[assessmentType] || 0;
                                  if (weight > 0) {
                                    const assessmentScore =
                                      Number(student[assessmentType]) || 0;
                                    totalWeightedScore +=
                                      (assessmentScore * weight) / 100;
                                    totalWeight += weight / 100;
                                  }
                                });
                              });
                            } else {
                              assessmentTypes.forEach((assessmentType) => {
                                const weight =
                                  //@ts-ignore
                                  assessmentWeights[cpl]?.[cpmk]?.[
                                    assessmentType
                                  ] || 0;
                                if (weight > 0) {
                                  const assessmentScore =
                                    Number(student[assessmentType]) || 0;
                                  totalWeightedScore +=
                                    (assessmentScore * weight) / 100;
                                  totalWeight += weight / 100;
                                }
                              });
                            }

                            const finalScore =
                              totalWeight > 0
                                ? totalWeightedScore / totalWeight
                                : 0;

                            return (
                              <div
                                key={cpmk}
                                className="flex justify-between items-center p-2 bg-white rounded border"
                              >
                                <div>
                                  <Text className="text-sm">{cpmkCode}</Text>
                                  <div className="text-sm text-gray-500">
                                    {totalCpmkWeight}%
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-sm">
                                    {Math.round(finalScore * 10) / 10}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    poin
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Final Results Panel */}
          {hasAllScores(student) && (
            <Panel header="Hasil Akhir" key="results">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <Text strong>Nilai Akhir:</Text>
                  <Text strong className="text-lg">
                    {student.nilaiAkhir}
                  </Text>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <Text strong>Nilai Mutu:</Text>
                  <Tag
                    color={
                      ["D", "D+", "E"].includes(student.nilaiMutu || "")
                        ? "red"
                        : ["C", "C+", "C-", "B-"].includes(
                            student.nilaiMutu || ""
                          )
                        ? "orange"
                        : "green"
                    }
                  >
                    {student.nilaiMutu}
                  </Tag>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <Text strong>Indikator:</Text>
                  <Text>
                    {
                      getPerformanceIndicator(student.nilaiAkhir || 0)
                        .description
                    }
                  </Text>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <Text strong>Status:</Text>
                  <Tag color={student.kelulusan === "Lulus" ? "green" : "red"}>
                    {student.kelulusan === "Lulus" ? "Lulus" : "Tidak Lulus"}
                  </Tag>
                </div>
              </div>
            </Panel>
          )}
        </Collapse>
      </Card>
    );
  };

  const buildColumns = () => {
    const columns = [
      {
        title: "No",
        dataIndex: "no",
        key: "no",
        width: isMobile ? 30 : 40,
        className: "text-center text-sm",
        render: (value: number) => value || "",
      },
      {
        title: "NIM",
        dataIndex: "nim",
        key: "nim",
        width: isMobile ? 70 : 90,
        className: "text-sm",
        render: (value: string, record: Student) => {
          if (record.key === "average") {
            return (
              <div className="text-center font-semibold text-sm">{value}</div>
            );
          }
          return (
            <Input
              value={value}
              onChange={(e) => updateStudent(record.key, "nim", e.target.value)}
              size="small"
              className="text-sm h-6 bg-yellow-300"
              style={{ backgroundColor: "#fde047" }}
            />
          );
        },
      },
      {
        title: "Nama",
        dataIndex: "name",
        key: "name",
        width: isMobile ? 120 : 150,
        className: "text-sm",
        render: (value: string, record: Student) => {
          if (record.key === "average") {
            return (
              <div className="text-center font-semibold text-sm">{value}</div>
            );
          }
          return (
            <Input
              value={value}
              onChange={(e) =>
                updateStudent(record.key, "name", e.target.value)
              }
              size="small"
              className="text-sm h-6 bg-yellow-300"
              style={{ backgroundColor: "#fde047" }}
            />
          );
        },
      },
    ];

    // Input Nilai columns - Dynamic based on assessmentTypes
    const inputColumns = assessmentTypes.map((type) => ({
      key: type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      color: getAssessmentColor(type),
    }));

    // Calculate total percentage for INPUT NILAI section
    const totalInputPercentage = assessmentTypes.reduce((total, type) => {
      return (
        total +
        relatedCPL.reduce((cplTotal, cpl) => {
          const relatedCPMK = getRelatedCPMK(cpl);
          return (
            cplTotal +
            relatedCPMK.reduce((cpmkTotal, cpmk) => {
              const relatedSubCPMK = getRelatedSubCPMK(cpmk);
              if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                return (
                  cpmkTotal +
                  relatedSubCPMK.reduce((subTotal, subCpmk) => {
                    return (
                      subTotal +
                      //@ts-ignore
                      (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                        type
                      ] || 0)
                    );
                  }, 0)
                );
              } else {
                return (
                  //@ts-ignore
                  cpmkTotal + (assessmentWeights[cpl]?.[cpmk]?.[type] || 0)
                );
              }
            }, 0)
          );
        }, 0)
      );
    }, 0);

    columns.push({
      title: (
        <div className="text-center">
          <div className={`font-semibold ${isMobile ? "text-sm" : "text-sm"}`}>
            INPUT NILAI
          </div>
          <div
            className={`font-normal mt-1 ${isMobile ? "text-sm" : "text-sm"}`}
          >
            ({totalInputPercentage}%)
          </div>
        </div>
      ),
      className: "text-sm font-semibold",
      children: inputColumns.map((col) => {
        // Calculate percentage for this specific assessment type
        const assessmentPercentage = relatedCPL.reduce((total, cpl) => {
          const relatedCPMK = getRelatedCPMK(cpl);
          return (
            total +
            relatedCPMK.reduce((cpmkTotal, cpmk) => {
              const relatedSubCPMK = getRelatedSubCPMK(cpmk);
              if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                return (
                  cpmkTotal +
                  relatedSubCPMK.reduce((subTotal, subCpmk) => {
                    return (
                      subTotal +
                      //@ts-ignore
                      (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                        col.key
                      ] || 0)
                    );
                  }, 0)
                );
              } else {
                return (
                  //@ts-ignore
                  cpmkTotal + (assessmentWeights[cpl]?.[cpmk]?.[col.key] || 0)
                );
              }
            }, 0)
          );
        }, 0);

        return {
          title: (
            <div className="text-center">
              <div className={isMobile ? "text-sm" : ""}>{col.title}</div>
              <div
                className={`font-normal mt-1 ${
                  isMobile ? "text-sm" : "text-sm"
                }`}
              >
                ({assessmentPercentage}%)
              </div>
            </div>
          ),
          dataIndex: col.key,
          key: col.key,
          width: isMobile ? 50 : 60,
          className: "text-center text-sm",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (value: number, record: Student) => {
            if (record.key === "average") {
              return (
                <div className="text-center font-semibold text-sm py-1 bg-gray-100 rounded">
                  {calculateFieldAverage(col.key)}
                </div>
              );
            }

            if (isGradeInputMode) {
              return (
                //input nilai
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => {
                    let val = Number(e.target.value);

                    if (val > 100) val = 100; // batas max
                    if (val < 0) val = 0; // batas min

                    updateStudent(record.key, col.key as keyof Student, val);
                  }}
                  min={0}
                  max={100}
                  size="small"
                  className="text-center text-sm h-6 bg-yellow-300 border-yellow-400"
                  style={{ backgroundColor: "#fde047" }}
                />
              );
            } else {
              return (
                <div className="text-center text-sm py-1 bg-gray-100 border rounded">
                  {value}
                </div>
              );
            }
          },
        };
      }),
    } as any);

    // CPMK Final Scores Section - Show final CPMK scores grouped by CPL with Performance Indicators
    if (relatedCPL.length > 0 && isGradeInputMode) {
      const cplGroups: any[] = [];

      relatedCPL.forEach((cpl) => {
        const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
        const relatedCPMK = getRelatedCPMK(cpl);
        const cpmkColumns: any[] = [];

        relatedCPMK.forEach((cpmk) => {
          const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          // Calculate total weight for this CPMK across all assessment types
          let totalCpmkWeight = 0;
          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            relatedSubCPMK.forEach((subCpmk) => {
              assessmentTypes.forEach((type) => {
                totalCpmkWeight +=
                  //@ts-ignore
                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[type] ||
                  0;
              });
            });
          } else {
            assessmentTypes.forEach((type) => {
              //@ts-ignore
              totalCpmkWeight += assessmentWeights[cpl]?.[cpmk]?.[type] || 0;
            });
          }

          // Only show CPMK if it has non-zero total weight
          if (totalCpmkWeight > 0) {
            cpmkColumns.push({
              title: (
                <div className="text-center">
                  <div
                    className={`font-semibold mb-1 ${
                      isMobile ? "text-sm" : "text-sm"
                    }`}
                  >
                    {cpmkCode}
                  </div>
                  <div className={`${isMobile ? "text-sm" : "text-sm"} px-1`}>
                    {totalCpmkWeight}%
                  </div>
                </div>
              ),
              dataIndex: `final_cpmk_${cpl}_${cpmk}`,
              key: `final_cpmk_${cpl}_${cpmk}`,
              width: isMobile ? 120 : 150, // Increased width to accommodate performance indicators
              className: "text-center text-sm",
              onHeaderCell: () => ({
                style: { textAlign: "center" },
              }),
              render: (_: any, record: Student) => {
                if (record.key === "average") {
                  // Calculate average CPMK score for the class - only include students with complete assessment scores
                  const studentsWithCompleteScores =
                    students.filter(hasAllScores);
                  if (studentsWithCompleteScores.length === 0) {
                    return (
                      <div className="text-center font-semibold text-sm py-2 bg-gray-100 rounded">
                        0
                      </div>
                    );
                  }

                  // Calculate average on 0-100 scale (percentage-based)
                  let totalPercentageScore = 0;
                  let totalWeight = 0;

                  studentsWithCompleteScores.forEach((student) => {
                    if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                      relatedSubCPMK.forEach((subCpmk) => {
                        assessmentTypes.forEach((assessmentType) => {
                          const weight =
                            //@ts-ignore
                            assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                              subCpmk
                            ]?.[assessmentType] || 0;
                          if (weight > 0) {
                            const assessmentScore =
                              Number(student[assessmentType]) || 0;
                            // Add to percentage calculation (assessment score is already 0-100)
                            totalPercentageScore += assessmentScore * weight;
                            totalWeight += weight;
                          }
                        });
                      });
                    } else {
                      assessmentTypes.forEach((assessmentType) => {
                        const weight =
                          //@ts-ignore
                          assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
                        if (weight > 0) {
                          const assessmentScore =
                            Number(student[assessmentType]) || 0;
                          // Add to percentage calculation (assessment score is already 0-100)
                          totalPercentageScore += assessmentScore * weight;
                          totalWeight += weight;
                        }
                      });
                    }
                  });

                  // Calculate average percentage (0-100 scale)
                  const averagePercentage =
                    totalWeight > 0 ? totalPercentageScore / totalWeight : 0;

                  // Get performance indicator for average
                  const performanceIndicator =
                    getPerformanceIndicatorLabel(averagePercentage);

                  return (
                    <div className="text-center">
                      <div className="font-semibold text-sm py-2 bg-gray-100 rounded mb-2">
                        {Math.round(averagePercentage * 10) / 10}
                      </div>
                      {/* Performance Indicator for Average */}
                      {averagePercentage > 0 && (
                        <div className="text-sm">
                          <div
                            className={`px-1 py-1 rounded text-sm ${performanceIndicator.color}`}
                          >
                            {performanceIndicator.label}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Calculate final CPMK score on 0-100 percentage scale
                let totalPercentageScore = 0;
                let totalWeight = 0;

                if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                  relatedSubCPMK.forEach((subCpmk) => {
                    assessmentTypes.forEach((assessmentType) => {
                      const weight =
                        //@ts-ignore
                        assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                          assessmentType
                        ] || 0;
                      if (weight > 0) {
                        const assessmentScore =
                          Number(record[assessmentType]) || 0;
                        // Calculate percentage: assessment score (0-100) * weight
                        totalPercentageScore += assessmentScore * weight;
                        totalWeight += weight;
                      }
                    });
                  });
                } else {
                  assessmentTypes.forEach((assessmentType) => {
                    const weight =
                      //@ts-ignore
                      assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
                    if (weight > 0) {
                      const assessmentScore =
                        Number(record[assessmentType]) || 0;
                      // Calculate percentage: assessment score (0-100) * weight
                      totalPercentageScore += assessmentScore * weight;
                      totalWeight += weight;
                    }
                  });
                }

                // Final percentage score (0-100 scale)
                const finalPercentageScore =
                  totalWeight > 0 ? totalPercentageScore / totalWeight : 0;

                // Get performance indicator
                const performanceIndicator =
                  getPerformanceIndicatorLabel(finalPercentageScore);

                return (
                  <div className="text-center space-y-2">
                    <div className="text-sm py-2 bg-gray-100 border rounded font-medium">
                      {Math.round(finalPercentageScore * 10) / 10}
                    </div>
                    {/* Performance Indicator Display */}
                    {finalPercentageScore > 0 && (
                      <div className="text-sm">
                        <div
                          className={`px-2 py-1 rounded text-sm border ${performanceIndicator.color}`}
                        >
                          {performanceIndicator.label}
                        </div>
                      </div>
                    )}
                  </div>
                );
              },
            });
          }
        });

        // Add CPL group if it has any CPMK
        if (cpmkColumns.length > 0) {
          cplGroups.push({
            title: (
              <div
                className={`text-center font-semibold rounded ${
                  isMobile ? "text-sm" : ""
                }`}
              >
                {cplCode}
              </div>
            ),
            children: cpmkColumns,
            key: `final_cpl_${cpl}`,
          });
        }
      });

      // Add CPMK section if there are any CPL groups
      if (cplGroups.length > 0) {
        columns.push({
          title: (
            <div
              className={`text-center font-bold p-2 rounded ${
                isMobile ? "text-sm" : "text-base"
              }`}
            >
              DATA NILAI BERDASARKAN CPMK
            </div>
          ),
          children: cplGroups,
          key: "final_cpmk_section",
        } as any);
      }
    }

    // Detailed Assessment Type based structure (for CPMK input mode only)
    if (!isGradeInputMode) {
      assessmentTypes.forEach((assessmentType) => {
        // Create CPL level groups first
        const cplGroups: any[] = [];

        relatedCPL.forEach((cpl) => {
          const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
          const relatedCPMK = getRelatedCPMK(cpl);
          const cpmkColumns: any[] = [];

          relatedCPMK.forEach((cpmk) => {
            const relatedSubCPMK = getRelatedSubCPMK(cpmk);
            const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;

            if (hasSubCPMKData && relatedSubCPMK.length > 0) {
              // Filter Sub-CPMK with non-zero weights for THIS SPECIFIC assessment type
              const filteredSubCPMK = relatedSubCPMK.filter((subCpmk) => {
                const weight =
                  //@ts-ignore
                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                    assessmentType
                  ] || 0;
                return weight > 0;
              });

              if (filteredSubCPMK.length > 0) {
                const subCpmkColumns: any[] = filteredSubCPMK.map((subCpmk) => {
                  const subCpmkCode =
                    curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
                  const weight =
                    //@ts-ignore
                    assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                      assessmentType
                    ] || 0;

                  return {
                    title: (
                      <div className="text-center">
                        <div
                          className={`font-semibold mb-1 ${
                            isMobile ? "text-sm" : "text-sm"
                          }`}
                        >
                          {subCpmkCode}
                        </div>
                        <div
                          className={`px-1 rounded font-medium bg-gray-100 ${
                            isMobile ? "text-sm" : "text-sm"
                          }`}
                        >
                          {weight}%
                        </div>
                      </div>
                    ),
                    dataIndex: `${cpl}_${cpmk}_${subCpmk}_${assessmentType}`,
                    key: `${cpl}_${cpmk}_${subCpmk}_${assessmentType}`,
                    width: isMobile ? 80 : 120,
                    className: "text-center text-sm",
                    onHeaderCell: () => ({
                      style: { textAlign: "center" },
                    }),
                    render: (_: any, record: Student) => {
                      if (record.key === "average") {
                        // Calculate average for CPMK input mode - use students with complete scores
                        const studentsWithScores =
                          students.filter(hasAllScores);
                        if (studentsWithScores.length === 0) {
                          return (
                            <div className="text-center font-semibold text-sm py-1 bg-gray-100">
                              0
                            </div>
                          );
                        }

                        // Calculate average percentage input for CPMK input mode
                        const validStudents = students.filter(hasAllScores);
                        if (validStudents.length === 0) {
                          return (
                            <div className="text-center font-semibold text-sm py-1 bg-gray-100">
                              0
                            </div>
                          );
                        }

                        let totalPercentageInputs = 0;
                        validStudents.forEach((student) => {
                          // Get the percentage input value (0-100 scale)
                          const percentageInput =
                            (student[
                              `${cpl}_${cpmk}_${subCpmk}_${assessmentType}_percentage`
                            ] as number) || 0;
                          totalPercentageInputs += percentageInput;
                        });

                        const averagePercentageInput =
                          totalPercentageInputs / validStudents.length;
                        return (
                          <div className="text-center font-semibold text-sm py-1 bg-gray-100">
                            {Math.round(averagePercentageInput * 10) / 10}
                          </div>
                        );
                      }

                      // For CPMK input mode - scale 1-100 input
                      const currentPercentageValue =
                        (record[
                          `${cpl}_${cpmk}_${subCpmk}_${assessmentType}_percentage`
                        ] as number) || 0;
                      const actualScore =
                        (currentPercentageValue * weight) / 100;
                      const performanceIndicator = getPerformanceIndicatorLabel(
                        currentPercentageValue
                      );

                      return (
                        <div className="space-y-1">
                          <Input
                            type="number"
                            value={currentPercentageValue || ""}
                            onChange={(e) => {
                              const inputValue = Number(e.target.value) || 0;
                              const clampedValue = Math.min(
                                100,
                                Math.max(0, inputValue)
                              );

                              // Store the 1-100 scale value
                              updateStudent(
                                record.key,
                                `${cpl}_${cpmk}_${subCpmk}_${assessmentType}_percentage` as keyof Student,
                                clampedValue
                              );

                              // Calculate and store actual score based on weight
                              const calculatedScore =
                                (clampedValue * weight) / 100;
                              updateStudent(
                                record.key,
                                `${cpl}_${cpmk}_${subCpmk}_${assessmentType}` as keyof Student,
                                calculatedScore
                              );

                              // Update assessment type score based on CPMK scores
                              if (updateAssessmentScoreFromCPMK) {
                                setTimeout(() => {
                                  updateAssessmentScoreFromCPMK(
                                    record.key,
                                    assessmentType
                                  );
                                }, 50);
                              }
                            }}
                            min={0}
                            max={100}
                            size="small"
                            className="text-center text-sm h-5 bg-yellow-300 border-yellow-400"
                            style={{ backgroundColor: "#fde047" }}
                            placeholder="0"
                          />
                          <div className="text-sm text-gray-500 text-center">
                            {actualScore.toFixed(1)}
                          </div>
                          {/* Performance Indicator for Desktop Table */}
                          {currentPercentageValue > 0 && (
                            <div className="text-sm text-center">
                              <div
                                className={`px-1 py-1 rounded text-sm ${performanceIndicator.color}`}
                              >
                                {performanceIndicator.label}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    },
                  };
                });

                // Add CPMK header with filtered Sub-CPMK children
                cpmkColumns.push({
                  title: (
                    <div className="text-center">
                      <div
                        className={`font-semibold mb-1 ${
                          isMobile ? "text-sm" : "text-sm"
                        }`}
                      >
                        {cpmkCode}
                      </div>
                    </div>
                  ),
                  children: subCpmkColumns,
                  key: `cpmk_${cpmk}`,
                });
              }
            } else {
              // Direct CPMK column (no Sub-CPMK) - only if has non-zero weight for THIS assessment type
              const weight =
                //@ts-ignore
                assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
              if (weight > 0) {
                cpmkColumns.push({
                  title: (
                    <div className="text-center">
                      <div
                        className={`font-semibold mb-1 ${
                          isMobile ? "text-sm" : "text-sm"
                        }`}
                      >
                        {cpmkCode}
                      </div>
                      <div
                        className={`px-1 rounded font-medium bg-gray-100 ${
                          isMobile ? "text-sm" : "text-sm"
                        }`}
                      >
                        {weight}%
                      </div>
                    </div>
                  ),
                  dataIndex: `${cpl}_${cpmk}_${assessmentType}`,
                  key: `${cpl}_${cpmk}_${assessmentType}`,
                  width: isMobile ? 90 : 120,
                  className: "text-center text-sm",
                  onHeaderCell: () => ({
                    style: { textAlign: "center" },
                  }),
                  render: (_: any, record: Student) => {
                    if (record.key === "average") {
                      // Calculate average for direct CPMK mode - use students with complete scores
                      const studentsWithScores = students.filter(hasAllScores);
                      if (studentsWithScores.length === 0) {
                        return (
                          <div className="text-center font-semibold text-sm py-1 bg-gray-100">
                            0
                          </div>
                        );
                      }

                      // Calculate average percentage input for direct CPMK mode
                      const activeStudents = students.filter(hasAllScores);
                      if (activeStudents.length === 0) {
                        return (
                          <div className="text-center font-semibold text-sm py-1 bg-gray-100">
                            0
                          </div>
                        );
                      }

                      let totalPercentageInputs = 0;
                      activeStudents.forEach((student) => {
                        // Get the percentage input value (0-100 scale)
                        const percentageInput =
                          (student[
                            `${cpl}_${cpmk}_${assessmentType}_percentage`
                          ] as number) || 0;
                        totalPercentageInputs += percentageInput;
                      });

                      const averagePercentageInput =
                        totalPercentageInputs / activeStudents.length;
                      return (
                        <div className="text-center font-semibold text-sm py-1 bg-gray-100">
                          {Math.round(averagePercentageInput * 10) / 10}
                        </div>
                      );
                    }

                    // For CPMK input mode - scale 1-100 input
                    const currentPercentageValue =
                      (record[
                        `${cpl}_${cpmk}_${assessmentType}_percentage`
                      ] as number) || 0;
                    const actualScore = (currentPercentageValue * weight) / 100;
                    const performanceIndicator = getPerformanceIndicatorLabel(
                      currentPercentageValue
                    );

                    return (
                      <div className="space-y-1">
                        <Input
                          type="number"
                          value={currentPercentageValue || ""}
                          onChange={(e) => {
                            const inputValue = Number(e.target.value) || 0;
                            const clampedValue = Math.min(
                              100,
                              Math.max(0, inputValue)
                            );

                            // Store the 1-100 scale value
                            updateStudent(
                              record.key,
                              `${cpl}_${cpmk}_${assessmentType}_percentage` as keyof Student,
                              clampedValue
                            );

                            // Calculate and store actual score based on weight
                            const calculatedScore =
                              (clampedValue * weight) / 100;
                            updateStudent(
                              record.key,
                              `${cpl}_${cpmk}_${assessmentType}` as keyof Student,
                              calculatedScore
                            );

                            // Update assessment type score based on CPMK scores
                            if (updateAssessmentScoreFromCPMK) {
                              setTimeout(() => {
                                updateAssessmentScoreFromCPMK(
                                  record.key,
                                  assessmentType
                                );
                              }, 50);
                            }
                          }}
                          min={0}
                          max={100}
                          size="small"
                          className="text-center text-sm h-5 bg-yellow-300 border-yellow-400"
                          style={{ backgroundColor: "#fde047" }}
                          placeholder="0"
                        />
                        <div className="text-sm text-gray-500 text-center">
                          {actualScore.toFixed(1)}
                          {/* pts ({currentPercentageValue}
                          %) */}
                        </div>
                        {/* Performance Indicator for Desktop Table */}
                        {currentPercentageValue > 0 && (
                          <div className="text-sm text-center">
                            <div className="text-gray-600 mb-1">
                              <strong>Indikator:</strong>
                            </div>
                            <div
                              className={`px-1 py-1 rounded text-sm ${performanceIndicator.color}`}
                            >
                              {performanceIndicator.label}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  },
                });
              }
            }
          });

          // Add CPL group if it has any CPMK with non-zero weights
          if (cpmkColumns.length > 0) {
            cplGroups.push({
              title: (
                <div
                  className={`text-center font-semibold p-1 rounded ${
                    isMobile ? "text-sm" : "text-sm"
                  }`}
                >
                  {cplCode}
                </div>
              ),
              children: cpmkColumns,
              key: `cpl_${cpl}_${assessmentType}`,
            });
          }
        });

        // Only add assessment type column if there are any CPL groups
        if (cplGroups.length > 0) {
          const totalAssessmentWeight = relatedCPL.reduce((total, cpl) => {
            const relatedCPMK = getRelatedCPMK(cpl);
            return (
              total +
              relatedCPMK.reduce((cpmkTotal, cpmk) => {
                const relatedSubCPMK = getRelatedSubCPMK(cpmk);
                if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                  return (
                    cpmkTotal +
                    relatedSubCPMK.reduce((subTotal, subCpmk) => {
                      return (
                        subTotal +
                        //@ts-ignore
                        (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                          assessmentType
                        ] || 0)
                      );
                    }, 0)
                  );
                } else {
                  return (
                    cpmkTotal +
                    //@ts-ignore
                    (assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0)
                  );
                }
              }, 0)
            );
          }, 0);

          columns.push({
            title: (
              <div
                className={`text-center font-bold ${
                  isMobile ? "text-sm" : "text-sm"
                }`}
              >
                <div>{assessmentType.toUpperCase()}</div>
                <div
                  className={`font-normal mt-1 ${
                    isMobile ? "text-sm" : "text-sm"
                  }`}
                >
                  ({totalAssessmentWeight}%)
                </div>
              </div>
            ),
            children: cplGroups,
            key: `assessment_${assessmentType}`,
          } as any);
        }
      });
    }

    // Final result columns
    columns.push({
      title: "HASIL AKHIR",
      className: "text-sm font-semibold",
      children: [
        {
          title: "Nilai",
          dataIndex: "nilaiAkhir",
          key: "nilaiAkhir",
          width: isMobile ? 50 : 70,
          className: "text-center text-sm",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (value: number, record: Student) => {
            if (record.key === "average") {
              return (
                <div className="text-center font-semibold text-sm py-1 bg-gray-100 rounded">
                  {calculateFieldAverage("nilaiAkhir")}
                </div>
              );
            }

            if (hasAllScores(record)) {
              return (
                <div className="text-center space-y-1">
                  <div className="font-semibold text-sm">{value}</div>
                </div>
              );
            } else {
              return <div className="text-center text-gray-400 text-sm">-</div>;
            }
          },
        },
        {
          title: "Label",
          dataIndex: "nilaiAkhir",
          key: "nilaiAkhir",
          width: isMobile ? 50 : 70,
          className: "text-center text-sm",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          //@ts-ignore
          render: (value: number, record: Student) => {
            if (record.key === "average") {
              return (
                <div className="text-center font-semibold text-sm py-1 bg-gray-100 rounded">
                  {calculateFieldAverage("nilaiAkhir")}
                </div>
              );
            }

            if (hasAllScores(record)) {
              return (
                <div className="text-center space-y-1">
                  <Tag
                    color={
                      ["D", "D+", "E"].includes(record.nilaiMutu || "")
                        ? "red"
                        : ["C", "C+", "C-", "B-"].includes(
                            record.nilaiMutu || ""
                          )
                        ? "orange"
                        : "green"
                    }
                    className="text-sm"
                  >
                    {record.nilaiMutu}
                  </Tag>
                </div>
              );
            } else {
              return <div className="text-center text-gray-400 text-sm">-</div>;
            }
          },
        },
        {
          title: "Indikator",
          dataIndex: "indikator",
          key: "indikator",
          width: isMobile ? 100 : 130, // Increased width to accommodate colored indicators
          className: "text-center text-sm",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          //@ts-ignore
          render: (value: any, record: Student) => {
            if (record.key === "average") {
              const averageNilai = calculateFieldAverage("nilaiAkhir");
              if (averageNilai > 0) {
                const indicator = getPerformanceIndicator(averageNilai);
                const performanceIndicatorLabel =
                  getPerformanceIndicatorLabel(averageNilai);

                return (
                  <div className="text-center space-y-1">
                    <div
                      className={`text-sm px-2 py-1 rounded border ${performanceIndicatorLabel.color}`}
                    >
                      {indicator.description}
                    </div>
                  </div>
                );
              }
              return <div className="text-center text-sm text-gray-500">-</div>;
            }

            if (hasAllScores(record) && record.nilaiAkhir !== undefined) {
              const indicator = getPerformanceIndicator(record.nilaiAkhir);
              const performanceIndicatorLabel = getPerformanceIndicatorLabel(
                record.nilaiAkhir
              );

              return (
                <div className="text-center space-y-1">
                  <div
                    className={`text-sm px-2 py-1 rounded border ${performanceIndicatorLabel.color}`}
                  >
                    {indicator.description}
                  </div>
                </div>
              );
            } else {
              return <div className="text-center text-gray-400 text-sm">-</div>;
            }
          },
        },
        // {
        //   title: "Lulus",
        //   dataIndex: "kelulusan",
        //   key: "kelulusan",
        //   width: isMobile ? 40 : 60,
        //   className: "text-center text-sm",
        //   onHeaderCell: () => ({
        //     style: { textAlign: "center" },
        //   }),
        //   render: (value: string, record: Student) => {
        //     if (record.key === "average") {
        //       return (
        //         <div className="text-center font-semibold text-sm py-1 bg-gray-100 rounded">
        //           Avg
        //         </div>
        //       );
        //     }

        //     if (hasAllScores(record)) {
        //       return (
        //         <Tag
        //           color={value === "Lulus" ? "green" : "red"}
        //           className="text-sm"
        //         >
        //           {value === "Lulus" ? "✓" : "✗"}
        //         </Tag>
        //       );
        //     } else {
        //       return <div className="text-center text-gray-400 text-sm">-</div>;
        //     }
        //   },
        // },
      ],
    } as any);

    return columns;
  };

  const dataWithAverage = () => {
    const averageRow: Student = {
      key: "average",
      no: 0,
      nim: "",
      name: "Rata-rata Kelas",
      nilaiAkhir: calculateFieldAverage("nilaiAkhir"),
      nilaiMutu: "-",
      kelulusan: "-",
    } as Student;

    // Add dynamic assessment type averages
    assessmentTypes.forEach((type) => {
      averageRow[type] = calculateFieldAverage(type);
    });

    return [...students, averageRow];
  };

  // Mobile Layout
  if (isMobile) {
    const studentsWithAverage = dataWithAverage();

    return (
      <div className="space-y-4">
        <Title level={4} className="mb-4">
          Data Nilai Mahasiswa
        </Title>
        <div className="space-y-2">
          {studentsWithAverage.map((student, index) => (
            <MobileStudentCard
              key={student.key}
              student={student}
              index={student.key === "average" ? -1 : index}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="space-y-3">
      <Table
        columns={buildColumns()}
        dataSource={dataWithAverage()}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: "max-content", y: 500 }}
        rowClassName={(record) =>
          record.key === "average" ? "bg-gray-50 font-medium" : ""
        }
        className="text-sm"
      />
    </div>
  );
};
