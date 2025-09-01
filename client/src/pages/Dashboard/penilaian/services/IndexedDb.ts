// utils/indexedDBService.ts - Enhanced Version with Course Selection

import type { Student, AssessmentWeights, CourseInfo } from "@/types/interface";

interface GradingData {
  id: string;
  courseCode: string;
  students: Student[];
  assessmentWeights: AssessmentWeights;
  courseInfo: CourseInfo;
  assessmentTypes: string[];
  lastModified: Date;
}

interface CourseSelection {
  id: string;
  courseCode: string;
  courseName: string;
  courseInfo: CourseInfo;
  hasData: boolean;
  lastAccessed: Date;
  progress: {
    totalStudents: number;
    completedStudents: number;
    assessmentTypesSet: boolean;
    weightsConfigured: boolean;
  };
}

class IndexedDBService {
  private dbName = "GradingAssessmentDB";
  private version = 2; // Increment version for new object store
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create gradingData object store
        if (!db.objectStoreNames.contains("gradingData")) {
          const gradingStore = db.createObjectStore("gradingData", {
            keyPath: "id",
          });
          gradingStore.createIndex("courseCode", "courseCode", {
            unique: false,
          });
          gradingStore.createIndex("lastModified", "lastModified", {
            unique: false,
          });
        }

        // Create courseSelections object store
        if (!db.objectStoreNames.contains("courseSelections")) {
          const courseStore = db.createObjectStore("courseSelections", {
            keyPath: "id",
          });
          courseStore.createIndex("courseCode", "courseCode", {
            unique: false,
          });
          courseStore.createIndex("lastAccessed", "lastAccessed", {
            unique: false,
          });
          courseStore.createIndex("hasData", "hasData", {
            unique: false,
          });
        }

        // Create assessmentTypes object store
        if (!db.objectStoreNames.contains("assessmentTypes")) {
          db.createObjectStore("assessmentTypes", {
            keyPath: "id",
          });
        }

