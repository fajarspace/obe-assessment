// utils/helpers.ts - Enhanced Version with Direct MK-CPMK Relations
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
  year: "",
  kelas: "",
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

// Transform API data to curriculum data structure - ENHANCED VERSION with Sequelize Relations
export const transformApiDataToCurriculumData = (
  apiData: any[]
): CurriculumData => {
  const mata_kuliah: Record<string, MataKuliah> = {};
  const cpl: Record<string, CPL> = {};
  const cpmk: Record<string, CPMK> = {};
  const subcpmk: Record<string, SubCPMK> = {};

  console.log("Raw API Data (Sequelize structure):", apiData);

  apiData.forEach((mk) => {
    const mkCode = mk.kode || mk.id.toString();

    // Initialize mata kuliah with enhanced fields including direct CPMK relations
    mata_kuliah[mkCode] = {
      id: mk.id.toString(),
      nama: mk.nama || "Unknown Course",
      sks: mk.sks || 3,
      universitas: mk.universitas || "Universitas Pelita Bangsa",
      jenis: mk.jenis || "Unknown Type",
      semester: mk.semester || 1,
      related_cpl: [],
      related_cpmk: [], // Direct CPMK relations - will be populated below
      prodi: getProdi(mk), // Enhanced prodi extraction
      deskripsi: getDescription(mk), // Add description
    };

    // Track direct CPMK relations for this MK
    const directCPMKRelations: string[] = [];
    const relatedCPLs: Set<string> = new Set();

    // Process CPMK array (Sequelize association result)
    if (mk.cpmk && Array.isArray(mk.cpmk)) {
      mk.cpmk.forEach((cpmkItem: any) => {
        const cpmkCode = cpmkItem.kode || cpmkItem.id.toString();
        const relatedSubCpmk: string[] = [];

        // Add this CPMK to direct relations for this MK
        directCPMKRelations.push(cpmkCode);

        // Process Sub-CPMK if exists (Sequelize association)
        if (cpmkItem.subcpmk && Array.isArray(cpmkItem.subcpmk)) {
          cpmkItem.subcpmk.forEach((subCpmkItem: any) => {
            const subCpmkCode = subCpmkItem.kode || subCpmkItem.id.toString();

            subcpmk[subCpmkCode] = {
              id: subCpmkItem.id.toString(),
              kode: subCpmkCode,
              description: getDescription(subCpmkItem),
              deskripsi: getDescription(subCpmkItem),
              cpmkId: cpmkCode,
            };

            relatedSubCpmk.push(subCpmkCode);
            console.log(`Added SubCPMK: ${subCpmkCode} for CPMK: ${cpmkCode}`);
          });
        }

        // Initialize CPMK with enhanced fields
        if (!cpmk[cpmkCode]) {
          cpmk[cpmkCode] = {
            id: cpmkItem.id.toString(),
            kode: cpmkCode,
            description: getDescription(cpmkItem),
            deskripsi: getDescription(cpmkItem),
            related_subcpmk: relatedSubCpmk,
            related_cpl: [],
          };
        } else {
          // Merge subcpmk if CPMK already exists
          const existingSubCpmk = cpmk[cpmkCode].related_subcpmk;
          relatedSubCpmk.forEach((subCpmk) => {
            if (!existingSubCpmk.includes(subCpmk)) {
              existingSubCpmk.push(subCpmk);
            }
          });
        }

        // Process CPL array (Sequelize association through junction table)
        if (cpmkItem.cpl && Array.isArray(cpmkItem.cpl)) {
          cpmkItem.cpl.forEach((cplItem: any) => {
            const cplCode = cplItem.kode || cplItem.id.toString();

            // Add to related CPLs for this MK
            relatedCPLs.add(cplCode);

            // Initialize CPL if not exists with enhanced fields
            if (!cpl[cplCode]) {
              cpl[cplCode] = {
                id: cplItem.id.toString(),
                kode: cplCode,
                description: getDescription(cplItem),
                deskripsi: getDescription(cplItem),
                related_cpmk: [],
              };
            }

            // Add CPMK to CPL's related_cpmk if not already there
            if (!cpl[cplCode].related_cpmk.includes(cpmkCode)) {
              cpl[cplCode].related_cpmk.push(cpmkCode);
            }

            // Add CPL to CPMK's related_cpl if not already there
            if (!cpmk[cpmkCode].related_cpl.includes(cplCode)) {
              cpmk[cpmkCode].related_cpl.push(cplCode);
            }
          });
        } else {
          console.warn(
            `CPMK ${cpmkCode} has no CPL association or invalid CPL data`
          );
        }
      });

      // Set direct CPMK relations for this MK (only CPMK directly associated)
      mata_kuliah[mkCode].related_cpmk = directCPMKRelations;

      // Set CPL relations for this MK (collected from CPMK associations)
      mata_kuliah[mkCode].related_cpl = Array.from(relatedCPLs);

      console.log(
        `MK ${mkCode} has direct CPMK relations:`,
        directCPMKRelations
      );
      console.log(`MK ${mkCode} has CPL relations:`, Array.from(relatedCPLs));
    } else {
      console.warn(`MK ${mkCode} has no CPMK association or invalid CPMK data`);
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

  // Debug log untuk memeriksa hasil transformasi
  console.log("=== TRANSFORMATION RESULTS ===");
  console.log("Transformed mata_kuliah:", mata_kuliah);
  console.log("Transformed cpl:", cpl);
  console.log("Transformed cpmk:", cpmk);
  console.log("=== END TRANSFORMATION ===");

  return result;
};

// Helper function to get direct CPMK relations for a course
export const getDirectCPMKForCourse = (
  courseCode: string,
  curriculumData: CurriculumData | null
): string[] => {
  if (!curriculumData || !courseCode) return [];

  const courseData = curriculumData.mata_kuliah[courseCode];
  if (courseData?.related_cpmk && courseData.related_cpmk.length > 0) {
    console.log(`Direct CPMK for ${courseCode}:`, courseData.related_cpmk);
    return courseData.related_cpmk;
  }

  console.warn(`No direct CPMK relations found for course: ${courseCode}`);
  return [];
};

// Helper function to get filtered CPMK for a specific CPL based on course
export const getFilteredCPMKForCPL = (
  cplCode: string,
  courseCode: string,
  curriculumData: CurriculumData | null
): string[] => {
  if (!curriculumData || !cplCode || !courseCode) return [];

  // Get direct CPMK relations for the course
  const directCourseCPMK = getDirectCPMKForCourse(courseCode, curriculumData);

  // Get all CPMK that belong to this CPL
  const cplCPMK = curriculumData.cpl[cplCode]?.related_cpmk || [];

  // Return intersection - only CPMK that are both in CPL and directly related to course
  const filteredCPMK = directCourseCPMK.filter((cpmk) =>
    cplCPMK.includes(cpmk)
  );

  console.log(
    `Filtered CPMK for CPL ${cplCode} in course ${courseCode}:`,
    filteredCPMK
  );
  return filteredCPMK;
};

// Validation function to check if course has direct CPMK relations
export const validateCourseHasDirectCPMK = (
  courseCode: string,
  curriculumData: CurriculumData | null
): boolean => {
  const directCPMK = getDirectCPMKForCourse(courseCode, curriculumData);
  const hasDirectRelations = directCPMK.length > 0;

  if (!hasDirectRelations) {
    console.warn(
      `Course ${courseCode} has no direct CPMK relations. Consider adding related_cpmk field to the course data.`
    );
  }

  return hasDirectRelations;
};
