// import React, { useState, useEffect } from "react";
// import {
//   Table,
//   Input,
//   Button,
//   Card,
//   Select,
//   Switch,
//   Tabs,
//   Alert,
//   Tag,
//   Spin,
//   message,
//   Typography,
//   Row,
//   Col,
//   Space,
//   Statistic,
//   Badge,
// } from "antd";
// import {
//   PlusOutlined,
//   PrinterOutlined,
//   BarChartOutlined,
//   TableOutlined,
//   SettingOutlined,
//   ExclamationCircleOutlined,
//   InfoCircleOutlined,
//   ReloadOutlined,
// } from "@ant-design/icons";

// const { Title, Text } = Typography;
// const { TabPane } = Tabs;
// const { Option } = Select;

// // Enhanced Types with Sub-CPMK support
// interface Student {
//   key: string;
//   no: number;
//   nim: string;
//   name: string;
//   tugas: number;
//   kuis: number;
//   uts: number;
//   uas: number;
//   nilaiAkhir?: number;
//   nilaiMutu?: string;
//   kelulusan?: string;
//   [key: string]: string | number | undefined;
// }

// // Enhanced Assessment Weights - supports both CPMK and Sub-CPMK modes
// interface AssessmentWeights {
//   [cpl: string]: {
//     [cpmk: string]: {
//       tugas: number;
//       kuis: number;
//       uts: number;
//       uas: number;
//       // Sub-CPMK weights (if available)
//       subcpmk?: {
//         [subCpmk: string]: {
//           tugas: number;
//           kuis: number;
//           uts: number;
//           uas: number;
//         };
//       };
//     };
//   };
// }

// interface CourseInfo {
//   semester: number;
//   year: string;
//   lecturer: string;
// }

// interface SubCPMK {
//   id: string;
//   kode: string;
//   description: string;
//   cpmkId: string;
// }

// interface MataKuliah {
//   id: string;
//   nama: string;
//   sks: number;
//   universitas: string;
//   jenis: string;
//   semester: number;
//   related_cpl: string[];
// }

// // Enhanced CurriculumData with Sub-CPMK support
// interface CurriculumData {
//   mata_kuliah: Record<string, MataKuliah>;
//   cpl: Record<
//     string,
//     { id: string; kode: string; description: string; related_cpmk: string[] }
//   >;
//   cpmk: Record<
//     string,
//     {
//       id: string;
//       kode: string;
//       description: string;
//       related_subcpmk: string[]; // Add Sub-CPMK relationships
//     }
//   >;
//   subcpmk: Record<string, SubCPMK>; // Add Sub-CPMK data
//   assessment_types: Record<
//     string,
//     { id: string; nama: string; description: string }
//   >;
//   assessment_weights: Record<
//     string,
//     Record<string, Record<string, Record<string, number>>>
//   >;
// }

// interface ApiResponse {
//   success: boolean;
//   message: string;
//   data: any[];
//   error?: string;
// }

// // Constants
// const GRADE_SCALE = [
//   { nilaiAngka: { min: 80, max: 100 }, nilaiMutu: "A", kelulusan: "Lulus" },
//   {
//     nilaiAngka: { min: 76.25, max: 79.99 },
//     nilaiMutu: "A-",
//     kelulusan: "Lulus",
//   },
//   {
//     nilaiAngka: { min: 68.75, max: 76.24 },
//     nilaiMutu: "B+",
//     kelulusan: "Lulus",
//   },
//   { nilaiAngka: { min: 65, max: 68.74 }, nilaiMutu: "B", kelulusan: "Lulus" },
//   {
//     nilaiAngka: { min: 62.5, max: 64.99 },
//     nilaiMutu: "B-",
//     kelulusan: "Lulus",
//   },
//   {
//     nilaiAngka: { min: 57.5, max: 62.49 },
//     nilaiMutu: "C+",
//     kelulusan: "Lulus",
//   },
//   { nilaiAngka: { min: 55, max: 57.49 }, nilaiMutu: "C", kelulusan: "Lulus" },
//   {
//     nilaiAngka: { min: 51.25, max: 54.99 },
//     nilaiMutu: "C-",
//     kelulusan: "Tidak Lulus",
//   },
//   {
//     nilaiAngka: { min: 43.75, max: 51.24 },
//     nilaiMutu: "D+",
//     kelulusan: "Tidak Lulus",
//   },
//   {
//     nilaiAngka: { min: 40, max: 43.74 },
//     nilaiMutu: "D",
//     kelulusan: "Tidak Lulus",
//   },
//   {
//     nilaiAngka: { min: 0, max: 39.99 },
//     nilaiMutu: "E",
//     kelulusan: "Tidak Lulus",
//   },
// ];

// const DEFAULT_COURSE_INFO: CourseInfo = {
//   semester: 1,
//   year: "2024/2025",
//   lecturer: "",
// };

// // Utility Functions
// const calculateGradeInfo = (score: number) => {
//   const gradeInfo = GRADE_SCALE.find(
//     (grade) => score >= grade.nilaiAngka.min && score <= grade.nilaiAngka.max
//   );
//   return {
//     nilaiMutu: gradeInfo?.nilaiMutu || "E",
//     kelulusan: gradeInfo?.kelulusan || "Tidak Lulus",
//   };
// };

// const calculateAverage = (students: Student[], field: string): number => {
//   if (students.length === 0) return 0;
//   const total = students.reduce(
//     (sum, student) => sum + (Number(student[field]) || 0),
//     0
//   );
//   return Math.round((total / students.length) * 10) / 10;
// };

// const createDefaultStudent = (index: number): Student => ({
//   key: `student-${index + 1}`,
//   no: index + 1,
//   nim: `210${String(index + 1).padStart(6, "0")}`,
//   name: `Mahasiswa ${index + 1}`,
//   tugas: 0,
//   kuis: 0,
//   uts: 0,
//   uas: 0,
//   nilaiAkhir: 0,
//   nilaiMutu: "",
//   kelulusan: "",
// });

// // Enhanced Transform API data with Sub-CPMK support
// const transformApiDataToCurriculumData = (apiData: any[]): CurriculumData => {
//   const mata_kuliah: Record<string, MataKuliah> = {};
//   const cpl: Record<
//     string,
//     { id: string; kode: string; description: string; related_cpmk: string[] }
//   > = {};
//   const cpmk: Record<
//     string,
//     { id: string; kode: string; description: string; related_subcpmk: string[] }
//   > = {};
//   const subcpmk: Record<string, SubCPMK> = {};

//   apiData.forEach((mk) => {
//     const mkCode = mk.kode_mk || mk.kode || mk.id;
//     mata_kuliah[mkCode] = {
//       id: mk.id,
//       nama: mk.nama_mk || mk.nama || "Unknown Course",
//       sks: mk.sks || 3,
//       universitas: mk.universitas || "Unknown University",
//       jenis: mk.jenis_mk || mk.jenis || "Unknown Type",
//       semester: mk.semester || 1,
//       related_cpl: [],
//     };

//     if (mk.cpmk && Array.isArray(mk.cpmk)) {
//       mk.cpmk.forEach((cpmkItem: any) => {
//         const cpmkCode = cpmkItem.kode_cpmk || cpmkItem.kode || cpmkItem.id;

//         // Initialize related_subcpmk array
//         const relatedSubCpmk: string[] = [];

//         // Process Sub-CPMK if exists
//         if (cpmkItem.subcpmk && Array.isArray(cpmkItem.subcpmk)) {
//           cpmkItem.subcpmk.forEach((subCpmkItem: any) => {
//             const subCpmkCode =
//               subCpmkItem.kode_subcpmk || subCpmkItem.kode || subCpmkItem.id;

//             subcpmk[subCpmkCode] = {
//               id: subCpmkItem.id,
//               kode: subCpmkCode,
//               description:
//                 subCpmkItem.deskripsi ||
//                 subCpmkItem.description ||
//                 "No description",
//               cpmkId: cpmkCode,
//             };

