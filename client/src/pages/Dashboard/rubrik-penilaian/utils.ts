// utils/assessment.utils.ts
import type {
  Student,
  CPMKData,
  MKData,
  AssessmentWeights,
  SubCPMKPercentages,
  CPMKPercentages,
  GradeScale,
  CPMKScale,
} from "./interfaces";

// Grade scale matching example
export const GRADE_SCALE: GradeScale[] = [
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
export const CPMK_SCALE: CPMKScale[] = [
  { min: 85, max: 100, level: "Sangat Baik", point: 4 },
  { min: 70, max: 84, level: "Baik", point: 3 },
  { min: 55, max: 69, level: "Cukup", point: 2 },
  { min: 40, max: 54, level: "Kurang", point: 1 },
  { min: 0, max: 39, level: "Sangat Kurang", point: 0 },
];

// Default students data
export const DEFAULT_STUDENTS: Student[] = [
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

export const getGrade = (score: number): GradeScale => {
  const grade = GRADE_SCALE.find((g) => score >= g.min && score <= g.max);
  return grade || GRADE_SCALE[GRADE_SCALE.length - 1];
};

export const getCPMKLevel = (score: number): CPMKScale => {
  const level = CPMK_SCALE.find((l) => score >= l.min && score <= l.max);
  return level || CPMK_SCALE[CPMK_SCALE.length - 1];
};

// NEW: Calculate CPMK percentage automatically based on assessment weights
export const calculateCPMKPercentageFromWeights = (
  mkData: MKData,
  assessmentWeights: AssessmentWeights
): CPMKPercentages => {
  const cpmkPercentages: CPMKPercentages = {};

  if (!mkData.cpmk) return cpmkPercentages;

  // First, calculate total assessment weight for each CPMK
  const cpmkTotalWeights: Record<string, number> = {};

  mkData.cpmk.forEach((cpmk) => {
    const primaryCplCode =
      cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0
        ? cpmk.cpl[0].kode
        : cpmk.cpl && !Array.isArray(cpmk.cpl)
        ? (cpmk.cpl as any).kode
        : `No_CPL_${cpmk.kode}`;

    let totalWeight = 0;

    if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
      // Sum all subcpmk weights for this CPMK
      cpmk.subcpmk.forEach((subcpmk) => {
        const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${primaryCplCode}`;
        const weights = assessmentWeights[uniqueKey] || {
          tugas: 0,
          kuis: 0,
          uts: 0,
          uas: 0,
        };
        totalWeight += weights.tugas + weights.kuis + weights.uts + weights.uas;
      });
    } else {
      // Direct CPMK weight
      const uniqueKey = `${cpmk.kode}_${primaryCplCode}`;
      const weights = assessmentWeights[uniqueKey] || {
        tugas: 0,
        kuis: 0,
        uts: 0,
        uas: 0,
      };
      totalWeight = weights.tugas + weights.kuis + weights.uts + weights.uas;
    }

    cpmkTotalWeights[cpmk.kode] = totalWeight;
  });

  // Calculate total weight across all CPMKs
  const grandTotalWeight = Object.values(cpmkTotalWeights).reduce(
    (sum, weight) => sum + weight,
    0
  );

  // Calculate percentage for each CPMK based on its proportion of total weight
  if (grandTotalWeight > 0) {
    mkData.cpmk.forEach((cpmk) => {
      const cpmkWeight = cpmkTotalWeights[cpmk.kode] || 0;
      cpmkPercentages[cpmk.kode] =
        Math.round((cpmkWeight / grandTotalWeight) * 100 * 100) / 100; // Round to 2 decimal places
    });
  } else {
    // If no weights are set, distribute equally
    const equalPercentage =
      mkData.cpmk.length > 0 ? 100 / mkData.cpmk.length : 0;
    mkData.cpmk.forEach((cpmk) => {
      cpmkPercentages[cpmk.kode] = Math.round(equalPercentage * 100) / 100;
    });
  }

  return cpmkPercentages;
};

// NEW: Calculate SubCPMK percentage automatically based on assessment weights within each CPMK
export const calculateSubCPMKPercentageFromWeights = (
  mkData: MKData,
  assessmentWeights: AssessmentWeights
): SubCPMKPercentages => {
  const subcpmkPercentages: SubCPMKPercentages = {};

  if (!mkData.cpmk) return subcpmkPercentages;

  mkData.cpmk.forEach((cpmk) => {
    if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
      const primaryCplCode =
        cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0
          ? cpmk.cpl[0].kode
          : cpmk.cpl && !Array.isArray(cpmk.cpl)
          ? (cpmk.cpl as any).kode
          : `No_CPL_${cpmk.kode}`;

      // Calculate total weight for all subcpmks in this CPMK
      let totalCpmkWeight = 0;
      const subcpmkWeights: Record<string, number> = {};

      cpmk.subcpmk.forEach((subcpmk) => {
        const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${primaryCplCode}`;
        const weights = assessmentWeights[uniqueKey] || {
          tugas: 0,
          kuis: 0,
          uts: 0,
          uas: 0,
        };
        const weight = weights.tugas + weights.kuis + weights.uts + weights.uas;
        subcpmkWeights[uniqueKey] = weight;
        totalCpmkWeight += weight;
      });

      // Distribute percentage based on weight proportion within this CPMK
      if (totalCpmkWeight > 0) {
        cpmk.subcpmk.forEach((subcpmk) => {
          const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${primaryCplCode}`;
          const weight = subcpmkWeights[uniqueKey];
          subcpmkPercentages[uniqueKey] =
            Math.round((weight / totalCpmkWeight) * 100 * 100) / 100;
        });
      } else {
        // If no weights are set, distribute equally among subcpmks
        const equalPercentage = 100 / cpmk.subcpmk.length;
        cpmk.subcpmk.forEach((subcpmk) => {
          const uniqueKey = `${subcpmk.kode}_${cpmk.kode}_${primaryCplCode}`;
          subcpmkPercentages[uniqueKey] =
            Math.round(equalPercentage * 100) / 100;
        });
      }
    }
  });

  return subcpmkPercentages;
};

export const initializeWeights = (mkData: MKData) => {
  const weights: AssessmentWeights = {};
  const cpmkPercentages: CPMKPercentages = {};
  const subcpmkPercentages: SubCPMKPercentages = {};

  if (mkData.cpmk) {
    mkData.cpmk.forEach((cpmk) => {
      cpmkPercentages[cpmk.kode] = 0;

      // Get all CPL codes for this CPMK (create entry for each CPL)
      const allCplCodes =
        cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0
          ? cpmk.cpl.map((cpl) => cpl.kode)
          : cpmk.cpl && !Array.isArray(cpmk.cpl)
          ? [(cpmk.cpl as any).kode]
          : [`No_CPL_${cpmk.kode}`];

      // Create entries for all CPL combinations
      allCplCodes.forEach((cplCode) => {
        if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
          cpmk.subcpmk.forEach((subcpmk) => {
            const uniqueSubcpmkKey = `${subcpmk.kode}_${cpmk.kode}_${cplCode}`;
            weights[uniqueSubcpmkKey] = { tugas: 0, kuis: 0, uts: 0, uas: 0 };
            subcpmkPercentages[uniqueSubcpmkKey] = 0;
          });
        } else {
          const uniqueCpmkKey = `${cpmk.kode}_${cplCode}`;
          weights[uniqueCpmkKey] = { tugas: 0, kuis: 0, uts: 0, uas: 0 };
        }
      });
    });
  }

  return { weights, cpmkPercentages, subcpmkPercentages };
};

export const calculateCPMKScore = (
  student: Student,
  cpmkIdentifier: string,
  selectedMK: MKData | null,
  assessmentWeights: AssessmentWeights,
  subcpmkPercentages: SubCPMKPercentages
): number => {
  if (!selectedMK?.cpmk) return 0;

  // Find the target CPMK
  const targetCpmk = selectedMK.cpmk.find((c) => c.kode === cpmkIdentifier);
  if (!targetCpmk) return 0;

  // Get primary CPL code for this CPMK (use first CPL for consistent key generation)
  const primaryCplCode =
    targetCpmk.cpl && Array.isArray(targetCpmk.cpl) && targetCpmk.cpl.length > 0
      ? targetCpmk.cpl[0].kode
      : targetCpmk.cpl && !Array.isArray(targetCpmk.cpl)
      ? (targetCpmk.cpl as any).kode
      : `No_CPL_${targetCpmk.kode}`;

  if (targetCpmk.subcpmk && targetCpmk.subcpmk.length > 0) {
    let totalScore = 0;
    let totalWeight = 0;

    // For SubCPMK: use weight-based proportional scoring
    targetCpmk.subcpmk.forEach((subcpmk) => {
      const uniqueSubcpmkKey = `${subcpmk.kode}_${targetCpmk.kode}_${primaryCplCode}`;
      const weights = assessmentWeights[uniqueSubcpmkKey] || {
        tugas: 0,
        kuis: 0,
        uts: 0,
        uas: 0,
      };

      // Calculate subcpmk score using weighted assessment scores
      const subcpmkScore =
        student.tugas * (weights.tugas / 100) +
        student.kuis * (weights.kuis / 100) +
        student.uts * (weights.uts / 100) +
        student.uas * (weights.uas / 100);

      const subcpmkWeight =
        weights.tugas + weights.kuis + weights.uts + weights.uas;

      if (subcpmkWeight > 0) {
        totalScore += subcpmkScore;
        totalWeight += subcpmkWeight / 100;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore * 100) / 100 : 0;
  } else {
    // For direct CPMK without SubCPMK: use the main assessment scores
    const uniqueCpmkKey = `${targetCpmk.kode}_${primaryCplCode}`;
    const weights = assessmentWeights[uniqueCpmkKey] || {
      tugas: 0,
      kuis: 0,
      uts: 0,
      uas: 0,
    };

    const cpmkScore =
      student.tugas * (weights.tugas / 100) +
      student.kuis * (weights.kuis / 100) +
      student.uts * (weights.uts / 100) +
      student.uas * (weights.uas / 100);

    const cpmkWeight = weights.tugas + weights.kuis + weights.uts + weights.uas;

    return cpmkWeight > 0 ? Math.round(cpmkScore * 100) / 100 : 0;
  }
};

// FIXED: Corrected final score calculation
export const calculateFinalScore = (
  student: Student,
  selectedMK: MKData | null,
  assessmentWeights: AssessmentWeights,
  subcpmkPercentages: SubCPMKPercentages
): number => {
  if (!selectedMK?.cpmk || selectedMK.cpmk.length === 0) return 0;

  // Use direct assessment-based calculation instead of CPMK intermediary
  // This ensures the final score is the weighted sum of assessments based on their configured percentages

  let finalScore = 0;

  // Get total weights for each assessment type
  const totalTugasWeight = calculateAssessmentTotal(
    "tugas",
    selectedMK,
    assessmentWeights
  );
  const totalKuisWeight = calculateAssessmentTotal(
    "kuis",
    selectedMK,
    assessmentWeights
  );
  const totalUtsWeight = calculateAssessmentTotal(
    "uts",
    selectedMK,
    assessmentWeights
  );
  const totalUasWeight = calculateAssessmentTotal(
    "uas",
    selectedMK,
    assessmentWeights
  );

  // Calculate final score as direct weighted sum of assessments
  finalScore =
    (student.tugas * totalTugasWeight) / 100 +
    (student.kuis * totalKuisWeight) / 100 +
    (student.uts * totalUtsWeight) / 100 +
    (student.uas * totalUasWeight) / 100;

  return Math.round(finalScore * 100) / 100;
};

export const groupCPMKByCPL = (selectedMK: MKData | null) => {
  if (!selectedMK?.cpmk) return {};
  const groups: Record<string, CPMKData[]> = {};

  selectedMK.cpmk.forEach((cpmk) => {
    // Handle multiple CPLs - show all CPLs in headers but avoid duplicate CPMK calculations
    if (cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0) {
      cpmk.cpl.forEach((cpl, index) => {
        const cplCode = cpl.kode;
        if (!groups[cplCode]) groups[cplCode] = [];

        // Add CPMK to each CPL group, but mark which is primary for calculations
        const cpmkForThisCPL = {
          ...cpmk,
          _cplContext: cplCode,
          _isPrimaryForCalculation: index === 0, // Only first CPL is used for calculations
          _primaryCplCode: cpmk.cpl[0].kode, // Always reference the primary CPL for unique keys
          subcpmk: cpmk.subcpmk?.map((sub) => ({
            ...sub,
            // Always use primary CPL for unique key generation
            _uniqueKey: `${sub.kode}_${cpmk.kode}_${cpmk.cpl[0].kode}`,
            _displayKey: `${sub.kode}_${cpmk.kode}_${cplCode}`, // For display purposes
          })),
        };

        groups[cplCode].push(cpmkForThisCPL);
      });
    } else if (cpmk.cpl && !Array.isArray(cpmk.cpl)) {
      // Handle single CPL object (legacy format)
      const cplCode = (cpmk.cpl as any).kode;
      if (!groups[cplCode]) groups[cplCode] = [];
      groups[cplCode].push({
        ...cpmk,
        _cplContext: cplCode,
        _isPrimaryForCalculation: true,
        _primaryCplCode: cplCode,
      });
    } else {
      // Fallback for CPMK without CPL association
      const fallbackCplCode = `No_CPL_${cpmk.kode}`;
      if (!groups[fallbackCplCode]) groups[fallbackCplCode] = [];
      groups[fallbackCplCode].push({
        ...cpmk,
        _cplContext: fallbackCplCode,
        _isPrimaryForCalculation: true,
        _primaryCplCode: fallbackCplCode,
      });
    }
  });

  return groups;
};

// Calculate assessment total by summing all SubCPMK/CPMK contributions across ALL CPLs
export const calculateAssessmentTotal = (
  assessmentType: string,
  selectedMK: MKData | null,
  assessmentWeights: AssessmentWeights
): number => {
  let total = 0;
  if (!selectedMK?.cpmk) return 0;

  selectedMK.cpmk.forEach((cpmk) => {
    // Get ALL CPL codes for this CPMK to include all combinations
    const allCplCodes =
      cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0
        ? cpmk.cpl.map((cpl) => cpl.kode)
        : cpmk.cpl && !Array.isArray(cpmk.cpl)
        ? [(cpmk.cpl as any).kode]
        : [`No_CPL_${cpmk.kode}`];

    if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
      // For SubCPMK: sum from all CPL combinations
      cpmk.subcpmk.forEach((subcpmk) => {
        allCplCodes.forEach((cplCode) => {
          const uniqueSubcpmkKey = `${subcpmk.kode}_${cpmk.kode}_${cplCode}`;
          const weight =
            assessmentWeights[uniqueSubcpmkKey]?.[
              assessmentType as keyof AssessmentWeights[string]
            ] || 0;
          total += weight;
        });
      });
    } else {
      // For direct CPMK: sum from all CPL combinations
      allCplCodes.forEach((cplCode) => {
        const uniqueCpmkKey = `${cpmk.kode}_${cplCode}`;
        const weight =
          assessmentWeights[uniqueCpmkKey]?.[
            assessmentType as keyof AssessmentWeights[string]
          ] || 0;
        total += weight;
      });
    }
  });

  return Math.round(total * 100) / 100;
};

export const hasAssessmentWeights = (
  codeKey: string,
  assessmentWeights: AssessmentWeights
): boolean => {
  const weights = assessmentWeights[codeKey];
  if (!weights) return false;
  return (
    weights.tugas > 0 || weights.kuis > 0 || weights.uts > 0 || weights.uas > 0
  );
};

export const getActiveCPMKs = (
  selectedMK: MKData | null,
  assessmentWeights: AssessmentWeights
): CPMKData[] => {
  if (!selectedMK?.cpmk) return [];
  return selectedMK.cpmk.filter((cpmk) => {
    // Determine primary CPL (same logic as in initializeWeights)
    const primaryCplCode =
      cpmk.cpl && Array.isArray(cpmk.cpl) && cpmk.cpl.length > 0
        ? cpmk.cpl[0].kode
        : cpmk.cpl && !Array.isArray(cpmk.cpl)
        ? (cpmk.cpl as any).kode
        : `No_CPL_${cpmk.kode}`;

    if (cpmk.subcpmk && cpmk.subcpmk.length > 0) {
      return cpmk.subcpmk.some((subcpmk) => {
        const uniqueSubcpmkKey = `${subcpmk.kode}_${cpmk.kode}_${primaryCplCode}`;
        return hasAssessmentWeights(uniqueSubcpmkKey, assessmentWeights);
      });
    } else {
      const uniqueCpmkKey = `${cpmk.kode}_${primaryCplCode}`;
      return hasAssessmentWeights(uniqueCpmkKey, assessmentWeights);
    }
  });
};
// ... (keep existing GRADE_SCALE, CPMK_SCALE, DEFAULT_STUDENTS, etc.)

// NEW: Calculate combined percentage for CPMK header from its SubCPMK weights
export const calculateCPMKCombinedPercentage = (
  cpmk: CPMKData,
  cplCode: string,
  assessmentWeights: AssessmentWeights
): number => {
  if (!cpmk.subcpmk || cpmk.subcpmk.length === 0) {
    // For direct CPMK, return the total assessment weight
    const uniqueKey = `${cpmk.kode}_${cplCode}`;
    const weights = assessmentWeights[uniqueKey] || {
      tugas: 0,
      kuis: 0,
      uts: 0,
      uas: 0,
    };
    return weights.tugas + weights.kuis + weights.uts + weights.uas;
  }

  // For CPMK with SubCPMK, sum all SubCPMK weights
  let totalPercentage = 0;
  cpmk.subcpmk.forEach((subcpmk) => {
    const uniqueSubcpmkKey = `${subcpmk.kode}_${cpmk.kode}_${cplCode}`;
    const weights = assessmentWeights[uniqueSubcpmkKey] || {
      tugas: 0,
      kuis: 0,
      uts: 0,
      uas: 0,
    };
    totalPercentage += weights.tugas + weights.kuis + weights.uts + weights.uas;
  });

  return Math.round(totalPercentage * 100) / 100;
};

// NEW: Calculate total percentage for specific assessment type across all SubCPMK in a CPMK
export const calculateCPMKAssessmentPercentage = (
  cpmk: CPMKData,
  cplCode: string,
  assessmentType: string,
  assessmentWeights: AssessmentWeights
): number => {
  if (!cpmk.subcpmk || cpmk.subcpmk.length === 0) {
    // For direct CPMK
    const uniqueKey = `${cpmk.kode}_${cplCode}`;
    const weights = assessmentWeights[uniqueKey] || {
      tugas: 0,
      kuis: 0,
      uts: 0,
      uas: 0,
    };
    return weights[assessmentType as keyof AssessmentWeights[string]] || 0;
  }

  // For CPMK with SubCPMK, sum specific assessment type across all SubCPMK
  let totalAssessmentPercentage = 0;
  cpmk.subcpmk.forEach((subcpmk) => {
    const uniqueSubcpmkKey = `${subcpmk.kode}_${cpmk.kode}_${cplCode}`;
    const weights = assessmentWeights[uniqueSubcpmkKey] || {
      tugas: 0,
      kuis: 0,
      uts: 0,
      uas: 0,
    };
    totalAssessmentPercentage +=
      weights[assessmentType as keyof AssessmentWeights[string]] || 0;
  });

  return Math.round(totalAssessmentPercentage * 100) / 100;
};
