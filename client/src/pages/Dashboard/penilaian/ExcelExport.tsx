// components/ExcelExporter.tsx
import React, { useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Space,
  Alert,
  Card,
  Row,
  Col,
  Tag,
  message,
} from "antd";
import { DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import type {
  Student,
  AssessmentWeights,
  CourseInfo,
  CurriculumData,
} from "@/types/interface";
import { getPerformanceIndicator } from "./helper";

const { Text, Title } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
  students: Student[];
  assessmentWeights: AssessmentWeights;
  assessmentTypes: string[];
  selectedCourse: string;
  curriculumData: CurriculumData | null;
  relatedCPL: string[];
  getRelatedCPMK: (cpl: string) => string[];
  getRelatedSubCPMK: (cpmk: string) => string[];
  hasSubCPMKData: boolean;
  courseInfo: CourseInfo;
  isGradeInputMode: boolean;
  assessmentComments: Record<string, string>;
}

interface ExportOption {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const ExcelExporter: React.FC<Props> = ({
  visible,
  onClose,
  students,
  assessmentWeights,
  assessmentTypes,
  selectedCourse,
  curriculumData,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
  hasSubCPMKData,
  courseInfo,
  isGradeInputMode,
  assessmentComments,
}) => {
  const [selectedExportType, setSelectedExportType] =
    useState<string>("complete");
  const [exporting, setExporting] = useState(false);

  const exportOptions: ExportOption[] = [
    {
      key: "complete",
      label: "Data Lengkap",
      description: "Ekspor semua data termasuk nilai, CPMK, dan analisis",
      icon: <FileExcelOutlined className="text-green-600" />,
    },
    {
      key: "grades_only",
      label: "Nilai Saja",
      description: "Ekspor data nilai assessment dan hasil akhir",
      icon: <FileExcelOutlined className="text-blue-600" />,
    },
    {
      key: "cpmk_analysis",
      label: "Analisis CPMK",
      description: "Ekspor analisis pencapaian CPMK per mahasiswa",
      icon: <FileExcelOutlined className="text-purple-600" />,
    },
    {
      key: "summary_report",
      label: "Laporan Ringkasan",
      description: "Ekspor statistik kelas dan distribusi nilai",
      icon: <FileExcelOutlined className="text-orange-600" />,
    },
  ];

  const hasAllAssessmentScores = (student: Student): boolean => {
    return assessmentTypes.every((type) => {
      const score = student[type as keyof Student] as number;
      return score !== undefined && score !== null && score > 0;
    });
  };

  const calculateCPMKScore = (
    student: Student,
    cpl: string,
    cpmk: string
  ): number => {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const relatedSubCPMK = getRelatedSubCPMK(cpmk);

    if (hasSubCPMKData && relatedSubCPMK.length > 0) {
      relatedSubCPMK.forEach((subCpmk) => {
        assessmentTypes.forEach((assessmentType) => {
          const weight =
            //@ts-ignore
            assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
              assessmentType
            ] || 0;
          if (weight > 0) {
            const assessmentScore = Number(student[assessmentType]) || 0;
            totalWeightedScore += (assessmentScore * weight) / 100;
            totalWeight += weight / 100;
          }
        });
      });
    } else {
      assessmentTypes.forEach((assessmentType) => {
        //@ts-ignore
        const weight = assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
        if (weight > 0) {
          const assessmentScore = Number(student[assessmentType]) || 0;
          totalWeightedScore += (assessmentScore * weight) / 100;
          totalWeight += weight / 100;
        }
      });
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  };

  const exportCompleteData = (): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Course Information
    const courseInfoData = [
      ["INFORMASI MATA KULIAH"],
      [""],
      ["Kode Mata Kuliah", selectedCourse],
      [
        "Nama Mata Kuliah",
        curriculumData?.mata_kuliah?.[selectedCourse]?.nama || "",
      ],
      [
        "Program Studi",
        curriculumData?.mata_kuliah?.[selectedCourse]?.prodi || "",
      ],
      ["Dosen Pengampu", courseInfo.lecturer || ""],
      ["Semester", courseInfo.semester],
      ["Tahun Akademik", courseInfo.year],
      ["Kelas", courseInfo.kelas || ""],
      [""],
      ["JENIS ASSESSMENT"],
      ...assessmentTypes.map((type) => [
        type.charAt(0).toUpperCase() + type.slice(1),
        assessmentComments[type] || "",
      ]),
      [""],
      [
        "MODE PENILAIAN",
        isGradeInputMode ? "Input Nilai Langsung" : "Input Berdasarkan CPMK",
      ],
      ["Tanggal Export", new Date().toLocaleString()],
    ];

    const courseWS = XLSX.utils.aoa_to_sheet(courseInfoData);
    XLSX.utils.book_append_sheet(wb, courseWS, "Info Mata Kuliah");

    // Sheet 2: Student Grades
    const gradeHeaders = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      ...assessmentTypes.map(
        (type) => type.charAt(0).toUpperCase() + type.slice(1)
      ),
      "Nilai Akhir",
      "Nilai Mutu",
      "Status Kelulusan",
      "Indikator",
    ];