//             relatedSubCpmk.push(subCpmkCode);
//           });
//         }

//         // Add CPMK with related Sub-CPMK
//         cpmk[cpmkCode] = {
//           id: cpmkItem.id,
//           kode: cpmkCode,
//           description:
//             cpmkItem.deskripsi || cpmkItem.description || "No description",
//           related_subcpmk: relatedSubCpmk,
//         };

//         // Process CPL if it exists
//         if (cpmkItem.cpl) {
//           const cplCode =
//             cpmkItem.cpl.kode_cpl || cpmkItem.cpl.kode || cpmkItem.cpl.id;

//           if (!cpl[cplCode]) {
//             cpl[cplCode] = {
//               id: cpmkItem.cpl.id,
//               kode: cplCode,
//               description:
//                 cpmkItem.cpl.deskripsi ||
//                 cpmkItem.cpl.description ||
//                 "No description",
//               related_cpmk: [],
//             };
//           }

//           // Add CPMK to CPL's related_cpmk if not already there
//           if (!cpl[cplCode].related_cpmk.includes(cpmkCode)) {
//             cpl[cplCode].related_cpmk.push(cpmkCode);
//           }

//           // Add CPL to MK's related_cpl if not already there
//           if (!mata_kuliah[mkCode].related_cpl.includes(cplCode)) {
//             mata_kuliah[mkCode].related_cpl.push(cplCode);
//           }
//         }
//       });
//     }
//   });

//   return {
//     mata_kuliah,
//     cpl,
//     cpmk,
//     subcpmk,
//     assessment_types: {
//       tugas: { id: "1", nama: "Tugas", description: "Tugas dan Praktikum" },
//       kuis: { id: "2", nama: "Kuis", description: "Kuis dan Quiz" },
//       uts: { id: "3", nama: "UTS", description: "Ujian Tengah Semester" },
//       uas: { id: "4", nama: "UAS", description: "Ujian Akhir Semester" },
//     },
//     assessment_weights: {},
//   };
// };

// // Dynamic Assessment Weights Table Component
// const DynamicAssessmentWeightsTable: React.FC<{
//   assessmentWeights: AssessmentWeights;
//   relatedCPL: string[];
//   getRelatedCPMK: (cpl: string) => string[];
//   getRelatedSubCPMK: (cpmk: string) => string[];
//   updateAssessmentWeight: (
//     cpl: string,
//     cpmk: string,
//     assessmentType: string,
//     value: number,
//     subCpmk?: string
//   ) => void;
//   curriculumData: CurriculumData | null;
//   hasSubCPMKData: boolean;
// }> = ({
//   assessmentWeights,
//   relatedCPL,
//   getRelatedCPMK,
//   getRelatedSubCPMK,
//   updateAssessmentWeight,
//   curriculumData,
//   hasSubCPMKData,
// }) => {
//   const assessmentTypes = ["tugas", "kuis", "uts", "uas"];

//   const buildColumns = () => {
//     interface AssessmentColumn {
//       title: string | React.ReactNode;
//       dataIndex?: string;
//       key: string;
//       width?: number;
//       className?: string;
//       onHeaderCell?: () => { style: React.CSSProperties };
//       onCell?: (record: any) => { style: React.CSSProperties };
//       render?: (value: any, record: any) => React.ReactNode;
//       children?: AssessmentColumn[];
//     }

//     const columns: AssessmentColumn[] = [
//       {
//         title: "Bentuk Assessment",
//         dataIndex: "bentuk",
//         key: "bentuk",
//         width: 150,
//         className: "text-center font-bold",
//         onHeaderCell: () => ({
//           style: { backgroundColor: "#bbf7d0", textAlign: "center" as const },
//         }),
//         onCell: (record: any) => ({
//           style: {
//             backgroundColor:
//               record.key === "presentase" ? "#f3f4f6" : "#dcfce7",
//             textAlign: "center" as const,
//             fontWeight: "bold",
//           },
//         }),
//       },
//     ];

//     // Add CPL columns
//     relatedCPL.forEach((cpl) => {
//       const relatedCPMK = getRelatedCPMK(cpl);

//       if (hasSubCPMKData) {
//         // Sub-CPMK Mode: Show Sub-CPMK columns under CPMK
//         const cplChildren: AssessmentColumn[] = [];

//         relatedCPMK.forEach((cpmk) => {
//           const relatedSubCPMK = getRelatedSubCPMK(cpmk);

//           if (relatedSubCPMK.length > 0) {
//             // CPMK has Sub-CPMK, show Sub-CPMK columns
//             const subCpmkColumns: AssessmentColumn[] = relatedSubCPMK.map(
//               (subCpmk) => ({
//                 title: curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk,
//                 dataIndex: `${cpl}_${cpmk}_${subCpmk}`,
//                 key: `${cpl}_${cpmk}_${subCpmk}`,
//                 width: 80,
//                 className: "text-center",
//                 onHeaderCell: () => ({
//                   style: { backgroundColor: "#dcfce7", textAlign: "center" },
//                 }),
//                 render: (value: number, record: any) => {
//                   if (record.key === "presentase") {
//                     return (
//                       <div
//                         className="text-center font-bold p-2"
//                         style={{ backgroundColor: "#f3f4f6" }}
//                       >
//                         {value}
//                       </div>
//                     );
//                   }
//                   return (
//                     <Input
//                       type="number"
//                       value={value || 0}
//                       onChange={(e) =>
//                         updateAssessmentWeight(
//                           cpl,
//                           cpmk,
//                           record.key,
//                           Number(e.target.value) || 0,
//                           subCpmk
//                         )
//                       }
//                       min={0}
//                       max={100}
//                       size="small"
//                       style={{
//                         backgroundColor: "#fef3c7",
//                         textAlign: "center",
//                       }}
//                     />
//                   );
//                 },
//               })
//             );

//             cplChildren.push({
//               title: curriculumData?.cpmk?.[cpmk]?.kode || cpmk,
//               children: subCpmkColumns,
//             } as any);
//           } else {
//             // CPMK without Sub-CPMK, show CPMK directly
//             cplChildren.push({
//               title: curriculumData?.cpmk?.[cpmk]?.kode || cpmk,
//               dataIndex: `${cpl}_${cpmk}`,
//               key: `${cpl}_${cpmk}`,
//               width: 80,
//               className: "text-center",
//               onHeaderCell: () => ({
//                 style: { backgroundColor: "#dcfce7", textAlign: "center" },
//               }),
//               render: (value: number, record: any) => {
//                 if (record.key === "presentase") {
//                   return (
//                     <div
//                       className="text-center font-bold p-2"
//                       style={{ backgroundColor: "#f3f4f6" }}
//                     >
//                       {value}
//                     </div>
//                   );
//                 }
//                 return (
//                   <Input
//                     type="number"
//                     value={value || 0}
//                     onChange={(e) =>
//                       updateAssessmentWeight(
//                         cpl,
//                         cpmk,
//                         record.key,
//                         Number(e.target.value) || 0
//                       )
//                     }
//                     min={0}
//                     max={100}
//                     size="small"
//                     style={{ backgroundColor: "#fef3c7", textAlign: "center" }}
//                   />
//                 );
//               },
//             });
//           }
//         });

