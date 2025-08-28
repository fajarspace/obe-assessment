import React, { useState } from "react";
import { Upload, Button, message, Modal, Table, Alert } from "antd";
import { DownloadOutlined, FileExcelOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import type { Student, CurriculumData } from "@/types/interface";

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
}) => {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Generate template data
  const generateTemplateData = () => {
    const headers = ["No", "NIM", "Nama"];

    // Add assessment type headers
    assessmentTypes.forEach((type) => {
      headers.push(type.charAt(0).toUpperCase() + type.slice(1));
    });

    // Add CPMK headers if available
    const cpmkHeaders: string[] = [];
    if (relatedCPL.length > 0) {
      relatedCPL.forEach((cpl) => {
        const relatedCPMK = getRelatedCPMK(cpl);
        relatedCPMK.forEach((cpmk) => {
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);
          const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            // Add Sub-CPMK columns for each assessment type
            relatedSubCPMK.forEach((subCpmk) => {
              const subCpmkCode =
                curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
              assessmentTypes.forEach((type) => {
                const columnName = `${cpmkCode}_${subCpmkCode}_${type.toUpperCase()}`;
                cpmkHeaders.push(columnName);
              });
            });
          } else {
            // Add CPMK columns for each assessment type
            assessmentTypes.forEach((type) => {
              const columnName = `${cpmkCode}_${type.toUpperCase()}`;
              cpmkHeaders.push(columnName);
            });
          }
        });
      });
    }

    headers.push(...cpmkHeaders);

    // Create sample data rows
    const sampleData = [];
    for (let i = 1; i <= 5; i++) {
      const row: any = {
        No: i,
        NIM: `210${String(i).padStart(6, "0")}`,
        Nama: `Mahasiswa ${i}`,
      };

      // Add sample scores for each assessment type
      assessmentTypes.forEach((type) => {
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        row[typeName] = Math.floor(Math.random() * 40) + 60; // Random score 60-100
      });

      // Add sample CPMK scores
      cpmkHeaders.forEach((header) => {
        row[header] = Math.floor(Math.random() * 30) + 70; // Random CPMK score 70-100
      });

      sampleData.push(row);
    }

    return { headers, sampleData };
  };

  // Download template Excel
  const downloadTemplate = () => {
    const { sampleData } = generateTemplateData();

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create template sheet
    const templateWs = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, templateWs, "Template Penilaian");

    // Create instruction sheet
    const instructions = [
      { Kolom: "No", Deskripsi: "Nomor urut mahasiswa (otomatis)" },
      { Kolom: "NIM", Deskripsi: "Nomor Induk Mahasiswa" },
      { Kolom: "Nama", Deskripsi: "Nama lengkap mahasiswa" },
      ...assessmentTypes.map((type) => ({
        Kolom: type.charAt(0).toUpperCase() + type.slice(1),
        Deskripsi: `Nilai ${type} (0-100)`,
      })),
    ];

    // Add CPMK instructions if available
    if (relatedCPL.length > 0) {
      instructions.push({
        Kolom: "--- CPMK COLUMNS ---",
        Deskripsi: "Kolom dibawah ini untuk nilai CPMK (opsional)",
      });

      relatedCPL.forEach((cpl) => {
        const relatedCPMK = getRelatedCPMK(cpl);
        relatedCPMK.forEach((cpmk) => {
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);
          const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            relatedSubCPMK.forEach((subCpmk) => {
              const subCpmkCode =
                curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
              assessmentTypes.forEach((type) => {
                const columnName = `${cpmkCode}_${subCpmkCode}_${type.toUpperCase()}`;
                instructions.push({
                  Kolom: columnName,
                  Deskripsi: `Nilai ${subCpmkCode} untuk assessment ${type} (0-100)`,
                });
              });
            });
          } else {
            assessmentTypes.forEach((type) => {
              const columnName = `${cpmkCode}_${type.toUpperCase()}`;
              instructions.push({
                Kolom: columnName,
                Deskripsi: `Nilai ${cpmkCode} untuk assessment ${type} (0-100)`,
              });
            });
          }
        });
      });
    }

    const instructionWs = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, instructionWs, "Petunjuk");

    // Create CPMK info sheet if available
    if (relatedCPL.length > 0) {
      const cpmkInfo: any[] = [];

      relatedCPL.forEach((cpl) => {
        const cplData = curriculumData?.cpl?.[cpl];
        const relatedCPMK = getRelatedCPMK(cpl);

        cpmkInfo.push({
          Type: "CPL",
          Kode: cplData?.kode || cpl,
          Deskripsi: cplData?.description || "No description",
          Parent: "",
        });

        relatedCPMK.forEach((cpmk) => {
          const cpmkData = curriculumData?.cpmk?.[cpmk];
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          cpmkInfo.push({
            Type: "CPMK",
            Kode: cpmkData?.kode || cpmk,
            Deskripsi: cpmkData?.description || "No description",
            Parent: cplData?.kode || cpl,
          });

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            relatedSubCPMK.forEach((subCpmk) => {
              const subCpmkData = curriculumData?.subcpmk?.[subCpmk];
              cpmkInfo.push({
                Type: "Sub-CPMK",
                Kode: subCpmkData?.kode || subCpmk,
                Deskripsi: subCpmkData?.description || "No description",
                Parent: cpmkData?.kode || cpmk,
              });
            });
          }
        });
      });

      const cpmkInfoWs = XLSX.utils.json_to_sheet(cpmkInfo);
      XLSX.utils.book_append_sheet(wb, cpmkInfoWs, "Info CPL-CPMK");
    }

    // Download file
    const fileName = `Template_Penilaian_${selectedCourse}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(wb, fileName);

    message.success("Template berhasil diunduh!");
  };

  // Parse uploaded Excel file
  const parseExcelFile = (file: File): Promise<Student[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get first worksheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            throw new Error("File Excel tidak memiliki data yang cukup");
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];

          // Validate required headers
          const requiredHeaders = [
            "No",
            "NIM",
            "Nama",
            ...assessmentTypes.map(
              (type) => type.charAt(0).toUpperCase() + type.slice(1)
            ),
          ];

          const missingRequiredHeaders = requiredHeaders.filter(
            (header) =>
              !headers.some(
                (h) => h?.toString().toLowerCase() === header.toLowerCase()
              )
          );

          if (missingRequiredHeaders.length > 0) {
            throw new Error(
              `Header wajib yang hilang: ${missingRequiredHeaders.join(", ")}`
            );
          }

          // Parse student data
          const parsedStudents: Student[] = rows
            .filter((row) =>
              row.some(
                (cell) => cell !== null && cell !== undefined && cell !== ""
              )
            )
            .map((row, index) => {
              //@ts-ignore
              const student: Student = {
                key: `student-${index + 1}`,
                no: Number(row[0]) || index + 1,
                nim: String(row[1] || "").trim(),
                name: String(row[2] || "").trim(),
                nilaiAkhir: 0,
                nilaiMutu: "",
                kelulusan: "",
              };

              // Add assessment scores
              assessmentTypes.forEach((type, typeIndex) => {
                const scoreIndex = 3 + typeIndex; // No, NIM, Nama = 3 columns
                const score = Number(row[scoreIndex]) || 0;
                student[type] = Math.min(100, Math.max(0, score)); // Clamp between 0-100
              });

              // Add CPMK scores if available
              headers.forEach((header, headerIndex) => {
                if (headerIndex > 2 + assessmentTypes.length) {
                  // Skip basic info + assessment types
                  const headerStr = String(header || "").trim();

                  // Check if this is a CPMK column
                  const isCpmkColumn = relatedCPL.some((cpl) => {
                    const relatedCPMK = getRelatedCPMK(cpl);
                    return relatedCPMK.some((cpmk) => {
                      const cpmkCode =
                        curriculumData?.cpmk?.[cpmk]?.kode || cpmk;

                      if (hasSubCPMKData) {
                        const relatedSubCPMK = getRelatedSubCPMK(cpmk);
                        return relatedSubCPMK.some((subCpmk) => {
                          const subCpmkCode =
                            curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
                          return assessmentTypes.some((type) =>
                            headerStr.includes(
                              `${cpmkCode}_${subCpmkCode}_${type.toUpperCase()}`
                            )
                          );
                        });
                      } else {
                        return assessmentTypes.some((type) =>
                          headerStr.includes(
                            `${cpmkCode}_${type.toUpperCase()}`
                          )
                        );
                      }
                    });
                  });

                  if (isCpmkColumn) {
                    const score = Number(row[headerIndex]) || 0;
                    student[headerStr] = Math.min(100, Math.max(0, score));
                  }
                }
              });

              return student;
            });

          resolve(parsedStudents);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file upload
  const handleUpload = async (file: File) => {
    try {
      const parsedData = await parseExcelFile(file);
      setPreviewData(parsedData);
      setShowPreview(true);
      message.success(`Berhasil membaca ${parsedData.length} data mahasiswa`);
    } catch (error) {
      console.error("Upload error:", error);
      message.error(
        error instanceof Error ? error.message : "Gagal mengupload file"
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
    message.success("Data berhasil diimport ke tabel penilaian!");
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
          {value}
        </span>
      ),
    })),
    // CPMK columns if available
    ...(relatedCPL.length > 0
      ? [
          {
            title: "CPMK Scores",
            children: (() => {
              const cpmkColumns: any[] = [];

              relatedCPL.forEach((cpl) => {
                const relatedCPMK = getRelatedCPMK(cpl);
                relatedCPMK.forEach((cpmk) => {
                  const relatedSubCPMK = getRelatedSubCPMK(cpmk);
                  const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;

                  if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                    relatedSubCPMK.forEach((subCpmk) => {
                      const subCpmkCode =
                        curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk;
                      assessmentTypes.forEach((type) => {
                        const columnName = `${cpmkCode}_${subCpmkCode}_${type.toUpperCase()}`;
                        cpmkColumns.push({
                          title: `${subCpmkCode}(${type})`,
                          dataIndex: columnName,
                          key: columnName,
                          width: 80,
                          render: (value: number) => (
                            <span
                              className={
                                value > 0
                                  ? "text-blue-600 font-medium text-xs"
                                  : "text-gray-400 text-xs"
                              }
                            >
                              {value || "-"}
                            </span>
                          ),
                        });
                      });
                    });
                  } else {
                    assessmentTypes.forEach((type) => {
                      const columnName = `${cpmkCode}_${type.toUpperCase()}`;
                      cpmkColumns.push({
                        title: `${cpmkCode}(${type})`,
                        dataIndex: columnName,
                        key: columnName,
                        width: 80,
                        render: (value: number) => (
                          <span
                            className={
                              value > 0
                                ? "text-blue-600 font-medium text-xs"
                                : "text-gray-400 text-xs"
                            }
                          >
                            {value || "-"}
                          </span>
                        ),
                      });
                    });
                  }
                });
              });

              return cpmkColumns;
            })(),
          },
        ]
      : []),
  ];

  return (
    <>
      <Modal
        title="Upload Data Penilaian Excel"
        open={visible}
        onCancel={onClose}
        footer={[
          <Button key="cancel" onClick={onClose}>
            Batal
          </Button>,
          <Button
            key="download"
            type="default"
            icon={<DownloadOutlined />}
            onClick={downloadTemplate}
          >
            Download Template
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        <div className="!space-y-4">
          <Alert
            message="Cara Upload Data Penilaian"
            description={
              <div>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>
                    Download template Excel dengan klik tombol "Download
                    Template"
                  </li>
                  <li>Isi data mahasiswa sesuai format template</li>
                  <li>
                    Kolom wajib: No, NIM, Nama, {assessmentTypes.join(", ")}
                  </li>
                  <li>Kolom opsional: Kolom CPMK untuk input nilai per CPMK</li>
                  <li>Nilai harus dalam rentang 0-100</li>
                  <li>Upload file Excel yang sudah diisi</li>
                </ol>
                {relatedCPL.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">
                      Template CPMK:
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Template akan menyertakan kolom untuk setiap CPMK/Sub-CPMK
                      berdasarkan assessment types. Kolom CPMK bersifat opsional
                      - jika diisi, nilai akan langsung dimasukkan ke tabel
                      penilaian.
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      {hasSubCPMKData
                        ? "Mode Sub-CPMK aktif"
                        : "Mode CPMK aktif"}{" "}
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

          <Dragger
            name="excel"
            multiple={false}
            accept=".xlsx,.xls"
            beforeUpload={handleUpload}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <FileExcelOutlined />
            </p>
            <p className="ant-upload-text">
              Klik atau drag file Excel ke area ini untuk upload
            </p>
            <p className="ant-upload-hint">Support format: .xlsx, .xls</p>
          </Dragger>
          <br />
          {students.length > 0 && (
            <Alert
              message={`Saat ini sudah ada ${students.length} data mahasiswa. Upload data baru akan mengganti semua data yang ada.`}
              type="warning"
              showIcon
            />
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={`Preview Data - ${previewData.length} Mahasiswa`}
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowPreview(false)}>
            Batal
          </Button>,
          <Button key="confirm" type="primary" onClick={confirmUpload}>
            Import Data
          </Button>,
        ]}
        width={1000}
      >
        <div className="space-y-4">
          <Alert
            message="Preview Data Upload"
            description="Periksa data di bawah ini sebelum mengimport. Data ini akan mengganti semua data mahasiswa yang ada."
            type="info"
            showIcon
          />

          <Table
            columns={previewColumns}
            dataSource={previewData}
            rowKey="key"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
            size="small"
            bordered
          />
        </div>
      </Modal>
    </>
  );
};
