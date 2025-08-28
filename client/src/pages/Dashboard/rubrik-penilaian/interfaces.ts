// types/assessment.types.ts

export interface Student {
  key: string;
  no: number;
  nim: string;
  nama: string;
  tugas: number;
  kuis: number;
  uts: number;
  uas: number;
  [key: string]: string | number; // This allows dynamic fields like "uas_SUBCPMK001_CPMK001_CPL001"
}

export interface CPLData {
  id: number;
  kode: string;
  deskripsi: string;
  userId: string;
}

export interface SubCPMKData {
  id: number;
  kode: string;
  deskripsi: string;
  userId: string;
  subcpmk_cpmk?: {
    createdAt: string;
    updatedAt: string;
    subcpmklId: number;
    cpmkId: number;
  };
}

export interface CPMKData {
  id: number;
  kode: string;
  deskripsi: string;
  userId: string;
  cpl?: CPLData[]; // Make optional to handle cases where CPL might not exist
  subcpmk?: SubCPMKData[];
}

export interface MKData {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  prodi: string;
  jenis: string;
  userId: string;
  cpl?: CPLData[]; // Make cpl optional to match API
  cpmk?: CPMKData[]; // Make cpmk optional to match API
}

// Assessment weights structure with SubCPMK support
export interface AssessmentWeights {
  [subcpmkCode: string]: {
    tugas: number;
    kuis: number;
    uts: number;
    uas: number;
  };
}

// CPMK and SubCPMK percentages
export interface CPMKPercentages {
  [cpmkCode: string]: number;
}

export interface SubCPMKPercentages {
  [subcpmkCode: string]: number;
}

// Assessment modes
export type AssessmentMode = "nilai" | "cpmk";

// Grade and CPMK scales
export interface GradeScale {
  min: number;
  max: number;
  grade: string;
  point: number;
}

export interface CPMKScale {
  min: number;
  max: number;
  level: string;
  point: number;
}

export interface AssessmentConfig {
  key: string;
  assessment: string;
  target: number;
  isTotal: boolean;
}
