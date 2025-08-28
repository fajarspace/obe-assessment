// components/Assessment/GradeScales.tsx
import React from "react";
import { Card, Table, Tag, Row, Col } from "antd";
import { GRADE_SCALE, CPMK_SCALE } from "./utils";

const GradeScalesComponent: React.FC = () => {
  return (
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
  );
};

export default GradeScalesComponent;
