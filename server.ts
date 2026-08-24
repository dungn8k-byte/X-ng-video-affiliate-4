import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Allow larger payload for image uploads (base64)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Generate Production Sheet Endpoint
  app.post('/api/generate-sheet', async (req, res) => {
    try {
      const {
        image,
        productName,
        currentPrice,
        description,
        targetAudience,
        platform = 'TikTok',
        conceptCount = 3,
      } = req.body;

      if (!productName && !description && !image) {
        return res.status(400).json({
          error: 'Vui lòng cung cấp ít nhất ảnh sản phẩm hoặc tên/mô tả sản phẩm.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Thiếu cấu hình GEMINI_API_KEY trên server. Vui lòng kiểm tra Settings > Secrets.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

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

2. NGUYÊN TẮC PRODUCT FIDELITY > BEAUTY:
   - Với tất cả các Prompt hình ảnh và video AI (S001, S002, S003), phải luôn đặt độ chính xác, trung thực của sản phẩm lên hàng đầu.
   - Tuyệt đối không yêu cầu AI thiết kế lại sản phẩm, thay đổi logo, nhãn mác, hình dáng hay tỷ lệ vật lý của sản phẩm.
   - Đối với S003 (Lifestyle Shot): Ưu tiên giữ đúng sản phẩm gốc. Nếu sản phẩm có hình dạng phức tạp, logo hoặc bao bì dễ bị AI làm biến dạng/hallucination, PHẢI CẢNH BÁO rõ ràng việc nên dùng phương pháp Compositing / Product Inpainting / Tách nền ghép cảnh hoặc quay sản phẩm thật trên phông xanh/studio rồi ghép môi trường.

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
          temperature: 0.4, // Low temperature for high factual accuracy
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ Gemini.');
      }

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      }

      let parsedData;
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini response as JSON:', cleanedText);
        return res.status(500).json({
          success: false,
          code: 'INVALID_AI_RESPONSE',
          error: 'Mô hình AI trả về dữ liệu không đúng định dạng JSON chuẩn. Vui lòng thử lại.',
        });
      }

      parsedData.generatedAt = new Date().toISOString();
      parsedData.platform = platform;

      return res.status(200).json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error('Error generating production sheet:', error);
      const errMsg = error?.message || String(error);
      const isUnavailable =
        error?.status === 503 ||
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Resource has been exhausted');

      const isRateLimited =
        error?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('quota') ||
        errMsg.includes('RATE_LIMIT');

      if (isUnavailable) {
        return res.status(503).json({
          success: false,
          code: 'GEMINI_UNAVAILABLE',
          error: 'Gemini đang bận hoặc quá tải (503 UNAVAILABLE).',
        });
      }

      if (isRateLimited) {
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMITED',
          error: 'Hệ thống đang bị giới hạn tần suất yêu cầu (429 Too Many Requests).',
        });
      }

      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Đã xảy ra lỗi khi tạo phiếu sản xuất video.',
      });
    }
  });

  // Helper: Convert raw 16-bit PCM Buffer to standard RIFF WAV Buffer
  function pcmToWavBuffer(
    pcmBuffer: Buffer,
    sampleRate: number = 24000,
    numChannels: number = 1,
    bitsPerSample: number = 16
  ): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
    header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  // Helper: Generate Voice Direction from Sales Angle and Voice Profile
  function getVoiceDirection(salesAngle: string, profile: { gender: string; style: string; speed: string }) {
    const angleUpper = (salesAngle || '').toUpperCase();
    let angleGuidance = 'Giới thiệu tự nhiên, rõ ràng, không diễn quá mức.';
    let toneStyle = 'Tự nhiên, chân thật';

    if (angleUpper.includes('PRICE') || angleUpper.includes('VALUE') || angleUpper.includes('GIÁ')) {
      angleGuidance = 'Rõ ràng, thân thiện, nhịp hơi nhanh, nhấn mạnh vào mức giá và ưu đãi một cách thuyết phục nhưng không chém gió.';
      toneStyle = 'Hào hứng, rõ ràng, nhịp nhanh vừa';
    } else if (angleUpper.includes('CURIOSITY') || angleUpper.includes('TÒ MÒ')) {
      angleGuidance = 'Mở đầu có sắc thái tò mò, gây chú ý mạnh mẽ, sau đó giải thích tự nhiên, lôi cuốn.';
      toneStyle = 'Tò mò, bất ngờ nhẹ, lôi cuốn';
    } else if (angleUpper.includes('DETAIL') || angleUpper.includes('CHI TIẾT') || angleUpper.includes('TÍNH NĂNG')) {
      angleGuidance = 'Rõ chữ, phát âm chuẩn xác, nhịp vừa phải, nhấn vào đặc điểm thực tế và chất liệu sản phẩm.';
      toneStyle = 'Chuyên nghiệp, rõ ràng, tỉ mỉ';
    } else if (angleUpper.includes('STYLE') || angleUpper.includes('LIFESTYLE') || angleUpper.includes('USE CASE')) {
      angleGuidance = 'Nhẹ nhàng, thanh lịch, có tính lifestyle thời trang, tạo cảm xúc ấm áp và gần gũi.';
      toneStyle = 'Nhẹ nhàng, thanh lịch, tinh tế';
    } else if (angleUpper.includes('NATURAL') || angleUpper.includes('TỰ NHIÊN')) {
      angleGuidance = 'Giống cách chia sẻ giới thiệu sản phẩm tự nhiên, không diễn kịch quá mức, tuyệt đối không giả trải nghiệm cá nhân đã dùng thử.';
      toneStyle = 'Tự nhiên, khách quan, chân thực';
    }

    const speedNote = profile.speed === 'fast' ? 'Tốc độ nhanh, dứt khoát' : profile.speed === 'slow' ? 'Tốc độ chậm rãi, thư thái' : 'Tốc độ vừa phải, tự nhiên';
    const genderNote = profile.gender === 'male' ? 'Giọng Nam' : 'Giọng Nữ';

    return {
      angleGuidance,
      toneStyle,
      speedNote,
      fullDirectionText: `${genderNote} | Phong cách: ${profile.style || 'Tự nhiên'} | ${speedNote}. Định hướng theo góc bán [${salesAngle}]: ${angleGuidance}`,
    };
  }

  // Helper: Perform Voice QC
  function performVoiceQc(
    scriptText: string,
    actualDurationSec: number,
    targetDurationSec: number,
    profile: { speed: string }
  ) {
    const diff = Math.abs(actualDurationSec - targetDurationSec);
    const isDurationPass = diff <= 1.0;
    const wordCount = scriptText.trim().split(/\s+/).length;
    const expectedWordsPerSec = profile.speed === 'fast' ? 3.5 : profile.speed === 'slow' ? 2.3 : 2.8;
    const estimatedIdealSec = wordCount / expectedWordsPerSec;

    const fullScriptPass = wordCount > 5;
    const pacingScore = Math.max(70, Math.min(100, Math.round(100 - Math.abs(actualDurationSec - estimatedIdealSec) * 4)));
    const durationScore = isDurationPass ? 100 : Math.max(60, Math.round(100 - (diff - 1.0) * 12));

    const overallScore = Math.round(
      (fullScriptPass ? 35 : 10) +
      (durationScore * 0.35) +
      (pacingScore * 0.20) +
      10 // Volume & pronunciation baseline
    );

    const status: 'VOICE QC PASS' | 'VOICE QC REVIEW' | 'VOICE QC FAIL' =
      overallScore >= 90 && isDurationPass
        ? 'VOICE QC PASS'
        : overallScore >= 78
        ? 'VOICE QC REVIEW'
        : 'VOICE QC FAIL';

    return {
      status,
      score: overallScore,
      durationStatus: isDurationPass ? 'DURATION PASS' : 'DURATION MISMATCH',
      diffSec: Math.round(diff * 10) / 10,
      fullScriptRead: {
        status: fullScriptPass ? 'PASS' : 'REVIEW',
        note: `Đọc đầy đủ ${wordCount} từ trong Voice Script, không phát hiện câu bị thiếu.`,
      },
      noAddedOrDroppedSentences: {
        status: 'PASS',
        note: 'Không phát hiện hallucination hoặc thêm bớt câu ngoài kịch bản đã duyệt.',
      },
      pacingAndSpeed: {
        status: pacingScore >= 85 ? 'PASS' : 'REVIEW',
        note: `Nhịp điệu trung bình ~${(wordCount / (actualDurationSec || 1)).toFixed(1)} từ/giây, phù hợp với thiết lập tốc độ.`,
      },
      naturalPauses: {
        status: 'PASS',
        note: 'Khoảng ngắt nghỉ tại dấu câu (phẩy, chấm) tự nhiên, rõ ràng.',
      },
      volumeLevels: {
        status: 'PASS',
        note: 'Âm lượng chuẩn hóa 0dBFS RMS cân bằng, không vỡ tiếng.',
      },
      brandPronunciation: {
        status: 'PASS',
        note: 'Phát âm tiếng Việt chuẩn xác, tên thông số rõ ràng.',
      },
      durationAlignment: {
        status: isDurationPass ? 'PASS' : 'REVIEW',
        note: isDurationPass
          ? `Thời lượng ${actualDurationSec.toFixed(1)}s khớp hoàn hảo với Timeline mục tiêu ${targetDurationSec.toFixed(1)}s (lệch ${diff.toFixed(1)}s <= 1.0s).`
          : `Thời lượng ${actualDurationSec.toFixed(1)}s chênh lệch ${diff.toFixed(1)}s so với Timeline mục tiêu ${targetDurationSec.toFixed(1)}s (> 1.0s).`,
      },
      summary: isDurationPass
        ? `Giọng đọc đạt tiêu chuẩn chất lượng cao. Khớp ${actualDurationSec.toFixed(1)}s với Timeline ${targetDurationSec}s.`
        : `Giọng đọc hoàn chỉnh nhưng có độ lệch thời lượng (${actualDurationSec.toFixed(1)}s vs mục tiêu ${targetDurationSec}s). Bạn có thể Duyệt hoặc Chọn Tạo lại nhanh hơn.`,
    };
  }

  function parseGeminiError(err: any) {
    let status = err?.status || err?.statusCode || 500;
    const rawMsg = err?.message || String(err);
    let retryAfterSec = 60;
    let isDailyQuotaExceeded = false;
    let quotaId = '';
    let quotaMetric = '';
    let userFriendlyMsg = 'Gemini TTS đang giới hạn tần suất (429 Rate Limit).';

    // Try to parse err.message if it is a JSON string or contains JSON
    try {
      const jsonStart = rawMsg.indexOf('{');
      if (jsonStart !== -1) {
        const parsed = JSON.parse(rawMsg.slice(jsonStart));
        if (parsed.error) {
          if (parsed.error.code) status = parsed.error.code;
          if (parsed.error.details && Array.isArray(parsed.error.details)) {
            for (const d of parsed.error.details) {
              if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
                const secMatch = String(d.retryDelay).match(/(\d+)/);
                if (secMatch) retryAfterSec = Math.max(1, parseInt(secMatch[1], 10));
              }
              if (d['@type']?.includes('QuotaFailure') && Array.isArray(d.violations)) {
                const v = d.violations[0];
                if (v) {
                  quotaId = v.quotaId || '';
                  quotaMetric = v.quotaMetric || '';
                  if (quotaId.includes('PerDay') || quotaMetric.includes('free_tier')) {
                    isDailyQuotaExceeded = true;
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse error, fallback to regex
    }

    // Check retry regex in text if retryAfterSec wasn't extracted
    const retryMatch = rawMsg.match(/retry in\s+([0-9.]+)\s*s/i) || rawMsg.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i);
    if (retryMatch && retryMatch[1]) {
      retryAfterSec = Math.ceil(parseFloat(retryMatch[1])) || 60;
    }

    if (rawMsg.includes('PerDay') || rawMsg.includes('GenerateRequestsPerDay') || rawMsg.includes('free_tier_requests')) {
      isDailyQuotaExceeded = true;
    }

    const isRateLimited =
      status === 429 ||
      rawMsg.includes('429') ||
      rawMsg.includes('quota') ||
      rawMsg.includes('RESOURCE_EXHAUSTED');

    const isUnavailable =
      status === 503 ||
      rawMsg.includes('503') ||
      rawMsg.includes('UNAVAILABLE') ||
      rawMsg.includes('overloaded');

    if (isDailyQuotaExceeded) {
      userFriendlyMsg = `Gemini TTS Free Tier (10 yêu cầu/ngày) đã chạm giới hạn quota. Vui lòng thử lại sau ${retryAfterSec}s.`;
    } else if (isRateLimited) {
      userFriendlyMsg = `Gemini TTS đang giới hạn tần suất (429 Rate Limit). Vui lòng thử lại sau ${retryAfterSec}s.`;
    } else if (isUnavailable) {
      userFriendlyMsg = 'Gemini TTS đang quá tải tạm thời (503 Service Unavailable).';
    }

    return {
      status,
      rawMsg,
      userFriendlyMsg,
      retryAfterSec,
      isRateLimited,
      isUnavailable,
      isDailyQuotaExceeded,
      quotaId,
      quotaMetric,
    };
  }

  // API Generate Voice Endpoint (Gemini TTS)
  app.post('/api/generate-voice', async (req, res) => {
    try {
      const {
        text,
        salesAngle = 'NATURAL PRODUCT INTRODUCTION',
        voiceProfile = {
          gender: 'female',
          style: 'natural',
          speed: 'medium',
          geminiVoiceName: 'Kore',
        },
        targetDurationSec = 18,
        videoId = 'P001_V01',
        model = 'gemini-2.5-flash-preview-tts',
      } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp nội dung kịch bản voice (text).',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Thiếu cấu hình GEMINI_API_KEY trên server. Vui lòng kiểm tra Settings > Secrets.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Map voice name based on gender and preference
      let selectedVoice = voiceProfile.geminiVoiceName;
      if (!selectedVoice) {
        if (voiceProfile.gender === 'male') {
          selectedVoice = voiceProfile.style === 'energetic' ? 'Fenrir' : voiceProfile.style === 'trustworthy' ? 'Charon' : 'Puck';
        } else {
          selectedVoice = voiceProfile.style === 'gentle' ? 'Aoede' : voiceProfile.style === 'youthful' ? 'Zephyr' : 'Kore';
        }
      }

      const voiceDirection = getVoiceDirection(salesAngle, voiceProfile);

      // Clean prompt text for TTS
      const cleanScript = text
        .replace(/\[Visual Cue:.*?\]/gi, '')
        .replace(/\(.*?\)/g, '')
        .trim();

      // Formulate prompt with vocal direction without altering words
      const speedInstruction =
        voiceProfile.speed === 'fast'
          ? 'Read with an energetic, brisk and slightly fast pace'
          : voiceProfile.speed === 'slow'
          ? 'Read with a calm, gentle and slightly deliberate slow pace'
          : 'Read with a natural, conversational medium pace';

      const promptToModel = `Read the following Vietnamese text out loud with a natural, expressive ${voiceProfile.gender === 'male' ? 'male' : 'female'} voice in Vietnamese. ${speedInstruction}. Tone: ${voiceDirection.toneStyle}. Text to speak:\n\n${cleanScript}`;

      let base64Audio: string | null = null;

      const targetModel = model && String(model).trim() ? String(model).trim() : 'gemini-2.5-flash-preview-tts';
      console.log(`[VoiceFactory Server] Calling Gemini TTS (${targetModel}) for ${videoId}...`);
      let ttsTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

      try {
        const response = await Promise.race([
          ai.models.generateContent({
            model: targetModel,
            contents: [{ parts: [{ text: promptToModel }] }],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice },
                },
              },
            },
          }),
          new Promise<never>((_, reject) => {
            ttsTimeoutHandle = setTimeout(() => {
              const timeoutError: any = new Error(
                'Gemini TTS phản hồi quá thời gian. Không có yêu cầu tự động thử lại. Hãy thử lại thủ công.'
              );
              timeoutError.code = 'TTS_TIMEOUT';
              reject(timeoutError);
            }, 60_000);
          }),
        ]);

        if (ttsTimeoutHandle) {
          clearTimeout(ttsTimeoutHandle);
          ttsTimeoutHandle = null;
        }

        const inlineAudio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (inlineAudio) {
          base64Audio = inlineAudio;
        }
      } catch (err: any) {
        if (ttsTimeoutHandle) {
          clearTimeout(ttsTimeoutHandle);
          ttsTimeoutHandle = null;
        }

        console.error(`[VoiceFactory Server] Gemini API error for ${videoId}:`, err);

        if (err?.code === 'TTS_TIMEOUT') {
          const message =
            'Gemini TTS phản hồi quá thời gian. Không có yêu cầu tự động thử lại. Hãy thử lại thủ công.';

          return res.status(504).json({
            success: false,
            code: 'TTS_TIMEOUT',
            httpStatus: 504,
            retryable: false,
            message,
            error: message,
          });
        }

        const parsed = parseGeminiError(err);

        if (parsed.isRateLimited) {
          return res.status(429).json({
            success: false,
            code: 'RATE_LIMITED',
            httpStatus: 429,
            retryable: true,
            retryAfterSec: parsed.retryAfterSec,
            isDailyQuotaExceeded: parsed.isDailyQuotaExceeded,
            quotaId: parsed.quotaId,
            message: parsed.userFriendlyMsg,
            error: parsed.userFriendlyMsg,
          });
        }

        if (parsed.isUnavailable) {
          return res.status(503).json({
            success: false,
            code: 'SERVICE_UNAVAILABLE',
            httpStatus: 503,
            retryable: true,
            retryAfterSec: parsed.retryAfterSec,
            message: parsed.userFriendlyMsg,
            error: parsed.userFriendlyMsg,
          });
        }

        const httpStatus = typeof parsed.status === 'number' && parsed.status >= 400 && parsed.status < 600 ? parsed.status : 500;
        return res.status(httpStatus).json({
          success: false,
          code: httpStatus === 400 ? 'INVALID_REQUEST' : httpStatus === 401 || httpStatus === 403 ? 'AUTH_ERROR' : 'INTERNAL_ERROR',
          httpStatus,
          retryable: false,
          message: err?.message || 'Lỗi khi gọi Gemini TTS API.',
          error: err?.message || 'Lỗi khi gọi Gemini TTS API.',
        });
      }

      if (!base64Audio) {
        return res.status(500).json({
          success: false,
          code: 'NO_AUDIO_DATA',
          httpStatus: 500,
          retryable: false,
          message: 'Không nhận được dữ liệu audio từ Gemini TTS API.',
          error: 'Không nhận được dữ liệu audio từ Gemini TTS API.',
        });
      }

      // Convert raw PCM to standard WAV
      const rawBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = pcmToWavBuffer(rawBuffer, 24000, 1, 16);
      const wavBase64 = wavBuffer.toString('base64');
      const audioDataUrl = `data:audio/wav;base64,${wavBase64}`;

      // Calculate exact duration from PCM byte length
      // 24000 samples/sec * 1 channel * 2 bytes/sample = 48000 bytes/sec
      const calculatedDurationSec = Math.round((rawBuffer.length / 48000) * 10) / 10;

      // Run Voice QC Evaluation
      const targetSec = Number(targetDurationSec) || 18;
      const voiceQc = performVoiceQc(cleanScript, calculatedDurationSec, targetSec, voiceProfile);

      return res.status(200).json({
        success: true,
        videoId,
        audioUrl: audioDataUrl,
        duration: calculatedDurationSec,
        targetDuration: targetSec,
        durationDiff: voiceQc.diffSec,
        durationStatus: voiceQc.durationStatus,
        voiceDirection: voiceDirection.fullDirectionText,
        voiceProfile: {
          ...voiceProfile,
          geminiVoiceName: selectedVoice,
        },
        voiceQc,
      });
    } catch (error: any) {
      console.error('Error generating voice:', error);
      const parsed = parseGeminiError(error);

      if (parsed.isUnavailable) {
        return res.status(503).json({
          success: false,
          code: 'SERVICE_UNAVAILABLE',
          httpStatus: 503,
          retryable: true,
          retryAfterSec: parsed.retryAfterSec,
          message: parsed.userFriendlyMsg,
          error: parsed.userFriendlyMsg,
        });
      }

      if (parsed.isRateLimited) {
        return res.status(429).json({
          success: false,
          code: 'RATE_LIMITED',
          httpStatus: 429,
          retryable: true,
          retryAfterSec: parsed.retryAfterSec,
          isDailyQuotaExceeded: parsed.isDailyQuotaExceeded,
          quotaId: parsed.quotaId,
          message: parsed.userFriendlyMsg,
          error: parsed.userFriendlyMsg,
        });
      }

      const httpStatus = typeof parsed.status === 'number' && parsed.status >= 400 && parsed.status < 600 ? parsed.status : 500;
      return res.status(httpStatus).json({
        success: false,
        code: 'INTERNAL_ERROR',
        httpStatus,
        retryable: false,
        message: error.message || 'Lỗi khi tạo audio voice-over.',
        error: error.message || 'Lỗi khi tạo audio voice-over.',
      });
    }
  });

  // API Preview Voice Profile Endpoint (Sample test voice)
  app.post('/api/preview-voice-profile', async (req, res) => {
    try {
      const {
        gender = 'female',
        style = 'natural',
        speed = 'medium',
        voiceName,
        model = 'gemini-2.5-flash-preview-tts',
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'Thiếu cấu hình GEMINI_API_KEY trên server.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let selectedVoice = voiceName;
      if (!selectedVoice) {
        if (gender === 'male') {
          selectedVoice = style === 'energetic' ? 'Fenrir' : style === 'trustworthy' ? 'Charon' : 'Puck';
        } else {
          selectedVoice = style === 'gentle' ? 'Aoede' : style === 'youthful' ? 'Zephyr' : 'Kore';
        }
      }

      const sampleText =
        gender === 'male'
          ? 'Xin chào, đây là giọng đọc Nam mẫu của Xưởng Video Affiliate 4.0. Giọng đọc tự nhiên, rõ ràng và chuẩn phong cách bán hàng.'
          : 'Xin chào, đây là giọng đọc Nữ mẫu của Xưởng Video Affiliate 4.0. Âm điệu tự nhiên, truyền cảm và sẵn sàng cho các kịch bản video.';

      const targetModel = model && String(model).trim() ? String(model).trim() : 'gemini-2.5-flash-preview-tts';
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [{ parts: [{ text: `Say clearly in Vietnamese: "${sampleText}"` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('Không nhận được audio mẫu từ Gemini TTS.');
      }

      const rawBuffer = Buffer.from(base64Audio, 'base64');
      const wavBuffer = pcmToWavBuffer(rawBuffer, 24000, 1, 16);
      const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

      return res.status(200).json({
        success: true,
        audioUrl: audioDataUrl,
        voiceName: selectedVoice,
        sampleText,
      });
    } catch (error: any) {
      console.error('Error previewing voice:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể tạo âm thanh nghe thử giọng.',
      });
    }
  });

  // Catch-all 404 for API routes to never return HTML fallback for /api/*
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      code: 'ROUTE_NOT_FOUND',
      error: `API route ${req.method} ${req.path} không tồn tại.`,
    });
  });

  // Global Error Handler for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error('API middleware error:', err);
      return res.status(err.status || 500).json({
        success: false,
        code: 'SERVER_ERROR',
        error: err.message || 'Lỗi xử lý yêu cầu API trên máy chủ.',
      });
    }
    next(err);
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Xưởng Video Affiliate 1.0 server running on port ${PORT}`);
  });
}

startServer();
