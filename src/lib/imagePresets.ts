export interface ImagePresetItem {
  id: string;
  label: string;
  tag: string;
  url: string;
}

/**
 * Danh sách link ảnh vĩnh viễn (permanent links) chất lượng cao tuyển chọn từ Unsplash
 * Tone màu thẩm mỹ, tối giản, sang trọng, tương tự thiết kế AI Workflow Cards.
 */
export const IMAGE_PRESETS: ImagePresetItem[] = [
  {
    id: "ai-confetti",
    label: "AI & Không gian (Mẫu chuẩn)",
    tag: "AI / Tech",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "logistics-hub",
    label: "Kho bãi & Chuỗi cung ứng",
    tag: "Logistics",
    url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "coding-matrix",
    label: "Lập trình & Mã nguồn",
    tag: "CNTT",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "math-geometry",
    label: "Toán học & Hình học",
    tag: "Toán / Lý",
    url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "business-finance",
    label: "Kinh tế & Phân tích kinh doanh",
    tag: "Kinh tế",
    url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "books-study",
    label: "Ngoại ngữ & Nghiên cứu",
    tag: "Ngoại ngữ",
    url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "creative-art",
    label: "Nghệ thuật & Sáng tạo",
    tag: "Thiết kế",
    url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "serene-nature",
    label: "Thiên nhiên & Núi non thanh bình",
    tag: "Thư giãn",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "engineering-lab",
    label: "Kỹ thuật & Thiết bị công nghệ",
    tag: "Kỹ thuật",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
  },
];

/**
 * Trả về link ảnh vĩnh viễn phù hợp cho Môn học.
 * Nếu người dùng đã cài imageUrl, ưu tiên tuyệt đối link của người dùng.
 * Nếu chưa, tự động chọn preset hài hoà dựa trên mã môn và phân loại môn.
 */
export function getSubjectCoverImage(subject?: {
  imageUrl?: string;
  code?: string;
  name?: string;
  category?: string;
}): string {
  if (subject?.imageUrl && subject.imageUrl.trim().length > 0) {
    return subject.imageUrl.trim();
  }

  const str = `${subject?.code || ""} ${subject?.name || ""} ${subject?.category || ""}`.toLowerCase();

  if (str.includes("mat") || str.includes("toán") || str.includes("giải tích") || str.includes("đại số")) {
    return IMAGE_PRESETS[3].url; // math-geometry
  }
  if (str.includes("eng") || str.includes("ngoại ngữ") || str.includes("tiếng anh") || str.includes("nhật") || str.includes("trung")) {
    return IMAGE_PRESETS[5].url; // books-study
  }
  if (str.includes("cs") || str.includes("prg") || str.includes("lập trình") || str.includes("cntt") || str.includes("phần mềm") || str.includes("dữ liệu")) {
    return IMAGE_PRESETS[2].url; // coding-matrix
  }
  if (str.includes("scm") || str.includes("logistics") || str.includes("kho") || str.includes("vận tải")) {
    return IMAGE_PRESETS[1].url; // logistics-hub
  }
  if (str.includes("kinh tế") || str.includes("tài chính") || str.includes("marketing") || str.includes("quản trị")) {
    return IMAGE_PRESETS[4].url; // business-finance
  }
  if (str.includes("thiết kế") || str.includes("đồ hoạ") || str.includes("ui") || str.includes("ux")) {
    return IMAGE_PRESETS[6].url; // creative-art
  }

  // Mặc định ảnh phong cảnh AI theo chuẩn reference
  return IMAGE_PRESETS[0].url;
}

/**
 * Trả về link ảnh vĩnh viễn phù hợp cho Đồ án nhóm.
 */
export function getGroupCoverImage(group?: {
  imageUrl?: string;
  subjectCode?: string;
  subjectName?: string;
  topic?: string;
  name?: string;
}): string {
  if (group?.imageUrl && group.imageUrl.trim().length > 0) {
    return group.imageUrl.trim();
  }

  const str = `${group?.subjectCode || ""} ${group?.subjectName || ""} ${group?.topic || ""} ${group?.name || ""}`.toLowerCase();

  if (str.includes("scm") || str.includes("logistics") || str.includes("kho bãi") || str.includes("chuỗi cung ứng")) {
    return IMAGE_PRESETS[1].url; // logistics-hub
  }
  if (str.includes("ai") || str.includes("trí tuệ nhân tạo") || str.includes("machine learning") || str.includes("deep learning") || str.includes("cnn") || str.includes("resnet")) {
    return IMAGE_PRESETS[0].url; // ai-confetti
  }
  if (str.includes("web") || str.includes("app") || str.includes("lập trình") || str.includes("phần mềm") || str.includes("code")) {
    return IMAGE_PRESETS[2].url; // coding-matrix
  }
  if (str.includes("kinh tế") || str.includes("marketing") || str.includes("thị trường") || str.includes("doanh thu")) {
    return IMAGE_PRESETS[4].url; // business-finance
  }

  return IMAGE_PRESETS[0].url;
}