//         columns.push({
//           title: curriculumData?.cpl?.[cpl]?.kode || cpl,
//           children: cplChildren,
//         } as any);
//       } else {
//         // CPMK Mode: Show CPMK columns directly
//         columns.push({
//           title: curriculumData?.cpl?.[cpl]?.kode || cpl,
//           children: relatedCPMK.map((cpmk) => ({
//             title: curriculumData?.cpmk?.[cpmk]?.kode || cpmk,
//             dataIndex: `${cpl}_${cpmk}`,
//             key: `${cpl}_${cpmk}`,
//             width: 80,
//             className: "text-center",
//             onHeaderCell: () => ({
//               style: { backgroundColor: "#dcfce7", textAlign: "center" },
//             }),
//             render: (value: number, record: any) => {
//               if (record.key === "presentase") {
//                 return (
//                   <div
//                     className="text-center font-bold p-2"
//                     style={{ backgroundColor: "#f3f4f6" }}
//                   >
//                     {value}
//                   </div>
//                 );
//               }
//               return (
//                 <Input
//                   type="number"
//                   value={value || 0}
//                   onChange={(e) =>
//                     updateAssessmentWeight(
//                       cpl,
//                       cpmk,
//                       record.key,
//                       Number(e.target.value) || 0
//                     )
//                   }
//                   min={0}
//                   max={100}
//                   size="small"
//                   style={{ backgroundColor: "#fef3c7", textAlign: "center" }}
//                 />
//               );
//             },
//           })),
//         } as any);
//       }
//     });

//     // Add percentage column
//     columns.push({
//       title: "Persentase",
//       dataIndex: "persentase",
//       key: "persentase",
//       width: 100,
//       className: "text-center font-bold",
//       onHeaderCell: () => ({
//         style: { backgroundColor: "#f3f4f6", textAlign: "center" },
//       }),
//       render: (value: number, record: any) => (
//         <div
//           className="text-center font-bold p-2"
//           style={{
//             backgroundColor:
//               record.key === "presentase"
//                 ? value === 100
//                   ? "#bbf7d0"
//                   : "#fca5a5"
//                 : "#f3f4f6",
//             color:
//               record.key === "presentase" && value !== 100 ? "white" : "black",
//           }}
//         >
//           {value}
//         </div>
//       ),
//     });

//     return columns;
//   };

//   const buildDataSource = () => {
//     const data: any[] = [];

//     assessmentTypes.forEach((assessmentType) => {
//       const row: any = {
//         key: assessmentType,
//         bentuk:
//           assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1),
//       };

//       let totalForType = 0;
//       relatedCPL.forEach((cpl) => {
//         const relatedCPMK = getRelatedCPMK(cpl);
//         relatedCPMK.forEach((cpmk) => {
//           const relatedSubCPMK = getRelatedSubCPMK(cpmk);

//           if (hasSubCPMKData && relatedSubCPMK.length > 0) {
//             // Sub-CPMK mode
//             relatedSubCPMK.forEach((subCpmk) => {
//               const weight =
//                 assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
//                   assessmentType as keyof (typeof assessmentWeights)[string][string]
//                 ] || 0;
//               row[`${cpl}_${cpmk}_${subCpmk}`] = weight;
//               totalForType += weight;
//             });
//           } else {
//             // CPMK mode
//             const weight =
//               assessmentWeights[cpl]?.[cpmk]?.[
//                 assessmentType as keyof (typeof assessmentWeights)[string][string]
//               ] || 0;
//             row[`${cpl}_${cpmk}`] = weight;
//             totalForType += weight;
//           }
//         });
//       });
//       row.persentase = totalForType;
//       data.push(row);
//     });

//     // Add percentage totals row
//     const presentaseRow: any = {
//       key: "presentase",
//       bentuk: "Presentase",
//     };

//     let grandTotal = 0;
//     relatedCPL.forEach((cpl) => {
//       const relatedCPMK = getRelatedCPMK(cpl);
//       relatedCPMK.forEach((cpmk) => {
//         const relatedSubCPMK = getRelatedSubCPMK(cpmk);

//         if (hasSubCPMKData && relatedSubCPMK.length > 0) {
//           // Sub-CPMK mode
//           relatedSubCPMK.forEach((subCpmk) => {
//             const total = assessmentTypes.reduce((sum, type) => {
//               return (
//                 sum +
//                 (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
//                   type as keyof (typeof assessmentWeights)[string][string]
//                 ] || 0)
//               );
//             }, 0);
//             presentaseRow[`${cpl}_${cpmk}_${subCpmk}`] = total;
//           });
//         } else {
//           // CPMK mode
//           const total = assessmentTypes.reduce((sum, type) => {
//             return (
//               sum +
//               (assessmentWeights[cpl]?.[cpmk]?.[
//                 type as keyof (typeof assessmentWeights)[string][string]
//               ] || 0)
//             );
//           }, 0);
//           presentaseRow[`${cpl}_${cpmk}`] = total;
//         }
//       });
//     });

//     grandTotal = assessmentTypes.reduce((sum, type) => {
//       return sum + (data.find((item) => item.key === type)?.persentase || 0);
//     }, 0);

//     presentaseRow.persentase = grandTotal;
//     data.push(presentaseRow);

//     return data;
//   };

//   return (
//     <div className="space-y-4">
//       <Alert
//         message={
//           hasSubCPMKData
//             ? "Mode Sub-CPMK aktif: Silakan input bobot penilaian untuk setiap Sub-CPMK. Pastikan total bobot untuk setiap Sub-CPMK = 100%."
//             : "Mode CPMK aktif: Silakan input bobot penilaian untuk setiap CPMK. Pastikan total bobot untuk setiap CPMK = 100%."
//         }
//         type="info"
//         icon={<InfoCircleOutlined />}
//         showIcon
//       />

//       <Table
//         columns={buildColumns()}
//         dataSource={buildDataSource()}
//         pagination={false}
//         bordered
//         size="small"
//         scroll={{ x: "max-content" }}
//       />
//     </div>
//   );
// };

// // Enhanced Students Grades Table Component
// const EnhancedStudentsGradesTable: React.FC<{
//   students: Student[];
//   assessmentWeights: AssessmentWeights;
//   relatedCPL: string[];
//   getRelatedCPMK: (cpl: string) => string[];
//   getRelatedSubCPMK: (cpmk: string) => string[];
//   updateStudent: (
//     key: string,
//     field: keyof Student,
//     value: string | number
//   ) => void;
//   calculateAverage: (field: string) => number;
//   isGradeInputMode?: boolean;
//   curriculumData: CurriculumData | null;
//   hasSubCPMKData: boolean;
// }> = ({
//   students,
//   assessmentWeights,
//   relatedCPL,
//   getRelatedCPMK,
//   getRelatedSubCPMK,
//   updateStudent,
//   calculateAverage,
//   isGradeInputMode = true,
//   curriculumData,
//   hasSubCPMKData,
// }) => {
//   const hasAllScores = (student: Student) =>
//     student.tugas > 0 && student.kuis > 0 && student.uts > 0 && student.uas > 0;

//   const calculateCPMKScore = (
//     student: Student,
//     cpl: string,
//     cpmk: string,
//     assessmentType: string,
//     subCpmk?: string
//   ): number => {
//     let weight = 0;

//     if (subCpmk) {
//       // Sub-CPMK mode
//       weight =
//         assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
//           assessmentType as keyof (typeof assessmentWeights)[string][string]
//         ] || 0;
//     } else {
//       // CPMK mode
//       weight =
//         assessmentWeights[cpl]?.[cpmk]?.[
//           assessmentType as keyof (typeof assessmentWeights)[string][string]
//         ] || 0;
//     }

//     const assessmentScore =
//       Number(student[assessmentType as keyof Student]) || 0;
//     return Math.round(((assessmentScore * weight) / 100) * 10) / 10;
//   };

//   const buildColumns = () => {
//     const columns = [
//       {
//         title: "No",
//         dataIndex: "no",
//         key: "no",
//         width: 50,
//         className: "text-center",
//         render: (value: number) => value || "",
//       },
//       {
//         title: "NIM",
//         dataIndex: "nim",
//         key: "nim",
//         width: 120,
//         render: (value: string, record: Student) => {
//           if (record.key === "average") {
//             return <div className="text-center font-bold">{value}</div>;
//           }
//           return (
//             <Input
//               value={value}
//               onChange={(e) => updateStudent(record.key, "nim", e.target.value)}
//               size="small"
//             />
//           );
//         },
//       },
//       {
//         title: "Nama Mahasiswa",
//         dataIndex: "name",
//         key: "name",
//         width: 200,
//         render: (value: string, record: Student) => {
//           if (record.key === "average") {
//             return <div className="text-center font-bold">{value}</div>;
//           }
//           return (
//             <Input
//               value={value}
//               onChange={(e) =>
//                 updateStudent(record.key, "name", e.target.value)
//               }
//               size="small"
//             />
//           );
//         },
//       },
//     ];

