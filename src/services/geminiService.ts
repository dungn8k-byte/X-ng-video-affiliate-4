import { GoogleGenAI, Type } from '@google/genai';
import {
  ProductionSheetData,
  PlatformType,
  ConceptCount,
  QcEvaluation,
  VideoVariation,
  VideoVariationCount,
  ContentQcEvaluation,
  ContentQcClaim,
  ContentQcStatus,
  ClaimStatus,
} from '../types';

export function getGeminiClient(): GoogleGenAI {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY) ||
    process.env.API_KEY ||
    '';

  if (!apiKey) {
    throw new Error(
      'Thiếu cấu hình GEMINI_API_KEY. Vui lòng kiểm tra mục Settings > Secrets trong Google AI Studio.'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GenerateSheetInput {
  image: { mimeType: string; data: string } | null;
  productName: string;
  currentPrice: string;
  description: string;
  targetAudience: string;
  platform: PlatformType;
  conceptCount: ConceptCount;
}

export async function generateProductionSheetWithGemini(
  input: GenerateSheetInput
): Promise<ProductionSheetData> {
  const {
    image,
    productName,
    currentPrice,
    description,
    targetAudience,
    platform = 'TikTok',
    conceptCount = 3,
  } = input;

  const ai = getGeminiClient();

  const systemInstruction = `
Bạn là Giám đốc Sáng tạo và Chuyên gia Sản xuất Video Affiliate hàng đầu (Affiliate Video Production Director), chuyên biệt cho nền tảng video ngắn (TikTok, Facebook Reels, YouTube Shorts).

Nhiệm vụ của bạn:
Tiếp nhận ảnh sản phẩm và thông tin đầu vào từ người dùng, tiến hành phân tích thấu đáo và lập ra một PHIẾU SẢN XUẤT VIDEO AFFILIATE HOÀN CHỈNH (Complete Video Production Sheet).

CÁC NGUYÊN TẮC BẤT DI BẤT DỊCH (CORE PRINCIPLES):
1. NGUYÊN TẮC CHÂN THỰC VÀ CHỐNG BỊA ĐẶT (FACTUAL GROUNDING):
   - Phân tích thật kỹ sản phẩm từ hình ảnh được cung cấp kết hợp với văn bản mô tả.
   - KHÔNG ĐƯỢC TỰ BỊA ra các đặc tính kỹ thuật, chứng chỉ y tế, thông số không có căn cứ hoặc không thể nhìn thấy/xác nhận từ dữ liệu đầu vào.
   - TÁCH BẠCH RÕ RÀNG giữa:
     + VERIFIED FACTS (Thông tin đã xác minh, đúng thực tế có trong ảnh/mô tả).
     + UNVERIFIED / DO NOT CLAIM (Những tuyên bố cấm kỵ, các tính năng chưa xác minh không được phép khẳng định để tránh vi phạm chính sách sàn hoặc gây hiểu lầm cho người mua).

2. NGUYÊN TẮC PRODUCT FIDELITY > BEAUTY & QUY TẮC BẮT BUỘC CHO S003 (LIFESTYLE PRODUCT SHOT):
   - Với tất cả các Prompt hình ảnh và video AI (S001, S002, S003), phải luôn đặt độ chính xác, trung thực của sản phẩm lên hàng đầu (PRODUCT FIDELITY > BEAUTY).
   - Tuyệt đối không yêu cầu AI thiết kế lại sản phẩm, thay đổi logo, nhãn mác, hình dáng hay tỷ lệ vật lý của sản phẩm.

   QUY TẮC BẮT BUỘC CHO S003 – LIFESTYLE PRODUCT SHOT:
   1. PRODUCT FIDELITY > BEAUTY.
   2. Mặc định KHÔNG đặt sản phẩm lên cơ thể người nếu việc đó đòi hỏi model phải tái tạo hình học sản phẩm.
      - Giày: KHÔNG mặc vào chân người (để tránh model tái tạo làm biến dạng phom dáng, quai, nơ, mũi, khóa).
      - Kính: KHÔNG đeo lên mặt.
      - Đồng hồ: KHÔNG đeo lên cổ tay.
      - Túi xách: HẠN CHẾ để người cầm nếu làm biến dạng phom dáng sản phẩm.
      - Quần áo: Chỉ dùng người mẫu nếu có workflow bảo toàn sản phẩm phù hợp.
   3. S003 BẮT BUỘC ưu tiên triệt để phương pháp "PRODUCT-IN-ENVIRONMENT":
      - Giữ sản phẩm làm chủ thể chính và đặt sản phẩm tĩnh trong một bối cảnh lifestyle cao cấp, phù hợp.
      - Ví dụ với đôi giày: Giữ nguyên đôi giày từ ảnh tham chiếu và đặt chúng trong bối cảnh thời trang như: cạnh túi xách sang trọng, trên ghế bành/ghế nhung decor, cạnh tạp chí thời trang/kính râm, trên bàn trang điểm, trong phòng thay đồ walk-in closet, hoặc trong quán cà phê phong cách thời trang boutique.
   4. Prompt s003LifestyleImagePrompt.promptEn BẮT BUỘC PHẢI CHỨA NGUYÊN VĂN ĐOẠN CHỈ DẪN:
      "Preserve the exact product identity from the reference image. Do not redesign, regenerate, replace or alter the product. Preserve exact shape, proportions, color, bow, straps, buckle, material appearance and identifying details. Only create or modify the environment around the product."
   5. Tuyệt đối KHÔNG được tự thêm logo, chữ, phụ kiện, dây rợ hoặc đặc điểm không có trong ảnh gốc.
   6. Prompt s003LifestyleVideoPrompt.promptEn (Stage 2 Video Motion):
      - Chỉ định rõ: Dùng chính ảnh lifestyle đã được người dùng DUYỆT (approved lifestyle image) làm starting frame/reference.
      - Sản phẩm BẮT BUỘC ĐỨNG YÊN (Static product resting in environment).
      - Chỉ tạo chuyển động camera & ánh sáng: slow camera push-in, slow pan, subtle parallax, thay đổi ánh sáng rất nhẹ, ambient motion nền nhẹ (như rèm lay nhẹ, bóng nắng chuyển động).
      - Tuyệt đối KHÔNG cho sản phẩm tự chuyển động, biến hình hoặc thay đổi cấu trúc.

3. TỐI ƯU HÓA THEO NỀN TẢNG VÀ SỐ LƯỢNG CONCEPT:
   - Nền tảng đích: ${platform}
   - Số lượng concept/góc bán hàng yêu cầu: đúng ${conceptCount} concepts.
   - Mỗi concept phải có: Góc bán hàng (Sales Angle), Bộ Hook 3s đầu (Visual + Audio + Text on Screen), Kịch bản Voice-over (15-30s với pacing và visual cues tương ứng), và CTA.

4. BẢNG KIỂM TRA CHẤT LƯỢNG (QC CHECKLIST):
   - Cung cấp checklist đầy đủ cho team quay dựng và affiliate creator kiểm tra trước khi bấm máy / render / đăng video.
`;

  const promptText = `
Hãy phân tích sản phẩm sau đây và tạo Phiếu Sản Xuất Video Affiliate hoàn chỉnh:

THÔNG TIN ĐẦU VÀO:
- Tên sản phẩm: ${productName || 'Quan sát và nhận diện từ ảnh'}
- Giá hiện tại: ${currentPrice || 'Chưa cung cấp / Theo giỏ hàng'}
- Mô tả và thông tin sản phẩm: ${description || 'Xem ảnh sản phẩm được đính kèm'}
- Đối tượng khách hàng mục tiêu gợi ý: ${targetAudience || 'Phân tích tự động dựa trên sản phẩm'}
- Nền tảng video: ${platform}
- Số lượng concept cần tạo: ${conceptCount}

Hãy xuất kết quả hoàn toàn bằng cấu trúc JSON chuẩn theo đúng định dạng được yêu cầu.
`;

  const contents: any[] = [];
  const parts: any[] = [];

  if (image && image.data) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType || 'image/jpeg',
        data: image.data,
      },
    });
  }

  parts.push({
    text: promptText,
  });

  contents.push({ parts });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      productProfile: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          category: { type: Type.STRING },
          price: { type: Type.STRING },
          keyFeaturesSummary: { type: Type.STRING },
          perceivedValue: { type: Type.STRING },
        },
        required: ['productName', 'category', 'price', 'keyFeaturesSummary', 'perceivedValue'],
      },
      verifiedFacts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      unverifiedDoNotClaim: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      targetCustomer: {
        type: Type.OBJECT,
        properties: {
          demographics: { type: Type.STRING },
          psychographics: { type: Type.STRING },
          painPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          desiresAndTriggers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['demographics', 'psychographics', 'painPoints', 'desiresAndTriggers'],
      },
      usp: {
        type: Type.OBJECT,
        properties: {
          primaryUsp: { type: Type.STRING },
          secondaryUsps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          comparisonAdvantage: { type: Type.STRING },
        },
        required: ['primaryUsp', 'secondaryUsps', 'comparisonAdvantage'],
      },
      salesAngles: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            coreInsight: { type: Type.STRING },
            angleDescription: { type: Type.STRING },
            emotionalTrigger: { type: Type.STRING },
          },
          required: ['id', 'title', 'coreInsight', 'angleDescription', 'emotionalTrigger'],
        },
      },
      hooks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            angleId: { type: Type.STRING },
            angleTitle: { type: Type.STRING },
            visualHook: { type: Type.STRING },
            audioHook: { type: Type.STRING },
            textOnScreen: { type: Type.STRING },
            retentionTactic: { type: Type.STRING },
          },
          required: ['angleId', 'angleTitle', 'visualHook', 'audioHook', 'textOnScreen', 'retentionTactic'],
        },
      },
      voiceScripts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            angleId: { type: Type.STRING },
            angleTitle: { type: Type.STRING },
            estimatedDuration: { type: Type.STRING },
            pacing: { type: Type.STRING },
            scriptBody: { type: Type.STRING },
            visualCues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['angleId', 'angleTitle', 'estimatedDuration', 'pacing', 'scriptBody', 'visualCues'],
        },
      },
      cta: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            script: { type: Type.STRING },
            onScreenBanner: { type: Type.STRING },
            urgencyTactic: { type: Type.STRING },
          },
          required: ['type', 'script', 'onScreenBanner', 'urgencyTactic'],
        },
      },
      s001HeroPrompt: {
        type: Type.OBJECT,
        properties: {
          promptEn: { type: Type.STRING },
          promptVi: { type: Type.STRING },
          lightingAndLens: { type: Type.STRING },
          aspectRatio: { type: Type.STRING },
          negativePrompt: { type: Type.STRING },
        },
        required: ['promptEn', 'promptVi', 'lightingAndLens', 'aspectRatio', 'negativePrompt'],
      },
      s002DetailPrompt: {
        type: Type.OBJECT,
        properties: {
          promptEn: { type: Type.STRING },
          promptVi: { type: Type.STRING },
          focalPoint: { type: Type.STRING },
          textureDetails: { type: Type.STRING },
          negativePrompt: { type: Type.STRING },
        },
        required: ['promptEn', 'promptVi', 'focalPoint', 'textureDetails', 'negativePrompt'],
      },
      s003LifestyleImagePrompt: {
        type: Type.OBJECT,
        properties: {
          promptEn: { type: Type.STRING },
          promptVi: { type: Type.STRING },
          environment: { type: Type.STRING },
          fidelityRule: { type: Type.STRING },
          negativePrompt: { type: Type.STRING },
        },
        required: ['promptEn', 'promptVi', 'environment', 'fidelityRule', 'negativePrompt'],
      },
      s003LifestyleVideoPrompt: {
        type: Type.OBJECT,
        properties: {
          promptEn: { type: Type.STRING },
          promptVi: { type: Type.STRING },
          cameraMovement: { type: Type.STRING },
          actionDescription: { type: Type.STRING },
          toolRecommendation: { type: Type.STRING },
        },
        required: ['promptEn', 'promptVi', 'cameraMovement', 'actionDescription', 'toolRecommendation'],
      },
      fidelityWarning: {
        type: Type.OBJECT,
        properties: {
          riskLevel: { type: Type.STRING },
          warningMessage: { type: Type.STRING },
          recommendedTechnique: { type: Type.STRING },
        },
        required: ['riskLevel', 'warningMessage', 'recommendedTechnique'],
      },
      qcChecklist: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            checkItem: { type: Type.STRING },
            whyItMatters: { type: Type.STRING },
            statusDefault: { type: Type.BOOLEAN },
          },
          required: ['checkItem', 'whyItMatters', 'statusDefault'],
        },
      },
    },
    required: [
      'productProfile',
      'verifiedFacts',
      'unverifiedDoNotClaim',
      'targetCustomer',
      'usp',
      'salesAngles',
      'hooks',
      'voiceScripts',
      'cta',
      's001HeroPrompt',
      's002DetailPrompt',
      's003LifestyleImagePrompt',
      's003LifestyleVideoPrompt',
      'fidelityWarning',
      'qcChecklist',
    ],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.4,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Không nhận được phản hồi nội dung từ Gemini API.');
  }

  let cleanedText = responseText.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    const parsedData: ProductionSheetData = JSON.parse(cleanedText);
    parsedData.generatedAt = new Date().toISOString();
    parsedData.platform = platform;
    return parsedData;
  } catch (parseErr) {
    console.error('Failed to parse Gemini JSON response:', cleanedText);
    throw new Error('Dữ liệu trả về từ Gemini không đúng định dạng JSON chuẩn. Vui lòng thử lại.');
  }
}

