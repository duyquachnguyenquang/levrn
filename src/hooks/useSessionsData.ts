"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  StudySession,
  Flashcard,
  FlashcardFormData,
  QuizQuestion,
  QuizQuestionFormData,
  PomodoroMode,
} from "@/lib/types";

const LOCAL_STORAGE_SESSIONS_KEY = "levrn_study_sessions_v1";
const LOCAL_STORAGE_FLASHCARDS_KEY = "levrn_flashcards_v1";
const LOCAL_STORAGE_QUIZZES_KEY = "levrn_quizzes_v1";

// Dữ liệu mẫu ban đầu cho Flashcards
const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    subjectId: "sub-demo-1",
    deckName: "Đại số & Giải tích",
    front: "Điều kiện cần để hàm số f(x) đạt cực trị tại x0 là gì?",
    back: "Nếu hàm số f(x) có đạo hàm tại x0 và đạt cực trị tại đó thì f'(x0) = 0 (Định lý Fermat).",
    hint: "Liên quan đến đạo hàm bậc nhất tại điểm cực trị.",
    difficulty: "easy",
    reviewCount: 3,
    isMastered: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fc-2",
    subjectId: "sub-demo-1",
    deckName: "Đại số & Giải tích",
    front: "Công thức Tích phân từng phần (Integration by parts)?",
    back: "∫ u dv = u·v - ∫ v du (Ghi nhớ mẹo: 'Nhất lô, nhì đa, tam lượng, tứ mũ' để chọn u).",
    hint: "Xuất phát từ đạo hàm của tích (u·v)'.",
    difficulty: "medium",
    reviewCount: 5,
    isMastered: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fc-3",
    subjectId: "sub-demo-1",
    deckName: "Đại số tuyến tính",
    front: "Khi nào một ma trận vuông A khả nghịch (tồn tại A⁻¹)?",
    back: "Ma trận vuông A cấp n khả nghịch khi và chỉ khi Định thức det(A) ≠ 0 (hoặc rank(A) = n).",
    hint: "Xét giá trị định thức det(A).",
    difficulty: "easy",
    reviewCount: 2,
    isMastered: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fc-4",
    subjectId: "sub-demo-3",
    deckName: "Cấu trúc dữ liệu",
    front: "Nguyên lý hoạt động của Cấu trúc hàng đợi (Queue)?",
    back: "FIFO (First In, First Out) - Phần tử nào đưa vào trước sẽ được lấy ra trước. Ví dụ: Hàng đợi in ấn, xử lý tác vụ.",
    hint: "Ngược lại với Stack (LIFO).",
    difficulty: "easy",
    reviewCount: 4,
    isMastered: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fc-5",
    subjectId: "sub-demo-3",
    deckName: "Thuật toán",
    front: "Độ phức tạp thời gian của Thuật toán Tìm kiếm nhị phân (Binary Search)?",
    back: "Thời gian chạy trường hợp xấu nhất và trung bình là O(log n). Yêu cầu: Mảng đã được sắp xếp tăng/giảm dần.",
    hint: "Mỗi bước chia đôi không gian tìm kiếm.",
    difficulty: "medium",
    reviewCount: 1,
    isMastered: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fc-6",
    subjectId: "sub-demo-2",
    deckName: "Từ vựng chuyên ngành",
    front: "Thuật ngữ 'Spaced Repetition' trong học tập có nghĩa là gì?",
    back: "Lặp lại ngắt quãng - Kỹ thuật ôn tập kiến thức theo các khoảng thời gian tăng dần để tối ưu hoá khả năng ghi nhớ dài hạn.",
    hint: "Kỹ thuật chống lại 'Đường cong quên lãng' Ebbinghaus.",
    difficulty: "easy",
    reviewCount: 3,
    isMastered: true,
    createdAt: new Date().toISOString(),
  },
];

