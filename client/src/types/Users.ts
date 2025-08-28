export type Profile = {
  id: number;
  nama: string;
  nidn: string;
  prodi: string;
  pengampuId: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  pengampu?: {
    id: number;
    nama: string;
    nidn: string;
    prodi: string;
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  whoamiId: number;
  whoami?: {
    id: number;
    nama: string;
    nidn: string;
    prodi: string;
  };
  phone_number: string;
  profile?: Profile; // Added profile field
};
