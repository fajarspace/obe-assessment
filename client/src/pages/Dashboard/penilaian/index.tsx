// Modified index.tsx - Main Component with Course Search Integration
import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Switch,
  Tabs,
  Alert,
  Spin,
  message,
  Typography,
  Row,
  Col,
  Space,
  Statistic,
  Badge,
  Popconfirm,
  Divider,
  Tag,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  TableOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DatabaseOutlined,
  ToolOutlined,
  UploadOutlined,
  RadarChartOutlined,
  SearchOutlined,
} from "@ant-design/icons";

// Import components and utilities
import { DynamicAssessmentWeightsTable } from "./DynamicAssessmentWeightsTable";
import { EnhancedStudentsGradesTable } from "./EnhancedStudentsGradesTable";
import { GradeScale } from "./GradeScale";
import { PerformanceIndicatorTable } from "./indicator/performance";
import { AssessmentTypesManager } from "./AssessmentTypeManager";
import { ExcelUploadTemplate } from "./ExcelUploadTemplate";
import { CPMKRadarChart } from "./CpmkRadarChart";
import { indexedDBService } from "./services/IndexedDb";
import type {
  Student,
  AssessmentWeights,
  CourseInfo,
  CurriculumData,
  ApiResponse,
} from "@/types/interface";
import {
  calculateGradeInfo,
  calculateAverage,
  createDefaultStudent,
  transformApiDataToCurriculumData,
  DEFAULT_COURSE_INFO,
} from "./helper";
import withDashboardLayout from "@/components/hoc/withDashboardLayout";
import { ExcelExportComponent } from "./ExcelExport";
import { useAuth } from "@/context/authContext";
import { CourseSearchSelection } from "./SearchMk";
import { CourseDetailInfo } from "./InfoMk";
import { CplInfo } from "./CplInfo";
// Import useAuth hook - adjust the path as needed
// import { useAuth } from "@/hooks/useAuth";

const { Text } = Typography;
const { TabPane } = Tabs;

