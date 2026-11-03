# Thanh menu mobile & kim loại cũ

Theo yêu cầu sau V4.0 (`1f7fe98`), màn hình chơi mobile có thanh **Hồ sơ / Bản đồ sóng / Cài đặt / Menu** sát đáy. Bấm trực tiếp một lần để mở từng chức năng. **Thu / Fine** nằm ngay trên; ở landscape, hai nhóm nằm cùng một dải ngang để chừa chỗ cho radio.

Các nút gốc được di chuyển giữa mobile/desktop, không clone hoặc đăng ký lại handler. Sửa thêm việc CSS đổi breakpoint làm mất focus trước khi DOM chuyển chỗ; focus chủ động chuyển sang phần tử khác vẫn được tôn trọng. Overlay tiếp tục pause, nhả capture và chặn tương tác phía sau.

Lớp sơn bong/rỉ tập trung ở cạnh, góc, quanh vít và viền nút; giấy có vệt ố nhẹ. Texture SVG cục bộ tĩnh mô phỏng hao mòn nhiều năm, không có timer, shader mới hoặc thay đổi mission/save. Chữ và vùng chạm không bị lớp trang trí che.

## Ảnh ứng dụng WebGL thật

- [Mobile 320×568](radio-320x568.png)
- [Mobile 390×844](radio-390x844.png)
- [Landscape 844×390](radio-844x390.png)

Ảnh từ Chromium/SwiftShader, Low Quality, ứng dụng thực tế trong E2E. Không dùng fallback để chứng minh radio 3D.

## Kiểm tra

- `npm test`: 46 PASS.
- `npm run build`: PASS.
- Regression E2E liên quan: **43 PASS trong 6.3 phút**, 0 fail/skip; gồm 27 bài fallback/overlay và 16 bài WebGL thật (SwiftShader).
- Test bổ sung xác nhận 4 nút luôn nằm trong viewport, đủ vùng chạm 44 px, mở trực tiếp, giữ ghi chú, phục hồi focus và không nhân đôi control sau xoay/resize.
- Không chạy lại các suite mission clock/storage/gameplay không thay đổi trong lượt này; chúng đã PASS ở V4.0. CI GitHub chưa xác minh.

Lệnh kiểm thử: `CHROMIUM_PATH=/usr/bin/chromium npx playwright test tests/browser/mobile.spec.js tests/browser/quiet-room.spec.js tests/browser/radio-3d.spec.js tests/browser/webgl.spec.js tests/browser/overlays.spec.js`. Lượt đầu phát hiện lỗi focus qua breakpoint; đã sửa và chạy lại toàn bộ nhóm, giữ nguyên assert. Preview build và texture đều trả HTTP 200.