//     // Input Nilai columns
//     const inputColumns = [
//       { key: "tugas", title: "Tugas", color: "#fef3c7" },
//       { key: "kuis", title: "Kuis", color: "#fef3c7" },
//       { key: "uts", title: "UTS", color: "#fef3c7" },
//       { key: "uas", title: "UAS", color: "#fef3c7" },
//     ];

//     columns.push({
//       title: "INPUT NILAI",
//       children: inputColumns.map((col) => ({
//         title: col.title,
//         dataIndex: col.key,
//         key: col.key,
//         width: 80,
//         onHeaderCell: () => ({
//           style: { backgroundColor: col.color, textAlign: "center" },
//         }),
//         render: (value: number, record: Student) => {
//           if (record.key === "average") {
//             return (
//               <div
//                 className="text-center font-bold p-2 rounded"
//                 style={{ backgroundColor: "#fce7f3" }}
//               >
//                 {value}
//               </div>
//             );
//           }

//           if (isGradeInputMode) {
//             return (
//               <Input
//                 type="number"
//                 value={value}
//                 onChange={(e) =>
//                   updateStudent(
//                     record.key,
//                     col.key as keyof Student,
//                     Number(e.target.value) || 0
//                   )
//                 }
//                 min={0}
//                 max={100}
//                 size="small"
//                 style={{ backgroundColor: col.color, textAlign: "center" }}
//               />
//             );
//           } else {
//             return (
//               <div
//                 className="text-center p-2 border rounded"
//                 style={{ backgroundColor: "#f3f4f6" }}
//               >
//                 {value}
//               </div>
//             );
//           }
//         },
//       })),
//     } as any);

//     // Hierarchical structure: ASSESSMENT → CPL → CPMK (with %) → Sub-CPMK
//     if (relatedCPL.length > 0) {
//       ["tugas", "kuis", "uts", "uas"].forEach((assessmentType) => {
//         const cplColumns: any[] = [];

//         relatedCPL.forEach((cpl) => {
//           const cpmkColumns: any[] = [];
//           const relatedCPMK = getRelatedCPMK(cpl);

//           relatedCPMK.forEach((cpmk) => {
//             const relatedSubCPMK = getRelatedSubCPMK(cpmk);

//             // Calculate CPMK weight percentage (you can customize this logic)
//             const getCpmkWeight = (cpmk: string) => {
//               switch (cpmk) {
//                 case "CPMK-5":
//                   return "15%";
//                 case "CPMK-22":
//                   return "15%";
//                 case "CPMK-23":
//                   return "30%";
//                 case "CPMK-24":
//                   return "40%";
//                 default: {
//                   // Auto-calculate equal distribution
//                   const totalCpmkInCpl = relatedCPMK.length;
//                   return `${Math.round(100 / totalCpmkInCpl)}%`;
//                 }
//               }
//             };

//             if (hasSubCPMKData && relatedSubCPMK.length > 0) {
//               // Sub-CPMK columns under CPMK
//               const subCpmkColumns: any[] = relatedSubCPMK.map((subCpmk) => ({
//                 title: curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk,
//                 dataIndex: `${cpl}_${cpmk}_${subCpmk}_${assessmentType}`,
//                 key: `${cpl}_${cpmk}_${subCpmk}_${assessmentType}`,
//                 width: 80,
//                 onHeaderCell: () => ({
//                   style: {
//                     backgroundColor: "#f0f9ff",
//                     textAlign: "center",
//                     fontSize: "11px",
//                     padding: "4px",
//                   },
//                 }),
//                 render: (_: any, record: Student) => {
//                   const cpmkScore = calculateCPMKScore(
//                     record,
//                     cpl,
//                     cpmk,
//                     assessmentType,
//                     subCpmk
//                   );

//                   if (record.key === "average") {
//                     return (
//                       <div
//                         className="text-center font-bold p-1 text-xs"
//                         style={{ backgroundColor: "#fce7f3" }}
//                       >
//                         {cpmkScore}
//                       </div>
//                     );
//                   }

//                   if (!isGradeInputMode) {
//                     return (
//                       <Input
//                         type="number"
//                         value={cpmkScore}
//                         onChange={(e) => {
//                           const weight =
//                             assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
//                               subCpmk
//                             ]?.[
//                               assessmentType as keyof (typeof assessmentWeights)[string][string]
//                             ] || 0;
//                           if (weight > 0) {
//                             const newAssessmentScore =
//                               ((Number(e.target.value) || 0) * 100) / weight;
//                             updateStudent(
//                               record.key,
//                               assessmentType as keyof Student,
//                               Math.min(100, Math.max(0, newAssessmentScore))
//                             );
//                           }
//                         }}
//                         min={0}
//                         max={100}
//                         size="small"
//                         style={{
//                           backgroundColor: "#fef3c7",
//                           textAlign: "center",
//                           fontSize: "11px",
//                         }}
//                       />
//                     );
//                   } else {
//                     return (
//                       <div
//                         className="text-center p-1 border rounded text-xs"
//                         style={{ backgroundColor: "#f3f4f6" }}
//                       >
//                         {cpmkScore}
//                       </div>
//                     );
//                   }
//                 },
//               }));

//               // CPMK header with percentage and Sub-CPMK children
//               cpmkColumns.push({
//                 title: (
//                   <div className="text-center">
//                     <div className="font-bold text-xs mb-1">
//                       {curriculumData?.cpmk?.[cpmk]?.kode || cpmk}
//                     </div>
//                     <div className="text-xs bg-yellow-200 px-1 rounded font-semibold">
//                       {getCpmkWeight(cpmk)}
//                     </div>
//                   </div>
//                 ),
//                 children: subCpmkColumns,
//               });
//             } else {
//               // Direct CPMK column (no Sub-CPMK)
//               cpmkColumns.push({
//                 title: (
//                   <div className="text-center">
//                     <div className="font-bold text-xs mb-1">
//                       {curriculumData?.cpmk?.[cpmk]?.kode || cpmk}
//                     </div>
//                     <div className="text-xs bg-yellow-200 px-1 rounded font-semibold">
//                       {getCpmkWeight(cpmk)}
//                     </div>
//                   </div>
//                 ),
//                 dataIndex: `${cpl}_${cpmk}_${assessmentType}`,
//                 key: `${cpl}_${cpmk}_${assessmentType}`,
//                 width: 100,
//                 onHeaderCell: () => ({
//                   style: {
//                     backgroundColor: "#f0f9ff",
//                     textAlign: "center",
//                     fontSize: "11px",
//                     padding: "4px",
//                   },
//                 }),
//                 render: (_: any, record: Student) => {
//                   const cpmkScore = calculateCPMKScore(
//                     record,
//                     cpl,
//                     cpmk,
//                     assessmentType
//                   );

//                   if (record.key === "average") {
//                     return (
//                       <div
//                         className="text-center font-bold p-1 text-xs"
//                         style={{ backgroundColor: "#fce7f3" }}
//                       >
//                         {cpmkScore}
//                       </div>
//                     );
//                   }

