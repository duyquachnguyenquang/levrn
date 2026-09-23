import {
  CourseGrade,
  GradeComponent,
  LetterGrade,
  SemesterGPASummary,
  CumulativeGPASummary,
} from "./types";

/**
 * Quy đổi điểm hệ 10 sang hệ 4 (Chuẩn Bộ GD&ĐT Việt Nam)
 */
export function score10ToScore4(score: number | null | undefined): number {
  if (score === null || score === undefined || isNaN(score)) return 0;
  if (score >= 8.5) return 4.0;
  if (score >= 8.0) return 3.5;
  if (score >= 7.0) return 3.0;
  if (score >= 6.5) return 2.5;
  if (score >= 5.5) return 2.0;
  if (score >= 5.0) return 1.5;
  if (score >= 4.0) return 1.0;
  return 0.0;
}

/**
 * Quy đổi điểm hệ 10 sang Điểm chữ (A, B+, B, C+, C, D+, D, F)
 */
export function score10ToLetter(score: number | null | undefined): LetterGrade {
  if (score === null || score === undefined || isNaN(score)) return "F";
  if (score >= 8.5) return "A";
  if (score >= 8.0) return "B+";
  if (score >= 7.0) return "B";
  if (score >= 6.5) return "C+";
  if (score >= 5.5) return "C";
  if (score >= 5.0) return "D+";
  if (score >= 4.0) return "D";
  return "F";
}

/**
 * Xếp loại học lực theo thang điểm 4.0
 */
export function score4ToAcademicStanding(gpa4: number): string {
  if (gpa4 <= 0) return "Chưa xếp loại";
  if (gpa4 >= 3.6) return "Xuất sắc";
  if (gpa4 >= 3.2) return "Giỏi";
  if (gpa4 >= 2.5) return "Khá";
  if (gpa4 >= 2.0) return "Trung bình";
  if (gpa4 >= 1.0) return "Yếu";
  return "Kém";
}

/**
 * Màu sắc & Badge tương ứng với từng điểm chữ
 */
export function getLetterGradeStyle(letter: LetterGrade): {
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
} {
  switch (letter) {
    case "A":
      return {
        bg: "rgba(16, 185, 129, 0.15)",
        text: "#10B981",
        border: "rgba(16, 185, 129, 0.35)",
        badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
      };
    case "B+":
      return {
        bg: "rgba(6, 182, 212, 0.15)",
        text: "#06B6D4",
        border: "rgba(6, 182, 212, 0.35)",
        badgeClass: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
      };
    case "B":
      return {
        bg: "rgba(59, 130, 246, 0.15)",
        text: "#3B82F6",
        border: "rgba(59, 130, 246, 0.35)",
        badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
      };
    case "C+":
    case "C":
      return {
        bg: "rgba(245, 158, 11, 0.15)",
        text: "#F59E0B",
        border: "rgba(245, 158, 11, 0.35)",
        badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      };
    case "D+":
    case "D":
      return {
        bg: "rgba(249, 115, 22, 0.15)",
        text: "#F97316",
        border: "rgba(249, 115, 22, 0.35)",
        badgeClass: "bg-orange-500/15 text-orange-500 border-orange-500/30",
      };
    case "F":
      return {
        bg: "rgba(239, 68, 68, 0.15)",
        text: "#EF4444",
        border: "rgba(239, 68, 68, 0.35)",
        badgeClass: "bg-red-500/15 text-red-500 border-red-500/30",
      };
    case "--":
    default:
      return {
        bg: "rgba(113, 113, 122, 0.15)",
        text: "#71717a",
        border: "rgba(113, 113, 122, 0.35)",
        badgeClass: "bg-muted/60 text-muted-foreground border-border",
      };
  }
}

/**
 * Tính điểm tổng kết từ danh sách các thành phần điểm và tỷ trọng
 */
