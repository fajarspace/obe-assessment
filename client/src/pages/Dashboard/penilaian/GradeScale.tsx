// components/GradeScale.tsx
import React from "react";
import { Card, Table } from "antd";
import { GRADE_SCALE } from "./helper";

export const GradeScale: React.FC = () => {
  const columns = [
    {
      title: "Nilai",
      dataIndex: "nilaiMutu",
      key: "nilai",
      align: "center" as const,
      render: (nilaiMutu: string, record: any) => (
        <div>
          <div className="font-bold text-base">{nilaiMutu}</div>
          <div className="text-xs text-gray-500">
            {record.nilaiAngka.min} - {record.nilaiAngka.max}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "kelulusan",
      key: "kelulusan",
      align: "center" as const,
      render: (kelulusan: string) => (
        <div
          className={`px-3 py-1 rounded text-white font-semibold inline-block ${
            kelulusan === "Lulus" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {kelulusan}
        </div>
      ),
    },
  ];

  return (
    <Card title="Skala Nilai" size="small">
      <Table
        dataSource={GRADE_SCALE}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        rowKey="nilaiMutu"
        className="grade-scale-table"
      />
    </Card>
  );
};