    const gradeData = students
      .filter((student) => student.key !== "average")
      .map((student, index) => [
        index + 1,
        student.nim || "",
        student.name || "",
        ...assessmentTypes.map((type) => student[type] || 0),
        student.nilaiAkhir || 0,
        student.nilaiMutu || "",
        student.kelulusan || "",
        hasAllAssessmentScores(student)
          ? getPerformanceIndicator(student.nilaiAkhir || 0).description
          : "",
      ]);

    // Add average row
    const studentsWithCompleteScores = students.filter(hasAllAssessmentScores);
    if (studentsWithCompleteScores.length > 0) {
      const averageRow = [
        "",
        "RATA-RATA",
        "KELAS",
        ...assessmentTypes.map((type) => {
          const total = studentsWithCompleteScores.reduce(
            (sum, student) => sum + (Number(student[type]) || 0),
            0
          );
          return (
            Math.round((total / studentsWithCompleteScores.length) * 10) / 10
          );
        }),
        Math.round(
          (studentsWithCompleteScores.reduce(
            (sum, student) => sum + (student.nilaiAkhir || 0),
            0
          ) /
            studentsWithCompleteScores.length) *
            10
        ) / 10,
        "-",
        "-",
        "-",
      ];
      gradeData.push(averageRow);
    }

    const gradesWS = XLSX.utils.aoa_to_sheet([gradeHeaders, ...gradeData]);
    XLSX.utils.book_append_sheet(wb, gradesWS, "Nilai Mahasiswa");

    // Sheet 3: CPMK Analysis (if has CPMK data)
    if (relatedCPL.length > 0) {
      const cpmkHeaders = ["No", "NIM", "Nama Mahasiswa"];
      const cpmkCodes: string[] = [];

      // Build CPMK headers
      relatedCPL.forEach((cpl) => {
        const relatedCPMK = getRelatedCPMK(cpl);
        relatedCPMK.forEach((cpmk) => {
          const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
          cpmkHeaders.push(`${cpmkCode} (${cpl})`);
          cpmkCodes.push(`${cpl}_${cpmk}`);
        });
      });

      const cpmkData = students
        .filter(
          (student) =>
            student.key !== "average" && hasAllAssessmentScores(student)
        )
        .map((student, index) => {
          const row = [index + 1, student.nim || "", student.name || ""];

          // Calculate CPMK scores
          relatedCPL.forEach((cpl) => {
            const relatedCPMK = getRelatedCPMK(cpl);
            relatedCPMK.forEach((cpmk) => {
              const score = calculateCPMKScore(student, cpl, cpmk);
              row.push(Math.round(score * 10) / 10);
            });
          });

          return row;
        });

      // Add average row for CPMK
      if (cpmkData.length > 0) {
        const averageRow = ["", "RATA-RATA", "KELAS"];
        for (let i = 0; i < cpmkCodes.length; i++) {
          const total = cpmkData.reduce(
            (sum, row) => sum + ((row[i + 3] as number) || 0),
            0
          );
          //@ts-ignore
          averageRow.push(Math.round((total / cpmkData.length) * 10) / 10);
        }
        cpmkData.push(averageRow);
      }

      const cpmkWS = XLSX.utils.aoa_to_sheet([cpmkHeaders, ...cpmkData]);
      XLSX.utils.book_append_sheet(wb, cpmkWS, "Analisis CPMK");
    }

