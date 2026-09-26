# 🎨 HỆ THỐNG QUY CHUẨN THIẾT KẾ LEVRN (LEVRN DESIGN SYSTEM)

Tài liệu này là quy chuẩn bắt buộc về Ngôn ngữ thiết kế (Design Language), Giao diện người dùng (UI/UX) và Quy tắc làm việc cho AI/Developer trong toàn bộ dự án LEVRN.

---

## 1. Triết Lý Thiết Kế Cốt Lõi (Core Aesthetic)
- **Cứng cáp, hiện đại, chuẩn công nghệ (Sharp Tech / Brutalist-Refined):** Giao diện mang phong cách dứt khoát, chuyên nghiệp, vuông vức, tránh cảm giác "tròn xoe, hoạt hình, mềm yếu".
- **Trực diện, loại bỏ xao nhãng (Direct & Zero Fluff):** Tập trung tuyệt đối vào luồng thao tác và dữ liệu của người dùng. Không thêm văn bản giải thích thừa thãi.
- **Nhận diện thương hiệu LEVRN:** 
  - Đen/Tối (`#000000` / `#0D0E12` / `#13151B`)
  - Tím Violet (`#7D39EB` - Primary Action / Selection)
  - Vàng chanh Lime (`#C6FF33` - Secondary / Accent / Focus / Today)
  - Nền Canvas (`#F4F5F9` cho Light mode)

---

## 2. Các Quy Chuẩn Thiết Kế Bắt Buộc (Mandatory UI/UX Rules)

### 🚫 Quy tắc 1: Không dòng chữ dư thừa bên dưới các Header
- **Quy định:** Bên dưới tất cả các Header (Trang, Card, Section, Modal, Dialog), **tuyệt đối không để phụ đề (subtitles), câu chào sáo rỗng hoặc mô tả hướng dẫn rườm rà**.
- **Ví dụ vi phạm:**
  - ❌ `<h1>Quản lý Môn học</h1> <p className="text-muted-foreground">Theo dõi và quản lý thông tin các môn học trong kỳ của bạn...</p>`
  - ❌ `<h3>Thêm nhóm mới</h3> <p>Điền các thông tin bên dưới để tạo nhóm...</p>`
- **Chuẩn áp dụng:**
  - ✅ Giữ Header tinh gọn, đứng độc lập và rõ ràng: `<h1>Quản lý Môn học</h1>` hoặc `<h3>Thêm nhóm mới</h3>`.

---

### 🔘 Quy tắc 2: Thứ tự ưu tiên nút tính năng (Icon > Text > Icon + Text)
Khi bố trí các nút tương tác (Buttons & Actions), phải tuân thủ nghiêm ngặt 3 cấp độ ưu tiên:
1. **Ưu tiên 1 (Cao nhất) - Chỉ dùng Icon (Icon-only Button):**
   - Áp dụng cho hầu hết các hành động lặp lại, action trên từng hàng của danh sách/bảng, nút đóng, nút sửa, nút xóa, bộ lọc, chế độ xem.
   - **Bắt buộc:** Phải có thuộc tính `title` hoặc `aria-label` để đảm bảo trợ năng và tooltip trình duyệt.
   - Kích thước: Icon chuẩn `w-4 h-4` (hoặc `w-[18px] h-[18px]`), nút bọc gọn gàng `h-8 w-8` hoặc `h-9 w-9`.
2. **Ưu tiên 2 - Chỉ dùng Chữ (Text-only Button):**
   - Áp dụng cho các nút điều hướng đơn giản hoặc các nút hành động xác nhận form (VD: `Lưu`, `Hủy`, `Đóng`, `Xác nhận`).
3. **Ưu tiên 3 (Hạn chế nhất) - Icon kết hợp Chữ (Icon + Text):**
   - **Chỉ sử dụng** cho nút Primary CTA đặc biệt quan trọng của trang (ví dụ: `+ Tạo mới`) hoặc các nút yêu cầu ngữ cảnh đặc biệt để tránh thao tác nhầm.

---

