# Đưa món quà lên GitHub Pages

1. Giải nén ZIP. Bên trong phải thấy trực tiếp `index.html`, các tệp CSS/JavaScript và thư mục `assets`.
2. Tạo hoặc mở repository GitHub dùng cho món quà. Vào **Add file → Upload files** và tải toàn bộ các tệp/thư mục đã giải nén lên nhánh `main`. Giữ `index.html` ngay ở thư mục gốc của repository, không lồng thêm một thư mục `hmy-v22` bên ngoài.
3. Bấm **Commit changes**.
4. Vào **Settings → Pages → Build and deployment**. Chọn **Deploy from a branch**, nhánh **main**, thư mục **/(root)**, rồi **Save**.
5. Đợi GitHub hiển thị địa chỉ được xuất bản trong trang Pages. Dùng đúng địa chỉ GitHub cung cấp; không lấy địa chỉ của trang xem mã nguồn.
6. Mở địa chỉ HTTPS đó trên Safari iPhone. Bấm đánh thức Tiny, mở HMY Radio, thử chọn cả hai bài mới và phát video trong album.

Tệp `.nojekyll` đã có trong gói để xuất bản trực tiếp website tĩnh. Không cần npm, trình biên dịch hoặc dịch vụ bên thứ ba để chạy phần quà. Đường dẫn tài nguyên đều là đường dẫn tương đối nên dùng được cả khi website nằm trong thư mục tên repository.

Nếu có lỗi 404 ảnh/nhạc, kiểm tra đã tải nguyên thư mục `assets`, tên tệp đúng chữ hoa/thường và `index.html` nằm đúng thư mục nguồn xuất bản. Nếu giao diện còn cũ sau khi cập nhật, mở một tab riêng tư mới để kiểm tra bản vừa triển khai.

Tài liệu chính thức: [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
