// components/DynamicAssessmentWeightsTable.tsx - Responsive Version with Yellow Inputs
import React from "react";
import {
  Table,
  Input,
  Card,
  Grid,
  Collapse,
  Form,
  Row,
  Col,
  Divider,
  Typography,
} from "antd";
import type { AssessmentWeights, CurriculumData } from "@/types/interface";

const { useBreakpoint } = Grid;
const { Panel } = Collapse;
const { Text, Title } = Typography;

interface Props {
  assessmentWeights: AssessmentWeights;
  relatedCPL: string[];
  getRelatedCPMK: (cpl: string) => string[];
  getRelatedSubCPMK: (cpmk: string) => string[];
  updateAssessmentWeight: (
    cpl: string,
    cpmk: string,
    assessmentType: string,
    value: number,
    subCpmk?: string
  ) => void;
  curriculumData: CurriculumData | null;
  hasSubCPMKData: boolean;
  assessmentTypes: string[];
}

export const DynamicAssessmentWeightsTable: React.FC<Props> = ({
  assessmentWeights,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
  updateAssessmentWeight,
  curriculumData,
  hasSubCPMKData,
  assessmentTypes,
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const buildColumns = () => {
    interface AssessmentColumn {
      title: string | React.ReactNode;
      dataIndex?: string;
      key: string;
      width?: number;
      className?: string;
      onHeaderCell?: () => {
        style: React.CSSProperties;
        className?: string;
      };
      onCell?: (record: any) => {
        style: React.CSSProperties;
        className?: string;
        colSpan?: number;
      };
      render?: (value: any, record: any) => React.ReactNode;
      children?: AssessmentColumn[];
    }

    const columns: AssessmentColumn[] = [
      {
        title: "Bentuk Assessment",
        dataIndex: "bentuk",
        key: "bentuk",
        width: isMobile ? 120 : 150,
        className: "text-center",
        onHeaderCell: () => ({
          style: {
            textAlign: "center",
            fontWeight: "600",
            fontSize: isMobile ? "12px" : "14px",
          },
          className: "bg-gray-100",
        }),
        onCell: (record) => ({
          style: {
            textAlign: "center",
            fontWeight:
              record.key === "presentase" || record.key === "cpmk-presentase"
                ? "600"
                : "normal",
            fontSize: isMobile ? "11px" : "13px",
          },
          className:
            record.key === "presentase"
              ? "bg-gray-50"
              : record.key === "cpmk-presentase"
              ? "bg-gray-50"
              : "bg-white",
        }),
      },
    ];

    // Add CPL columns with proper hierarchy
    relatedCPL.forEach((cpl) => {
      const relatedCPMK = getRelatedCPMK(cpl);
      const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;

      if (relatedCPMK.length === 0) {
        return; // Skip CPL without CPMK
      }

      // Create CPMK columns for this CPL
      const cpmkChildren: AssessmentColumn[] = relatedCPMK.map((cpmk) => {
        const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
        const relatedSubCPMK = getRelatedSubCPMK(cpmk);

        if (hasSubCPMKData && relatedSubCPMK.length > 0) {
          // CPMK has Sub-CPMK - create nested structure
          const subCpmkColumns: AssessmentColumn[] = relatedSubCPMK.map(
            (subCpmk) => ({
              title: (
                <div
                  className={`text-xs font-medium text-center p-1 ${
                    isMobile ? "text-xs" : ""
                  }`}
                >
                  {curriculumData?.subcpmk?.[subCpmk]?.kode || subCpmk}
                </div>
              ),
              dataIndex: `${cpl}_${cpmk}_${subCpmk}`,
              key: `${cpl}_${cpmk}_${subCpmk}`,
              width: isMobile ? 60 : 80,
              className: "text-center",
              onHeaderCell: () => ({
                style: {
                  textAlign: "center",
                  fontWeight: "500",
                  fontSize: isMobile ? "10px" : "11px",
                },
                className: "bg-blue-50",
              }),
              onCell: (record) => ({
                style: {
                  textAlign: "center",
                  padding: isMobile ? "1px" : "2px",
                },
                className:
                  record.key === "presentase" ? "bg-gray-50" : "bg-white",
              }),
              render: (value: number | string, record: any) => {
                if (record.key === "presentase") {
                  return (
                    <div
                      className={`text-center font-medium py-1 ${
                        isMobile ? "text-xs" : "text-xs"
                      }`}
                    >
                      {value}%
                    </div>
                  );
                }

                return (
                  <Input
                    type="number"
                    value={(value as number) || 0}
                    onChange={(e) =>
                      updateAssessmentWeight(
                        cpl,
                        cpmk,
                        record.key,
                        Number(e.target.value) || 0,
                        subCpmk
                      )
                    }
                    min={0}
                    max={100}
                    size="small"
                    className="text-center bg-yellow-300"
                    style={{
                      height: isMobile ? "20px" : "24px",
                      fontSize: isMobile ? "10px" : "11px",
                      backgroundColor: "#fde047", // yellow-300
                    }}
                  />
                );
              },
            })
          );

          return {
            title: (
              <div
                className={`font-medium text-center ${
                  isMobile ? "text-xs" : "text-sm"
                }`}
              >
                {cpmkCode}
              </div>
            ),
            children: subCpmkColumns,
            key: `cpmk_${cpmk}`,
          } as AssessmentColumn;
        } else {
          // CPMK without Sub-CPMK (direct column)
          return {
            title: (
              <div
                className={`text-center ${isMobile ? "text-xs" : "text-sm"}`}
              >
                {cpmkCode}
              </div>
            ),
            dataIndex: `${cpl}_${cpmk}`,
            key: `${cpl}_${cpmk}`,
            width: isMobile ? 80 : 100,
            className: "text-center",
            onHeaderCell: () => ({
              style: {
                textAlign: "center",
                fontWeight: "500",
                fontSize: isMobile ? "11px" : "13px",
              },
              className: "bg-yellow-100",
            }),
            onCell: (record) => ({
              style: {
                textAlign: "center",
                padding: isMobile ? "2px" : "4px",
              },
              className:
                record.key === "presentase" ? "bg-gray-50" : "bg-white",
            }),
            render: (value: number, record: any) => {
              if (record.key === "presentase") {
                return (
                  <div
                    className={`text-center font-medium py-1 bg-blue-100 ${
                      isMobile ? "text-xs" : "text-sm"
                    }`}
                  >
                    {value}%
                  </div>
                );
              }

              return (
                <Input
                  type="number"
                  value={value || 0}
                  onChange={(e) =>
                    updateAssessmentWeight(
                      cpl,
                      cpmk,
                      record.key,
                      Number(e.target.value) || 0
                    )
                  }
                  min={0}
                  max={100}
                  size="small"
                  className="text-center bg-yellow-300"
                  style={{
                    height: isMobile ? "22px" : "28px",
                    fontSize: isMobile ? "11px" : "12px",
                    backgroundColor: "#fde047", // yellow-300
                  }}
                />
              );
            },
          } as AssessmentColumn;
        }
      });

      // Add CPL header with CPMK children
      columns.push({
        title: (
          <div className="text-center">
            <div className={`font-bold ${isMobile ? "text-sm" : "text-lg"}`}>
              {cplCode}
            </div>
          </div>
        ),
        children: cpmkChildren,
        key: `cpl_${cpl}`,
      } as AssessmentColumn);
    });

    // Add percentage column
    columns.push({
      title: (
        <div
          className={`font-semibold text-center ${
            isMobile ? "text-sm" : "text-base"
          }`}
        >
          Persentase
        </div>
      ),
      dataIndex: "persentase",
      key: "persentase",
      width: isMobile ? 80 : 100,
      className: "text-center",
      onHeaderCell: () => ({
        style: {
          textAlign: "center",
          fontWeight: "600",
          fontSize: isMobile ? "12px" : "14px",
        },
        className: "bg-gray-100",
      }),
      onCell: (record) => ({
        style: {
          textAlign: "center",
          fontWeight: "600",
        },
        className: record.key === "presentase" ? "bg-gray-50" : "bg-white",
      }),
      render: (value: number, record: any) => {
        const isTotal = record.key === "presentase";
        const isComplete = value === 100;

        return (
          <div
            className={`text-center font-semibold py-1 rounded ${
              isMobile ? "text-xs" : "text-sm"
            } ${
              isTotal
                ? isComplete
                  ? "text-green-700 bg-green-100"
                  : "text-red-600 bg-red-100"
                : "text-gray-800"
            }`}
          >
            {value}%
          </div>
        );
      },
    });

    return columns;
  };

  const buildDataSource = () => {
    const data: any[] = [];

    // Build assessment type rows
    assessmentTypes.forEach((assessmentType) => {
      const row: any = {
        key: assessmentType,
        bentuk:
          assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1),
      };

      let totalForType = 0;
      relatedCPL.forEach((cpl) => {
        const relatedCPMK = getRelatedCPMK(cpl);
        relatedCPMK.forEach((cpmk) => {
          const relatedSubCPMK = getRelatedSubCPMK(cpmk);

          if (hasSubCPMKData && relatedSubCPMK.length > 0) {
            // Sub-CPMK mode
            relatedSubCPMK.forEach((subCpmk) => {
              const weight =
                //@ts-ignore
                assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                  assessmentType
                ] || 0;
              row[`${cpl}_${cpmk}_${subCpmk}`] = weight;
              totalForType += weight;
            });
          } else {
            // CPMK mode
            const weight =
              //@ts-ignore
              assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
            row[`${cpl}_${cpmk}`] = weight;
            totalForType += weight;
          }
        });
      });
      row.persentase = totalForType;
      data.push(row);
    });

    // Add totals row
    const presentaseRow: any = {
      key: "presentase",
      bentuk: "Presentase",
    };

    let grandTotal = 0;
    relatedCPL.forEach((cpl) => {
      const relatedCPMK = getRelatedCPMK(cpl);
      relatedCPMK.forEach((cpmk) => {
        const relatedSubCPMK = getRelatedSubCPMK(cpmk);

        if (hasSubCPMKData && relatedSubCPMK.length > 0) {
          // Sub-CPMK mode
          relatedSubCPMK.forEach((subCpmk) => {
            const total = assessmentTypes.reduce((sum, type) => {
              return (
                sum +
                //@ts-ignore
                (assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[type] ||
                  0)
              );
            }, 0);
            presentaseRow[`${cpl}_${cpmk}_${subCpmk}`] = total;
          });
        } else {
          // CPMK mode
          const total = assessmentTypes.reduce((sum, type) => {
            //@ts-ignore
            return sum + (assessmentWeights[cpl]?.[cpmk]?.[type] || 0);
          }, 0);
          presentaseRow[`${cpl}_${cpmk}`] = total;
        }
      });
    });

    // Calculate grand total
    grandTotal = assessmentTypes.reduce((sum, type) => {
      return sum + (data.find((item) => item.key === type)?.persentase || 0);
    }, 0);

    presentaseRow.persentase = grandTotal;
    data.push(presentaseRow);

    return data;
  };

  // Mobile Form-based Interface
  const MobileAssessmentForm = () => {
    return (
      <div className="space-y-4">
        <Title level={4} className="mb-4">
          Bobot Penilaian Assessment
        </Title>

        {relatedCPL.map((cpl) => {
          const cplCode = curriculumData?.cpl?.[cpl]?.kode || cpl;
          const relatedCPMK = getRelatedCPMK(cpl);

          if (relatedCPMK.length === 0) return null;

          return (
            <Card key={cpl} title={`CPL: ${cplCode}`} size="small">
              <Collapse accordion>
                {relatedCPMK.map((cpmk) => {
                  const cpmkCode = curriculumData?.cpmk?.[cpmk]?.kode || cpmk;
                  const relatedSubCPMK = getRelatedSubCPMK(cpmk);

                  return (
                    <Panel header={`CPMK: ${cpmkCode}`} key={cpmk}>
                      {hasSubCPMKData && relatedSubCPMK.length > 0 ? (
                        // Sub-CPMK Mode
                        <div className="space-y-4">
                          {relatedSubCPMK.map((subCpmk) => {
                            const subCpmkCode =
                              curriculumData?.subcpmk?.[subCpmk]?.kode ||
                              subCpmk;

                            return (
                              <div
                                key={subCpmk}
                                className="p-3 bg-gray-50 rounded"
                              >
                                <Text strong className="block mb-2 text-sm">
                                  Sub-CPMK: {subCpmkCode}
                                </Text>
                                <Row gutter={[8, 8]}>
                                  {assessmentTypes.map((assessmentType) => {
                                    const weight =
                                      //@ts-ignore
                                      assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                        subCpmk
                                      ]?.[assessmentType] || 0;

                                    return (
                                      <Col span={12} key={assessmentType}>
                                        <div className="space-y-1">
                                          <Text className="text-xs text-gray-600">
                                            {assessmentType
                                              .charAt(0)
                                              .toUpperCase() +
                                              assessmentType.slice(1)}
                                          </Text>
                                          <Input
                                            type="number"
                                            value={weight}
                                            onChange={(e) =>
                                              updateAssessmentWeight(
                                                cpl,
                                                cpmk,
                                                assessmentType,
                                                Number(e.target.value) || 0,
                                                subCpmk
                                              )
                                            }
                                            min={0}
                                            max={100}
                                            size="small"
                                            suffix="%"
                                            className="bg-yellow-300"
                                            style={{
                                              backgroundColor: "#fde047",
                                            }}
                                          />
                                        </div>
                                      </Col>
                                    );
                                  })}
                                </Row>
                                <Divider style={{ margin: "8px 0" }} />
                                <div className="flex justify-between text-xs">
                                  <Text type="secondary">Total:</Text>
                                  <Text strong>
                                    {assessmentTypes.reduce((sum, type) => {
                                      return (
                                        sum +
                                        //@ts-ignore
                                        (assessmentWeights[cpl]?.[cpmk]
                                          ?.subcpmk?.[subCpmk]?.[type] || 0)
                                      );
                                    }, 0)}
                                    %
                                  </Text>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Direct CPMK Mode
                        <div className="space-y-3">
                          <Row gutter={[8, 8]}>
                            {assessmentTypes.map((assessmentType) => {
                              const weight =
                                //@ts-ignore
                                assessmentWeights[cpl]?.[cpmk]?.[
                                  assessmentType
                                ] || 0;

                              return (
                                <Col span={12} key={assessmentType}>
                                  <div className="space-y-1">
                                    <Text className="text-xs text-gray-600">
                                      {assessmentType.charAt(0).toUpperCase() +
                                        assessmentType.slice(1)}
                                    </Text>
                                    <Input
                                      type="number"
                                      value={weight}
                                      onChange={(e) =>
                                        updateAssessmentWeight(
                                          cpl,
                                          cpmk,
                                          assessmentType,
                                          Number(e.target.value) || 0
                                        )
                                      }
                                      min={0}
                                      max={100}
                                      size="small"
                                      suffix="%"
                                      className="bg-yellow-300"
                                      style={{ backgroundColor: "#fde047" }}
                                    />
                                  </div>
                                </Col>
                              );
                            })}
                          </Row>
                          <Divider style={{ margin: "8px 0" }} />
                          <div className="flex justify-between text-xs">
                            <Text type="secondary">Total:</Text>
                            <Text strong>
                              {assessmentTypes.reduce((sum, type) => {
                                //@ts-ignore
                                return (
                                  sum +
                                  (assessmentWeights[cpl]?.[cpmk]?.[type] || 0)
                                );
                              }, 0)}
                              %
                            </Text>
                          </div>
                        </div>
                      )}
                    </Panel>
                  );
                })}
              </Collapse>
            </Card>
          );
        })}

        {/* Mobile Total Summary */}
        <Card title="Ringkasan Total" size="small">
          <div className="space-y-2">
            {assessmentTypes.map((assessmentType) => {
              let totalForType = 0;
              relatedCPL.forEach((cpl) => {
                const relatedCPMK = getRelatedCPMK(cpl);
                relatedCPMK.forEach((cpmk) => {
                  const relatedSubCPMK = getRelatedSubCPMK(cpmk);

                  if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                    relatedSubCPMK.forEach((subCpmk) => {
                      const weight =
                        //@ts-ignore
                        assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[subCpmk]?.[
                          assessmentType
                        ] || 0;
                      totalForType += weight;
                    });
                  } else {
                    const weight =
                      //@ts-ignore
                      assessmentWeights[cpl]?.[cpmk]?.[assessmentType] || 0;
                    totalForType += weight;
                  }
                });
              });

              return (
                <div key={assessmentType} className="flex justify-between py-1">
                  <Text>
                    {assessmentType.charAt(0).toUpperCase() +
                      assessmentType.slice(1)}
                    :
                  </Text>
                  <Text strong>{totalForType}%</Text>
                </div>
              );
            })}
            <Divider style={{ margin: "8px 0" }} />
            <div className="flex justify-between py-1">
              <Text strong>Total Keseluruhan:</Text>
              <Text
                strong
                className={
                  assessmentTypes.reduce((sum, type) => {
                    let totalForType = 0;
                    relatedCPL.forEach((cpl) => {
                      const relatedCPMK = getRelatedCPMK(cpl);
                      relatedCPMK.forEach((cpmk) => {
                        const relatedSubCPMK = getRelatedSubCPMK(cpmk);
                        if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                          relatedSubCPMK.forEach((subCpmk) => {
                            const weight =
                              //@ts-ignore
                              assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                                subCpmk
                              ]?.[type] || 0;
                            totalForType += weight;
                          });
                        } else {
                          const weight =
                            //@ts-ignore
                            assessmentWeights[cpl]?.[cpmk]?.[type] || 0;
                          totalForType += weight;
                        }
                      });
                    });
                    return sum + totalForType;
                  }, 0) === 100
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {assessmentTypes.reduce((sum, type) => {
                  let totalForType = 0;
                  relatedCPL.forEach((cpl) => {
                    const relatedCPMK = getRelatedCPMK(cpl);
                    relatedCPMK.forEach((cpmk) => {
                      const relatedSubCPMK = getRelatedSubCPMK(cpmk);
                      if (hasSubCPMKData && relatedSubCPMK.length > 0) {
                        relatedSubCPMK.forEach((subCpmk) => {
                          const weight =
                            //@ts-ignore
                            assessmentWeights[cpl]?.[cpmk]?.subcpmk?.[
                              subCpmk
                            ]?.[type] || 0;
                          totalForType += weight;
                        });
                      } else {
                        const weight =
                          //@ts-ignore
                          assessmentWeights[cpl]?.[cpmk]?.[type] || 0;
                        totalForType += weight;
                      }
                    });
                  });
                  return sum + totalForType;
                }, 0)}
                %
              </Text>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full">
      {isMobile ? (
        <MobileAssessmentForm />
      ) : (
        <Table
          columns={buildColumns()}
          dataSource={buildDataSource()}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: "max-content" }}
          className="w-full"
        />
      )}
    </div>
  );
};
