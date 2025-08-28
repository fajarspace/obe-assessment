// services/relationshipApi.ts
import api from "./api";
import type { ApiResponse } from "../types/interfaces";

export interface RelationshipAction {
  action: "add" | "remove" | "set";
  ids: number[];
}

export const relationshipApi = {
  // PL relationships
  managePLCPL: (plId: number, data: { action: string; cplIds: number[] }) =>
    api.post<ApiResponse<void>>(`/pl/${plId}/relations/cpl`, data),

  // CPL relationships
  manageCPLPL: (cplId: number, data: { action: string; plIds: number[] }) =>
    api.post<ApiResponse<void>>(`/cpl/${cplId}/relations/pl`, data),
  manageCPLMK: (cplId: number, data: { action: string; mkIds: number[] }) =>
    api.post<ApiResponse<void>>(`/cpl/${cplId}/relations/mk`, data),
  manageCPLCPMK: (cplId: number, data: { action: string; cpmkIds: number[] }) =>
    api.post<ApiResponse<void>>(`/cpl/${cplId}/relations/cpmk`, data),

  // MK relationships
  manageMKCPL: (mkId: number, data: { action: string; cplIds: number[] }) =>
    api.post<ApiResponse<void>>(`/mk/${mkId}/relations/cpl`, data),
  manageMKCPMK: (mkId: number, data: { action: string; cpmkIds: number[] }) =>
    api.post<ApiResponse<void>>(`/mk/${mkId}/relations/cpmk`, data),

  // CPMK relationships
  manageCPMKCPL: (cpmkId: number, data: { action: string; cplIds: number[] }) =>
    api.post<ApiResponse<void>>(`/cpmk/${cpmkId}/relations/cpl`, data),
  manageCPMKMK: (cpmkId: number, data: { action: string; mkIds: number[] }) =>
    api.post<ApiResponse<void>>(`/cpmk/${cpmkId}/relations/mk`, data),
  manageCPMKSUBCPMK: (
    cpmkId: number,
    data: { action: string; subcpmkIds: number[] }
  ) => api.post<ApiResponse<void>>(`/cpmk/${cpmkId}/relations/subcpmk`, data),

  // SUBCPMK relationships
  manageSUBCPMKCPMK: (
    subcpmkId: number,
    data: { action: string; cpmkIds: number[] }
  ) =>
    api.post<ApiResponse<void>>(`/subcpmk/${subcpmkId}/relations/cpmk`, data),
};
