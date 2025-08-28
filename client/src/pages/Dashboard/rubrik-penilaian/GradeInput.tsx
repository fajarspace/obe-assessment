// components/Assessment/GradeInput.tsx - Updated with combined CPMK percentage in headers
import React from "react";
import {
  Card,
  Table,
  InputNumber,
  Input,
  Button,
  Space,
  Radio,
  Tag,
  Typography,
} from "antd";
import { PlusOutlined, SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type {
  Student,
  MKData,
  AssessmentWeights,
  SubCPMKPercentages,
  AssessmentMode,
} from "./interfaces";
import {
  calculateAssessmentTotal,
  calculateCPMKScore,
  calculateFinalScore,
  getGrade,
  getCPMKLevel,
  groupCPMKByCPL,
  hasAssessmentWeights,
  calculateCPMKCombinedPercentage,
  calculateCPMKAssessmentPercentage,
} from "./utils";

const { Text } = Typography;

interface GradeInputProps {
  selectedMK: MKData;
  students: Student[];
  assessmentWeights: AssessmentWeights;
  subcpmkPercentages: SubCPMKPercentages;
  assessmentMode: AssessmentMode;
  onUpdateStudent: (key: string, field: string, value: any) => void;
  onAddStudent: () => void;
  onSaveData: () => void;
  onRefresh: () => void;
  onModeChange: (mode: AssessmentMode) => void;
}

const GradeInputComponent: React.FC<GradeInputProps> = ({
  selectedMK,
  students,
  assessmentWeights,
  subcpmkPercentages,
  assessmentMode,
  onUpdateStudent,
  onAddStudent,
  onSaveData,
  onRefresh,
  onModeChange,
}) => {
  const cplGroups = groupCPMKByCPL(selectedMK);
  const assessmentTypes: Array<keyof AssessmentWeights[string]> = [
    "tugas",
    "kuis",
    "uts",
    "uas",
  ];
  const assessmentLabels: Record<keyof AssessmentWeights[string], string> = {
    tugas: "TUGAS",
    kuis: "Kuis",
    uts: "UTS",
    uas: "UAS",
  };

  // Calculate simple average assessment value from ALL CPMK inputs (more robust)
  const calculateAssessmentFromCPMKInputs = (
    student: Student,
    assessmentType: string,
    selectedMK: MKData,
    assessmentWeights: AssessmentWeights
  ): number => {
    if (!selectedMK?.cpmk || assessmentMode !== "cpmk") return 0;

    let totalScore = 0;
    let count = 0;
    const allInputs: number[] = [];

    // Collect ALL possible input field names for this assessment type
    selectedMK.cpmk.forEach((cpmk) => {
      const primaryCplCode =
        cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0
          ? cpmk.cpl[0].kode
          : cpmk.cpl && !Array.isArray(cpmk.cpl)
          ? (cpmk.cpl as any).kode
          : `No_CPL_${cpmk.kode}`;

      if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
        cpmk.subcpmk.forEach((subcpmk) => {
          const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${primaryCplCode}`;
          const fieldName = `${assessmentType}_${uniqueKey}`;
          const score = (student[fieldName] as number) || 0;

          if (score > 0) {
            allInputs.push(score);
          }
        });
      } else {
        const uniqueKey = `${cpmk.kode}_${primaryCplCode}`;
        const fieldName = `${assessmentType}_${uniqueKey}`;
        const score = (student[fieldName] as number) || 0;

        if (score > 0) {
          allInputs.push(score);
        }
      }
    });

    // Also check for direct assessment field names (fallback)
    const directFieldName = `${assessmentType}`;
    const directScore = (student[directFieldName] as number) || 0;
    if (directScore > 0 && allInputs.length === 0) {
      allInputs.push(directScore);
    }

    // Calculate average from all collected inputs
    if (allInputs.length > 0) {
      const sum = allInputs.reduce((acc, val) => acc + val, 0);
      return Math.round((sum / allInputs.length) * 100) / 100;
    }

    return 0;
  };

  // Calculate normalized final score using weighted average based on CPMK percentages
  const calculateNormalizedFinalScore = (
    student: Student,
    selectedMK: MKData,
    assessmentWeights: AssessmentWeights,
    subcpmkPercentages: SubCPMKPercentages
  ): number => {
    if (assessmentMode === "cpmk") {
      // In CPMK mode, calculate weighted average based on actual weights
      let totalWeightedScore = 0;
      let totalWeight = 0;

      if (!selectedMK?.cpmk) return 0;

      selectedMK.cpmk.forEach((cpmk) => {
        const primaryCplCode =
          cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0
            ? cpmk.cpl[0].kode
            : cpmk.cpl && !Array.isArray(cpmk.cpl)
            ? (cpmk.cpl as any).kode
            : `No_CPL_${cpmk.kode}`;

        if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
          cpmk.subcpmk.forEach((subcpmk) => {
            const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${primaryCplCode}`;
            const weights = assessmentWeights[uniqueKey] || {
              tugas: 0,
              kuis: 0,
              uts: 0,
              uas: 0,
            };

            // Get total weight for this SubCPMK
            const subcpmkTotalWeight =
              weights.tugas + weights.kuis + weights.uts + weights.uas;

            if (subcpmkTotalWeight > 0) {
              // Calculate SubCPMK score from individual inputs
              const tugasField = `tugas_${uniqueKey}`;
              const kuisField = `kuis_${uniqueKey}`;
              const utsField = `uts_${uniqueKey}`;
              const uasField = `uas_${uniqueKey}`;

              const tugasScore = (student[tugasField] as number) || 0;
              const kuisScore = (student[kuisField] as number) || 0;
              const utsScore = (student[utsField] as number) || 0;
              const uasScore = (student[uasField] as number) || 0;

              // Calculate weighted score for this SubCPMK
              const subcpmkWeightedScore =
                (tugasScore * weights.tugas +
                  kuisScore * weights.kuis +
                  utsScore * weights.uts +
                  uasScore * weights.uas) /
                subcpmkTotalWeight;

              // Add to final calculation with SubCPMK weight
              totalWeightedScore += subcpmkWeightedScore * subcpmkTotalWeight;
              totalWeight += subcpmkTotalWeight;
            }
          });
        } else {
          // Direct CPMK without SubCPMK
          const uniqueKey = `${cpmk.kode}_${primaryCplCode}`;
          const weights = assessmentWeights[uniqueKey] || {
            tugas: 0,
            kuis: 0,
            uts: 0,
            uas: 0,
          };

          const cpmkTotalWeight =
            weights.tugas + weights.kuis + weights.uts + weights.uas;

          if (cpmkTotalWeight > 0) {
            const tugasField = `tugas_${uniqueKey}`;
            const kuisField = `kuis_${uniqueKey}`;
            const utsField = `uts_${uniqueKey}`;
            const uasField = `uas_${uniqueKey}`;

            const tugasScore = (student[tugasField] as number) || 0;
            const kuisScore = (student[kuisField] as number) || 0;
            const utsScore = (student[utsField] as number) || 0;
            const uasScore = (student[uasField] as number) || 0;

            const cpmkWeightedScore =
              (tugasScore * weights.tugas +
                kuisScore * weights.kuis +
                utsScore * weights.uts +
                uasScore * weights.uas) /
              cpmkTotalWeight;

            totalWeightedScore += cpmkWeightedScore * cpmkTotalWeight;
            totalWeight += cpmkTotalWeight;
          }
        }
      });

      if (totalWeight > 0) {
        const finalScore = totalWeightedScore / totalWeight;
        return Math.min(100, Math.round(finalScore * 100) / 100);
      }

      return 0;
    } else {
      // In Nilai mode, use existing calculation but normalize to 100
      const originalScore = calculateFinalScore(
        student,
        selectedMK,
        assessmentWeights,
        subcpmkPercentages
      );
      return Math.min(100, Math.round(originalScore * 100) / 100);
    }
  };
  const calculateSubCPMKScoreFromSpecificInputs = (
    student: Student,
    uniqueKey: string,
    assessmentWeights: AssessmentWeights
  ): number => {
    const weights = assessmentWeights[uniqueKey] || {
      tugas: 0,
      kuis: 0,
      uts: 0,
      uas: 0,
    };

    const totalWeight =
      weights.tugas + weights.kuis + weights.uts + weights.uas;

    if (totalWeight === 0) return 0;

    // In CPMK mode, use specific field values for this SubCPMK
    const tugasScore = (student[`tugas_${uniqueKey}`] as number) || 0;
    const kuisScore = (student[`kuis_${uniqueKey}`] as number) || 0;
    const utsScore = (student[`uts_${uniqueKey}`] as number) || 0;
    const uasScore = (student[`uas_${uniqueKey}`] as number) || 0;

    // Calculate weighted average for this specific SubCPMK
    const subcpmkScore =
      (tugasScore * weights.tugas +
        kuisScore * weights.kuis +
        utsScore * weights.uts +
        uasScore * weights.uas) /
      totalWeight;

    return Math.round(subcpmkScore * 100) / 100;
  };

  // Calculate individual SubCPMK score based on its specific weights (for Nilai mode)
  const calculateSubCPMKScore = (
    student: Student,
    uniqueKey: string,
    assessmentWeights: AssessmentWeights
  ): number => {
    const weights = assessmentWeights[uniqueKey] || {
      tugas: 0,
      kuis: 0,
      uts: 0,
      uas: 0,
    };

    const totalWeight =
      weights.tugas + weights.kuis + weights.uts + weights.uas;

    if (totalWeight === 0) return 0;

    // Calculate weighted average for this specific SubCPMK
    const subcpmkScore =
      (student.tugas * weights.tugas +
        student.kuis * weights.kuis +
        student.uts * weights.uts +
        student.uas * weights.uas) /
      totalWeight;

    return Math.round(subcpmkScore * 100) / 100;
  };

  // Filter to show only CPL/CPMK/SubCPMK that have weights
  const getFilteredCplGroups = () => {
    const filteredGroups: Record<string, any[]> = {};

    Object.entries(cplGroups).forEach(([cplCode, cpmks]) => {
      const filteredCpmks = cpmks.filter((cpmk) => {
        if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
          return cpmk.subcpmk.some((subcpmk) => {
            const currentCplCode = (cpmk as any)._cplContext || cplCode;
            const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${currentCplCode}`;
            return hasAssessmentWeights(uniqueKey, assessmentWeights);
          });
        } else {
          const currentCplCode = (cpmk as any)._cplContext || cplCode;
          const uniqueKey = `${cpmk.kode}_${currentCplCode}`;
          return hasAssessmentWeights(uniqueKey, assessmentWeights);
        }
      });

      if (filteredCpmks.length > 0) {
        filteredGroups[cplCode] = filteredCpmks;
      }
    });

    return filteredGroups;
  };

  const filteredCplGroups = getFilteredCplGroups();

  // Generate CPMK input columns based on mode (only show those with weights)
  const generateCPMKInputColumns = () => {
    if (Object.keys(filteredCplGroups).length === 0) return [];

    return assessmentTypes.map((assessmentType) => ({
      title: (
        <div
          className="text-center font-bold p-2 text-white"
          style={{
            backgroundColor: assessmentType === "tugas" ? "#90EE90" : "#98FB98",
          }}
        >
          {assessmentLabels[assessmentType]}
        </div>
      ),
      children: Object.entries(filteredCplGroups).map(([cplCode, cpmks]) => ({
        title: (
          <div
            className="text-center font-bold p-2"
            style={{ backgroundColor: "#90EE90" }}
          >
            {cplCode}
          </div>
        ),
        children: cpmks
          .map((cpmk) => {
            if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
              // Filter subcpmk to only show those with weights
              const subcpmksWithWeights = cpmk.subcpmk.filter((subcpmk) => {
                const currentCplCode = (cpmk as any)._cplContext || cplCode;
                const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${currentCplCode}`;
                return hasAssessmentWeights(uniqueKey, assessmentWeights);
              });

              if (subcpmksWithWeights.length === 0) return null;

              // Calculate only the specific assessment percentage for this column
              const assessmentPercentage = calculateCPMKAssessmentPercentage(
                cpmk,
                cplCode,
                assessmentType,
                assessmentWeights
              );

              return {
                title: (
                  <div
                    className="text-center font-semibold p-1"
                    style={{ backgroundColor: "#B0E0E6" }}
                  >
                    {cpmk.kode}
                    <br />
                    <span className="text-xs font-bold text-blue-600">
                      {assessmentPercentage}%
                    </span>
                  </div>
                ),
                children: subcpmksWithWeights.map((subcpmk) => ({
                  title: (
                    <div
                      className="text-center text-xs font-medium p-1"
                      style={{ backgroundColor: "#E0E0E0" }}
                    >
                      {subcpmk.kode}
                      <br />
                      <span className="text-xs">
                        {(() => {
                          const currentCplCode =
                            (cpmk as any)._cplContext || cplCode;
                          const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${currentCplCode}`;
                          return (
                            assessmentWeights[uniqueKey]?.[assessmentType] || 0
                          );
                        })()}
                        %
                      </span>
                    </div>
                  ),
                  width: 80,
                  dataIndex:
                    `${assessmentType}_${subcpmk.kode}` as keyof Student,
                  render: (_: any, record: Student) => {
                    const currentCplCode = (cpmk as any)._cplContext || cplCode;
                    const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${currentCplCode}`;
                    const weight =
                      assessmentWeights[uniqueKey]?.[assessmentType] || 0;

                    // Show actual assessment score (scale 100), not contribution
                    const studentAssessmentScore =
                      (record[assessmentType] as number) || 0;

                    // Calculate individual SubCPMK score based on mode and ENSURE uniqueKey includes CPL
                    const individualSubcpmkScore =
                      assessmentMode === "cpmk"
                        ? calculateSubCPMKScoreFromSpecificInputs(
                            record,
                            uniqueKey,
                            assessmentWeights
                          )
                        : calculateSubCPMKScore(
                            record,
                            uniqueKey,
                            assessmentWeights
                          );

                    const level = getCPMKLevel(individualSubcpmkScore);

                    if (assessmentMode === "cpmk" && weight > 0) {
                      // CPMK mode - CRITICAL: Use unique field name that includes CPL to prevent conflicts
                      const fieldName = `${assessmentType}_${uniqueKey}`; // uniqueKey already contains CPL context
                      const studentSpecificScore =
                        (record[fieldName] as number) || 0;

                      return (
                        <div className="text-center p-1">
                          <InputNumber
                            size="small"
                            min={0}
                            max={100}
                            value={studentSpecificScore}
                            onChange={(val) => {
                              // Debug to verify field names are different
                              console.log(
                                `Setting ${fieldName} = ${val} for ${currentCplCode}`
                              );
                              onUpdateStudent(
                                record.key,
                                fieldName, // This should be unique for each CPL
                                val || 0
                              );
                            }}
                            style={{
                              backgroundColor: "#ffff99",
                              width: "100%",
                            }}
                          />
                          <div className="text-xs mt-1">
                            <div>
                              <Tag color="geekblue" className="text-xs">
                                {individualSubcpmkScore.toFixed(1)}
                              </Tag>
                            </div>
                            <Tag
                              color={
                                level.point >= 3
                                  ? "green"
                                  : level.point >= 2
                                  ? "orange"
                                  : level.point >= 1
                                  ? "yellow"
                                  : "red"
                              }
                              className="text-xs"
                            >
                              {level.level}
                            </Tag>
                          </div>
                        </div>
                      );
                    } else {
                      // Nilai mode - show calculated weighted scores
                      const studentScore =
                        (record[assessmentType] as number) || 0;
                      const displayValue =
                        weight > 0 ? studentScore.toFixed(0) : "-";
                      return (
                        <div className="text-center p-1">
                          <div
                            style={{
                              backgroundColor: "#f0f8f0",
                              border: "1px solid #d9d9d9",
                              borderRadius: "6px",
                              padding: "4px",
                              minHeight: "24px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {displayValue}
                          </div>
                          {weight > 0 && (
                            <div className="text-xs mt-1">
                              <div>
                                <Tag color="geekblue" className="text-xs">
                                  {individualSubcpmkScore.toFixed(1)}
                                </Tag>
                              </div>
                              <Tag
                                color={
                                  level.point >= 3
                                    ? "green"
                                    : level.point >= 2
                                    ? "orange"
                                    : level.point >= 1
                                    ? "yellow"
                                    : "red"
                                }
                                className="text-xs"
                              >
                                {level.level}
                              </Tag>
                            </div>
                          )}
                        </div>
                      );
                    }
                  },
                })),
              };
            } else {
              // Direct CPMK without SubCPMK
              const currentCplCode = (cpmk as any)._cplContext || cplCode;
              const uniqueKey = `${cpmk.kode}_${currentCplCode}`;
              const hasWeights = hasAssessmentWeights(
                uniqueKey,
                assessmentWeights
              );

              if (!hasWeights) return null;

              // For direct CPMK, only show the specific assessment percentage
              const assessmentPercentage = calculateCPMKAssessmentPercentage(
                cpmk,
                cplCode,
                assessmentType,
                assessmentWeights
              );

              return {
                title: (
                  <div
                    className="text-center font-semibold p-1"
                    style={{ backgroundColor: "#B0E0E6" }}
                  >
                    {cpmk.kode}
                    <br />
                    <span className="text-xs font-bold text-blue-600">
                      {assessmentPercentage}%
                    </span>
                  </div>
                ),
                children: [
                  {
                    title: (
                      <div
                        className="text-center text-xs font-medium p-1"
                        style={{ backgroundColor: "#E0E0E0" }}
                      >
                        Direct
                        <br />
                        <span className="text-xs">
                          {assessmentWeights[uniqueKey]?.[assessmentType] || 0}%
                        </span>
                      </div>
                    ),
                    width: 80,
                    dataIndex:
                      `${assessmentType}_${cpmk.kode}` as keyof Student,
                    render: (_: any, record: Student) => {
                      const weight =
                        assessmentWeights[uniqueKey]?.[assessmentType] || 0;

                      // Calculate CPMK score for direct CPMK
                      const score = calculateCPMKScore(
                        record,
                        cpmk.kode,
                        selectedMK,
                        assessmentWeights,
                        subcpmkPercentages
                      );
                      const level = getCPMKLevel(score);

                      if (assessmentMode === "cpmk" && weight > 0) {
                        // CPMK mode - allow direct input with unique field name
                        const fieldName = `${assessmentType}_${uniqueKey}`;
                        const studentSpecificScore =
                          (record[fieldName] as number) || 0;

                        return (
                          <div className="text-center p-1">
                            <InputNumber
                              size="small"
                              min={0}
                              max={100}
                              value={studentSpecificScore}
                              onChange={(val) =>
                                onUpdateStudent(record.key, fieldName, val || 0)
                              }
                              style={{
                                backgroundColor: "#ffff99",
                                width: "100%",
                              }}
                            />
                            <div className="text-xs mt-1">
                              <div>
                                <Tag color="geekblue" className="text-xs">
                                  {score.toFixed(1)}
                                </Tag>
                              </div>
                              <Tag
                                color={
                                  level.point >= 3
                                    ? "green"
                                    : level.point >= 2
                                    ? "orange"
                                    : level.point >= 1
                                    ? "yellow"
                                    : "red"
                                }
                                className="text-xs"
                              >
                                {level.level}
                              </Tag>
                            </div>
                          </div>
                        );
                      } else {
                        // Nilai mode - show calculated weighted scores
                        const studentScore =
                          (record[assessmentType] as number) || 0;
                        const displayValue =
                          weight > 0 ? studentScore.toFixed(0) : "-";
                        return (
                          <div className="text-center p-1">
                            <div
                              style={{
                                backgroundColor: "#f0f8f0",
                                border: "1px solid #d9d9d9",
                                borderRadius: "6px",
                                padding: "4px",
                                minHeight: "24px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {displayValue}
                            </div>
                            {weight > 0 && (
                              <div className="text-xs mt-1">
                                <div>
                                  <Tag color="geekblue" className="text-xs">
                                    {score.toFixed(1)}
                                  </Tag>
                                </div>
                                <Tag
                                  color={
                                    level.point >= 3
                                      ? "green"
                                      : level.point >= 2
                                      ? "orange"
                                      : level.point >= 1
                                      ? "yellow"
                                      : "red"
                                  }
                                  className="text-xs"
                                >
                                  {level.level}
                                </Tag>
                              </div>
                            )}
                          </div>
                        );
                      }
                    },
                  },
                ],
              };
            }
          })
          .filter(Boolean),
      })),
    }));
  };

  // ... (keep rest of the component unchanged including generateAssessmentInputColumns, generateCPMKResultColumns, and columns definition)

  // Generate Assessment input columns
  const generateAssessmentInputColumns = () => {
    return [
      {
        title: (
          <div
            className="text-center font-bold p-2 text-white"
            style={{ backgroundColor: "#ffc107" }}
          >
            INPUT NILAI BERDASARKAN ASSESSMENT
          </div>
        ),
        children: [
          {
            title: (
              <div className="text-center font-semibold p-1">
                Tugas
                <br />
                {calculateAssessmentTotal(
                  "tugas",
                  selectedMK,
                  assessmentWeights
                )}
                %
              </div>
            ),
            dataIndex: "tugas" as keyof Student,
            width: 80,
            render: (value: number, record: Student) => {
              // In CPMK mode, show calculated average from CPMK inputs
              const displayValue =
                assessmentMode === "cpmk"
                  ? calculateAssessmentFromCPMKInputs(
                      record,
                      "tugas",
                      selectedMK,
                      assessmentWeights
                    )
                  : value;

              return (
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  value={displayValue}
                  onChange={(val) =>
                    onUpdateStudent(record.key, "tugas", val || 0)
                  }
                  style={{
                    backgroundColor:
                      assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                    width: "100%",
                  }}
                  disabled={assessmentMode === "cpmk"}
                  readOnly={assessmentMode === "cpmk"}
                />
              );
            },
          },
          {
            title: (
              <div className="text-center font-semibold p-1">
                Kuis
                <br />
                {calculateAssessmentTotal(
                  "kuis",
                  selectedMK,
                  assessmentWeights
                )}
                %
              </div>
            ),
            dataIndex: "kuis" as keyof Student,
            width: 80,
            render: (value: number, record: Student) => {
              // In CPMK mode, show calculated average from CPMK inputs
              const displayValue =
                assessmentMode === "cpmk"
                  ? calculateAssessmentFromCPMKInputs(
                      record,
                      "kuis",
                      selectedMK,
                      assessmentWeights
                    )
                  : value;

              return (
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  value={displayValue}
                  onChange={(val) =>
                    onUpdateStudent(record.key, "kuis", val || 0)
                  }
                  style={{
                    backgroundColor:
                      assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                    width: "100%",
                  }}
                  disabled={assessmentMode === "cpmk"}
                  readOnly={assessmentMode === "cpmk"}
                />
              );
            },
          },
          {
            title: (
              <div className="text-center font-semibold p-1">
                UTS
                <br />
                {calculateAssessmentTotal("uts", selectedMK, assessmentWeights)}
                %
              </div>
            ),
            dataIndex: "uts" as keyof Student,
            width: 80,
            render: (value: number, record: Student) => {
              // In CPMK mode, show calculated average from CPMK inputs
              const displayValue =
                assessmentMode === "cpmk"
                  ? calculateAssessmentFromCPMKInputs(
                      record,
                      "uts",
                      selectedMK,
                      assessmentWeights
                    )
                  : value;

              return (
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  value={displayValue}
                  onChange={(val) =>
                    onUpdateStudent(record.key, "uts", val || 0)
                  }
                  style={{
                    backgroundColor:
                      assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                    width: "100%",
                  }}
                  disabled={assessmentMode === "cpmk"}
                  readOnly={assessmentMode === "cpmk"}
                />
              );
            },
          },
          {
            title: (
              <div className="text-center font-semibold p-1">
                UAS
                <br />
                {calculateAssessmentTotal("uas", selectedMK, assessmentWeights)}
                %
              </div>
            ),
            dataIndex: "uas" as keyof Student,
            width: 80,
            render: (value: number, record: Student) => {
              // In CPMK mode, show calculated average from CPMK inputs
              const displayValue =
                assessmentMode === "cpmk"
                  ? calculateAssessmentFromCPMKInputs(
                      record,
                      "uas",
                      selectedMK,
                      assessmentWeights
                    )
                  : value;

              return (
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  value={displayValue}
                  onChange={(val) =>
                    onUpdateStudent(record.key, "uas", val || 0)
                  }
                  style={{
                    backgroundColor:
                      assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                    width: "100%",
                  }}
                  disabled={assessmentMode === "cpmk"}
                  readOnly={assessmentMode === "cpmk"}
                />
              );
            },
          },
        ],
      },
    ];
  };

  // CPMK result columns removed for simplification

  // Build complete columns array
  const columns: ColumnsType<Student> = [
    {
      title: "No",
      dataIndex: "no",
      width: 50,
      fixed: "left",
      render: (value: number) => <div className="text-center">{value}</div>,
    },
    {
      title: "NIM",
      dataIndex: "nim",
      width: 120,
      fixed: "left",
      render: (value: string, record: Student) => (
        <Input
          size="small"
          value={value}
          onChange={(e) => onUpdateStudent(record.key, "nim", e.target.value)}
        />
      ),
    },
    {
      title: "Nama Mahasiswa",
      dataIndex: "nama",
      width: 200,
      fixed: "left",
      render: (value: string, record: Student) => (
        <Input
          size="small"
          value={value}
          onChange={(e) => onUpdateStudent(record.key, "nama", e.target.value)}
        />
      ),
    },
    ...generateAssessmentInputColumns(),
    ...generateCPMKInputColumns(),
    {
      title: (
        <div
          className="text-center font-bold p-2"
          style={{ backgroundColor: "#c8d6e5" }}
        >
          NILAI
          <br />
          SKALA 100
        </div>
      ),
      width: 120,
      render: (_: any, record: Student) => {
        const score = calculateNormalizedFinalScore(
          record,
          selectedMK,
          assessmentWeights,
          subcpmkPercentages
        );
        return (
          <div className="text-center">
            <Tag color="blue">{score.toFixed(2)}</Tag>
          </div>
        );
      },
    },
    {
      title: (
        <div
          className="text-center font-bold p-2"
          style={{ backgroundColor: "#c8d6e5" }}
        >
          NILAI
          <br />
          SKALA 4
        </div>
      ),
      width: 100,
      render: (_: any, record: Student) => {
        const score = calculateNormalizedFinalScore(
          record,
          selectedMK,
          assessmentWeights,
          subcpmkPercentages
        );
        const grade = getGrade(score);
        return (
          <div className="text-center">
            <Tag color="green">{grade.point}</Tag>
          </div>
        );
      },
    },
    {
      title: (
        <div
          className="text-center font-bold p-2"
          style={{ backgroundColor: "#c8d6e5" }}
        >
          NILAI
          <br />
          HURUF
        </div>
      ),
      width: 100,
      render: (_: any, record: Student) => {
        const score = calculateNormalizedFinalScore(
          record,
          selectedMK,
          assessmentWeights,
          subcpmkPercentages
        );
        const grade = getGrade(score);
        return (
          <div className="text-center">
            <Tag color="purple">{grade.grade}</Tag>
          </div>
        );
      },
    },
    {
      title: (
        <div
          className="text-center font-bold p-2"
          style={{ backgroundColor: "#c8d6e5" }}
        >
          LABEL
        </div>
      ),
      width: 120,
      render: (_: any, record: Student) => {
        const score = calculateNormalizedFinalScore(
          record,
          selectedMK,
          assessmentWeights,
          subcpmkPercentages
        );
        const isPass = score >= 45;
        return (
          <div className="text-center">
            <Tag color={isPass ? "success" : "error"}>
              {isPass ? "Lulus" : "Tidak Lulus"}
            </Tag>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <div className="mb-4">
        <Space>
          <Text strong>Mode Penilaian:</Text>
          <Radio.Group
            value={assessmentMode}
            onChange={(e) => onModeChange(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="nilai">Nilai Assessment</Radio.Button>
            <Radio.Button value="cpmk">CPMK Direct</Radio.Button>
          </Radio.Group>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddStudent}>
            Tambah Mahasiswa
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={onSaveData}>
            Simpan Data
          </Button>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            Refresh
          </Button>
        </Space>
      </div>

      <Table
        bordered
        size="small"
        pagination={false}
        scroll={{ x: "max-content", y: 600 }}
        columns={columns}
        dataSource={students}
      />
    </Card>
  );
};

export default GradeInputComponent;