// Dữ liệu mẫu ban đầu cho Quizzes
const DEFAULT_QUIZZES: QuizQuestion[] = [
  {
    id: "quiz-1",
    subjectId: "sub-demo-1",
    topic: "Đại số tuyến tính",
    question: "Định thức của ma trận đơn vị In cấp n có giá trị bằng bao nhiêu?",
    options: ["0", "1", "n", "Không xác định"],
    correctIndex: 1,
    explanation: "Ma trận đơn vị là ma trận đường chéo với tất cả các phần tử trên đường chéo chính bằng 1, do đó định thức luôn bằng 1.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-2",
    subjectId: "sub-demo-1",
    topic: "Hệ phương trình tuyến tính",
    question: "Hệ phương trình tuyến tính n phương trình n ẩn Ax = b có nghiệm duy nhất khi và chỉ khi:",
    options: [
      "det(A) = 0",
      "det(A) ≠ 0",
      "Hệ thuần nhất có vô số nghiệm",
      "Hạng của A nhỏ hơn n",
    ],
    correctIndex: 1,
    explanation: "Theo định lý Cramer, hệ phương trình có nghiệm duy nhất khi ma trận hệ số A không suy biến, tức det(A) khác 0.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-3",
    subjectId: "sub-demo-3",
    topic: "Thuật toán sắp xếp",
    question: "Thuật toán sắp xếp nào sau đây có độ phức tạp thời gian trường hợp xấu nhất là O(n log n)?",
    options: [
      "Bubble Sort",
      "Quick Sort",
      "Merge Sort (Sắp xếp trộn)",
      "Insertion Sort",
    ],
    correctIndex: 2,
    explanation: "Merge Sort luôn chia đôi mảng và trộn lại với chi phí O(n log n) trong cả trường hợp tốt nhất, trung bình và xấu nhất (Quick Sort xấu nhất là O(n²)).",
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-4",
    subjectId: "sub-demo-3",
    topic: "Cấu trúc dữ liệu",
    question: "Thao tác tìm kiếm một phần tử trong Bảng băm (Hash Table) lý tưởng có độ phức tạp là:",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctIndex: 0,
    explanation: "Với hàm băm hoàn hảo và kích thước bảng phù hợp, thao tác tìm kiếm, chèn và xoá trong Hash Table đạt thời gian trung bình O(1).",
    createdAt: new Date().toISOString(),
  },
  {
    id: "quiz-5",
    subjectId: "sub-demo-2",
    topic: "Academic English",
    question: "Chọn từ đồng nghĩa thích hợp nhất với từ 'Mandatory' trong câu: 'Attendance is mandatory for all students.'",
    options: ["Optional", "Compulsory", "Recommended", "Flexible"],
    correctIndex: 1,
    explanation: "'Mandatory' và 'Compulsory' đều mang nghĩa là 'bắt buộc', không thể bỏ qua.",
    createdAt: new Date().toISOString(),
  },
];

