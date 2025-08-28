// types/interfaces.ts - Enhanced Version
export interface Student {
  key: string;
  no: number;
  nim: string;
  name: string;
  tugas: number;
  kuis: number;
  uts: number;
  uas: number;
  nilaiAkhir?: number;
  nilaiMutu?: string;
  kelulusan?: string;
  [key: string]: string | number | undefined;
}

export interface SubCPMK {
  id: string;
  kode: string;
  description: string;
  deskripsi?: string; // Alternative field name
  cpmkId: string;
}

export interface MataKuliah {
  id: string;
  nama: string;
  prodi: string; // Program studi field
  sks: number;
  universitas: string;
  jenis: string;
  semester: number;
  related_cpl: string[];
  deskripsi?: string; // Optional description
}

export interface CPL {
  id: string;
  kode: string;
  description: string;
  deskripsi?: string; // Alternative field name from API
  related_cpmk: string[];
}

export interface CPMK {
  id: string;
  kode: string;
  description: string;
  deskripsi?: string; // Alternative field name from API
  related_subcpmk: string[];
  related_cpl: string[]; // Added CPL relation to CPMK
}

export interface CurriculumData {
  mata_kuliah: Record<string, MataKuliah>;
  cpl: Record<string, CPL>;
  cpmk: Record<string, CPMK>;
  subcpmk: Record<string, SubCPMK>;
  assessment_types: Record<
    string,
    {
      id: string;
      nama: string;
      description: string;
    }
  >;
  assessment_weights: Record<
    string,
    Record<string, Record<string, Record<string, number>>>
  >;
}

export interface AssessmentWeights {
  [cpl: string]: {
    [cpmk: string]: {
      tugas: number;
      kuis: number;
      uts: number;
      uas: number;
      subcpmk?: {
        [subCpmk: string]: {
          tugas: number;
          kuis: number;
          uts: number;
          uas: number;
        };
      };
    };
  };
}

export interface CourseInfo {
  semester: number;
  year: string;
  kelas: string;
  lecturer: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: any[];
  error?: string;
}

// Enhanced User interface for auth context
export interface User {
  id?: string;
  username?: string;
  email?: string;
  prodi?: string;
  profile?: {
    nama?: string;
    nip?: string;
    jabatan?: string;
    fakultas?: string;
    prodi?: string;
  };
}