export function calculateComponentsScore(components: GradeComponent[]): {
  finalScore: number | null;
  totalWeight: number;
  filledWeight: number;
  isComplete: boolean;
} {
  if (!components || components.length === 0) {
    return { finalScore: null, totalWeight: 0, filledWeight: 0, isComplete: false };
  }

  let totalWeight = 0;
  let filledWeight = 0;
  let weightedSum = 0;

  for (const comp of components) {
    const weight = Number(comp.weight) || 0;
    totalWeight += weight;

    if (comp.score !== null && comp.score !== undefined && !isNaN(Number(comp.score))) {
      filledWeight += weight;
      weightedSum += Number(comp.score) * weight;
    }
  }

  if (filledWeight === 0) {
    return {
      finalScore: null,
      totalWeight,
      filledWeight: 0,
      isComplete: false,
    };
  }

  // Nếu đã đủ 100% tỷ trọng và tất cả đều có điểm
  const isComplete = totalWeight === 100 && filledWeight === 100;

  // Tính điểm tổng kết (chuẩn hóa theo 100% nếu đã đủ, hoặc tỷ lệ trên filledWeight nếu đang học dở)
  const finalScore = isComplete
    ? Math.round((weightedSum / 100) * 100) / 100
    : Math.round((weightedSum / filledWeight) * 100) / 100;

  return {
    finalScore,
    totalWeight,
    filledWeight,
    isComplete,
  };
}

/**
 * Bộ mô phỏng điểm thi cuối kỳ (What-If Target Simulator):
 * Tính số điểm cần đạt ở cột điểm chưa có (thường là Cuối kỳ) để đạt được Điểm tổng kết mục tiêu (VD: 8.5 để đạt A)
 */
export interface TargetScoreResult {
  targetLabel: string;       // VD: "Đạt loại A (8.5)", "Đạt loại B+ (8.0)", "Qua môn (4.0)"
  targetScore: number;       // Điểm mục tiêu hệ 10
  requiredScore: number;     // Số điểm cần thi
  isFeasible: boolean;       // Có khả thi không (<= 10)
  isAlreadyAchieved: boolean;// Đã đủ điểm mà không cần thi không (<= 0)
  message: string;
}

export function simulateRequiredExamScores(
  components: GradeComponent[],
  unfilledComponentId?: string
): TargetScoreResult[] {
  if (!components || components.length === 0) return [];

  // Tìm cột điểm cần mô phỏng (chưa nhập điểm, hoặc có tên chứa 'cuối kỳ', 'thi', 'đồ án')
  let targetComp = components.find((c) => c.id === unfilledComponentId);
  if (!targetComp) {
    targetComp = components.find(
      (c) =>
        (c.score === null || c.score === undefined || isNaN(Number(c.score))) &&
        c.weight > 0
    );
  }
  if (!targetComp) {
    // Nếu tất cả đã có điểm, lấy cột điểm cuối cùng có trọng số lớn nhất (thường là thi cuối kỳ)
    targetComp = [...components].sort((a, b) => b.weight - a.weight)[0];
  }

  if (!targetComp || targetComp.weight <= 0) return [];

  // Tính tổng điểm tích lũy từ các cột khác
  let currentAccumulated = 0;

  for (const comp of components) {
    if (comp.id !== targetComp.id) {
      const weight = Number(comp.weight) || 0;
      if (comp.score !== null && comp.score !== undefined && !isNaN(Number(comp.score))) {
        currentAccumulated += Number(comp.score) * weight;
      }
    }
  }

  const examWeight = targetComp.weight;
  const milestones: { label: string; score: number }[] = [
    { label: "Đạt loại A (≥ 8.5)", score: 8.5 },
    { label: "Đạt loại B+ (≥ 8.0)", score: 8.0 },
    { label: "Đạt loại B (≥ 7.0)", score: 7.0 },
    { label: "Đạt loại C (≥ 5.5)", score: 5.5 },
    { label: "Qua môn / Đạt D (≥ 4.0)", score: 4.0 },
  ];

  return milestones.map((m) => {
    // Công thức: (currentAccumulated + requiredScore * examWeight) / 100 = targetScore
    // => requiredScore = (100 * targetScore - currentAccumulated) / examWeight
    const rawRequired = (100 * m.score - currentAccumulated) / examWeight;
    const requiredScore = Math.round(rawRequired * 10) / 10;

    let isFeasible = true;
    let isAlreadyAchieved = false;
    let message = "";

    if (requiredScore <= 0) {
      isAlreadyAchieved = true;
      message = "Đã chắc chắn đạt mục tiêu này bất kể điểm thi!";
    } else if (requiredScore > 10.0) {
      isFeasible = false;
      message = `Cần ${requiredScore}đ (vượt trần 10 điểm, không thể đạt).`;
    } else {
      message = `Cần đạt tối thiểu ${requiredScore} điểm.`;
    }

    return {
      targetLabel: m.label,
      targetScore: m.score,
      requiredScore: Math.max(0, requiredScore),
      isFeasible,
      isAlreadyAchieved,
      message,
    };
  });
}

