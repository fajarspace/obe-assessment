import React, { useMemo, useState } from "react";
import {
  Card,
  Select,
  Row,
  Col,
  Typography,
  Alert,
  Switch,
  Button,
  Progress,
  Tooltip,
  Tag,
  Space,
  Divider,
} from "antd";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  DownloadOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  SwapOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Text, Title } = Typography;

interface Props {
  students: any[];
  assessmentWeights: any;
  relatedCPL: string[];
  getRelatedCPMK: (cpl: string) => string[];
  getRelatedSubCPMK: (cpmk: string) => string[];
  curriculumData: any;
  hasSubCPMKData: boolean;
  assessmentTypes: string[];
  selectedCourse: string;
}

const EnhancedCPMKRadarChart: React.FC<Props> = ({
  students,
  assessmentWeights,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
  curriculumData,
  hasSubCPMKData,
  assessmentTypes,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [selectedComparisons, setSelectedComparisons] = useState<string[]>([]);
  const [chartType, setChartType] = useState<string>("radar");
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [showPerformanceAnalysis, setShowPerformanceAnalysis] =
    useState<boolean>(true);

  // Performance indicator function - using your existing system
  const getPerformanceIndicator = (score: number) => {
    if (score >= 76.25) {
      return { label: 4, description: "Sangat Menguasai", color: "#52c41a" };
    } else if (score >= 65) {
      return { label: 3, description: "Menguasai", color: "#1890ff" };
    } else if (score >= 51.25) {
      return { label: 2, description: "Cukup Menguasai", color: "#faad14" };
    } else if (score >= 40) {
      return { label: 1, description: "Kurang Menguasai", color: "#ff4d4f" };
    } else {
      return { label: 0, description: "Tidak Menguasai", color: "#8c8c8c" };
    }
  };

  const getPerformanceLevel = (score: number) => {
    const indicator = getPerformanceIndicator(score);
    return {
      level: indicator.label.toString(),
      label: indicator.description,
      color: indicator.color,
      numericLevel: indicator.label,
    };
  };

  const calculateCPMKScores = (student: any): Record<string, number> => {
    const cpmkScores: Record<string, number> = {};

    relatedCPL.forEach((cpl) => {
      const relatedCPMK = getRelatedCPMK(cpl);

      relatedCPMK.forEach((cpmk) => {
        const relatedSubCPMK = getRelatedSubCPMK(cpmk);
        let totalWeightedScore = 0;
        let totalWeight = 0;

        if (hasSubCPMKData && relatedSubCPMK.length > 0) {
          relatedSubCPMK.forEach((subCpmk) => {
            assessmentTypes.forEach((assessmentType) => {
              const weight =
                assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                  assessmentType
                ] || 0;
              const assessmentScore = Number(student[assessmentType]) || 0;
              totalWeightedScore += (assessmentScore * weight) / 100;
              totalWeight += weight / 100;
            });
          });
        } else {
          assessmentTypes.forEach((assessmentType) => {
            const weight =
              assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
            const assessmentScore = Number(student[assessmentType]) || 0;
            totalWeightedScore += (assessmentScore * weight) / 100;
            totalWeight += weight / 100;
          });
        }

        if (totalWeight > 0) {
          cpmkScores[cpmk] =
            Math.round((totalWeightedScore / totalWeight) * 10) / 10;
        } else {
          const avgScore =
            assessmentTypes.reduce(
              (sum, type) => sum + (Number(student[type]) || 0),
              0
            ) / assessmentTypes.length;
          cpmkScores[cpmk] = Math.round(avgScore * 10) / 10;
        }
      });
    });

    return cpmkScores;
  };

  const calculateClassAverageCPMKScores = (): Record<string, number> => {
    const validStudents = students.filter((student) =>
      assessmentTypes.every((type) => (student[type] || 0) > 0)
    );

    if (validStudents.length === 0) return {};

    const cpmkAverages: Record<string, number> = {};
    const allCPMK: string[] = [];

    relatedCPL.forEach((cpl) => {
      allCPMK.push(...getRelatedCPMK(cpl));
    });

    allCPMK.forEach((cpmk) => {
      const scores = validStudents.map((student) => {
        const studentScores = calculateCPMKScores(student);
        return studentScores[cpmk] || 0;
      });

      const avgScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      cpmkAverages[cpmk] = Math.round(avgScore * 10) / 10;
    });

    return cpmkAverages;
  };

  const radarData = useMemo(() => {
    if (relatedCPL.length === 0) return [];

    let cpmkScores: Record<string, number>;

    if (selectedStudent === "all") {
      cpmkScores = calculateClassAverageCPMKScores();
    } else {
      const student = students.find((s) => s.key === selectedStudent);
      if (!student) return [];
      cpmkScores = calculateCPMKScores(student);
    }

    const data: any[] = [];
    const benchmarkScore = 75; // Target benchmark

    relatedCPL.forEach((cpl) => {
      const relatedCPMK = getRelatedCPMK(cpl);
      relatedCPMK.forEach((cpmk) => {
        const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
        const cpmkDescription =
          curriculumData?.cpmk?.[cpmk]?.description ||
          curriculumData?.cpmk?.[cpmk]?.deskripsi ||
          "Deskripsi tidak tersedia";
        const score = cpmkScores[cpmk] || 0;
        const performance = getPerformanceLevel(score);
        const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;

        data.push({
          cpmk: cpmkCode,
          fullName: cpmkDescription,
          score: score,
          benchmark: benchmarkScore,
          performance: performance.level,
          performanceLabel: performance.label,
          performanceColor: performance.color,
          numericLevel: performance.numericLevel,
          cplGroup: cplCode,
          cplDescription:
            curriculumData?.cpl?.[cpl]?.description ||
            curriculumData?.cpl?.[cpl]?.deskripsi,
        });
      });
    });

    return data;
  }, [
    selectedStudent,
    students,
    assessmentWeights,
    relatedCPL,
    hasSubCPMKData,
    curriculumData,
    getRelatedCPMK,
    getRelatedSubCPMK,
    assessmentTypes,
  ]);

  const comparisonData = useMemo(() => {
    if (!showComparison || selectedComparisons.length === 0) return [];

    const data: any[] = [];
    const allCPMK: string[] = [];
    relatedCPL.forEach((cpl) => {
      allCPMK.push(...getRelatedCPMK(cpl));
    });

    allCPMK.forEach((cpmk) => {
      const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
      const cpmkDescription =
        curriculumData?.cpmk?.[cpmk]?.deskripsi || "Deskripsi tidak tersedia";

      const item: any = {
        cpmk: cpmkCode,
        fullName: cpmkDescription,
      };

      // Add class average
      if (selectedComparisons.includes("all")) {
        const classScores = calculateClassAverageCPMKScores();
        item.classAverage = classScores[cpmk] || 0;
      }

      // Add individual students
      selectedComparisons.forEach((studentKey) => {
        if (studentKey !== "all") {
          const student = students.find((s) => s.key === studentKey);
          if (student) {
            const studentScores = calculateCPMKScores(student);
            const studentName =
              student.name?.replace(/\s+/g, "") || `Student${studentKey}`;
            item[studentName] = studentScores[cpmk] || 0;
          }
        }
      });

      data.push(item);
    });

    return data;
  }, [
    showComparison,
    selectedComparisons,
    students,
    relatedCPL,
    getRelatedCPMK,
    curriculumData,
    calculateClassAverageCPMKScores,
    calculateCPMKScores,
  ]);

  const performanceStats = useMemo(() => {
    const stats = {
      "4": 0, // Sangat Menguasai
      "3": 0, // Menguasai
      "2": 0, // Cukup Menguasai
      "1": 0, // Kurang Menguasai
      "0": 0, // Tidak Menguasai
    };

    radarData.forEach((item) => {
      const level = item.numericLevel.toString();
      if (stats.hasOwnProperty(level)) {
        //@ts-ignore
        stats[level]++;
      }
    });

    const total = radarData.length;
    const levelLabels = {
      "4": "Sangat Menguasai",
      "3": "Menguasai",
      "2": "Cukup Menguasai",
      "1": "Kurang Menguasai",
      "0": "Tidak Menguasai",
    };

    const levelColors = {
      "4": "#52c41a",
      "3": "#1890ff",
      "2": "#faad14",
      "1": "#ff4d4f",
      "0": "#8c8c8c",
    };

    return {
      counts: stats,
      percentages: Object.keys(stats).reduce((acc, level) => {
        //@ts-ignore
        acc[level] = total > 0 ? Math.round((stats[level] / total) * 100) : 0;
        return acc;
      }, {}),
      labels: levelLabels,
      colors: levelColors,
    };
  }, [radarData]);

  const validStudents = students.filter((student) =>
    assessmentTypes.every((type) => (student[type] || 0) > 0)
  );

  if (relatedCPL.length === 0) {
    return (
      <Alert
        message="Tidak ada data CPL/CPMK"
        description="Pilih mata kuliah yang memiliki data CPL/CPMK"
        type="warning"
        showIcon
      />
    );
  }

  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={500}>
      <RadarChart
        data={radarData}
        margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
      >
        <PolarGrid stroke="#e8e8e8" />
        <PolarAngleAxis
          dataKey="cpmk"
          tick={{ fontSize: 11, fontWeight: "bold" }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
          tickCount={6}
        />

        {/* Benchmark circle */}
        {showBenchmark && (
          <Radar
            name="Target (75)"
            dataKey="benchmark"
            stroke="#ffa940"
            strokeWidth={2}
            fill="transparent"
            strokeDasharray="5,5"
          />
        )}

        {/* Main score radar */}
        <Radar
          name={
            selectedStudent === "all"
              ? "Rata-rata Kelas"
              : students.find((s) => s.key === selectedStudent)?.name ||
                "Mahasiswa"
          }
          dataKey="score"
          stroke="#1890ff"
          fill="#1890ff"
          fillOpacity={0.3}
          strokeWidth={3}
          dot={{ fill: "#1890ff", strokeWidth: 2, r: 4 }}
        />

        <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
      </RadarChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={radarData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3,3" />
        <XAxis
          dataKey="cpmk"
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={11}
        />
        <YAxis domain={[0, 100]} />
        <Bar dataKey="score" name="Score">
          {radarData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.performanceColor} />
          ))}
        </Bar>
        {showBenchmark && (
          <Bar
            dataKey="benchmark"
            fill="transparent"
            stroke="#ffa940"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderComparisonChart = () => {
    if (comparisonData.length === 0) return null;

    const colors = [
      "#1890ff",
      "#52c41a",
      "#faad14",
      "#ff4d4f",
      "#722ed1",
      "#13c2c2",
    ];
    const dataKeys = Object.keys(comparisonData[0]).filter(
      (key) => key !== "cpmk" && key !== "fullName"
    );

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={comparisonData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3,3" />
          <XAxis
            dataKey="cpmk"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={11}
          />
          <YAxis domain={[0, 100]} />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              name={key === "classAverage" ? "Rata-rata Kelas" : key}
            />
          ))}
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="!space-y-6">
      {/* Controls Card */}
      <Card title="Analisis CPMK">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div className="!space-y-2">
              <Select
                value={selectedStudent}
                onChange={setSelectedStudent}
                style={{ width: "100%" }}
                placeholder="Pilih mahasiswa atau rata-rata"
              >
                <Option value="all">
                  <TrophyOutlined className="mr-2" />
                  Rata-rata Kelas ({validStudents.length} mahasiswa)
                </Option>
                {validStudents.map((student) => (
                  <Option key={student.key} value={student.key}>
                    {student.name || `Mahasiswa ${student.key}`}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div className="space-y-2">
              <Select
                value={chartType}
                onChange={setChartType}
                style={{ width: "100%" }}
              >
                <Option value="radar">Radar Chart</Option>
                <Option value="bar">Bar Chart</Option>
                <Option value="comparison" disabled={!showComparison}>
                  Comparison Chart
                </Option>
              </Select>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div className="!space-y-3">
              <div className="flex items-center !space-x-2">
                <Switch
                  checked={showBenchmark}
                  onChange={setShowBenchmark}
                  size="small"
                />
                <Text>Tampilkan Target (75)</Text>
              </div>
              <div className="flex items-center !space-x-2">
                <Switch
                  checked={showPerformanceAnalysis}
                  onChange={setShowPerformanceAnalysis}
                  size="small"
                />
                <Text>Analisis Performa</Text>
              </div>
            </div>
          </Col>
        </Row>

        {/* Comparison Controls */}
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="flex items-center !space-x-2 mb-3">
              <Switch
                checked={showComparison}
                onChange={setShowComparison}
                size="small"
              />
              <Text strong>Mode Perbandingan</Text>
              <SwapOutlined />
            </div>
            {showComparison && (
              <Select
                mode="multiple"
                value={selectedComparisons}
                onChange={setSelectedComparisons}
                style={{ width: "100%" }}
                placeholder="Pilih subjek untuk dibandingkan"
                maxTagCount={3}
              >
                <Option value="all">Rata-rata Kelas</Option>
                {validStudents.map((student) => (
                  <Option key={student.key} value={student.key}>
                    {student.name || `Mahasiswa ${student.key}`}
                  </Option>
                ))}
              </Select>
            )}
          </Col>
        </Row>
      </Card>

      {/* Main Chart Card */}
      <Card
        title={`Analisis CPMK - ${
          selectedStudent === "all"
            ? "Rata-rata Kelas"
            : students.find((s) => s.key === selectedStudent)?.name ||
              "Mahasiswa"
        }`}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} size="small">
              Export
            </Button>
          </Space>
        }
      >
        {showComparison && selectedComparisons.length > 0
          ? renderComparisonChart()
          : chartType === "radar"
          ? renderRadarChart()
          : renderBarChart()}
      </Card>

      {/* Performance Analysis */}
      {showPerformanceAnalysis && (
        <Card title="Analisis Performa CPMK">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div className="!space-y-3">
                <Title level={5}>Distribusi Penguasaan Materi</Title>
                {Object.entries(performanceStats.percentages).map(
                  ([level, percentage]) => {
                    //@ts-ignore
                    const color = performanceStats.colors[level];
                    //@ts-ignore
                    const label = performanceStats.labels[level];
                    return (
                      <div
                        key={level}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: color }}
                          >
                            {level}
                          </div>
                          <Text>{label}</Text>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            //@ts-ignore
                            percent={percentage}
                            strokeColor={color}
                            size="small"
                            style={{ width: 100 }}
                            showInfo={false}
                          />
                          <Text strong>
                            {/* @ts-ignore */}
                            {percentage}% ({performanceStats.counts[level]})
                          </Text>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </Col>

            <Col xs={24} md={12}>
              <div className="space-y-3">
                <div className=" overflow-y-auto space-y-2">
                  {radarData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Tag color="blue" className="mb-1">
                            {item.cpmk}
                          </Tag>
                          <Tooltip title={item.fullName}>
                            <InfoCircleOutlined className="text-gray-400" />
                          </Tooltip>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-xl font-bold"
                          style={{ color: item.performanceColor }}
                        >
                          {item.score}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min. Menguasai: 65
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Assessment Breakdown for Individual Student */}
      {selectedStudent !== "all" && (
        <Card title="Detail Penilaian per Komponen" size="small">
          <Row gutter={16}>
            {assessmentTypes.map((type) => {
              const student = students.find((s) => s.key === selectedStudent);
              const score = student?.[type] || 0;
              const performance = getPerformanceLevel(score);

              return (
                <Col key={type} xs={12} md={6} className="mb-4">
                  <div
                    className="text-center p-3 border rounded-lg"
                    style={{ borderColor: performance.color }}
                  >
                    <div
                      className="text-2xl font-bold mb-2"
                      style={{ color: performance.color }}
                    >
                      {score}
                    </div>
                    <div className="text-sm capitalize font-medium mb-2">
                      {type}
                    </div>
                    <Tag color={performance.color.replace("#", "")}>
                      {performance.label}
                    </Tag>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}

      {/* Recommendations */}
      {selectedStudent !== "all" && (
        <Card title="Rekomendasi Perbaikan" size="small">
          <div className="space-y-3">
            {radarData
              .filter((item) => item.score < 75)
              .sort((a, b) => a.score - b.score)
              .slice(0, 3)
              .map((item, index) => (
                <Alert
                  key={index}
                  message={`${item.cpmk}: ${item.performanceLabel}`}
                  description={
                    <div>
                      <Text>{item.fullName}</Text>
                      <br />
                      <Text type="secondary">
                        Skor saat ini: {item.score} | Target: 75 | Perlu
                        peningkatan: {Math.round((75 - item.score) * 10) / 10}{" "}
                        poin
                      </Text>
                    </div>
                  }
                  type={item.score < 55 ? "error" : "warning"}
                  showIcon
                  icon={
                    item.score < 55 ? (
                      <WarningOutlined />
                    ) : (
                      <InfoCircleOutlined />
                    )
                  }
                  className="mb-2"
                />
              ))}
            {radarData.filter((item) => item.score < 75).length === 0 && (
              <Alert
                message="Pencapaian Baik"
                description="Semua CPMK telah mencapai target minimum (75). Pertahankan performa ini!"
                type="success"
                showIcon
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCPMKRadarChart;
