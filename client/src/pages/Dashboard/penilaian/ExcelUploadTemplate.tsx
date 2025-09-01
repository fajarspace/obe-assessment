import React, { useState } from "react";
import { Upload, Button, message, Modal, Table, Alert, Divider } from "antd";
import {
  DownloadOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import type { Student, CurriculumData, CourseInfo } from "@/types/interface";

const { Dragger } = Upload;

interface Props {
  visible: boolean;
  onClose: () => void;
  students: Student[];
  assessmentTypes: string[];
  selectedCourse: string;
  curriculumData: CurriculumData | null;
  relatedCPL: string[];
  getRelatedCPMK: (cpl: string) => string[];
  getRelatedSubCPMK: (cpmk: string) => string[];
  hasSubCPMKData: boolean;
  onDataUploaded: (students: Student[]) => void;
  courseInfo: CourseInfo;
  isGradeInputMode: boolean;
  assessmentComments: Record<string, string>;
}

export const ExcelUploadTemplate: React.FC<Props> = ({
  visible,
  onClose,
  students,
  assessmentTypes,
  selectedCourse,
  curriculumData,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
  hasSubCPMKData,
  onDataUploaded,
  courseInfo,
  isGradeInputMode,
  assessmentComments,
}) => {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Get course data
  const selectedCourseData = curriculumData?.mata_kuliah?.[selectedCourse];

  // Generate comprehensive template data
  const generateTemplateData = () => {
    // Basic headers that always exist
    const basicHeaders = ["No", "NIM", "Nama"];

    // Assessment type headers with percentage info
    const assessmentHeaders = assessmentTypes.map((type) => {
      const comment = assessmentComments[type]
        ? ` (${assessmentComments[type]})`
        : "";
      return `${type.charAt(0).toUpperCase() + type.slice(1)}${comment}`;
    });

    let allHeaders = [...basicHeaders, ...assessmentHeaders];

    // CPMK headers (only for CPMK mode)
    const cpmkHeaders: string[] = [];
    if (!isGradeInputMode && relatedCPL.length > 0) {
      relatedCPL.forEach((cpl) => {
        const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
        const relatedCPMK = getRelatedCPMK(cpl);

        relatedCPMK.forEach((cpmk) => {
          const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            // Sub-CPMK columns
            relatedSubCPMK.forEach((subCpmk) => {
              const subCpmkCode =
                curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
              assessmentTypes.forEach((type) => {
                const columnName = `${cplCode}_${cpmkCode}_${subCpmkCode}_${type.toUpperCase()}_Input`;
                cpmkHeaders.push(columnName);
              });
            });
          } else {
            // Direct CPMK columns
            assessmentTypes.forEach((type) => {
              const columnName = `${cplCode}_${cpmkCode}_${type.toUpperCase()}_Input`;
              cpmkHeaders.push(columnName);
            });
          }
        });
      });
      allHeaders.push(...cpmkHeaders);
    }

    // Create sample data rows
    const sampleData = [];
    for (let i = 1; i <= 3; i++) {
      const row: any = {
        No: i,
        NIM: `210${String(i).padStart(6, "0")}`,
        Nama: `Mahasiswa ${i}`,
      };

      // Add sample scores for assessment types
      assessmentTypes.forEach((type) => {
        const headerName = assessmentHeaders[assessmentTypes.indexOf(type)];
        if (isGradeInputMode) {
          // For grade input mode: direct assessment scores
          row[headerName] = Math.floor(Math.random() * 20) + 75; // Random 75-95
        } else {
          // For CPMK mode: calculated from CPMK inputs (will be auto-calculated)
          row[headerName] = 0; // Will be calculated from CPMK inputs
        }
      });

      // Add CPMK sample data (only for CPMK mode)
      if (!isGradeInputMode) {
        cpmkHeaders.forEach((header) => {
          row[header] = Math.floor(Math.random() * 25) + 70; // Random CPMK score 70-95
        });
      }

      sampleData.push(row);
    }

    return { headers: allHeaders, sampleData, cpmkHeaders };
  };

  // Download comprehensive template Excel
  const downloadTemplate = () => {
    const { sampleData } = generateTemplateData();
    const selectedCourseData = curriculumData?.mata_kuliah?.[selectedCourse];
    const mode = isGradeInputMode ? "Input Nilai" : "Input CPMK";

    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. INFO SHEET - Course and System Information
    const courseInfoData = [
      {
        Field: "Nama Mata Kuliah",
        Value: selectedCourseData?.nama || "Tidak tersedia",
      },
      { Field: "Kode Mata Kuliah", Value: selectedCourse || "Tidak tersedia" },
      {
        Field: "Program Studi",
        Value: selectedCourseData?.prodi || "Tidak tersedia",
      },
      {
        Field: "Deskripsi",
        Value: selectedCourseData?.deskripsi || "Tidak tersedia",
      },
      { Field: "", Value: "" }, // Separator
      { Field: "Informasi Kelas", Value: "" },
      { Field: "Semester", Value: courseInfo.semester || "Belum diatur" },
      { Field: "Tahun Akademik", Value: courseInfo.year || "Belum diatur" },
      { Field: "Dosen", Value: courseInfo.lecturer || "Belum diatur" },
      { Field: "", Value: "" }, // Separator
      { Field: "Mode Penilaian Aktif", Value: mode },
      {
        Field: "Jumlah Assessment Types",
        Value: assessmentTypes.length.toString(),
      },
      { Field: "Assessment Types", Value: assessmentTypes.join(", ") },
      { Field: "", Value: "" }, // Separator
      { Field: "CPL Terkait", Value: relatedCPL.length.toString() },
      {
        Field: "Total CPMK",
        Value: relatedCPL
          .reduce((total, cpl) => total + getRelatedCPMK(cpl).length, 0)
          .toString(),
      },
      {
        Field: "Mode Sub-CPMK",
        Value: hasSubCPMKData ? "Aktif" : "Tidak Aktif",
      },
      { Field: "", Value: "" }, // Separator
      {
        Field: "Tanggal Template",
        Value: new Date().toLocaleDateString("id-ID"),
      },
      {
        Field: "Waktu Template",
        Value: new Date().toLocaleTimeString("id-ID"),
      },
    ];

    const infoWs = XLSX.utils.json_to_sheet(courseInfoData);
    // Set column widths for info sheet
    infoWs["!cols"] = [
      { wch: 25 }, // Field
      { wch: 50 }, // Value
    ];
    XLSX.utils.book_append_sheet(wb, infoWs, "Info Mata Kuliah");

    // 2. TEMPLATE SHEET - Main data entry sheet
    const templateWs = XLSX.utils.json_to_sheet(sampleData);

    // Auto-fit columns for template
    const templateRange = XLSX.utils.decode_range(templateWs["!ref"] || "A1");
    const templateColWidths: any[] = [];
    for (let col = templateRange.s.c; col <= templateRange.e.c; col++) {
      let maxWidth = 10;
      for (let row = templateRange.s.r; row <= templateRange.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = templateWs[cellAddress];
        if (cell && cell.v) {
          const cellLength = String(cell.v).length;
          maxWidth = Math.max(maxWidth, cellLength + 2);
        }
      }
      templateColWidths[col] = { wch: Math.min(maxWidth, 35) };
    }
    templateWs["!cols"] = templateColWidths;

    XLSX.utils.book_append_sheet(wb, templateWs, `Template ${mode}`);

    // 3. INSTRUCTIONS SHEET - Detailed usage instructions
    const instructions = [
      {
        Section: "CARA PENGGUNAAN",
        Keterangan: "Panduan lengkap menggunakan template Excel ini",
        Detail: "",
      },
      { Section: "", Keterangan: "", Detail: "" },
      {
        Section: "1. INFORMASI DASAR",
        Keterangan: "Kolom wajib yang harus diisi",
        Detail: "",
      },
      {
        Section: "No",
        Keterangan: "Nomor urut mahasiswa",
        Detail: "Otomatis terisi, bisa diubah",
      },
      {
        Section: "NIM",
        Keterangan: "Nomor Induk Mahasiswa",
        Detail: "Wajib diisi, format bebas",
      },
      {
        Section: "Nama",
        Keterangan: "Nama lengkap mahasiswa",
        Detail: "Wajib diisi",
      },
      { Section: "", Keterangan: "", Detail: "" },
      {
        Section: "2. PENILAIAN ASSESSMENT",
        Keterangan: `Mode saat ini: ${mode}`,
        Detail: isGradeInputMode
          ? "Isi langsung nilai assessment (0-100)"
          : "Nilai dihitung otomatis dari input CPMK",
      },
    ];

    // Add assessment type instructions
    assessmentTypes.forEach((type) => {
      const typeName = type.charAt(0).toUpperCase() + type.slice(1);
      const comment = assessmentComments[type]
        ? ` - ${assessmentComments[type]}`
        : "";

      instructions.push({
        Section: `${typeName}`,
        Keterangan: `Nilai ${type}${comment}`,
        Detail: isGradeInputMode
          ? "Isi nilai 0-100, akan mempengaruhi nilai akhir langsung"
          : "Akan dihitung otomatis dari input CPMK di bawah",
      });
    });

    // Add CPMK instructions if in CPMK mode
    if (!isGradeInputMode && relatedCPL.length > 0) {
      instructions.push(
        { Section: "", Keterangan: "", Detail: "" },
        {
          Section: "3. INPUT CPMK",
          Keterangan: "Kolom untuk input nilai per CPMK",
          Detail: "Isi nilai 0-100 untuk setiap CPMK yang relevan",
        }
      );

      relatedCPL.forEach((cpl) => {
        const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
        const cplDesc = curriculumData?.cpl?.[cpl]?.description || "";
        const relatedCPMK = getRelatedCPMK(cpl);

        instructions.push({
          Section: `CPL: ${cplCode}`,
          Keterangan: cplDesc || "Capaian Pembelajaran Lulusan",
          Detail: `Memiliki ${relatedCPMK.length} CPMK terkait`,
        });

        relatedCPMK.forEach((cpmk) => {
          const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
          const cpmkDesc = curriculumData?.cpmk?.[cpmk]?.description || "";
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            instructions.push({
              Section: `  CPMK: ${cpmkCode}`,
              Keterangan: cpmkDesc || "Capaian Pembelajaran Mata Kuliah",
              Detail: `Memiliki ${relatedSubCPMK.length} Sub-CPMK`,
            });

            relatedSubCPMK.forEach((subCpmk) => {
              const subCpmkCode =
                curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
              const subCpmkDesc =
                curriculumData?.subcpmk?.[subCpmk]?.description || "";

              assessmentTypes.forEach((type) => {
                const columnName = `${cplCode}_${cpmkCode}_${subCpmkCode}_${type.toUpperCase()}_Input`;
                instructions.push({
                  Section: `    ${columnName}`,
                  Keterangan: `Input nilai ${subCpmkCode} untuk ${type}`,
                  Detail: `${subCpmkDesc || "Sub-CPMK"} - Nilai 0-100`,
                });
              });
            });
          } else {
            instructions.push({
              Section: `  CPMK: ${cpmkCode}`,
              Keterangan: cpmkDesc || "Capaian Pembelajaran Mata Kuliah",
              Detail: "CPMK langsung tanpa Sub-CPMK",
            });

            assessmentTypes.forEach((type) => {
              const columnName = `${cplCode}_${cpmkCode}_${type.toUpperCase()}_Input`;
              instructions.push({
                Section: `    ${columnName}`,
                Keterangan: `Input nilai ${cpmkCode} untuk ${type}`,
                Detail: `${cpmkDesc || "CPMK"} - Nilai 0-100`,
              });
            });
          }
        });
      });
    }

    // Add general instructions
    instructions.push(
      { Section: "", Keterangan: "", Detail: "" },
      {
        Section: "4. ATURAN PENTING",
        Keterangan: "Hal-hal yang harus diperhatikan",
        Detail: "",
      },
      {
        Section: "Rentang Nilai",
        Keterangan: "Semua nilai harus dalam rentang 0-100",
        Detail: "Nilai di luar rentang akan otomatis disesuaikan",
      },
      {
        Section: "Format File",
        Keterangan: "Simpan dalam format .xlsx atau .xls",
        Detail: "Jangan ubah nama sheet atau struktur kolom",
      },
      {
        Section: "Data Kosong",
        Keterangan: "Baris kosong akan diabaikan",
        Detail: "Pastikan semua data terisi dengan benar",
      },
      {
        Section: "Override Data",
        Keterangan: "Upload akan mengganti semua data existing",
        Detail: "Backup data lama jika diperlukan",
      }
    );

    const instructionWs = XLSX.utils.json_to_sheet(instructions);
    instructionWs["!cols"] = [
      { wch: 30 }, // Section
      { wch: 40 }, // Keterangan
      { wch: 50 }, // Detail
    ];
    XLSX.utils.book_append_sheet(wb, instructionWs, "Petunjuk Penggunaan");

    // 4. CPL-CPMK INFO SHEET - Detailed curriculum information
    if (relatedCPL.length > 0) {
      const cpmkInfoData: any[] = [];

      // Header information
      cpmkInfoData.push({
        Type: "INFO",
        Kode: "Struktur CPL-CPMK",
        Nama: `Mata Kuliah: ${selectedCourseData?.nama}`,
        Deskripsi: `Mode: ${
          hasSubCPMKData ? "Sub-CPMK Aktif" : "CPMK Langsung"
        }`,
        Parent: "",
        Level: "",
      });

      cpmkInfoData.push({
        Type: "",
        Kode: "",
        Nama: "",
        Deskripsi: "",
        Parent: "",
        Level: "",
      });

      relatedCPL.forEach((cpl) => {
        const cplData = curriculumData?.cpl?.[cpl];
        const relatedCPMK = getRelatedCPMK(cpl);

        cpmkInfoData.push({
          Type: "CPL",
          Kode: cplData?.kode || cpl,
          Nama: cplData?.description || "No description available",
          Deskripsi: `${relatedCPMK.length} CPMK terkait`,
          Parent: "",
          Level: "1",
        });

        relatedCPMK.forEach((cpmk) => {
          const cpmkData = curriculumData?.cpmk?.[cpmk];
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          cpmkInfoData.push({
            Type: "CPMK",
            Kode: cpmkData?.kode || cpmk,
            Nama: cpmkData?.description || "No description available",
            Deskripsi:
              hasSubCPMKData && relatedSubCPMK.length > 0
                ? `${relatedSubCPMK.length} Sub-CPMK`
                : "CPMK langsung",
            Parent: cplData?.kode || cpl,
            Level: "2",
          });

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            relatedSubCPMK.forEach((subCpmk) => {
              const subCpmkData = curriculumData?.subcpmk?.[subCpmk];
              cpmkInfoData.push({
                Type: "Sub-CPMK",
                Kode: subCpmkData?.kode || subCpmk,
                Nama: subCpmkData?.description || "No description available",
                Deskripsi: "Sub komponen CPMK",
                Parent: cpmkData?.kode || cpmk,
                Level: "3",
              });
            });
          }
        });

        // Add separator between CPLs
        cpmkInfoData.push({
          Type: "",
          Kode: "",
          Nama: "",
          Deskripsi: "",
          Parent: "",
          Level: "",
        });
      });

      const cpmkInfoWs = XLSX.utils.json_to_sheet(cpmkInfoData);
      cpmkInfoWs["!cols"] = [
        { wch: 12 }, // Type
        { wch: 15 }, // Kode
        { wch: 50 }, // Nama/Description
        { wch: 30 }, // Deskripsi
        { wch: 15 }, // Parent
        { wch: 8 }, // Level
      ];
      XLSX.utils.book_append_sheet(wb, cpmkInfoWs, "Struktur CPL-CPMK");
    }

    // 5. ASSESSMENT WEIGHTS INFO (if available)
    const weightsInfoData = [
      {
        Info: "INFORMASI BOBOT ASSESSMENT",
        Keterangan: `Mode ${mode} - ${selectedCourse}`,
        Detail: "Informasi bobot yang digunakan dalam perhitungan",
      },
      { Info: "", Keterangan: "", Detail: "" },
      {
        Info: "Mode Penilaian",
        Keterangan: mode,
        Detail: isGradeInputMode
          ? "Nilai diinput langsung per assessment type"
          : "Nilai dihitung dari input CPMK berdasarkan bobot",
      },
      {
        Info: "Assessment Types",
        Keterangan: assessmentTypes.join(", "),
        Detail: `${assessmentTypes.length} jenis penilaian`,
      },
    ];

    // Add assessment comments if available
    if (Object.keys(assessmentComments).length > 0) {
      weightsInfoData.push(
        { Info: "", Keterangan: "", Detail: "" },
        {
          Info: "KOMENTAR ASSESSMENT",
          Keterangan: "Penjelasan tambahan",
          Detail: "",
        }
      );

      assessmentTypes.forEach((type) => {
        const comment = assessmentComments[type];
        if (comment) {
          weightsInfoData.push({
            Info: type.charAt(0).toUpperCase() + type.slice(1),
            Keterangan: comment,
            Detail: "Komentar dari dosen",
          });
        }
      });
    }

    const weightsInfoWs = XLSX.utils.json_to_sheet(weightsInfoData);
    weightsInfoWs["!cols"] = [
      { wch: 25 }, // Info
      { wch: 40 }, // Keterangan
      { wch: 35 }, // Detail
    ];
    XLSX.utils.book_append_sheet(wb, weightsInfoWs, "Info Assessment");

    // Download file with comprehensive name
    const modeText = isGradeInputMode ? "InputNilai" : "InputCPMK";
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `Template_${modeText}_${selectedCourse}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);

    message.success(`Template ${mode} berhasil diunduh! File: ${fileName}`);
  };

  // Parse uploaded Excel file with better error handling
  const parseExcelFile = (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Find the template sheet (try multiple possible names)
          const possibleSheetNames = [
            `Template ${isGradeInputMode ? "Input Nilai" : "Input CPMK"}`,
            "Template Input Nilai",
            "Template Input CPMK",
            workbook.SheetNames[0], // Fallback to first sheet
          ];

          let sheetName = workbook.SheetNames[0];
          for (const possibleName of possibleSheetNames) {
            if (workbook.SheetNames.includes(possibleName)) {
              sheetName = possibleName;
              break;
            }
          }

          const worksheet = workbook.Sheets[sheetName];

          if (!worksheet) {
            throw new Error("Tidak dapat menemukan sheet template yang valid");
          }

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            throw new Error("File Excel tidak memiliki data yang cukup");
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          // Validate basic required headers
          const requiredBasicHeaders = ["No", "NIM", "Nama"];
          // const requiredAssessmentHeaders = assessmentTypes.map(
          //   (type) => type.charAt(0).toUpperCase() + type.slice(1)
          // );

          // Check for basic headers
          const missingBasicHeaders = requiredBasicHeaders.filter(
            (header) =>
              !headers.some((h) =>
                h?.toString().toLowerCase().includes(header.toLowerCase())
              )
          );

          if (missingBasicHeaders.length > 0) {
            throw new Error(
              `Header dasar yang hilang: ${missingBasicHeaders.join(", ")}`
            );
          }

          // Find header indices
          const getHeaderIndex = (searchTerms: string[]): number => {
            for (const term of searchTerms) {
              const index = headers.findIndex((h) =>
                h?.toString().toLowerCase().includes(term.toLowerCase())
              );
              if (index !== -1) return index;
            }
            return -1;
          };

          const noIndex = getHeaderIndex(["no"]);
          const nimIndex = getHeaderIndex(["nim"]);
          const namaIndex = getHeaderIndex(["nama", "name"]);

          if (noIndex === -1 || nimIndex === -1 || namaIndex === -1) {
            throw new Error("Tidak dapat menemukan kolom No, NIM, atau Nama");
          }

          // Get assessment type indices
          const assessmentIndices: Record<string, number> = {};
          assessmentTypes.forEach((type) => {
            const index = getHeaderIndex([type]);
            if (index !== -1) {
              assessmentIndices[type] = index;
            }
          });

          // Parse student data
          const parsedStudents: Student[] = rows
            .filter((row) => {
              // Filter out empty rows
              return (
                row &&
                row.some(
                  (cell) => cell !== null && cell !== undefined && cell !== ""
                )
              );
            })

            .map((row, index) => {
              const student: Student = {
                key: `student-${index + 1}`,
                no: Number(row[noIndex]) || index + 1,
                nim: String(row[nimIndex] || "").trim(),
                name: String(row[namaIndex] || "").trim(),
                nilaiAkhir: 0,
                nilaiMutu: "",
                kelulusan: "",
              };

              // Add assessment scores
              assessmentTypes.forEach((type) => {
                const colIndex = assessmentIndices[type];
                if (colIndex !== -1 && row[colIndex] !== undefined) {
                  const score = Number(row[colIndex]) || 0;
                  student[type] = Math.min(100, Math.max(0, score)); // Clamp 0-100
                } else {
                  student[type] = 0;
                }
              });

              // Add CPMK scores if in CPMK mode
              if (!isGradeInputMode) {
                headers.forEach((header, headerIndex) => {
                  if (
                    header &&
                    headerIndex > Math.max(noIndex, nimIndex, namaIndex)
                  ) {
                    const headerStr = String(header).trim();

                    // Check if this is a CPMK input column
                    if (
                      headerStr.includes("_Input") ||
                      headerStr.includes("_input")
                    ) {
                      const score = Number(row[headerIndex]) || 0;
                      if (score > 0) {
                        // Store both the input value and the percentage value
                        const baseKey = headerStr
                          .replace(/_Input$/, "")
                          .replace(/_input$/, "");
                        student[`${baseKey}_percentage`] = Math.min(
                          100,
                          Math.max(0, score)
                        );
                        student[headerStr] = Math.min(100, Math.max(0, score));
                      }
                    }
                  }
                });
              }

              // Initialize other required fields
              assessmentTypes.forEach((type) => {
                student[`${type}Komentar`] = "";
              });

              return student;
            })
            .filter((student) => student.nim || student.name); // Keep only students with NIM or Name

          if (parsedStudents.length === 0) {
            throw new Error("Tidak ada data mahasiswa yang valid ditemukan");
          }

          resolve(parsedStudents);
        } catch (error) {
          console.error("Excel parsing error:", error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Gagal membaca file Excel"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    try {
      const parsedData = await parseExcelFile(file);
      setPreviewData(parsedData);
      setShowPreview(true);
      message.success(
        `Berhasil membaca ${parsedData.length} data mahasiswa dari file Excel`
      );
    } catch (error) {
      console.error("Upload error:", error);
      message.error(
        error instanceof Error ? error.message : "Gagal mengupload file Excel"
      );
    }
    return false; // Prevent default upload
  };

  // Confirm data upload
  const confirmUpload = () => {
    onDataUploaded(previewData);
    setPreviewData([]);
    setShowPreview(false);
    onClose();
    message.success("Data berhasil diimport ke sistem penilaian!");
  };

  // Preview table columns
  const previewColumns = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 60,
      fixed: "left" as const,
    },
    {
      title: "NIM",
      dataIndex: "nim",
      key: "nim",
      width: 120,
      fixed: "left" as const,
    },
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      width: 200,
      fixed: "left" as const,
    },
    // Assessment type columns
    ...assessmentTypes.map((type) => ({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      dataIndex: type,
      key: type,
      width: 80,
      render: (value: number) => (
        <span
          className={value > 0 ? "text-green-600 font-medium" : "text-gray-400"}
        >
          {value || 0}
        </span>
      ),
    })),
  ];

  const currentMode = isGradeInputMode ? "Input Nilai" : "Input CPMK";
  const modeDescription = isGradeInputMode
    ? "Nilai assessment langsung diinput dan mempengaruhi hasil akhir"
    : "Nilai assessment dihitung otomatis dari input nilai CPMK";

  return (
    <>
      <Modal
        title={
          <div>
            <div className="text-lg font-semibold">
              Upload Data Penilaian Excel
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Mode:{" "}
              <span className="font-medium text-blue-600">{currentMode}</span>
            </div>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="cancel" onClick={onClose}>
            Batal
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
          >
            Download Template
          </Button>,
        ]}
        width={900}
        destroyOnClose
      >
        <div className="space-y-4">
          {/* Mode Information */}
          <Alert
            message={`Template Mode: ${currentMode}`}
            description={modeDescription}
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
          />

          {/* Course Information */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Mata Kuliah:</strong>{" "}
                {selectedCourseData?.nama || selectedCourse}
              </div>
              <div>
                <strong>Kode:</strong> {selectedCourse}
              </div>
              <div>
                <strong>Assessment Types:</strong> {assessmentTypes.join(", ")}
              </div>
              <div>
                <strong>CPL Terkait:</strong> {relatedCPL.length} CPL
              </div>
            </div>
          </div>

          {/* Instructions */}
          <Alert
            message="Cara Upload Data Penilaian"
            description={
              <div className="space-y-3">
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    Download template Excel dengan klik tombol "Download
                    Template"
                  </li>
                  <li>
                    Buka file template dan lihat sheet "Info Mata Kuliah" untuk
                    informasi lengkap
                  </li>
                  <li>Isi data mahasiswa di sheet "Template {currentMode}"</li>
                  <li>
                    <strong>Kolom Wajib:</strong> No, NIM, Nama,{" "}
                    {assessmentTypes.join(", ")}
                  </li>
                  {!isGradeInputMode && (
                    <li>
                      <strong>Kolom CPMK:</strong> Isi nilai CPMK 0-100, nilai
                      assessment akan dihitung otomatis
                    </li>
                  )}
                  <li>Simpan file dalam format .xlsx</li>
                  <li>Upload file Excel yang sudah diisi</li>
                </ol>

                <Divider style={{ margin: "12px 0" }} />

                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-medium text-blue-800 mb-2">
                    Template terdiri dari 5+ sheet:
                  </div>
                  <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                    <li>
                      <strong>Info Mata Kuliah:</strong> Informasi lengkap
                      course dan sistem
                    </li>
                    <li>
                      <strong>Template {currentMode}:</strong> Sheet utama untuk
                      input data
                    </li>
                    <li>
                      <strong>Petunjuk Penggunaan:</strong> Panduan detail
                      setiap kolom
                    </li>
                    <li>
                      <strong>Struktur CPL-CPMK:</strong> Penjelasan hierarki
                      pembelajaran
                    </li>
                    <li>
                      <strong>Info Assessment:</strong> Detail bobot dan
                      komentar
                    </li>
                  </ul>
                </div>

                {relatedCPL.length > 0 && (
                  <div className="bg-green-50 p-3 rounded">
                    <div className="font-medium text-green-800">
                      Struktur CPMK:
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      {hasSubCPMKData
                        ? "Mode Sub-CPMK aktif"
                        : "Mode CPMK langsung"}{" "}
                      |{relatedCPL.length} CPL |
                      {relatedCPL.reduce(
                        (total, cpl) => total + getRelatedCPMK(cpl).length,
                        0
                      )}{" "}
                      CPMK
                    </div>
                  </div>
                )}
              </div>
            }
            type="info"
            showIcon
          />

          {/* Upload Area */}
          <Dragger
            name="excel"
            multiple={false}
            accept=".xlsx,.xls"
            beforeUpload={handleUpload}
            showUploadList={false}
            className="border-2 border-dashed"
          >
            <p className="ant-upload-drag-icon">
              <FileExcelOutlined className="text-4xl" />
            </p>
            <p className="ant-upload-text text-lg">
              Klik atau drag file Excel ke area ini untuk upload
            </p>
            <p className="ant-upload-hint">
              Hanya menerima file .xlsx dan .xls | Template mode: {currentMode}
            </p>
          </Dragger>

          {/* Warning for existing data */}
          {students.length > 0 && (
            <Alert
              message={`Perhatian: Data Existing`}
              description={`Saat ini sudah ada ${students.length} data mahasiswa. Upload data baru akan mengganti SEMUA data yang ada saat ini.`}
              type="warning"
              showIcon
            />
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={`Preview Data Upload - ${previewData.length} Mahasiswa`}
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowPreview(false)}>
            Batal
          </Button>,
          <Button key="confirm" type="primary" onClick={confirmUpload}>
            Konfirmasi Import Data
          </Button>,
        ]}
        width={1200}
        destroyOnClose
      >
        <div className="space-y-4">
          <Alert
            message="Preview Data Upload"
            description={`Data di bawah ini akan mengganti ${students.length} data mahasiswa yang sudah ada. Periksa dengan teliti sebelum mengkonfirmasi.`}
            type="info"
            showIcon
          />

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Mode Template:</strong> {currentMode} |
            <strong> Assessment Types:</strong> {assessmentTypes.join(", ")} |
            <strong> Data Valid:</strong> {previewData.length} mahasiswa
          </div>

          <Table
            columns={previewColumns}
            dataSource={previewData}
            rowKey="key"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 800, y: 400 }}
            size="small"
            bordered
          />
        </div>
      </Modal>
    </>
  );
};
