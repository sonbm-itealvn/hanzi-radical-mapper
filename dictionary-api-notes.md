# Ghi chú tích hợp từ điển online

## Quyết định

Dữ liệu cục bộ vẫn được ưu tiên để giữ pinyin, zhuyin, loại từ, ví dụ và nội dung TOCFL đã biên soạn. Với cụm từ Hán từ hai chữ trở lên chưa có trong `COMMON_WORD_DATA`, app gọi MyMemory REST API với cặp ngôn ngữ `zh-TW|vi`, endpoint `https://api.mymemory.translated.net/get`, tham số `q` là cụm cần tra và `langpair` là `zh-TW|vi`.

## Kiểm tra

Endpoint trả JSON với `responseData.translatedText` và `matches`; truy vấn `日本` trả nghĩa `Nhật Bản`. Header phản hồi có `access-control-allow-origin: *`, nên có thể gọi từ web app tĩnh mà không cần connector hoặc API key. App dùng `AbortController` để giới hạn thời gian, cache kết quả trong phiên và hiển thị nhãn nguồn `MyMemory · zh-TW → VI` khi dùng fallback online.

## Giới hạn

MyMemory là lớp dịch fallback, không thay thế hoàn toàn một từ điển ngữ liệu TOCFL: kết quả online có thể chỉ có nghĩa tiếng Việt, không luôn có zhuyin, loại từ hoặc ví dụ. Nếu API lỗi, app giữ thẻ cụm với trạng thái rõ ràng và không xóa dữ liệu cục bộ.

## Nguồn đã đối chiếu

CCDB Chinese Character Web API cung cấp dữ liệu thuộc Unihan cho thông tin cấp ký tự và có CORS, nhưng không phải nguồn dịch cụm hoàn chỉnh. Vì vậy phiên bản hiện tại dùng MyMemory cho nghĩa cụm online, còn CCDB được giữ như hướng mở rộng cho bộ thủ/thông tin ký tự nếu cần.

## Kiểm tra preview

Đã mô phỏng nhập `日本` trên preview. Thẻ `TỪ ĐIỂN CỤM · TOCFL` hiển thị `Rìběn`, zhuyin `ㄖˋ ㄅㄣˇ`, nghĩa `Nhật Bản` và ví dụ `我想去日本。`. Đây là trường hợp dữ liệu cục bộ; cụm không có trong bộ cục bộ sẽ đi qua trạng thái tải online rồi hiển thị nhãn nguồn MyMemory nếu nhận được kết quả.

Đã mô phỏng nhập cụm ngoài dữ liệu cục bộ `美國`. Preview hiển thị thẻ `TỪ ĐIỂN ONLINE`, nghĩa `Mỹ Quốc`, trạng thái thiếu pinyin/zhuyin online và nhãn nguồn `MyMemory · zh-TW → VI`. Luồng chọn từng chữ `美` và `國` vẫn hoạt động.

## Đánh giá nguồn mới

CC-CEDICT là nguồn dữ liệu mở có chữ phồn thể, pinyin và nghĩa tiếng Anh, nhưng bản thân nguồn không cung cấp zhuyin hoặc REST API trực tiếp. Một repository API không chính thức dựa trên dữ liệu Yabla có traditional, pinyin, audio và meanings trong ví dụ tài liệu, nhưng endpoint demo `pinyin.test` không phải dịch vụ ổn định để phụ thuộc trong sản phẩm. Phương án an toàn hơn là dùng CC-CEDICT làm dữ liệu pinyin/nghĩa được đóng gói hoặc tra qua một dịch vụ chính thức có API, rồi chuyển pinyin sang zhuyin trong frontend bằng thư viện mã nguồn mở.

## Nguồn được chọn thay thế

Taiwan Mandarin API tại `https://api.taiwanmandarin.com` cung cấp endpoint `GET /words/:word` không cần khóa. Thử nghiệm `日本` trả `pinyin: rìběn`, `bopomofo: ㄖˋ ㄅㄣˇ`, nghĩa tiếng Anh, cấp TOCFL Novice 1, loại từ noun và dữ liệu đầy đủ cho `日`/`本` gồm pinyin, bopomofo, radical và số nét. Đây là nguồn phù hợp hơn MyMemory cho người học TOCFL chữ phồn thể Đài Loan.

Preview sau khi nhập `美國` đã chuyển sang trạng thái `Đang tra cụm online…`; cần chờ đủ thời gian cho hai endpoint Taiwan Mandarin và dịch Việt để xác nhận thẻ kết quả cuối cùng.

Sau khi chờ phản hồi, thẻ `美國` hiển thị `měiguó`, `ㄇㄟˇ ㄍㄨㄛˊ`, loại từ `noun · Novice 1`, nghĩa `Mỹ Quốc`, nghĩa gốc `United States of America; USA; US` và nguồn `Taiwan Mandarin API · zh-TW + MyMemory VI`.
