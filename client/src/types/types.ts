// types.ts - Updated TypeScript interfaces with Sub-CPMK support

export const prodiOptions = [
  { value: "Teknik Informatika", label: "Teknik Informatika" },
  { value: "Teknik Industri", label: "Teknik Industri" },
  { value: "Teknik Sipil", label: "Teknik Sipil" },
  { value: "Arsitektur", label: "Arsitektur" },
  { value: "Teknik Lingkungan", label: "Teknik Lingkungan" },
  { value: "Teknologi Hasil Pertanian", label: "Teknologi Hasil Pertanian" },
];

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
  parent_cpmk: string;
}

export interface AssessmentWeights {
  [cpl: string]: {
    [cpmk: string]: {
      [subcpmk: string]: {
        tugas: number;
        kuis: number;
        uts: number;
        uas: number;
        [key: string]: number; // For custom assessment types
      };
    };
  };
}

export interface CustomAssessmentType {
  id: string;
  key: string;
  title: string;
  color: string;
  isCustom: boolean;
}

export interface CourseInfo {
  semester: number;
  year: string;
  lecturer: string;
}

export interface MataKuliah {
  id: string;
  nama: string;
  sks: number;
  universitas: string;
  jenis: string;
  semester: number;
  related_cpl: string[];
}

export interface CurriculumData {
  mata_kuliah: Record<string, MataKuliah>;
  cpl: Record<
    string,
    {
      id: string;
      kode: string;
      description: string;
      related_cpmk: string[];
    }
  >;
  cpmk: Record<
    string,
    {
      id: string;
      kode: string;
      description: string;
      related_subcpmk: string[];
    }
  >;
  subcpmk: Record<string, SubCPMK>;
  assessment_types: Record<
    string,
    { id: string; nama: string; description: string }
  >;
  assessment_weights: AssessmentWeights;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: any[];
  error?: string;
}

export interface GradeScale {
  nilaiAngka: { min: number; max: number };
  nilaiMutu: string;
  kelulusan: string;
}

export interface AssessmentType {
  key: string;
  title: string;
  color: string;
}

export interface TableColumn {
  title: string | React.ReactNode;
  dataIndex?: string;
  key: string;
  width?: number;
  className?: string;
  onHeaderCell?: () => { style: React.CSSProperties };
  onCell?: (record: any) => { style: React.CSSProperties };
  render?: (value: any, record: any) => React.ReactNode;
  children?: TableColumn[];
}

// IndexedDB Schema
export interface StoredData {
  id?: number;
  courseCode: string;
  students: Student[];
  assessmentWeights: AssessmentWeights;
  customAssessmentTypes: CustomAssessmentType[];
  courseInfo: CourseInfo;
  timestamp: number;
}