//                   if (!isGradeInputMode) {
//                     return (
//                       <Input
//                         type="number"
//                         value={cpmkScore}
//                         onChange={(e) => {
//                           const weight =
//                             assessmentWeights[cpl]?.[cpmk]?.[
//                               assessmentType as keyof (typeof assessmentWeights)[string][string]
//                             ] || 0;
//                           if (weight > 0) {
//                             const newAssessmentScore =
//                               ((Number(e.target.value) || 0) * 100) / weight;
//                             updateStudent(
//                               record.key,
//                               assessmentType as keyof Student,
//                               Math.min(100, Math.max(0, newAssessmentScore))
//                             );
//                           }
//                         }}
//                         min={0}
//                         max={100}
//                         size="small"
//                         style={{
//                           backgroundColor: "#fef3c7",
//                           textAlign: "center",
//                           fontSize: "11px",
//                         }}
//                       />
//                     );
//                   } else {
//                     return (
//                       <div
//                         className="text-center p-1 border rounded text-xs"
//                         style={{ backgroundColor: "#f3f4f6" }}
//                       >
//                         {cpmkScore}
//                       </div>
//                     );
//                   }
//                 },
//               });
//             }
//           });

//           // CPL header with CPMK children
//           cplColumns.push({
//             title: (
//               <div className="text-center font-bold text-sm bg-green-200 p-1 rounded">
//                 {curriculumData?.cpl?.[cpl]?.kode || cpl}
//               </div>
//             ),
//             children: cpmkColumns,
//           });
//         });

//         // Main assessment type header
//         columns.push({
//           title: (
//             <div className="text-center font-bold text-lg bg-green-300 p-2 rounded">
//               {assessmentType.toUpperCase()}
//             </div>
//           ),
//           children: cplColumns,
//         } as any);
//       });
//     }

//     // Final result columns
//     columns.push({
//       title: "HASIL AKHIR",
//       children: [
//         {
//           title: "Nilai Akhir",
//           dataIndex: "nilaiAkhir",
//           key: "nilaiAkhir",
//           width: 100,
//           onHeaderCell: () => ({
//             style: { backgroundColor: "#fce7f3", textAlign: "center" },
//           }),
//           render: (value: number, record: Student) => {
//             if (record.key === "average") {
//               return (
//                 <div
//                   className="text-center font-bold p-2 rounded"
//                   style={{ backgroundColor: "#fce7f3" }}
//                 >
//                   {value || 0}
//                 </div>
//               );
//             }

//             if (hasAllScores(record)) {
//               return (
//                 <div className="text-center space-y-1">
//                   <div className="font-bold">{value}</div>
//                   <Tag
//                     color={
//                       ["D", "D+", "E"].includes(record.nilaiMutu || "")
//                         ? "red"
//                         : ["C", "C+", "C-", "B-"].includes(
//                             record.nilaiMutu || ""
//                           )
//                         ? "orange"
//                         : "green"
//                     }
//                   >
//                     {record.nilaiMutu}
//                   </Tag>
//                 </div>
//               );
//             } else {
//               return <div className="text-center text-gray-400">-</div>;
//             }
//           },
//         },
//         {
//           title: "Kelulusan",
//           dataIndex: "kelulusan",
//           key: "kelulusan",
//           width: 100,
//           onHeaderCell: () => ({
//             style: { backgroundColor: "#fce7f3", textAlign: "center" },
//           }),
//           render: (value: string, record: Student) => {
//             if (record.key === "average") {
//               return (
//                 <div
//                   className="text-center font-bold p-2 rounded"
//                   style={{ backgroundColor: "#fce7f3" }}
//                 >
//                   Rata-rata
//                 </div>
//               );
//             }

//             if (hasAllScores(record)) {
//               return (
//                 <Tag color={value === "Lulus" ? "green" : "red"}>{value}</Tag>
//               );
//             } else {
//               return <div className="text-center text-gray-400">-</div>;
//             }
//           },
//         },
//       ],
//     } as any);

//     return columns;
//   };

//   const dataWithAverage = () => {
//     const averageRow: Student = {
//       key: "average",
//       no: 0,
//       nim: "",
//       name: "Capaian rerata kelas",
//       tugas: calculateAverage("tugas"),
//       kuis: calculateAverage("kuis"),
//       uts: calculateAverage("uts"),
//       uas: calculateAverage("uas"),
//       nilaiAkhir: calculateAverage("nilaiAkhir"),
//       nilaiMutu: "-",
//       kelulusan: "-",
//     };

//     return [...students, averageRow];
//   };

//   return (
//     <div className="space-y-4">
//       <Alert
//         message={
//           <div className="flex items-center gap-4">
//             <span>Mode Aktif:</span>
//             <Badge
//               status={isGradeInputMode ? "processing" : "default"}
//               text={
//                 isGradeInputMode
//                   ? "Input Nilai Utama"
//                   : `Input ${hasSubCPMKData ? "Sub-CPMK" : "CPMK"} Utama`
//               }
//             />
//             <Text type="secondary">
//               {isGradeInputMode
//                 ? `(Nilai dapat diedit, ${
//                     hasSubCPMKData ? "Sub-CPMK" : "CPMK"
//                   } dihitung otomatis)`
//                 : `(${
//                     hasSubCPMKData ? "Sub-CPMK" : "CPMK"
//                   } dapat diedit, Nilai dihitung otomatis)`}
//             </Text>
//           </div>
//         }
//         type="info"
//       />

//       <Table
//         columns={buildColumns()}
//         dataSource={dataWithAverage()}
//         pagination={false}
//         bordered
//         size="small"
//         scroll={{ x: "max-content", y: 600 }}
//         rowClassName={(record) =>
//           record.key === "average" ? "bg-pink-50" : ""
//         }
//       />
//     </div>
//   );
// };

// // Main Component
// const GradingAssessmentTable: React.FC = () => {
//   const [students, setStudents] = useState<Student[]>([]);
//   const [selectedCourse, setSelectedCourse] = useState<string>("");
//   const [courseInfo, setCourseInfo] = useState<CourseInfo>(DEFAULT_COURSE_INFO);
//   const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(
//     null
//   );
//   const [assessmentWeights, setAssessmentWeights] = useState<AssessmentWeights>(
//     {}
//   );
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [availableCourses, setAvailableCourses] = useState<
//     Record<string, MataKuliah>
//   >({});
//   const [isGradeInputMode, setIsGradeInputMode] = useState<boolean>(true);

//   // Fetch data from API
//   const fetchCourseData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const apiUri = import.meta.env.VITE_API_URI || "http://localhost:3000";
//       const response = await fetch(`${apiUri}/api/mk`);

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const result: ApiResponse = await response.json();

//       if (!result.success) {
//         throw new Error(
//           result.error || result.message || "Failed to fetch data"
//         );
//       }

//       const transformedData = transformApiDataToCurriculumData(result.data);
//       setCurriculumData(transformedData);
//       setAvailableCourses(transformedData.mata_kuliah);

//       if (
//         !selectedCourse &&
//         Object.keys(transformedData.mata_kuliah).length > 0
//       ) {
//         const firstCourseCode = Object.keys(transformedData.mata_kuliah)[0];
//         setSelectedCourse(firstCourseCode);
//       }

//       message.success("Data berhasil dimuat");
//     } catch (err) {
//       console.error("Error fetching course data:", err);
//       const errorMessage =
//         err instanceof Error ? err.message : "An unknown error occurred";
//       setError(errorMessage);
//       message.error(`Gagal memuat data: ${errorMessage}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initialize data
//   useEffect(() => {
//     fetchCourseData();
//   }, []);

//   useEffect(() => {
//     if (curriculumData && selectedCourse) {
//       initializeAssessmentWeights();
//     }
//   }, [curriculumData, selectedCourse]);

//   const getRelatedCPL = (courseCode: string): string[] => {
//     return curriculumData?.mata_kuliah?.[courseCode]?.related_cpl || [];
//   };

//   const getRelatedCPMK = (cplCode: string): string[] => {
//     return curriculumData?.cpl?.[cplCode]?.related_cpmk || [];
//   };

//   const getRelatedSubCPMK = (cpmkCode: string): string[] => {
//     return curriculumData?.cpmk?.[cpmkCode]?.related_subcpmk || [];
//   };

//   // Check if current course has Sub-CPMK data
//   const hasSubCPMKData = (): boolean => {
//     if (!curriculumData || !selectedCourse) return false;

