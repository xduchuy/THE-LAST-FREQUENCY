# THE LAST FREQUENCY V4.1 — Những dấu vết trong đêm

Game giải đố / sinh tồn vô tuyến, tiếng Việt. Năm 1974, một điện báo viên phải khôi phục mạng CHRONOS trước khi cửa sổ liên lạc đóng lại.

## Chạy

Node.js 22+ (`.nvmrc` chọn 22; máy kiểm tra hiện tại dùng 24), npm 10+.

```sh
npm ci
npm run dev
```

Mở địa chỉ do Vite hiển thị. `npm run build` tạo bản tĩnh trong `dist/`; `npm run preview` chạy thử bản build. Có thể triển khai `dist/` lên dịch vụ hosting tĩnh. Game không cần tài khoản, API key, backend hoặc CDN khi chơi. Không mở `index.html` trực tiếp bằng `file://`.

## Gameplay

1. Chọn Tân binh (18 phút), Điện báo viên (12 phút) hoặc Cựu binh (9 phút), nhận ca trực.
2. Mở **CÔNG CỤ / MENU → Sổ vận hành** để xem vùng tần số và hướng anten gợi ý. Căn anten để tăng S-Meter. Hướng dẫn nhiệm vụ luôn gợi ý vùng và hướng, không tự thu hộ người chơi.
3. Giữ **THU BẢN TIN** / **Space** đến khi ghi đủ. Tần số ổn định và tín hiệu đủ mạnh mới có tiến độ. Mất sóng / buông nút làm tiến độ lùi. Bản tin đã lưu không thể dùng để farm điểm.
4. Theo dõi pin và nhiệt. Thu một trạm mới hồi 7% pin. Tắt **PWR** để sạc chậm và hạ nhiệt, nhưng vẫn tốn thời gian. **C** dùng một trong 3 bình làm mát (−45°C). Quá nhiệt sẽ ngắt máy 8 giây và mất 8% pin.
5. **R** quét một trạm chưa thu: tốn 3% pin, hồi 18 giây. Máy chỉ dò thô; vẫn phải tinh chỉnh và căn anten. Bão từ bắt đầu ở giây 60 mỗi chu kỳ 90 giây, kéo dài 18 giây, làm trôi tần số và tăng nhiệt.
6. Thu 5 bản tin, mở **HỒ SƠ & KHÓA SỐ**, đọc dữ kiện liên kết để tìm khóa 4 số. Nhập sai mất 5% pin và 15 giây.
7. Mở khóa CHRONOS, tìm tần số cuối theo phép tính trong hồ sơ, anten 80°, giữ **PHÁT SOS** đủ 8 giây để thắng.

**P** bật/tắt nguồn · **← / →** dò sóng · **Shift + ← / →** bước 0.01 MHz · **J** hồ sơ · **K** bản đồ sóng · **M** tắt tiếng · **Esc** tạm dừng / tiếp tục.

**Radio là giao diện chính.** Trạng thái mặc định chỉ còn thời gian, pin, nhiệt, số bản tin và thanh Thu / Công cụ. Desktop có nút Hồ sơ; mobile có thanh menu cố định dưới cùng với **HỒ SƠ / BẢN ĐỒ SÓNG / CÀI ĐẶT / MENU**, mở trực tiếp bằng một chạm. **THU / FINE** nằm ngay phía trên. Chạm POWER, kéo núm TUNING để dò, kéo VOLUME để chỉnh âm lượng; các điều khiển 3D và HTML dùng cùng state. Nhãn tần số/tín hiệu chỉ hiện trong khi dò và khoảng 2 giây sau thao tác.

**Sổ vận hành** chứa Scanner, Làm mát, anten, thanh dò, nút bước tần số, nhiệm vụ, điểm/combo, các kênh đã khám phá và đồng hồ phụ. Scanner/Làm mát có ngay ở đầu menu; bấm sẽ đóng menu và thực hiện hành động. Mở menu dừng đồng hồ/tài nguyên, nhả thao tác đang giữ và chặn hotkey phía sau. Đóng menu trở lại radio. Các nút HTML vẫn hỗ trợ keyboard; khi WebGL lỗi, chúng tự chuyển ra vùng radio để chơi bằng fallback.