/**
 * Các cấu trúc mẫu tỷ trọng điểm thành phần phổ biến tại các trường Đại học
 */
export interface GradingPresetTemplate {
  id: string;
  name: string;
  description: string;
  components: Omit<GradeComponent, "id">[];
}

export const GRADING_PRESET_TEMPLATES: GradingPresetTemplate[] = [
  {
    id: "standard_10_30_60",
    name: "Lý thuyết chuẩn (10 - 30 - 60)",
    description: "Chuyên cần 10%, Kiểm tra giữa kỳ 30%, Thi cuối kỳ 60%",
    components: [
      { name: "Chuyên cần & Thái độ", weight: 10, maxScore: 10 },
      { name: "Kiểm tra Giữa kỳ", weight: 30, maxScore: 10 },
      { name: "Thi Cuối kỳ", weight: 60, maxScore: 10 },
    ],
  },
  {
    id: "coursework_40_60",
    name: "Quá trình & Cuối kỳ (40 - 60)",
    description: "Điểm quá trình 40%, Thi kết thúc học phần 60%",
    components: [
      { name: "Điểm Quá trình (Bài tập + Quiz)", weight: 40, maxScore: 10 },
      { name: "Thi Cuối kỳ", weight: 60, maxScore: 10 },
    ],
  },
  {
    id: "project_20_30_50",
    name: "Môn Đồ án / Dự án (20 - 30 - 50)",
    description: "Tiến độ tuần 20%, Báo cáo giữa kỳ 30%, Bảo vệ cuối kỳ 50%",
    components: [
      { name: "Tiến độ hàng tuần", weight: 20, maxScore: 10 },
      { name: "Báo cáo Giữa kỳ", weight: 30, maxScore: 10 },
      { name: "Bảo vệ Đồ án Cuối kỳ", weight: 50, maxScore: 10 },
    ],
  },
  {
    id: "four_tier_10_20_20_50",
    name: "Đánh giá 4 cột (10 - 20 - 20 - 50)",
    description: "Chuyên cần 10%, Bài tập nhóm 20%, Giữa kỳ 20%, Cuối kỳ 50%",
    components: [
      { name: "Chuyên cần", weight: 10, maxScore: 10 },
      { name: "Bài tập lớn / Nhóm", weight: 20, maxScore: 10 },
      { name: "Kiểm tra Giữa kỳ", weight: 20, maxScore: 10 },
      { name: "Thi Cuối kỳ", weight: 50, maxScore: 10 },
    ],
  },
  {
    id: "lab_practice_40_60",
    name: "Thực hành / Phòng Lab (40 - 60)",
    description: "Báo cáo thực hành 40%, Thi tay nghề / Đề án 60%",
    components: [
      { name: "Báo cáo thực hành Lab", weight: 40, maxScore: 10 },
      { name: "Thi thực hành cuối kỳ", weight: 60, maxScore: 10 },
    ],
  },
];

/**
 * Tính toán thống kê GPA của một học kỳ
 */