export function useSessionsData() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);

  // 1. Tải dữ liệu ban đầu
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);

    // Thử tải từ Supabase
    if (supabase) {
      try {
        const [resSessions, resCards, resQuizzes] = await Promise.allSettled([
          supabase.from("study_sessions").select("*").order("created_at", { ascending: false }),
          supabase.from("flashcards").select("*").order("created_at", { ascending: false }),
          supabase.from("quiz_questions").select("*").order("created_at", { ascending: false }),
        ]);

        let sbSessions: StudySession[] | null = null;
        let sbCards: Flashcard[] | null = null;
        let sbQuizzes: QuizQuestion[] | null = null;

        if (resSessions.status === "fulfilled" && !resSessions.value.error && resSessions.value.data) {
          sbSessions = resSessions.value.data.map((row: any) => ({
            id: row.id,
            subjectId: row.subject_id,
            durationMinutes: row.duration_minutes || 25,
            mode: row.mode || "focus",
            notes: row.notes,
            createdAt: row.created_at,
          }));
        }

        if (resCards.status === "fulfilled" && !resCards.value.error && resCards.value.data) {
          sbCards = resCards.value.data.map((row: any) => ({
            id: row.id,
            subjectId: row.subject_id,
            deckName: row.deck_name || "Chung",
            front: row.front,
            back: row.back,
            hint: row.hint,
            difficulty: row.difficulty || "medium",
            reviewCount: row.review_count || 0,
            isMastered: row.is_mastered || false,
            createdAt: row.created_at,
          }));
        }

        if (resQuizzes.status === "fulfilled" && !resQuizzes.value.error && resQuizzes.value.data) {
          sbQuizzes = resQuizzes.value.data.map((row: any) => ({
            id: row.id,
            subjectId: row.subject_id,
            topic: row.topic,
            question: row.question,
            options: row.options || [],
            correctIndex: row.correct_index || 0,
            explanation: row.explanation,
            createdAt: row.created_at,
          }));
        }

        if (sbSessions || sbCards || sbQuizzes) {
          setIsSupabaseActive(true);
        }

        if (sbSessions) setSessions(sbSessions);
        if (sbCards && sbCards.length > 0) setFlashcards(sbCards);
        if (sbQuizzes && sbQuizzes.length > 0) setQuizzes(sbQuizzes);
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to localStorage", err);
      }
    }

    // Dự phòng LocalStorage
    try {
      const localSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
      if (localSessions) {
        setSessions((prev) => (prev.length > 0 ? prev : JSON.parse(localSessions)));
      }

      const localCards = localStorage.getItem(LOCAL_STORAGE_FLASHCARDS_KEY);
      if (localCards) {
        setFlashcards((prev) => (prev.length > 0 ? prev : JSON.parse(localCards)));
      } else {
        setFlashcards((prev) => (prev.length > 0 ? prev : DEFAULT_FLASHCARDS));
      }

      const localQuizzes = localStorage.getItem(LOCAL_STORAGE_QUIZZES_KEY);
      if (localQuizzes) {
        setQuizzes((prev) => (prev.length > 0 ? prev : JSON.parse(localQuizzes)));
      } else {
        setQuizzes((prev) => (prev.length > 0 ? prev : DEFAULT_QUIZZES));
      }
    } catch {}

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Lưu backup vào LocalStorage
  const saveToLocalStorage = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }, []);

  // 2. Thao tác Sessions (Pomodoro)
  const logSession = useCallback(
    async (sessionData: Omit<StudySession, "id" | "createdAt">) => {
      const newSession: StudySession = {
        ...sessionData,
        id: `session-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setSessions((prev) => {
        const next = [newSession, ...prev];
        saveToLocalStorage(LOCAL_STORAGE_SESSIONS_KEY, next);
        return next;
      });

      if (supabase) {
        try {
          await supabase.from("study_sessions").insert({
            id: newSession.id,
            subject_id: newSession.subjectId || null,
            duration_minutes: newSession.durationMinutes,
            mode: newSession.mode,
            notes: newSession.notes || null,
            created_at: newSession.createdAt,
          });
        } catch {}
      }

      return newSession;
    },
    [saveToLocalStorage]
  );

  // 3. Thao tác Flashcards
  const addFlashcard = useCallback(
    async (formData: FlashcardFormData) => {
      const newCard: Flashcard = {
        ...formData,
        id: `fc-${Date.now()}`,
        reviewCount: 0,
        isMastered: false,
        createdAt: new Date().toISOString(),
      };

      setFlashcards((prev) => {
        const next = [newCard, ...prev];
        saveToLocalStorage(LOCAL_STORAGE_FLASHCARDS_KEY, next);
        return next;
      });

      if (supabase) {
        try {
          await supabase.from("flashcards").insert({
            id: newCard.id,
            subject_id: newCard.subjectId || null,
            deck_name: newCard.deckName,
            front: newCard.front,
            back: newCard.back,
            hint: newCard.hint || null,
            difficulty: newCard.difficulty || "medium",
            review_count: 0,
            is_mastered: false,
            created_at: newCard.createdAt,
          });
        } catch {}
      }

      return newCard;
    },
    [saveToLocalStorage]
  );

  const reviewFlashcard = useCallback(
    async (cardId: string, rating: "easy" | "medium" | "hard") => {
      setFlashcards((prev) => {
        const next = prev.map((c) => {
          if (c.id === cardId) {
            return {
              ...c,
              reviewCount: (c.reviewCount || 0) + 1,
              difficulty: rating,
              isMastered: rating === "easy",
            };
          }
          return c;
        });
        saveToLocalStorage(LOCAL_STORAGE_FLASHCARDS_KEY, next);
        return next;
      });

      if (supabase) {
        try {
          await supabase
            .from("flashcards")
            .update({
              difficulty: rating,
              is_mastered: rating === "easy",
            })
            .eq("id", cardId);
        } catch {}
      }
    },
    [saveToLocalStorage]
  );

  const deleteFlashcard = useCallback(
    async (cardId: string) => {
      setFlashcards((prev) => {
        const next = prev.filter((c) => c.id !== cardId);
        saveToLocalStorage(LOCAL_STORAGE_FLASHCARDS_KEY, next);
        return next;
      });

      if (supabase) {
        try {
          await supabase.from("flashcards").delete().eq("id", cardId);
        } catch {}
      }
    },
    [saveToLocalStorage]
  );

  // 4. Thao tác Quizzes
  const addQuizQuestion = useCallback(
    async (formData: QuizQuestionFormData) => {
      const newQuestion: QuizQuestion = {
        ...formData,
        id: `quiz-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      setQuizzes((prev) => {
        const next = [newQuestion, ...prev];
        saveToLocalStorage(LOCAL_STORAGE_QUIZZES_KEY, next);
        return next;
      });

      if (supabase) {
        try {
          await supabase.from("quiz_questions").insert({
            id: newQuestion.id,
            subject_id: newQuestion.subjectId || null,
            topic: newQuestion.topic || null,
            question: newQuestion.question,
            options: newQuestion.options,
            correct_index: newQuestion.correctIndex,
            explanation: newQuestion.explanation || null,
            created_at: newQuestion.createdAt,
          });
        } catch {}
      }

      return newQuestion;
    },
    [saveToLocalStorage]
  );

  const deleteQuizQuestion = useCallback(
    async (questionId: string) => {
      setQuizzes((prev) => {
        const next = prev.filter((q) => q.id !== questionId);
        saveToLocalStorage(LOCAL_STORAGE_QUIZZES_KEY, next);
        return next;
      });

      if (supabase) {
        try {
          await supabase.from("quiz_questions").delete().eq("id", questionId);
        } catch {}
      }
    },
    [saveToLocalStorage]
  );

  // Thống kê phiên học tập
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todaySessions = sessions.filter((s) => s.createdAt.startsWith(todayStr));
    const focusSessions = todaySessions.filter((s) => s.mode === "focus");
    const totalFocusMinutesToday = focusSessions.reduce((acc, cur) => acc + cur.durationMinutes, 0);

    const masteredCardsCount = flashcards.filter((c) => c.isMastered).length;

    return {
      todayFocusMinutes: totalFocusMinutesToday,
      todaySessionsCount: focusSessions.length,
      totalSessionsCount: sessions.length,
      totalFlashcards: flashcards.length,
      masteredFlashcards: masteredCardsCount,
      totalQuizzes: quizzes.length,
    };
  }, [sessions, flashcards, quizzes]);

  return {
    sessions,
    flashcards,
    quizzes,
    stats,
    isLoading,
    isSupabaseActive,
    logSession,
    addFlashcard,
    reviewFlashcard,
    deleteFlashcard,
    addQuizQuestion,
    deleteQuizQuestion,
    refreshData: loadInitialData,
  };
}
