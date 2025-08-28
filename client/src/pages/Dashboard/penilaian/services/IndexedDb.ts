// utils/indexedDBService.ts

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

class IndexedDBService {
  private dbName = "GradingAssessmentDB";
  private version = 1;
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

        // Create object stores
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

        if (!db.objectStoreNames.contains("assessmentTypes")) {
          // const assessmentTypesStore = db.createObjectStore("assessmentTypes", {
          //   keyPath: "id",
          // });
        }

        if (!db.objectStoreNames.contains("settings")) {
          // const settingsStore = db.createObjectStore("settings", {
          //   keyPath: "key",
          // });
        }
      };
    });
  }

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
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getGradingData(courseCode: string): Promise<GradingData | null> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(["gradingData"], "readonly");
      const store = transaction.objectStore("gradingData");

      const request = store.get(courseCode);
      request.onsuccess = () => resolve(request.result || null);
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
      const transaction = this.db!.transaction(["gradingData"], "readwrite");
      const store = transaction.objectStore("gradingData");

      const request = store.delete(courseCode);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

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
        ["gradingData", "assessmentTypes", "settings"],
        "readwrite"
      );

      const stores = ["gradingData", "assessmentTypes", "settings"];
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
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