export function calculateSemesterGPA(
  semesterName: string,
  courses: CourseGrade[]
): SemesterGPASummary {
  const semesterCourses = courses.filter((c) => c.semester === semesterName);
  const totalCourses = semesterCourses.length;

  let totalCredits = 0;
  let earnedCredits = 0;
  let weightedSum10 = 0;
  let weightedSum4 = 0;
  let gradedCredits = 0;

  for (const course of semesterCourses) {
    const credits = course.credits || 0;
    totalCredits += credits;

    // Lấy điểm tổng kết hệ 10
    let score10: number | null = null;
    if (course.gradingMethod === "final_only") {
      score10 = course.finalScore;
    } else {
      // Tính từ components nếu có
      const compCalc = calculateComponentsScore(course.components);
      score10 = course.finalScore ?? compCalc.finalScore;
    }

    if (score10 !== null && score10 !== undefined && !isNaN(score10)) {
      const score4 = score10ToScore4(score10);
      weightedSum10 += score10 * credits;
      weightedSum4 += score4 * credits;
      gradedCredits += credits;

      if (score10 >= 4.0) {
        earnedCredits += credits;
      }
    }
  }

  const gpa10 = gradedCredits > 0 ? Math.round((weightedSum10 / gradedCredits) * 100) / 100 : 0;
  const gpa4 = gradedCredits > 0 ? Math.round((weightedSum4 / gradedCredits) * 100) / 100 : 0;
  const letterGrade = gradedCredits > 0 ? score10ToLetter(gpa10) : "--";
  const academicStanding = gradedCredits > 0 ? score4ToAcademicStanding(gpa4) : "Chưa có điểm";

  return {
    semester: semesterName,
    academicYear: semesterCourses[0]?.academicYear,
    term: semesterCourses[0]?.term,
    totalCourses,
    totalCredits,
    earnedCredits,
    gpa10,
    gpa4,
    letterGrade,
    academicStanding,
    courses: semesterCourses,
  };
}

/**
 * Tính toán thống kê GPA tích lũy toàn bộ các học kỳ
 */
export function calculateCumulativeGPA(courses: CourseGrade[]): CumulativeGPASummary {
  // Nhóm các môn theo học kỳ
  const semesterMap = new Map<string, CourseGrade[]>();
  for (const c of courses) {
    const list = semesterMap.get(c.semester) || [];
    list.push(c);
    semesterMap.set(c.semester, list);
  }

  const semesters: SemesterGPASummary[] = [];
  let totalCredits = 0;
  let earnedCredits = 0;
  let totalWeightedSum10 = 0;
  let totalWeightedSum4 = 0;
  let totalGradedCredits = 0;

  for (const [semName, semCourses] of semesterMap.entries()) {
    const semSummary = calculateSemesterGPA(semName, semCourses);
    semesters.push(semSummary);

    totalCredits += semSummary.totalCredits;
    earnedCredits += semSummary.earnedCredits;
  }

  // Sắp xếp các học kỳ theo thứ tự thời gian
  semesters.sort((a, b) => {
    return a.semester.localeCompare(b.semester, undefined, { numeric: true });
  });

  // Tính GPA tích lũy toàn khóa
  for (const course of courses) {
    const credits = course.credits || 0;
    let score10: number | null = null;
    if (course.gradingMethod === "final_only") {
      score10 = course.finalScore;
    } else {
      const compCalc = calculateComponentsScore(course.components);
      score10 = course.finalScore ?? compCalc.finalScore;
    }

    if (score10 !== null && score10 !== undefined && !isNaN(score10)) {
      const score4 = score10ToScore4(score10);
      totalWeightedSum10 += score10 * credits;
      totalWeightedSum4 += score4 * credits;
      totalGradedCredits += credits;
    }
  }

  const cumulativeGPA10 = totalGradedCredits > 0 ? Math.round((totalWeightedSum10 / totalGradedCredits) * 100) / 100 : 0;
  const cumulativeGPA4 = totalGradedCredits > 0 ? Math.round((totalWeightedSum4 / totalGradedCredits) * 100) / 100 : 0;
  const letterGrade = totalGradedCredits > 0 ? score10ToLetter(cumulativeGPA10) : "--";
  const academicStanding = totalGradedCredits > 0 ? score4ToAcademicStanding(cumulativeGPA4) : "Chưa xếp loại";

  return {
    totalCourses: courses.length,
    totalCredits,
    earnedCredits,
    cumulativeGPA10,
    cumulativeGPA4,
    letterGrade,
    academicStanding,
    semesters,
  };
}