//     const relatedCPL = getRelatedCPL(selectedCourse);
//     for (const cpl of relatedCPL) {
//       const relatedCPMK = getRelatedCPMK(cpl);
//       for (const cpmk of relatedCPMK) {
//         const relatedSubCPMK = getRelatedSubCPMK(cpmk);
//         if (relatedSubCPMK.length > 0) {
//           return true;
//         }
//       }
//     }
//     return false;
//   };

//   const initializeAssessmentWeights = (): void => {
//     const relatedCPL = getRelatedCPL(selectedCourse);
//     const newWeights: AssessmentWeights = {};
//     const hasSubCPMK = hasSubCPMKData();

//     relatedCPL.forEach((cpl) => {
//       newWeights[cpl] = {};
//       const relatedCPMK = getRelatedCPMK(cpl);
//       relatedCPMK.forEach((cpmk) => {
//         const relatedSubCPMK = getRelatedSubCPMK(cpmk);

//         if (hasSubCPMK && relatedSubCPMK.length > 0) {
//           // Sub-CPMK mode
//           newWeights[cpl][cpmk] = {
//             tugas: 0,
//             kuis: 0,
//             uts: 0,
//             uas: 0,
//             subcpmk: {},
//           };

//           relatedSubCPMK.forEach((subCpmk) => {
//             newWeights[cpl][cpmk].subcpmk![subCpmk] = {
//               tugas: 0,
//               kuis: 0,
//               uts: 0,
//               uas: 0,
//             };
//           });
//         } else {
//           // CPMK mode
//           newWeights[cpl][cpmk] = { tugas: 0, kuis: 0, uts: 0, uas: 0 };
//         }
//       });
//     });

//     setAssessmentWeights(newWeights);
//   };

//   const hasAllAssessmentScores = (student: Student): boolean => {
//     return (
//       (student.tugas || 0) > 0 &&
//       (student.kuis || 0) > 0 &&
//       (student.uts || 0) > 0 &&
//       (student.uas || 0) > 0
//     );
//   };

//   const updateAssessmentWeight = (
//     cpl: string,
//     cpmk: string,
//     assessmentType: string,
//     value: number,
//     subCpmk?: string
//   ): void => {
//     setAssessmentWeights((prev) => {
//       const newWeights = { ...prev };

//       if (!newWeights[cpl]) newWeights[cpl] = {};
//       if (!newWeights[cpl][cpmk]) {
//         newWeights[cpl][cpmk] = { tugas: 0, kuis: 0, uts: 0, uas: 0 };
//       }

//       if (subCpmk) {
//         // Sub-CPMK mode
//         if (!newWeights[cpl][cpmk].subcpmk) {
//           newWeights[cpl][cpmk].subcpmk = {};
//         }
//         if (!newWeights[cpl][cpmk].subcpmk![subCpmk]) {
//           newWeights[cpl][cpmk].subcpmk![subCpmk] = {
//             tugas: 0,
//             kuis: 0,
//             uts: 0,
//             uas: 0,
//           };
//         }
//         newWeights[cpl][cpmk].subcpmk![subCpmk][
//           assessmentType as keyof (typeof newWeights)[string][string]
//         ] = value;
//       } else {
//         // CPMK mode
//         newWeights[cpl][cpmk][
//           assessmentType as keyof (typeof newWeights)[string][string]
//         ] = value;
//       }

//       return newWeights;
//     });

//     setTimeout(() => recalculateAllStudents(), 100);
//   };

//   const recalculateAllStudents = (): void => {
//     setStudents((prev) =>
//       prev.map((student) => {
//         const updated = { ...student };

//         if (!hasAllAssessmentScores(student)) {
//           updated.nilaiAkhir = 0;
//           updated.nilaiMutu = "";
//           updated.kelulusan = "";
//           return updated;
//         }

//         // Calculate final score using CPMK/Sub-CPMK-based weighted average
//         let totalWeightedScore = 0;
//         let totalWeight = 0;
//         const hasSubCPMK = hasSubCPMKData();

//         const relatedCPL = getRelatedCPL(selectedCourse);
//         relatedCPL.forEach((cpl) => {
//           const relatedCPMK = getRelatedCPMK(cpl);
//           relatedCPMK.forEach((cpmk) => {
//             const relatedSubCPMK = getRelatedSubCPMK(cpmk);

//             if (
//               hasSubCPMK &&
//               relatedSubCPMK.length > 0 &&
//               assessmentWeights[cpl]?.[cpmk]?.subcpmk
//             ) {
//               // Sub-CPMK calculation
//               relatedSubCPMK.forEach((subCpmk) => {
//                 const weights =
//                   assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk];
//                 if (weights) {
//                   const subCpmkTotalWeight =
//                     weights.tugas + weights.kuis + weights.uts + weights.uas;
//                   if (subCpmkTotalWeight > 0) {
//                     const subCpmkScore =
//                       ((Number(student.tugas) || 0) * weights.tugas +
//                         (Number(student.kuis) || 0) * weights.kuis +
//                         (Number(student.uts) || 0) * weights.uts +
//                         (Number(student.uas) || 0) * weights.uas) /
//                       subCpmkTotalWeight;

//                     totalWeightedScore += subCpmkScore * subCpmkTotalWeight;
//                     totalWeight += subCpmkTotalWeight;
//                   }
//                 }
//               });
//             } else {
//               // CPMK calculation
//               const weights = assessmentWeights[cpl]?.[cpmk];
//               if (weights) {
//                 const cpmkTotalWeight =
//                   weights.tugas + weights.kuis + weights.uts + weights.uas;
//                 if (cpmkTotalWeight > 0) {
//                   const cpmkScore =
//                     ((Number(student.tugas) || 0) * weights.tugas +
//                       (Number(student.kuis) || 0) * weights.kuis +
//                       (Number(student.uts) || 0) * weights.uts +
//                       (Number(student.uas) || 0) * weights.uas) /
//                     cpmkTotalWeight;

//                   totalWeightedScore += cpmkScore * cpmkTotalWeight;
//                   totalWeight += cpmkTotalWeight;
//                 }
//               }
//             }
//           });
//         });

//         // If no weights are set, fall back to equal weighting
//         if (totalWeight === 0) {
//           const finalScore =
//             ((Number(student.tugas) || 0) +
//               (Number(student.kuis) || 0) +
//               (Number(student.uts) || 0) +
//               (Number(student.uas) || 0)) /
//             4;
//           updated.nilaiAkhir = Math.round(finalScore * 100) / 100;
//         } else {
//           updated.nilaiAkhir =
//             Math.round((totalWeightedScore / totalWeight) * 100) / 100;
//         }

//         // Calculate grade info
//         const gradeInfo = calculateGradeInfo(updated.nilaiAkhir);
//         updated.nilaiMutu = gradeInfo.nilaiMutu;
//         updated.kelulusan = gradeInfo.kelulusan;

//         return updated;
//       })
//     );
//   };

//   const initializeStudents = (count: number): void => {
//     const newStudents: Student[] = Array.from({ length: count }, (_, i) => {
//       const student: Student = createDefaultStudent(i);
//       const relatedCPL = getRelatedCPL(selectedCourse);
//       const hasSubCPMK = hasSubCPMKData();

//       relatedCPL.forEach((cpl) => {
//         const relatedCPMK = getRelatedCPMK(cpl);
//         relatedCPMK.forEach((cpmk) => {
//           const relatedSubCPMK = getRelatedSubCPMK(cpmk);

//           if (hasSubCPMK && relatedSubCPMK.length > 0) {
//             relatedSubCPMK.forEach((subCpmk) => {
//               student[`${cpl}_${cpmk}_${subCpmk}`] = 0;
//             });
//           } else {
//             student[`${cpl}_${cpmk}`] = 0;
//           }
//         });
//       });
//       return student;
//     });
//     setStudents(newStudents);
//     message.success(`${count} mahasiswa berhasil ditambahkan`);
//   };

