# Định hướng nhận diện chữ viết tay

Google Input Tools mô tả luồng viết tay là: người dùng viết trên panel bằng chuột hoặc trackpad, hệ thống hiển thị các ký tự ứng viên phù hợp và người dùng chọn một ứng viên. Đây là mẫu UX phù hợp để áp dụng cho Hanzi Radical Mapper: không tự động quyết định một chữ duy nhất khi độ chắc chắn thấp.

Đề xuất Web Handwriting Recognition của WICG có tham chiếu đến các hệ thống như Windows Ink, Apple PencilKit, Google ML Kit và MyScript, nhưng đây chưa phải API web phổ cập để có thể dựa vào trong một static web app. Vì vậy phiên bản hiện tại nên triển khai canvas viết tay + bộ ứng viên cục bộ theo chữ mẫu, đồng thời để kiến trúc mở cho việc nối dịch vụ nhận diện thật sau này.

Nguồn:

1. Google Input Tools — Handwriting: https://www.google.com/inputtools/services/features/handwriting.html
2. WICG — Handwriting Recognition Explainer: https://github.com/WICG/handwriting-recognition/blob/main/explainer.md
