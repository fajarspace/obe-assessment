import React from "react";
import { Button, message, Dropdown, Menu } from "antd";
import { DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import type {
  Student,
  AssessmentWeights,
  CurriculumData,
} from "@/types/interface";
import { getPerformanceIndicator } from "./helper";

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
  calculateAverage: (field: string) => number;
}

export const ExcelExportComponent: React.FC<Props> = ({
  students,
  assessmentWeights,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
  curriculumData,
  hasSubCPMKData,
  assessmentTypes,
  selectedCourse,
  calculateAverage,
}) => {
  const calculateCPMKScore = (
    student: Student,
    cpl: string,
    cpmk: string,
    assessmentType: string,
    subCpmk?: string
  ): number => {
    let weight = 0;

    if (subCpmk) {
      weight =
        //@ts-ignore
        assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[assessmentType] ||
        0;
    } else {
      //@ts-ignore
      weight = assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
    }

    const assessmentScore = Number(student[assessmentType]) || 0;
    return Math.round(((assessmentScore * weight) / 100) * 10) / 10;
  };

  const exportBasicGrades = () => {
    try {
      const exportData = students.map((student) => {
        const row: any = {
          No: student.no,
          NIM: student.nim,
          Nama: student.name,
        };

        // Add assessment scores
        assessmentTypes.forEach((type) => {
          const typeName = type.charAt(0).toUpperCase() + type.slice(1);
          row[typeName] = student[type] || 0;
        });

        // Add final results
        row["Nilai Akhir"] = student.nilaiAkhir || 0;
        row["Grade"] = student.nilaiMutu || "";
        row["Status"] = student.kelulusan || "";

        // Add performance indicator
        if (student.nilaiAkhir) {
          const indicator = getPerformanceIndicator(student.nilaiAkhir);
          row["Indikator"] = indicator.label;
          row["Deskripsi Indikator"] = indicator.description;
        }

        return row;
      });

      // Add average row
      const averageRow: any = {
        No: "",
        NIM: "",
        Nama: "RATA-RATA KELAS",
      };

      assessmentTypes.forEach((type) => {
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        averageRow[typeName] = calculateAverage(type);
      });

      averageRow["Nilai Akhir"] = calculateAverage("nilaiAkhir");
      averageRow["Grade"] = "";
      averageRow["Status"] = "";

      if (averageRow["Nilai Akhir"] > 0) {
        const indicator = getPerformanceIndicator(averageRow["Nilai Akhir"]);
        averageRow["Indikator"] = indicator.label;
        averageRow["Deskripsi Indikator"] = indicator.description;
      }

      exportData.push(averageRow);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 5 }, // No
        { wch: 15 }, // NIM
        { wch: 25 }, // Nama
        ...assessmentTypes.map(() => ({ wch: 10 })), // Assessment types
        { wch: 12 }, // Nilai Akhir
        { wch: 8 }, // Grade
        { wch: 12 }, // Status
        { wch: 10 }, // Indikator
        { wch: 20 }, // Deskripsi Indikator
      ];
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Nilai Mahasiswa");

      const fileName = `Nilai_${selectedCourse}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success("Data nilai berhasil diekspor!");
    } catch (error) {
      message.error("Gagal mengekspor data");
      console.error("Export error:", error);
    }
  };

  const exportDetailedGrades = () => {
    try {
      const exportData = students.map((student) => {
        const row: any = {
          No: student.no,
          NIM: student.nim,
          Nama: student.name,
        };

        // Add assessment scores
        assessmentTypes.forEach((type) => {
          const typeName = type.charAt(0).toUpperCase() + type.slice(1);
          row[typeName] = student[type] || 0;
        });

        // Add CPMK scores if available
        if (relatedCPL.length > 0) {
          relatedCPL.forEach((cpl) => {
            const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
            const relatedCPMK = getRelatedCPMK(cpl);

            relatedCPMK.forEach((cpmk) => {
              const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
              const relatedSubCPMK = getRelatedSubCPMK(cpmk);

              assessmentTypes.forEach((assessmentType) => {
                if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                  relatedSubCPMK.forEach((subCpmk) => {
                    const subCpmkCode =
                      curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
                    const columnName = `${assessmentType.toUpperCase()}_${cplCode}_${cpmkCode}_${subCpmkCode}`;
                    const score = calculateCPMKScore(
                      student,
                      cpl,
                      cpmk,
                      assessmentType,
                      subCpmk
                    );
                    row[columnName] = score;
                  });
                } else {
                  const columnName = `${assessmentType.toUpperCase()}_${cplCode}_${cpmkCode}`;
                  const score = calculateCPMKScore(
                    student,
                    cpl,
                    cpmk,
                    assessmentType
                  );
                  row[columnName] = score;
                }
              });
            });
          });
        }

        // Add final results
        row["Nilai Akhir"] = student.nilaiAkhir || 0;
        row["Grade"] = student.nilaiMutu || "";
        row["Status"] = student.kelulusan || "";

        // Add performance indicator
        if (student.nilaiAkhir) {
          const indicator = getPerformanceIndicator(student.nilaiAkhir);
          row["Indikator"] = indicator.label;
          row["Deskripsi Indikator"] = indicator.description;
        }

        return row;
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-fit columns
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      const colWidths: any[] = [];

      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 10;
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, cellLength + 2);
          }
        }
        colWidths[col] = { wch: Math.min(maxWidth, 30) };
      }
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Nilai Detail");

      const fileName = `Nilai_Detail_${selectedCourse}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success("Data nilai detail berhasil diekspor!");
    } catch (error) {
      message.error("Gagal mengekspor data detail");
      console.error("Export error:", error);
    }
  };

  const exportSummaryReport = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary Statistics
      const summaryData = [
        { Statistik: "Total Mahasiswa", Nilai: students.length },
        {
          Statistik: "Rata-rata Nilai Akhir",
          Nilai: calculateAverage("nilaiAkhir"),
        },
        {
          Statistik: "Mahasiswa Lulus",
          Nilai: students.filter((s) => s.kelulusan === "Lulus").length,
        },
        {
          Statistik: "Mahasiswa Tidak Lulus",
          Nilai: students.filter((s) => s.kelulusan === "Tidak Lulus").length,
        },
        {
          Statistik: "Persentase Kelulusan",
          Nilai: `${Math.round(
            (students.filter((s) => s.kelulusan === "Lulus").length /
              students.length) *
              100
          )}%`,
        },
      ];

      assessmentTypes.forEach((type) => {
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        summaryData.push({
          Statistik: `Rata-rata ${typeName}`,
          Nilai: calculateAverage(type),
        });
      });

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

      // Sheet 2: Grade Distribution
      const gradeDistribution = [
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
      ].map((grade) => ({
        Grade: grade,
        Jumlah: students.filter((s) => s.nilaiMutu === grade).length,
        Persentase: `${Math.round(
          (students.filter((s) => s.nilaiMutu === grade).length /
            students.length) *
            100
        )}%`,
      }));

      const gradeWs = XLSX.utils.json_to_sheet(gradeDistribution);
      XLSX.utils.book_append_sheet(wb, gradeWs, "Distribusi Grade");

      // Sheet 3: Performance Indicator Distribution
      const indicatorDistribution = [0, 1, 2, 3, 4].map((level) => {
        const indicator = getPerformanceIndicator(
          level === 4
            ? 85
            : level === 3
            ? 70
            : level === 2
            ? 55
            : level === 1
            ? 45
            : 20
        );
        return {
          Level: level,
          Deskripsi: indicator.description,
          Jumlah: students.filter((s) => {
            if (s.nilaiAkhir) {
              const studentIndicator = getPerformanceIndicator(s.nilaiAkhir);
              return studentIndicator.label === level;
            }
            return false;
          }).length,
          Persentase: `${Math.round(
            (students.filter((s) => {
              if (s.nilaiAkhir) {
                const studentIndicator = getPerformanceIndicator(s.nilaiAkhir);
                return studentIndicator.label === level;
              }
              return false;
            }).length /
              students.length) *
              100
          )}%`,
        };
      });

      const indicatorWs = XLSX.utils.json_to_sheet(indicatorDistribution);
      XLSX.utils.book_append_sheet(wb, indicatorWs, "Distribusi Indikator");

      const fileName = `Laporan_${selectedCourse}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success("Laporan ringkasan berhasil diekspor!");
    } catch (error) {
      message.error("Gagal mengekspor laporan");
      console.error("Export error:", error);
    }
  };

  const menu = (
    <Menu>
      <Menu.Item
        key="basic"
        icon={<FileExcelOutlined />}
        onClick={exportBasicGrades}
      >
        Ekspor Nilai Dasar
      </Menu.Item>
      <Menu.Item
        key="detailed"
        icon={<FileExcelOutlined />}
        onClick={exportDetailedGrades}
      >
        Ekspor Nilai Detail (dengan CPMK)
      </Menu.Item>
      <Menu.Item
        key="summary"
        icon={<FileExcelOutlined />}
        onClick={exportSummaryReport}
      >
        Ekspor Laporan Ringkasan
      </Menu.Item>
    </Menu>
  );

  if (students.length === 0) {
    return null;
  }

  return (
    <Dropdown overlay={menu} placement="bottomLeft">
      <Button
        icon={<DownloadOutlined />}
        type="primary"
        size="small"
        className="bg-green-600 hover:bg-green-700 border-green-600"
      >
        Export Excel
      </Button>
    </Dropdown>
  );
};
