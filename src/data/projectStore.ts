import {
  ProductionProject,
  ProductionSheetData,
  VideoVariation,
  RestoredAssetBank,
  AssetReadinessState,
  QcEvaluation,
  AudioBankItem,
} from '../types';
import { SAMPLE_PRODUCTS } from './samples';
import { safeUtf8ToBase64 } from '../utils/encoding';

// Sample Mary Jane Image
const MARY_JANE_IMAGE = SAMPLE_PRODUCTS.find((p) => p.id === 'sample-5')?.imageThumbnail || '';

// Pre-built QC evaluations for S001, S002, S003
const S001_QC: QcEvaluation = {
  status: 'PASS',
  score: 98,
  colorFidelity: {
    score: 98,
    status: 'PASS',
    note: 'Màu nâu da bò cổ điển (Vintage Tan/Cognac) chuẩn xác 100% so với ảnh gốc.',
  },
  shapeFidelity: {
    score: 98,
    status: 'PASS',
    note: 'Phom mũi tròn bo nhẹ, quai ngang Mary Jane bản mảnh cân đối.',
  },
  proportionFidelity: {
    score: 97,
    status: 'PASS',
    note: 'Tỷ lệ đế cao su 3.5cm so với thân giày chuẩn phom thiết kế.',
  },
  logoFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Không có logo bịa đặt hay sai lệch nhận diện thương hiệu.',
  },
  detailFidelity: {
    score: 98,
    status: 'PASS',
    note: 'Chi tiết nơ da may tay và khóa kim loại ánh kim sáng bóng, sắc nét.',
  },
  partsCountFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Đầy đủ 2 chiếc, 2 quai cài kim loại, 2 nơ da.',
  },
  noHallucinatedDetails: {
    score: 99,
    status: 'PASS',
    note: 'Không phát hiện bất kỳ phụ kiện hoặc hoa văn lạ nào ngoài thiết kế gốc.',
  },
  summary: 'Asset S001 đạt độ chuẩn xác 98/100 theo tiêu chuẩn Product Fidelity > Beauty. Sẵn sàng dựng video affiliate.',
  verdictReason: 'Tất cả chi tiết vật liệu da bò, màu sắc, nơ da và đế cao su đúc đều khớp tuyệt đối với sản phẩm thực tế.',
  isHumanApproved: true,
};

const S002_QC: QcEvaluation = {
  status: 'PASS',
  score: 96,
  colorFidelity: {
    score: 97,
    status: 'PASS',
    note: 'Vân da bò tự nhiên, độ bóng nhẹ chân thật.',
  },
  shapeFidelity: {
    score: 96,
    status: 'PASS',
    note: 'Góc chụp macro cận cảnh mép da và đường kim mũi chỉ chắc chắn.',
  },
  proportionFidelity: {
    score: 96,
    status: 'PASS',
    note: 'Đế đúc rãnh chống trượt và khóa gài kim loại sắc sảo.',
  },
  logoFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Không xuất hiện chi tiết giả mạo.',
  },
  detailFidelity: {
    score: 97,
    status: 'PASS',
    note: 'Lớp lót thoáng khí bên trong hiển thị rõ ràng, đường khâu nơ da tỉ mỉ.',
  },
  partsCountFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Các chi tiết cấu thành hoàn toàn chuẩn chỉnh.',
  },
  noHallucinatedDetails: {
    score: 98,
    status: 'PASS',
    note: 'Không có chi tiết lạ xuất hiện.',
  },
  summary: 'Asset S002 Macro Detail vượt qua kiểm định Fidelity QC 96/100, thể hiện rõ độ cao cấp của chất liệu da bò thật.',
  verdictReason: 'Độ phân giải cao, chi tiết vân da và khóa kim loại chân thực, củng cố niềm tin khách hàng.',
  isHumanApproved: true,
};

const S003_IMAGE_QC: QcEvaluation = {
  status: 'PASS',
  score: 95,
  colorFidelity: {
    score: 96,
    status: 'PASS',
    note: 'Màu sắc giày giữ nguyên tông màu gốc trong ánh sáng tự nhiên.',
  },
  shapeFidelity: {
    score: 95,
    status: 'PASS',
    note: 'Dáng giày khi mang vào chân người mẫu tự nhiên, không bị biến dạng.',
  },
  proportionFidelity: {
    score: 95,
    status: 'PASS',
    note: 'Độ cao đế 3.5cm và quai Mary Jane cân xứng với bàn chân và tất ren vintage.',
  },
  logoFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Không có yếu tố sai lệch thương hiệu.',
  },
  detailFidelity: {
    score: 94,
    status: 'PASS',
    note: 'Phối trang phục Parisian Chic / Vintage Lolita tôn vinh tối đa sản phẩm.',
  },
  partsCountFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Trang phục và phụ kiện đúng phối đồ thực tế.',
  },
  noHallucinatedDetails: {
    score: 96,
    status: 'PASS',
    note: 'Bối cảnh đường phố cổ điển tao nhã, không lấn át sản phẩm.',
  },
  summary: 'Asset S003 Lifestyle Stage 1 đã được phê duyệt (95/100), truyền tải đúng phong cách French Chic thanh lịch.',
  verdictReason: 'Bối cảnh dạo phố thanh lịch kết hợp tất ren vintage tạo hiệu ứng thị giác chuyển đổi mua hàng cao.',
  isHumanApproved: true,
};

const S003_VIDEO_QC: QcEvaluation = {
  status: 'PASS',
  score: 96,
  colorFidelity: {
    score: 96,
    status: 'PASS',
    note: 'Màu nâu da bò đồng nhất xuyên suốt video di chuyển.',
  },
  shapeFidelity: {
    score: 96,
    status: 'PASS',
    note: 'Chuyển động bước chân nhẹ nhàng, phom giày không bị co dãn hay biến dạng khi gập chân.',
  },
  proportionFidelity: {
    score: 96,
    status: 'PASS',
    note: 'Đế cao su 3.5cm tiếp đất êm ái, thể hiện rõ tính năng chống đau chân.',
  },
  logoFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Không vi phạm nhận diện thương hiệu.',
  },
  detailFidelity: {
    score: 96,
    status: 'PASS',
    note: 'Tất ren vintage và nơ da chuyển động sinh động, thu hút ánh nhìn.',
  },
  partsCountFidelity: {
    score: 100,
    status: 'PASS',
    note: 'Chuyển động tự nhiên.',
  },
  noHallucinatedDetails: {
    score: 98,
    status: 'PASS',
    note: 'Không có hiệu ứng kỹ xảo quá đà làm sai lệch tính chất sản phẩm.',
  },
  summary: 'Asset S003 Lifestyle Video 9:16 đạt 96/100, chuyển động bước đi uyển chuyển, độ chân thực cao.',
  verdictReason: 'Video thể hiện thực tế cảm giác mang êm ái khi đi bộ nhiều, kích thích mạnh quyết định bấm giỏ hàng.',
  isHumanApproved: true,
};

