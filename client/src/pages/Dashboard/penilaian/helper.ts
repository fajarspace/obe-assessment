// utils/helpers.ts - Enhanced Version
import type {
  Student,
  CurriculumData,
  CourseInfo,
  MataKuliah,
  CPL,
  CPMK,
  SubCPMK,
} from "@/types/interface";

// Constants
export const GRADE_SCALE = [
  { nilaiAngka: { min: 80, max: 100 }, nilaiMutu: "A", kelulusan: "Lulus" },
  {
    nilaiAngka: { min: 76.25, max: 79.99 },
    nilaiMutu: "A-",
    kelulusan: "Lulus",
  },
  {
    nilaiAngka: { min: 68.75, max: 76.24 },
    nilaiMutu: "B+",
    kelulusan: "Lulus",
  },
  { nilaiAngka: { min: 65, max: 68.74 }, nilaiMutu: "B", kelulusan: "Lulus" },
  {
    nilaiAngka: { min: 62.5, max: 64.99 },
    nilaiMutu: "B-",
    kelulusan: "Lulus",
  },
  {
    nilaiAngka: { min: 57.5, max: 62.49 },
    nilaiMutu: "C+",
    kelulusan: "Lulus",
  },
  { nilaiAngka: { min: 55, max: 57.49 }, nilaiMutu: "C", kelulusan: "Lulus" },
  {
    nilaiAngka: { min: 51.25, max: 54.99 },
    nilaiMutu: "C-",
    kelulusan: "Tidak Lulus",
  },
  {
    nilaiAngka: { min: 43.75, max: 51.24 },
    nilaiMutu: "D+",
    kelulusan: "Tidak Lulus",
  },
  {
    nilaiAngka: { min: 40, max: 43.74 },
    nilaiMutu: "D",
    kelulusan: "Tidak Lulus",
  },
  {
    nilaiAngka: { min: 0, max: 39.99 },
    nilaiMutu: "E",
    kelulusan: "Tidak Lulus",
  },
];

export const DEFAULT_COURSE_INFO: CourseInfo = {
  semester: 1,
  year: "2024/2025",
  lecturer: "",
};

// Utility Functions
export const calculateGradeInfo = (score: number) => {
  const gradeInfo = GRADE_SCALE.find(
    (grade) => score >= grade.nilaiAngka.min && score <= grade.nilaiAngka.max
  );
  return {
    nilaiMutu: gradeInfo?.nilaiMutu || "E",
    kelulusan: gradeInfo?.kelulusan || "Tidak Lulus",
  };
};

export const calculateAverage = (
  students: Student[],
  field: string
): number => {
  if (students.length === 0) return 0;
  const total = students.reduce(
    (sum, student) => sum + (Number(student[field]) || 0),
    0
  );
  return Math.round((total / students.length) * 10) / 10;
};

export const createDefaultStudent = (index: number): Student => ({
  key: `student-${index + 1}`,
  no: index + 1,
  nim: ``,
  name: ``,
  tugas: 0,
  kuis: 0,
  uts: 0,
  uas: 0,
  tugasKomentar: "",
  kuisKomentar: "",
  utsKomentar: "",
  uasKomentar: "",
  nilaiAkhir: 0,
  nilaiMutu: "",
  kelulusan: "",
});

// Get performance indicator based on score
export const getPerformanceIndicator = (
  score: number
): { label: number; description: string; color: string } => {
  if (score >= 76.25) {
    return { label: 4, description: "Sangat Menguasai", color: "#52c41a" }; // Green
  } else if (score >= 65) {
    return { label: 3, description: "Menguasai", color: "#1890ff" }; // Blue
  } else if (score >= 51.25) {
    return { label: 2, description: "Cukup Menguasai", color: "#faad14" }; // Orange
  } else if (score >= 40) {
    return { label: 1, description: "Kurang Menguasai", color: "#ff4d4f" }; // Red
  } else {
    return { label: 0, description: "Tidak Menguasai", color: "#8c8c8c" }; // Gray
  }
};

// Get CPMK weight percentage
export const getCpmkWeight = (cpmk: string): string => {
  switch (cpmk) {
    case "CPMK-5":
      return "15%";
    case "CPMK-22":
      return "15%";
    case "CPMK-23":
      return "30%";
    case "CPMK-24":
      return "40%";
    default:
      return "25%"; // Default equal distribution
  }
};

// Enhanced utility function to get description
const getDescription = (item: any): string => {
  return (
    item?.deskripsi ||
    item?.description ||
    item?.desc ||
    "Deskripsi tidak tersedia"
  );
};

// Enhanced utility function to get prodi
const getProdi = (item: any): string => {
  return (
    item?.prodi ||
    item?.program_studi ||
    item?.programStudi ||
    "Program studi tidak tersedia"
  );
};

