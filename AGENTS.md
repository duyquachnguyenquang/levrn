<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LEVRN DESIGN LANGUAGE & AI OPERATIONAL RULES
> Chi tiết tài liệu: Xem thêm tại file `DESIGN_SYSTEM.md` ở thư mục gốc.

Tất cả các tác vụ thiết kế giao diện (UI/UX) và quy trình làm việc của AI trong dự án LEVRN **BẮT BUỘC** phải tuân thủ nghiêm ngặt các quy tắc sau:

---

## 1. QUY CHUẨN GIAO DIỆN (UI/UX DESIGN RULES)

### 1.1. Header tinh gọn - Không có dòng chữ dư thừa bên dưới
- Bên dưới các thẻ Header (`<h1>`, `<h2>`, `<h3>`, Header của Card, Modal, Sheet, Dialog, Section): **TUYỆT ĐỐI KHÔNG** chèn thêm các đoạn mô tả dài dòng, subtitle phụ, chú thích hay câu chào sáo rỗng (như *"Quản lý và theo dõi thông tin..."*, *"Điền vào biểu mẫu để..."*).
- Tiêu đề phải đứng độc lập, ngắn gọn, súc tích và đúng trọng tâm.

### 1.2. Thứ tự ưu tiên nút bấm & Hành động (Button Hierarchy)
Khi tạo hoặc chỉnh sửa các nút thao tác:
1. **Ưu tiên 1 (Cao nhất) - Chỉ dùng Icon (Icon-only):**
   - Áp dụng cho hầu hết các hành động thông thường, thao tác trên hàng bảng/danh sách, nút đóng/mở/sửa/xóa, toggle, filter.
   - **Bắt buộc:** Phải có `title` hoặc `aria-label` cho nút để hiển thị tooltip native và đảm bảo accessibility.
   - Kích thước: Icon chuẩn `w-4 h-4` (hoặc `w-[18px] h-[18px]`), bọc trong nút gọn `h-8 w-8` hoặc `h-9 w-9`.
2. **Ưu tiên 2 - Chỉ dùng Chữ (Text-only):**
   - Áp dụng khi cần hiển thị hành động xác nhận hoặc điều hướng rõ nghĩa (VD: `Lưu`, `Hủy`, `Đóng`, `Xác nhận`).
3. **Ưu tiên 3 (Hạn chế nhất) - Icon kết hợp Chữ (Icon + Text):**
   - Chỉ dùng cho Primary Call-to-Action đặc biệt quan trọng của toàn trang (VD: `+ Tạo mới`) hoặc các hành động phức tạp cần tránh nhầm lẫn.

### 1.3. Pop-up / Modal / Dialog / Sheet: Bắt buộc có Icon trước tên trường dữ liệu (Label Icons)
- Trong tất cả các pop-up box, modal, dialog, sheet: **Trước tên của mỗi trường dữ liệu (`<Label>`) BẮT BUỘC PHẢI CÓ 1 ICON đại diện trực quan**.
- Căn chỉnh: `flex items-center gap-1.5`, kích thước icon `w-3.5 h-3.5` hoặc `w-4 h-4` với màu sắc `text-muted-foreground`.
- Ví dụ:
  - `<BookOpen className="w-3.5 h-3.5 mr-1.5" /> Tên môn học`
  - `<User className="w-3.5 h-3.5 mr-1.5" /> Giảng viên`
  - `<Calendar className="w-3.5 h-3.5 mr-1.5" /> Ngày bắt đầu`
  - `<FileText className="w-3.5 h-3.5 mr-1.5" /> Ghi chú`

### 1.4. Trường dữ liệu đơn giản - Không thêm mục Lựa chọn gợi ý
- Các trường Input, Select, Textarea phải tối giản, sạch sẽ.
- **TUYỆT ĐỐI KHÔNG** tự ý thêm các tag gợi ý (quick-pick chips), danh sách lựa chọn gợi ý tự động (auto-suggestions preview), hoặc các nút phụ gợi ý làm rối mắt người dùng.
- Giữ form trực diện, người dùng nhập hoặc chọn đúng giá trị mong muốn.

### 1.5. Date Picker theo đúng bộ nhận diện thương hiệu LEVRN
- Date Picker / DateTime Picker / Calendar phải chuẩn hóa theo bảng màu và phong cách LEVRN:
  - **Ngày được chọn (Selected):** Nền Tím Violet (`#7D39EB`), chữ trắng.
  - **Ngày hiện tại (Today):** Viền hoặc điểm nhấn Vàng chanh Lime (`#C6FF33`), chữ nổi bật.
  - **Bo góc & Viền:** Bo góc cứng cáp (`rounded-md` hoặc `rounded-lg`), viền sắc nét `border-border`.
  - Không sử dụng các thiết kế bo tròn viên thuốc (pill/full).

### 1.6. Thẻ (Cards / Boxes / Containers) chỉ bo tròn 5-10% (Cảm giác cứng cáp)
- Mọi Thẻ (Card), Khung viền (Container), Bảng (Table), Hộp thoại (Modal/Dialog):
  - **Chỉ bo tròn từ 5% đến 10%** (tương đương `rounded-md` ~6px đến `rounded-lg` ~8-10px).
  - **CẤM:** Không dùng bo góc tròn trịa như `rounded-2xl`, `rounded-3xl` hay `rounded-full` cho thẻ/khung chứa.
  - Tạo phong cách công nghệ sắc nét, hiện đại, vuông vức và kiên cố (Sharp Tech Aesthetic).