        // Create settings object store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", {
            keyPath: "key",
          });
        }
      };
    });
  }

  // Existing grading data methods
  async saveGradingData(
    courseCode: string,
    data: Omit<GradingData, "id" | "lastModified">
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const gradingData: GradingData = {
      id: courseCode,
      ...data,
      lastModified: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["gradingData"], "readwrite");
      const store = transaction.objectStore("gradingData");

      const request = store.put(gradingData);
      request.onsuccess = async () => {
        // Update course selection progress when saving grading data
        try {
          await this.updateCourseSelectionProgress(courseCode, data);
          resolve();
        } catch (error) {
          console.warn("Failed to update course selection progress:", error);
          resolve(); // Don't fail the main operation
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getGradingData(courseCode: string): Promise<GradingData | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["gradingData"], "readonly");
      const store = transaction.objectStore("gradingData");

      const request = store.get(courseCode);
      request.onsuccess = async () => {
        const result = request.result || null;
        if (result) {
          // Update last accessed time
          try {
            await this.updateCourseSelectionAccess(courseCode);
          } catch (error) {
            console.warn("Failed to update course selection access:", error);
          }
        }
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllGradingData(): Promise<GradingData[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["gradingData"], "readonly");
      const store = transaction.objectStore("gradingData");

      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteGradingData(courseCode: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["gradingData", "courseSelections"],
        "readwrite"
      );

      const gradingStore = transaction.objectStore("gradingData");
      const courseStore = transaction.objectStore("courseSelections");

      // Delete grading data
      const gradingRequest = gradingStore.delete(courseCode);
      gradingRequest.onerror = () => reject(gradingRequest.error);

      // Update course selection to indicate no data
      const courseRequest = courseStore.get(courseCode);
      courseRequest.onsuccess = () => {
        const courseSelection = courseRequest.result;
        if (courseSelection) {
          courseSelection.hasData = false;
          courseSelection.progress = {
            totalStudents: 0,
            completedStudents: 0,
            assessmentTypesSet: false,
            weightsConfigured: false,
          };
          courseStore.put(courseSelection);
        }
        resolve();
      };
      courseRequest.onerror = () => reject(courseRequest.error);
    });
  }

  // Course Selection methods
  async saveCourseSelection(
    courseCode: string,
    courseName: string,
    courseInfo: CourseInfo
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Check if there's existing grading data
    const existingData = await this.getGradingData(courseCode);

    const courseSelection: CourseSelection = {
      id: courseCode,
      courseCode,
      courseName,
      courseInfo,
      hasData: !!existingData,
      lastAccessed: new Date(),
      progress: existingData
        ? {
            totalStudents: existingData.students?.length || 0,
            completedStudents:
              existingData.students?.filter(
                (s) => s.nilaiAkhir && s.nilaiAkhir > 0
              ).length || 0,
            assessmentTypesSet: !!existingData.assessmentTypes?.length,
            weightsConfigured:
              Object.keys(existingData.assessmentWeights || {}).length > 0,
          }
        : {
            totalStudents: 0,
            completedStudents: 0,
            assessmentTypesSet: false,
            weightsConfigured: false,
          },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["courseSelections"],
        "readwrite"
      );
      const store = transaction.objectStore("courseSelections");

      const request = store.put(courseSelection);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCourseSelection(
    courseCode: string
  ): Promise<CourseSelection | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["courseSelections"],
        "readonly"
      );
      const store = transaction.objectStore("courseSelections");

      const request = store.get(courseCode);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCourseSelections(): Promise<CourseSelection[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["courseSelections"],
        "readonly"
      );
      const store = transaction.objectStore("courseSelections");

      const request = store.getAll();
      request.onsuccess = () => {
        const selections = request.result || [];
        // Sort by last accessed (most recent first)
        selections.sort(
          (a, b) =>
            new Date(b.lastAccessed).getTime() -
            new Date(a.lastAccessed).getTime()
        );
        resolve(selections);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentCourseSelections(
    limit: number = 5
  ): Promise<CourseSelection[]> {
    const allSelections = await this.getAllCourseSelections();
    return allSelections.slice(0, limit);
  }

  async deleteCourseSelection(courseCode: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["courseSelections"],
        "readwrite"
      );
      const store = transaction.objectStore("courseSelections");

      const request = store.delete(courseCode);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateCourseSelectionAccess(courseCode: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["courseSelections"],
        "readwrite"
      );
      const store = transaction.objectStore("courseSelections");

      const request = store.get(courseCode);
      request.onsuccess = () => {
        const courseSelection = request.result;
        if (courseSelection) {
          courseSelection.lastAccessed = new Date();
          const updateRequest = store.put(courseSelection);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Course selection doesn't exist, that's okay
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async updateCourseSelectionProgress(
    courseCode: string,
    gradingData: Omit<GradingData, "id" | "lastModified">
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["courseSelections"],
        "readwrite"
      );
      const store = transaction.objectStore("courseSelections");

      const request = store.get(courseCode);
      request.onsuccess = () => {
        const courseSelection = request.result;
        if (courseSelection) {
          courseSelection.hasData = true;
          courseSelection.progress = {
            totalStudents: gradingData.students?.length || 0,
            completedStudents:
              gradingData.students?.filter(
                (s) => s.nilaiAkhir && s.nilaiAkhir > 0
              ).length || 0,
            assessmentTypesSet: !!gradingData.assessmentTypes?.length,
            weightsConfigured:
              Object.keys(gradingData.assessmentWeights || {}).length > 0,
          };
          const updateRequest = store.put(courseSelection);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Course selection doesn't exist, that's okay
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Existing assessment types methods
  async saveAssessmentTypes(types: string[]): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["assessmentTypes"],
        "readwrite"
      );
      const store = transaction.objectStore("assessmentTypes");

      const data = {
        id: "default",
        types,
        lastModified: new Date(),
      };

      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAssessmentTypes(): Promise<string[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["assessmentTypes"], "readonly");
      const store = transaction.objectStore("assessmentTypes");

      const request = store.get("default");
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.types : ["tugas", "kuis", "uts", "uas"]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Existing settings methods
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readwrite");
      const store = transaction.objectStore("settings");

      const data = {
        key,
        value,
        lastModified: new Date(),
      };

      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["settings"], "readonly");
      const store = transaction.objectStore("settings");

      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ["gradingData", "courseSelections", "assessmentTypes", "settings"],
        "readwrite"
      );

      const stores = [
        "gradingData",
        "courseSelections",
        "assessmentTypes",
        "settings",
      ];
      let completed = 0;

      stores.forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // Get course progress summary
  async getCourseProgressSummary(): Promise<{
    totalCourses: number;
    coursesWithData: number;
    recentlyAccessed: CourseSelection[];
  }> {
    const allSelections = await this.getAllCourseSelections();

    return {
      totalCourses: allSelections.length,
      coursesWithData: allSelections.filter((s) => s.hasData).length,
      recentlyAccessed: allSelections.slice(0, 5),
    };
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
