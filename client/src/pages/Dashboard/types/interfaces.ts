// types/interfaces.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface PL {
  id: number;
  kode: string;
  deskripsi: string;
  userId: string;
  cpl?: CPL[];
}

export interface CPL {
  id: number;
  kode: string;
  deskripsi: string;
  userId: string;
  pl?: PL[];
  mk?: MK[];
  cpmk?: CPMK[];
}

export interface MK {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  prodi: string;
  jenis: "Wajib" | "Pilihan" | "MK Program Studi";
  userId: string;
  cpl?: CPL[];
  cpmk?: CPMK[];
}

// Updated interfaces.ts - Add many-to-many relationship for SUBCPMK
export interface SUBCPMK {
  id: number;
  kode: string;
  deskripsi: string;
  userId: string;
  cpmk?: CPMK[]; // Use 'cpmks' plural to match association alias
}

// Updated CPMK interface
export interface CPMK {
  id: number;
  kode: string;
  deskripsi: string;
  userId: string;
  cpl?: CPL[];
  mk?: MK[];
  subcpmk?: SUBCPMK[]; // Use 'subcpmk' plural to match association alias
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CreateCPLRequest {
  kode: string;
  nama: string;
  deskripsi: string;
  plIds?: number[];
  mkIds?: number[];
  cpmkIds?: number[];
}

export interface UpdateCPLRequest {
  kode?: string;
  nama?: string;
  deskripsi?: string;
  plIds?: number[];
  mkIds?: number[];
  cpmkIds?: number[];
}

export interface CreateCPMKRequest {
  kode: string;
  nama: string;
  deskripsi: string;
  cplIds?: number[];
  mkIds?: number[];
}

export interface UpdateCPMKRequest {
  kode?: string;
  nama?: string;
  deskripsi?: string;
  cplIds?: number[];
  mkIds?: number[];
}

export interface CreateMKRequest {
  kode: string;
  nama: string;
  sks: number;
  prodi: string;
  jenis: "Wajib" | "Pilihan" | "MK Program Studi";
  cplIds?: number[];
  cpmkIds?: number[];
}

export interface UpdateMKRequest {
  kode?: string;
  nama?: string;
  sks?: number;
  prodi?: string;
  jenis?: "Wajib" | "Pilihan" | "MK Program Studi";
  cplIds?: number[];
  cpmkIds?: number[];
}

export interface CreatePLRequest {
  kode: string;
  nama: string;
  deskripsi: string;
  cplIds?: number[];
}

export interface UpdatePLRequest {
  kode?: string;
  nama?: string;
  deskripsi?: string;
  cplIds?: number[];
}

// Updated request interfaces
export interface CreateSUBCPMKRequest {
  kode: string;
  nama: string;
  deskripsi: string;
  cpmkIds: number[]; // Changed to array
}

export interface UpdateSUBCPMKRequest {
  kode?: string;
  nama?: string;
  deskripsi?: string;
  cpmkIds?: number[]; // Changed to array
}
