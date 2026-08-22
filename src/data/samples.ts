export interface SampleProduct {
  id: string;
  name: string;
  price: string;
  category: string;
  description: string;
  targetAudience: string;
  platform: 'TikTok' | 'Facebook Reels' | 'YouTube Shorts';
  conceptCount: 3 | 5 | 10;
  imageThumbnail: string; // SVG or data URL
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'sample-1',
    name: 'Máy Xay Sinh Tố Mini Cầm Tay 6 Lưỡi Dao Sạc USB',
    price: '289.000 ₫ (Giảm từ 450.000 ₫)',
    category: 'Gia dụng & Nhà bếp',
    description: `Dung tích 400ml, cối thủy tinh Borosilicate chịu nhiệt cao cấp, 6 lưỡi dao bằng thép không gỉ 304 sắc bén, tốc độ quay 18.000 vòng/phút. Pin sạc dung lượng 2000mAh qua cổng Type-C, xay được 10-12 ly sau một lần sạc đầy. Có tính năng tự ngắt thông minh khi mở nắp hoặc cối chưa khớp ren an toàn. Trọng lượng nhẹ 450g, đi kèm nắp đậy thể thao mang đi làm, tập gym, du lịch.`,
    targetAudience: `Dân văn phòng, gymer, mẹ bỉm sữa bận rộn, sinh viên muốn tự chuẩn bị sinh tố trái cây/nước ép tươi nhanh gọn mỗi sáng tại công sở hoặc phòng trọ.`,
    platform: 'TikTok',
    conceptCount: 5,
    imageThumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23f0fdf4"/><rect x="130" y="80" width="140" height="200" rx="20" fill="%2322c55e" opacity="0.85"/><rect x="150" y="100" width="100" height="120" rx="10" fill="%23ffffff" opacity="0.9"/><circle cx="200" cy="160" r="25" fill="%23f87171"/><rect x="170" y="240" width="60" height="15" rx="5" fill="%23ffffff"/><circle cx="200" cy="247" r="4" fill="%2315803d"/><rect x="155" y="60" width="90" height="25" rx="8" fill="%23166534"/><text x="200" y="320" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23166534" text-anchor="middle">MÁY XAY MINI USB 6 LƯỠI</text><text x="200" y="345" font-family="sans-serif" font-size="12" fill="%2315803d" text-anchor="middle">Cối thủy tinh - Sạc Type-C - 400ml</text></svg>`,
  },
  {
    id: 'sample-2',
    name: 'Serum Phục Hồi & Cấp Ẩm Chuyên Sâu B5 + Hyaluronic Acid 2% (30ml)',
    price: '345.000 ₫ (Flash Sale Tặng Kèm Kem Chống Nắng Mini)',
    category: 'Mỹ phẩm & Chăm sóc da',
    description: `Thành phần chính gồm Vitamin B5 (Panthenol 5%) kết hợp Hyaluronic Acid đa phân tử 2% và chiết xuất Rau Má Centella Asiatica. Kết cấu lỏng nhẹ, thấm nhanh không nhờn rít. Hỗ trợ làm dịu da ửng đỏ, cấp ẩm sâu, phục hồi hàng rào bảo vệ da sau khi treatment (AHA/BHA/Retinol) hoặc đi nắng. Dung tích 30ml chai thủy tinh vòi nhỏ giọt tiện lợi, không cồn khô, không hương liệu nhân tạo.`,
    targetAudience: `Các bạn trẻ 18 - 35 tuổi thường xuyên thức khuya, da khô ráp, da đang treatment cần phục hồi nhanh hoặc người có làn da nhạy cảm dễ kích ứng thời tiết.`,
    platform: 'TikTok',
    conceptCount: 5,
    imageThumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23eff6ff"/><rect x="145" y="120" width="110" height="170" rx="16" fill="%233b82f6" opacity="0.85"/><rect x="160" y="140" width="80" height="100" rx="8" fill="%23ffffff" opacity="0.95"/><rect x="180" y="70" width="40" height="50" rx="6" fill="%231d4ed8"/><path d="M190 70 Q200 40 210 70 Z" fill="%231e40af"/><text x="200" y="190" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231d4ed8" text-anchor="middle">B5 + HA 2%</text><text x="200" y="210" font-family="sans-serif" font-size="10" fill="%2364748b" text-anchor="middle">SERUM PHỤC HỒI</text><text x="200" y="330" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e3a8a" text-anchor="middle">SERUM B5 PHỤC HỒI DA</text><text x="200" y="355" font-family="sans-serif" font-size="12" fill="%233b82f6" text-anchor="middle">Làm dịu ửng đỏ - Cấp ẩm căng bóng</text></svg>`,
  },
  {
    id: 'sample-3',
    name: 'Tai Nghe Bluetooth True Wireless Chống Ồn Chủ Động ANC & ENC 4 Mic',
    price: '499.000 ₫ (Tặng Bao Silicon Chống Sốc)',
    category: 'Thiết bị công nghệ & Phụ kiện',
    description: `Chip Bluetooth 5.4 mới nhất với độ trễ siêu thấp 38ms chuyên chơi game và xem phim. Chống ồn chủ động ANC lên đến -35dB và chống ồn đàm thoại ENC 4 micro lọc gió ngoài đường cực trong. Thời lượng pin 7 giờ nghe liên tục, hộp sạc nâng tổng thời gian lên 35 giờ. Kháng nước và mồ hôi IPX5, điều khiển cảm ứng chạm đa điểm mượt mà.`,
    targetAudience: `Học sinh, sinh viên, người đi làm thường xuyên di chuyển ngoài đường, game thủ mobile, người cần không gian yên tĩnh làm việc tại quán cafe hoặc văn phòng ồn ào.`,
    platform: 'Facebook Reels',
    conceptCount: 3,
    imageThumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%230f172a"/><rect x="120" y="110" width="160" height="110" rx="30" fill="%23334155"/><rect x="135" y="125" width="130" height="80" rx="20" fill="%231e293b"/><circle cx="170" cy="165" r="18" fill="%2338bdf8"/><circle cx="230" cy="165" r="18" fill="%2338bdf8"/><circle cx="200" cy="165" r="4" fill="%2322c55e"/><text x="200" y="270" font-family="sans-serif" font-size="16" font-weight="bold" fill="%2338bdf8" text-anchor="middle">TAI NGHE BLUETOOTH ANC</text><text x="200" y="295" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">Chống ồn -35dB - Pin 35h - Chống nước IPX5</text></svg>`,
  },
  {
    id: 'sample-4',
    name: 'Áo Polo Nam Thể Thao Vải Tổ Ong Air-Cool Co Giãn 4 Chiều',
    price: '199.000 ₫ (Mua 2 Áo Miễn Phí Vận Chuyển)',
    category: 'Thời trang nam',
    description: `Chất liệu dệt tổ ong Air-Cool 95% Poly chống nhăn và 5% Spandex co giãn đàn hồi 4 chiều. Bề mặt vải thoáng khí, thấm hút mồ hôi cực nhanh, không bai dão không xù lông sau khi giặt máy. Thiết kế cổ bẻ dệt bo viền phối cúc ẩn tinh tế, phom Regular Fit tôn dáng nam tính, mặc đi làm công sở, chơi golf, đánh cầu lông hoặc đi cafe cuối tuần.`,
    targetAudience: `Nam giới độ tuổi 22 - 45 thích phong cách lịch sự nhưng thoải mái, người hay chơi thể thao ngoài trời hoặc nhân viên văn phòng năng động.`,
    platform: 'YouTube Shorts',
    conceptCount: 3,
    imageThumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23f8fafc"/><path d="M120 120 L160 80 L240 80 L280 120 L250 150 L230 130 L230 280 L170 280 L170 130 L150 150 Z" fill="%230284c7"/><path d="M170 80 L200 130 L230 80 Z" fill="%230369a1"/><text x="200" y="320" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">ÁO POLO AIR-COOL CO GIÃN</text><text x="200" y="345" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">Vải dệt tổ ong - Chống nhăn - Thấm hút</text></svg>`,
  },
  {
    id: 'sample-5',
    name: 'Giày Mary Jane Nữ Da Bò Mũi Tròn Phối Nơ & Khóa Cài Cổ Điển',
    price: '59.600 ₫ (Flash Sale Tặng Kèm Tất Ren Vintage)',
    category: 'Giày dép & Thời trang nữ',
    description: `Chất liệu da bò thật mềm êm, mũi giày bo tròn cổ điển phối nơ da may tỉ mỉ, quai ngang Mary Jane bản mảnh với khóa cài kim loại ánh kim cao cấp. Đế cao su đúc nguyên khối chống trơn trượt cao 3.5cm tôn dáng, lót trong êm ái thoáng khí không đau chân khi đi bộ nhiều. Phong cách vintage Lolita / French Chic thanh lịch.`,
    targetAudience: `Nữ giới 18 - 32 tuổi yêu thích phong cách thời trang Vintage, Parisian Chic, Lolita nhẹ nhàng hoặc nữ sinh, dân công sở phối cùng váy xòe, blazer.`,
    platform: 'TikTok',
    conceptCount: 5,
    imageThumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23fef7ee"/><ellipse cx="160" cy="210" rx="45" ry="85" fill="%2378350f" transform="rotate(-25 160 210)"/><ellipse cx="240" cy="210" rx="45" ry="85" fill="%2378350f" transform="rotate(25 240 210)"/><rect x="135" y="195" width="50" height="10" rx="3" fill="%23d97706"/><rect x="215" y="195" width="50" height="10" rx="3" fill="%23d97706"/><circle cx="160" cy="155" r="9" fill="%23b45309"/><circle cx="240" cy="155" r="9" fill="%23b45309"/><text x="200" y="330" font-family="sans-serif" font-size="16" font-weight="bold" fill="%2378350f" text-anchor="middle">GIÀY MARY JANE NỮ DA BÒ</text><text x="200" y="355" font-family="sans-serif" font-size="12" fill="%23b45309" text-anchor="middle">Mũi tròn - Phối nơ - Khóa cài Vintage</text></svg>`,
  },
];