//   const updateStudent = (
//     key: string,
//     field: keyof Student,
//     value: string | number
//   ): void => {
//     setStudents((prev) =>
//       prev.map((student) => {
//         if (student.key !== key) return student;

//         const updated = { ...student, [field]: value };

//         if (["tugas", "kuis", "uts", "uas"].includes(field as string)) {
//           if (!hasAllAssessmentScores(updated)) {
//             updated.nilaiAkhir = 0;
//             updated.nilaiMutu = "";
//             updated.kelulusan = "";
//             return updated;
//           }

//           // Simple calculation if no weights
//           const finalScore =
//             ((Number(updated.tugas) || 0) +
//               (Number(updated.kuis) || 0) +
//               (Number(updated.uts) || 0) +
//               (Number(updated.uas) || 0)) /
//             4;
//           updated.nilaiAkhir = Math.round(finalScore * 100) / 100;

//           const gradeInfo = calculateGradeInfo(updated.nilaiAkhir);
//           updated.nilaiMutu = gradeInfo.nilaiMutu;
//           updated.kelulusan = gradeInfo.kelulusan;
//         }

//         return updated;
//       })
//     );
//   };

//   const calculateAverageForField = (field: string): number => {
//     if (field === "nilaiAkhir") {
//       const studentsWithCompleteScores = students.filter(
//         hasAllAssessmentScores
//       );
//       if (studentsWithCompleteScores.length === 0) return 0;
//       const total = studentsWithCompleteScores.reduce(
//         (sum, student) => sum + (Number(student[field]) || 0),
//         0
//       );
//       return Math.round((total / studentsWithCompleteScores.length) * 10) / 10;
//     }
//     return calculateAverage(students, field);
//   };

//   const handleSave = async () => {
//     try {
//       console.log("Saving data:", { students, assessmentWeights, courseInfo });
//       message.success("Data berhasil disimpan!");
//     } catch (error) {
//       message.error("Gagal menyimpan data");
//     }
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <Spin size="large" />
//         <div className="ml-4">Loading course data...</div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="p-6">
//         <Alert
//           message="Error"
//           description={`Failed to load course data: ${error}`}
//           type="error"
//           action={
//             <Button size="small" danger onClick={fetchCourseData}>
//               Retry
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   const selectedCourseData = curriculumData?.mata_kuliah?.[selectedCourse];
//   const relatedCPL = getRelatedCPL(selectedCourse);
//   const studentsWithCompleteAssessments = students.filter(
//     hasAllAssessmentScores
//   );
//   const passedStudents = studentsWithCompleteAssessments.filter(
//     (s) => s.kelulusan === "Lulus"
//   );
//   const hasSubCPMK = hasSubCPMKData();

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-full mx-auto space-y-6">
//         {/* Header */}
//         <Card>
//           <div className="text-center bg-green-100 p-4 rounded-t">
//             <Title level={2} className="m-0">
//               RUBRIK PENILAIAN OBE - Dynamic Mode
//             </Title>
//             <Text className="text-yellow-600 font-semibold">
//               {hasSubCPMK
//                 ? "Mode Sub-CPMK: Sistem menggunakan struktur CPL → CPMK → Sub-CPMK"
//                 : "Mode CPMK: Sistem menggunakan struktur CPL → CPMK"}
//             </Text>
//           </div>

//           <div className="p-6 space-y-6">
//             {/* Assessment Mode Switch */}
//             <Card size="small">
//               <div className="flex items-center gap-4">
//                 <SettingOutlined className="text-lg" />
//                 <span className="font-semibold">Mode Terdeteksi:</span>
//                 <Badge
//                   status={hasSubCPMK ? "processing" : "default"}
//                   text={hasSubCPMK ? "Sub-CPMK Mode" : "CPMK Mode"}
//                 />
//                 <Text type="secondary" className="text-sm">
//                   {hasSubCPMK
//                     ? "Data Sub-CPMK terdeteksi - menggunakan struktur Sub-CPMK untuk penilaian"
//                     : "Tidak ada data Sub-CPMK - menggunakan struktur CPMK langsung"}
//                 </Text>
//                 <Switch
//                   checked={isGradeInputMode}
//                   onChange={setIsGradeInputMode}
//                   checkedChildren="Input Nilai"
//                   unCheckedChildren={
//                     hasSubCPMK ? "Input Sub-CPMK" : "Input CPMK"
//                   }
//                 />
//               </div>
//             </Card>

//             {/* Course Information */}
//             <Card title="Detail Matakuliah" size="small">
//               <Row gutter={[16, 16]}>
//                 <Col xs={24} sm={12} md={8}>
//                   <div>
//                     <Text strong>Matakuliah:</Text>
//                     <Select
//                       value={selectedCourse}
//                       onChange={setSelectedCourse}
//                       style={{ width: "100%", marginTop: 4 }}
//                       placeholder="Pilih Mata Kuliah"
//                     >
//                       {Object.entries(availableCourses).map(([code, data]) => (
//                         <Option key={code} value={code}>
//                           {data.nama}
//                         </Option>
//                       ))}
//                     </Select>
//                   </div>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <div>
//                     <Text strong>Kode Matakuliah:</Text>
//                     <div className="p-2 bg-gray-100 rounded mt-1">
//                       {selectedCourse}
//                     </div>
//                   </div>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <div>
//                     <Text strong>Jenis Matakuliah:</Text>
//                     <div className="p-2 bg-gray-100 rounded mt-1">
//                       {selectedCourseData?.jenis}
//                     </div>
//                   </div>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <div>
//                     <Text strong>SKS:</Text>
//                     <div className="p-2 bg-gray-100 rounded mt-1">
//                       {selectedCourseData?.sks}
//                     </div>
//                   </div>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <div>
//                     <Text strong>Semester:</Text>
//                     <Input
//                       type="number"
//                       value={courseInfo.semester}
//                       onChange={(e) =>
//                         setCourseInfo((prev) => ({
//                           ...prev,
//                           semester: Number(e.target.value) || 0,
//                         }))
//                       }
//                       style={{ marginTop: 4 }}
//                     />
//                   </div>
//                 </Col>
//                 <Col xs={24} sm={12} md={8}>
//                   <div>
//                     <Text strong>Tahun Akademik:</Text>
//                     <Input
//                       value={courseInfo.year}
//                       onChange={(e) =>
//                         setCourseInfo((prev) => ({
//                           ...prev,
//                           year: e.target.value,
//                         }))
//                       }
//                       style={{ marginTop: 4 }}
//                     />
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             {/* CPL, CPMK, and Sub-CPMK Description */}
//             {!isGradeInputMode && relatedCPL.length > 0 && (
//               <Row gutter={[16, 16]}>
//                 {relatedCPL.map((cpl) => {
//                   const cplData = curriculumData?.cpl?.[cpl];
//                   const relatedCPMK = getRelatedCPMK(cpl);
//                   return (
//                     <Col xs={24} md={12} key={cpl}>
//                       <Card
//                         title={
//                           <div className="text-center">
//                             {curriculumData?.cpl?.[cpl]?.kode || cpl}
//                           </div>
//                         }
//                         headStyle={{ backgroundColor: "#bbf7d0" }}
//                         size="small"
//                       >
//                         <div className="space-y-2">
//                           <Text className="text-sm">
//                             {cplData?.description}
//                           </Text>
//                           {relatedCPMK.map((cpmk) => {
//                             const cpmkData = curriculumData?.cpmk?.[cpmk];
//                             const relatedSubCPMK = getRelatedSubCPMK(cpmk);
//                             return (
//                               <div key={cpmk} className="space-y-1">
//                                 <div className="bg-green-100 p-2 text-sm font-bold rounded">
//                                   {cpmkData?.kode || cpmk}
//                                 </div>
//                                 <div className="text-xs p-2 bg-gray-50 rounded">
//                                   {cpmkData?.description}
//                                 </div>
//                                 {hasSubCPMK && relatedSubCPMK.length > 0 && (
//                                   <div className="space-y-1 pl-4">
//                                     {relatedSubCPMK.map((subCpmk) => {
//                                       const subCpmkData =
//                                         curriculumData?.subcpmk?.[subCpmk];
//                                       return (
//                                         <div
//                                           key={subCpmk}
//                                           className="bg-yellow-50 p-1 text-xs rounded border-l-2 border-yellow-300"
//                                         >
//                                           <span className="font-semibold">
//                                             {subCpmkData?.kode || subCpmk}:
//                                           </span>{" "}
//                                           {subCpmkData?.description}
//                                         </div>
//                                       );
//                                     })}
//                                   </div>
//                                 )}
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </Card>
//                     </Col>
//                   );
//                 })}
//               </Row>
//             )}

