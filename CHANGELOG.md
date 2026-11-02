# Changelog

## 3.2.0 — Stability & Fair Play

- Pin E2E Ubuntu 24.04 cho Playwright 1.56.1, giữ validation độc lập và artifacts khi lỗi; không nâng dependency.
- Đồng hồ monotonic, simulation 20 Hz, không mất thời gian ở FPS thấp; pause/hidden/offline không cộng giờ. Stall >2 giây không tự thu, tính đầy đủ tài nguyên chờ, xóa tiến độ không hợp lệ qua khoảng treo và báo HUD; không tự mở modal trong tab foreground.
- Penalty mã sai kiểm tra terminal ngay; đóng Journal và hiển thị loss report, lưu trạng thái và chặn hành động tiếp.
- Pointer ownership riêng cho drag/hold; Space và touch không nhả lẫn nhau; cleanup trên blur/overlay/resize.
- Reception evaluator dùng chung cho gameplay/HUD; boundary deadline, pin, quá nhiệt và restore được kiểm tra.
- Throttle telemetry 10 Hz, tránh ghi text/HTML không đổi; disconnect one-shot audio nodes, chặn thunder/scheduler ngoài trạng thái hợp lệ.
- Low Quality giới hạn buffer 360.000 pixel trên canvas lớn và đồng bộ shadow khi đổi chất lượng; camera/hit area không đổi.
- Journal hidden thắng flex CSS; giữ nguyên radio 3D, camera, mobile dock, CHRONOS, luật độ khó và migration.
- Thêm regression unit, thời gian trình duyệt, touch nhiều ngón và khôi phục WebGL. Bằng chứng và giới hạn trong `docs/V3.2-report.md`.

## 3.1.0 — Immersive Radio Console

- Central overlay/Escape policy, focus containment and restoration, inert background, terminal-safe Pause/Resume, one keyboard pipeline and native modifier/IME support.
- Actual mobile 3D stage with portrait/landscape layouts; canvas-relative raycasting, incremental bounded tuning/volume drag with fractional movement retained for slow one-pixel/fine gestures, larger non-overlapping 3D hit areas and reliable gesture release.
- Cabinet/control bounding-box camera framing, one renderer/loop, resize smoothing, front fill light and physical control labels. Decorative aerial can extend beyond the cabinet framing.
- Powered-off CRT textures stop updating; imported motion/quality preferences immediately match the controls; freeplay resumes the existing AudioContext after returning from a hidden tab.
- Verified V2.2 v1-key migration with raw backup, explicit briefing choice, compatible archive and no unearned Night Shift progress. Hardened save validation, error reporting and bounded write frequency.
- Portable Playwright browser selection, Node 22 CI validation/E2E jobs, screenshots/traces/reports and expanded unit/integration/WebGL regressions.
- Mission frequencies, 7429 code, difficulty constants, resource formulas and score rules preserved. Only restore validation was hardened (known difficulty names, bounded arrays and integer counters).