### 🏷️ Quy tắc 3: Pop-up / Modal / Dialog / Sheet - Bắt buộc có Icon trước tên trường
- **Quy định:** Trong tất cả các hộp thoại nổi (Pop-up box, Modal, Dialog, Sheet), **trước tên của mỗi trường dữ liệu (Label) bắt buộc phải có 1 Icon đại diện trực quan**.
- **Quy cách trình bày:**
  - Icon nằm trước text, thẳng hàng ngang (`flex items-center gap-1.5`).
  - Kích thước icon: `w-3.5 h-3.5` hoặc `w-4 h-4`, màu sắc nhẹ nhàng (`text-muted-foreground` hoặc `text-foreground/80`).
- **Ví dụ mẫu:**
  ```tsx
  <Label className="flex items-center gap-1.5 text-xs font-semibold">
    <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
    Tên môn học
  </Label>
  ```
  ```tsx
  <Label className="flex items-center gap-1.5 text-xs font-semibold">
    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
    Ngày hết hạn
  </Label>
  ```

---

### 📝 Quy tắc 4: Trường dữ liệu đơn giản, không gợi ý thừa
- **Quy định:** Các Input, Select, Textarea phải được thiết kế tối giản, sạch sẽ, trực diện.
- **Cấm:**
  - ❌ Không thêm các khối chip gợi ý (Suggested tags / quick-pick chips).
  - ❌ Không thêm danh sách lựa chọn tự động đoán trước (auto-suggestions list) rườm rà.
  - ❌ Không chèn các nút gợi ý làm loãng trải nghiệm nhập liệu.
- Giữ form thẳng thắn: Người dùng nhập hoặc chọn chính xác giá trị cần thiết.

---

### 📅 Quy tắc 5: Date Picker theo chuẩn nhận diện website
- **Quy định:** Bộ chọn ngày / giờ (Date Picker, DateTime Picker, Calendar) phải đồng bộ tuyệt đối với phong cách LEVRN:
  - **Màu ngày được chọn (Selected):** Nền Tím Violet (`#7D39EB`), chữ trắng.
  - **Màu ngày hiện tại (Today):** Viền hoặc điểm nhấn Vàng chanh Lime (`#C6FF33`), chữ nổi bật.
  - **Hover state:** Nền nhẹ với border tinh tế.
  - **Bo góc:** Chuẩn `rounded-md` hoặc `rounded-lg`, không dùng góc bo tròn vo kiểu viên thuốc (pill/full).
  - **Bảng chọn:** Đồng bộ theo dark theme (`#13151B`) hoặc light theme (`#FFFFFF`) với viền `border-border`.

---

### 🔲 Quy tắc 6: Độ bo góc các thẻ chỉ khoảng 5-10% (Cảm giác cứng cáp)
- **Quy định:** Tất cả các Thẻ (Cards), Khung chứa (Containers), Bảng (Tables), Modal/Dialog:
  - **Chỉ bo tròn từ 5% đến 10%** (tương đương `rounded-md` ~6px đến `rounded-lg` ~8-10px trong Tailwind).
  - ❌ **Tuyệt đối tránh:** Không dùng `rounded-2xl` (16px), `rounded-3xl` (24px) hay `rounded-full` cho các khối thẻ/hộp.
  - **Mục đích:** Đảm bảo phong cách công nghệ, góc cạnh sắc bén, mạnh mẽ và kiên cố.

---

### 🔤 Quy tắc 7: Chữ hiển thị trên một dòng chuyển thành Marquee (Vòng lặp ngang thay vì dùng `...`)
- **Quy định:** Tất cả các dòng chữ hiển thị đơn dòng (như tên môn học, tên bài tập/nhiệm vụ, tên giảng viên, phòng học, địa chỉ...) khi bị tràn chiều ngang **TUYỆT ĐỐI KHÔNG** dùng `truncate`, `overflow-hidden text-ellipsis` hay `line-clamp-1` với dấu ba chấm `...` làm cụt nội dung.
- **Giải pháp:** Bắt buộc áp dụng cơ chế **Marquee** (thông qua component `<MarqueeText />`):
  - Chữ tự động chạy vòng lặp ngang tuần hoàn mượt mà (infinite loop) để người dùng luôn đọc được trọn vẹn toàn bộ nội dung mà vẫn giữ nguyên chiều cao 1 dòng cố định.
  - Tạm dừng chạy khi rê chuột vào (Pause on hover) để người dùng dễ đọc và click.
  - Thêm viền gradient mờ hai mép để tạo cảm giác chuyển động công nghệ cao cấp.

