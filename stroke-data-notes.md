# Đối chiếu dữ liệu stroke

Tài liệu chính thức của Hanzi Writer và Make Me a Hanzi xác nhận dữ liệu `strokes` dùng hệ tọa độ 1024×1024 bất thường: trục y giảm khi đi xuống. Vì vậy không được vẽ trực tiếp path vào `viewBox="0 0 1024 1024"`; phải bọc path trong group có transform tương đương `scale(1, -1) translate(0, -900)` hoặc dùng transform scaling của Hanzi Writer.

Trong component hiện tại, `HanziStrokeCanvas.tsx` đang vẽ trực tiếp `<path d={stroke}>` và `<path d={median}>` mà chưa có group transform. Đây là nguyên nhân khiến hướng dẫn nét bị lộn chiều so với glyph chữ hiển thị. Cần sửa cả canvas lớn và thumbnail, đồng thời đặt glyph chữ nền sau cùng để đối chiếu đúng.

Nguồn:

1. Hanzi Writer Docs — Raw character SVG: https://hanziwriter.org/docs.html
2. Make Me a Hanzi — Stroke data coordinate system: https://github.com/skishore/makemeahanzi
