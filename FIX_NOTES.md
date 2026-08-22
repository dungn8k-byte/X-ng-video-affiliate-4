# XƯỞNG VIDEO AFFILIATE 4.0 — FIX PASS 1

Các thay đổi tập trung vào lỗi Preview/runtime và tính nhất quán của Voice Factory:

1. **Vite ESM runtime**: sửa `vite.config.ts` để tự tạo `__dirname` từ `import.meta.url`. Project dùng `"type": "module"`, vì vậy dùng `__dirname` trực tiếp có thể làm Vite config lỗi ở Node ESM.
2. **Không còn màn hình trắng vô thông tin**: thêm `AppErrorBoundary` ở root. Nếu React runtime lỗi, app hiển thị lỗi chẩn đoán thay vì Preview trắng hoàn toàn.
3. **Audio Bank dùng Project ID ổn định**: Voice Factory không còn dùng tên sản phẩm (có thể thay đổi) làm khóa localStorage. App remount Voice Factory theo Project ID để ngăn state của project cũ bị ghi nhầm sang project mới.
4. **Khôi phục audio thống nhất**: thêm `hydrateAudioBank`, ưu tiên dữ liệu lưu bền vững mới hơn snapshot project, kiểm tra dữ liệu hỏng và không restore `blob:` URL hết hiệu lực.
5. **Project P001 đọc dữ liệu hiện hành**: sample/restore P001 lấy project đã lưu thay vì luôn dùng snapshot hằng `PROJECT_P001`.
6. **Duration QC không giả lập PASS**: file audio không đọc được trả duration `0`, không còn fallback 18 giây. Placeholder không-audio được đánh dấu `DURATION MISMATCH`, không PASS giả.
7. **Duyệt Voice an toàn**: chặn duyệt khi thiếu audio, duration <= 0 hoặc lệch > 1 giây.
8. **Immutable lock rõ ràng**: chỉ cho ghi đè Voice đã duyệt sau hành động mở khóa xác nhận rõ ràng.
9. **TypeScript tooling**: thêm `@types/react` và `@types/react-dom` vào devDependencies.

## Kiểm tra đã thực hiện

- Parse/type syntax trên các file sửa bằng TypeScript `--noResolve`: không phát hiện lỗi cú pháp/type cục bộ sau khi loại trừ dependency chưa cài trong container.
- Không gọi Gemini TTS, không thay đổi API key, không tạo audio mới.

## Cách test trong AI Studio

Import/remix source này, mở Preview trước. Nếu có runtime exception, Error Boundary sẽ hiển thị message thay vì màn hình trắng. Sau đó nạp P001 và kiểm tra Voice Factory.
