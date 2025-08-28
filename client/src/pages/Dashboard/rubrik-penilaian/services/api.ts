// services/api.ts
import axios from "axios";
import type {
  MK,
  Student,
  ApiResponse,
  AssessmentSavePayload,
  StudentFormData,
  AssessmentTypeFormData,
  GradingScale,
  AssessmentType,
} from "../interfaces";

const API_BASE_URL = import.meta.env.VITE_API_URI;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// MK API endpoints
export const mkApi = {
  // Get all mata kuliah
  getAll: async (): Promise<ApiResponse<MK[]>> => {
    try {
      const response = await apiClient.get("/mk");
      return response.data;
    } catch (error) {
      console.error("Error fetching MK data:", error);
      throw error;
    }
  },

  // Get mata kuliah by ID with full details (CPMK, SubCPMK, etc.)
  getById: async (id: number): Promise<ApiResponse<MK>> => {
    try {
      const response = await apiClient.get(`/mk/${id}`, {
        params: {
          include: "cpmk.subcpmk,cpl", // Include related data
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching MK by ID:", error);
      throw error;
    }
  },

  // Create new mata kuliah
  create: async (mkData: Partial<MK>): Promise<ApiResponse<MK>> => {
    try {
      const response = await apiClient.post("/mk", mkData);
      return response.data;
    } catch (error) {
      console.error("Error creating MK:", error);
      throw error;
    }
  },

  // Update mata kuliah
  update: async (id: number, mkData: Partial<MK>): Promise<ApiResponse<MK>> => {
    try {
      const response = await apiClient.put(`/mk/${id}`, mkData);
      return response.data;
    } catch (error) {
      console.error("Error updating MK:", error);
      throw error;
    }
  },

  // Delete mata kuliah
  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/mk/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting MK:", error);
      throw error;
    }
  },
};

// Student API endpoints
export const studentApi = {
  // Get all students for a course
  getByCourse: async (mkId: number): Promise<ApiResponse<Student[]>> => {
    try {
      const response = await apiClient.get(`/mk/${mkId}/students`);
      return response.data;
    } catch (error) {
      console.error("Error fetching students:", error);
      // Return mock data if endpoint doesn't exist yet (for development)
      if (process.env.NODE_ENV === "development") {
        return {
          success: true,
          message: "Mock data loaded",
          data: [
            { id: 1, nim: "312510001", nama: "Andi Saputra" },
            { id: 2, nim: "312510002", nama: "Ariel Nugroho" },
            { id: 3, nim: "312510003", nama: "Budi Santoso" },
            { id: 4, nim: "312510004", nama: "Dedi Pratama" },
            { id: 5, nim: "312510005", nama: "Desi Marlina" },
            { id: 6, nim: "312510006", nama: "Fahmi Hidayat" },
            { id: 7, nim: "312510007", nama: "Fitri Handayani" },
            { id: 8, nim: "312510008", nama: "Galih Prakoso" },
            { id: 9, nim: "312510009", nama: "Maya Anggraini" },
            { id: 10, nim: "312510010", nama: "Nanda Permata" },
            { id: 11, nim: "312510011", nama: "Nurul Aisyah" },
            { id: 12, nim: "312510012", nama: "Rangga Aditya" },
            { id: 13, nim: "312510013", nama: "Rina Kartika" },
            { id: 14, nim: "312510014", nama: "Rizky Ramadhan" },
            { id: 15, nim: "312510015", nama: "Siti Lestari" },
            { id: 16, nim: "312510016", nama: "Wulan Pertiwi" },
            { id: 17, nim: "312510017", nama: "Yoga Prabowo" },
          ],
        };
      }
      throw error;
    }
  },

  // Get all students (not course-specific)
  getAll: async (): Promise<ApiResponse<Student[]>> => {
    try {
      const response = await apiClient.get("/students");
      return response.data;
    } catch (error) {
      console.error("Error fetching all students:", error);
      throw error;
    }
  },

  // Add new student
  create: async (
    studentData: StudentFormData & { mkId?: number }
  ): Promise<ApiResponse<Student>> => {
    try {
      const response = await apiClient.post("/students", studentData);
      return response.data;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  },

  // Update student
  update: async (
    id: number,
    studentData: Partial<StudentFormData>
  ): Promise<ApiResponse<Student>> => {
    try {
      const response = await apiClient.put(`/students/${id}`, studentData);
      return response.data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  // Delete student
  delete: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/students/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  },

  // Enroll student to course
  enrollToCourse: async (
    studentId: number,
    mkId: number
  ): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post(`/students/${studentId}/enroll`, {
        mkId,
      });
      return response.data;
    } catch (error) {
      console.error("Error enrolling student:", error);
      throw error;
    }
  },

  // Remove student from course
  removeFromCourse: async (
    studentId: number,
    mkId: number
  ): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(
        `/students/${studentId}/courses/${mkId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error removing student from course:", error);
      throw error;
    }
  },
};

// Assessment API endpoints
export const assessmentApi = {
  // Save complete assessment configuration and scores
  save: async (data: AssessmentSavePayload): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post("/assessments", data);
      return response.data;
    } catch (error) {
      console.error("Error saving assessment data:", error);
      throw error;
    }
  },

  // Load assessment configuration for a course
  load: async (mkId: number): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(`/assessments/${mkId}`);
      return response.data;
    } catch (error) {
      console.error("Error loading assessment data:", error);
      throw error;
    }
  },

  // Save individual assessment scores
  saveScores: async (
    mkId: number,
    scores: any[]
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post(`/assessments/${mkId}/scores`, {
        scores,
      });
      return response.data;
    } catch (error) {
      console.error("Error saving assessment scores:", error);
      throw error;
    }
  },

  // Get assessment scores for a course
  getScores: async (mkId: number): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiClient.get(`/assessments/${mkId}/scores`);
      return response.data;
    } catch (error) {
      console.error("Error getting assessment scores:", error);
      throw error;
    }
  },

  // Get grading scale
  getGradingScale: async (): Promise<ApiResponse<GradingScale[]>> => {
    try {
      const response = await apiClient.get("/grading-scale");
      return response.data;
    } catch (error) {
      console.error("Error getting grading scale:", error);
      throw error;
    }
  },

  // Get assessment types for a course
  getAssessmentTypes: async (
    mkId: number
  ): Promise<ApiResponse<AssessmentType[]>> => {
    try {
      const response = await apiClient.get(`/assessment-types/${mkId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting assessment types:", error);
      throw error;
    }
  },

  // Create new assessment type
  createAssessmentType: async (
    data: AssessmentTypeFormData & { mkId: number }
  ): Promise<ApiResponse<AssessmentType>> => {
    try {
      const response = await apiClient.post("/assessment-types", data);
      return response.data;
    } catch (error) {
      console.error("Error creating assessment type:", error);
      throw error;
    }
  },

  // Update assessment type
  updateAssessmentType: async (
    id: string,
    data: Partial<AssessmentTypeFormData>
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.put(`/assessment-types/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating assessment type:", error);
      throw error;
    }
  },

  // Delete assessment type
  deleteAssessmentType: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.delete(`/assessment-types/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting assessment type:", error);
      throw error;
    }
  },

  // Export assessment data
  export: async (
    mkId: number,
    format: "excel" | "pdf" = "excel"
  ): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/assessments/${mkId}/export`, {
        params: { format },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting assessment data:", error);
      throw error;
    }
  },

  // Import assessment data from file
  import: async (mkId: number, file: File): Promise<ApiResponse<any>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mkId", mkId.toString());

      const response = await apiClient.post(
        `/assessments/${mkId}/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error importing assessment data:", error);
      throw error;
    }
  },
};

// Report API endpoints
export const reportApi = {
  // Generate OBE report
  generateOBEReport: async (mkId: number): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(`/reports/obe/${mkId}`);
      return response.data;
    } catch (error) {
      console.error("Error generating OBE report:", error);
      throw error;
    }
  },

  // Get student progress report
  getStudentProgress: async (
    studentId: number,
    mkId: number
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(
        `/reports/student/${studentId}/course/${mkId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting student progress:", error);
      throw error;
    }
  },

  // Get class performance summary
  getClassSummary: async (mkId: number): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(`/reports/class/${mkId}/summary`);
      return response.data;
    } catch (error) {
      console.error("Error getting class summary:", error);
      throw error;
    }
  },
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Format error message
  formatErrorMessage: (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "Terjadi kesalahan yang tidak diketahui";
  },

  // Check if API is online
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get("/health");
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },
};

export default apiClient;
