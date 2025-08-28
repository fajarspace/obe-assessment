// services/api.ts
import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { message } from "antd";
import type {
  ApiResponse,
  PL,
  CPL,
  MK,
  CPMK,
  SUBCPMK,
  CreatePLRequest,
  UpdatePLRequest,
  CreateCPLRequest,
  UpdateCPLRequest,
  CreateMKRequest,
  UpdateMKRequest,
  CreateCPMKRequest,
  UpdateCPMKRequest,
  CreateSUBCPMKRequest,
  UpdateSUBCPMKRequest,
} from "../types/interfaces";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.VITE_API_URI || "http://localhost:3001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor untuk menambahkan token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    const errorMessage = error.response?.data?.message || "Terjadi kesalahan";
    message.error(errorMessage);

    return Promise.reject(error);
  }
);

// Generic API functions
const get = async <T>(url: string): Promise<ApiResponse<T>> => {
  const response = await apiClient.get<ApiResponse<T>>(url);
  return response.data;
};

const post = async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data;
};

const patch = async <T>(url: string, data: any): Promise<ApiResponse<T>> => {
  const response = await apiClient.patch<ApiResponse<T>>(url, data);
  return response.data;
};

const del = async <T>(url: string): Promise<ApiResponse<T>> => {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data;
};

// PL API
export const plApi = {
  getAll: () => get<PL[]>("/pl"),
  getById: (id: number) => get<PL>(`/pl/${id}`),
  create: (data: CreatePLRequest) => post<PL>("/pl", data),
  update: (id: number, data: UpdatePLRequest) => patch<PL>(`/pl/${id}`, data),
  delete: (id: number) => del(`/pl/${id}`),
  manageCPLRelations: (
    plId: number,
    action: "add" | "remove" | "set",
    cplIds: number[]
  ) => post(`/pl/${plId}/cpl`, { action, cplIds }),
};

// CPL API
export const cplApi = {
  getAll: () => get<CPL[]>("/cpl"),
  getById: (id: number) => get<CPL>(`/cpl/${id}`),
  create: (data: CreateCPLRequest) => post<CPL>("/cpl", data),
  update: (id: number, data: UpdateCPLRequest) =>
    patch<CPL>(`/cpl/${id}`, data),
  delete: (id: number) => del(`/cpl/${id}`),
  managePLRelations: (
    cplId: number,
    action: "add" | "remove" | "set",
    plIds: number[]
  ) => post(`/cpl/${cplId}/pl`, { action, plIds }),
};

// MK API
export const mkApi = {
  getAll: () => get<MK[]>("/mk"),
  getById: (id: number) => get<MK>(`/mk/${id}`),
  getFullDetail: (id: number) => get<MK>(`/mk/${id}/full`),
  create: (data: CreateMKRequest) => post<MK>("/mk", data),
  update: (id: number, data: UpdateMKRequest) => patch<MK>(`/mk/${id}`, data),
  delete: (id: number) => del(`/mk/${id}`),
  manageCPLRelations: (
    mkId: number,
    action: "add" | "remove" | "set",
    cplIds: number[]
  ) => post(`/mk/${mkId}/cpl`, { action, cplIds }),
  manageCPMKRelations: (
    mkId: number,
    action: "add" | "remove" | "set",
    cpmkIds: number[]
  ) => post(`/mk/${mkId}/cpmk`, { action, cpmkIds }),
};

// CPMK API
export const cpmkApi = {
  getAll: () => get<CPMK[]>("/cpmk"),
  getById: (id: number) => get<CPMK>(`/cpmk/${id}`),
  create: (data: CreateCPMKRequest) => post<CPMK>("/cpmk", data),
  update: (id: number, data: UpdateCPMKRequest) =>
    patch<CPMK>(`/cpmk/${id}`, data),
  delete: (id: number) => del(`/cpmk/${id}`),
  manageCPLRelations: (
    cpmkId: number,
    action: "add" | "remove" | "set",
    cplIds: number[]
  ) => post(`/cpmk/${cpmkId}/cpl`, { action, cplIds }),
  manageMKRelations: (
    cpmkId: number,
    action: "add" | "remove" | "set",
    mkIds: number[]
  ) => post(`/cpmk/${cpmkId}/mk`, { action, mkIds }),
};

// SUBCPMK API
export const subcpmkApi = {
  getAll: () => get<SUBCPMK[]>("/subcpmk"),
  getById: (id: number) => get<SUBCPMK>(`/subcpmk/${id}`),
  getByCPMKId: (cpmkId: number) => get<SUBCPMK[]>(`/subcpmk/cpmk/${cpmkId}`),
  create: (data: CreateSUBCPMKRequest) => post<SUBCPMK>("/subcpmk", data),
  update: (id: number, data: UpdateSUBCPMKRequest) =>
    patch<SUBCPMK>(`/subcpmk/${id}`, data),
  delete: (id: number) => del(`/subcpmk/${id}`),
  manageCPMKRelations: (
    subcpmkId: number,
    action: "add" | "remove" | "set",
    cpmkIds: number[]
  ) => post(`/subcpmk/${subcpmkId}/cpmk`, { action, cpmkIds }),
  bulkCreate: (subcpmks: CreateSUBCPMKRequest[]) =>
    post("/subcpmk/bulk", { subcpmks }),
};
export default apiClient;