//             {/* Dynamic Assessment Weights Table */}
//             {relatedCPL.length > 0 && (
//               <Card
//                 title={`Bobot Assessment ${
//                   hasSubCPMK ? "Sub-CPMK" : "CPMK"
//                 } - Input Manual`}
//                 size="small"
//               >
//                 <DynamicAssessmentWeightsTable
//                   assessmentWeights={assessmentWeights}
//                   relatedCPL={relatedCPL}
//                   getRelatedCPMK={getRelatedCPMK}
//                   getRelatedSubCPMK={getRelatedSubCPMK}
//                   updateAssessmentWeight={updateAssessmentWeight}
//                   curriculumData={curriculumData}
//                   hasSubCPMKData={hasSubCPMK}
//                 />
//               </Card>
//             )}

//             {/* Warning for missing CPL/CPMK data */}
//             {relatedCPL.length === 0 && selectedCourse && (
//               <Alert
//                 message="Tidak ada data CPL/CPMK"
//                 description={`Tidak ditemukan data CPL/CPMK untuk mata kuliah ${selectedCourse}. Anda masih dapat menggunakan Mode Input Nilai untuk penilaian dasar.`}
//                 type="warning"
//                 icon={<ExclamationCircleOutlined />}
//                 showIcon
//               />
//             )}

//             {/* Action Buttons */}
//             <Space wrap>
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() =>
//                   initializeStudents(Math.max(1, students.length + 1))
//                 }
//               >
//                 Tambah Mahasiswa
//               </Button>
//               <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
//                 Print
//               </Button>
//               <Button
//                 icon={<ReloadOutlined />}
//                 onClick={fetchCourseData}
//                 loading={loading}
//               >
//                 Refresh Data
//               </Button>
//               <Button type="primary" onClick={handleSave}>
//                 Simpan Data
//               </Button>
//             </Space>

//             {/* Main Tabs */}
//             <Tabs defaultActiveKey="table" size="large">
//               <TabPane
//                 tab={
//                   <span>
//                     <TableOutlined />
//                     Data & Tabel Nilai
//                   </span>
//                 }
//                 key="table"
//               >
//                 <div className="space-y-6">
//                   {/* Enhanced Assessment Table */}
//                   <EnhancedStudentsGradesTable
//                     students={students}
//                     assessmentWeights={assessmentWeights}
//                     relatedCPL={relatedCPL}
//                     getRelatedCPMK={getRelatedCPMK}
//                     getRelatedSubCPMK={getRelatedSubCPMK}
//                     updateStudent={updateStudent}
//                     calculateAverage={calculateAverageForField}
//                     isGradeInputMode={isGradeInputMode}
//                     curriculumData={curriculumData}
//                     hasSubCPMKData={hasSubCPMK}
//                   />

//                   {/* Summary Statistics */}
//                   <Row gutter={[16, 16]}>
//                     <Col xs={12} sm={6}>
//                       <Card>
//                         <Statistic
//                           title="Total Mahasiswa"
//                           value={students.length}
//                         />
//                       </Card>
//                     </Col>
//                     <Col xs={12} sm={6}>
//                       <Card>
//                         <Statistic
//                           title="Rata-rata Nilai Akhir"
//                           value={calculateAverageForField("nilaiAkhir")}
//                           precision={1}
//                         />
//                       </Card>
//                     </Col>
//                     <Col xs={12} sm={6}>
//                       <Card>
//                         <Statistic
//                           title="Mahasiswa Lulus"
//                           value={passedStudents.length}
//                         />
//                       </Card>
//                     </Col>
//                     <Col xs={12} sm={6}>
//                       <Card>
//                         <Statistic
//                           title="Persentase Kelulusan"
//                           value={
//                             studentsWithCompleteAssessments.length > 0
//                               ? Math.round(
//                                   (passedStudents.length /
//                                     studentsWithCompleteAssessments.length) *
//                                     100
//                                 )
//                               : 0
//                           }
//                           suffix="%"
//                         />
//                       </Card>
//                     </Col>
//                   </Row>

//                   {/* Grade Scale Information */}
//                   <Card title="Tabel Konversi Nilai" size="small">
//                     <Row gutter={[8, 8]}>
//                       {GRADE_SCALE.map((grade, index) => (
//                         <Col xs={12} sm={8} md={6} lg={4} key={index}>
//                           <div className="p-3 border rounded-lg text-center">
//                             <div className="font-bold text-lg">
//                               {grade.nilaiMutu}
//                             </div>
//                             <div className="text-sm text-gray-600">
//                               {grade.nilaiAngka.min}-{grade.nilaiAngka.max}
//                             </div>
//                             <Tag
//                               color={
//                                 grade.kelulusan === "Lulus" ? "green" : "red"
//                               }
//                               className="text-xs"
//                             >
//                               {grade.kelulusan}
//                             </Tag>
//                           </div>
//                         </Col>
//                       ))}
//                     </Row>
//                   </Card>
//                 </div>
//               </TabPane>

//               <TabPane
//                 tab={
//                   <span>
//                     <BarChartOutlined />
//                     Grafik Radar {hasSubCPMK ? "Sub-CPMK" : "CPMK"}
//                   </span>
//                 }
//                 key="charts"
//               >
//                 {!isGradeInputMode ? (
//                   <Card
//                     title={`Grafik Radar Capaian ${
//                       hasSubCPMK ? "Sub-CPMK" : "CPMK"
//                     }`}
//                   >
//                     <Alert
//                       message={`Fitur Grafik ${
//                         hasSubCPMK ? "Sub-CPMK" : "CPMK"
//                       }`}
//                       description={`Grafik radar akan menampilkan capaian setiap ${
//                         hasSubCPMK ? "Sub-CPMK" : "CPMK"
//                       } berdasarkan penilaian yang telah diinput. Mode saat ini: ${
//                         hasSubCPMK ? "Sub-CPMK" : "CPMK"
//                       }.`}
//                       type="info"
//                       icon={<InfoCircleOutlined />}
//                       showIcon
//                     />
//                     <div className="text-center py-12 text-gray-500">
//                       <BarChartOutlined
//                         style={{ fontSize: 48, marginBottom: 16 }}
//                       />
//                       <div>
//                         Grafik radar {hasSubCPMK ? "Sub-CPMK" : "CPMK"} akan
//                         ditampilkan di sini berdasarkan data assessment
//                       </div>
//                     </div>
//                   </Card>
//                 ) : (
//                   <Alert
//                     message="Grafik radar tidak tersedia dalam mode ini"
//                     description={`Grafik radar hanya tersedia dalam mode Input ${
//                       hasSubCPMK ? "Sub-CPMK" : "CPMK"
//                     }. Silakan ubah ke mode Input ${
//                       hasSubCPMK ? "Sub-CPMK" : "CPMK"
//                     } untuk melihat grafik radar capaian.`}
//                     type="info"
//                     icon={<InfoCircleOutlined />}
//                     showIcon
//                   />
//                 )}
//               </TabPane>
//             </Tabs>
//           </div>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default GradingAssessmentTable;