### 1.7. Chữ hiển thị trên một dòng chuyển thành Marquee (Vòng lặp ngang thay vì dùng dấu ba chấm ...)
- Tất cả các dòng chữ đơn dòng (tên môn, tên giảng viên, địa điểm, tiêu đề nhiệm vụ...) khi bị tràn chiều ngang: **TUYỆT ĐỐI KHÔNG** dùng `truncate` hay `line-clamp-1` với dấu `...` làm cụt chữ.
- Bắt buộc dùng Marquee (`<MarqueeText />`): chữ tự động chạy vòng lặp tuần hoàn mượt mà, pause khi hover.

### 1.8. Thẻ (Cards): Bảo toàn hiển thị (Zero-Clipping), Bố cục ảnh nhỏ gọn, Header to nổi bật
- **Bảo toàn hiển thị (Card Containment):** Tuyệt đối **KHÔNG** để bất kỳ icon, thông tin, chữ hay nút bấm nào lọt ra ngoài hoặc bị cắt (clipped) khỏi khung viền thẻ.
- **Tiêu đề nổi bật:** Phần chữ Header của thẻ phải to hơn hẳn (`text-lg font-black tracking-tight`), nổi bật vượt bậc so với các thông số khác.
- **Bố cục ảnh bìa nhỏ gọn:** Chiều cao ảnh bìa chuẩn cố định gọn gàng (`h-28` ~112px, `object-cover`), chiếm tỷ lệ vừa phải để dành không gian cho phần thông tin.
- **Mặt ngoài thẻ tinh giản:** Bỏ nút 3 chấm dọc và nút đổi ảnh ở ngoài thẻ, tất cả tính năng quản lý (đổi ảnh bìa, xoá, tuỳ chọn) được đẩy vào bên trong pop-up thông tin.
- **Đồng bộ hàng ngang:** Mọi thẻ trên cùng hàng luôn cao bằng nhau tăm tắp (`h-full flex flex-col justify-between`).

### 1.9. Pop-up Box: Các trường dữ liệu đồng cấp & Phân cấp Typography rõ rệt
- Trong tất cả pop-up box, modal, dialog: **TUYỆT ĐỐI KHÔNG** thêm các ô/box lớn bao quanh ở ngoài ô nhập liệu (không gom nhóm bọc các trường bằng các card nền phụ `p-3 rounded-lg bg-muted/30 border border-border/70`).
- Tất cả trường dữ liệu là đồng cấp với nhau (flat fields), căn bố cục trực tiếp trên nền Dialog.
- **Phân cấp Typography rõ rệt:** Tiêu đề trường (`<Label>`) chữ nhỏ gọn (`text-[11px] font-bold uppercase tracking-wider text-muted-foreground`) kèm icon trực quan; Giá trị hiển thị to rõ, đậm nét (`text-sm font-bold text-foreground`), giúp phân biệt tức thì nhãn và dữ liệu.

### 1.10. Pop-up Box: Header cùng hàng đồng kích thước & Mặc định ở dạng Cố định (View Mode)
- **Header 3 thành phần cùng hàng:** Tiêu đề pop-up, Nút Chỉnh sửa (`<Pencil />`) và Nút Thoát (`<X />`) **BẮT BUỘC CÙNG HÀNG**. Nút Chỉnh sửa phải to bằng nút Thoát (kích thước chuẩn `h-8 w-8 rounded-md`).
- Tất cả nội dung đã có trong pop-up box khi mở xem chi tiết mặc định hiển thị ở **dạng cố định (Read-only / View mode)** trực quan, thông tin trình bày thông minh, khoa học.
- Muốn chỉnh sửa thông tin: Click vào nút bấm hình **icon Cây bút (`<Pencil />`)** ở góc phải trên cùng ngang hàng với tiêu đề để chuyển sang Chế độ Chỉnh sửa (Edit mode).

### 1.11. Bố cục lưới thẻ: Chuẩn 5 thẻ mỗi hàng (5 Cards per Row)
- Đối với tất cả trang hiển thị danh sách dạng thẻ: Số thẻ trên mỗi hàng ở màn hình chuẩn máy tính (Desktop/XL) bắt buộc là **5 thẻ mỗi hàng** (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`).

---

## 2. QUY TẮC TÁC VỤ & PHẢN HỒI CỦA AI (AI OPERATIONAL RULES)

### 2.1. Đọc đúng file, làm nhanh, báo liền - Người dùng tự test
- **Chỉ đọc đúng file cần làm:** Khi nhận yêu cầu, AI chỉ đọc các file thực sự liên quan trực tiếp đến tác vụ, không quét lan man.
- **Làm nhanh và báo liền:** Triển khai code chuẩn xác, dứt khoát và báo cáo hoàn thành ngay lập tức.
- **Không test screenshot:** Tuyệt đối không tự ý dùng browser agent để test chụp ảnh màn hình (screenshot). Người dùng là người tự test trực tiếp trên trình duyệt.

### 2.2. Quy trình thay đổi Database Supabase
Bất cứ khi nào có thay đổi trong Supabase (tạo/sửa bảng, thêm cột, foreign key, index, trigger, RLS policies):
1. **Walkthrough:** Hướng dẫn chi tiết từng bước thực hiện trên giao diện Supabase Dashboard.
2. **Lệnh SQL:** Cung cấp câu lệnh SQL hoàn chỉnh, chuẩn xác, sẵn sàng copy & paste vào SQL Editor của Supabase.
3. **Đồng bộ mã nguồn:** Cập nhật ngay vào file `supabase_schema.sql` trong dự án.
