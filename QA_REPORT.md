# Kiểm tra Hà My V22

Kết quả cuối: **29 kiểm tra tĩnh và 55 kiểm tra hành vi bằng DOM mô phỏng đều đạt**. Báo cáo này mô tả đúng phạm vi kiểm tra, không thay thế kiểm thử trên Safari/iPhone thật.

Đã kiểm tra:

- Cú pháp cả bốn tệp JavaScript; cấu trúc HTML, ID duy nhất, ID được JavaScript tham chiếu, thứ tự tải script và đường dẫn tài nguyên.
- Đủ 24 ảnh kỷ niệm khác nhau, 1 video và 5 bài nhạc. Tất cả bài nhạc có metadata thời lượng hợp lệ. Video phát trên web dùng H.264, yuv420p và MP4; bản MOV gốc được giữ riêng.
- Tiny thức dậy khi chạm, hiện chữ giải mã, đeo nơ; toàn bộ luồng qua 11 cảnh, mở hoa, bắt đủ tim và cây có 280 lá.
- Đáp án Đức Duẫn chỉ mở sau bốn lần trêu; ba bông hoa, cỏ bốn lá, ba điều ước xuất hiện theo thứ tự.
- Ghép chín mảnh bằng các thao tác đổi chỗ hợp lệ; mã sai bị từ chối, mã 3297 mở két; rèm, quỹ đạo ảnh, album và cửa sổ ảnh/video.
- Năm lựa chọn nhạc, điều chỉnh âm lượng, tự chuyển bài, chỉ một phần tử audio; logic tạm dừng nhạc khi xem video và khôi phục sau khi đóng.
- Thư lật trang, sổ câu hỏi lưu trên trình duyệt và sao chép lời nhắn; xem lại từ đầu xóa đủ tiến độ, Tiny ngủ lại và có thể đánh thức lần nữa.

Những lỗi tích hợp đã được phát hiện và sửa trước lượt kiểm tra cuối: chữ giải mã còn bị ẩn; nút trốn bị lệch vì `translateX`; hệ tọa độ chòm sao; màu ngày mới ảnh hưởng các cảnh đêm; hiệu ứng cây, thanh tích năng lượng và lớp bố cục Tiny chưa khớp; nhãn lưu lời nhắn chưa đúng hành vi.

Giới hạn: DOM mô phỏng kiểm tra được luồng và trạng thái, **không xác nhận bố cục pixel, thao tác cảm ứng thật, chất lượng nghe nhạc, hiệu năng hoạt ảnh hoặc khả năng phát trên iOS Safari**. Môi trường không có binary Chromium/WebKit, và tải binary không thành công. `tinycss2` không được cài; chưa có kiểm tra CSS bằng parser chuyên dụng. Các dấu ngoặc CSS cân bằng. Nếu có thêm lượt thử bằng trình duyệt thật, kết quả của lượt đó cần được ghi riêng.