---

### 📐 Quy tắc 8: Thẻ (Cards) phải cân đối, bảo toàn hiển thị và bố cục ảnh tinh gọn
- **Quy định:** Trong các danh sách dạng lưới (Grid), tất cả các thẻ đặt cạnh nhau **phải đồng bộ tuyệt đối về chiều cao và tỷ lệ bố cục**:
  - **Khung ảnh bìa (Image Banner):** Bắt buộc phải khóa chiều cao cố định nhỏ gọn, tinh tế (chuẩn `h-28` ~112px, thay vì chiếm quá nửa thẻ), đi kèm `object-cover w-full h-full`.
  - **Bảo toàn hiển thị thẻ (Zero Clipping & Card Containment):** Tuyệt đối **KHÔNG** để bất kỳ icon, chữ, nút bấm hay thông tin nào bị cắt xén (clipped), lọt ra ngoài mép khung viền thẻ hay tràn khung.
  - **Tiêu đề môn học/thực thể nổi bật:** Phần chữ Header của thẻ phải được thiết kế cỡ chữ to hơn hẳn (`text-lg font-black tracking-tight`), nổi bật vượt bậc so với các thông số phụ xung quanh.
  - **Mặt ngoài thẻ tối giản:** Không đặt nút 3 chấm dọc hay nút đổi ảnh rườm rà ở ngoài mặt thẻ. Tất cả các tính năng quản lý (đổi ảnh bìa, xoá, tuỳ chọn) được đẩy vào bên trong pop-up chi tiết.
  - **Cân đối tổng thể:** Mọi thẻ trên cùng một hàng luôn cao bằng nhau tăm tắp (`h-full flex flex-col justify-between`), tạo cảm giác ngăn nắp, cứng cáp và chuẩn mực.

---

### 🗂️ Quy tắc 9: Pop-up Box - Các trường dữ liệu đồng cấp, KHÔNG có ô lớn bao quanh
- **Quy định:** Đối với tất cả các trường thông tin trong phần pop-up box, modal, dialog:
  - **TUYỆT ĐỐI KHÔNG** thêm các ô/box lớn bao quanh ở ngoài ô nhập liệu (ví dụ: bọc nhóm trường bằng các khối card có viền phụ `p-3 rounded-lg bg-muted/30 border border-border/70`).
  - **Tất cả trường dữ liệu là đồng cấp với nhau (Flat Field Layout):** Bố trí trực diện, cùng một mặt phẳng trên nền Dialog, sử dụng grid chuẩn (`grid-cols-1 sm:grid-cols-2` hoặc `grid-cols-1 sm:grid-cols-12`) hoặc stack đứng đồng nhất.
  - **Phân cấp Typography rõ rệt:** Tiêu đề trường (`<Label>`) chữ nhỏ gọn (`text-[11px] font-bold uppercase tracking-wider text-muted-foreground`) kèm icon đại diện; Nội dung giá trị hiển thị to rõ, đậm nét (`text-sm font-bold text-foreground`), giúp phân biệt tức thì nhãn và giá trị.

---

### 👁️ Quy tắc 10: Pop-up Box - Header 3 thành phần cùng hàng & Mặc định ở dạng Cố định (View Mode)
- **Quy định:** Khi mở pop-up box để xem chi tiết thông tin của một thực thể (môn học, dự án, bài tập...):
  - **Header cùng hàng đồng kích thước:** Tiêu đề hộp thoại, Nút Chỉnh sửa (`<Pencil />`) và Nút Thoát (`<X />`) **BẮT BUỘC PHẢI CÙNG HÀNG**. Nút Chỉnh sửa và Nút Thoát có kích thước bằng nhau chuẩn `h-8 w-8 rounded-md`.
  - **Dạng cố định (View / Read-only Mode):** Tất cả nội dung đã nhập trong pop-up box mặc định hiển thị ở dạng cố định trực quan, tinh gọn, không phải là các ô input editable. Người dùng đọc thông tin sạch sẽ, các link và nút thao tác (Đổi ảnh, Xoá) có thể click trực tiếp.
  - **Nút Cây bút chuyển sang Chế độ Chỉnh sửa:** Muốn chỉnh sửa thông tin, người dùng click vào **nút bấm hình icon Cây bút (`<Pencil />`)** đặt ở góc phải trên cùng ngang hàng với tiêu đề.
  - Khi click vào nút Cây bút, pop-up chuyển sang Chế độ Chỉnh sửa (Edit Mode) với các input/select đồng cấp cho phép sửa và lưu thay đổi.

