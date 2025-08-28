// components/Assessment/SimpleOBEAssessment.tsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Card,
  Select,
  Tabs,
  message,
  Typography,
  Row,
  Col,
  Space,
  InputNumber,
  Tag,
  Radio,
} from "antd";
import { PlusOutlined, SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { mkApi } from "../services/api";
import withDashboardLayout from "@/components/hoc/withDashboardLayout";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Types based on example
interface Student {
  key: string;
  no: number;
  nim: string;
  nama: string;
  tugas: number;
  kuis: number;
  uts: number;
  uas: number;
  [key: string]: string | number;
}

interface CPMKData {
  id: number;
  kode: string;
  deskripsi: string;
  subcpmk?: SubCPMKData[];
  cpl?: CPLData[];
}

interface SubCPMKData {
  id: number;
  kode: string;
  deskripsi: string;
}

interface CPLData {
  id: number;
  kode: string;
  deskripsi: string;
}

interface MKData {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  cpmk?: CPMKData[];
}

// Assessment weights structure with SubCPMK support
interface AssessmentWeights {
  [subcpmkCode: string]: {
    tugas: number;
    kuis: number;
    uts: number;
    uas: number;
  };
}

// CPMK and SubCPMK percentages
interface CPMKPercentages {
  [cpmkCode: string]: number;
}

interface SubCPMKPercentages {
  [subcpmkCode: string]: number;
}

// Assessment modes
type AssessmentMode = "nilai" | "cpmk";

// Grade scale matching example
const GRADE_SCALE = [
  { min: 85, max: 100, grade: "A", point: 4 },
  { min: 80, max: 84.99, grade: "A-", point: 3.67 },
  { min: 75, max: 79.99, grade: "B+", point: 3.33 },
  { min: 70, max: 74.99, grade: "B", point: 3 },
  { min: 65, max: 69.99, grade: "B-", point: 2.67 },
  { min: 60, max: 64.99, grade: "C+", point: 2.33 },
  { min: 45, max: 59.99, grade: "C", point: 2 },
  { min: 0, max: 44.99, grade: "D", point: 0 },
];

// CPMK Scale (0-100)
const CPMK_SCALE = [
  { min: 85, max: 100, level: "Sangat Baik", point: 4 },
  { min: 70, max: 84, level: "Baik", point: 3 },
  { min: 55, max: 69, level: "Cukup", point: 2 },
  { min: 40, max: 54, level: "Kurang", point: 1 },
  { min: 0, max: 39, level: "Sangat Kurang", point: 0 },
];

const getGrade = (score: number) => {
  const grade = GRADE_SCALE.find((g) => score >= g.min && score <= g.max);
  return grade || GRADE_SCALE[GRADE_SCALE.length - 1];
};

const getCPMKLevel = (score: number) => {
  const level = CPMK_SCALE.find((l) => score >= l.min && score <= l.max);
  return level || CPMK_SCALE[CPMK_SCALE.length - 1];
};

const SimpleOBEAssessment: React.FC = () => {
  // State
  const [mkList, setMkList] = useState<MKData[]>([]);
  const [selectedMK, setSelectedMK] = useState<MKData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessmentWeights, setAssessmentWeights] = useState<AssessmentWeights>(
    {}
  );
  const [cpmkPercentages, setCpmkPercentages] = useState<CPMKPercentages>({});
  const [subcpmkPercentages, setSubcpmkPercentages] =
    useState<SubCPMKPercentages>({});
  const [loading, setLoading] = useState(false);
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>("nilai");

  // Default students from example
  const defaultStudents: Student[] = [
    {
      key: "1",
      no: 1,
      nim: "312510001",
      nama: "Andi Saputra",
      tugas: 50,
      kuis: 50,
      uts: 100,
      uas: 100,
    },
    {
      key: "2",
      no: 2,
      nim: "312510002",
      nama: "Arief Nugroho",
      tugas: 100,
      kuis: 100,
      uts: 100,
      uas: 100,
    },
    {
      key: "3",
      no: 3,
      nim: "312510003",
      nama: "Budi Santoso",
      tugas: 100,
      kuis: 100,
      uts: 100,
      uas: 100,
    },
    {
      key: "4",
      no: 4,
      nim: "312510004",
      nama: "Dedi Pratama",
      tugas: 100,
      kuis: 100,
      uts: 100,
      uas: 100,
    },
    {
      key: "5",
      no: 5,
      nim: "312510005",
      nama: "Desi Marlina",
      tugas: 100,
      kuis: 100,
      uts: 100,
      uas: 100,
    },
  ];

  // Fetch MK data
  const fetchMKData = async () => {
    try {
      setLoading(true);
      const response = await mkApi.getAll();
      if (response.success) {
        setMkList(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching MK data:", error);
      message.error("Gagal memuat data mata kuliah");
    } finally {
      setLoading(false);
    }
  };

  // Initialize when MK selected
  const handleMKChange = (mkId: number) => {
    const mkData = mkList.find((mk) => mk.id === mkId);
    if (mkData) {
      setSelectedMK(mkData);
      initializeWeights(mkData);
      setStudents(defaultStudents);
    }
  };

  // Initialize weights based on API data
  const initializeWeights = (mkData: MKData) => {
    const weights: AssessmentWeights = {};
    const cpmkPercentages: CPMKPercentages = {};
    const subcpmkPercentages: SubCPMKPercentages = {};

    if (mkData.cpmk) {
      mkData.cpmk.forEach((cpmk) => {
        cpmkPercentages[cpmk.kode] = 0;
        if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
          cpmk.subcpmk.forEach((subcpmk) => {
            weights[subcpmk.kode] = { tugas: 0, kuis: 0, uts: 0, uas: 0 };
            subcpmkPercentages[subcpmk.kode] = 0;
          });
        } else {
          weights[cpmk.kode] = { tugas: 0, kuis: 0, uts: 0, uas: 0 };
        }
      });
    }

    setAssessmentWeights(weights);
    setCpmkPercentages(cpmkPercentages);
    setSubcpmkPercentages(subcpmkPercentages);
  };

  // Update functions
  const updateWeight = (
    subcpmkCode: string,
    assessmentType: string,
    value: number
  ) => {
    setAssessmentWeights((prev) => ({
      ...prev,
      [subcpmkCode]: { ...prev[subcpmkCode], [assessmentType]: value },
    }));
  };

  const updateCpmkPercentage = (cpmkCode: string, value: number) => {
    setCpmkPercentages((prev) => ({ ...prev, [cpmkCode]: value }));
  };

  const updateSubcpmkPercentage = (subcpmkCode: string, value: number) => {
    setSubcpmkPercentages((prev) => ({ ...prev, [subcpmkCode]: value }));
  };

  const updateStudent = (key: string, field: string, value: any) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.key === key ? { ...student, [field]: value } : student
      )
    );
  };

  // Calculate functions
  const calculateCPMKScore = (student: Student, cpmkCode: string) => {
    if (!selectedMK?.cpmk) return 0;
    const cpmk = selectedMK.cpmk.find((c) => c.kode === cpmkCode);
    if (!cpmk) return 0;

    if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
      let totalScore = 0;
      let totalWeight = 0;

      cpmk.subcpmk.forEach((subcpmk) => {
        const weights = assessmentWeights[subcpmk.kode] || {
          tugas: 0,
          kuis: 0,
          uts: 0,
          uas: 0,
        };
        const subcpmkPercentage = subcpmkPercentages[subcpmk.kode] || 0;
        const subcpmkScore =
          student.tugas * weights.tugas +
          student.kuis * weights.kuis +
          student.uts * weights.uts +
          student.uas * weights.uas;
        const subcpmkWeight =
          weights.tugas + weights.kuis + weights.uts + weights.uas;

        if (subcpmkWeight > 0 && subcpmkPercentage > 0) {
          totalScore += (subcpmkScore / subcpmkWeight) * subcpmkPercentage;
          totalWeight += subcpmkPercentage;
        }
      });

      return totalWeight > 0
        ? Math.round((totalScore / totalWeight) * 100) / 100
        : 0;
    } else {
      const weights = assessmentWeights[cpmkCode] || {
        tugas: 0,
        kuis: 0,
        uts: 0,
        uas: 0,
      };
      const cpmkScore =
        student.tugas * weights.tugas +
        student.kuis * weights.kuis +
        student.uts * weights.uts +
        student.uas * weights.uas;
      const cpmkWeight =
        weights.tugas + weights.kuis + weights.uts + weights.uas;
      return cpmkWeight > 0
        ? Math.round((cpmkScore / cpmkWeight) * 100) / 100
        : 0;
    }
  };

  const calculateFinalScore = (student: Student) => {
    if (!selectedMK?.cpmk) return 0;
    let totalScore = 0;
    let totalWeight = 0;

    selectedMK.cpmk.forEach((cpmk) => {
      const cpmkScore = calculateCPMKScore(student, cpmk.kode);
      // Get CPMK weight from the predefined percentages
      let cpmkWeight = 0;
      if (cpmk.kode.includes("5")) {
        cpmkWeight = 15;
      } else if (cpmk.kode.includes("22")) {
        cpmkWeight = 15;
      } else if (cpmk.kode.includes("23")) {
        cpmkWeight = 30;
      } else if (cpmk.kode.includes("24")) {
        cpmkWeight = 40;
      } else {
        cpmkWeight = 25;
      }

      if (cpmkWeight > 0 && cpmkScore > 0) {
        totalScore += cpmkScore * (cpmkWeight / 100);
        totalWeight += cpmkWeight / 100;
      }
    });

    return totalWeight > 0
      ? Math.round((totalScore / totalWeight) * 100) / 100
      : 0;
  };

  const groupCPMKByCPL = () => {
    if (!selectedMK?.cpmk) return {};
    const groups: Record<string, CPMKData[]> = {};

    selectedMK.cpmk.forEach((cpmk) => {
      let cplCode = "Unknown";
      if (cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0) {
        cplCode = cpmk.cpl[0].kode;
      } else if (cpmk.cpl && !Array.isArray(cpmk.cpl)) {
        cplCode = (cpmk.cpl as any).kode;
      }

      if (cplCode === "Unknown") {
        if (cpmk.kode.includes("5") || cpmk.kode.includes("22")) {
          cplCode = "CPL05";
        } else if (cpmk.kode.includes("23") || cpmk.kode.includes("24")) {
          cplCode = "CPL10";
        } else {
          cplCode = "CPL_" + cpmk.kode;
        }
      }

      if (!groups[cplCode]) groups[cplCode] = [];
      groups[cplCode].push(cpmk);
    });

    return groups;
  };

  const calculateAssessmentTotal = (assessmentType: string) => {
    let total = 0;
    if (!selectedMK?.cpmk) return 0;

    selectedMK.cpmk.forEach((cpmk) => {
      if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
        cpmk.subcpmk.forEach((subcpmk) => {
          const weight =
            assessmentWeights[subcpmk.kode]?.[
              assessmentType as keyof AssessmentWeights[string]
            ] || 0;
          total += weight;
        });
      } else {
        const weight =
          assessmentWeights[cpmk.kode]?.[
            assessmentType as keyof AssessmentWeights[string]
          ] || 0;
        total += weight;
      }
    });

    return total;
  };

  const calculateTotalCpmkPercentage = () => {
    return Object.values(cpmkPercentages).reduce((sum, pct) => sum + pct, 0);
  };

  const calculateTotalSubcpmkPercentage = () => {
    return Object.values(subcpmkPercentages).reduce((sum, pct) => sum + pct, 0);
  };

  const hasAssessmentWeights = (codeKey: string) => {
    const weights = assessmentWeights[codeKey];
    if (!weights) return false;
    return (
      weights.tugas > 0 ||
      weights.kuis > 0 ||
      weights.uts > 0 ||
      weights.uas > 0
    );
  };

  const getActiveCPMKs = () => {
    if (!selectedMK?.cpmk) return [];
    return selectedMK.cpmk.filter((cpmk) => {
      if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
        return cpmk.subcpmk.some((subcpmk) =>
          hasAssessmentWeights(subcpmk.kode)
        );
      } else {
        return hasAssessmentWeights(cpmk.kode);
      }
    });
  };

  // Generate Assessment input columns (always shown)
  const generateAssessmentInputColumns = () => {
    return [
      {
        title: (
          <div
            className="text-center font-bold p-2 text-white"
            style={{ backgroundColor: "#ffc107" }}
          >
            INPUT NILAI BERDASARKAN ASSESSMENT
          </div>
        ),
        children: [
          {
            title: (
              <div className="text-center font-semibold p-1">
                Tugas
                <br />
                {calculateAssessmentTotal("tugas")}%
              </div>
            ),
            dataIndex: "tugas",
            width: 80,
            render: (value: number, record: Student) => (
              <InputNumber
                size="small"
                min={0}
                max={100}
                value={value}
                onChange={(val) => updateStudent(record.key, "tugas", val || 0)}
                style={{
                  backgroundColor:
                    assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                  width: "100%",
                }}
                disabled={assessmentMode === "cpmk"}
              />
            ),
          },
          {
            title: (
              <div className="text-center font-semibold p-1">
                Kuis
                <br />
                {calculateAssessmentTotal("kuis")}%
              </div>
            ),
            dataIndex: "kuis",
            width: 80,
            render: (value: number, record: Student) => (
              <InputNumber
                size="small"
                min={0}
                max={100}
                value={value}
                onChange={(val) => updateStudent(record.key, "kuis", val || 0)}
                style={{
                  backgroundColor:
                    assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                  width: "100%",
                }}
                disabled={assessmentMode === "cpmk"}
              />
            ),
          },
          {
            title: (
              <div className="text-center font-semibold p-1">
                UTS
                <br />
                {calculateAssessmentTotal("uts")}%
              </div>
            ),
            dataIndex: "uts",
            width: 80,
            render: (value: number, record: Student) => (
              <InputNumber
                size="small"
                min={0}
                max={100}
                value={value}
                onChange={(val) => updateStudent(record.key, "uts", val || 0)}
                style={{
                  backgroundColor:
                    assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                  width: "100%",
                }}
                disabled={assessmentMode === "cpmk"}
              />
            ),
          },
          {
            title: (
              <div className="text-center font-semibold p-1">
                UAS
                <br />
                {calculateAssessmentTotal("uas")}%
              </div>
            ),
            dataIndex: "uas",
            width: 80,
            render: (value: number, record: Student) => (
              <InputNumber
                size="small"
                min={0}
                max={100}
                value={value}
                onChange={(val) => updateStudent(record.key, "uas", val || 0)}
                style={{
                  backgroundColor:
                    assessmentMode === "nilai" ? "#ffff99" : "#f0f0f0",
                  width: "100%",
                }}
                disabled={assessmentMode === "cpmk"}
              />
            ),
          },
        ],
      },
    ];
  };

  // Generate CPMK input columns based on mode
  const generateCPMKInputColumns = () => {
    const cplGroups = groupCPMKByCPL();
    const assessmentTypes: Array<keyof AssessmentWeights[string]> = [
      "tugas",
      "kuis",
      "uts",
      "uas",
    ];
    const assessmentLabels: Record<keyof AssessmentWeights[string], string> = {
      tugas: "TUGAS",
      kuis: "Kuis",
      uts: "UTS",
      uas: "UAS",
    };

    return assessmentTypes.map((assessmentType) => ({
      title: (
        <div
          className="text-center font-bold p-2 text-white"
          style={{
            backgroundColor: assessmentType === "tugas" ? "#90EE90" : "#98FB98",
          }}
        >
          {assessmentLabels[assessmentType]}
        </div>
      ),
      children: Object.entries(cplGroups).map(([cplCode, cpmks]) => ({
        title: (
          <div
            className="text-center font-bold p-2"
            style={{ backgroundColor: "#90EE90" }}
          >
            {cplCode}
          </div>
        ),
        children: cpmks.map((cpmk) => ({
          title: (
            <div
              className="text-center font-semibold p-1"
              style={{ backgroundColor: "#B0E0E6" }}
            >
              {cpmk.kode}
              <br />
              <span className="text-xs">
                {cpmk.kode.includes("5")
                  ? "15%"
                  : cpmk.kode.includes("22")
                  ? "15%"
                  : cpmk.kode.includes("23")
                  ? "30%"
                  : cpmk.kode.includes("24")
                  ? "40%"
                  : "25%"}
              </span>
            </div>
          ),
          children:
            cpmk.subcpmk && cpmk.subcpmk.length > 0
              ? cpmk.subcpmk.map((subcpmk, index) => ({
                  title: (
                    <div
                      className="text-center text-xs font-medium p-1"
                      style={{ backgroundColor: "#E0E0E0" }}
                    >
                      {subcpmk.kode}
                      <br />
                      <span className="text-xs">
                        {assessmentWeights[subcpmk.kode]?.[assessmentType] || 0}
                        %
                      </span>
                    </div>
                  ),
                  width: 80,
                  dataIndex: `${assessmentType}_${subcpmk.kode}`,
                  render: (text: string, record: Student) => {
                    const weight =
                      assessmentWeights[subcpmk.kode]?.[assessmentType] || 0;
                    if (assessmentMode === "cpmk") {
                      // CPMK mode - allow direct input of student assessment scores
                      const studentScore =
                        (record[assessmentType] as number) || 0;
                      return (
                        <div className="text-center p-1">
                          <InputNumber
                            size="small"
                            min={0}
                            max={100}
                            value={studentScore}
                            onChange={(val) =>
                              updateStudent(
                                record.key,
                                assessmentType as string,
                                val || 0
                              )
                            }
                            style={{
                              backgroundColor:
                                weight > 0 ? "#ffff99" : "#f0f0f0",
                              width: "100%",
                            }}
                            disabled={weight === 0}
                          />
                        </div>
                      );
                    } else {
                      // Nilai mode - show calculated weighted scores
                      const studentScore =
                        (record[assessmentType] as number) || 0;
                      const weightedScore =
                        weight > 0 ? (studentScore * weight) / 100 : 0;
                      return (
                        <div className="text-center p-1">
                          <div
                            style={{
                              backgroundColor: "#f0f8f0",
                              border: "1px solid #d9d9d9",
                              borderRadius: "6px",
                              padding: "4px",
                              minHeight: "24px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {weight > 0 ? studentScore.toFixed(0) : "-"}
                          </div>
                        </div>
                      );
                    }
                  },
                }))
              : [
                  {
                    // For CPMK without SubCPMK, merge directly
                    title: (
                      <div
                        className="text-center text-xs font-medium p-1"
                        style={{ backgroundColor: "#E0E0E0" }}
                      >
                        {assessmentWeights[cpmk.kode]?.[assessmentType] || 0}%
                      </div>
                    ),
                    width: 80,
                    dataIndex: `${assessmentType}_${cpmk.kode}`,
                    render: (text: string, record: Student) => {
                      const weight =
                        assessmentWeights[cpmk.kode]?.[assessmentType] || 0;
                      if (assessmentMode === "cpmk") {
                        // CPMK mode - allow direct input of student assessment scores
                        const studentScore =
                          (record[assessmentType] as number) || 0;
                        return (
                          <div className="text-center p-1">
                            <InputNumber
                              size="small"
                              min={0}
                              max={100}
                              value={studentScore}
                              onChange={(val) =>
                                updateStudent(
                                  record.key,
                                  assessmentType as string,
                                  val || 0
                                )
                              }
                              style={{
                                backgroundColor:
                                  weight > 0 ? "#ffff99" : "#f0f0f0",
                                width: "100%",
                              }}
                              disabled={weight === 0}
                            />
                          </div>
                        );
                      } else {
                        // Nilai mode - show calculated weighted scores
                        const studentScore =
                          (record[assessmentType] as number) || 0;
                        const weightedScore =
                          weight > 0 ? (studentScore * weight) / 100 : 0;
                        return (
                          <div className="text-center p-1">
                            <div
                              style={{
                                backgroundColor: "#f0f8f0",
                                border: "1px solid #d9d9d9",
                                borderRadius: "6px",
                                padding: "4px",
                                minHeight: "24px",
                                fontSize: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {weight > 0 ? studentScore.toFixed(0) : "-"}
                            </div>
                          </div>
                        );
                      }
                    },
                  },
                ],
        })),
      })),
    }));
  };

  useEffect(() => {
    fetchMKData();
  }, []);

  if (!selectedMK) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center">
            <Title level={2}>RUBRIK PENILAIAN OBE</Title>
            <div className="mb-4">
              <Text>Pilih Mata Kuliah:</Text>
              <Select
                style={{ width: 300, marginLeft: 16 }}
                placeholder="Pilih mata kuliah"
                loading={loading}
                onChange={handleMKChange}
              >
                {mkList.map((mk) => (
                  <Option key={mk.id} value={mk.id}>
                    {mk.kode} - {mk.nama}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const cplGroups = groupCPMKByCPL();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <Card className="mb-4">
          <div className="text-center bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded">
            <Title level={2} className="m-0">
              RUBRIK PENILAIAN OBE
            </Title>
            <Text className="text-yellow-600 font-semibold">
              Dosen MK hanya perlu mengisi rubrik dikolom kuning.
            </Text>
          </div>
          <div className="p-4">
            <Title level={4}>
              {selectedMK.kode} - {selectedMK.nama} | SKS: {selectedMK.sks} |
              Semester: 1 | Tahun Akademik: 2025/2026
            </Title>
          </div>
        </Card>

        <Tabs defaultActiveKey="config">
          {/* Configuration Tab */}
          <TabPane tab="Konfigurasi Assessment" key="config">
            <Card>
              <div className="mb-4">
                <Text strong>Petunjuk: </Text>
                <Text>
                  Input bobot assessment (kolom kuning) per Sub CPMK. Total per
                  assessment type harus sesuai target (Tugas: 5%, Kuis: 15%,
                  UTS: 35%, UAS: 45%)
                </Text>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded">
                <Text strong>Persentase CPMK (seperti gambar): </Text>
                {selectedMK?.cpmk?.map((cpmk) => (
                  <span key={cpmk.kode} className="ml-4">
                    <Text>{cpmk.kode}: </Text>
                    <Tag color="blue">
                      {cpmk.kode.includes("5")
                        ? "15%"
                        : cpmk.kode.includes("22")
                        ? "15%"
                        : cpmk.kode.includes("23")
                        ? "30%"
                        : cpmk.kode.includes("24")
                        ? "40%"
                        : "25%"}
                    </Tag>
                  </span>
                ))}
              </div>

              <Table
                bordered
                size="small"
                pagination={false}
                scroll={{ x: "max-content" }}
                columns={[
                  {
                    title: "Bentuk Assessment",
                    dataIndex: "assessment",
                    key: "assessment",
                    width: 150,
                    fixed: "left",
                    render: (text: string, record: any) => (
                      <div
                        className="text-center font-semibold p-2"
                        style={{
                          backgroundColor: record.isTotal
                            ? "#d1e7dd"
                            : "#90ee90",
                          color: "black",
                        }}
                      >
                        {text}
                      </div>
                    ),
                  },
                  ...Object.entries(cplGroups).map(([cplCode, cpmks]) => ({
                    title: (
                      <div
                        className="text-center font-bold p-2"
                        style={{
                          backgroundColor:
                            cplCode === "CPL05" ? "#a8dadc" : "#a8dadc",
                        }}
                      >
                        {cplCode}
                      </div>
                    ),
                    children: cpmks.map((cpmk) => ({
                      title: (
                        <div
                          className="text-center font-semibold p-1"
                          style={{ backgroundColor: "#b8d4f0" }}
                        >
                          {cpmk.kode}
                        </div>
                      ),
                      children:
                        cpmk.subcpmk && cpmk.subcpmk.length > 0
                          ? cpmk.subcpmk.map((subcpmk, index) => ({
                              title: (
                                <div
                                  className="text-center text-xs font-medium p-1"
                                  style={{ backgroundColor: "#e9ecef" }}
                                >
                                  {subcpmk.kode}
                                </div>
                              ),
                              width: 80,
                              render: (text: string, record: any) => {
                                if (record.isTotal) {
                                  const total = [
                                    "tugas",
                                    "kuis",
                                    "uts",
                                    "uas",
                                  ].reduce(
                                    (sum, type) =>
                                      sum +
                                      (assessmentWeights[subcpmk.kode]?.[
                                        type as keyof AssessmentWeights[string]
                                      ] || 0),
                                    0
                                  );
                                  return (
                                    <div
                                      className="text-center p-2 font-semibold"
                                      style={{ backgroundColor: "#d1e7dd" }}
                                    >
                                      {total}%
                                    </div>
                                  );
                                }
                                const weight =
                                  assessmentWeights[subcpmk.kode]?.[
                                    record.key as keyof AssessmentWeights[string]
                                  ] || 0;
                                return (
                                  <div className="text-center p-1">
                                    <InputNumber
                                      size="small"
                                      min={0}
                                      max={100}
                                      value={weight}
                                      onChange={(value) =>
                                        updateWeight(
                                          subcpmk.kode,
                                          record.key,
                                          value || 0
                                        )
                                      }
                                      style={{
                                        backgroundColor: "#ffff99",
                                        width: "100%",
                                        textAlign: "center",
                                      }}
                                      formatter={(value) => `${value}%`}
                                      parser={(value) =>
                                        value?.replace("%", "") || "0"
                                      }
                                    />
                                  </div>
                                );
                              },
                            }))
                          : [
                              {
                                title: "Direct",
                                width: 80,
                                render: (text: string, record: any) => {
                                  if (record.isTotal) {
                                    const total = [
                                      "tugas",
                                      "kuis",
                                      "uts",
                                      "uas",
                                    ].reduce(
                                      (sum, type) =>
                                        sum +
                                        (assessmentWeights[cpmk.kode]?.[
                                          type as keyof AssessmentWeights[string]
                                        ] || 0),
                                      0
                                    );
                                    return (
                                      <div
                                        className="text-center p-2 font-semibold"
                                        style={{ backgroundColor: "#d1e7dd" }}
                                      >
                                        {total}%
                                      </div>
                                    );
                                  }
                                  const weight =
                                    assessmentWeights[cpmk.kode]?.[
                                      record.key as keyof AssessmentWeights[string]
                                    ] || 0;
                                  return (
                                    <div className="text-center p-1">
                                      <InputNumber
                                        size="small"
                                        min={0}
                                        max={100}
                                        value={weight}
                                        onChange={(value) =>
                                          updateWeight(
                                            cpmk.kode,
                                            record.key,
                                            value || 0
                                          )
                                        }
                                        style={{
                                          backgroundColor: "#ffff99",
                                          width: "100%",
                                          textAlign: "center",
                                        }}
                                        formatter={(value) => `${value}%`}
                                        parser={(value) =>
                                          value?.replace("%", "") || "0"
                                        }
                                      />
                                    </div>
                                  );
                                },
                              },
                            ],
                    })),
                  })),
                  {
                    title: "Persentase",
                    width: 120,
                    fixed: "right",
                    render: (text: string, record: any) => {
                      if (record.isTotal) {
                        const grandTotal = [
                          "tugas",
                          "kuis",
                          "uts",
                          "uas",
                        ].reduce(
                          (sum, type) => sum + calculateAssessmentTotal(type),
                          0
                        );
                        return (
                          <div
                            className="text-center p-2 font-bold text-lg"
                            style={{ backgroundColor: "#d1e7dd" }}
                          >
                            {grandTotal}%
                          </div>
                        );
                      }
                      const total = calculateAssessmentTotal(record.key);
                      const isValid = total === record.target;
                      return (
                        <div
                          className="text-center p-2 font-semibold"
                          style={{
                            backgroundColor: "#b8d4f0",
                            color: isValid ? "#198754" : "#dc3545",
                          }}
                        >
                          {total}%
                        </div>
                      );
                    },
                  },
                ]}
                dataSource={[
                  {
                    key: "tugas",
                    assessment: "Tugas",
                    target: 5,
                    isTotal: false,
                  },
                  {
                    key: "kuis",
                    assessment: "Kuis",
                    target: 15,
                    isTotal: false,
                  },
                  { key: "uts", assessment: "UTS", target: 35, isTotal: false },
                  { key: "uas", assessment: "UAS", target: 45, isTotal: false },
                  {
                    key: "total",
                    assessment: "Persentase",
                    target: 100,
                    isTotal: true,
                  },
                ]}
              />

              <div className="mt-4 p-3 bg-blue-50 rounded">
                <Text strong>Status Validasi:</Text>
                <Row gutter={16} className="mt-2">
                  <Col>
                    <Text>Tugas: </Text>
                    <Tag
                      color={
                        calculateAssessmentTotal("tugas") > 100
                          ? "red"
                          : calculateAssessmentTotal("tugas") === 5
                          ? "green"
                          : "orange"
                      }
                    >
                      {calculateAssessmentTotal("tugas")}% / 5%
                    </Tag>
                  </Col>
                  <Col>
                    <Text>Kuis: </Text>
                    <Tag
                      color={
                        calculateAssessmentTotal("kuis") > 100
                          ? "red"
                          : calculateAssessmentTotal("kuis") === 15
                          ? "green"
                          : "orange"
                      }
                    >
                      {calculateAssessmentTotal("kuis")}% / 15%
                    </Tag>
                  </Col>
                  <Col>
                    <Text>UTS: </Text>
                    <Tag
                      color={
                        calculateAssessmentTotal("uts") > 100
                          ? "red"
                          : calculateAssessmentTotal("uts") === 35
                          ? "green"
                          : "orange"
                      }
                    >
                      {calculateAssessmentTotal("uts")}% / 35%
                    </Tag>
                  </Col>
                  <Col>
                    <Text>UAS: </Text>
                    <Tag
                      color={
                        calculateAssessmentTotal("uas") > 100
                          ? "red"
                          : calculateAssessmentTotal("uas") === 45
                          ? "green"
                          : "orange"
                      }
                    >
                      {calculateAssessmentTotal("uas")}% / 45%
                    </Tag>
                  </Col>
                  <Col>
                    <Text>Total CPMK: </Text>
                    <Tag
                      color={
                        calculateTotalCpmkPercentage() === 100 ? "green" : "red"
                      }
                    >
                      {calculateTotalCpmkPercentage()}% / 100%
                    </Tag>
                  </Col>
                  {Object.keys(subcpmkPercentages).length > 0 && (
                    <Col span={24} className="mt-2">
                      <Text>Total SubCPMK: </Text>
                      <Tag
                        color={
                          calculateTotalSubcpmkPercentage() ===
                          calculateTotalCpmkPercentage()
                            ? "green"
                            : "orange"
                        }
                      >
                        {calculateTotalSubcpmkPercentage()}% (harus sama dengan
                        Total CPMK)
                      </Tag>
                    </Col>
                  )}
                </Row>
              </div>
            </Card>
          </TabPane>

          {/* Input Penilaian Tab */}
          <TabPane tab="Input Penilaian" key="grades">
            <Card>
              <div className="mb-4">
                <Space>
                  <Text strong>Mode Penilaian:</Text>
                  <Radio.Group
                    value={assessmentMode}
                    onChange={(e) => setAssessmentMode(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="nilai">Nilai Assessment</Radio.Button>
                    <Radio.Button value="cpmk">CPMK Direct</Radio.Button>
                  </Radio.Group>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      const newStudent: Student = {
                        key: String(students.length + 1),
                        no: students.length + 1,
                        nim: `312510${String(students.length + 1).padStart(
                          3,
                          "0"
                        )}`,
                        nama: `Mahasiswa ${students.length + 1}`,
                        tugas: 0,
                        kuis: 0,
                        uts: 0,
                        uas: 0,
                      };
                      setStudents((prev) => [...prev, newStudent]);
                    }}
                  >
                    Tambah Mahasiswa
                  </Button>
                  <Button type="primary" icon={<SaveOutlined />}>
                    Simpan Data
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => fetchMKData()}
                  >
                    Refresh
                  </Button>
                </Space>
              </div>

              <Table
                bordered
                size="small"
                pagination={false}
                scroll={{ x: "max-content", y: 600 }}
                columns={[
                  {
                    title: "No",
                    dataIndex: "no",
                    width: 50,
                    fixed: "left",
                    render: (value: number) => (
                      <div className="text-center">{value}</div>
                    ),
                  },
                  {
                    title: "NIM",
                    dataIndex: "nim",
                    width: 120,
                    fixed: "left",
                    render: (value: string, record: Student) => (
                      <Input
                        size="small"
                        value={value}
                        onChange={(e) =>
                          updateStudent(record.key, "nim", e.target.value)
                        }
                      />
                    ),
                  },
                  {
                    title: "Nama Mahasiswa",
                    dataIndex: "nama",
                    width: 200,
                    fixed: "left",
                    render: (value: string, record: Student) => (
                      <Input
                        size="small"
                        value={value}
                        onChange={(e) =>
                          updateStudent(record.key, "nama", e.target.value)
                        }
                      />
                    ),
                  },
                  ...generateAssessmentInputColumns(),
                  ...generateCPMKInputColumns(),
                  ...(getActiveCPMKs().length > 0
                    ? [
                        {
                          title: (
                            <div
                              className="text-center font-bold p-2 text-white"
                              style={{ backgroundColor: "#6c757d" }}
                            >
                              DATA NILAI BERDASARKAN CPMK (SKALA 100)
                            </div>
                          ),
                          children: Object.entries(groupCPMKByCPL()).flatMap(
                            ([cplCode, cpmks]) => {
                              const activeCpmks = cpmks.filter((cpmk) => {
                                if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
                                  return cpmk.subcpmk.some((subcpmk) =>
                                    hasAssessmentWeights(subcpmk.kode)
                                  );
                                } else {
                                  return hasAssessmentWeights(cpmk.kode);
                                }
                              });
                              if (activeCpmks.length === 0) return [];
                              return [
                                {
                                  title: (
                                    <div
                                      className="text-center font-bold p-2"
                                      style={{ backgroundColor: "#a8dadc" }}
                                    >
                                      {cplCode}
                                    </div>
                                  ),
                                  children: activeCpmks
                                    .map((cpmk) => {
                                      if (
                                        cpmk.subcpmk &&
                                        cpmk.subcpmk.length > 0
                                      ) {
                                        const activeSubcpmks =
                                          cpmk.subcpmk.filter((subcpmk) =>
                                            hasAssessmentWeights(subcpmk.kode)
                                          );
                                        if (activeSubcpmks.length === 0)
                                          return null;
                                        return {
                                          title: (
                                            <div className="text-center">
                                              <div className="font-semibold">
                                                {cpmk.kode}
                                              </div>
                                              <div className="text-xs">
                                                {cpmk.kode.includes("5")
                                                  ? "15%"
                                                  : cpmk.kode.includes("22")
                                                  ? "15%"
                                                  : cpmk.kode.includes("23")
                                                  ? "30%"
                                                  : cpmk.kode.includes("24")
                                                  ? "40%"
                                                  : "25%"}
                                              </div>
                                            </div>
                                          ),
                                          children: activeSubcpmks.map(
                                            (subcpmk) => ({
                                              title: (
                                                <div className="text-center">
                                                  <div className="text-xs font-medium">
                                                    {subcpmk.kode}
                                                  </div>
                                                  <div className="text-xs">
                                                    {subcpmkPercentages[
                                                      subcpmk.kode
                                                    ] || 0}
                                                    %
                                                  </div>
                                                </div>
                                              ),
                                              width: 100,
                                              render: (
                                                text: string,
                                                record: Student
                                              ) => {
                                                const weights =
                                                  assessmentWeights[
                                                    subcpmk.kode
                                                  ] || {
                                                    tugas: 0,
                                                    kuis: 0,
                                                    uts: 0,
                                                    uas: 0,
                                                  };
                                                const subcpmkScore =
                                                  record.tugas * weights.tugas +
                                                  record.kuis * weights.kuis +
                                                  record.uts * weights.uts +
                                                  record.uas * weights.uas;
                                                const subcpmkWeight =
                                                  weights.tugas +
                                                  weights.kuis +
                                                  weights.uts +
                                                  weights.uas;
                                                const score =
                                                  subcpmkWeight > 0
                                                    ? Math.round(
                                                        (subcpmkScore /
                                                          subcpmkWeight) *
                                                          100
                                                      ) / 100
                                                    : 0;
                                                const level =
                                                  getCPMKLevel(score);
                                                return (
                                                  <div className="text-center">
                                                    <div>
                                                      <Tag color="geekblue">
                                                        {score.toFixed(2)}
                                                      </Tag>
                                                    </div>
                                                    <div className="text-xs mt-1">
                                                      <Tag
                                                        color={
                                                          level.point >= 3
                                                            ? "green"
                                                            : level.point >= 2
                                                            ? "orange"
                                                            : level.point >= 1
                                                            ? "yellow"
                                                            : "red"
                                                        }
                                                        className="text-xs"
                                                      >
                                                        {level.level}
                                                      </Tag>
                                                    </div>
                                                  </div>
                                                );
                                              },
                                            })
                                          ),
                                        };
                                      } else {
                                        return {
                                          title: (
                                            <div className="text-center">
                                              <div className="font-semibold">
                                                {cpmk.kode}
                                              </div>
                                              <div className="text-xs">
                                                {cpmk.kode.includes("5")
                                                  ? "15%"
                                                  : cpmk.kode.includes("22")
                                                  ? "15%"
                                                  : cpmk.kode.includes("23")
                                                  ? "30%"
                                                  : cpmk.kode.includes("24")
                                                  ? "40%"
                                                  : "25%"}
                                              </div>
                                            </div>
                                          ),
                                          width: 100,
                                          render: (
                                            text: string,
                                            record: Student
                                          ) => {
                                            const score = calculateCPMKScore(
                                              record,
                                              cpmk.kode
                                            );
                                            const level = getCPMKLevel(score);
                                            return (
                                              <div className="text-center">
                                                <div>
                                                  <Tag color="geekblue">
                                                    {score.toFixed(2)}
                                                  </Tag>
                                                </div>
                                                <div className="text-xs mt-1">
                                                  <Tag
                                                    color={
                                                      level.point >= 3
                                                        ? "green"
                                                        : level.point >= 2
                                                        ? "orange"
                                                        : level.point >= 1
                                                        ? "yellow"
                                                        : "red"
                                                    }
                                                    className="text-xs"
                                                  >
                                                    {level.level}
                                                  </Tag>
                                                </div>
                                              </div>
                                            );
                                          },
                                        };
                                      }
                                    })
                                    .filter(Boolean),
                                },
                              ];
                            }
                          ),
                        },
                      ]
                    : []),
                  {
                    title: (
                      <div
                        className="text-center font-bold p-2"
                        style={{ backgroundColor: "#c8d6e5" }}
                      >
                        NILAI
                        <br />
                        SKALA 100
                      </div>
                    ),
                    width: 120,
                    render: (text: string, record: Student) => {
                      const score = calculateFinalScore(record);
                      return (
                        <div className="text-center">
                          <Tag color="blue">{score.toFixed(2)}</Tag>
                        </div>
                      );
                    },
                  },
                  {
                    title: (
                      <div
                        className="text-center font-bold p-2"
                        style={{ backgroundColor: "#c8d6e5" }}
                      >
                        NILAI
                        <br />
                        SKALA 4
                      </div>
                    ),
                    width: 100,
                    render: (text: string, record: Student) => {
                      const score = calculateFinalScore(record);
                      const grade = getGrade(score);
                      return (
                        <div className="text-center">
                          <Tag color="green">{grade.point}</Tag>
                        </div>
                      );
                    },
                  },
                  {
                    title: (
                      <div
                        className="text-center font-bold p-2"
                        style={{ backgroundColor: "#c8d6e5" }}
                      >
                        NILAI
                        <br />
                        HURUF
                      </div>
                    ),
                    width: 100,
                    render: (text: string, record: Student) => {
                      const score = calculateFinalScore(record);
                      const grade = getGrade(score);
                      return (
                        <div className="text-center">
                          <Tag color="purple">{grade.grade}</Tag>
                        </div>
                      );
                    },
                  },
                  {
                    title: (
                      <div
                        className="text-center font-bold p-2"
                        style={{ backgroundColor: "#c8d6e5" }}
                      >
                        LABEL
                      </div>
                    ),
                    width: 120,
                    render: (text: string, record: Student) => {
                      const score = calculateFinalScore(record);
                      const isPass = score >= 45;
                      return (
                        <div className="text-center">
                          <Tag color={isPass ? "success" : "error"}>
                            {isPass ? "Lulus" : "Tidak Lulus"}
                          </Tag>
                        </div>
                      );
                    },
                  },
                ]}
                dataSource={students}
              />
            </Card>
          </TabPane>

          {/* Skala Penilaian Tab */}
          <TabPane tab="Skala Penilaian" key="scale">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Skala Penilaian Nilai (0-100)">
                  <Table
                    bordered
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: "Rentang Nilai",
                        dataIndex: "range",
                        render: (text: string, record: any) => (
                          <span className="font-medium">
                            {record.min} - {record.max}
                          </span>
                        ),
                      },
                      {
                        title: "Grade",
                        dataIndex: "grade",
                        render: (text: string) => (
                          <Tag color="blue" className="font-bold">
                            {text}
                          </Tag>
                        ),
                      },
                      {
                        title: "Poin",
                        dataIndex: "point",
                        render: (text: number) => (
                          <span className="font-medium">{text}</span>
                        ),
                      },
                      {
                        title: "Status",
                        render: (text: string, record: any) => {
                          const isPass = record.min >= 45;
                          return (
                            <Tag color={isPass ? "success" : "error"}>
                              {isPass ? "Lulus" : "Tidak Lulus"}
                            </Tag>
                          );
                        },
                      },
                    ]}
                    dataSource={GRADE_SCALE.map((scale, index) => ({
                      key: index,
                      ...scale,
                    }))}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Skala CPMK (0-100)">
                  <Table
                    bordered
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: "Rentang Nilai",
                        dataIndex: "range",
                        render: (text: string, record: any) => (
                          <span className="font-medium">
                            {record.min} - {record.max}
                          </span>
                        ),
                      },
                      {
                        title: "Level CPMK",
                        dataIndex: "level",
                        render: (text: string) => (
                          <Tag color="cyan" className="font-bold">
                            {text}
                          </Tag>
                        ),
                      },
                      {
                        title: "Poin",
                        dataIndex: "point",
                        render: (text: number) => (
                          <span className="font-medium">{text}</span>
                        ),
                      },
                      {
                        title: "Keterangan",
                        render: (text: string, record: any) => {
                          let desc = "";
                          let color = "";
                          switch (record.point) {
                            case 4:
                              desc = "Sangat Kompeten";
                              color = "green";
                              break;
                            case 3:
                              desc = "Kompeten";
                              color = "blue";
                              break;
                            case 2:
                              desc = "Cukup Kompeten";
                              color = "orange";
                              break;
                            case 1:
                              desc = "Kurang Kompeten";
                              color = "yellow";
                              break;
                            case 0:
                              desc = "Tidak Kompeten";
                              color = "red";
                              break;
                          }
                          return <Tag color={color}>{desc}</Tag>;
                        },
                      },
                    ]}
                    dataSource={CPMK_SCALE.map((scale, index) => ({
                      key: index,
                      ...scale,
                    }))}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default withDashboardLayout(SimpleOBEAssessment);