// 5 Approved Scripts for P001
export const P001_VARIATIONS: VideoVariation[] = [
  {
    id: 'P001_V01',
    salesAngle: 'PRICE / VALUE (Giá trị vượt trội & Quà tặng)',
    salesAngleDesc: 'Nhấn mạnh giá chỉ 59.600đ cho giày da bò thật mềm êm kèm quà tặng tất ren vintage, so sánh với giá boutique 700-900k.',
    hook: 'Đừng chi gần triệu bạc ra shop mua giày Mary Jane nếu bạn chưa biết đến em này!',
    voiceScript: 'Đừng chi gần triệu bạc ra shop mua giày Mary Jane nếu bạn chưa biết đến em này. Chỉ chưa tới sáu mươi nghìn mà làm từ da bò thật mềm êm, mũi tròn phối nơ siêu xinh. Đế cao su đúc ba phân rưỡi hack dáng cực khéo, đi bộ cả ngày không lo đau gót. Đợt này còn được tặng kèm đôi tất ren vintage nữa. Nhấn ngay vào giỏ hàng bên dưới để rinh ngay ưu đãi nhé!',
    estimatedDuration: '19s',
    timeline: [
      {
        timeRange: '00:00 - 00:03',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Toàn cảnh góc nghiêng 45° zoom nhẹ vào mũi giày và nơ da thủ công, xuất hiện chữ cảnh báo giá sốc.',
      },
      {
        timeRange: '00:03 - 00:08',
        shotId: 'S002',
        shotTitle: 'S002 Detail Shot',
        visualAction: 'Cận cảnh vân da bò mềm mịn, uốn nhẹ thân giày chứng minh độ êm và khóa kim loại sáng bóng.',
      },
      {
        timeRange: '00:08 - 00:15',
        shotId: 'S003',
        shotTitle: 'S003 Lifestyle Shot',
        visualAction: 'Người mẫu mang giày phối váy xòe dạo phố tự tin, zoom vào quà tặng tất ren vintage đi kèm.',
      },
      {
        timeRange: '00:15 - 00:19',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Quay lại góc Hero Shot với sticker giỏ hàng nhấp nháy và giá ưu đãi 59.600đ.',
      },
    ],
    onScreenText: {
      hookText: 'ĐỪNG MUA GIÀY TIỆM 800K VỘI!',
      benefitText: 'Da bò thật mềm êm • Đế 3.5cm không đau chân • Tặng tất ren',
      ctaText: '59.600Đ + TẶNG TẤT REN ➔ BẤM GIỎ HÀNG GÓC TRÁI',
    },
    cta: 'Nhấn ngay vào giỏ hàng bên dưới để rinh ngay ưu đãi nhé!',
    editingInstructions: {
      scenes: '4 phân cảnh chuyển tiếp nhịp nhàng theo câu thoại',
      cutsAndTransitions: 'Hard cut dứt khoát tại 0:03 và 0:08, cross-dissolve nhẹ tại 0:15',
      textPlacement: 'Chữ tiêu đề ở 1/3 trên màn hình, banner CTA cố định 1/3 dưới',
      captions: 'Phụ đề vàng viền đen kiểu karaoke tự động đồng bộ giọng nói',
      musicMood: 'Nhạc Acoustic Lofi / French Pop nhẹ nhàng, tích cực',
      audioMix: 'Voice đọc to rõ -3dB, nhạc nền ducking xuống -18dB khi có giọng nói',
    },
    requiresPriceCheck: true,
    isApproved: true,
    contentQc: {
      status: 'PASS',
      score: 98,
      breakdown: {
        factualAccuracy: 40,
        noFakeExperience: 25,
        claimSafety: 20,
        naturalLanguage: 9,
        ctaAccuracy: 4,
      },
      hasFakePersonalExperience: false,
      claims: [
        { claim: 'Giá 59.600đ', source: 'Product Profile', status: 'VERIFIED' },
        { claim: 'Chất liệu da bò thật mềm êm', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Mũi tròn phối nơ thủ công', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Đế cao su đúc 3.5cm chống trượt', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Tặng kèm tất ren vintage', source: 'Product Profile', status: 'VERIFIED' },
      ],
      feedback: 'Kịch bản chuẩn xác 100% sự thật đã xác minh, văn phong tự nhiên hấp dẫn, không thổi phồng.',
    },
  },
  {
    id: 'P001_V02',
    salesAngle: 'CURIOSITY (Tò mò & Khám phá xu hướng)',
    salesAngleDesc: 'Khai thác sự tò mò vì sao mẫu Mary Jane này lại tạo nên cơn sốt phong cách French Chic.',
    hook: 'Tại sao hội mê phong cách French Chic lại săn lùng đôi Mary Jane nơ da này nhiều đến vậy?',
    voiceScript: 'Tại sao hội mê phong cách French Chic lại săn lùng đôi Mary Jane nơ da này nhiều đến vậy? Bí quyết nằm ở chất da bò thật siêu mềm ôm chân, form mũi tròn cổ điển vừa vặn với mọi dáng bàn chân. Lót trong đệm bọt biển êm ái, đế ba phân rưỡi chống trượt cực xịn. Giá chỉ chưa tới sáu mươi nghìn còn tặng tất ren xinh xỉu. Xem ngay chi tiết trong giỏ hàng nha!',
    estimatedDuration: '20s',
    timeline: [
      {
        timeRange: '00:00 - 00:03',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Xoay chậm sản phẩm với visual question mark thu hút thị giác.',
      },
      {
        timeRange: '00:03 - 00:09',
        shotId: 'S002',
        shotTitle: 'S002 Detail Shot',
        visualAction: 'Cận cảnh nơ da may tỉ mỉ, lót bọt biển đàn hồi bên trong và đế đúc nguyên khối.',
      },
      {
        timeRange: '00:09 - 00:16',
        shotId: 'S003',
        shotTitle: 'S003 Lifestyle Shot',
        visualAction: 'Các góc phối đồ Parisian Chic xuống phố cực sang chảnh và tinh tế.',
      },
      {
        timeRange: '00:16 - 00:20',
        shotId: 'S002',
        shotTitle: 'S002 Detail Shot',
        visualAction: 'Đóng khung sản phẩm kèm phụ kiện tất ren vintage, trỏ mũi tên vào giỏ hàng.',
      },
    ],
    onScreenText: {
      hookText: 'VÌ SAO ĐÔI NÀY ĐANG GÂY BÃO?',
      benefitText: 'Da bò thật • Lót bọt biển siêu êm • Tôn dáng chuẩn Parisian',
      ctaText: 'GIỎ HÀNG CÓ SẴN SIZE • BẤM NGAY!',
    },
    cta: 'Xem ngay chi tiết trong giỏ hàng nha!',
    editingInstructions: {
      scenes: 'Nhịp cắt nhanh ở hook 3s đầu để giữ chân người xem',
      cutsAndTransitions: 'Chuyển cảnh zoom-in nhanh tạo cảm giác khám phá bí mật',
      textPlacement: 'Text câu hỏi lớn nổi bật ở giữa khung hình trong 2s đầu',
      captions: 'Phụ đề nổi bật các từ khóa: Da bò thật, French Chic, Tặng tất ren',
      musicMood: 'Nhạc nền bí ẩn nhẹ rồi bùng nổ tươi vui',
      audioMix: 'Cân bằng âm lượng chuẩn nền tảng ngắn -14 LUFS',
    },
    requiresPriceCheck: true,
    isApproved: true,
    contentQc: {
      status: 'PASS',
      score: 97,
      breakdown: {
        factualAccuracy: 40,
        noFakeExperience: 25,
        claimSafety: 19,
        naturalLanguage: 9,
        ctaAccuracy: 4,
      },
      hasFakePersonalExperience: false,
      claims: [
        { claim: 'Chất da bò thật siêu mềm ôm chân', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Lót trong đệm bọt biển êm ái', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Đế 3.5cm chống trượt', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Giá 59.600đ', source: 'Product Profile', status: 'VERIFIED' },
        { claim: 'Tặng kèm tất ren', source: 'Product Profile', status: 'VERIFIED' },
      ],
      feedback: 'Góc tiếp cận hấp dẫn, chuyển đổi tự nhiên sang tính năng và ưu đãi thực tế.',
    },
  },
  {
    id: 'P001_V03',
    salesAngle: 'PRODUCT DETAIL (Soi cận cảnh chất liệu & Đường may)',
    salesAngleDesc: 'Đưa camera vào sát từng đường kim mũi chỉ, vân da thật và cấu trúc đế cao su 3.5cm.',
    hook: 'Soi cận cảnh đôi Mary Jane da bò thật chưa tới sáu mươi nghìn xem có xịn sò như lời đồn không nha!',
    voiceScript: 'Soi cận cảnh đôi Mary Jane da bò thật chưa tới sáu mươi nghìn xem có xịn sò như lời đồn không nha! Từng đường kim mũi chỉ trên nơ da đều được may thủ công cực tỉ mỉ. Quai cài kim loại mạ sáng bóng, đế cao su đúc nguyên khối ba chấm năm centimet cực kỳ bám đường. Bên trong là lớp lót thoáng khí êm ru. Mức giá quá hời cho một đôi giày da thật, bấm giỏ hàng trải nghiệm ngay!',
    estimatedDuration: '21s',
    timeline: [
      {
        timeRange: '00:00 - 00:04',
        shotId: 'S002',
        shotTitle: 'S002 Detail Shot',
        visualAction: 'Góc quay macro cận cảnh đường chỉ may viền và nơ da sắc nét.',
      },
      {
        timeRange: '00:04 - 00:10',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Toàn cảnh thân giày, thử độ uốn dẻo mềm mại của chất da bò thật.',
      },
      {
        timeRange: '00:10 - 00:17',
        shotId: 'S003',
        shotTitle: 'S003 Lifestyle Shot',
        visualAction: 'Người mẫu mang giày bước đi trên mặt sàn gạch bóng chứng minh độ bám đế cao su.',
      },
      {
        timeRange: '00:17 - 00:21',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Cận cảnh set quà tặng tất ren vintage và lời kêu gọi đặt hàng.',
      },
    ],
    onScreenText: {
      hookText: 'SOI CẬN CẢNH DA THẬT 59.600Đ',
      benefitText: 'May thủ công tỉ mỉ • Khóa kim loại sáng bóng • Đế đúc bám đường',
      ctaText: 'HÀNG CHUẨN DA THẬT ➔ MUA TẠI GIỎ HÀNG NÀY',
    },
    cta: 'Mức giá quá hời cho một đôi giày da thật, bấm giỏ hàng trải nghiệm ngay!',
    editingInstructions: {
      scenes: 'Ưu tiên các góc quay macro chi tiết rõ nét',
      cutsAndTransitions: 'Chuyển cảnh smooth zoom kết hợp âm thanh swoosh nhẹ',
      textPlacement: 'Hiển thị các tag chỉ dẫn mũi tên vào nơ da, khóa kim loại, đế cao su',
      captions: 'Đồng bộ từng từ theo nhịp đọc',
      musicMood: 'Nhạc review công nghệ/lifestyle sắc nét, hiện đại',
      audioMix: 'Giọng đọc trầm ấm, chân thực, tạo sự tin cậy tối đa',
    },
    requiresPriceCheck: true,
    isApproved: true,
    contentQc: {
      status: 'PASS',
      score: 99,
      breakdown: {
        factualAccuracy: 40,
        noFakeExperience: 25,
        claimSafety: 20,
        naturalLanguage: 10,
        ctaAccuracy: 4,
      },
      hasFakePersonalExperience: false,
      claims: [
        { claim: 'Chất liệu da bò thật', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Nơ da may thủ công tỉ mỉ', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Khóa cài kim loại mạ sáng bóng', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Đế cao su đúc nguyên khối 3.5cm bám đường', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Lớp lót thoáng khí', source: 'Verified Facts', status: 'VERIFIED' },
      ],
      feedback: 'Kịch bản đạt điểm tuyệt đối về độ chính xác và tính thuyết phục thị giác.',
    },
  },
  {
    id: 'P001_V04',
    salesAngle: 'STYLE / USE CASE (Phối đồ đa năng đi học, đi làm, cà phê)',
    salesAngleDesc: 'Gợi ý tính ứng dụng cao: 1 đôi giày phối được 5 outfit từ Vintage Lolita đến Parisian Chic công sở.',
    hook: 'Chỉ với một đôi Mary Jane vintage này, bạn có thể biến hóa đủ 5 outfit đi học, đi làm hay cà phê!',
    voiceScript: 'Chỉ với một đôi Mary Jane vintage này, bạn có thể biến hóa đủ năm outfit từ đi học, đi làm đến dạo phố cuối tuần. Phối cùng chân váy xòe, quần âu hay đầm lolita đều toát lên vẻ thanh lịch chuẩn Parisian Chic. Đế ba chấm năm phân tôn dáng nhẹ nhàng, đi làm cả ngày vẫn êm ái tuyệt đối. Chỉ chưa tới sáu mươi nghìn tặng kèm tất ren, nhanh tay bấm vào góc trái màn hình rinh về nhé!',
    estimatedDuration: '22s',
    timeline: [
      {
        timeRange: '00:00 - 00:04',
        shotId: 'S003',
        shotTitle: 'S003 Lifestyle Shot',
        visualAction: 'Thay đổi nhanh 3 bức hình outfit phối cùng giày Mary Jane trên nền nhạc vui nhộn.',
      },
      {
        timeRange: '00:04 - 00:10',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Xoay 360 độ phom giày cổ điển làm nổi bật nơ da và khóa cài thanh mảnh.',
      },
      {
        timeRange: '00:10 - 00:16',
        shotId: 'S002',
        shotTitle: 'S002 Detail Shot',
        visualAction: 'Zoom vào đế cao su 3.5cm và lót trong êm ái giúp đi bộ không mỏi chân.',
      },
      {
        timeRange: '00:16 - 00:22',
        shotId: 'S003',
        shotTitle: 'S003 Lifestyle Shot',
        visualAction: 'Người mẫu bước đi tự tin dạo phố với quà tặng tất ren vintage, banner ưu đãi hiện lên.',
      },
    ],
    onScreenText: {
      hookText: '1 ĐÔI GIÀY CÂN 5 OUTFIT',
      benefitText: 'Đi học • Đi làm • Dạo phố • Đế 3.5cm tôn dáng nhẹ nhàng',
      ctaText: '59.600Đ TẶNG TẤT REN ➔ CHẠM GÓC TRÁI MUA NGAY',
    },
    cta: 'Nhanh tay bấm vào góc trái màn hình rinh về nhé!',
    editingInstructions: {
      scenes: 'Phân đoạn thời trang năng động, chuyển cảnh theo nhịp beat',
      cutsAndTransitions: 'Match cut chuyển động bàn chân giữa các trang phục',
      textPlacement: 'Text outfit 1, 2, 3 xuất hiện góc phải trên',
      captions: 'Chữ chạy năng động phong cách TikTok thời trang',
      musicMood: 'Nhạc Pop Indie Pháp thời thượng, rộn ràng',
      audioMix: 'Giọng đọc vui tươi, truyền cảm hứng phối đồ',
    },
    requiresPriceCheck: true,
    isApproved: true,
    contentQc: {
      status: 'PASS',
      score: 98,
      breakdown: {
        factualAccuracy: 40,
        noFakeExperience: 25,
        claimSafety: 20,
        naturalLanguage: 9,
        ctaAccuracy: 4,
      },
      hasFakePersonalExperience: false,
      claims: [
        { claim: 'Phối đồ đi học, đi làm, dạo phố', source: 'Target Customer', status: 'VERIFIED' },
        { claim: 'Đế 3.5cm tôn dáng', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Chất liệu da bò êm chân', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Giá 59.600đ tặng tất ren', source: 'Product Profile', status: 'VERIFIED' },
      ],
      feedback: 'Tập trung vào tính ứng dụng thời trang cao, thông điệp rõ ràng, chốt đơn mạnh mẽ.',
    },
  },
  {
    id: 'P001_V05',
    salesAngle: 'NATURAL PRODUCT INTRODUCTION (Giới thiệu chân ái êm chân)',
    salesAngleDesc: 'Giới thiệu tự nhiên, gần gũi như một người bạn thân giới thiệu món đồ êm chân ưng ý.',
    hook: 'Nếu bạn đang tìm một đôi giày vừa êm chân vừa thanh lịch thì Mary Jane nơ da chính là chân ái!',
    voiceScript: 'Nếu bạn đang tìm một đôi giày vừa êm chân vừa thanh lịch thì Mary Jane nơ da chính là chân ái. Thiết kế da bò mềm mại, quai ngang thanh mảnh ôm gọn bàn chân. Đế cao su đúc ba phân rưỡi chống trượt an toàn, lót trong êm ái nâng niu từng bước đi. Chỉ chưa tới sáu mươi nghìn tặng kèm tất ren vintage sang chảnh. Click giỏ hàng đặt ngay hôm nay kẻo lỡ ưu đãi nhé!',
    estimatedDuration: '21s',
    timeline: [
      {
        timeRange: '00:00 - 00:04',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Đôi giày xoay nhẹ nhàng trên nền ánh sáng ấm áp, tạo cảm giác thư thái và tinh tế.',
      },
      {
        timeRange: '00:04 - 00:11',
        shotId: 'S003',
        shotTitle: 'S003 Lifestyle Shot',
        visualAction: 'Từng bước chân êm ái thong thả trên vỉa hè đầy lá vàng mùa thu.',
      },
      {
        timeRange: '00:11 - 00:17',
        shotId: 'S002',
        shotTitle: 'S002 Detail Shot',
        visualAction: 'Cận cảnh quai khóa mạ vàng ánh kim và phần nơ da may tay tỉ mỉ.',
      },
      {
        timeRange: '00:17 - 00:21',
        shotId: 'S001',
        shotTitle: 'S001 Hero Shot',
        visualAction: 'Trọn bộ sản phẩm và quà tặng kèm tất ren, icon giỏ hàng nhấp nháy gọi mời.',
      },
    ],
    onScreenText: {
      hookText: 'CHÂN ÁI ÊM CHÂN MÙA NÀY',
      benefitText: 'Da bò mềm mại • Đế cao su đúc 3.5cm • Lót đệm nâng niu bàn chân',
      ctaText: '59.600₫ + TẶNG TẤT REN ➔ CLICK GIỎ HÀNG',
    },
    cta: 'Click giỏ hàng đặt ngay hôm nay kẻo lỡ ưu đãi nhé!',
    editingInstructions: {
      scenes: 'Tone màu ấm áp, nhẹ nhàng theo phong cách lifestyle dịu dàng',
      cutsAndTransitions: 'Chuyển cảnh mượt mà, tốc độ vừa phải',
      textPlacement: 'Chữ thanh lịch ở góc dưới bên trái',
      captions: 'Phụ đề màu kem viền nâu cà phê ấm cúng',
      musicMood: 'Nhạc Piano Lo-fi nhẹ nhàng êm tai',
      audioMix: 'Giọng đọc trong trẻo, chân thành, tự nhiên',
    },
    requiresPriceCheck: true,
    isApproved: true,
    contentQc: {
      status: 'PASS',
      score: 97,
      breakdown: {
        factualAccuracy: 40,
        noFakeExperience: 25,
        claimSafety: 19,
        naturalLanguage: 9,
        ctaAccuracy: 4,
      },
      hasFakePersonalExperience: false,
      claims: [
        { claim: 'Thiết kế da bò mềm mại', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Quai ngang thanh mảnh', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Đế cao su đúc 3.5cm', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Lót trong êm ái thoáng khí', source: 'Verified Facts', status: 'VERIFIED' },
        { claim: 'Giá 59.600đ tặng tất ren', source: 'Product Profile', status: 'VERIFIED' },
      ],
      feedback: 'Văn phong chân thật, không dùng từ ngữ quảng cáo quá đà, độ tin cậy tuyệt đối.',
    },
  },
];

// Production Sheet Data for Project P001
export const P001_PRODUCTION_SHEET: ProductionSheetData = {
  productProfile: {
    productName: 'Giày Mary Jane Nữ Da Bò Mũi Tròn Phối Nơ & Khóa Cài Cổ Điển',
    category: 'Giày dép & Thời trang nữ',
    price: '59.600 ₫ (Flash Sale Tặng Kèm Tất Ren Vintage)',
    keyFeaturesSummary: 'Chất liệu da bò thật mềm êm, mũi giày bo tròn cổ điển phối nơ da may tỉ mỉ, quai ngang Mary Jane bản mảnh với khóa cài kim loại ánh kim cao cấp. Đế cao su đúc nguyên khối chống trơn trượt cao 3.5cm tôn dáng, lót trong êm ái thoáng khí không đau chân khi đi bộ nhiều. Phong cách vintage Lolita / French Chic thanh lịch.',
    perceivedValue: 'Chất lượng da thật cao cấp, phom dáng chuẩn chỉ tương đương các mẫu boutique thiết kế 700.000đ - 900.000đ.',
  },
  verifiedFacts: [
    'Chất liệu da bò thật mềm êm, bề mặt xử lý chống nhăn và chống xước nhẹ',
    'Mũi giày dáng bo tròn cổ điển phối nơ da may thủ công tỉ mỉ',
    'Quai ngang Mary Jane bản mảnh kèm khóa cài kim loại mạ ánh kim cao cấp',
    'Đế cao su đúc nguyên khối chống trơn trượt, chiều cao đế 3.5cm tôn dáng vừa vặn',
    'Lót giày bọt biển đàn hồi êm ái thoáng khí, không gây phồng rộp gót chân khi đi bộ nhiều',
    'Giá bán chính xác: 59.600 VNĐ (đã xác minh)',
    'Quà tặng kèm theo: Tất ren vintage Lolita cao cấp',
    'Phong cách thiết kế: Vintage Parisian Chic / Lolita thanh lịch',
  ],
  unverifiedDoNotClaim: [
    'KHÔNG quảng cáo là giày chống nước ngập sâu hoặc lội bùn',
    'KHÔNG cam kết đế nâng chiều cao 7-10cm (thực tế chuẩn là 3.5cm)',
    'KHÔNG bịa câu chuyện cá nhân "mình mang đi phượt xuyên Việt" sai mục đích sử dụng',
    'KHÔNG hứa hẹn giảm giá 70-80% lừa dối người tiêu dùng',
  ],
  targetCustomer: {
    demographics: 'Nữ giới 18 - 32 tuổi, học sinh, sinh viên, nhân viên văn phòng, người yêu thích thời trang vintage.',
    psychographics: 'Thích phong cách Parisian Chic thanh lịch, tinh tế, ưu tiên sự êm ái khi di chuyển hàng ngày nhưng vẫn phải giữ nét nữ tính sang chảnh.',
    painPoints: [
      'Mua giày da cứng gây đau gót, phồng rộp ngón chân khi đi bộ',
      'Giày nhanh xẹp phom, gãy mũi hoặc bong tróc giả da sau vài tuần',
      'Khó tìm được đôi giày vừa đi học, đi làm vừa đi chơi cà phê',
      'Giá các mẫu giày da thật ngoài boutique quá đắt (700k - 1 triệu)',
    ],
    desiresAndTriggers: [
      'Sở hữu đôi giày da bò thật êm ái với mức giá hạt dẻ 59.600đ',
      'Đế 3.5cm vừa tôn dáng nhẹ nhàng vừa an toàn thoải mái',
      'Thích được tặng kèm quà tặng xinh xắn (tất ren vintage)',
    ],
  },
  usp: {
    primaryUsp: 'Giày Mary Jane da bò thật mềm êm, đế cao su đúc 3.5cm chống đau gót với mức giá chỉ 59.600đ tặng kèm tất ren vintage.',
    secondaryUsps: [
      'Nơ da may thủ công tinh xảo, khóa cài kim loại mạ ánh kim sang trọng',
      'Phom mũi tròn cổ điển ôm chân, không kén dáng bàn chân',
      'Lót đệm bọt biển thoáng khí mang cả ngày không hầm bí',
    ],
    comparisonAdvantage: 'Vượt trội hơn hẳn các mẫu giày da PU rẻ tiền dễ bong tróc và rẻ hơn 50% so với giày cùng chất lượng tại boutique thời trang.',
  },
  salesAngles: [
    {
      id: 'SA01',
      title: 'PRICE / VALUE (Giá trị vượt trội)',
      coreInsight: 'Khách hàng muốn sở hữu đồ da thật nhưng e ngại giá tiền đắt đỏ ngoài shop.',
      angleDescription: 'So sánh mức giá 59.600đ với giày tiền triệu ngoài tiệm, nhấn mạnh quà tặng tất ren.',
      emotionalTrigger: 'Cảm giác mua được món đồ cao cấp với mức giá quá hời.',
    },
    {
      id: 'SA02',
      title: 'CURIOSITY (Khám phá xu hướng)',
      coreInsight: 'Người dùng tò mò vì sao mẫu giày này lại được cộng đồng French Chic yêu thích.',
      angleDescription: 'Giải mã bí quyết tạo nên cơn sốt từ chất da bò mềm và lót êm ái.',
      emotionalTrigger: 'Sợ bỏ lỡ xu hướng thời trang thịnh hành.',
    },
    {
      id: 'SA03',
      title: 'PRODUCT DETAIL (Chất liệu & Gia công)',
      coreInsight: 'Người mua online lo sợ nhận phải hàng da giả kém chất lượng.',
      angleDescription: 'Soi cận cảnh nơ da may tay, vân da bò thật và đế cao su bám đường.',
      emotionalTrigger: 'Sự an tâm và tin tưởng tuyệt đối vào chất lượng sản phẩm.',
    },
    {
      id: 'SA04',
      title: 'STYLE / USE CASE (Phối đồ đa năng)',
      coreInsight: 'Cần một đôi giày dễ phối với mọi trang phục từ công sở đến dạo phố.',
      angleDescription: 'Gợi ý 5 phong cách phối đồ chuẩn Parisian Chic với 1 đôi giày duy nhất.',
      emotionalTrigger: 'Thỏa mãn niềm đam mê thời trang và tính tiện dụng hàng ngày.',
    },
    {
      id: 'SA05',
      title: 'NATURAL PRODUCT INTRODUCTION (Giới thiệu êm chân)',
      coreInsight: 'Tìm kiếm một đôi giày bảo vệ đôi chân êm ái suốt ngày dài.',
      angleDescription: 'Giới thiệu nhẹ nhàng, chân thành về cảm giác mang êm ru không đau gót.',
      emotionalTrigger: 'Cảm giác được nâng niu, chăm sóc đôi bàn chân.',
    },
  ],
  hooks: [
    {
      angleId: 'SA01',
      angleTitle: 'PRICE / VALUE',
      visualHook: 'Zoom cận cảnh nơ da và hiện chữ ĐỪNG MUA GIÀY TIỆM 800K VỘI!',
      audioHook: 'Đừng chi gần triệu bạc ra shop mua giày Mary Jane nếu bạn chưa biết đến em này!',
      textOnScreen: 'GIÀY DA THẬT 59.600Đ + TẶNG TẤT REN',
      retentionTactic: 'Tạo sự ngạc nhiên về mức giá so với chất liệu da bò thật.',
    },
    {
      angleId: 'SA02',
      angleTitle: 'CURIOSITY',
      visualHook: 'Xoay chậm đôi giày kết hợp icon dấu hỏi bí ẩn.',
      audioHook: 'Tại sao hội mê phong cách French Chic lại săn lùng đôi Mary Jane nơ da này nhiều đến vậy?',
      textOnScreen: 'BÍ QUYẾT GÂY BÃO CỦA ĐÔI MARY JANE',
      retentionTactic: 'Kích thích tò mò về xu hướng Parisian Chic.',
    },
    {
      angleId: 'SA03',
      angleTitle: 'PRODUCT DETAIL',
      visualHook: 'Macro cận cảnh đường kim mũi chỉ nơ da và khóa kim loại.',
      audioHook: 'Soi cận cảnh đôi Mary Jane da bò thật chưa tới sáu mươi nghìn xem có xịn sò như lời đồn không nha!',
      textOnScreen: 'SOI TỪNG ĐƯỜNG MAY DA BÒ THẬT',
      retentionTactic: 'Đáp ứng mong muốn kiểm tra chất lượng của người mua kỹ tính.',
    },
  ],
  voiceScripts: [
    {
      angleId: 'SA01',
      angleTitle: 'PRICE / VALUE',
      estimatedDuration: '19s',
      pacing: 'Nhịp điệu sôi nổi, dứt khoát, nhấn mạnh giá trị',
      scriptBody: 'Đừng chi gần triệu bạc ra shop mua giày Mary Jane nếu bạn chưa biết đến em này. Chỉ chưa tới sáu mươi nghìn mà làm từ da bò thật mềm êm, mũi tròn phối nơ siêu xinh. Đế cao su đúc 3 phân rưỡi hack dáng cực khéo, đi bộ cả ngày không lo đau gót. Đợt này còn được tặng kèm đôi tất ren vintage nữa. Nhấn ngay vào giỏ hàng bên dưới để rinh ngay ưu đãi nhé!',
      visualCues: [
        '00:00 - 00:03: S001 Hero Shot 45°',
        '00:03 - 00:08: S002 Detail Macro vân da & nơ',
        '00:08 - 00:15: S003 Lifestyle bước chân dạo phố & tất ren',
        '00:15 - 00:19: S001 Hero Shot + Sticker Giỏ hàng',
      ],
    },
  ],
  cta: [
    {
      type: 'Flash Sale Urgent',
      script: 'Nhấn ngay vào giỏ hàng bên dưới góc trái để nhận ngay ưu đãi chưa tới sáu mươi nghìn và quà tặng tất ren vintage nhé!',
      onScreenBanner: '⚡ FLASH SALE 59.600Đ • TẶNG TẤT REN • BẤM GIỎ HÀNG NGAY',
      urgencyTactic: 'Số lượng quà tặng tất ren vintage có hạn theo từng đợt Flash Sale.',
    },
  ],
  s001HeroPrompt: {
    promptEn: 'Cinematic 9:16 vertical video of a vintage brown genuine leather Mary Jane shoe with delicate bow and metallic buckle, rotating smoothly 360 degrees on warm studio podium, soft diffuse lighting, photorealistic 8k.',
    promptVi: 'Video dọc 9:16 toàn cảnh đôi giày Mary Jane da bò thật màu nâu vintage phối nơ da và khóa cài kim loại, xoay nhẹ 45 độ trên bục studio ánh sáng ấm áp.',
    lightingAndLens: 'Soft studio key light 45°, 50mm portrait lens, f/2.8 bokeh.',
    aspectRatio: '9:16',
    negativePrompt: 'blurry, low quality, distorted bow, plastic look, fake seams, neon glare.',
  },
  s002DetailPrompt: {
    promptEn: 'Extreme macro close-up shot of the genuine cowhide leather texture, handcrafted bow stitching, and shiny metallic gold buckle of a Mary Jane shoe, 9:16 vertical.',
    promptVi: 'Cận cảnh macro cực nét vân da bò thật mềm mại, đường may nơ thủ công tỉ mỉ và khóa cài kim loại mạ ánh kim sáng bóng.',
    focalPoint: 'Mũi nơ da và khóa cài kim loại ánh kim',
    textureDetails: 'Vân da bò tự nhiên mềm mại, đường kim mũi chỉ đều tăm tắp, đế cao su đúc 3.5cm bám đường.',
    negativePrompt: 'plastic texture, peeling edges, blurry stitches, deformed buckle.',
  },
  s003LifestyleImagePrompt: {
    promptEn: 'Full-body vertical lifestyle shot of an elegant young woman wearing vintage Mary Jane leather shoes with delicate lace socks, pleated skirt, walking on Paris cobblestone street, golden hour lighting.',
    promptVi: 'Ảnh phong cách sống nữ sinh/công sở thanh lịch mang giày Mary Jane nơ da phối tất ren vintage và váy xòe, bước đi thong thả trên vỉa hè lát đá cổ kính dưới ánh hoàng hôn.',
    environment: 'Phố cổ Parisian / Hà Nội cổ kính lát đá, ánh sáng hoàng hôn ấm áp.',
    fidelityRule: 'Giữ nguyên 100% màu nâu da bò, nơ da và phom đế 3.5cm của đôi giày.',
    negativePrompt: 'modern sneakers, high heels, deformed feet, crowded background, blurry shoes.',
  },
  s003LifestyleVideoPrompt: {
    promptEn: 'Cinematic vertical 9:16 video tracking camera following elegant woman walking gracefully in Mary Jane brown leather shoes with vintage lace socks, smooth natural foot steps.',
    promptVi: 'Video dọc 9:16 máy quay tracking nhẹ theo từng bước chân người mẫu mang giày Mary Jane da bò nâu phối tất ren vintage, bước đi uyển chuyển êm ái.',
    cameraMovement: 'Low-angle tracking shot moving forward at foot level.',
    actionDescription: 'Từng bước chân bước đi tự nhiên, êm dịu, không gượng gạo, thể hiện trọn vẹn độ mềm và đế chống trượt.',
    toolRecommendation: 'Gemini Video Generator / Cinematic Engine 9:16',
  },
  fidelityWarning: {
    riskLevel: 'LOW',
    warningMessage: 'Sản phẩm có thiết kế hình học và màu sắc đặc trưng rõ ràng, rủi ro sai lệch chi tiết rất thấp khi tuân thủ ảnh mẫu.',
    recommendedTechnique: 'Giữ nguyên phom mũi tròn, chi tiết nơ da và màu nâu cognac nguyên bản trong tất cả các asset.',
  },
  qcChecklist: [
    { checkItem: 'Kiểm tra chất liệu da bò thật mềm mại', whyItMatters: 'Khách hàng quan tâm nhất đến độ mềm và bền của da.', statusDefault: true },
    { checkItem: 'Kiểm tra chi tiết nơ da may tay', whyItMatters: 'Điểm nhấn thiết kế quan trọng nhất tạo nên vẻ đẹp vintage.', statusDefault: true },
    { checkItem: 'Kiểm tra chiều cao đế 3.5cm', whyItMatters: 'Đảm bảo tôn dáng nhưng không làm đau chân.', statusDefault: true },
    { checkItem: 'Kiểm tra quà tặng tất ren vintage', whyItMatters: 'Yếu tố gia tăng tỷ lệ chuyển đổi đơn hàng.', statusDefault: true },
    { checkItem: 'Kiểm tra giá bán 59.600 VNĐ', whyItMatters: 'Tuyệt đối trung thực về giá bán trên video affiliate.', statusDefault: true },
  ],
  generatedAt: '2026-08-20T19:00:00.000Z',
  platform: 'TikTok',
};

export const P001_RESTORED_ASSETS: RestoredAssetBank = {
  s001: {
    videoUrl: MARY_JANE_IMAGE,
    qcResult: S001_QC,
    isApproved: true,
  },
  s002: {
    videoUrl: MARY_JANE_IMAGE,
    qcResult: S002_QC,
    isApproved: true,
  },
  s003: {
    imageUrl: MARY_JANE_IMAGE,
    videoUrl: MARY_JANE_IMAGE,
    imageQcResult: S003_IMAGE_QC,
    videoQcResult: S003_VIDEO_QC,
    isApproved: true,
  },
};

export const P001_AUDIO_BANK: Record<string, AudioBankItem> = {
  P001_V01: {
    productId: 'Giày Mary Jane Nữ Da Bò Mũi Tròn Phối Nơ & Khóa Cài Cổ Điển',
    videoId: 'P001_V01',
    scriptVersion: 'v1.0 (SCRIPT APPROVED)',
    salesAngle: 'PRICE / VALUE (59.600 VNĐ)',
    voiceProfile: {
      gender: 'female',
      style: 'natural',
      speed: 'medium',
      geminiVoiceName: 'Kore',
    },
    engine: 'GEMINI_TTS',
    voiceStatus: 'NOT_CREATED',
    audioUrl: null,
    duration: 0,
    targetDuration: 19,
    durationStatus: 'DURATION MISMATCH',
    voiceDirection: 'Giọng Nữ | natural | Nhịp vừa phải ➔ [PRICE / VALUE]: Rõ ràng, thân thiện, nhịp hơi nhanh, nhấn mạnh vào mức giá chưa tới sáu mươi nghìn và ưu đãi tặng tất ren một cách thuyết phục nhưng không chém gió.',
    voiceQc: null,
    isApproved: false,
    approvedAt: null,
    createdAt: '2026-08-20T19:08:00.000Z',
  },
};

export const P001_ASSET_STATE: AssetReadinessState = {
  s001Ready: true,
  s001Status: 'COMPLETED',
  s001Approved: true,
  s002Ready: true,
  s002Status: 'COMPLETED',
  s002Approved: true,
  s003Ready: true,
  s003Status: 'COMPLETED',
  s003Approved: true,
};

// Complete Mary Jane Project P001
export const PROJECT_P001: ProductionProject = {
  id: 'P001',
  name: 'Giày Mary Jane Nữ Da Bò Mũi Tròn Phối Nơ & Khóa Cài Cổ Điển',
  category: 'Giày dép & Thời trang nữ',
  price: '59.600 ₫ (Flash Sale Tặng Kèm Tất Ren Vintage)',
  verifiedPrice: '59.600 VNĐ',
  description: `Chất liệu da bò thật mềm êm, mũi giày bo tròn cổ điển phối nơ da may tỉ mỉ, quai ngang Mary Jane bản mảnh với khóa cài kim loại ánh kim cao cấp. Đế cao su đúc nguyên khối chống trơn trượt cao 3.5cm tôn dáng, lót trong êm ái thoáng khí không đau chân khi đi bộ nhiều. Phong cách vintage Lolita / French Chic thanh lịch.`,
  targetAudience: `Nữ giới 18 - 32 tuổi yêu thích phong cách thời trang Vintage, Parisian Chic, Lolita nhẹ nhàng hoặc nữ sinh, dân công sở phối cùng váy xòe, blazer.`,
  platform: 'TikTok',
  conceptCount: 5,
  imageData: {
    mimeType: 'image/svg+xml',
    data: safeUtf8ToBase64(MARY_JANE_IMAGE),
    previewUrl: MARY_JANE_IMAGE,
  },
  productionSheet: P001_PRODUCTION_SHEET,
  assetState: P001_ASSET_STATE,
  restoredAssets: P001_RESTORED_ASSETS,
  variations: P001_VARIATIONS,
  audioBank: P001_AUDIO_BANK,
  status: 'COMPLETED_STAGE_4',
  lastModified: '2026-08-20T19:15:00.000Z',
  createdAt: '2026-08-20T18:30:00.000Z',
  totalScriptsApproved: 5,
  assetsReadyCount: 3,
};

// In-memory + LocalStorage Projects Repository
const STORAGE_KEY = 'xuong_video_projects_v4';

export function getAllProjects(): ProductionProject[] {
  if (typeof window === 'undefined' || !window.localStorage) return [PROJECT_P001];
  try {
    // Dynamic import/load of stored audio bank for P001
    const p001StorageKey = 'xuong_audio_bank_v4_P001';
    let storedP001Audio: Record<string, AudioBankItem> = { ...P001_AUDIO_BANK };
    try {
      const rawAudio = window.localStorage.getItem(p001StorageKey);
      if (rawAudio) {
        const parsedAudio = JSON.parse(rawAudio);
        if (parsedAudio && typeof parsedAudio === 'object') {
          storedP001Audio = { ...storedP001Audio, ...parsedAudio };
          // Preserve P001_V01 IMMUTABLE APPROVED status
          if (P001_AUDIO_BANK['P001_V01']?.isApproved) {
            storedP001Audio['P001_V01'] = {
              ...storedP001Audio['P001_V01'],
              ...P001_AUDIO_BANK['P001_V01'],
              isApproved: true,
            };
          }
        }
      }
    } catch {}

    const projectWithCurrentAudio: ProductionProject = {
      ...PROJECT_P001,
      audioBank: storedP001Audio,
    };

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (Array.isArray(stored) && stored.length > 0) {
        // Ensure P001 exists with full data and synced audio
        const p001Index = stored.findIndex((p: ProductionProject) => p.id === 'P001');
        if (p001Index < 0) {
          stored.unshift(projectWithCurrentAudio);
        } else {
          stored[p001Index] = {
            ...stored[p001Index],
            audioBank: {
              ...(stored[p001Index].audioBank || {}),
              ...storedP001Audio,
            },
          };
        }
        return stored;
      }
    }
    return [projectWithCurrentAudio];
  } catch (e) {
    console.warn('Cannot read projects from localStorage:', e);
  }
  return [PROJECT_P001];
}

export function getProjectById(id: string): ProductionProject | null {
  const all = getAllProjects();
  return all.find((p) => p.id === id) || (id === 'P001' ? getAllProjects()[0] : null);
}

export function saveProject(project: ProductionProject): void {
  try {
    const all = getAllProjects();
    const existingIndex = all.findIndex((p) => p.id === project.id);
    if (existingIndex >= 0) {
      all[existingIndex] = { ...project, lastModified: new Date().toISOString() };
    } else {
      all.unshift({ ...project, lastModified: new Date().toISOString() });
    }
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Also persist audioBank to dedicated audio storage key
    if (project.audioBank && Object.keys(project.audioBank).length > 0) {
      const audioKey = `xuong_audio_bank_v4_${project.id || 'P001'}`;
      window.localStorage.setItem(audioKey, JSON.stringify(project.audioBank));
    }
  } catch (e) {
    console.warn('Cannot save project to localStorage:', e);
  }
}

/**
 * Checks if product matches an existing project by ID or by name keywords
 */
export function findMatchingProject(nameOrId: string): ProductionProject | null {
  if (!nameOrId) return null;
  const lower = nameOrId.toLowerCase().trim();

  // Match by exact ID
  if (lower === 'p001' || lower === 'sample-5') {
    return getProjectById('P001') || PROJECT_P001;
  }

  // Match by Mary Jane keyword
  if (
    lower.includes('mary jane') ||
    lower.includes('giày mary jane') ||
    lower.includes('giay mary jane') ||
    lower.includes('nơ da')
  ) {
    return getProjectById('P001') || PROJECT_P001;
  }

  const all = getAllProjects();
  const found = all.find(
    (p) =>
      p.id.toLowerCase() === lower ||
      p.name.toLowerCase().includes(lower) ||
      lower.includes(p.name.toLowerCase())
  );
  return found || null;
}

export function restoreProjectP001(): ProductionProject {
  return getProjectById('P001') || PROJECT_P001;
}
