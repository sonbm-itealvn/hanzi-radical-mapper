# Ý tưởng thiết kế — Hanzi Radical Mapper

## Ba hướng ban đầu

### Theme Name: Sổ tay chữ trên bàn học

Very Brief Intro: Một công cụ học tập có cảm giác như sổ tay biên tập về chữ Hán: nền ngà, mực xanh chàm, dấu son và các thẻ ghi chú có đường kẻ mảnh. Nhịp điệu thị giác điềm tĩnh, gần gũi và phù hợp với việc ngồi học lâu.

Probability: 0.07

### Theme Name: Phòng thí nghiệm nét chữ

Very Brief Intro: Một giao diện sáng, kỹ thuật và tập trung vào chuyển động: lưới tọa độ, nét xanh điện, các chỉ số stroke và trạng thái mô phỏng được trình bày như một bảng điều khiển nghiên cứu chữ viết. Cảm giác chính xác, nhanh và có tính khám phá.

Probability: 0.03

### Theme Name: Bản đồ mực đêm

Very Brief Intro: Không gian tối như mặt giấy luyện thư pháp ban đêm, dùng màu ngọc bích, đồng cổ và ánh sáng ấm để dẫn hướng. Tập trung vào sự tương phản và khoảnh khắc chữ được viết ra từng nét.

Probability: 0.09

## Hướng được chọn: Sổ tay chữ trên bàn học

### Design Movement

Swiss editorial kết hợp với tinh thần **wenfang 文房** của bàn học chữ Hán: lưới biên tập rõ ràng, khoảng trắng có chủ ý, chi tiết mực và dấu son được dùng như tín hiệu chức năng chứ không phải trang trí.

### Core Principles

1. **Chữ là vật thể chính.** Mỗi màn hình phải làm cho chữ Hán lớn, rõ và có không gian thở; dữ liệu chỉ xuất hiện khi giúp người học hiểu hoặc nhớ tốt hơn.
2. **Cấu trúc đọc được trong một nhịp.** Khu vực nhập chữ, bảng thông tin và khung viết được phân tầng rõ; không giấu thông tin quan trọng sau quá nhiều tab.
3. **Mực để dẫn hướng.** Xanh chàm dành cho thông tin và hành động chính, đỏ son dành cho trạng thái đang viết hoặc điểm cần chú ý, xanh trà dành cho bộ thủ và ghi chú học tập.
4. **Học bằng hành động nhỏ.** Mỗi tương tác có phản hồi gọn: tra cứu, phát lại nét, bật từng nét, hoặc lưu lịch sử; chuyển động ngắn và có thể tắt theo reduced motion.

### Color Philosophy

Nền giấy ngà `#F4F0E7` làm dịu mắt và gợi không gian học tập. Mực xanh chàm `#17324D` là màu sở hữu của thương hiệu, tạo cảm giác tin cậy và tập trung. Đỏ son `#B94A3D` chỉ dùng cho nét đang được mô phỏng, nhãn “đang viết” và dấu nhấn, nhờ đó không bị lạm dụng. Xanh trà `#4D786B` đánh dấu bộ thủ/thành phần; vàng giấy `#E8D7A8` dành cho các mẹo học và vùng ghi chú.

### Layout Paradigm

Bố cục **hai cột lệch trọng tâm**: cột trái là “bàn nhập chữ” cố định về mặt thị giác, cột phải là bảng phân tích và mô phỏng nét. Trên màn hình rộng, chữ lớn nằm ở một “tờ giấy” trung tâm nối trực tiếp với nhãn bộ thủ; trên mobile, các vùng xếp theo trình tự học: nhập → nhận diện → viết → ôn lại. Không dùng hero giữa trang kiểu landing page; giao diện mở đầu bằng một canvas làm việc thực dụng.

### Signature Elements