Mobile dành vùng giữa cho radio; thanh menu nằm sát đáy, tách khỏi hàng Thu/Fine để dễ chạm, có safe-area và bố cục ngang gọn trong một dải điều khiển. Chữ vẫn rõ trên lớp sơn phai/rỉ sét ở mép và quanh vít; texture tĩnh mô phỏng thiết bị đã dùng lâu năm, không thêm timer hay ảnh hưởng tài nguyên gameplay. Resize di chuyển đúng các DOM node đang dùng, không clone controls hoặc reset save. Hồ sơ dùng bốn tab **Bản tin / Giải mã / Bản đồ sóng / Ghi chú**; nội dung, xuất nhật ký và lưu ghi chú giữ nguyên.

Thiết bị cảm ứng mặc định dùng chất lượng tiết kiệm, DPR giới hạn, ít mưa/bụi và không có bóng động. Chế độ Low giới hạn buffer radio ở 360.000 pixel trên canvas lớn; CSS, camera và tọa độ chạm giữ nguyên. Chuyển chất lượng cũng cập nhật bóng động đúng chế độ. Người chơi có thể chọn chất lượng cao trong Cài đặt. Nếu WebGL không khả dụng, bộ điều khiển dự phòng xuất hiện trong vùng radio và toàn bộ trò chơi vẫn điều khiển được bằng HTML.

Escape đóng Sổ vận hành/Journal/Settings/Help trước, không mở Pause khi đóng tài liệu. Không có overlay: Escape tạm dừng/tiếp tục; thắng/thua giữ nguyên trạng thái terminal. Modal giữ focus, chặn thao tác phía sau và trả focus về nút mở khi đóng. Space không kích hoạt thu khi gõ ghi chú hoặc mở modal; nút Thu nhận Space khi được focus. Ctrl/Cmd/Alt và IME không bị hotkey game chiếm.

Đồng hồ ca trực dùng `performance.now()`, độc lập với animation; tài nguyên chạy bước cố định 50 ms. 18/12/9 phút được giữ nguyên cả khi FPS thấp. Chỉ ghi nhận thu liên tục khi cả hai mẫu đầu/cuối đều hợp lệ và vẫn giữ đúng trạm. Khoảng treo trên 2 giây tính đủ thời gian, pin chờ, hạ nhiệt, bão và cooldown đến hết ca; không cấp tiến độ thu hoặc tính giữ nút trong khoảng không quan sát được, báo trên HUD. Nếu vẫn giữ đúng pointer/phím, chỉ những mẫu hợp lệ mới sau khi hết treo mới tiếp tục thu. Tab đang hiển thị tiếp tục tính giờ; stall không tự mở menu Pause. Catch-up có giới hạn theo thời lượng ca, không chạy vô hạn.

Đọc hồ sơ hoặc mở menu tự dừng đồng hồ và tài nguyên. Rời tab sẽ tạm dừng và suspend AudioContext. Game gộp các yêu cầu lưu liên tiếp, định kỳ tối đa một lần/giây và flush khi rời trang; bản tin thu dở phải thu lại khi tải lại. Bản lưu phụ thuộc quyền localStorage của trình duyệt; lỗi lưu được báo rõ mà không chặn game.

## Những dấu vết trong đêm — V4.1

Mở **Bản đồ sóng** từ menu dưới cùng để dùng **Băng lưu tín hiệu**. Mỗi trạm đã thu có một băng xung Morse tổng hợp từ dữ liệu tín hiệu vô tuyến, kèm hiss nhẹ; đây là âm thanh PCM thật trong cùng AudioContext, không phải bản ghi giọng nói. Có phát/tạm dừng, dừng, lùi 2 giây, kéo vị trí và tốc độ 1× / 0.75× / 0.5×. Đổi tốc độ thay cả cao độ như máy băng analog. Băng tiếp tục khi chuyển sang Ghi chú để vừa nghe vừa suy luận; đóng Hồ sơ, mute, blur hoặc ẩn tab dừng phát. Băng tham chiếu trạm đã thu và được tái tạo cục bộ, không cần tải audio ngoài hoặc lưu file âm thanh lớn.