    // Sheet 4: Assessment Weights
    if (relatedCPL.length > 0) {
      const weightsData = [["BOBOT ASSESSMENT"], [""]];

      relatedCPL.forEach((cpl) => {
        const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
        weightsData.push([`CPL: ${cplCode}`, "", "", "", ""]);

        const relatedCPMK = getRelatedCPMK(cpl);
        relatedCPMK.forEach((cpmk) => {
          const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            weightsData.push([`  CPMK: ${cpmkCode}`, "", "", "", ""]);
            relatedSubCPMK.forEach((subCpmk) => {
              const subCpmkCode =
                curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
              const row = [`    Sub-CPMK: ${subCpmkCode}`];
              assessmentTypes.forEach((type) => {
                const weight =
                  //@ts-ignore
                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[type] ||
                  0;
                row.push(`${weight}%`);
              });
              weightsData.push(row);
            });
          } else {
            const row = [`  CPMK: ${cpmkCode}`];
            assessmentTypes.forEach((type) => {
              //@ts-ignore
              const weight = assessmentWeights[cpl]?.[cpmk]?.[type] || 0;
              row.push(`${weight}%`);
            });
            weightsData.push(row);
          }
        });
        weightsData.push([""]);
      });

      const weightsWS = XLSX.utils.aoa_to_sheet(weightsData);
      XLSX.utils.book_append_sheet(wb, weightsWS, "Bobot Assessment");
    }

    return wb;
  };

  const exportGradesOnly = (): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();

    const headers = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      ...assessmentTypes.map(
        (type) => type.charAt(0).toUpperCase() + type.slice(1)
      ),
      "Nilai Akhir",
      "Nilai Mutu",
      "Status Kelulusan",
    ];

    const data = students
      .filter((student) => student.key !== "average")
      .map((student, index) => [
        index + 1,
        student.nim || "",
        student.name || "",
        ...assessmentTypes.map((type) => student[type] || 0),
        student.nilaiAkhir || 0,
        student.nilaiMutu || "",
        student.kelulusan || "",
      ]);

    // Add average row
    const studentsWithCompleteScores = students.filter(hasAllAssessmentScores);
    if (studentsWithCompleteScores.length > 0) {
      const averageRow = [
        "",
        "RATA-RATA",
        "KELAS",
        ...assessmentTypes.map((type) => {
          const total = studentsWithCompleteScores.reduce(
            (sum, student) => sum + (Number(student[type]) || 0),
            0
          );
          return (
            Math.round((total / studentsWithCompleteScores.length) * 10) / 10
          );
        }),
        Math.round(
          (studentsWithCompleteScores.reduce(
            (sum, student) => sum + (student.nilaiAkhir || 0),
            0
          ) /
            studentsWithCompleteScores.length) *
            10
        ) / 10,
        "-",
        "-",
      ];
      data.push(averageRow);
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, "Nilai Mahasiswa");

    return wb;
  };

  const exportCPMKAnalysis = (): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();

    if (relatedCPL.length === 0) {
      const noDataWS = XLSX.utils.aoa_to_sheet([
        ["TIDAK ADA DATA CPMK"],
        ["Mata kuliah ini tidak memiliki data CPL/CPMK yang terkait."],
      ]);
      XLSX.utils.book_append_sheet(wb, noDataWS, "No Data");
      return wb;
    }

    // CPMK Scores Sheet
    const headers = ["No", "NIM", "Nama Mahasiswa"];
    const cpmkInfo: Array<{
      cpl: string;
      cpmk: string;
      cplCode: string;
      cpmkCode: string;
    }> = [];

    relatedCPL.forEach((cpl) => {
      const relatedCPMK = getRelatedCPMK(cpl);
      relatedCPMK.forEach((cpmk) => {
        const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
        const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
        headers.push(`${cpmkCode} (${cplCode})`);
        cpmkInfo.push({ cpl, cpmk, cplCode, cpmkCode });
      });
    });

    const data = students
      .filter(
        (student) =>
          student.key !== "average" && hasAllAssessmentScores(student)
      )
      .map((student, index) => {
        const row = [index + 1, student.nim || "", student.name || ""];

        cpmkInfo.forEach(({ cpl, cpmk }) => {
          const score = calculateCPMKScore(student, cpl, cpmk);
          row.push(Math.round(score * 10) / 10);
        });

        return row;
      });

    // Add average row for CPMK
    if (data.length > 0) {
      const averageRow = ["", "RATA-RATA", "KELAS"];
      cpmkInfo.forEach((_, index) => {
        const total = data.reduce(
          (sum, row) => sum + ((row[index + 3] as number) || 0),
          0
        );
        //@ts-ignore
        averageRow.push(Math.round((total / data.length) * 10) / 10);
      });
      data.push(averageRow);

      // Add min/max rows
      const minRow = ["", "MINIMUM", "KELAS"];
      const maxRow = ["", "MAKSIMUM", "KELAS"];

      cpmkInfo.forEach((_, index) => {
        const scores = data.slice(0, -1).map((row) => row[index + 3] as number); // exclude average row
        //@ts-ignore
        minRow.push(Math.min(...scores));
        //@ts-ignore
        maxRow.push(Math.max(...scores));
      });

      data.push(minRow, maxRow);
    }

    const cpmkWS = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, cpmkWS, "Skor CPMK");

    // Performance Indicator Sheet with statistics
    const perfHeaders = [
      "No",
      "NIM",
      "Nama Mahasiswa",
      "Nilai Akhir",
      "Indikator",
      "Level",
    ];
    const perfData = students
      .filter(
        (student) =>
          student.key !== "average" && hasAllAssessmentScores(student)
      )
      .map((student, index) => {
        const indicator = getPerformanceIndicator(student.nilaiAkhir || 0);
        return [
          index + 1,
          student.nim || "",
          student.name || "",
          student.nilaiAkhir || 0,
          indicator.description,
        ];
      });

    // Add performance statistics
    if (perfData.length > 0) {
      const finalScores = perfData.map((row) => row[3] as number);
      const avgFinal =
        finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length;
      const minFinal = Math.min(...finalScores);
      const maxFinal = Math.max(...finalScores);

      perfData.push(
        ["", "", ""],
        ["", "STATISTIK", ""],
        ["", "RATA-RATA", "", Math.round(avgFinal * 10) / 10, "", ""],
        ["", "MINIMUM", "", minFinal, "", ""],
        ["", "MAKSIMUM", "", maxFinal, "", ""]
      );
    }

    const perfWS = XLSX.utils.aoa_to_sheet([perfHeaders, ...perfData]);
    XLSX.utils.book_append_sheet(wb, perfWS, "Indikator Kinerja");

    return wb;
  };

  const exportSummaryReport = (): XLSX.WorkBook => {
    const wb = XLSX.utils.book_new();
    const studentsWithCompleteScores = students.filter(hasAllAssessmentScores);

    // Summary Statistics
    const summaryData = [
      ["LAPORAN RINGKASAN MATA KULIAH"],
      [""],
      [
        "Mata Kuliah",
        curriculumData?.mata_kuliah?.[selectedCourse]?.nama || selectedCourse,
      ],
      ["Kode", selectedCourse],
      [
        "Program Studi",
        curriculumData?.mata_kuliah?.[selectedCourse]?.prodi || "",
      ],
      ["Dosen", courseInfo.lecturer || ""],
      ["Semester", `${courseInfo.semester} - ${courseInfo.year}`],
      [""],
      ["STATISTIK KELAS"],
      ["Kelas", courseInfo.kelas || ""],
      ["Total Mahasiswa", students.length],
      ["Mahasiswa dengan Nilai Lengkap", studentsWithCompleteScores.length],
      [
        "Mahasiswa Lulus",
        studentsWithCompleteScores.filter((s) => s.kelulusan === "Lulus")
          .length,
      ],
      [
        "Mahasiswa Tidak Lulus",
        studentsWithCompleteScores.filter((s) => s.kelulusan === "Tidak Lulus")
          .length,
      ],
      [
        "Persentase Kelulusan",
        studentsWithCompleteScores.length > 0
          ? `${Math.round(
              (studentsWithCompleteScores.filter((s) => s.kelulusan === "Lulus")
                .length /
                studentsWithCompleteScores.length) *
                100
            )}%`
          : "0%",
      ],
      [""],
      ["STATISTIK NILAI ASSESSMENT"],
      ["", "Rata-rata", "Minimum", "Maksimum", "Std Deviasi"],
    ];

    // Add statistics for each assessment type
    assessmentTypes.forEach((type) => {
      if (studentsWithCompleteScores.length > 0) {
        const scores = studentsWithCompleteScores.map(
          (student) => Number(student[type]) || 0
        );
        const avg =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const min = Math.min(...scores);
        const max = Math.max(...scores);
        const variance =
          scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) /
          scores.length;
        const stdDev = Math.sqrt(variance);

        summaryData.push([
          type.charAt(0).toUpperCase() + type.slice(1),
          Math.round(avg * 10) / 10,
          min,
          max,
          Math.round(stdDev * 10) / 10,
        ]);
      }
    });

    // Add final grade statistics
    if (studentsWithCompleteScores.length > 0) {
      const finalScores = studentsWithCompleteScores.map(
        (student) => student.nilaiAkhir || 0
      );
      const avgFinal =
        finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length;
      const minFinal = Math.min(...finalScores);
      const maxFinal = Math.max(...finalScores);
      const varianceFinal =
        finalScores.reduce(
          (sum, score) => sum + Math.pow(score - avgFinal, 2),
          0
        ) / finalScores.length;
      const stdDevFinal = Math.sqrt(varianceFinal);

      summaryData.push([
        "Nilai Akhir",
        Math.round(avgFinal * 10) / 10,
        minFinal,
        maxFinal,
        Math.round(stdDevFinal * 10) / 10,
      ]);
    }

    // Grade Distribution
    summaryData.push([""], ["DISTRIBUSI NILAI MUTU"]);
    const gradeDistribution = studentsWithCompleteScores.reduce(
      (acc, student) => {
        const grade = student.nilaiMutu || "Tidak Ada";
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const gradeOrder = [
      "A",
      "A-",
      "B+",
      "B",
      "B-",
      "C+",
      "C",
      "C-",
      "D+",
      "D",
      "E",
    ];
    gradeOrder.forEach((grade) => {
      if (gradeDistribution[grade]) {
        const count = gradeDistribution[grade];
        const percentage =
          studentsWithCompleteScores.length > 0
            ? Math.round((count / studentsWithCompleteScores.length) * 100)
            : 0;
        summaryData.push([grade, count, `${percentage}%`]);
      }
    });

    // Add any remaining grades not in standard order
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      if (!gradeOrder.includes(grade)) {
        const percentage =
          studentsWithCompleteScores.length > 0
            ? Math.round((count / studentsWithCompleteScores.length) * 100)
            : 0;
        summaryData.push([grade, count, `${percentage}%`]);
      }
    });

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, "Ringkasan");

    // Add CPMK Summary if available
    if (relatedCPL.length > 0 && studentsWithCompleteScores.length > 0) {
      const cpmkSummaryData = [
        ["RINGKASAN PENCAPAIAN CPMK"],
        [""],
        [
          "CPMK",
          "Rata-rata",
          "Minimum",
          "Maksimum",
          "Std Deviasi",
          "% Lulus (≥65)",
        ],
      ];

      relatedCPL.forEach((cpl) => {
        const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
        const relatedCPMK = getRelatedCPMK(cpl);

        if (relatedCPMK.length > 0) {
          cpmkSummaryData.push([`CPL: ${cplCode}`, "", "", "", "", ""]);

          relatedCPMK.forEach((cpmk) => {
            const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
            const cpmkScores = studentsWithCompleteScores.map((student) =>
              calculateCPMKScore(student, cpl, cpmk)
            );

            if (cpmkScores.length > 0) {
              const avg =
                cpmkScores.reduce((sum, score) => sum + score, 0) /
                cpmkScores.length;
              const min = Math.min(...cpmkScores);
              const max = Math.max(...cpmkScores);
              const variance =
                cpmkScores.reduce(
                  (sum, score) => sum + Math.pow(score - avg, 2),
                  0
                ) / cpmkScores.length;
              const stdDev = Math.sqrt(variance);
              const passCount = cpmkScores.filter(
                (score) => score >= 65
              ).length;
              const passPercent = Math.round(
                (passCount / cpmkScores.length) * 100
              );

              cpmkSummaryData.push([
                `  ${cpmkCode}`,
                //@ts-ignore
                Math.round(avg * 10) / 10,
                //@ts-ignore
                Math.round(min * 10) / 10,
                //@ts-ignore
                Math.round(max * 10) / 10,
                //@ts-ignore
                Math.round(stdDev * 10) / 10,
                `${passCount}/${cpmkScores.length} (${passPercent}%)`,
              ]);
            }
          });
        }
      });

      const cpmkSummaryWS = XLSX.utils.aoa_to_sheet(cpmkSummaryData);
      XLSX.utils.book_append_sheet(wb, cpmkSummaryWS, "Ringkasan CPMK");
    }

    return wb;
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      let workbook: XLSX.WorkBook;
      let filename: string;

      switch (selectedExportType) {
        case "complete":
          workbook = exportCompleteData();
          filename = `${selectedCourse}_Data_Lengkap_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          break;
        case "grades_only":
          workbook = exportGradesOnly();
          filename = `${selectedCourse}_Nilai_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          break;
        case "cpmk_analysis":
          workbook = exportCPMKAnalysis();
          filename = `${selectedCourse}_Analisis_CPMK_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          break;
        case "summary_report":
          workbook = exportSummaryReport();
          filename = `${selectedCourse}_Laporan_Ringkasan_${
            new Date().toISOString().split("T")[0]
          }.xlsx`;
          break;
        default:
          throw new Error("Invalid export type");
      }

      XLSX.writeFile(workbook, filename);
      message.success("File Excel berhasil diunduh!");
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      message.error("Gagal mengekspor file Excel");
    } finally {
      setExporting(false);
    }
  };

  const studentsWithCompleteScores = students.filter(hasAllAssessmentScores);

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          Export Data ke Excel
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>Batal</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            disabled={!selectedExportType}
          >
            {exporting ? "Mengekspor..." : "Download Excel"}
          </Button>
        </Space>
      }
    >
      <div className="!space-y-6">
        {/* Course Info */}
        <Card size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Mata Kuliah:</Text>
              <div>
                {curriculumData?.mata_kuliah?.[selectedCourse]?.nama ||
                  selectedCourse}
              </div>
            </Col>
            <Col span={12}>
              <Text strong>Total Mahasiswa:</Text>
              <div>
                <Tag color="gray">{students.length} total</Tag>
                <Tag color="gray">
                  {studentsWithCompleteScores.length} lengkap
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Export Type Selection */}
        <div>
          <Title level={5}>Pilih Jenis Export:</Title>
          <div className="!space-y-3">
            {exportOptions.map((option) => (
              <Card
                key={option.key}
                size="small"
                className={`cursor-pointer transition-all ${
                  selectedExportType === option.key
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-400"
                }`}
                onClick={() => setSelectedExportType(option.key)}
              >
                <Row align="middle">
                  <Col span={2}>
                    <div className="text-center">{option.icon}</div>
                  </Col>
                  <Col span={20}>
                    <div>
                      <Text strong>{option.label}</Text>
                      <div className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </Col>
                  <Col span={2}>
                    <div className="text-center">
                      {selectedExportType === option.key && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </div>

        {/* Warning for incomplete data */}
        {studentsWithCompleteScores.length < students.length && (
          <Alert
            message="Peringatan Data Tidak Lengkap"
            description={`${
              students.length - studentsWithCompleteScores.length
            } mahasiswa memiliki nilai yang belum lengkap. Mereka akan tetap diekspor tetapi mungkin tidak muncul dalam perhitungan analisis.`}
            type="warning"
            showIcon
          />
        )}

        {/* No CPMK data warning */}
        {selectedExportType === "cpmk_analysis" && relatedCPL.length === 0 && (
          <Alert
            message="Tidak Ada Data CPMK"
            description="Mata kuliah ini tidak memiliki data CPL/CPMK yang terkait. Export akan menghasilkan file kosong."
            type="error"
            showIcon
          />
        )}
      </div>
    </Modal>
  );
};