1. **Dấu son vuông** ở cạnh tiêu đề hoặc trạng thái đang viết, như một con dấu xác nhận thao tác.
2. **Đường kẻ sổ tay** và chấm tọa độ rất nhẹ phía sau vùng canvas, giúp khung viết có cảm giác giấy học nhưng vẫn hiện đại.
3. **Thẻ “bộ thủ / thành phần”** có đường nối mảnh từ chữ lớn sang bộ thủ, để quan hệ cấu tạo được nhìn thấy thay vì chỉ đọc trong danh sách.

### Interaction Philosophy

Mọi thao tác đều trả lời câu hỏi “tôi vừa học thêm điều gì?”. Khi người dùng gõ chữ, chữ lớn xuất hiện trước; sau đó bộ thủ, cấu trúc và số nét trượt vào theo thứ tự. Nút phát lại có hai chế độ: xem toàn bộ và bước từng nét. Các ô thông tin có thể mở rộng nhưng không làm mất vị trí chữ chính.

### Animation

Dùng `cubic-bezier(0.23, 1, 0.32, 1)` cho chuyển động vào, thời lượng 180–260ms. Khi tra chữ mới, panel thông tin chuyển vào bằng opacity + translateY nhỏ, từng thẻ trễ 40ms. Nét chữ mô phỏng dùng stroke animation tuyến tính ngắn, màu đỏ son chuyển về xanh chàm khi nét hoàn tất. Hover chỉ nâng thẻ 2px và đổi màu viền; không dùng bounce hoặc hiệu ứng phát sáng. Với `prefers-reduced-motion`, giữ trạng thái cuối và bỏ toàn bộ stagger.

### Typography System

Tiêu đề dùng **Fraunces** ở trọng lượng 600–700 để tạo cảm giác biên tập, thân bài dùng **DM Sans** 400–600 cho giao diện tiếng Việt/Latin, còn chữ Hán dùng fallback `Noto Sans TC`. Hệ cấp bậc: tiêu đề app 28–34px, tiêu đề vùng 12px uppercase có tracking, chữ Hán chính 96–140px, dữ liệu 13–15px, chú thích 11px. Pinyin luôn dùng chữ thường và màu mực phụ, không cạnh tranh với chữ Hán.

### Brand Essence

**Hanzi Radical Mapper** là bàn học số dành cho người học TOCFL muốn nhìn thấy chữ Hán được cấu tạo và viết ra như thế nào, thay vì chỉ tra nghĩa trong danh sách. Ba tính cách: **điềm tĩnh, chính xác, khuyến khích**.

### Brand Voice

Tiêu đề nói ngắn, chắc và giàu hình ảnh; CTA là lời mời học một hành động cụ thể, không phải khẩu hiệu chung chung. Microcopy giải thích như một người hướng dẫn thân thiện, ưu tiên tiếng Việt và giữ thuật ngữ Hán cần thiết.

Ví dụ:

> “Gõ một chữ. Nhìn thấy cách nó được dựng lên.”

> “Bắt đầu từ nét đầu tiên.”

### Wordmark & Logo

Logo là một dấu vuông xanh chàm chứa nét `一` màu ngà bị cắt nhẹ ở góc, tạo cảm giác con dấu nhưng vẫn gợi một nét bút đang mở. Wordmark dùng chữ Latin Fraunces với dấu chấm son ở giữa “Hanzi · Mapper”; không dùng tên sản phẩm trong font mặc định.

### Signature Brand Color

**Mực chàm `#17324D`** — màu nhận diện riêng, đủ đậm để làm nền cho chữ trắng và đủ ấm để đứng cạnh nền giấy ngà.

## Quyết định thực thi

Web app sẽ ưu tiên tra cứu offline với dữ liệu chữ phồn thể mẫu có thể mở rộng. Mỗi kết quả hiển thị chữ Hán lớn, bộ thủ chính, các thành phần, cấu trúc trái–phải/trên–dưới/bao quanh, số nét, thứ tự nét mô phỏng và một ghi chú học TOCFL. Dữ liệu không có trong bộ mẫu sẽ hiển thị trạng thái chưa có dữ liệu thay vì bịa thông tin.