// Transform API data to curriculum data structure - ENHANCED VERSION
export const transformApiDataToCurriculumData = (
  apiData: any[]
): CurriculumData => {
  const mata_kuliah: Record<string, MataKuliah> = {};
  const cpl: Record<string, CPL> = {};
  const cpmk: Record<string, CPMK> = {};
  const subcpmk: Record<string, SubCPMK> = {};

  console.log("Raw API Data:", apiData);

  apiData.forEach((mk) => {
    const mkCode = mk.kode || mk.id.toString();

    // Initialize mata kuliah with enhanced fields
    mata_kuliah[mkCode] = {
      id: mk.id.toString(),
      nama: mk.nama || "Unknown Course",
      sks: mk.sks || 3,
      universitas: mk.universitas || "Unknown University",
      jenis: mk.jenis || "Unknown Type",
      semester: mk.semester || 1,
      related_cpl: [],
      prodi: getProdi(mk), // Enhanced prodi extraction
      deskripsi: getDescription(mk), // Add description
    };

    console.log(`Processing MK: ${mkCode}`, mk);

    // Process CPMK array
    if (mk.cpmk && Array.isArray(mk.cpmk)) {
      mk.cpmk.forEach((cpmkItem: any) => {
        const cpmkCode = cpmkItem.kode || cpmkItem.id.toString();
        const relatedSubCpmk: string[] = [];

        console.log(`Processing CPMK: ${cpmkCode}`, cpmkItem);

        // Process Sub-CPMK if exists
        if (cpmkItem.subcpmk && Array.isArray(cpmkItem.subcpmk)) {
          cpmkItem.subcpmk.forEach((subCpmkItem: any) => {
            const subCpmkCode = subCpmkItem.kode || subCpmkItem.id.toString();

            subcpmk[subCpmkCode] = {
              id: subCpmkItem.id.toString(),
              kode: subCpmkCode,
              description: getDescription(subCpmkItem), // Enhanced description
              deskripsi: getDescription(subCpmkItem), // Alternative field
              cpmkId: cpmkCode,
            };

            relatedSubCpmk.push(subCpmkCode);
            console.log(
              `Added SubCPMK: ${subCpmkCode} with description: ${getDescription(
                subCpmkItem
              )}`
            );
          });
        }

        // Initialize CPMK with enhanced fields
        cpmk[cpmkCode] = {
          id: cpmkItem.id.toString(),
          kode: cpmkCode,
          description: getDescription(cpmkItem), // Enhanced description
          deskripsi: getDescription(cpmkItem), // Alternative field
          related_subcpmk: relatedSubCpmk,
          related_cpl: [], // Will be populated from CPL array
        };

        // Process CPL array
        if (cpmkItem.cpl && Array.isArray(cpmkItem.cpl)) {
          cpmkItem.cpl.forEach((cplItem: any) => {
            const cplCode = cplItem.kode || cplItem.id.toString();

            console.log(`Processing CPL: ${cplCode} for CPMK: ${cpmkCode}`);

            // Initialize CPL if not exists with enhanced fields
            if (!cpl[cplCode]) {
              cpl[cplCode] = {
                id: cplItem.id.toString(),
                kode: cplCode,
                description: getDescription(cplItem), // Enhanced description
                deskripsi: getDescription(cplItem), // Alternative field
                related_cpmk: [],
              };
              console.log(
                `Created new CPL: ${cplCode} with description: ${getDescription(
                  cplItem
                )}`
              );
            }

            // Add CPMK to CPL's related_cpmk if not already there
            if (!cpl[cplCode].related_cpmk.includes(cpmkCode)) {
              cpl[cplCode].related_cpmk.push(cpmkCode);
              console.log(`Added CPMK ${cpmkCode} to CPL ${cplCode}`);
            }

            // Add CPL to CPMK's related_cpl if not already there
            if (!cpmk[cpmkCode].related_cpl.includes(cplCode)) {
              cpmk[cpmkCode].related_cpl.push(cplCode);
              console.log(`Added CPL ${cplCode} to CPMK ${cpmkCode}`);
            }

            // Add CPL to MK's related_cpl if not already there
            if (!mata_kuliah[mkCode].related_cpl.includes(cplCode)) {
              mata_kuliah[mkCode].related_cpl.push(cplCode);
              console.log(`Added CPL ${cplCode} to MK ${mkCode}`);
            }
          });
        } else {
          console.warn(`CPMK ${cpmkCode} has no CPL array or invalid CPL data`);
        }
      });
    } else {
      console.warn(`MK ${mkCode} has no CPMK array or invalid CPMK data`);
    }
  });

  const result = {
    mata_kuliah,
    cpl,
    cpmk,
    subcpmk,
    assessment_types: {
      tugas: { id: "1", nama: "Tugas", description: "Tugas dan Praktikum" },
      kuis: { id: "2", nama: "Kuis", description: "Kuis dan Quiz" },
      uts: { id: "3", nama: "UTS", description: "Ujian Tengah Semester" },
      uas: { id: "4", nama: "UAS", description: "Ujian Akhir Semester" },
    },
    assessment_weights: {},
  };

  console.log("Transformed curriculum data:", result);
  console.log("CPL data with descriptions:", cpl);
  console.log("CPMK data with descriptions:", cpmk);
  console.log("SubCPMK data with descriptions:", subcpmk);
  console.log("Mata Kuliah data with prodi:", mata_kuliah);

  return result;
};