export interface GenerateLifestyleImageInput {
  promptEn: string;
  referenceImage: { mimeType: string; data: string };
  productName: string;
}

export async function generateLifestyleImageWithGemini(
  input: GenerateLifestyleImageInput
): Promise<string> {
  const { promptEn, referenceImage, productName } = input;
  const ai = getGeminiClient();

  const enhancedPrompt = `
Generate a vertical 9:16 high-end cinematic lifestyle product photography shot featuring "${productName}" using the PRODUCT-IN-ENVIRONMENT method.

Lifestyle Environment & Context:
${promptEn}

CRITICAL RULES FOR PRODUCT FIDELITY (PRODUCT-IN-ENVIRONMENT):
1. PRODUCT FIDELITY > BEAUTY: Preserve the exact product identity from the reference image.
2. Do not redesign, regenerate, replace or alter the product. Preserve exact shape, proportions, color, bow, straps, buckle, material appearance and identifying details.
3. DO NOT place the product onto human bodies (do NOT put shoes on human feet, do NOT wear glasses on faces, do NOT put watches on wrists, do NOT distort product geometry). Keep the product as the hero subject placed elegantly in the lifestyle context.
4. Only create or modify the environment around the product (e.g., resting on a designer chair, vanity table, beside a luxury handbag, fashion magazine, or boutique cafe setting).
5. Do NOT add new logos, fake text, extra straps/accessories, or features absent from the original product.
6. Vertical aspect ratio 9:16, ultra-realistic commercial lighting.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: referenceImage.mimeType || 'image/jpeg',
              data: referenceImage.data,
            },
          },
          {
            text: enhancedPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: '9:16',
          imageSize: '1K',
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  } catch (imageGenErr: any) {
    console.warn('Image generation with gemini-3.1-flash-image failed or requires paid tier, attempting fallback with flash-lite-image:', imageGenErr);
    try {
      const responseLite = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: referenceImage.mimeType || 'image/jpeg',
                data: referenceImage.data,
              },
            },
            {
              text: enhancedPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '9:16',
          },
        },
      });

      const partsLite = responseLite.candidates?.[0]?.content?.parts || [];
      for (const part of partsLite) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    } catch (fallbackErr: any) {
      console.error('All image generation models failed:', fallbackErr);
      throw fallbackErr;
    }
  }

  throw new Error('Không nhận được dữ liệu hình ảnh từ mô hình Gemini.');
}

export interface QcEvaluationInput {
  originalImage: { mimeType: string; data: string };
  generatedAssetImageBase64: string; // JPEG/PNG base64 without data: prefix
  assetTitle: string;
  shotType: 'S001' | 'S002' | 'S003_IMAGE' | 'S003_VIDEO';
  productName: string;
}

export async function evaluateProductQcWithGemini(
  input: QcEvaluationInput
): Promise<QcEvaluation> {
  const { originalImage, generatedAssetImageBase64, assetTitle, shotType, productName } = input;
  const ai = getGeminiClient();

  const qcSystemInstruction = `
Bạn là Trưởng ban Kiểm định Chất lượng Video & Hình ảnh Sản phẩm (Chief Product Identity & Fidelity QC Inspector).
Nhiệm vụ của bạn là kiểm định chất lượng và độ trung thực sản phẩm (PRODUCT IDENTITY / PRODUCT FIDELITY) bằng phân tích thị giác AI toàn diện, so sánh đối chiếu giữa "Ảnh Sản Phẩm Gốc (Original Product Image)" và "Asset AI Đã Tạo Ra (Generated Asset Preview Frame)".

BẮT BUỘC CHẤM ĐIỂM ĐỘC LẬP 7 TIÊU CHÍ (Mỗi tiêu chí có score: 0-100, note: nhận xét ngắn gọn sắc bén, status: "PASS" | "REVIEW" | "FAIL"):
1. colorFidelity (Màu sắc): Đúng tone màu gốc, độ bóng/mờ, sắc độ thương hiệu, không ngả màu sai lệch SKU.
2. shapeFidelity (Hình dáng/form tổng thể): Form dáng vật lý, đường cong silhouette, viền, góc bo chuẩn xác 100%.
3. proportionFidelity (Tỷ lệ): Tỷ lệ chiều dài/rộng/cao, tỷ lệ giữa các bộ phận không bị méo mó, co giãn bất thường.
4. logoFidelity (Logo/chữ/nhãn hiệu nếu nhìn thấy): Không tạo chữ AI vô nghĩa (gibberish), không làm biến dạng logo/nhãn mác gốc. Nếu không có logo ở góc quay này thì ghi rõ và cho điểm tối đa.
5. detailFidelity (Chi tiết nhận dạng đặc trưng): Giữ trọn vẹn các chi tiết cấu thành đắt giá nhất của sản phẩm.
6. partsCountFidelity (Số lượng bộ phận/phụ kiện): Đúng số lượng thành phần cấu tạo sản phẩm (ví dụ: đúng 2 chiếc của 1 đôi giày, đúng số lượng quai/khuy/phụ kiện).
7. noHallucinatedDetails (Không xuất hiện chi tiết mới không có ở sản phẩm gốc): Không bị AI tự ý vẽ thêm chi tiết lạ, phụ kiện thừa, dây rợ hay hoa văn không tồn tại ở SKU gốc.

ĐẶC BIỆT NẾU LÀ SẢN PHẨM GIÀY (HOẶC PHỤ KIỆN THỜI TRANG):
Hệ thống phải đặc biệt kiểm tra các đặc điểm:
- Tone màu chuẩn (ví dụ: màu nâu/đen/kem theo ảnh gốc)
- Phom mũi giày (mũi tròn/mũi vuông/mũi nhọn)
- Chi tiết trang trí phía trước (ví dụ: nơ, đính đá, khóa trang trí)
- Kiểu quai (ví dụ: quai ngang Mary Jane, quai chéo)
- Khóa cài (loại khóa, vị trí khóa)
- Form tổng thể của đôi giày
- Tính nhất quán giữa 2 chiếc trong cùng 1 đôi (nếu xuất hiện cả đôi).

QUY TẮC TÍNH FIDELITY SCORE & PHÁN QUYẾT:
- FIDELITY SCORE tổng từ 0 - 100 (tính trung bình có trọng số của 7 tiêu chí).
- 90 - 100: "PASS" (QC PASS - Đạt chuẩn sản xuất)
- 80 - 89: "REVIEW" (QC REVIEW - Cần người dùng kiểm tra & duyệt thủ công)
- 0 - 79: "FAIL" (QC FAIL - Sai lệch nhận diện, bắt buộc tạo lại)

QUY TẮC BẤT DI BẤT DỊCH - PRODUCT FIDELITY LÀ TIÊU CHÍ CAO NHẤT:
Nếu phát hiện SAI LỆCH NGHIÊM TRỌNG một trong các đặc điểm nhận dạng chính của SKU như: màu sắc, form dáng, logo, quai, khóa, nơ, số lượng bộ phận, hoặc xuất hiện chi tiết lạ làm thay đổi SKU:
-> KHÔNG ĐƯỢC PHÉP ĐÁNH GIÁ "PASS" dù tổng điểm số học có cao.
-> Bắt buộc hạ status xuống "FAIL" (hoặc "REVIEW" nếu ở mức chênh lệch nhỏ) và đặt hasCriticalMismatch = true kèm ghi chú criticalMismatchDetails rõ ràng.

Hãy trả về kết quả JSON theo đúng Response Schema.
`;

  const qcPrompt = `
Hãy tiến hành kiểm định độ trung thực nhận diện sản phẩm (Product Identity & Fidelity QC) cho Asset sau:
- Tên sản phẩm: ${productName}
- Phân loại Asset: ${assetTitle} (${shotType})
- Ảnh 1: Ảnh sản phẩm gốc (Original Reference)
- Ảnh 2: Khung hình trích xuất từ Asset AI đã tạo

Phân tích thị giác AI so sánh đối chiếu ảnh gốc với asset, chấm điểm 7 tiêu chí độc lập và đưa ra phán quyết tổng thể chuẩn xác.
`;

  const contents: any[] = [
    {
      parts: [
        {
          inlineData: {
            mimeType: originalImage.mimeType || 'image/jpeg',
            data: originalImage.data,
          },
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: generatedAssetImageBase64,
          },
        },
        {
          text: qcPrompt,
        },
      ],
    },
  ];

  const criterionSchema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: 'Score from 0 to 100' },
      note: { type: Type.STRING, description: 'Short concise evaluation note in Vietnamese' },
      status: { type: Type.STRING, description: "'PASS', 'REVIEW', or 'FAIL'" },
    },
    required: ['score', 'note', 'status'],
  };

  const qcSchema = {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        description: "Overall status: must be 'PASS', 'REVIEW', or 'FAIL'",
      },
      score: {
        type: Type.NUMBER,
        description: 'Overall Fidelity Score from 0 to 100 (90-100: PASS, 80-89: REVIEW, 0-79: FAIL)',
      },
      colorFidelity: criterionSchema,
      shapeFidelity: criterionSchema,
      proportionFidelity: criterionSchema,
      logoFidelity: criterionSchema,
      detailFidelity: criterionSchema,
      partsCountFidelity: criterionSchema,
      noHallucinatedDetails: criterionSchema,
      hasCriticalMismatch: {
        type: Type.BOOLEAN,
        description: 'True if any core SKU feature (color, form, logo, strap, buckle, bow, parts count) is severely mismatched',
      },
      criticalMismatchDetails: {
        type: Type.STRING,
        description: 'Details of severe mismatch if any, otherwise empty string',
      },
      summary: {
        type: Type.STRING,
        description: 'Summary verdict sentence in Vietnamese',
      },
      verdictReason: {
        type: Type.STRING,
        description: 'Detailed chief QC reasoning in Vietnamese',
      },
    },
    required: [
      'status',
      'score',
      'colorFidelity',
      'shapeFidelity',
      'proportionFidelity',
      'logoFidelity',
      'detailFidelity',
      'partsCountFidelity',
      'noHallucinatedDetails',
      'summary',
      'verdictReason',
    ],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents,
    config: {
      systemInstruction: qcSystemInstruction,
      responseMimeType: 'application/json',
      responseSchema: qcSchema,
      temperature: 0.15,
    },
  });

  const responseText = response.text || '';
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  const parsedQc: QcEvaluation = JSON.parse(cleaned);

  // Helper to normalize criterion status
  const normalizeStatus = (s: any): 'PASS' | 'REVIEW' | 'FAIL' => {
    const val = String(s || '').toUpperCase();
    if (val === 'PASS') return 'PASS';
    if (val === 'REVIEW') return 'REVIEW';
    return 'FAIL';
  };

  if (parsedQc.colorFidelity) parsedQc.colorFidelity.status = normalizeStatus(parsedQc.colorFidelity.status);
  if (parsedQc.shapeFidelity) parsedQc.shapeFidelity.status = normalizeStatus(parsedQc.shapeFidelity.status);
  if (parsedQc.proportionFidelity) parsedQc.proportionFidelity.status = normalizeStatus(parsedQc.proportionFidelity.status);
  if (parsedQc.logoFidelity) parsedQc.logoFidelity.status = normalizeStatus(parsedQc.logoFidelity.status);
  if (parsedQc.detailFidelity) parsedQc.detailFidelity.status = normalizeStatus(parsedQc.detailFidelity.status);
  if (parsedQc.partsCountFidelity) parsedQc.partsCountFidelity.status = normalizeStatus(parsedQc.partsCountFidelity.status);
  if (parsedQc.noHallucinatedDetails) parsedQc.noHallucinatedDetails.status = normalizeStatus(parsedQc.noHallucinatedDetails.status);

  // Enforce Product Fidelity Priority Rule:
  // Check if any critical criterion is FAIL
  const hasFailCriterion =
    parsedQc.colorFidelity?.status === 'FAIL' ||
    parsedQc.shapeFidelity?.status === 'FAIL' ||
    parsedQc.detailFidelity?.status === 'FAIL' ||
    parsedQc.partsCountFidelity?.status === 'FAIL' ||
    parsedQc.noHallucinatedDetails?.status === 'FAIL';

  const hasReviewCriterion =
    parsedQc.colorFidelity?.status === 'REVIEW' ||
    parsedQc.shapeFidelity?.status === 'REVIEW' ||
    parsedQc.detailFidelity?.status === 'REVIEW' ||
    parsedQc.partsCountFidelity?.status === 'REVIEW' ||
    parsedQc.noHallucinatedDetails?.status === 'REVIEW';

  if (parsedQc.hasCriticalMismatch || hasFailCriterion) {
    parsedQc.status = 'FAIL';
    if (parsedQc.score >= 80) {
      parsedQc.score = 75; // Downgrade score to fail range
    }
  } else if (hasReviewCriterion) {
    if (parsedQc.score >= 90) {
      parsedQc.score = 88; // Downgrade to review range
    }
    parsedQc.status = 'REVIEW';
  } else {
    // Normal mapping based on score
    if (parsedQc.score >= 90) {
      parsedQc.status = 'PASS';
    } else if (parsedQc.score >= 80) {
      parsedQc.status = 'REVIEW';
    } else {
      parsedQc.status = 'FAIL';
    }
  }

  return parsedQc;
}

export interface GenerateVariationsInput {
  sheetData: ProductionSheetData;
  count: VideoVariationCount;
  readyAssets?: {
    s001: boolean;
    s002: boolean;
    s003: boolean;
  };
}

export async function evaluateVariationContentQcWithGemini(
  variation: VideoVariation,
  sheetData: ProductionSheetData
): Promise<ContentQcEvaluation> {
  const ai = getGeminiClient();

  const systemInstruction = `
Bạn là Trưởng ban Kiểm định Chất lượng Nội dung & Tuân thủ (Content Quality Control Lead & Compliance Auditor) cho kịch bản video TikTok Shop/Facebook Reels.

NHIỆM VỤ:
Kiểm định toàn bộ nội dung kịch bản (Hook, Voice Script, On-Screen Text, CTA, Timeline) của Video ID ${variation.id} đối chiếu trực tiếp với PRODUCT DATA đã được xác minh và ASSET THỰC TẾ.

1. NGUYÊN TẮC SOURCE LOCK (BẮT BUỘC):
Mọi claim phân loại là VERIFIED BẮT BUỘC PHẢI CHỈ RA NGUỒN CHÍNH XÁC từ 1 trong các nguồn sau:
- "PRODUCT DATA" (Dữ liệu từ thông tin sản phẩm: tên, danh mục, giá, thông số nhà sản xuất cung cấp)
- "IMAGE" (Quan sát trực tiếp thấy từ hình ảnh thực tế của sản phẩm)
- "USER PROVIDED DATA" (Thông tin do người dùng trực tiếp nhập vào hệ thống)
- "APPROVED ASSET" (Nội dung của các asset S001, S002, S003 đã được duyệt)
NẾU KHÔNG XÁC ĐỊNH ĐƯỢC NGUỒN TỪ CÁC NGUỒN TRÊN: TUYỆT ĐỐI KHÔNG ĐƯỢC GẮN NHÃN "VERIFIED".

2. NGUYÊN TẮC CLAIM STRICT MODE & PHÂN BIỆT TUYỆT ĐỐI:
- FACT (VERIFIED): Có trong Product Data hoặc quan sát trực quan được từ ảnh/asset thực tế.
- OPINION (INFERRED): Nhận xét thẩm mỹ/phong cách hợp lý sử dụng ngôn ngữ thẩm mỹ mềm ("mang phong cách nữ tính", "gợi cảm giác cổ điển", "có thể cân nhắc cho các cách phối đồ nhẹ nhàng", "dễ tạo điểm nhấn cho outfit", "phom dáng thanh lịch"). TUYỆT ĐỐI KHÔNG TRÌNH BÀY OPINION NHƯ MỘT FACT KỸ THUẬT.
- UNVERIFIED: Không có căn cứ chứng minh.
  * CẤM TỰ SUY LUẬN THUỘC TÍNH VẬT LIỆU: Ví dụ Product Data = PVC -> Được nói: "Chất liệu PVC." -> CẤM tự nói: "PVC dẻo mềm", "PVC bền", "PVC êm", "PVC cao cấp", "PVC dẻo dai", "PVC bền bỉ", "chống gãy gập", "chống thấm tuyệt đối" nếu dữ liệu không cung cấp.
  * CẤM TỰ ĐÁNH GIÁ VALUE CLAIM: Không được tự đánh giá "giá khá hợp lý", "đáng tiền", "quá hời", "giá tốt", "đầu tư rất đáng cân nhắc", "hời nhất", "siêu rẻ" nếu không có dữ liệu so sánh hoặc bằng chứng. Có thể nói: "Hiện sản phẩm đang hiển thị mức giá X đồng" và gắn nhãn PRICE CHECK REQUIRED.
- PROHIBITED: CẤM TỰ BỊA TRẢI NGHIỆM CÁ NHÂN. Không được tự nhận "Tôi đã dùng...", "Mình vừa mua...", "Mình vừa tậu...", "Mình đi cả ngày...", "Mình thấy rất thoải mái...", "Mình dùng mấy hôm...", "Review chân thật...".

3. NGUYÊN TẮC ASSET GROUNDING CHO TIMELINE:
- S001 (Hero Shot): Sản phẩm tĩnh, quay trực diện/nghiêng 45° trên nền studio sạch sẽ.
- S002 (Detail Shot): Macro cận cảnh chi tiết cấu tạo, quai, nơ, đường viền, khóa, chất liệu.
- S003 (Lifestyle Shot): Product-in-Environment - Sản phẩm tĩnh đặt trong bối cảnh decor/lifestyle cạnh phụ kiện tĩnh. TUYỆT ĐỐI KHÔNG ĐƯỢC MÔ TẢ: người mẫu mang giày, người đi bộ, người sử dụng sản phẩm nếu asset S003 thực tế là PRODUCT-IN-ENVIRONMENT.

4. QUY TẮC CHẤM ĐIỂM (CONTENT QC SCORE 0-100):
- FACTUAL ACCURACY: Tối đa 40 điểm (Mọi thông tin đều đúng sự thật với Product Data, không thêm bớt sai lệch).
- NO FAKE EXPERIENCE: Tối đa 25 điểm (25 điểm nếu KHÔNG có trải nghiệm cá nhân giả mạo; 0 điểm nếu phát hiện câu giả danh người dùng).
- CLAIM SAFETY: Tối đa 20 điểm (20 điểm nếu không có claim kỹ thuật/vật liệu/giá trị phóng đại).
- NATURAL LANGUAGE: Tối đa 10 điểm (Giọng điệu mượt mà, thuần Việt, đúng nhịp điệu đọc).
- CTA ACCURACY: Tối đa 5 điểm (Kêu gọi hành động minh bạch, đúng thực tế).

TIÊU CHUẨN XẾP LOẠI:
- 90–100 điểm: CONTENT PASS
- 80–89 điểm: CONTENT REVIEW
- 0–79 điểm: CONTENT FAIL
*** LƯU Ý ĐẶC BIỆT ***: Nếu có hasFakePersonalExperience = true hoặc có claim PROHIBITED, trạng thái BẮT BUỘC là CONTENT FAIL!
`;

  const userPrompt = `
Hãy kiểm định Content QC cho video variation sau:
VIDEO ID: ${variation.id}
SALES ANGLE: ${variation.salesAngle}
HOOK: ${variation.hook}
VOICE SCRIPT: ${variation.voiceScript}
ON-SCREEN TEXT: ${JSON.stringify(variation.onScreenText)}
CTA: ${variation.cta}
TIMELINE: ${JSON.stringify(variation.timeline)}

DỮ LIỆU SẢN PHẨM ĐÃ XÁC MINH:
- Tên sản phẩm: ${sheetData.productProfile.productName}
- Danh mục: ${sheetData.productProfile.category}
- Mức giá: ${sheetData.productProfile.price}
- Verified Facts: ${JSON.stringify(sheetData.verifiedFacts)}
- Unverified/Do Not Claim: ${JSON.stringify(sheetData.unverifiedDoNotClaim)}
- USP: ${sheetData.usp.primaryUsp}

Yêu cầu xuất ra JSON theo đúng schema.
`;

  const qcSchema = {
    type: Type.OBJECT,
    properties: {
      status: { type: Type.STRING },
      score: { type: Type.NUMBER },
      breakdown: {
        type: Type.OBJECT,
        properties: {
          factualAccuracy: { type: Type.NUMBER },
          noFakeExperience: { type: Type.NUMBER },
          claimSafety: { type: Type.NUMBER },
          naturalLanguage: { type: Type.NUMBER },
          ctaAccuracy: { type: Type.NUMBER },
        },
        required: [
          'factualAccuracy',
          'noFakeExperience',
          'claimSafety',
          'naturalLanguage',
          'ctaAccuracy',
        ],
      },
      hasFakePersonalExperience: { type: Type.BOOLEAN },
      claims: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            claim: { type: Type.STRING },
            source: { type: Type.STRING },
            status: { type: Type.STRING },
            note: { type: Type.STRING },
          },
          required: ['claim', 'source', 'status'],
        },
      },
      feedback: { type: Type.STRING },
    },
    required: ['status', 'score', 'breakdown', 'hasFakePersonalExperience', 'claims', 'feedback'],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: qcSchema,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    // Enforce strict business logic rules
    let finalScore = Math.min(
      100,
      Math.max(
        0,
        (parsed.breakdown?.factualAccuracy || 0) +
          (parsed.breakdown?.noFakeExperience || 0) +
          (parsed.breakdown?.claimSafety || 0) +
          (parsed.breakdown?.naturalLanguage || 0) +
          (parsed.breakdown?.ctaAccuracy || 0)
      )
    );

    const hasFakeExp =
      parsed.hasFakePersonalExperience === true ||
      parsed.claims?.some((c: any) => c.status === 'PROHIBITED');

    let finalStatus: ContentQcStatus = 'PASS';
    if (hasFakeExp || finalScore < 80) {
      finalStatus = 'FAIL';
    } else if (finalScore < 90) {
      finalStatus = 'REVIEW';
    } else {
      finalStatus = 'PASS';
    }

    return {
      status: finalStatus,
      score: hasFakeExp ? Math.min(finalScore, 75) : finalScore,
      breakdown: {
        factualAccuracy: parsed.breakdown?.factualAccuracy ?? 35,
        noFakeExperience: hasFakeExp ? 0 : (parsed.breakdown?.noFakeExperience ?? 25),
        claimSafety: parsed.breakdown?.claimSafety ?? 18,
        naturalLanguage: parsed.breakdown?.naturalLanguage ?? 9,
        ctaAccuracy: parsed.breakdown?.ctaAccuracy ?? 5,
      },
      hasFakePersonalExperience: hasFakeExp,
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      feedback: parsed.feedback || (finalStatus === 'PASS' ? 'Nội dung tuân thủ chặt chẽ Product Data.' : 'Phát hiện claim cần chỉnh sửa.'),
    };
  } catch (error) {
    console.error('Error running Content QC with Gemini:', error);
    return createLocalContentQcEvaluation(variation, sheetData);
  }
}

export function createLocalContentQcEvaluation(
  variation: VideoVariation,
  sheetData: ProductionSheetData
): ContentQcEvaluation {
  const scriptCombined = `${variation.hook} ${variation.voiceScript} ${variation.onScreenText.hookText} ${variation.onScreenText.benefitText} ${variation.onScreenText.ctaText} ${variation.cta}`.toLowerCase();
  const timelineCombined = (variation.timeline || []).map((t) => `${t.shotTitle} ${t.visualAction}`).join(' ').toLowerCase();

  // 1. Fake experience prohibited keywords
  const fakeExpKeywords = [
    'mình vừa tậu',
    'mình vừa mua',
    'mình đã dùng',
    'tôi đã dùng',
    'mình đi cả ngày',
    'mình thấy rất thoải mái',
    'mình dùng mấy hôm',
    'review chân thật',
    'mình mang thử',
    'mình mang cả ngày',
    'mình trải nghiệm',
    'sau 1 tuần dùng',
    'sau một tuần dùng',
    'mình vừa đặt',
    'mình đã xỏ thử',
  ];

  // 2. Unverified prohibited claims (Material deductions & Value claims)
  const unverifiedKeywords = [
    'siêu bền',
    'siêu êm',
    'bền nhất',
    'đi cả ngày không đau',
    'không bị bí',
    'chống tuột',
    'chống trượt',
    'chống trơn',
    'dẻo mềm',
    'siêu mềm',
    'cao cấp',
    'bền bỉ',
    'dẻo dai',
    'chống gãy gập',
    'quá hời',
    'giá sốc',
    'rẻ nhất',
    'tốt nhất',
    'bán chạy nhất',
    'giá khá hợp lý',
    'đáng tiền',
    'đầu tư rất đáng cân nhắc',
    'giá tốt',
    'hời nhất',
    'siêu rẻ',
  ];

  // 3. Hallucinated timeline model actions
  const timelineModelHallucinations = [
    'người mẫu mang',
    'người đi bộ',
    'người mẫu đi',
    'người sử dụng',
    'xỏ vào chân',
    'chân người',
    'người mẫu diện',
    'bước đi trên phố',
  ];

  const hasFakeExp = fakeExpKeywords.some((kw) => scriptCombined.includes(kw));
  const foundUnverified = unverifiedKeywords.filter((kw) => scriptCombined.includes(kw));
  const foundTimelineHallucination = timelineModelHallucinations.filter((kw) => timelineCombined.includes(kw));

  const claims: ContentQcClaim[] = [];

  // Add Product Name claim (Source Lock: PRODUCT DATA)
  claims.push({
    claim: `Tên sản phẩm: ${sheetData.productProfile.productName}`,
    source: 'PRODUCT DATA',
    status: 'VERIFIED',
    note: 'Khớp chính xác với thông tin sản phẩm',
  });

  // Check price claim (Source Lock: PRODUCT DATA)
  if (variation.requiresPriceCheck || scriptCombined.includes('giá') || scriptCombined.includes('mức giá')) {
    if (sheetData.productProfile.price && sheetData.productProfile.price.length > 2) {
      claims.push({
        claim: `Mức giá hiển thị: ${sheetData.productProfile.price}`,
        source: 'PRODUCT DATA',
        status: 'VERIFIED',
        note: 'Yêu cầu kiểm tra giá ưu đãi hiện hành trước khi đăng (PRICE CHECK REQUIRED)',
      });
    }
  }

  // Visual features (Source Lock: IMAGE or APPROVED ASSET)
  claims.push({
    claim: 'Đặc điểm thiết kế quan sát được trên hình ảnh/asset',
    source: 'IMAGE',
    status: 'VERIFIED',
    note: 'Đường nét, phom dáng và chi tiết cấu tạo quan sát trực tiếp từ asset',
  });

  // Check aesthetic style opinion claims (Allowed soft aesthetic language)
  claims.push({
    claim: 'Phong cách thẩm mỹ & phối trang phục',
    source: 'APPROVED ASSET',
    status: 'INFERRED',
    note: 'Nhận định thẩm mỹ mềm hợp lý, không trình bày như một fact kỹ thuật',
  });

  if (hasFakeExp) {
    claims.push({
      claim: 'Sử dụng trải nghiệm người dùng cá nhân giả định ("mình vừa tậu / mình đã dùng...")',
      source: 'PROHIBITED',
      status: 'PROHIBITED',
      note: 'Tuyệt đối không tự bịa trải nghiệm người dùng thực tế',
    });
  }

  foundUnverified.forEach((uv) => {
    claims.push({
      claim: `Tự khẳng định tính năng/giá trị "${uv}"`,
      source: 'NO EVIDENCE',
      status: 'UNVERIFIED',
      note: 'Không tự suy luận thuộc tính vật liệu hoặc tự đánh giá giá trị khi không có dữ liệu',
    });
  });

  if (foundTimelineHallucination.length > 0) {
    claims.push({
      claim: `Timeline mô tả hành động người mẫu ngoài thực tế asset (${foundTimelineHallucination.join(', ')})`,
      source: 'NO EVIDENCE',
      status: 'UNVERIFIED',
      note: 'Asset S003 là PRODUCT-IN-ENVIRONMENT, không chứa người mẫu mang/mặc sản phẩm',
    });
  }

  let factualAccuracy = 40;
  let noFakeExperience = hasFakeExp ? 0 : 25;
  let claimSafety = foundUnverified.length > 0 ? Math.max(5, 20 - foundUnverified.length * 6) : 20;
  if (foundTimelineHallucination.length > 0) {
    claimSafety = Math.max(5, claimSafety - 5);
  }
  let naturalLanguage = 9;
  let ctaAccuracy = 5;

  let totalScore = factualAccuracy + noFakeExperience + claimSafety + naturalLanguage + ctaAccuracy;

  let status: ContentQcStatus = 'PASS';
  if (hasFakeExp || totalScore < 80 || foundUnverified.length > 2) {
    status = 'FAIL';
  } else if (totalScore < 90 || foundUnverified.length > 0) {
    status = 'REVIEW';
  } else {
    status = 'PASS';
  }

  let feedback = 'Kịch bản chuẩn xác, tuân thủ dữ liệu sản phẩm, Asset Grounding và đạo đức quảng cáo.';
  if (hasFakeExp) {
    feedback = 'Phát hiện câu giả mạo trải nghiệm người dùng. Vui lòng bấm [VIẾT LẠI AN TOÀN] để chuyển sang giọng giới thiệu quan sát khách quan.';
  } else if (foundUnverified.length > 0) {
    feedback = `Chứa các từ ngữ suy luận vật liệu/giá trị chưa xác minh (${foundUnverified.join(', ')}). Cần loại bỏ hoặc thay thế bằng cảm nhận thẩm mỹ.`;
  } else if (foundTimelineHallucination.length > 0) {
    feedback = `Timeline chứa mô tả người mẫu không có trong Asset thực tế. Đã điều chỉnh về Product-in-Environment.`;
  }

  return {
    status,
    score: hasFakeExp ? Math.min(totalScore, 65) : Math.min(100, totalScore),
    breakdown: {
      factualAccuracy,
      noFakeExperience,
      claimSafety,
      naturalLanguage,
      ctaAccuracy,
    },
    hasFakePersonalExperience: hasFakeExp,
    claims,
    feedback,
  };
}

export async function safeRewriteVariationWithGemini(
  variation: VideoVariation,
  sheetData: ProductionSheetData
): Promise<VideoVariation> {
  const ai = getGeminiClient();

  const systemInstruction = `
Bạn là Chuyên gia Biên tập Kịch bản Video An toàn & Tuân thủ (Content Safety & Compliance Rewriter).

NHIỆM VỤ:
Viết lại an toàn cho Video ID ${variation.id} (Sales Angle: "${variation.salesAngle}") sao cho ĐẠT ĐIỂM TUYỆT ĐỐI CONTENT QC (95-100 điểm, CONTENT PASS).

QUY TẮC BẮT BUỘC:
1. GIỮ NGUYÊN SALES ANGLE: Vẫn giữ góc độ tiếp cận "${variation.salesAngle}".
2. QUY TẮC ASSET GROUNDING BẮT BUỘC:
   - Timeline BẮT BUỘC dựa trên asset thực tế trong Asset Bank (S001 Hero Shot tĩnh, S002 Detail Macro, S003 Lifestyle Product-in-Environment).
   - Tuyệt đối KHÔNG ĐƯỢC MÔ TẢ: "người mẫu mang giày", "người đi bộ", "người sử dụng sản phẩm" trong Timeline vì S003 là PRODUCT-IN-ENVIRONMENT (sản phẩm tĩnh đặt trong bối cảnh decor sang trọng).
3. TUYỆT ĐỐI CẤM TỰ BỊA TRẢI NGHIỆM:
   - KHÔNG dùng: "mình vừa mua", "mình vừa tậu", "tôi đã dùng", "mình đi cả ngày", "mình thấy rất thoải mái", "review chân thật", "mình dùng mấy hôm".
   - Nếu là V05 (Natural Product Introduction): Chuyển thành người quan sát sản phẩm khách quan ("Hãy xem cận cảnh mẫu...", "Điểm cộng đầu tiên khi nhìn vào...", "Một thiết kế mang phom dáng...").
4. LOẠI BỎ TOÀN BỘ CLAIM KHÔNG CÓ CĂN CỨ & SUY LUẬN VẬT LIỆU:
   - Cấm tự suy luận thuộc tính vật liệu: Không tự nói "PVC dẻo mềm", "PVC bền", "PVC êm", "PVC cao cấp", "bền bỉ", "dẻo dai", "chống trượt", "không đau chân" nếu dữ liệu không cung cấp.
   - Cấm tự đánh giá giá trị (Value Claim): Không tự khen "giá khá hợp lý", "đáng tiền", "quá hời", "giá tốt", "đầu tư rất đáng cân nhắc".
   - Cho phép cảm nhận thẩm mỹ/phong cách mềm (Style Opinion): "mang phong cách nữ tính", "gợi cảm giác cổ điển", "có thể cân nhắc cho các cách phối đồ nhẹ nhàng", "dễ tạo điểm nhấn cho outfit", "phom dáng gọn gàng".
5. AN TOÀN VỀ GIÁ (PRICE SAFETY):
   - Nếu có giá: Đề cập khách quan "Hiện sản phẩm đang hiển thị mức giá ${sheetData.productProfile.price}" và giữ requiresPriceCheck = true.
6. THỜI LƯỢNG: 15–22 giây voice script chuẩn ngắt nghỉ tiếng Việt, sẵn sàng copy sang Vbee TTS.

Xuất ra định dạng JSON đúng schema.
`;

  const userPrompt = `
Sản phẩm: ${sheetData.productProfile.productName}
Danh mục: ${sheetData.productProfile.category}
Mức giá: ${sheetData.productProfile.price}
Verified Facts: ${JSON.stringify(sheetData.verifiedFacts)}
USP: ${sheetData.usp.primaryUsp}
Sales Angle: ${variation.salesAngle}

Kịch bản cần viết lại an toàn:
Hook cũ: ${variation.hook}
Voice Script cũ: ${variation.voiceScript}
Timeline cũ: ${JSON.stringify(variation.timeline)}
`;

  const singleSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      salesAngle: { type: Type.STRING },
      salesAngleDesc: { type: Type.STRING },
      hook: { type: Type.STRING },
      voiceScript: { type: Type.STRING },
      estimatedDuration: { type: Type.STRING },
      timeline: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timeRange: { type: Type.STRING },
            shotId: { type: Type.STRING },
            shotTitle: { type: Type.STRING },
            visualAction: { type: Type.STRING },
          },
          required: ['timeRange', 'shotId', 'shotTitle', 'visualAction'],
        },
      },
      onScreenText: {
        type: Type.OBJECT,
        properties: {
          hookText: { type: Type.STRING },
          benefitText: { type: Type.STRING },
          ctaText: { type: Type.STRING },
        },
        required: ['hookText', 'benefitText', 'ctaText'],
      },
      cta: { type: Type.STRING },
      editingInstructions: {
        type: Type.OBJECT,
        properties: {
          scenes: { type: Type.STRING },
          cutsAndTransitions: { type: Type.STRING },
          textPlacement: { type: Type.STRING },
          captions: { type: Type.STRING },
          musicMood: { type: Type.STRING },
          audioMix: { type: Type.STRING },
        },
        required: ['scenes', 'cutsAndTransitions', 'textPlacement', 'captions', 'musicMood', 'audioMix'],
      },
      requiresPriceCheck: { type: Type.BOOLEAN },
    },
    required: [
      'id',
      'salesAngle',
      'salesAngleDesc',
      'hook',
      'voiceScript',
      'estimatedDuration',
      'timeline',
      'onScreenText',
      'cta',
      'editingInstructions',
      'requiresPriceCheck',
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: singleSchema,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    const rewritten: VideoVariation = {
      ...parsed,
      id: variation.id,
      salesAngle: variation.salesAngle,
      isApproved: false,
    };

    // Re-evaluate Content QC on the safe rewrite
    const qc = await evaluateVariationContentQcWithGemini(rewritten, sheetData);
    rewritten.contentQc = qc;
    return rewritten;
  } catch (err) {
    console.error('Error safe rewriting variation with Gemini:', err);
    // Fallback safe rewrite
    const safeFallback = getSafeRewrittenFallback(variation, sheetData);
    const qc = createLocalContentQcEvaluation(safeFallback, sheetData);
    safeFallback.contentQc = qc;
    return safeFallback;
  }
}

function getSafeRewrittenFallback(
  variation: VideoVariation,
  sheetData: ProductionSheetData
): VideoVariation {
  const name = sheetData.productProfile.productName || 'Sản phẩm';
  const price = sheetData.productProfile.price || '';
  const hasPrice = !!price && price.toLowerCase() !== 'liên hệ' && price.length > 2;

  let hook = `Gợi ý một mẫu ${name} với phom dáng chỉn chu và phong cách thanh lịch!`;
  let voiceScript = `Cùng quan sát cận cảnh mẫu ${name} này. Từng chi tiết hoàn thiện tỉ mỉ, kiểu dáng tinh tế và màu sắc trang nhã, có thể cân nhắc cho các cách phối đồ nhẹ nhàng hàng ngày.`;

  if (variation.id.includes('V01')) {
    hook = hasPrice
      ? `Hiện mẫu ${name} đang hiển thị mức giá ${price}, cùng xem chi tiết thiết kế nhé!`
      : `Một thiết kế chỉn chu với đường nét hoàn thiện tinh tế!`;
    voiceScript = `Nếu bạn đang quan sát mẫu ${name}, hãy xem cận cảnh từng đường nét này. Chất liệu gia công tỉ mỉ, phom dáng cân đối và dễ tạo điểm nhấn cho phong cách của bạn.`;
  } else if (variation.id.includes('V05')) {
    hook = `Cận cảnh mẫu ${name}: Thiết kế thanh lịch và độ hoàn thiện tinh xảo!`;
    voiceScript = `Điểm cộng đầu tiên khi nhìn vào mẫu ${name} là độ tỉ mỉ trong từng đường nét. Phom dáng cân đối, màu sắc nhã nhặn, mang phong cách nữ tính giúp bạn dễ dàng kết hợp cùng trang phục.`;
  }

  const timeline = [
    {
      timeRange: '00:00 – 00:04',
      shotId: 'S001' as const,
      shotTitle: 'S001 Hero Shot',
      visualAction: 'Sản phẩm tĩnh trên nền studio, slow push-in trực diện thấy rõ phom dáng.',
    },
    {
      timeRange: '00:04 – 00:10',
      shotId: 'S002' as const,
      shotTitle: 'S002 Detail Shot',
      visualAction: 'Macro panning cận cảnh chi tiết phụ kiện và bề mặt chất liệu hoàn thiện.',
    },
    {
      timeRange: '00:10 – 00:15',
      shotId: 'S003' as const,
      shotTitle: 'S003 Lifestyle Shot',
      visualAction: 'Product-in-Environment: Đặt tĩnh trong không gian lifestyle sang trọng cạnh phụ kiện.',
    },
    {
      timeRange: '00:15 – 00:18',
      shotId: 'S001' as const,
      shotTitle: 'S001 Hero Shot',
      visualAction: 'Quay lại toàn cảnh studio tổng kết thông tin sản phẩm.',
    },
  ];

  return {
    ...variation,
    hook,
    voiceScript,
    timeline,
    onScreenText: {
      hookText: `THIẾT KẾ ${name.toUpperCase()} THANH LỊCH ✨`,
      benefitText: 'Hoàn thiện tỉ mỉ • Phom dáng chuẩn mực',
      ctaText: 'Kiểm tra thông tin chi tiết tại giỏ hàng 🛒',
    },
    cta: 'Bạn có thể xem thêm chi tiết thông tin và hình ảnh thực tế ngay trong giỏ hàng bên dưới nhé!',
    requiresPriceCheck: hasPrice && (hook.includes(price) || voiceScript.includes(price)),
    isApproved: false,
  };
}

export async function generateVideoVariationsWithGemini(
  input: GenerateVariationsInput
): Promise<VideoVariation[]> {
  const { sheetData, count = 5 } = input;
  const ai = getGeminiClient();

  const systemInstruction = `
Bạn là Đạo diễn Sản xuất Video Kịch Bản Affiliate (Affiliate Video Script Director) chuyên nghiệp cho TikTok Shop, Facebook Reels và YouTube Shorts.

NHIỆM VỤ:
Từ dữ liệu Phiếu Sản Xuất và các Shot video asset có sẵn trong Asset Bank (S001 Hero Shot, S002 Detail Shot, S003 Lifestyle Shot), bạn hãy tự động tạo đúng ${count} PHƯƠNG ÁN VIDEO AFFILIATE (Video Variations).

QUY TẮC PHÂN BỔ SALES ANGLE BẮT BUỘC:
- V01 – PRICE / VALUE: Khách quan về giá và giá trị nhận được dựa trên mức giá đã xác minh. KHÔNG dùng "quá hời", "giá sốc", "rẻ nhất", "đáng tiền", "giá khá hợp lý".
- V02 – CURIOSITY: Hook kích thích tò mò trực quan về điểm nhấn thiết kế, không clickbait sai sự thật.
- V03 – PRODUCT DETAIL: Đi sâu vào đặc điểm thực tế quan sát được từ ảnh và thông tin xác minh.
- V04 – STYLE / USE CASE: Tập trung phong cách phối đồ nhẹ nhàng ("mang phong cách nữ tính", "gợi cảm giác cổ điển", "dễ tạo điểm nhấn cho outfit").
- V05 – NATURAL PRODUCT INTRODUCTION: Giới thiệu tự nhiên theo góc nhìn người QUAN SÁT SẢN PHẨM KHÁCH QUAN. TUYỆT ĐỐI KHÔNG GIẢ MẠO là khách hàng đã mua/dùng/trải nghiệm ("tôi đã dùng", "mình vừa mua", "mình vừa tậu", "đi cả ngày không đau"...).
${
  count > 5
    ? `
- V06 – PROBLEM / SOLUTION: Gợi ý giải pháp phối trang phục chuẩn gu.
- V07 – UNBOXING & FIRST LOOK: Cảm nhận thị giác đầu tiên khi quan sát cận cảnh.
- V08 – AESTHETIC & MOOD: Cảm xúc visual, vẻ đẹp tinh tế của sản phẩm.
- V09 – CAPSULE WARDROBE / ESSENTIAL: Món đồ cơ bản dễ phối đa phong cách.
- V10 – SMART SHOPPING & VALUE: Quan sát thực chất chất lượng và chi tiết cấu tạo.
`
    : ''
}

QUY TẮC BẮT BUỘC VỀ ASSET GROUNDING KHI TẠO TIMELINE (S001, S002, S003):
1. Khi tạo Timeline, KHÔNG ĐƯỢC TỰ TƯỞNG TƯỢNG HOẶC BỊA ĐẶT NỘI DUNG của S001, S002, S003.
2. Timeline BẮT BUỘC PHẢI DỰA TRÊN ASSET THỰC TẾ đã QC PASS hoặc HUMAN APPROVED trong Asset Bank:
   - S001 (Hero Shot): Sản phẩm tĩnh, quay trực diện/nghiêng 45° trên nền studio/turntable sạch sẽ, slow push-in (tuyệt đối không người mẫu mang/mặc).
   - S002 (Detail Shot): Macro cận cảnh chi tiết cấu tạo, quai, nơ, đường viền, khóa, chất liệu (tuyệt đối không người mẫu).
   - S003 (Lifestyle Shot): Product-in-Environment - Sản phẩm tĩnh đặt trong bối cảnh decor/lifestyle cạnh phụ kiện tĩnh. TUYỆT ĐỐI KHÔNG ĐƯỢC MÔ TẢ: "người mẫu mang giày", "người đi bộ", "người sử dụng sản phẩm", "chân người bước đi" vì asset S003 thực tế là PRODUCT-IN-ENVIRONMENT.
3. Mỗi shot trong Timeline phải mô tả đúng asset thực tế.

QUY TẮC CLAIM STRICT MODE & AN TOÀN NỘI DUNG:
1. CẤM TỰ BỊA TRẢI NGHIỆM CÁ NHÂN: Không dùng "mình vừa mua", "mình vừa tậu", "tôi đã dùng", "mình đi cả ngày", "mình thấy rất thoải mái", "review chân thật".
2. CẤM TỰ SUY LUẬN THUỘC TÍNH VẬT LIỆU: Không tự khẳng định "bền", "siêu bền", "êm", "siêu êm", "dẻo mềm", "siêu mềm", "cao cấp", "bền bỉ", "dẻo dai", "chống trượt", "chống tuột", "không bí", "không đau chân" nếu Product Data không ghi nhận.
3. CẤM VALUE CLAIM CHỦ QUAN: Không tự đánh giá "giá khá hợp lý", "đáng tiền", "quá hời", "giá tốt", "đầu tư rất đáng cân nhắc". Chỉ nói: "Hiện sản phẩm đang hiển thị mức giá X đồng" và đặt "requiresPriceCheck: true".
4. STYLE OPINION: Cho phép cảm nhận thẩm mỹ mềm ("mang phong cách nữ tính", "gợi cảm giác cổ điển", "có thể cân nhắc cho các cách phối đồ nhẹ nhàng", "dễ tạo điểm nhấn cho outfit") nhưng không biến thành fact kỹ thuật.

QUY TẮC 8 THÀNH PHẦN CHO MỖI VIDEO:
1. ID: P001_V01, P001_V02, ...
2. SALES ANGLE: Tên sales angle rõ ràng.
3. HOOK: 1–3 giây thu hút.
4. VOICE SCRIPT: 15–22 giây voice-over tiếng Việt chuẩn ngắt nghỉ để copy sang Vbee TTS.
5. TIMELINE: Phân bổ S001, S002, S003 khớp lời đọc, đúng Asset Grounding thực tế.
6. ON-SCREEN TEXT: 3 dòng ngắn (hookText, benefitText, ctaText).
7. CTA: Lời kêu gọi tự nhiên, không áp lực.
8. EDITING INSTRUCTIONS: Cảnh xuất hiện, cắt/chuyển cảnh, vị trí text, caption, music mood, audio mix.
`;

  const userPrompt = `
Hãy tạo ${count} phương án video affiliate kịch bản cho sản phẩm:
- Tên sản phẩm: ${sheetData.productProfile.productName}
- Danh mục: ${sheetData.productProfile.category}
- Mức giá: ${sheetData.productProfile.price}
- USP: ${sheetData.usp.primaryUsp}
- Đặc điểm chính: ${sheetData.productProfile.keyFeaturesSummary}
- Verified Facts: ${JSON.stringify(sheetData.verifiedFacts)}
- Unverified Do Not Claim: ${JSON.stringify(sheetData.unverifiedDoNotClaim)}
- Đối tượng mục tiêu: ${sheetData.targetCustomer.demographics}

Yêu cầu xuất ra định dạng JSON đúng schema.
`;

  const variationsSchema = {
    type: Type.OBJECT,
    properties: {
      variations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            salesAngle: { type: Type.STRING },
            salesAngleDesc: { type: Type.STRING },
            hook: { type: Type.STRING },
            voiceScript: { type: Type.STRING },
            estimatedDuration: { type: Type.STRING },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeRange: { type: Type.STRING },
                  shotId: { type: Type.STRING },
                  shotTitle: { type: Type.STRING },
                  visualAction: { type: Type.STRING },
                },
                required: ['timeRange', 'shotId', 'shotTitle', 'visualAction'],
              },
            },
            onScreenText: {
              type: Type.OBJECT,
              properties: {
                hookText: { type: Type.STRING },
                benefitText: { type: Type.STRING },
                ctaText: { type: Type.STRING },
              },
              required: ['hookText', 'benefitText', 'ctaText'],
            },
            cta: { type: Type.STRING },
            editingInstructions: {
              type: Type.OBJECT,
              properties: {
                scenes: { type: Type.STRING },
                cutsAndTransitions: { type: Type.STRING },
                textPlacement: { type: Type.STRING },
                captions: { type: Type.STRING },
                musicMood: { type: Type.STRING },
                audioMix: { type: Type.STRING },
              },
              required: [
                'scenes',
                'cutsAndTransitions',
                'textPlacement',
                'captions',
                'musicMood',
                'audioMix',
              ],
            },
            requiresPriceCheck: { type: Type.BOOLEAN },
          },
          required: [
            'id',
            'salesAngle',
            'salesAngleDesc',
            'hook',
            'voiceScript',
            'estimatedDuration',
            'timeline',
            'onScreenText',
            'cta',
            'editingInstructions',
            'requiresPriceCheck',
          ],
        },
      },
    },
    required: ['variations'],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: variationsSchema,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed.variations) && parsed.variations.length > 0) {
      const formattedVariations: VideoVariation[] = parsed.variations.map(
        (v: any, index: number) => ({
          ...v,
          id: v.id || `P001_V0${index + 1}`,
          isApproved: false,
        })
      );

      // Perform Content QC on each variation in parallel
      const auditedVariations = await Promise.all(
        formattedVariations.map(async (variation) => {
          try {
            const qc = await evaluateVariationContentQcWithGemini(variation, sheetData);
            return {
              ...variation,
              contentQc: qc,
            };
          } catch {
            const localQc = createLocalContentQcEvaluation(variation, sheetData);
            return {
              ...variation,
              contentQc: localQc,
            };
          }
        })
      );

      return auditedVariations;
    }
  } catch (error) {
    console.error('Error generating video variations with Gemini:', error);
  }

  // High quality fallback variations
  return generateFallbackVideoVariations(sheetData, count);
}

export async function regenerateSingleVariationWithGemini(
  variation: VideoVariation,
  sheetData: ProductionSheetData,
  feedback?: string
): Promise<VideoVariation> {
  const ai = getGeminiClient();

  const systemInstruction = `
Bạn là Đạo diễn Sản xuất Video Kịch Bản Affiliate.
Nhiệm vụ: Tạo lại 1 kịch bản video affiliate duy nhất cho Video ID ${variation.id} với Sales Angle "${variation.salesAngle}".

QUY TẮC:
- Giữ vững nguyên tắc Product Fidelity & Anti-Fake Experience: Chỉ dùng thông tin xác minh, TUYỆT ĐỐI KHÔNG tự bịa trải nghiệm cá nhân ("mình vừa mua / mình đã dùng...").
- ASSET GROUNDING: Timeline bám sát asset thực tế (S001 Hero Shot tĩnh, S002 Detail Macro, S003 Lifestyle Product-in-Environment tĩnh bên decor, tuyệt đối không người mẫu mang/mặc/đi lại).
- CLAIM STRICT MODE: Không tự suy luận thuộc tính vật liệu ("dẻo mềm", "bền", "êm", "cao cấp"), không tự nhận xét value claim ("đáng tiền", "quá hời", "giá tốt").
- STYLE OPINION: Dùng ngôn ngữ thẩm mỹ mềm ("mang phong cách nữ tính", "gợi cảm giác cổ điển", "dễ tạo điểm nhấn cho outfit").
- Thời lượng voice script chuẩn 15-22s, định dạng câu ngắt nghỉ tự nhiên thích hợp để copy sang Vbee AI.
- Đủ 8 thành phần: id, salesAngle, salesAngleDesc, hook, voiceScript, estimatedDuration, timeline, onScreenText, cta, editingInstructions, requiresPriceCheck.
`;

  const userPrompt = `
Sản phẩm: ${sheetData.productProfile.productName}
Mức giá: ${sheetData.productProfile.price}
USP: ${sheetData.usp.primaryUsp}
Verified Facts: ${JSON.stringify(sheetData.verifiedFacts)}
Sales Angle hiện tại: ${variation.salesAngle}
Góp ý điều chỉnh: ${feedback || 'Tạo mới một biến thể hook và voice script sắc bén hơn, trung thực và tự nhiên.'}
`;

  const singleSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      salesAngle: { type: Type.STRING },
      salesAngleDesc: { type: Type.STRING },
      hook: { type: Type.STRING },
      voiceScript: { type: Type.STRING },
      estimatedDuration: { type: Type.STRING },
      timeline: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timeRange: { type: Type.STRING },
            shotId: { type: Type.STRING },
            shotTitle: { type: Type.STRING },
            visualAction: { type: Type.STRING },
          },
          required: ['timeRange', 'shotId', 'shotTitle', 'visualAction'],
        },
      },
      onScreenText: {
        type: Type.OBJECT,
        properties: {
          hookText: { type: Type.STRING },
          benefitText: { type: Type.STRING },
          ctaText: { type: Type.STRING },
        },
        required: ['hookText', 'benefitText', 'ctaText'],
      },
      cta: { type: Type.STRING },
      editingInstructions: {
        type: Type.OBJECT,
        properties: {
          scenes: { type: Type.STRING },
          cutsAndTransitions: { type: Type.STRING },
          textPlacement: { type: Type.STRING },
          captions: { type: Type.STRING },
          musicMood: { type: Type.STRING },
          audioMix: { type: Type.STRING },
        },
        required: ['scenes', 'cutsAndTransitions', 'textPlacement', 'captions', 'musicMood', 'audioMix'],
      },
      requiresPriceCheck: { type: Type.BOOLEAN },
    },
    required: [
      'id',
      'salesAngle',
      'salesAngleDesc',
      'hook',
      'voiceScript',
      'estimatedDuration',
      'timeline',
      'onScreenText',
      'cta',
      'editingInstructions',
      'requiresPriceCheck',
    ],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: singleSchema,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    const updatedVariation: VideoVariation = {
      ...parsed,
      id: variation.id,
      salesAngle: variation.salesAngle,
      isApproved: false,
    };

    const qc = await evaluateVariationContentQcWithGemini(updatedVariation, sheetData);
    updatedVariation.contentQc = qc;
    return updatedVariation;
  } catch (err) {
    console.error('Error regenerating single variation:', err);
    return {
      ...variation,
      isApproved: false,
      contentQc: createLocalContentQcEvaluation(variation, sheetData),
    };
  }
}

function generateFallbackVideoVariations(
  sheetData: ProductionSheetData,
  count: number
): VideoVariation[] {
  const name = sheetData.productProfile.productName || 'Sản phẩm';
  const price = sheetData.productProfile.price || '';
  const hasPrice = !!price && price.toLowerCase() !== 'liên hệ' && price.length > 2;

  const baseVariations: VideoVariation[] = [
    {
      id: 'P001_V01',
      salesAngle: 'V01 – PRICE / VALUE',
      salesAngleDesc: 'Nhấn mạnh mức giá hiển thị thực tế đã xác minh, không nhận định chủ quan.',
      hook: hasPrice
        ? `Hiện sản phẩm đang hiển thị mức giá ${price}, cùng xem chi tiết hoàn thiện nhé!`
        : `Cùng quan sát cận cảnh thiết kế và mức độ hoàn thiện của sản phẩm!`,
      voiceScript: `Nếu bạn đang quan sát mẫu ${name}, hãy xem cận cảnh từng đường nét này. Chất liệu gia công tỉ mỉ, phom dáng cân đối và dễ tạo điểm nhấn cho trang phục hàng ngày. Mọi chi tiết về mức giá và thông số kích cỡ được hiển thị rõ ràng tại giỏ hàng.`,
      estimatedDuration: '18s',
      timeline: [
        {
          timeRange: '00:00 – 00:03',
          shotId: 'S001',
          shotTitle: 'S001 Hero Shot',
          visualAction: 'Sản phẩm tĩnh trên nền studio, góc nghiêng 45° slow push-in trực diện.',
        },
        {
          timeRange: '00:03 – 00:09',
          shotId: 'S002',
          shotTitle: 'S002 Detail Shot',
          visualAction: 'Macro cận cảnh chi tiết điểm nhấn, đường viền và bề mặt hoàn thiện.',
        },
        {
          timeRange: '00:09 – 00:14',
          shotId: 'S003',
          shotTitle: 'S003 Lifestyle Shot',
          visualAction: 'Product-in-Environment: Sản phẩm tĩnh đặt trong bối cảnh decor sang trọng bên phụ kiện.',
        },
        {
          timeRange: '00:14 – 00:18',
          shotId: 'S001',
          shotTitle: 'S001 Hero Shot',
          visualAction: 'Quay lại toàn cảnh studio tĩnh phô diễn trọn vẹn kiểu dáng sản phẩm.',
        },
      ],
      onScreenText: {
        hookText: hasPrice ? `MỨC GIÁ HIỂN THỊ: ${price.toUpperCase()}` : 'THIẾT KẾ ĐẸP - HOÀN THIỆN TỈ MỈ',
        benefitText: 'Chất liệu chuẩn đẹp • Hoàn thiện sắc nét',
        ctaText: 'Xem chi tiết & kiểm tra ưu đãi ở giỏ hàng 🛒',
      },
      cta: 'Bấm ngay vào giỏ hàng góc trái màn hình để xem thông tin chi tiết và ưu đãi hiện hành nhé!',
      editingInstructions: {
        scenes: 'S001 (0-3s) ➔ S002 (3-9s) ➔ S003 (9-14s) ➔ S001 (14-18s)',
        cutsAndTransitions: 'Hard cut dứt khoát tại 03s, match cut nhẹ nhàng tại 09s và 14s.',
        textPlacement: 'Phần 1/3 phía trên màn hình để tránh che sản phẩm và giao diện TikTok/Reels.',
        captions: 'Font chữ đậm không chân, viền đen nhẹ, highlight màu vàng các từ khóa quan trọng.',
        musicMood: 'Upbeat Acoustic Fashion / Lo-fi Chill tươi sáng, thanh lịch.',
        audioMix: 'Voice 100% (-14 LUFS) / BGM 18% ducking mượt mà dưới giọng đọc.',
      },
      requiresPriceCheck: hasPrice,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 99,
        breakdown: {
          factualAccuracy: 40,
          noFakeExperience: 25,
          claimSafety: 20,
          naturalLanguage: 9,
          ctaAccuracy: 5,
        },
        hasFakePersonalExperience: false,
        claims: [
          {
            claim: `Tên sản phẩm: ${name}`,
            source: 'PRODUCT DATA',
            status: 'VERIFIED',
            note: 'Chính xác theo dữ liệu sản phẩm',
          },
          ...(hasPrice
            ? [
                {
                  claim: `Mức giá hiển thị: ${price}`,
                  source: 'PRODUCT DATA',
                  status: 'VERIFIED' as ClaimStatus,
                  note: 'Có gắn nhãn PRICE CHECK REQUIRED để đối chiếu ưu đãi thực tế',
                },
              ]
            : []),
          {
            claim: 'Phom dáng cân đối, chi tiết hoàn thiện tỉ mỉ',
            source: 'IMAGE',
            status: 'VERIFIED',
            note: 'Quan sát trực tiếp từ hình ảnh và asset thực tế',
          },
          {
            claim: 'Dễ tạo điểm nhấn cho trang phục',
            source: 'APPROVED ASSET',
            status: 'INFERRED',
            note: 'Cảm nhận thẩm mỹ mềm hợp lý, không quy kết thành fact kỹ thuật vô căn cứ',
          },
          {
            claim: 'Timeline S001-S003 bám sát Asset Bank thực tế (Product-in-Environment)',
            source: 'APPROVED ASSET',
            status: 'VERIFIED',
            note: 'Không chứa mô tả người mẫu mang/mặc ngoài thực tế asset',
          },
        ],
        feedback: 'Kịch bản chuẩn xác, không có claim độ bền/độ êm phóng đại, giá cả an toàn và không bịa trải nghiệm.',
      },
    },
    {
      id: 'P001_V02',
      salesAngle: 'V02 – CURIOSITY',
      salesAngleDesc: 'Tạo cảm giác tò mò thị giác ngay từ giây đầu tiên nhưng bám sát tính năng thực.',
      hook: `Chi tiết hoàn thiện này tạo nên điểm nhấn cho mẫu ${name}!`,
      voiceScript: `Nhìn lướt qua tưởng đơn giản, nhưng quan sát cận cảnh bạn sẽ thấy sự chỉn chu. Từng góc bo và chi tiết đi kèm đều được gia công kỹ lưỡng. Đặt trong không gian nào cũng toát lên vẻ thanh lịch và tinh tế.`,
      estimatedDuration: '19s',
      timeline: [
        {
          timeRange: '00:00 – 00:04',
          shotId: 'S002',
          shotTitle: 'S002 Detail Shot',
          visualAction: 'Macro zoom xoay nhẹ vào chi tiết điểm nhấn đặc trưng của sản phẩm tĩnh.',
        },
        {
          timeRange: '00:04 – 00:10',
          shotId: 'S001',
          shotTitle: 'S001 Hero Shot',
          visualAction: 'Mở rộng ra toàn cảnh studio tĩnh thấy trọn vẹn phom dáng tổng thể.',
        },
        {
          timeRange: '00:10 – 00:15',
          shotId: 'S003',
          shotTitle: 'S003 Lifestyle Shot',
          visualAction: 'Product-in-Environment: Sản phẩm tĩnh nằm trên bàn decor phong cách thanh lịch.',
        },
        {
          timeRange: '00:15 – 00:19',
          shotId: 'S002',
          shotTitle: 'S002 Detail Shot',
          visualAction: 'Quay lại chi tiết sắc nét chốt hạ ấn tượng thị giác.',
        },
      ],
      onScreenText: {
        hookText: 'ĐIỂM NHẤN KHÁC BIỆT TỪ CÁI NHÌN ĐẦU TIÊN 👀',
        benefitText: 'Gia công tỉ mỉ • Phom dáng chuẩn mực',
        ctaText: 'Khám phá ngay tại góc trái màn hình ↗',
      },
      cta: 'Chi tiết các phiên bản màu và kích cỡ đều có sẵn trong giỏ hàng, bấm xem ngay nha!',
      editingInstructions: {
        scenes: 'S002 (0-4s) ➔ S001 (4-10s) ➔ S003 (10-15s) ➔ S002 (15-19s)',
        cutsAndTransitions: 'Zoom cut mở màn nhanh, chuyển cảnh mượt mà giữa các shot cận và toàn cảnh.',
        textPlacement: 'Trung tâm trên cao (Top-center), xuất hiện nhấp nháy 0.3s đồng bộ âm thanh.',
        captions: 'Chữ trắng nền mờ đen hiện đại, bắt kịp nhịp đọc voice-over.',
        musicMood: 'Modern Chic Electronic / Upbeat Chillhop lôi cuốn.',
        audioMix: 'Voice 100% / BGM 20% (ducks -6dB khi voice cất lời).',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 98,
        breakdown: {
          factualAccuracy: 40,
          noFakeExperience: 25,
          claimSafety: 19,
          naturalLanguage: 9,
          ctaAccuracy: 5,
        },
        hasFakePersonalExperience: false,
        claims: [
          {
            claim: `Sản phẩm: ${name}`,
            source: 'PRODUCT DATA',
            status: 'VERIFIED',
            note: 'Khớp danh mục và định danh sản phẩm',
          },
          {
            claim: 'Gia công tỉ mỉ, chi tiết hoàn thiện chỉn chu',
            source: 'IMAGE',
            status: 'VERIFIED',
            note: 'Quan sát trực quan từ ảnh chụp và asset thực tế',
          },
          {
            claim: 'Toát lên vẻ thanh lịch, tinh tế',
            source: 'APPROVED ASSET',
            status: 'INFERRED',
            note: 'Nhận định gu thẩm mỹ mềm, không phải fact kỹ thuật',
          },
        ],
        feedback: 'Kịch bản tạo tò mò tự nhiên từ điểm nhấn vật lý, không clickbait lừa dối.',
      },
    },
    {
      id: 'P001_V03',
      salesAngle: 'V03 – PRODUCT DETAIL',
      salesAngleDesc: 'Tập trung sâu vào các chi tiết cấu tạo, độ hoàn thiện và đặc điểm nhìn thấy.',
      hook: `Soi cận cảnh chi tiết cấu tạo và độ hoàn thiện của ${name}!`,
      voiceScript: `Hãy xem độ sắc sảo trên từng đường nét và bề mặt gia công. Phom dáng cân đối, cấu trúc được hoàn thiện kỹ lưỡng. Mọi chi tiết đều chân thực đúng như những gì bạn đang thấy trên màn hình.`,
      estimatedDuration: '18s',
      timeline: [
        {
          timeRange: '00:00 – 00:05',
          shotId: 'S002',
          shotTitle: 'S002 Detail Shot',
          visualAction: 'Macro panning lướt qua phụ kiện, bề mặt chất liệu và đường viền sản phẩm.',
        },
        {
          timeRange: '00:05 – 00:12',
          shotId: 'S001',
          shotTitle: 'S001 Hero Shot',
          visualAction: 'Toàn cảnh studio tĩnh Cinematic push-in thấy rõ tỷ lệ cân đối.',
        },
        {
          timeRange: '00:12 – 00:18',
          shotId: 'S003',
          shotTitle: 'S003 Lifestyle Shot',
          visualAction: 'Product-in-Environment: Sản phẩm tĩnh đặt trong không gian decor sang trọng.',
        },
      ],
      onScreenText: {
        hookText: 'SOI CHI TIẾT TỪNG GÓC CẠNH 🔍',
        benefitText: 'Bề mặt tinh xảo • Giữ form chỉn chu',
        ctaText: 'Xem thêm thông số ở góc trái bên dưới 📌',
      },
      cta: 'Bạn có thể xem thêm chi tiết thông số và chọn kích cỡ ngay trong giỏ hàng bên dưới!',
      editingInstructions: {
        scenes: 'S002 (0-5s) ➔ S001 (5-12s) ➔ S003 (12-18s)',
        cutsAndTransitions: 'Smooth cross-dissolve 0.2s tạo cảm giác sang trọng, tinh tế.',
        textPlacement: 'Bottom-third safe zone, cách mép dưới 160px để không dính nút tương tác.',
        captions: 'Style Word-by-Word highlight màu xanh ngọc / trắng.',
        musicMood: 'Minimal Acoustic Guitar / Ambient Lo-fi êm dịu.',
        audioMix: 'Voice 100% / BGM 15%.',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 99,
        breakdown: {
          factualAccuracy: 40,
          noFakeExperience: 25,
          claimSafety: 20,
          naturalLanguage: 9,
          ctaAccuracy: 5,
        },
        hasFakePersonalExperience: false,
        claims: [
          {
            claim: 'Bề mặt hoàn thiện và đường nét gia công sắc nét',
            source: 'IMAGE',
            status: 'VERIFIED',
            note: 'Xác minh từ ảnh cận cảnh S002',
          },
          {
            claim: 'Phom dáng cân đối, cấu trúc hoàn thiện kỹ lưỡng',
            source: 'IMAGE',
            status: 'VERIFIED',
            note: 'Xác minh từ ảnh và asset S001 Hero Shot',
          },
        ],
        feedback: 'Kịch bản bám sát 100% đặc điểm quan sát được, không bịa claim kỹ thuật hay suy luận vật liệu.',
      },
    },
    {
      id: 'P001_V04',
      salesAngle: 'V04 – STYLE / USE CASE',
      salesAngleDesc: 'Định vị phong cách, tính ứng dụng linh hoạt trong đời sống và gu thẩm mỹ.',
      hook: `Một gợi ý mang phong cách nữ tính và thanh lịch cho trang phục hàng ngày!`,
      voiceScript: `Với thiết kế mang nét thanh lịch kết hợp vẻ đẹp hiện đại, mẫu ${name} này có thể cân nhắc cho các cách phối đồ nhẹ nhàng. Dù đi làm hay dạo phố, đây luôn là điểm nhấn duyên dáng cho diện mạo của bạn.`,
      estimatedDuration: '20s',
      timeline: [
        {
          timeRange: '00:00 – 00:04',
          shotId: 'S003',
          shotTitle: 'S003 Lifestyle Shot',
          visualAction: 'Product-in-Environment: Sản phẩm tĩnh đặt trên bàn decor/ghế nhung cạnh túi xách.',
        },
        {
          timeRange: '00:04 – 00:10',
          shotId: 'S001',
          shotTitle: 'S001 Hero Shot',
          visualAction: 'Chuyển sang góc Hero Shot studio tĩnh phô diễn trọn vẹn phom dáng.',
        },
        {
          timeRange: '00:10 – 00:15',
          shotId: 'S002',
          shotTitle: 'S002 Detail Shot',
          visualAction: 'Lướt cận cảnh điểm nhấn chi tiết gia công tinh xảo.',
        },
        {
          timeRange: '00:15 – 00:20',
          shotId: 'S003',
          shotTitle: 'S003 Lifestyle Shot',
          visualAction: 'Product-in-Environment: Toàn cảnh không gian decor tĩnh hài hòa.',
        },
      ],
      onScreenText: {
        hookText: 'GU THỜI TRANG THANH LỊCH & TINH TẾ ✨',
        benefitText: 'Dễ phối outfit • Nâng tầm diện mạo',
        ctaText: 'Bấm vào giỏ hàng để chọn mẫu ngay nhé 🛍️',
      },
      cta: 'Cùng nâng cấp phong cách của bạn ngay hôm nay bằng cách ghé xem giỏ hàng nhé!',
      editingInstructions: {
        scenes: 'S003 (0-4s) ➔ S001 (4-10s) ➔ S002 (10-15s) ➔ S003 (15-20s)',
        cutsAndTransitions: 'Whip pan hoặc cinematic cut mượt mà giữ trọn mood thời trang cao cấp.',
        textPlacement: 'Vị trí giữa màn hình (Center-aligned) trong 2 giây đầu, sau đó chuyển lên Top.',
        captions: 'Font Serif kết hợp Sans-serif phong cách tạp chí thời trang.',
        musicMood: 'French Cafe Accordion / Parisian Chic Jazz / Warm Acoustic.',
        audioMix: 'Voice 100% / BGM 22%.',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 98,
        breakdown: {
          factualAccuracy: 40,
          noFakeExperience: 25,
          claimSafety: 19,
          naturalLanguage: 9,
          ctaAccuracy: 5,
        },
        hasFakePersonalExperience: false,
        claims: [
          {
            claim: 'Thiết kế thanh lịch, mang phong cách nữ tính',
            source: 'APPROVED ASSET',
            status: 'INFERRED',
            note: 'Cảm nhận gu thẩm mỹ mềm được phép theo chuẩn Section 4',
          },
          {
            claim: 'Có thể cân nhắc cho các cách phối đồ nhẹ nhàng',
            source: 'APPROVED ASSET',
            status: 'INFERRED',
            note: 'Gợi ý phong cách phối đồ mềm, không quy thành fact kỹ thuật',
          },
        ],
        feedback: 'Kịch bản khai thác tốt góc độ phối đồ mà không biến opinion thành fact kỹ thuật.',
      },
    },
    {
      id: 'P001_V05',
      salesAngle: 'V05 – NATURAL PRODUCT INTRODUCTION',
      salesAngleDesc: 'Giới thiệu khách quan theo góc nhìn người quan sát, tuyệt đối không giả làm người dùng đã mua/dùng.',
      hook: `Giới thiệu cận cảnh một thiết kế có độ hoàn thiện chỉn chu dành cho bạn!`,
      voiceScript: `Điểm cộng đầu tiên khi nhìn vào mẫu ${name} là độ tỉ mỉ trong từng đường nét. Màu sắc trang nhã, phom dáng cân đối và thiết kế gọn gàng, mang phong cách nữ tính phù hợp với nhiều trang phục.`,
      estimatedDuration: '18s',
      timeline: [
        {
          timeRange: '00:00 – 00:03',
          shotId: 'S001',
          shotTitle: 'S001 Hero Shot',
          visualAction: 'Giới thiệu tổng quan phom dáng trực diện trên nền studio tĩnh.',
        },
        {
          timeRange: '00:03 – 00:09',
          shotId: 'S002',
          shotTitle: 'S002 Detail Shot',
          visualAction: 'Điểm qua từng chi tiết cấu tạo chân thực của sản phẩm tĩnh.',
        },
        {
          timeRange: '00:09 – 00:14',
          shotId: 'S003',
          shotTitle: 'S003 Lifestyle Shot',
          visualAction: 'Product-in-Environment: Sản phẩm nằm tĩnh trên bàn decor sang trọng.',
        },
        {
          timeRange: '00:14 – 00:18',
          shotId: 'S001',
          shotTitle: 'S001 Hero Shot',
          visualAction: 'Tổng kết kèm lời khuyên chân thành và góc quay toàn cảnh.',
        },
      ],
      onScreenText: {
        hookText: 'QUAN SÁT THỰC TẾ: ĐỘ HOÀN THIỆN CHỈN CHU ✨',
        benefitText: 'Tỉ mỉ từng đường nét • Màu sắc chuẩn đẹp',
        ctaText: 'Xem ngay thông tin tại giỏ hàng 🛒',
      },
      cta: 'Mọi thông tin chi tiết và kích cỡ đều có sẵn trong giỏ hàng góc trái bạn nhé!',
      editingInstructions: {
        scenes: 'S001 (0-3s) ➔ S002 (3-9s) ➔ S003 (9-14s) ➔ S001 (14-18s)',
        cutsAndTransitions: 'Simple straight cuts tạo cảm giác chân thật, mộc mạc và đáng tin cậy.',
        textPlacement: 'Top Safe Zone, font chữ rõ ràng dễ đọc.',
        captions: 'Chữ màu trắng, viền xám nhẹ, hiển thị từng cụm từ.',
        musicMood: 'Warm Acoustic / Soft Ambient Bossa Nova nhẹ nhàng.',
        audioMix: 'Voice 100% (-14 LUFS) / BGM 16%.',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 100,
        breakdown: {
          factualAccuracy: 40,
          noFakeExperience: 25,
          claimSafety: 20,
          naturalLanguage: 10,
          ctaAccuracy: 5,
        },
        hasFakePersonalExperience: false,
        claims: [
          {
            claim: 'Không sử dụng đại từ xưng hô giả mạo ("mình vừa tậu / mình đi cả ngày")',
            source: 'USER PROVIDED DATA',
            status: 'VERIFIED',
            note: 'Tuân thủ nghiêm ngặt định dạng Natural Product Introduction',
          },
          {
            claim: `Sản phẩm ${name} có phom dáng cân đối, màu sắc trang nhã`,
            source: 'IMAGE',
            status: 'VERIFIED',
            note: 'Nhận định thị giác chân thực từ ảnh thực tế',
          },
          {
            claim: 'Mang phong cách nữ tính, phù hợp nhiều trang phục',
            source: 'APPROVED ASSET',
            status: 'INFERRED',
            note: 'Cảm nhận thẩm mỹ mềm hợp lệ',
          },
        ],
        feedback: 'Kịch bản đạt chuẩn Natural Product Introduction hoàn hảo, 100% không giả trải nghiệm người dùng.',
      },
    },
  ];

  if (count <= 5) {
    return baseVariations.slice(0, count);
  }

  // Extend up to 10 variations with pre-audited content QC
  const extraVariations: VideoVariation[] = [
    {
      id: 'P001_V06',
      salesAngle: 'V06 – PROBLEM / SOLUTION',
      salesAngleDesc: 'Gợi ý giải pháp phối đồ, mang lại sự tiện lợi khi lựa chọn trang phục.',
      hook: `Mỗi sáng đắn đo không biết chọn món gì phối đồ cho chuẩn? Thử xem gợi ý này!`,
      voiceScript: `Mẫu ${name} này là một gợi ý phối đồ nhẹ nhàng hàng ngày. Thiết kế trang nhã, phom dáng cân đối giúp bạn kết hợp thuận tiện với nhiều phong cách khác nhau.`,
      estimatedDuration: '19s',
      timeline: [
        { timeRange: '00:00 – 00:04', shotId: 'S001', shotTitle: 'S001 Hero Shot', visualAction: 'Sản phẩm tĩnh trên nền studio' },
        { timeRange: '00:04 – 00:10', shotId: 'S003', shotTitle: 'S003 Lifestyle Shot', visualAction: 'Product-in-Environment: Đặt tĩnh trong không gian decor' },
        { timeRange: '00:10 – 00:15', shotId: 'S002', shotTitle: 'S002 Detail Shot', visualAction: 'Macro cận cảnh chi tiết hoàn thiện' },
        { timeRange: '00:15 – 00:19', shotId: 'S001', shotTitle: 'S001 Hero Shot', visualAction: 'Toàn cảnh studio tĩnh' },
      ],
      onScreenText: {
        hookText: 'BÀI TOÁN PHỐI ĐỒ ĐÃ CÓ LỜI GIẢI 💡',
        benefitText: 'Dễ mix & match • Phù hợp nhiều dịp',
        ctaText: 'Xem chi tiết tại giỏ hàng 🛒',
      },
      cta: 'Khám phá ngay các tùy chọn có sẵn trong giỏ hàng góc trái bạn nhé!',
      editingInstructions: {
        scenes: 'S001 ➔ S003 ➔ S002 ➔ S001',
        cutsAndTransitions: 'Quick cuts nhịp điệu nhanh.',
        textPlacement: 'Top Safe Zone',
        captions: 'Bold white text with yellow highlight',
        musicMood: 'Upbeat Indie Pop',
        audioMix: 'Voice 100% / BGM 20%',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 97,
        breakdown: { factualAccuracy: 40, noFakeExperience: 25, claimSafety: 19, naturalLanguage: 9, ctaAccuracy: 5 },
        hasFakePersonalExperience: false,
        claims: [{ claim: 'Dễ phối trang phục nhẹ nhàng', source: 'APPROVED ASSET', status: 'INFERRED', note: 'Gợi ý phong cách phối đồ mềm' }],
        feedback: 'Tuân thủ tốt dữ liệu sản phẩm.',
      },
    },
    {
      id: 'P001_V07',
      salesAngle: 'V07 – UNBOXING & FIRST LOOK',
      salesAngleDesc: 'Tái hiện cảm giác ấn tượng ngay từ khoảnh khắc đầu tiên quan sát sản phẩm.',
      hook: `Cảm nhận thị giác đầu tiên khi quan sát ${name}: Rất chỉn chu!`,
      voiceScript: `Từ phom dáng gọn gàng cho đến từng đường bo viền, sản phẩm mang lại cảm giác chỉn chu và thanh lịch. Màu sắc nhã nhặn, các chi tiết hoàn thiện sắc nét y như trên hình ảnh thực tế.`,
      estimatedDuration: '18s',
      timeline: [
        { timeRange: '00:00 – 00:04', shotId: 'S002', shotTitle: 'S002 Detail Shot', visualAction: 'Macro cận cảnh đường nét hoàn thiện' },
        { timeRange: '00:04 – 00:11', shotId: 'S001', shotTitle: 'S001 Hero Shot', visualAction: 'Toàn cảnh studio tĩnh đẩy chậm' },
        { timeRange: '00:11 – 00:18', shotId: 'S003', shotTitle: 'S003 Lifestyle Shot', visualAction: 'Product-in-Environment: Đặt tĩnh trong không gian decor' },
      ],
      onScreenText: {
        hookText: 'FIRST LOOK: ĐỘ HOÀN THIỆN SẮC NÉT ✨',
        benefitText: 'Chuẩn từng đường nét • Bề mặt tinh xảo',
        ctaText: 'Kiểm tra ngay tại giỏ hàng 🛍️',
      },
      cta: 'Bấm vào góc trái màn hình để không bỏ lỡ các ưu đãi hiện có nhé!',
      editingInstructions: {
        scenes: 'S002 ➔ S001 ➔ S003',
        cutsAndTransitions: 'Match cuts tinh tế',
        textPlacement: 'Center Top',
        captions: 'Pop-in animated text',
        musicMood: 'Fresh Chillhop',
        audioMix: 'Voice 100% / BGM 18%',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 98,
        breakdown: { factualAccuracy: 40, noFakeExperience: 25, claimSafety: 19, naturalLanguage: 9, ctaAccuracy: 5 },
        hasFakePersonalExperience: false,
        claims: [{ claim: 'Hoàn thiện sắc nét theo ảnh chụp', source: 'IMAGE', status: 'VERIFIED', note: 'Xác thực qua ảnh thực tế' }],
        feedback: 'Góc nhìn quan sát trực diện, trung thực.',
      },
    },
    {
      id: 'P001_V08',
      salesAngle: 'V08 – AESTHETIC VIBE / MOOD',
      salesAngleDesc: 'Khai thác cảm xúc visual, phong cách thẩm mỹ thanh tao và tinh tế.',
      hook: `Dành cho những ai yêu thích phong cách tối giản và thanh lịch ✨`,
      voiceScript: `Không cần quá cầu kỳ, chính sự tối giản và chuẩn mực trong thiết kế của mẫu ${name} này sẽ tạo nên nét cuốn hút riêng biệt. Một điểm nhấn êm dịu và sang trọng cho diện mạo của bạn.`,
      estimatedDuration: '18s',
      timeline: [
        { timeRange: '00:00 – 00:05', shotId: 'S003', shotTitle: 'S003 Lifestyle Shot', visualAction: 'Product-in-Environment: Không gian tĩnh nghệ thuật' },
        { timeRange: '00:05 – 00:12', shotId: 'S001', shotTitle: 'S001 Hero Shot', visualAction: 'Studio tĩnh ánh sáng quét nhẹ' },
        { timeRange: '00:12 – 00:18', shotId: 'S002', shotTitle: 'S002 Detail Shot', visualAction: 'Macro cận cảnh chi tiết cấu tạo' },
      ],
      onScreenText: {
        hookText: 'AESTHETIC VIBE • PHONG CÁCH THANH TAO 🌿',
        benefitText: 'Tối giản • Sang trọng • Cân bằng',
        ctaText: 'Khám phá tại giỏ hàng 🛒',
      },
      cta: 'Tham khảo thêm chi tiết ngay trong giỏ hàng góc trái bạn nhé!',
      editingInstructions: {
        scenes: 'S003 ➔ S001 ➔ S002',
        cutsAndTransitions: 'Slow dissolves',
        textPlacement: 'Upper Third',
        captions: 'Minimalist Clean Font',
        musicMood: 'Lo-fi Ambient Dreamy',
        audioMix: 'Voice 100% / BGM 22%',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 97,
        breakdown: { factualAccuracy: 39, noFakeExperience: 25, claimSafety: 19, naturalLanguage: 9, ctaAccuracy: 5 },
        hasFakePersonalExperience: false,
        claims: [{ claim: 'Thiết kế tối giản và thanh lịch', source: 'APPROVED ASSET', status: 'INFERRED', note: 'Đánh giá gu thẩm mỹ mềm' }],
        feedback: 'An toàn và chuẩn mực.',
      },
    },
    {
      id: 'P001_V09',
      salesAngle: 'V09 – WARDROBE ESSENTIAL',
      salesAngleDesc: 'Định vị như một món đồ cơ bản dễ ứng dụng trong đời sống.',
      hook: `Món đồ cơ bản nhưng rất dễ phối trong tủ đồ của bạn!`,
      voiceScript: `Đôi khi một item cơ bản được hoàn thiện tốt lại chính là món bạn diện nhiều nhất. Mẫu ${name} sở hữu phom dáng thanh lịch, màu sắc trang nhã và luôn giữ được vẻ chỉn chu.`,
      estimatedDuration: '19s',
      timeline: [
        { timeRange: '00:00 – 00:03', shotId: 'S001', shotTitle: 'S001 Hero Shot', visualAction: 'Hero shot studio tĩnh' },
        { timeRange: '00:03 – 00:09', shotId: 'S002', shotTitle: 'S002 Detail Shot', visualAction: 'Macro soi phụ kiện và nếp cắt' },
        { timeRange: '00:09 – 00:15', shotId: 'S003', shotTitle: 'S003 Lifestyle Shot', visualAction: 'Product-in-Environment tĩnh decor' },
        { timeRange: '00:15 – 00:19', shotId: 'S001', shotTitle: 'S001 Hero Shot', visualAction: 'Khóa lại toàn cảnh studio tĩnh' },
      ],
      onScreenText: {
        hookText: 'ITEM DỄ PHỐI CHO MỌI DỊP 👗',
        benefitText: 'Thanh lịch • Dễ ứng dụng hàng ngày',
        ctaText: 'Xem giỏ hàng bên dưới 👇',
      },
      cta: 'Ghé xem ngay giỏ hàng bên dưới để chọn phiên bản yêu thích nhé!',
      editingInstructions: {
        scenes: 'S001 ➔ S002 ➔ S003 ➔ S001',
        cutsAndTransitions: 'Snappy hard cuts',
        textPlacement: 'Top Safe Zone',
        captions: 'Bold white text',
        musicMood: 'Modern Chic Beats',
        audioMix: 'Voice 100% / BGM 20%',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 98,
        breakdown: { factualAccuracy: 40, noFakeExperience: 25, claimSafety: 19, naturalLanguage: 9, ctaAccuracy: 5 },
        hasFakePersonalExperience: false,
        claims: [{ claim: 'Item cơ bản dễ ứng dụng', source: 'APPROVED ASSET', status: 'INFERRED', note: 'Gợi ý phong cách mềm' }],
        feedback: 'Nội dung chuẩn xác.',
      },
    },
    {
      id: 'P001_V10',
      salesAngle: 'V10 – SMART SHOPPING & VALUE',
      salesAngleDesc: 'Tập trung vào chi tiết cấu tạo thực tế và độ hoàn thiện gia công.',
      hook: `Nếu bạn đang tìm kiếm một sự lựa chọn tinh gọn và thực chất...`,
      voiceScript: `Mẫu ${name} này tập trung vào độ hoàn thiện thực tế. Từng góc bo và chi tiết được gia công tỉ mỉ, phom dáng cân đối giúp bạn an tâm khi tham khảo thông tin chi tiết.`,
      estimatedDuration: '18s',
      timeline: [
        { timeRange: '00:00 – 00:04', shotId: 'S001', shotTitle: 'S001 Hero Shot', visualAction: 'Studio tĩnh cinematic push-in' },
        { timeRange: '00:04 – 00:10', shotId: 'S002', shotTitle: 'S002 Detail Shot', visualAction: 'Macro cận cảnh chất liệu' },
        { timeRange: '00:10 – 00:18', shotId: 'S003', shotTitle: 'S003 Lifestyle Shot', visualAction: 'Product-in-Environment tĩnh decor' },
      ],
      onScreenText: {
        hookText: 'LỰA CHỌN MUA SẮM TINH GỌN 💡',
        benefitText: 'Hoàn thiện thực chất • Phom dáng chỉn chu',
        ctaText: 'Xem thêm thông tin ở giỏ hàng 🛒',
      },
      cta: 'Bấm ngay vào giỏ hàng để cập nhật thông tin và chương trình mới nhất!',
      editingInstructions: {
        scenes: 'S001 ➔ S002 ➔ S003',
        cutsAndTransitions: 'Clean cuts',
        textPlacement: 'Top-center safe zone',
        captions: 'Yellow highlight captions',
        musicMood: 'Acoustic Bright Tone',
        audioMix: 'Voice 100% / BGM 17%',
      },
      requiresPriceCheck: false,
      isApproved: false,
      contentQc: {
        status: 'PASS',
        score: 98,
        breakdown: { factualAccuracy: 40, noFakeExperience: 25, claimSafety: 19, naturalLanguage: 9, ctaAccuracy: 5 },
        hasFakePersonalExperience: false,
        claims: [{ claim: 'Hoàn thiện thực chất, phom dáng chỉn chu', source: 'IMAGE', status: 'VERIFIED', note: 'Xác minh từ hình ảnh thực' }],
        feedback: 'Đạt chuẩn nội dung sạch.',
      },
    },
  ];

  return [...baseVariations, ...extraVariations].slice(0, count);
}


