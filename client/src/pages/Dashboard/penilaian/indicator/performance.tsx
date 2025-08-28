import React from "react";
import { Card, Table } from "antd";
import { getPerformanceIndicator } from "../helper";

export const PerformanceIndicatorTable: React.FC = () => {
  const indicatorData = [
    { batas: "76,25", nilai: 4, label: "Sangat Menguasai" },
    { batas: "65", nilai: 3, label: "Menguasai" },
    { batas: "51,25", nilai: 2, label: "Cukup Menguasai" },
    { batas: "40", nilai: 1, label: "Kurang Menguasai" },
    { batas: "0", nilai: 0, label: "Tidak Menguasai" },
  ];

  const columns = [
    {
      title: "Batas",
      dataIndex: "batas",
      key: "batas",
      align: "center" as const,
      width: 80,
    },
    {
      title: "Nilai",
      dataIndex: "nilai",
      key: "nilai",
      align: "center" as const,
      width: 60,
      render: (nilai: number) => {
        const indicator = getPerformanceIndicator(
          nilai === 4
            ? 80
            : nilai === 3
            ? 70
            : nilai === 2
            ? 55
            : nilai === 1
            ? 45
            : 0
        );
        return (
          <div
            className="font-bold text-white px-2 py-1 rounded mx-auto inline-block"
            style={{ backgroundColor: indicator.color }}
          >
            {nilai}
          </div>
        );
      },
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (label: string, record: any) => {
        const indicator = getPerformanceIndicator(
          record.nilai === 4
            ? 80
            : record.nilai === 3
            ? 70
            : record.nilai === 2
            ? 55
            : record.nilai === 1
            ? 45
            : 0
        );
        return (
          <span style={{ color: indicator.color, fontWeight: "medium" }}>
            {label}
          </span>
        );
      },
    },
  ];

  return (
    <Card title="Indikator Penguasaan Materi" size="small">
      <Table
        dataSource={indicatorData}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowKey="nilai"
        className="performance-indicator-table"
      />
    </Card>
  );
};