---

### 🔲 Quy tắc 11: Bố cục lưới thẻ - Chuẩn 5 thẻ mỗi hàng (5 Cards per Row)
- **Quy định:** Đối với tất cả các trang hiển thị danh sách dạng thẻ (Môn học, Đồ án nhóm, Thẻ chiến lược, Danh sách thẻ nhiệm vụ...):
  - Số thẻ hiển thị trên mỗi hàng trên màn hình lớn / desktop chuẩn là **đúng 5 thẻ mỗi hàng**.
  - Tailwind Grid class bắt buộc: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4` (hoặc `gap-4 sm:gap-5`).

---

## 3. Quy Tắc Tác Vụ Dành Cho AI (AI Working & Interaction Rules)

### ⚡ Quy tắc 12: Tác phong làm việc của AI (Nhanh, Trúng, Không Screenshot)
- **Chỉ đọc đúng file cần làm:** Không quét hay duyệt qua các file không liên quan để tránh lãng phí thời gian và token.
- **Làm nhanh và báo liền:** Viết code chính xác, dứt khoát, trả lời kết quả ngay lập tức khi hoàn thành.
- **Người dùng tự test:** AI **không** sử dụng browser agent để test chụp ảnh màn hình (screenshot). Người dùng là người trực tiếp kiểm tra và nghiệm thu giao diện trên môi trường thực tế.

---

### 🗄️ Quy tắc 13: Thay đổi trong Supabase (Walkthrough + SQL Script)
- **Quy định:** Bất cứ khi nào có thay đổi về CSDL Supabase (thêm bảng, sửa cột, tạo Foreign Key, cấu hình RLS Policy, Function, Trigger, v.v.):
  1. **Walkthrough:** Trình bày rõ ràng từng bước thao tác trực tiếp trên giao diện Supabase Dashboard.
  2. **Mã SQL:** Cung cấp câu lệnh SQL hoàn chỉnh, chuẩn xác, sẵn sàng copy & paste vào SQL Editor của Supabase.
  3. **Đồng bộ mã nguồn:** Cập nhật ngay câu lệnh đó vào file `supabase_schema.sql` của dự án để đảm bảo dự án luôn có schema mới nhất.

---

## 4. Bảng Tra Cứu Nhanh Tailwind Tokens Cho Dự Án

| Thành phần | Chuẩn áp dụng | Tailwind Class gợi ý |
| :--- | :--- | :--- |
| **Card Radius** | Bo góc 5-10% (cứng cáp) | `rounded-lg` (8px) hoặc `rounded-md` (6px) |
| **Cards Grid** | 5 thẻ mỗi hàng | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` |
| **Primary Color** | Brand Violet | `bg-[#7D39EB]`, `text-[#7D39EB]`, `bg-primary` |
| **Accent / Today** | Brand Lime | `bg-[#C6FF33]`, `text-[#C6FF33]`, `bg-secondary` |
| **Dark Card Background**| Nền thẻ tối sang trọng | `bg-[#13151B]` / `bg-card` |
| **Action Button** | Ưu tiên Icon-only | `<button title="..." className="h-8 w-8 rounded-md p-1.5 ..."><Icon className="w-4 h-4" /></button>` |
| **Form Label** | Có Icon trước chữ | `<Label className="flex items-center gap-1.5 text-xs font-semibold"><Icon className="w-3.5 h-3.5" /> Tên trường</Label>` |
| **Modal Fields** | Đồng cấp, không bọc ô lớn | Các `div` trường dữ liệu đặt phẳng trực tiếp trong grid/form |
| **Header Layout** | Không có chữ giải thích bên dưới | `<h1 className="text-xl font-bold tracking-tight">Tiêu đề</h1>` |
