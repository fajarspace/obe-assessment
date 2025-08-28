// CplInfo.tsx - Tree Layout Structure like the image
import React from "react";
import { Card, Form } from "antd";
import type {
  CourseInfo,
  CurriculumData,
  CPL,
  CPMK,
  SubCPMK,
} from "@/types/interface";

interface Props {
  courseInfo: CourseInfo;
  curriculumData: CurriculumData | null;
  relatedCPL: string[];
  getRelatedCPMK: (cpl: string) => string[];
  getRelatedSubCPMK: (cpmk: string) => string[];
}

export const CplInfo: React.FC<Props> = ({
  courseInfo,
  curriculumData,
  relatedCPL,
  getRelatedCPMK,
  getRelatedSubCPMK,
}) => {
  const [form] = Form.useForm();

  // Initialize form with current course info
  React.useEffect(() => {
    form.setFieldsValue({
      semester: courseInfo.semester,
      year: courseInfo.year,
      lecturer: courseInfo.lecturer,
    });
  }, [courseInfo, form]);

  return (
    <div className="space-y-6">
      {/* Basic Course Information - 4 Column Layout */}

      {/* Tree Structure CPL/CPMK/SubCPMK - Like the image */}
      {relatedCPL.length > 0 && (
        <Card title="Capaian Pembelajaran" size="small">
          <div className="overflow-x-auto">
            {/* Tree Layout Container */}
            <div
              className="inline-flex gap-16 p-4"
              style={{ minWidth: "100%" }}
            >
              {relatedCPL.map((cplCode) => {
                const cplData: CPL | undefined = curriculumData?.cpl?.[cplCode];
                const relatedCPMK = getRelatedCPMK(cplCode);

                return (
                  <div
                    key={cplCode}
                    className="flex flex-col items-center min-w-80"
                  >
                    {/* CPL Level - Top */}
                    <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 mb-8 w-72 text-center">
                      <div className="font-bold text-blue-800 text-lg mb-2">
                        {cplData?.kode || cplCode}
                      </div>
                      <div className="text-sm text-blue-700 leading-relaxed">
                        {cplData?.description ||
                          cplData?.deskripsi ||
                          "Deskripsi tidak tersedia"}
                      </div>
                    </div>

                    {/* Connection Line */}
                    {relatedCPMK.length > 0 && (
                      <div className="w-0.5 h-8 bg-gray-400 mb-8"></div>
                    )}

                    {/* CPMK Level - Middle */}
                    <div className="flex flex-wrap justify-center gap-4 mb-8">
                      {relatedCPMK.map((cpmkCode) => {
                        const cpmkData: CPMK | undefined =
                          curriculumData?.cpmk?.[cpmkCode];
                        const relatedSubCPMK = getRelatedSubCPMK(cpmkCode);

                        return (
                          <div
                            key={cpmkCode}
                            className="flex flex-col items-center"
                          >
                            {/* CPMK Box */}
                            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-3 mb-6 w-48 text-center">
                              <div className="font-bold text-green-800 mb-2">
                                {cpmkData?.kode || cpmkCode}
                              </div>
                              <div className="text-xs text-green-700 leading-relaxed">
                                {cpmkData?.description ||
                                  cpmkData?.deskripsi ||
                                  "Deskripsi tidak tersedia"}
                              </div>
                            </div>

                            {/* Connection Line to SubCPMK */}
                            {relatedSubCPMK.length > 0 && (
                              <div className="w-0.5 h-6 bg-gray-400 mb-4"></div>
                            )}

                            {/* SubCPMK Level - Bottom */}
                            <div className="space-y-3">
                              {relatedSubCPMK.map((subCpmkCode) => {
                                const subCpmkData: SubCPMK | undefined =
                                  curriculumData?.subcpmk?.[subCpmkCode];

                                return (
                                  <div
                                    key={subCpmkCode}
                                    className="bg-cyan-100 border-2 border-cyan-400 rounded-lg p-3 w-44 text-center"
                                  >
                                    <div className="font-semibold text-cyan-800 mb-2 text-sm">
                                      {subCpmkData?.kode || subCpmkCode}
                                    </div>
                                    <div className="text-xs text-cyan-700 leading-relaxed">
                                      {subCpmkData?.description ||
                                        subCpmkData?.deskripsi ||
                                        "Deskripsi tidak tersedia"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t mt-6 pt-4">
            <div className="flex justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
                <span>CPL (Capaian Pembelajaran Lulusan)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                <span>CPMK (Capaian Pembelajaran Mata Kuliah)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-cyan-100 border-2 border-cyan-400 rounded"></div>
                <span>Sub-CPMK</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