const GradingAssessmentTable: React.FC = () => {
  // Auth hook integration
  const { user } = useAuth(); // Uncomment when useAuth is available
  // States
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [courseInfo, setCourseInfo] = useState<CourseInfo>(DEFAULT_COURSE_INFO);
  const [curriculumData, setCurriculumData] = useState<CurriculumData | null>(
    null
  );
  const [assessmentWeights, setAssessmentWeights] = useState<AssessmentWeights>(
    {}
  );
  const [assessmentTypes, setAssessmentTypes] = useState<string[]>([
    "tugas",
    "kuis",
    "uts",
    "uas",
  ]);
  const [assessmentComments, setAssessmentComments] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Record<string, any>>(
    {}
  );
  const [isGradeInputMode, setIsGradeInputMode] = useState<boolean>(true);
  const [showAssessmentTypesModal, setShowAssessmentTypesModal] =
    useState<boolean>(false);
  const [showExcelUploadModal, setShowExcelUploadModal] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dbInitialized, setDbInitialized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("selection");

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        await indexedDBService.init();
        setDbInitialized(true);

        // Load saved assessment types
        try {
          const savedTypes = await indexedDBService.getAssessmentTypes();
          if (savedTypes && savedTypes.length > 0) {
            setAssessmentTypes(savedTypes);
          }
        } catch (error) {
          console.warn(
            "Failed to load assessment types, using defaults:",
            error
          );
        }

        // Load saved assessment comments
        try {
          const savedComments = await indexedDBService.getSetting(
            "assessmentComments"
          );
          if (savedComments) {
            setAssessmentComments(savedComments);
          }
        } catch (error) {
          console.warn("Failed to load assessment comments:", error);
        }

        // Load saved settings
        try {
          const savedGradeInputMode = await indexedDBService.getSetting(
            "isGradeInputMode"
          );
          if (savedGradeInputMode !== null) {
            setIsGradeInputMode(savedGradeInputMode);
          }
        } catch (error) {
          console.warn("Failed to load grade input mode setting:", error);
        }

        message.success("Local storage initialized successfully");
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error);

        // Set dbInitialized to true anyway to continue without local storage
        setDbInitialized(true);

        message.warning(
          "Local storage unavailable - data will not be saved between sessions"
        );
      }
    };

    initDB();
  }, []);

  // Auto-save function with debounce and error handling
  const autoSave = useCallback(async () => {
    if (!dbInitialized || !selectedCourse) return;

    try {
      setIsSaving(true);
      await indexedDBService.saveGradingData(selectedCourse, {
        students,
        assessmentWeights,
        courseInfo,
        assessmentTypes,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Auto-save failed:", error);
      // Don't show error message for auto-save failures to avoid spam
    } finally {
      setIsSaving(false);
    }
  }, [
    dbInitialized,
    selectedCourse,
    students,
    assessmentWeights,
    courseInfo,
    assessmentTypes,
  ]);

  // Auto-save with debounce
  useEffect(() => {
    const timeoutId = setTimeout(autoSave, 1000); // 1 second debounce
    return () => clearTimeout(timeoutId);
  }, [autoSave]);

  // Load saved data when course changes
  useEffect(() => {
    if (dbInitialized && selectedCourse) {
      loadSavedData();
      setActiveTab("table"); // Switch to table tab after course selection
    }
  }, [dbInitialized, selectedCourse]);

  // Reset to selection tab when course is cleared
  useEffect(() => {
    if (!selectedCourse) {
      setActiveTab("selection");
    }
  }, [selectedCourse]);

  const loadSavedData = async () => {
    if (!selectedCourse) return;

    try {
      const savedData = await indexedDBService.getGradingData(selectedCourse);
      if (savedData) {
        setStudents(savedData.students || []);
        setAssessmentWeights(savedData.assessmentWeights || {});
        setCourseInfo(savedData.courseInfo || DEFAULT_COURSE_INFO);

        // Update assessment types if saved data has them
        if (savedData.assessmentTypes && savedData.assessmentTypes.length > 0) {
          setAssessmentTypes(savedData.assessmentTypes);
        }

        message.success("Data loaded from local storage");
        setLastSaved(savedData.lastModified);
      } else {
        // Initialize fresh data if no saved data
        initializeAssessmentWeights();
        if (students.length === 0) {
          initializeStudents(5);
        }
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
      message.warning("Failed to load saved data - starting fresh");

      // Initialize fresh data on error
      initializeAssessmentWeights();
      if (students.length === 0) {
        initializeStudents(5);
      }
    }
  };

  // Fetch data from API
  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUri = import.meta.env.VITE_API_URI || "http://localhost:3000";
      console.log("Fetching data from:", `${apiUri}/mk`);

      const response = await fetch(`${apiUri}/mk`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      console.log("API Response:", result);

      if (!result.success) {
        throw new Error(
          result.error || result.message || "Failed to fetch data"
        );
      }

      const transformedData = transformApiDataToCurriculumData(result.data);

      setCurriculumData(transformedData);
      setAvailableCourses(transformedData.mata_kuliah);

      message.success(
        `Data berhasil dimuat: ${
          Object.keys(transformedData.mata_kuliah).length
        } mata kuliah`
      );
    } catch (err) {
      console.error("Error fetching course data:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      message.error(`Gagal memuat data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchCourseData();
  }, []);

  useEffect(() => {
    if (
      curriculumData &&
      selectedCourse &&
      !assessmentWeights[Object.keys(assessmentWeights)[0]]
    ) {
      initializeAssessmentWeights();
    }
  }, [curriculumData, selectedCourse, assessmentTypes]);

  // Handle course selection from search component
  const handleCourseSelect = (
    courseCode: string,
    newCourseInfo?: CourseInfo
  ) => {
    setSelectedCourse(courseCode);

    // Update course info if provided
    if (newCourseInfo) {
      setCourseInfo(newCourseInfo);
    }

    if (courseCode) {
      message.success(
        `Mata kuliah "${availableCourses[courseCode]?.nama}" siap untuk diedit`
      );
    }
  };

  // Helper functions
  const getRelatedCPL = (courseCode: string): string[] => {
    return curriculumData?.mata_kuliah?.[courseCode]?.related_cpl || [];
  };

  const getRelatedCPMK = (cplCode: string): string[] => {
    return curriculumData?.cpl?.[cplCode]?.related_cpmk || [];
  };

  const getRelatedSubCPMK = (cpmkCode: string): string[] => {
    return curriculumData?.cpmk?.[cpmkCode]?.related_subcpmk || [];
  };

  const hasSubCPMKData = (): boolean => {
    if (!curriculumData || !selectedCourse) return false;

    const relatedCPL = getRelatedCPL(selectedCourse);
    for (const cpl of relatedCPL) {
      const relatedCPMK = getRelatedCPMK(cpl);
      for (const cpmk of relatedCPMK) {
        const relatedSubCPMK = getRelatedSubCPMK(cpmk);
        if (relatedSubCPMK.length > 0) {
          return true;
        }
      }
    }
    return false;
  };

  const initializeAssessmentWeights = (): void => {
    const relatedCPL = getRelatedCPL(selectedCourse);
    const newWeights: AssessmentWeights = {};
    const hasSubCPMK = hasSubCPMKData();

    relatedCPL.forEach((cpl) => {
      newWeights[cpl] = {};
      const relatedCPMK = getRelatedCPMK(cpl);
      relatedCPMK.forEach((cpmk) => {
        const relatedSubCPMK = getRelatedSubCPMK(cpmk);

        // Initialize with dynamic assessment types
        const baseWeights = assessmentTypes.reduce((acc, type) => {
          acc[type] = 0;
          return acc;
        }, {} as Record<string, number>);

        if (hasSubCPMK && relatedSubCPMK.length > 0) {
          //@ts-ignore
          newWeights[cpl][cpmk] = {
            ...baseWeights,
            subcpmk: {},
          };

          relatedSubCPMK.forEach((subCpmk) => {
            //@ts-ignore
            newWeights[cpl][cpmk].subcpmk![subCpmk] = { ...baseWeights };
          });
        } else {
          //@ts-ignore
          newWeights[cpl][cpmk] = baseWeights;
        }
      });
    });

    setAssessmentWeights(newWeights);
  };

  // Other methods remain the same as in your original component...
  // [Include all other methods: updateAssessmentTypes, updateAssessmentWeight,
  //  recalculateAllStudents, addStudents, updateStudent, etc.]

  const updateAssessmentTypes = async (
    newTypes: string[],
    comments?: Record<string, string>
  ) => {
    setAssessmentTypes(newTypes);

    // Update comments if provided
    if (comments) {
      setAssessmentComments(comments);
    }

    // Save to IndexedDB
    try {
      await indexedDBService.saveAssessmentTypes(newTypes);

      // Save comments if provided
      if (comments) {
        await indexedDBService.saveSetting("assessmentComments", comments);
      }

      // Reinitialize weights with new assessment types
      initializeAssessmentWeights();

      // Update students with new assessment types
      setStudents((prev) =>
        prev.map((student) => {
          const updated = { ...student };
          newTypes.forEach((type) => {
            if (!(type in updated)) {
              updated[type] = 0;
              updated[`${type}Komentar`] = "";
            }
          });
          return updated;
        })
      );

      message.success("Assessment types updated successfully");
    } catch (error) {
      message.error("Failed to save assessment types");
    }
  };

  const hasAllAssessmentScores = (student: Student): boolean => {
    //@ts-ignore
    return assessmentTypes.every((type) => (student[type] || 0) > 0);
  };

  const updateAssessmentWeight = (
    cpl: string,
    cpmk: string,
    assessmentType: string,
    value: number,
    subCpmk?: string
  ): void => {
    setAssessmentWeights((prev) => {
      const newWeights = { ...prev };

      if (!newWeights[cpl]) newWeights[cpl] = {};
      if (!newWeights[cpl][cpmk]) {
        const baseWeights = assessmentTypes.reduce((acc, type) => {
          acc[type] = 0;
          return acc;
        }, {} as Record<string, number>);
        //@ts-ignore
        newWeights[cpl][cpmk] = baseWeights;
      }

      if (subCpmk) {
        // Sub-CPMK mode
        if (!newWeights[cpl][cpmk].subcpmk) {
          newWeights[cpl][cpmk].subcpmk = {};
        }
        if (!newWeights[cpl][cpmk].subcpmk![subCpmk]) {
          const baseWeights = assessmentTypes.reduce((acc, type) => {
            acc[type] = 0;
            return acc;
          }, {} as Record<string, number>);
          //@ts-ignore
          newWeights[cpl][cpmk].subcpmk![subCpmk] = baseWeights;
        }
        //@ts-ignore
        newWeights[cpl][cpmk].subcpmk![subCpmk][assessmentType] = value;
      } else {
        // CPMK mode
        //@ts-ignore
        newWeights[cpl][cpmk][assessmentType] = value;
      }

      return newWeights;
    });

    setTimeout(() => recalculateAllStudents(), 100);
  };

  // Include other required methods...
  const recalculateAllStudents = (): void => {
    setStudents((prev) =>
      prev.map((student) => {
        const updated = { ...student };

        if (!hasAllAssessmentScores(student)) {
          updated.nilaiAkhir = 0;
          updated.nilaiMutu = "";
          updated.kelulusan = "";
          return updated;
        }

        // Calculate final score using CPMK/Sub-CPMK-based weighted average
        let totalWeightedScore = 0;
        let totalWeight = 0;
        const hasSubCPMK = hasSubCPMKData();

        const relatedCPL = getRelatedCPL(selectedCourse);
        relatedCPL.forEach((cpl) => {
          const relatedCPMK = getRelatedCPMK(cpl);
          relatedCPMK.forEach((cpmk) => {
            const relatedSubCPMK = getRelatedSubCPMK(cpmk);

            if (
              hasSubCPMK &&
              relatedSubCPMK.length > 0 &&
              assessmentWeights[cpl]?.[cpmk]?.subcpmk
            ) {
              // Sub-CPMK calculation
              relatedSubCPMK.forEach((subCpmk) => {
                const weights =
                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk];
                if (weights) {
                  const subCpmkTotalWeight = assessmentTypes.reduce(
                    //@ts-ignore
                    (sum, type) => sum + (weights[type] || 0),
                    0
                  );
                  if (subCpmkTotalWeight > 0) {
                    const subCpmkScore =
                      assessmentTypes.reduce((sum, type) => {
                        return (
                          sum +
                          //@ts-ignore
                          (Number(student[type]) || 0) * (weights[type] || 0)
                        );
                      }, 0) / subCpmkTotalWeight;

                    totalWeightedScore += subCpmkScore * subCpmkTotalWeight;
                    totalWeight += subCpmkTotalWeight;
                  }
                }
              });
            } else {
              // CPMK calculation
              const weights = assessmentWeights[cpl]?.[cpmk];
              if (weights) {
                const cpmkTotalWeight = assessmentTypes.reduce(
                  //@ts-ignore
                  (sum, type) => sum + (weights[type] || 0),
                  0
                );
                if (cpmkTotalWeight > 0) {
                  const cpmkScore =
                    assessmentTypes.reduce((sum, type) => {
                      return (
                        sum +
                        //@ts-ignore
                        (Number(student[type]) || 0) * (weights[type] || 0)
                      );
                    }, 0) / cpmkTotalWeight;

                  totalWeightedScore += cpmkScore * cpmkTotalWeight;
                  totalWeight += cpmkTotalWeight;
                }
              }
            }
          });
        });

        // If no weights are set, fall back to equal weighting
        if (totalWeight === 0) {
          const finalScore =
            assessmentTypes.reduce(
              (sum, type) => sum + (Number(student[type]) || 0),
              0
            ) / assessmentTypes.length;
          updated.nilaiAkhir = Math.round(finalScore * 100) / 100;
        } else {
          updated.nilaiAkhir =
            Math.round((totalWeightedScore / totalWeight) * 100) / 100;
        }

        // Calculate grade info
        const gradeInfo = calculateGradeInfo(updated.nilaiAkhir);
        updated.nilaiMutu = gradeInfo.nilaiMutu;
        updated.kelulusan = gradeInfo.kelulusan;

        return updated;
      })
    );
  };

  const addStudents = (count: number): void => {
    const currentCount = students.length;
    const newStudents: Student[] = Array.from({ length: count }, (_, i) => {
      const student: Student = createDefaultStudent(currentCount + i);
      const relatedCPL = getRelatedCPL(selectedCourse);
      const hasSubCPMK = hasSubCPMKData();

      // Initialize assessment scores and comments
      assessmentTypes.forEach((type) => {
        student[type] = 0;
        student[`${type}Komentar`] = "";
      });

      // Initialize CPMK/Sub-CPMK fields
      relatedCPL.forEach((cpl) => {
        const relatedCPMK = getRelatedCPMK(cpl);
        relatedCPMK.forEach((cpmk) => {
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          if (hasSubCPMK && relatedSubCPMK.length > 0) {
            relatedSubCPMK.forEach((subCpmk) => {
              student[`${cpl}_${cpmk}_${subCpmk}`] = 0;
            });
          } else {
            student[`${cpl}_${cpmk}`] = 0;
          }
        });
      });
      return student;
    });

    setStudents((prev) => [...prev, ...newStudents]);
    message.success(`${count} mahasiswa berhasil ditambahkan`);
  };

  const updateStudent = (
    key: string,
    field: keyof Student,
    value: string | number
  ): void => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.key !== key) return student;

        const updated = { ...student, [field]: value };

        if (assessmentTypes.includes(field as string)) {
          if (!hasAllAssessmentScores(updated)) {
            updated.nilaiAkhir = 0;
            updated.nilaiMutu = "";
            updated.kelulusan = "";
            return updated;
          }

          // Simple calculation fallback
          const finalScore =
            assessmentTypes.reduce(
              (sum, type) => sum + (Number(updated[type]) || 0),
              0
            ) / assessmentTypes.length;
          updated.nilaiAkhir = Math.round(finalScore * 100) / 100;

          const gradeInfo = calculateGradeInfo(updated.nilaiAkhir);
          updated.nilaiMutu = gradeInfo.nilaiMutu;
          updated.kelulusan = gradeInfo.kelulusan;
        }

        return updated;
      })
    );
  };

  const handleModeChange = async (checked: boolean) => {
    // Alert konfirmasi sebelum switch mode
    const currentMode = isGradeInputMode
      ? "Input Nilai"
      : hasSubCPMK
      ? "Input Sub-CPMK"
      : "Input CPMK";
    const newMode = checked
      ? "Input Nilai"
      : hasSubCPMK
      ? "Input Sub-CPMK"
      : "Input CPMK";

    const hasAnyData = students.some((student) =>
      assessmentTypes.some((type) => ((student[type] as number) || 0) > 0)
    );

    if (hasAnyData) {
      const confirmed = window.confirm(
        `Anda akan mengganti mode dari "${currentMode}" ke "${newMode}". ` +
          `Semua nilai yang sudah diinput akan di-reset. Apakah Anda yakin ingin melanjutkan?`
      );

      if (!confirmed) {
        return; // Batalkan perubahan mode
      }

      // Reset semua data jika dikonfirmasi
      resetAllStudentScores();
      message.warning(
        `Mode berhasil diubah ke "${newMode}". Semua nilai telah di-reset.`
      );
    }

    setIsGradeInputMode(checked);
    try {
      await indexedDBService.saveSetting("isGradeInputMode", checked);
    } catch (error) {
      console.error("Failed to save grade input mode setting:", error);
    }
  };

  // Fungsi untuk reset semua nilai ketika switch mode
  const resetAllStudentScores = () => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        const updatedStudent = { ...student };

        // Reset semua assessment type scores
        assessmentTypes.forEach((type) => {
          updatedStudent[type] = 0;
        });

        // Reset semua CPMK percentage values
        const relatedCPL = getRelatedCPL(selectedCourse);
        const hasSubCPMK = hasSubCPMKData();

        relatedCPL.forEach((cpl) => {
          const relatedCPMK = getRelatedCPMK(cpl);
          relatedCPMK.forEach((cpmk) => {
            const relatedSubCPMK = getRelatedSubCPMK(cpmk);

            if (hasSubCPMK && relatedSubCPMK.length > 0) {
              relatedSubCPMK.forEach((subCpmk) => {
                assessmentTypes.forEach((assessmentType) => {
                  updatedStudent[
                    `${cpl}_${cpmk}_${subCpmk}_${assessmentType}_percentage`
                  ] = 0;
                  updatedStudent[
                    `${cpl}_${cpmk}_${subCpmk}_${assessmentType}`
                  ] = 0;
                });
              });
            } else {
              assessmentTypes.forEach((assessmentType) => {
                updatedStudent[
                  `${cpl}_${cpmk}_${assessmentType}_percentage`
                ] = 0;
                updatedStudent[`${cpl}_${cpmk}_${assessmentType}`] = 0;
              });
            }
          });
        });

        // Reset final grades
        updatedStudent.nilaiAkhir = 0;
        updatedStudent.nilaiMutu = "";
        updatedStudent.kelulusan = "";

        return updatedStudent;
      })
    );
  };

  // Fungsi untuk menghitung rata-rata CPMK dan update nilai assessment type
  const updateAssessmentScoreFromCPMK = (
    studentKey: string,
    assessmentType: string
  ): void => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => {
        if (student.key !== studentKey) return student;

        let totalWeightedScore = 0;
        let totalWeight = 0;
        let hasAnyCPMKInput = false;
        const hasSubCPMK = hasSubCPMKData();
        const relatedCPL = getRelatedCPL(selectedCourse);

        // Hitung weighted average dari semua CPMK untuk assessment type ini
        relatedCPL.forEach((cpl) => {
          const relatedCPMK = getRelatedCPMK(cpl);
          relatedCPMK.forEach((cpmk) => {
            const relatedSubCPMK = getRelatedSubCPMK(cpmk);

            if (hasSubCPMK && relatedSubCPMK.length > 0) {
              // Sub-CPMK mode
              relatedSubCPMK.forEach((subCpmk) => {
                const weight =
                  assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                    assessmentType
                  ] || 0;
                if (weight > 0) {
                  const percentageValue =
                    (student[
                      `${cpl}_${cpmk}_${subCpmk}_${assessmentType}_percentage`
                    ] as number) || 0;
                  if (percentageValue > 0) {
                    hasAnyCPMKInput = true;
                    totalWeightedScore += percentageValue * weight; // Input score * weight
                    totalWeight += weight; // Sum of weights
                  }
                }
              });
            } else {
              // CPMK mode
              const weight =
                assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
              if (weight > 0) {
                const percentageValue =
                  (student[
                    `${cpl}_${cpmk}_${assessmentType}_percentage`
                  ] as number) || 0;
                if (percentageValue > 0) {
                  hasAnyCPMKInput = true;
                  totalWeightedScore += percentageValue * weight; // Input score * weight
                  totalWeight += weight; // Sum of weights
                }
              }
            }
          });
        });

        // Update nilai assessment type berdasarkan input CPMK
        const updatedStudent = { ...student };

        if (hasAnyCPMKInput && totalWeight > 0) {
          // Ada input CPMK, hitung weighted average
          const averageScore = totalWeightedScore / totalWeight;
          updatedStudent[assessmentType] = Math.round(averageScore * 100) / 100;
        } else {
          // Tidak ada input CPMK, set ke 0
          updatedStudent[assessmentType] = 0;
        }

        // Recalculate final grade
        const hasAllAssessmentValues = assessmentTypes.every(
          (type) => ((updatedStudent[type] as number) || 0) > 0
        );

        if (hasAllAssessmentValues) {
          // Hitung nilai akhir menggunakan simple average dari assessment types
          const totalScore = assessmentTypes.reduce(
            (sum, type) => sum + ((updatedStudent[type] as number) || 0),
            0
          );
          const averageScore = totalScore / assessmentTypes.length;
          updatedStudent.nilaiAkhir = Math.round(averageScore * 100) / 100;

          // Update grade info
          const gradeInfo = calculateGradeInfo(updatedStudent.nilaiAkhir);
          updatedStudent.nilaiMutu = gradeInfo.nilaiMutu;
          updatedStudent.kelulusan = gradeInfo.kelulusan;
        } else {
          // Reset jika tidak semua assessment type memiliki nilai
          updatedStudent.nilaiAkhir = 0;
          updatedStudent.nilaiMutu = "";
          updatedStudent.kelulusan = "";
        }

        return updatedStudent;
      })
    );
  };

  // Handle Excel upload
  const handleExcelUpload = (uploadedStudents: Student[]) => {
    // Replace current students with uploaded data
    setStudents(uploadedStudents);

    // Recalculate all students after upload
    setTimeout(() => {
      recalculateAllStudents();
    }, 100);

    message.success(
      `Successfully imported ${uploadedStudents.length} students from Excel!`
    );
  };

  const calculateAverageForField = (field: string): number => {
    if (field === "nilaiAkhir") {
      const studentsWithCompleteScores = students.filter(
        hasAllAssessmentScores
      );
      if (studentsWithCompleteScores.length === 0) return 0;
      const total = studentsWithCompleteScores.reduce(
        (sum, student) => sum + (Number(student[field]) || 0),
        0
      );
      return Math.round((total / studentsWithCompleteScores.length) * 10) / 10;
    }
    return calculateAverage(students, field);
  };

  const handleClearData = async () => {
    try {
      await indexedDBService.deleteGradingData(selectedCourse);
      setStudents([]);
      setAssessmentWeights({});
      setCourseInfo(DEFAULT_COURSE_INFO);
      initializeStudents(5);
      initializeAssessmentWeights();
      message.success("Data berhasil dihapus");
    } catch (error) {
      message.error("Gagal menghapus data");
    }
  };

  const initializeStudents = (count: number): void => {
    const newStudents: Student[] = Array.from({ length: count }, (_, i) => {
      const student: Student = createDefaultStudent(i);
      const relatedCPL = getRelatedCPL(selectedCourse);
      const hasSubCPMK = hasSubCPMKData();

      // Initialize assessment scores and comments
      assessmentTypes.forEach((type) => {
        student[type] = 0;
        student[`${type}Komentar`] = "";
      });

      // Initialize CPMK/Sub-CPMK fields
      relatedCPL.forEach((cpl) => {
        const relatedCPMK = getRelatedCPMK(cpl);
        relatedCPMK.forEach((cpmk) => {
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          if (hasSubCPMK && relatedSubCPMK.length > 0) {
            relatedSubCPMK.forEach((subCpmk) => {
              student[`${cpl}_${cpmk}_${subCpmk}`] = 0;
            });
          } else {
            student[`${cpl}_${cpmk}`] = 0;
          }
        });
      });
      return student;
    });
    setStudents(newStudents);
  };

  // Loading state
  if (loading && !dbInitialized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
        <div className="ml-4">Loading course data...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description={`Failed to load course data: ${error}`}
          type="error"
          action={
            <Button size="small" danger onClick={fetchCourseData}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const selectedCourseData = curriculumData?.mata_kuliah?.[selectedCourse];
  const relatedCPL = getRelatedCPL(selectedCourse);
  const studentsWithCompleteAssessments = students.filter(
    hasAllAssessmentScores
  );
  const passedStudents = studentsWithCompleteAssessments.filter(
    (s) => s.kelulusan === "Lulus"
  );
  const hasSubCPMK = hasSubCPMKData();

  return (
    <div className="min-h-screen">
      <div className="max-w-full mx-auto">
        <div className="!space-y-6">
          {/* Main Tabs */}
          <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
            {/* Course Selection Tab */}

            <TabPane
              tab={
                <span>
                  <SearchOutlined />
                  &emsp; Pilih Mata Kuliah
                  {selectedCourse && (
                    <Badge status="success" className="!ml-2" />
                  )}
                </span>
              }
              key="selection"
            >
              <CourseSearchSelection
                availableCourses={availableCourses}
                onCourseSelect={handleCourseSelect}
                selectedCourse={selectedCourse}
                userProdi={user?.profile?.prodi}
                userName={user?.profile?.nama}
                loading={loading}
              />

              {selectedCourse && (
                <div className="mt-4 text-center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => setActiveTab("table")}
                  >
                    Lanjutkan ke Penilaian
                  </Button>
                </div>
              )}
            </TabPane>

            <Card title="Detail Matakuliah" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text strong>Nama Matakuliah:</Text>
                    <div className="p-2 bg-gray-100 rounded mt-1">
                      <div>{selectedCourseData?.nama}</div>
                      {selectedCourseData?.deskripsi && (
                        <Tooltip title={selectedCourseData.deskripsi}>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                            {selectedCourseData.deskripsi}
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text strong>Kode & Program Studi:</Text>
                    <div className="p-2 bg-gray-100 rounded mt-1">
                      <div>{selectedCourse}</div>
                      {selectedCourseData?.prodi && (
                        <div className="text-xs text-blue-600 mt-1">
                          {selectedCourseData.prodi}
                        </div>
                      )}
                    </div>
                  </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text strong>Informasi Kelas:</Text>
                    <div className="p-2 bg-gray-100 rounded mt-1">
                      <div className="text-sm">
                        Semester: {courseInfo.semester} ({courseInfo.year})
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Dosen: {courseInfo.lecturer || "Belum diset"}
                      </div>
                    </div>
                  </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text strong>Assessment Types:</Text>
                    <div className="mt-1">
                      <div className="p-2 bg-gray-100 rounded">
                        {assessmentTypes.join(", ")}
                      </div>
                      {Object.keys(assessmentComments).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {assessmentTypes.map((type) => {
                            const comment = assessmentComments[type];
                            if (!comment) return null;
                            return (
                              <div
                                key={type}
                                className="text-xs text-gray-600 bg-blue-50 p-2 rounded"
                              >
                                <span className="font-medium capitalize">
                                  {type}:
                                </span>{" "}
                                {comment}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <Button
                      size="small"
                      icon={<ToolOutlined />}
                      onClick={() => setShowAssessmentTypesModal(true)}
                      className="mt-2"
                    />
                  </div>
                </Col>
              </Row>

              {/* CPL/CPMK Information Section */}
              {relatedCPL.length > 0 && (
                <div className="mt-4">
                  <Divider orientation="left">Capaian Pembelajaran</Divider>
                  <Row gutter={[16, 16]}>
                    {relatedCPL.map((cplCode) => {
                      const cplData = curriculumData?.cpl?.[cplCode];
                      const relatedCPMK = getRelatedCPMK(cplCode);

                      return (
                        <Col xs={24} lg={12} key={cplCode}>
                          <Card size="small" className="h-full">
                            <div className="space-y-3">
                              <div>
                                <Tag color="blue" className="mb-2">
                                  CPL
                                </Tag>
                                <div className="font-medium">
                                  {cplData?.kode || cplCode}
                                </div>
                                {cplData?.description && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {cplData.description}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  CPMK Terkait ({relatedCPMK.length}):
                                </div>
                                <div className="space-y-2">
                                  {relatedCPMK.slice(0, 3).map((cpmkCode) => {
                                    const cpmkData =
                                      curriculumData?.cpmk?.[cpmkCode];
                                    const relatedSubCPMK =
                                      getRelatedSubCPMK(cpmkCode);

                                    return (
                                      <div
                                        key={cpmkCode}
                                        className="border-l-3 border-green-300 pl-3"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Tag color="green" size="small">
                                            CPMK
                                          </Tag>
                                          <span className="text-sm font-medium">
                                            {cpmkData?.kode || cpmkCode}
                                          </span>
                                          {relatedSubCPMK.length > 0 && (
                                            <Tag size="small">
                                              {relatedSubCPMK.length} Sub-CPMK
                                            </Tag>
                                          )}
                                        </div>
                                        {cpmkData?.description && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            {cpmkData.description.length > 100
                                              ? `${cpmkData.description.substring(
                                                  0,
                                                  100
                                                )}...`
                                              : cpmkData.description}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {relatedCPMK.length > 3 && (
                                    <div className="text-xs text-gray-500">
                                      +{relatedCPMK.length - 3} CPMK lainnya
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )}
            </Card>

            {selectedCourse && (
              <TabPane
                tab={
                  <span>
                    <TableOutlined />
                    &emsp; CPL Info
                  </span>
                }
                key="infomk"
              >
                <CplInfo
                  courseInfo={courseInfo}
                  curriculumData={curriculumData}
                  relatedCPL={relatedCPL}
                  getRelatedCPMK={getRelatedCPMK}
                  getRelatedSubCPMK={getRelatedSubCPMK}
                />
              </TabPane>
            )}

            {/* Assessment Tab - Only show if course is selected */}
            {selectedCourse && (
              <TabPane
                tab={
                  <span>
                    <TableOutlined />
                    &emsp; Penilaian
                  </span>
                }
                key="table"
              >
                <div className="space-y-6">
                  {/* Course Information */}
                  {selectedCourse && (
                    <CourseDetailInfo
                      selectedCourse={selectedCourse}
                      selectedCourseData={selectedCourseData}
                      courseInfo={courseInfo}
                      setCourseInfo={setCourseInfo}
                      assessmentTypes={assessmentTypes}
                      assessmentComments={assessmentComments}
                      onAssessmentTypesModalOpen={() =>
                        setShowAssessmentTypesModal(true)
                      }
                    />
                  )}

                  {/* Dynamic Assessment Weights Table */}
                  {relatedCPL.length > 0 && (
                    <Card title={`Bobot Assessment`} size="small">
                      <DynamicAssessmentWeightsTable
                        assessmentWeights={assessmentWeights}
                        relatedCPL={relatedCPL}
                        getRelatedCPMK={getRelatedCPMK}
                        getRelatedSubCPMK={getRelatedSubCPMK}
                        updateAssessmentWeight={updateAssessmentWeight}
                        curriculumData={curriculumData}
                        hasSubCPMKData={hasSubCPMK}
                        assessmentTypes={assessmentTypes}
                      />
                    </Card>
                  )}

                  {/* Warning for missing CPL/CPMK data */}
                  {relatedCPL.length === 0 && selectedCourse && (
                    <Alert
                      message="Tidak ada data CPL/CPMK"
                      description={`Tidak ditemukan data CPL/CPMK untuk mata kuliah ${selectedCourse}. Anda masih dapat menggunakan Mode Input Nilai untuk penilaian dasar.`}
                      type="warning"
                      icon={<ExclamationCircleOutlined />}
                      showIcon
                    />
                  )}

                  {/* Save Status and Assessment Mode Switch */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <SettingOutlined className="text-lg" />
                      <span className="font-semibold">Mode Penilaian</span>

                      <Switch
                        checked={isGradeInputMode}
                        onChange={handleModeChange}
                        checkedChildren="Input Nilai"
                        unCheckedChildren={
                          hasSubCPMK ? "Input Sub-CPMK" : "Input CPMK"
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <DatabaseOutlined
                        className={
                          isSaving ? "text-blue-500" : "text-green-500"
                        }
                      />
                      <Text type="secondary" className="text-xs">
                        {isSaving
                          ? "Saving..."
                          : lastSaved
                          ? `Saved: ${lastSaved.toLocaleTimeString()}`
                          : "No saves yet"}
                      </Text>
                      <Popconfirm
                        title="Hapus semua data"
                        description="Apakah Anda yakin ingin menghapus semua data untuk mata kuliah ini?"
                        onConfirm={handleClearData}
                        okText="Ya"
                        cancelText="Tidak"
                      >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                          Clear Data
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <Space wrap>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => addStudents(1)}
                      >
                        Tambah 1 Mahasiswa
                      </Button>
                      <Button
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => addStudents(5)}
                      >
                        Tambah 5 Mahasiswa
                      </Button>
                      <Button
                        icon={<UploadOutlined />}
                        size="small"
                        onClick={() => setShowExcelUploadModal(true)}
                        type="default"
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        Upload Excel
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchCourseData}
                        loading={loading}
                        size="small"
                      >
                        Refresh Data
                      </Button>
                    </Space>

                    <ExcelExportComponent
                      students={students}
                      assessmentWeights={assessmentWeights}
                      relatedCPL={relatedCPL}
                      getRelatedCPMK={getRelatedCPMK}
                      getRelatedSubCPMK={getRelatedSubCPMK}
                      curriculumData={curriculumData}
                      hasSubCPMKData={hasSubCPMK}
                      assessmentTypes={assessmentTypes}
                      selectedCourse={selectedCourse}
                      calculateAverage={calculateAverageForField}
                    />
                  </div>

                  {/* Enhanced Assessment Table */}
                  <EnhancedStudentsGradesTable
                    students={students}
                    assessmentWeights={assessmentWeights}
                    relatedCPL={relatedCPL}
                    getRelatedCPMK={getRelatedCPMK}
                    getRelatedSubCPMK={getRelatedSubCPMK}
                    updateStudent={updateStudent}
                    calculateAverage={calculateAverageForField}
                    isGradeInputMode={isGradeInputMode}
                    curriculumData={curriculumData}
                    hasSubCPMKData={hasSubCPMK}
                    assessmentTypes={assessmentTypes}
                    updateAssessmentScoreFromCPMK={
                      updateAssessmentScoreFromCPMK
                    }
                  />

                  {/* Summary Statistics */}
                  <Row gutter={[16, 16]}>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="Total Mahasiswa"
                          value={students.length}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="Rata-rata Nilai Akhir"
                          value={calculateAverageForField("nilaiAkhir")}
                          precision={1}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="Mahasiswa Lulus"
                          value={passedStudents.length}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card>
                        <Statistic
                          title="Persentase Kelulusan"
                          value={
                            studentsWithCompleteAssessments.length > 0
                              ? Math.round(
                                  (passedStudents.length /
                                    studentsWithCompleteAssessments.length) *
                                    100
                                )
                              : 0
                          }
                          suffix="%"
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* Grade Scale and Performance Indicator Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <GradeScale />
                    <PerformanceIndicatorTable />
                  </div>
                </div>
              </TabPane>
            )}

            {/* Radar Chart Tab - Only show if course is selected */}
            {selectedCourse && (
              <TabPane
                tab={
                  <span>
                    <RadarChartOutlined />
                    Analisis CPMK
                    <Badge
                      count={studentsWithCompleteAssessments.length}
                      size="small"
                      className="!ml-2"
                    />
                  </span>
                }
                key="radar"
              >
                <CPMKRadarChart
                  students={students}
                  assessmentWeights={assessmentWeights}
                  relatedCPL={relatedCPL}
                  getRelatedCPMK={getRelatedCPMK}
                  getRelatedSubCPMK={getRelatedSubCPMK}
                  curriculumData={curriculumData}
                  hasSubCPMKData={hasSubCPMK}
                  assessmentTypes={assessmentTypes}
                  selectedCourse={selectedCourse}
                />
              </TabPane>
            )}
          </Tabs>
        </div>

        {/* Assessment Types Manager Modal */}
        <AssessmentTypesManager
          visible={showAssessmentTypesModal}
          onClose={() => setShowAssessmentTypesModal(false)}
          assessmentTypes={assessmentTypes}
          onUpdateAssessmentTypes={updateAssessmentTypes}
        />

        {/* Excel Upload Modal */}
        {selectedCourse && (
          <ExcelUploadTemplate
            visible={showExcelUploadModal}
            onClose={() => setShowExcelUploadModal(false)}
            students={students}
            assessmentTypes={assessmentTypes}
            selectedCourse={selectedCourse}
            curriculumData={curriculumData}
            relatedCPL={relatedCPL}
            getRelatedCPMK={getRelatedCPMK}
            getRelatedSubCPMK={getRelatedSubCPMK}
            hasSubCPMKData={hasSubCPMK}
            onDataUploaded={handleExcelUpload}
          />
        )}
      </div>
    </div>
  );
};

export default withDashboardLayout(GradingAssessmentTable);
