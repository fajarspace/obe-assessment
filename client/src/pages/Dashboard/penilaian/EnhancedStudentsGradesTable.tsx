// components/EnhancedStudentsGradesTable.tsx - Responsive Version with Yellow Inputs
import React from "react";
import {
  Table,
  Input,
  Tag,
  Card,
  Collapse,
  Form,
  Row,
  Col,
  Divider,
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
  calculateAverage,
  isGradeInputMode = true,
  curriculumData,
  hasSubCPMKData,
  assessmentTypes,
  updateAssessmentScoreFromCPMK,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const hasAllScores = (student: Student) =>
    assessmentTypes.every((type) => {
      const score = student[type as keyof Student] as number;
      return score !== undefined && score !== null && score > 0;
    });

  // Helper function to check if CPMK/SubCPMK has any non-zero weights
  const hasNonZeroWeight = (
    cpl: string,
    cpmk: string,
    subCpmk?: string
  ): boolean => {
    if (subCpmk) {
      return assessmentTypes.some((type) => {
        const weight =
          assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[type] || 0;
        return weight > 0;
      });
    } else {
      return assessmentTypes.some((type) => {
        const weight = assessmentWeights[cpl]?.[cpmk]?.[type] || 0;
        return weight > 0;
      });
    }
  };

  // Get total weight for a CPMK/SubCPMK across all assessment types
  const getTotalWeight = (
    cpl: string,
    cpmk: string,
    subCpmk?: string
  ): number => {
    if (subCpmk) {
      return assessmentTypes.reduce((sum, type) => {
        return (
          sum +
          (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[type] || 0)
        );
      }, 0);
    } else {
      return assessmentTypes.reduce((sum, type) => {
        return sum + (assessmentWeights[cpl]?.[cpmk]?.[type] || 0);
      }, 0);
    }
  };

  const calculateCPMKScore = (
    student: Student,
    cpl: string,
    cpmk: string,
    assessmentType: string,
    subCpmk?: string
  ): number => {
    let weight = 0;

    if (subCpmk) {
      // Sub-CPMK mode
      weight =
        //@ts-ignore
        assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[assessmentType] ||
        0;
    } else {
      // CPMK mode
      //@ts-ignore
      weight = assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
    }

    const assessmentScore = Number(student[assessmentType]) || 0;
    return Math.round(((assessmentScore * weight) / 100) * 10) / 10;
  };

  const getAssessmentColor = (type: string): string => {
    const colors: Record<string, string> = {
      tugas: "bg-yellow-100",
      kuis: "bg-yellow-100",
      uts: "bg-yellow-100",
      uas: "bg-yellow-100",
      projek: "bg-sky-100",
      praktikum: "bg-green-100",
      presentasi: "bg-pink-100",
      quiz: "bg-orange-100",
      ujian: "bg-slate-100",
    };
    return colors[type.toLowerCase()] || "bg-yellow-100";
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
        className={`mb-4 ${isAverageRow ? "bg-pink-50 border-pink-200" : ""}`}
        title={
          <div className="flex justify-between items-center">
            <div>
              <Text strong className={isAverageRow ? "text-pink-700" : ""}>
                {isAverageRow
                  ? "Rata-rata Kelas"
                  : `${index + 1}. ${student.name || "Nama Mahasiswa"}`}
              </Text>
              {!isAverageRow && (
                <div className="text-xs text-gray-500 mt-1">
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
                    <Text className="text-xs text-gray-600">NIM:</Text>
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
                    <Text className="text-xs text-gray-600">Nama:</Text>
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
                              (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                subCpmk
                              ]?.[assessmentType] || 0)
                            );
                          }, 0)
                        );
                      } else {
                        return (
                          cpmkTotal +
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
                      <Tag color="blue" size="small">
                        {assessmentPercentage}%
                      </Tag>
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
                      placeholder={isAverageRow ? "Rata-rata" : "0-100"}
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

                                    return (
                                      <div
                                        key={subCpmk}
                                        className="p-2 bg-white rounded border"
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <Text className="text-sm">
                                            {subCpmkCode}
                                          </Text>
                                          <Tag color="blue" size="small">
                                            {weight}%
                                          </Tag>
                                        </div>
                                        <Row gutter={8}>
                                          <Col span={12}>
                                            <div className="space-y-1">
                                              <Text className="text-xs text-gray-600">
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
                                                placeholder="0-100"
                                              />
                                            </div>
                                          </Col>
                                          <Col span={12}>
                                            <div className="space-y-1">
                                              <Text className="text-xs text-gray-600">
                                                Hasil:
                                              </Text>
                                              <div className="text-sm p-2 bg-gray-100 rounded text-center">
                                                {actualScore.toFixed(1)} poin
                                              </div>
                                            </div>
                                          </Col>
                                        </Row>
                                      </div>
                                    );
                                  })
                                  .filter(Boolean);
                              } else {
                                // Direct CPMK Mode
                                const weight =
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

                                return (
                                  <div
                                    key={cpmk}
                                    className="p-2 bg-white rounded border"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <Text className="text-sm">
                                        {cpmkCode}
                                      </Text>
                                      <Tag color="blue" size="small">
                                        {weight}%
                                      </Tag>
                                    </div>
                                    <Row gutter={8}>
                                      <Col span={12}>
                                        <div className="space-y-1">
                                          <Text className="text-xs text-gray-600">
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
                                            placeholder="0-100"
                                          />
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <div className="space-y-1">
                                          <Text className="text-xs text-gray-600">
                                            Hasil:
                                          </Text>
                                          <div className="text-sm p-2 bg-gray-100 rounded text-center">
                                            {actualScore.toFixed(1)} poin
                                          </div>
                                        </div>
                                      </Col>
                                    </Row>
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
                                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                    subCpmk
                                  ]?.[type] || 0;
                              });
                            });
                          } else {
                            assessmentTypes.forEach((type) => {
                              totalCpmkWeight +=
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
                                  <div className="text-xs text-gray-500">
                                    {totalCpmkWeight}%
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-sm">
                                    {Math.round(finalScore * 10) / 10}
                                  </div>
                                  <div className="text-xs text-gray-500">
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
        className: "text-center text-xs",
        render: (value: number) => value || "",
      },
      {
        title: "NIM",
        dataIndex: "nim",
        key: "nim",
        width: isMobile ? 70 : 90,
        className: "text-xs",
        render: (value: string, record: Student) => {
          if (record.key === "average") {
            return (
              <div className="text-center font-semibold text-xs">{value}</div>
            );
          }
          return (
            <Input
              value={value}
              onChange={(e) => updateStudent(record.key, "nim", e.target.value)}
              size="small"
              className="text-xs h-6 bg-yellow-300"
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
        className: "text-xs",
        render: (value: string, record: Student) => {
          if (record.key === "average") {
            return (
              <div className="text-center font-semibold text-xs">{value}</div>
            );
          }
          return (
            <Input
              value={value}
              onChange={(e) =>
                updateStudent(record.key, "name", e.target.value)
              }
              size="small"
              className="text-xs h-6 bg-yellow-300"
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
          <div className={`font-semibold ${isMobile ? "text-xs" : "text-xs"}`}>
            INPUT NILAI
          </div>
          <div
            className={`font-normal mt-1 ${isMobile ? "text-xs" : "text-xs"}`}
          >
            ({totalInputPercentage}%)
          </div>
        </div>
      ),
      className: "text-xs font-semibold",
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
              <div className={isMobile ? "text-xs" : ""}>{col.title}</div>
              <div
                className={`font-normal mt-1 ${
                  isMobile ? "text-xs" : "text-xs"
                }`}
              >
                ({assessmentPercentage}%)
              </div>
            </div>
          ),
          dataIndex: col.key,
          key: col.key,
          width: isMobile ? 50 : 60,
          className: "text-center text-xs",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (value: number, record: Student) => {
            if (record.key === "average") {
              return (
                <div className="text-center font-semibold text-xs py-1 bg-pink-100 rounded">
                  {value}
                </div>
              );
            }

            if (isGradeInputMode) {
              return (
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    updateStudent(
                      record.key,
                      col.key as keyof Student,
                      Number(e.target.value) || 0
                    )
                  }
                  min={0}
                  max={100}
                  size="small"
                  className="text-center text-xs h-6 bg-yellow-300 border-yellow-400"
                  style={{ backgroundColor: "#fde047" }}
                />
              );
            } else {
              return (
                <div className="text-center text-xs py-1 bg-gray-100 border rounded">
                  {value}
                </div>
              );
            }
          },
        };
      }),
    } as any);

    // CPMK Final Scores Section - Show final CPMK scores grouped by CPL
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
                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[type] ||
                  0;
              });
            });
          } else {
            assessmentTypes.forEach((type) => {
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
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    {cpmkCode}
                  </div>
                  <div className={`${isMobile ? "text-xs" : "text-xs"} px-1`}>
                    {totalCpmkWeight}%
                  </div>
                </div>
              ),
              dataIndex: `final_cpmk_${cpl}_${cpmk}`,
              key: `final_cpmk_${cpl}_${cpmk}`,
              width: isMobile ? 70 : 100,
              className: "text-center text-xs",
              onHeaderCell: () => ({
                style: { textAlign: "center" },
              }),
              render: (_: any, record: Student) => {
                if (record.key === "average") {
                  // Calculate average CPMK score for the class
                  let totalWeightedScore = 0;
                  let totalWeight = 0;

                  if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                    relatedSubCPMK.forEach((subCpmk) => {
                      assessmentTypes.forEach((assessmentType) => {
                        const weight =
                          assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                            assessmentType
                          ] || 0;
                        if (weight > 0) {
                          const assessmentScore =
                            Number(record[assessmentType]) || 0;
                          totalWeightedScore +=
                            (assessmentScore * weight) / 100;
                          totalWeight += weight / 100;
                        }
                      });
                    });
                  } else {
                    assessmentTypes.forEach((assessmentType) => {
                      const weight =
                        assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
                      if (weight > 0) {
                        const assessmentScore =
                          Number(record[assessmentType]) || 0;
                        totalWeightedScore += (assessmentScore * weight) / 100;
                        totalWeight += weight / 100;
                      }
                    });
                  }

                  const finalScore =
                    totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
                  return (
                    <div className="text-center font-semibold text-sm py-2 bg-pink-100 rounded">
                      {Math.round(finalScore * 10) / 10}
                    </div>
                  );
                }

                // Calculate final CPMK score for individual student
                let totalWeightedScore = 0;
                let totalWeight = 0;

                if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                  relatedSubCPMK.forEach((subCpmk) => {
                    assessmentTypes.forEach((assessmentType) => {
                      const weight =
                        assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                          assessmentType
                        ] || 0;
                      if (weight > 0) {
                        const assessmentScore =
                          Number(record[assessmentType]) || 0;
                        totalWeightedScore += (assessmentScore * weight) / 100;
                        totalWeight += weight / 100;
                      }
                    });
                  });
                } else {
                  assessmentTypes.forEach((assessmentType) => {
                    const weight =
                      assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
                    if (weight > 0) {
                      const assessmentScore =
                        Number(record[assessmentType]) || 0;
                      totalWeightedScore += (assessmentScore * weight) / 100;
                      totalWeight += weight / 100;
                    }
                  });
                }

                const finalScore =
                  totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
                return (
                  <div className="text-center text-sm py-2 bg-gray-100 border rounded">
                    {Math.round(finalScore * 10) / 10}
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
                  isMobile ? "text-xs" : ""
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
                    assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                      assessmentType
                    ] || 0;

                  return {
                    title: (
                      <div className="text-center">
                        <div
                          className={`font-semibold mb-1 ${
                            isMobile ? "text-xs" : "text-xs"
                          }`}
                        >
                          {subCpmkCode}
                        </div>
                        <div
                          className={`px-1 rounded font-medium bg-blue-100 ${
                            isMobile ? "text-xs" : "text-xs"
                          }`}
                        >
                          {weight}%
                        </div>
                      </div>
                    ),
                    dataIndex: `${cpl}_${cpmk}_${subCpmk}_${assessmentType}`,
                    key: `${cpl}_${cpmk}_${subCpmk}_${assessmentType}`,
                    width: isMobile ? 60 : 80,
                    className: "text-center text-xs",
                    onHeaderCell: () => ({
                      style: { textAlign: "center" },
                    }),
                    render: (_: any, record: Student) => {
                      if (record.key === "average") {
                        const cpmkScore = calculateCPMKScore(
                          record,
                          cpl,
                          cpmk,
                          assessmentType,
                          subCpmk
                        );
                        return (
                          <div className="text-center font-semibold text-xs py-1 bg-pink-100">
                            {cpmkScore}
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
                            className="text-center text-xs h-5 bg-yellow-300 border-yellow-400"
                            style={{ backgroundColor: "#fde047" }}
                            placeholder="0-100"
                          />
                          <div className="text-xs text-gray-500 text-center">
                            = {actualScore.toFixed(1)}
                          </div>
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
                          isMobile ? "text-xs" : "text-xs"
                        }`}
                      >
                        {cpmkCode}
                      </div>
                      <div
                        className={`text-gray-600 ${
                          isMobile ? "text-xs" : "text-xs"
                        }`}
                      >
                        {filteredSubCPMK.length} Sub-CPMK
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
                assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
              if (weight > 0) {
                cpmkColumns.push({
                  title: (
                    <div className="text-center">
                      <div
                        className={`font-semibold mb-1 ${
                          isMobile ? "text-xs" : "text-xs"
                        }`}
                      >
                        {cpmkCode}
                      </div>
                      <div
                        className={`px-1 rounded font-medium bg-blue-100 ${
                          isMobile ? "text-xs" : "text-xs"
                        }`}
                      >
                        {weight}%
                      </div>
                    </div>
                  ),
                  dataIndex: `${cpl}_${cpmk}_${assessmentType}`,
                  key: `${cpl}_${cpmk}_${assessmentType}`,
                  width: isMobile ? 70 : 90,
                  className: "text-center text-xs",
                  onHeaderCell: () => ({
                    style: { textAlign: "center" },
                  }),
                  render: (_: any, record: Student) => {
                    if (record.key === "average") {
                      const cpmkScore = calculateCPMKScore(
                        record,
                        cpl,
                        cpmk,
                        assessmentType
                      );
                      return (
                        <div className="text-center font-semibold text-xs py-1 bg-pink-100">
                          {cpmkScore}
                        </div>
                      );
                    }

                    // For CPMK input mode - scale 1-100 input
                    const currentPercentageValue =
                      (record[
                        `${cpl}_${cpmk}_${assessmentType}_percentage`
                      ] as number) || 0;
                    const actualScore = (currentPercentageValue * weight) / 100;

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
                          className="text-center text-xs h-5 bg-yellow-300 border-yellow-400"
                          style={{ backgroundColor: "#fde047" }}
                          placeholder="0-100"
                        />
                        <div className="text-xs text-gray-500 text-center">
                          = {actualScore.toFixed(1)}
                        </div>
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
                  className={`text-center font-semibold p-1 rounded border ${
                    isMobile ? "text-xs" : "text-sm"
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
                className={`text-center font-bold bg-yellow-300 ${
                  isMobile ? "text-sm" : "text-sm"
                }`}
              >
                <div>{assessmentType.toUpperCase()}</div>
                <div
                  className={`font-normal mt-1 ${
                    isMobile ? "text-xs" : "text-xs"
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
      className: "text-xs font-semibold",
      children: [
        {
          title: "Nilai",
          dataIndex: "nilaiAkhir",
          key: "nilaiAkhir",
          width: isMobile ? 50 : 70,
          className: "text-center text-xs",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (value: number, record: Student) => {
            if (record.key === "average") {
              return (
                <div className="text-center font-semibold text-xs py-1 bg-pink-100 rounded">
                  {value || 0}
                </div>
              );
            }

            if (hasAllScores(record)) {
              return (
                <div className="text-center space-y-1">
                  <div className="font-semibold text-xs">{value}</div>
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
                    className="text-xs"
                  >
                    {record.nilaiMutu}
                  </Tag>
                </div>
              );
            } else {
              return <div className="text-center text-gray-400 text-xs">-</div>;
            }
          },
        },
        {
          title: "Indikator",
          dataIndex: "indikator",
          key: "indikator",
          width: isMobile ? 70 : 100,
          className: "text-center text-xs",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          //@ts-ignore
          render: (value: any, record: Student) => {
            if (record.key === "average") {
              const indicator = getPerformanceIndicator(record.nilaiAkhir || 0);
              return (
                <div className="text-center space-y-1">
                  <div className="text-xs">{indicator.description}</div>
                </div>
              );
            }

            if (hasAllScores(record) && record.nilaiAkhir !== undefined) {
              const indicator = getPerformanceIndicator(record.nilaiAkhir);
              return (
                <div className="text-center space-y-1">
                  <div className="text-xs">{indicator.description}</div>
                </div>
              );
            } else {
              return <div className="text-center text-gray-400 text-xs">-</div>;
            }
          },
        },
        {
          title: "Lulus",
          dataIndex: "kelulusan",
          key: "kelulusan",
          width: isMobile ? 40 : 60,
          className: "text-center text-xs",
          onHeaderCell: () => ({
            style: { textAlign: "center" },
          }),
          render: (value: string, record: Student) => {
            if (record.key === "average") {
              return (
                <div className="text-center font-semibold text-xs py-1 bg-pink-100 rounded">
                  Avg
                </div>
              );
            }

            if (hasAllScores(record)) {
              return (
                <Tag
                  color={value === "Lulus" ? "green" : "red"}
                  className="text-xs"
                >
                  {value === "Lulus" ? "✓" : "✗"}
                </Tag>
              );
            } else {
              return <div className="text-center text-gray-400 text-xs">-</div>;
            }
          },
        },
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
      nilaiAkhir: calculateAverage("nilaiAkhir"),
      nilaiMutu: "-",
      kelulusan: "-",
    } as Student;

    // Add dynamic assessment type averages
    assessmentTypes.forEach((type) => {
      averageRow[type] = calculateAverage(type);
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
          record.key === "average" ? "bg-pink-50 font-medium" : ""
        }
        className="text-xs"
      />
    </div>
  );
};
