// components/Assessment/AssessmentConfig.tsx
import React from "react";
import { Card, Table, InputNumber, Tag, Row, Col, Typography } from "antd";
import type {
  MKData,
  AssessmentWeights,
  CPMKPercentages,
  SubCPMKPercentages,
  AssessmentConfig,
} from "./interfaces";
import { groupCPMKByCPL, calculateAssessmentTotal } from "./utils";

const { Text } = Typography;

interface AssessmentConfigProps {
  selectedMK: MKData;
  assessmentWeights: AssessmentWeights;
  cpmkPercentages: CPMKPercentages;
  subcpmkPercentages: SubCPMKPercentages;
  onUpdateWeight: (
    uniqueKey: string,
    assessmentType: string,
    value: number
  ) => void;
  onUpdateCpmkPercentage: (cpmkCode: string, value: number) => void;
  onUpdateSubcpmkPercentage: (uniqueKey: string, value: number) => void;
}

const AssessmentConfigComponent: React.FC<AssessmentConfigProps> = ({
  selectedMK,
  assessmentWeights,
  cpmkPercentages,
  subcpmkPercentages,
  onUpdateWeight,
  onUpdateCpmkPercentage,
  onUpdateSubcpmkPercentage,
}) => {
  const cplGroups = groupCPMKByCPL(selectedMK);

  const calculateTotalCpmkPercentage = () => {
    return Object.values(cpmkPercentages).reduce((sum, pct) => sum + pct, 0);
  };

  const calculateTotalSubcpmkPercentage = () => {
    return Object.values(subcpmkPercentages).reduce((sum, pct) => sum + pct, 0);
  };

  const assessmentConfigData: AssessmentConfig[] = [
    { key: "tugas", assessment: "Tugas", target: 5, isTotal: false },
    { key: "kuis", assessment: "Kuis", target: 15, isTotal: false },
    { key: "uts", assessment: "UTS", target: 35, isTotal: false },
    { key: "uas", assessment: "UAS", target: 45, isTotal: false },
    { key: "total", assessment: "Persentase", target: 100, isTotal: true },
  ];

  // Helper function to get primary CPL code for a CPMK
  const getPrimaryCplCode = (cpmk: any) => {
    if (cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0) {
      return cpmk.cpl[0].kode;
    } else if (cpmk.cpl && !Array.isArray(cpmk.cpl)) {
      return cpmk.cpl.kode;
    }
    return `No_CPL_${cpmk.kode}`;
  };

  return (
    <Card>
      <div className="mb-4">
        <Text strong>Petunjuk: </Text>
        <Text>
          Input bobot assessment (kolom kuning) per Sub CPMK. Total per
          assessment type harus sesuai target (Tugas: 5%, Kuis: 15%, UTS: 35%,
          UAS: 45%)
        </Text>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded">
        <Text strong>Persentase CPMK (seperti gambar): </Text>
        {selectedMK?.cpmk?.map((cpmk) => (
          <span key={cpmk.kode} className="ml-4">
            <Text>{cpmk.kode}: </Text>
            <Tag color="blue">25%</Tag>
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
            render: (text: string, record: AssessmentConfig) => (
              <div
                className="text-center font-semibold p-2"
                style={{
                  backgroundColor: record.isTotal ? "#d1e7dd" : "#90ee90",
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
                  backgroundColor: "#a8dadc",
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
                  ? cpmk.subcpmk.map((subcpmk) => {
                      // Get the unique key for this subcpmk with current CPL context
                      const currentCplCode =
                        (cpmk as any)._cplContext || getPrimaryCplCode(cpmk);
                      const uniqueSubcpmkKey = `${subcpmk.kode}_${cpmk.kode}_${currentCplCode}`;

                      return {
                        title: (
                          <div
                            className="text-center text-xs font-medium p-1"
                            style={{ backgroundColor: "#e9ecef" }}
                          >
                            {subcpmk.kode}
                          </div>
                        ),
                        width: 80,
                        render: (text: string, record: AssessmentConfig) => {
                          if (record.isTotal) {
                            const total = [
                              "tugas",
                              "kuis",
                              "uts",
                              "uas",
                            ].reduce(
                              (sum, type) =>
                                sum +
                                (assessmentWeights[uniqueSubcpmkKey]?.[
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
                            assessmentWeights[uniqueSubcpmkKey]?.[
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
                                  onUpdateWeight(
                                    uniqueSubcpmkKey,
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
                      };
                    })
                  : [
                      {
                        title: "Direct",
                        width: 80,
                        render: (text: string, record: AssessmentConfig) => {
                          // Get the unique key for this cpmk with current CPL context
                          const currentCplCode =
                            (cpmk as any)._cplContext ||
                            getPrimaryCplCode(cpmk);
                          const uniqueCpmkKey = `${cpmk.kode}_${currentCplCode}`;

                          if (record.isTotal) {
                            const total = [
                              "tugas",
                              "kuis",
                              "uts",
                              "uas",
                            ].reduce(
                              (sum, type) =>
                                sum +
                                (assessmentWeights[uniqueCpmkKey]?.[
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
                            assessmentWeights[uniqueCpmkKey]?.[
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
                                  onUpdateWeight(
                                    uniqueCpmkKey,
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
            render: (text: string, record: AssessmentConfig) => {
              if (record.isTotal) {
                const grandTotal = ["tugas", "kuis", "uts", "uas"].reduce(
                  (sum, type) =>
                    sum +
                    calculateAssessmentTotal(
                      type,
                      selectedMK,
                      assessmentWeights
                    ),
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
              const total = calculateAssessmentTotal(
                record.key,
                selectedMK,
                assessmentWeights
              );
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
        dataSource={assessmentConfigData}
      />

      <div className="mt-4 p-3 bg-blue-50 rounded">
        <Text strong>Status Validasi:</Text>
        <Row gutter={16} className="mt-2">
          <Col>
            <Text>Tugas: </Text>
            <Tag
              color={
                calculateAssessmentTotal(
                  "tugas",
                  selectedMK,
                  assessmentWeights
                ) > 100
                  ? "red"
                  : calculateAssessmentTotal(
                      "tugas",
                      selectedMK,
                      assessmentWeights
                    ) === 5
                  ? "green"
                  : "orange"
              }
            >
              {calculateAssessmentTotal("tugas", selectedMK, assessmentWeights)}
              % / 5%
            </Tag>
          </Col>
          <Col>
            <Text>Kuis: </Text>
            <Tag
              color={
                calculateAssessmentTotal(
                  "kuis",
                  selectedMK,
                  assessmentWeights
                ) > 100
                  ? "red"
                  : calculateAssessmentTotal(
                      "kuis",
                      selectedMK,
                      assessmentWeights
                    ) === 15
                  ? "green"
                  : "orange"
              }
            >
              {calculateAssessmentTotal("kuis", selectedMK, assessmentWeights)}%
              / 15%
            </Tag>
          </Col>
          <Col>
            <Text>UTS: </Text>
            <Tag
              color={
                calculateAssessmentTotal("uts", selectedMK, assessmentWeights) >
                100
                  ? "red"
                  : calculateAssessmentTotal(
                      "uts",
                      selectedMK,
                      assessmentWeights
                    ) === 35
                  ? "green"
                  : "orange"
              }
            >
              {calculateAssessmentTotal("uts", selectedMK, assessmentWeights)}%
              / 35%
            </Tag>
          </Col>
          <Col>
            <Text>UAS: </Text>
            <Tag
              color={
                calculateAssessmentTotal("uas", selectedMK, assessmentWeights) >
                100
                  ? "red"
                  : calculateAssessmentTotal(
                      "uas",
                      selectedMK,
                      assessmentWeights
                    ) === 45
                  ? "green"
                  : "orange"
              }
            >
              {calculateAssessmentTotal("uas", selectedMK, assessmentWeights)}%
              / 45%
            </Tag>
          </Col>
          <Col>
            <Text>Total CPMK: </Text>
            <Tag
              color={calculateTotalCpmkPercentage() === 100 ? "green" : "red"}
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
                {calculateTotalSubcpmkPercentage()}% (harus sama dengan Total
                CPMK)
              </Tag>
            </Col>
          )}
        </Row>
      </div>
    </Card>
  );
};

export default AssessmentConfigComponent;