Trong **Hồ sơ → Ghi chú**, chọn phiếu đã thu để ghim lên **Bảng ghim điều tra**. Chọn một từ/con số có trong phiếu để khoanh, rồi chọn hai phiếu và nối dữ kiện. Có thể gỡ ghim/gỡ dây. Bảng, dấu khoanh, liên kết và ghi chú được lưu trên thiết bị; không tự giải khóa CHRONOS.

Sau khi thắng CHRONOS và chọn tiếp tục khám phá, **Bản đồ sóng → Ca trực sau bình minh** mở ba nhiệm vụ riêng:

| Ca phụ | Mục tiêu | Giới hạn |
| --- | --- | --- |
| Đài mất tích | Thu hai đài tiếp sức BOREALIS và K-19, mỗi đài giữ Thu 3 giây | 3 phút |
| Điện báo lúc bình minh | Thu ECHO-7, nghe/đọc Morse và nộp hai chữ số | 4 phút |
| Định hướng phao biển | Tìm ORPHEUS, căn anten mạnh nhất, thu và báo phương vị | 5 phút |

Ca phụ dùng lại radio và nút Thu thủ công, có tiến độ và deadline riêng. Mở menu/Hồ sơ hoặc rời tab dừng ca; khoảng treo dài không cho tiến độ thu. Kết quả CHRONOS, điểm và pin ca chính giữ nguyên; không được cộng điểm chính từ ca phụ. Reload không cộng thời gian offline, bản thu dở phải bắt lại. Nhận ca chính mới kết thúc ca phụ đang chạy và vẫn giữ thành tích ca phụ đã hoàn tất.

Âm thanh dò sóng giờ phản ánh rõ chất lượng anten, trượt tần và bão: gần sóng mang nghe phách, căn đúng thì nhiễu giảm. Trong bão của ca chính, mưa xiên nhanh hơn, tiếng mưa tăng nhẹ, đèn bàn và kim S-Meter dao động; Pause/overlay dừng phản ứng bão, Reduced Motion tắt dao động/chớp. Faceplate có texture oxy hóa/cọ mòn tạo một lần khi dựng scene, không thêm mesh che điều khiển hoặc texture mỗi frame.

Save V3/schema 31 giữ nguyên, thêm trường `fieldOperations` có giới hạn để đọc được save cũ. Chi tiết triển khai và bằng chứng: [V4.1 report](docs/V4.1-report.md).

## Hồ sơ cũ V2.2

Hỗ trợ khóa **đã xác minh từ HTML gốc** `the_last_frequency_save_v1`; không giả định có khóa v2. Nếu không có bản V3 hợp lệ, briefing cho phép khôi phục hoặc bắt đầu mới. Ghi chú, bản tin hợp lệ, dấu vết sóng và cài đặt tương thích được bảo toàn; hồ sơ trạm cũ xuất hiện ở **Archive V2.2** trong Journal. Ca Night Shift mới dùng tài nguyên mặc định, không được cấp điểm, tiến độ hoặc quyền CHRONOS từ V2.2.

Import sao lưu byte gốc vào `the_last_frequency_save_v1_backup_v31` trước khi ghi save V3. Không xóa khóa cũ. Save V3 hợp lệ luôn được ưu tiên. Dữ liệu JSON lỗi được sao lưu để phục hồi khi có thể; schema chưa hỗ trợ được giữ nguyên và khóa ghi đè. Thao tác migration thất bại có thể thử lại, không bị đánh dấu hoàn tất giả. Chỉ hỗ trợ dữ liệu cùng origin trình duyệt; HTML cũ chạy bằng file:// hay domain khác không thể tự đọc storage của nhau.


## Kiểm tra

```sh
npm test
npm run build
npm run test:e2e
```

Playwright ưu tiên `CHROMIUM_PATH` nếu được cấu hình, tiếp đến Chromium do Playwright quản lý. Nếu chưa cài browser quản lý và có `/usr/bin/chromium`, dùng binary local đó. Máy mới có thể chạy `npx playwright install --with-deps chromium`. Không cần token hoặc dịch vụ ngoài để chơi/test.

