# THE LAST FREQUENCY — Night Shift

Game giải đố / sinh tồn vô tuyến, tiếng Việt. Năm 1974, một điện báo viên phải khôi phục mạng CHRONOS trước khi cửa sổ liên lạc đóng lại.

## Chạy

Node.js 22+ (đã kiểm tra với 24), npm 10+.

```sh
npm ci
npm run dev
```

Mở địa chỉ do Vite hiển thị. `npm run build` tạo bản tĩnh trong `dist/`; `npm run preview` chạy thử bản build. Có thể triển khai `dist/` lên dịch vụ hosting tĩnh. Game không cần tài khoản, API key, backend hoặc CDN khi chơi. Không mở `index.html` trực tiếp bằng `file://`.

## Gameplay

1. Chọn Tân binh (18 phút), Điện báo viên (12 phút) hoặc Cựu binh (9 phút), nhận ca trực.
2. Dò vùng tần số hiển thị trong nhiệm vụ. Căn anten để tăng S-Meter. Hướng dẫn nhiệm vụ luôn gợi ý vùng và hướng, không tự thu hộ người chơi.
3. Giữ **THU BẢN TIN** / **Space** đến khi ghi đủ. Tần số ổn định và tín hiệu đủ mạnh mới có tiến độ. Mất sóng / buông nút làm tiến độ lùi. Bản tin đã lưu không thể dùng để farm điểm.
4. Theo dõi pin và nhiệt. Thu một trạm mới hồi 7% pin. Tắt **PWR** để sạc chậm và hạ nhiệt, nhưng vẫn tốn thời gian. **C** dùng một trong 3 bình làm mát (−45°C). Quá nhiệt sẽ ngắt máy 8 giây và mất 8% pin.
5. **R** quét một trạm chưa thu: tốn 3% pin, hồi 18 giây. Máy chỉ dò thô; vẫn phải tinh chỉnh và căn anten. Bão từ bắt đầu ở giây 60 mỗi chu kỳ 90 giây, kéo dài 18 giây, làm trôi tần số và tăng nhiệt.
6. Thu 5 bản tin, mở **HỒ SƠ & KHÓA SỐ**, đọc dữ kiện liên kết để tìm khóa 4 số. Nhập sai mất 5% pin và 15 giây.
7. Mở khóa CHRONOS, tìm tần số cuối theo phép tính trong hồ sơ, anten 80°, giữ **PHÁT SOS** đủ 8 giây để thắng.

**P** bật/tắt nguồn · **← / →** dò sóng · **Shift + ← / →** bước 0.01 MHz · **J** hồ sơ · **K** bản đồ sóng · **M** tắt tiếng · **Esc** tạm dừng / tiếp tục.

Trên điện thoại, bảng trạng thái cuộn riêng; anten, dò tần và nút thu luôn nằm trong thanh điều khiển cố định. Thanh chức năng dưới cùng mở Hồ sơ, Bản đồ và Cài đặt; nút ? mở hướng dẫn, II tạm dừng. Bố cục tự đổi thành hai cột khi xoay ngang, chừa vùng tai thỏ / thanh Home. Các nút có vùng chạm tối thiểu 44 px. Thiết bị cảm ứng mặc định dùng chất lượng đồ họa tiết kiệm; có thể đổi trong Cài đặt. Các nút và thanh trượt hỗ trợ cảm ứng. Space không dùng khi đang gõ ghi chú. Đọc hồ sơ hoặc mở menu sẽ tự dừng tài nguyên và đồng hồ; đổi tab sẽ tạm dừng. Game tự lưu trên trình duyệt mỗi giây; bản ghi đang thu dở phải thu lại sau khi tải lại. Lưu dữ liệu phụ thuộc quyền localStorage của trình duyệt. Xóa băng chỉ xóa ca hiện tại, giữ kỷ lục theo độ khó.

## Kiểm tra

```sh
npm test
npm run build
npm run test:e2e
```

Bộ E2E dùng Chromium hệ thống tại `/usr/bin/chromium`. Có thể đặt `CHROMIUM_PATH` nếu máy dùng đường dẫn khác. Bộ kiểm thử kiểm tra khởi động WebGL, thu thủ công, lưu / tiếp tục, tạm dừng, toàn bộ câu đố và SOS, chơi lại, báo cáo thất bại và màn hình di động. Mô hình gameplay riêng trong `src/mission.js` được kiểm tra không cần trình duyệt.

## Mã nguồn

- `src/mission.js`: tài nguyên, thời gian, bão, thu tín hiệu, tính điểm, thắng/thua, kiểm tra bản lưu.
- `src/main.js`: kế thừa cảnh 3D, âm thanh tổng hợp và hồ sơ của bản V2.2; bổ sung điều khiển nhiệm vụ.
- `src/styles.css`: bảng điều khiển Night Shift và giao diện responsive.
- `index.html`: nội dung, hồ sơ và thiết bị radio gốc, cập nhật hướng dẫn gameplay.

Nâng cấp từ tệp `THE_LAST_FREQUENCY_V2.2_SIGNAL_WORKBENCH.html` do chủ dự án cung cấp. Âm thanh và phần lớn vật thể được dựng bằng code. Không có tài nguyên âm thanh tải ngoài. Trình duyệt cần thao tác người dùng để bật AudioContext; khi WebGL không khả dụng, HUD vẫn cho phép chơi đầy đủ.
