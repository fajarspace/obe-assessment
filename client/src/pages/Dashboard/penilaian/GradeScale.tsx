// components/GradeScale.tsx
import React from "react";
import { Card, Row, Col, Tag } from "antd";
import { GRADE_SCALE } from "./helper";

export const GradeScale: React.FC = () => {
  return (
    <Card title="Nilai Angka" size="small">
      <Row gutter={[8, 8]}>
        {GRADE_SCALE.map((grade, index) => (
          <Col xs={12} sm={8} md={6} lg={4} key={index}>
            <div className="p-3 border rounded-lg text-center">
              <div className="font-bold text-lg">{grade.nilaiMutu}</div>
              <div className="text-sm text-gray-600">
                {grade.nilaiAngka.min}-{grade.nilaiAngka.max}
              </div>
              <Tag
                color={grade.kelulusan === "Lulus" ? "green" : "red"}
                className="text-xs"
              >
                {grade.kelulusan}
              </Tag>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};