Bộ HUD/fallback chạy với WebGL bị tắt có chủ đích. Bộ `radio-3d.spec.js` và `webgl.spec.js` bật WebGL thật qua SwiftShader và kiểm tra mesh bằng pointer/touch thật; không coi fallback là chứng minh render 3D. Ma trận mobile gồm 320×568, 360×640, 390×844, 414×896, 667×375, 844×390, 768×1024; desktop 1440×900 và 1920×1080. Screenshot, trace và báo cáo nằm trong `test-results/`, `playwright-report/` (không commit).

`stability.spec.js` kiểm tra thời gian thực khi trì hoãn RAF (60/10/5/2), pause/hidden/reload, main-thread stall thật, HUD và mã sai dẫn đến thua ngay. Unit test mô phỏng cả 30 FPS và pause 30 giây. Multi-touch dùng Chromium CDP phát touch thật, không gán state. WebGL restoration dùng `WEBGL_lose_context` khi renderer hỗ trợ.

`.github/workflows/ci.yml` chạy trên push/PR vào main hoặc manual: hai job độc lập Node 22 cho unit/build và E2E; riêng E2E pin `ubuntu-24.04` tương thích Playwright 1.56.1, cài Chromium cùng OS dependencies, quyền read-only, timeout, concurrency cancellation và artifact khi lỗi. Workflow không deploy. Có workflow trong repo không có nghĩa đã xác minh CI xanh trên GitHub.

Báo cáo V4, ảnh trước/sau và kiểm thử: [docs/V4.0-report.md](docs/V4.0-report.md). Album ảnh chạy thật: [docs/v4-visuals](docs/v4-visuals/README.md).

Báo cáo baseline V3.2: [docs/V3.2-report.md](docs/V3.2-report.md) (bản trước: [V3.1](docs/V3.1-report.md)). Thay đổi phiên bản: [CHANGELOG.md](CHANGELOG.md).


## Mã nguồn

- `src/mission.js`: tài nguyên, thời gian, bão, thu tín hiệu, tính điểm, thắng/thua, kiểm tra bản lưu.
- `src/mission-clock.js`: đồng hồ monotonic, accumulator, pause/resume và chính sách stall.
- `src/reception.js`: thông báo HUD cho kết quả đánh giá thu dùng chung từ mission.
- `src/main.js`: kế thừa cảnh 3D, âm thanh tổng hợp và hồ sơ của bản V2.2; bổ sung điều khiển nhiệm vụ.
- `src/overlay-manager.js`: overlay stack, Escape policy, inert và focus.
- `src/input-manager.js`: một keyboard pipeline, input guard và toán drag/pointer.
- `src/storage.js`: validation, backup, migration và persistence.
- `src/camera-framing.js`: fit bounding box mặt máy và controls theo canvas thực; aerial trang trí có thể vượt ngoài khung.
- `src/mobile-layout.js`: di chuyển lại chính DOM control, không nhân đôi state/listener.
- `src/styles.css`: bảng điều khiển Night Shift và giao diện responsive.
- `index.html`: nội dung, hồ sơ và thiết bị radio gốc, cập nhật hướng dẫn gameplay.

Nâng cấp từ tệp `THE_LAST_FREQUENCY_V2.2_SIGNAL_WORKBENCH.html` do chủ dự án cung cấp. Âm thanh và phần lớn vật thể được dựng bằng code. Không có tài nguyên âm thanh tải ngoài. Trình duyệt cần thao tác người dùng để bật AudioContext; khi WebGL không khả dụng, HUD vẫn cho phép chơi đầy đủ.

Trong dev có `window.__radioDiagnostics()` chỉ đọc để QA đo tọa độ control, state đồng bộ, bộ nhớ renderer và AudioContext; không có API sửa state hoặc tạo vòng lặp mới.

`quiet-room.spec.js` kiểm tra menu dừng đồng hồ, hotkey/focus, Scanner/Làm mát, bốn tab và thông báo theo ngữ cảnh. Các bài radio 3D kiểm tra canvas không bị UI che và so sánh kích thước vùng radio với baseline đã chụp. Xem báo cáo phiên bản để biết kết quả thực tế; không suy ra CI xanh chỉ từ cấu hình.

Bản chỉnh thanh menu mobile và lớp rỉ sét: [ảnh và kiểm thử](docs/mobile-menu/README.md).
