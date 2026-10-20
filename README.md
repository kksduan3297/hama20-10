# Hà My ♡ Một vũ trụ nhỏ — V22

Món quà 20/10 của Duẫn dành cho Lê Hà My. Giao diện hồng kem, Tiny mắt cyan, không quảng cáo, không thư viện hoặc phông chữ phải tải từ bên ngoài.

## Mở và đưa lên web

Giải nén ZIP. Đưa **toàn bộ nội dung** thư mục có `index.html` lên hosting; giữ nguyên cấu trúc `assets/`. Không tải riêng một tệp HTML mà bỏ quên ảnh/nhạc.

Hướng dẫn GitHub Pages nằm trong `HUONG_DAN_GITHUB_PAGES.md`. Nếu đang dùng Netlify, vào dự án cũ → Deploys → triển khai thủ công thư mục này để giữ địa chỉ cũ. ZIP không tự cập nhật đường dẫn web đã gửi trước đó.

## Những gì có trong bản này

- Tiny SVG mới, mắt LED nhiều biểu cảm, vuốt ve, má hồng, nơ lớn và lời thoại riêng.
- Chạm/vuốt tạo vệt tim; giải mã chữ; bó hoa có nét vẽ vàng, gấu và mưa hoa.
- Hồ sơ HMY97, quét độ dễ thương và bốn thẻ tâm sự đã sửa nội dung.
- Bắt sáu tim → tụ tim → hạt giống rơi → cây với 280 lá tim.
- Nút Hà My né bốn lần rồi đáp án Đức Duẫn mới sáng; không có giới hạn thời gian.
- Đồng cỏ trồng ba hoa, cỏ bốn lá tích năng lượng bằng nhấn giữ hoặc chạm nhiều lần.
- Ba sao băng tới lần lượt, điều ước đọc lại được, chòm sao và supernova.
- Ghép ảnh 3×3 bằng cách chạm hai mảnh để đổi chỗ, rồi mở két 3297.
- Rèm mở ra hành tinh ảnh; Rover có tiếng bíp; album đủ **24 ảnh + 1 video**.
- Phong bì mở thành thư năm trang; ảnh nổi quanh thư; sổ năm câu hỏi và lời nhắn tùy chọn.
- HMY Radio đủ **5 bài**: Gói Con Tim Làm Quà, Chờ chút..., Giai điệu của Tiny, Ngày Đầu Tiên, Phép Màu. Một phần tử audio duy nhất; chuyển hết năm bài theo vòng; chọn bài, tua và chỉnh âm lượng.

## Tệp chính

- `index.html`: giao diện và hộp thoại.
- `styles.css`: bố cục, từng nền và chuyển động của các màn.
- `app.js`: luồng, trò chơi, album, radio, thư và sổ câu hỏi.
- `content.js`: toàn bộ nội dung cá nhân hóa và danh sách tài nguyên.
- `tiny.js`, `tiny.css`, `effects.js`: Tiny và hệ hạt hiệu ứng.
- `assets/`: 24 ảnh kỷ niệm, ảnh hồ sơ, ảnh cắt vuông cho trò ghép hình, 5 MP3, video MP4 cùng MOV gốc và ảnh poster. Bản MP4 và MOV là cùng một video.
- `ASSET_MANIFEST.json`: đối chiếu nguồn tài nguyên.
- `QA_REPORT.md`: phạm vi và kết quả kiểm tra.

## Cách hoạt động trên điện thoại

Nhạc bắt đầu sau khi chạm đánh thức Tiny hoặc bấm Phát. Âm lượng web dùng Web Audio Gain khi trình duyệt hỗ trợ; nút âm lượng vật lý của iPhone vẫn điều chỉnh được mức âm thanh thiết bị. Cửa sổ nhạc nằm ngoài các lớp chuyển động, giới hạn theo chiều rộng/cao màn hình, cuộn bên trong và có vùng chạm lớn. Hiệu ứng không chặn nút hay thao tác vuốt.

Ảnh được tối ưu, có lazy loading; video web là H.264/AAC trong MP4 với faststart. Hệ hạt giới hạn số lượng phần tử động, tự ngừng khi tab ẩn và tôn trọng cài đặt giảm chuyển động.

## Những điều cần biết

Đã đạt 29 kiểm tra tĩnh và 55 kiểm tra hành vi DOM mô phỏng. **Chưa xác nhận trực quan trên Safari/iPhone thật**, nên không coi kết quả đó là chứng nhận tương thích tuyệt đối. Mở bản HTTPS trên iPhone để thử radio, âm lượng và video trước khi gửi quà.

Sổ câu hỏi chỉ lưu trong trình duyệt của người mở. Bấm Sao chép/Chia sẻ để chủ động gửi qua ứng dụng nhắn tin; website không tự gửi phản hồi về Duẫn. Mã két là một trò chơi trong câu chuyện; tệp ảnh vẫn là tài nguyên của website tĩnh.

Nút xem lại từ đầu đặt lại các trò chơi và điều ước, giữ lựa chọn nhạc và các lời nhắn đã lưu. Có thể xem lại album, thư và điều ước ở cuối hành trình.
