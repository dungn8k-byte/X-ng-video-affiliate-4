import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Users,
  Target,
  Sparkles,
  Zap,
  Mic,
  ArrowRightCircle,
  Camera,
  Search,
  Image as ImageIcon,
  Video,
  CheckSquare,
  Copy,
  Printer,
  Download,
  Check,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProductionSheetData } from '../types';
import { CopyButton } from './CopyButton';

interface ProductionSheetViewProps {
  data: ProductionSheetData;
  onPrint: () => void;
}

export const ProductionSheetView: React.FC<ProductionSheetViewProps> = ({ data, onPrint }) => {
  const [qcChecked, setQcChecked] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<string>('all');
  const [copiedAll, setCopiedAll] = useState(false);

  const toggleQc = (index: number) => {
    setQcChecked((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Helper to compile full text of the entire sheet for "Copy All" or Markdown download
  const compileFullSheetText = (): string => {
    return `# PHIẾU SẢN XUẤT VIDEO AFFILIATE 2.0
Nền tảng: ${data.platform}
Thời gian tạo: ${new Date(data.generatedAt).toLocaleString('vi-VN')}

========================================
1. PRODUCT PROFILE (HỒ SƠ SẢN PHẨM)
- Tên sản phẩm: ${data.productProfile.productName}
- Danh mục: ${data.productProfile.category}
- Mức giá / Ưu đãi: ${data.productProfile.price}
- Tóm tắt tính năng chính: ${data.productProfile.keyFeaturesSummary}
- Giá trị cảm nhận: ${data.productProfile.perceivedValue}

========================================
2. VERIFIED FACTS (THÔNG TIN ĐÃ XÁC MINH - ĐƯỢC PHÉP CAM KẾT)
${data.verifiedFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}

========================================
3. UNVERIFIED / DO NOT CLAIM (THÔNG TIN CHƯA XÁC MINH - TUYỆT ĐỐI KHÔNG BỊA ĐẶT)
${data.unverifiedDoNotClaim.map((f, i) => `[!] ${f}`).join('\n')}

========================================
4. TARGET CUSTOMER (CHÂN DUNG KHÁCH HÀNG MỤC TIÊU)
- Nhân khẩu học: ${data.targetCustomer.demographics}
- Tâm lý & Hành vi: ${data.targetCustomer.psychographics}
- Nỗi đau (Pain Points):
${data.targetCustomer.painPoints.map((p, i) => `  * ${p}`).join('\n')}
- Mong muốn & Kích hoạt mua hàng:
${data.targetCustomer.desiresAndTriggers.map((d, i) => `  * ${d}`).join('\n')}

========================================
5. USP (UNIQUE SELLING PROPOSITION)
- USP Cốt lõi: ${data.usp.primaryUsp}
- Các lợi thế bổ trợ:
${data.usp.secondaryUsps.map((u, i) => `  * ${u}`).join('\n')}
- Lợi thế cạnh tranh: ${data.usp.comparisonAdvantage}

========================================
6. SALES ANGLES (GÓC BÁN HÀNG - ${data.salesAngles.length} CONCEPTS)
${data.salesAngles
  .map(
    (a, i) =>
      `[CONCEPT ${i + 1}: ${a.title}]
- Insight cốt lõi: ${a.coreInsight}
- Hướng tiếp cận: ${a.angleDescription}
- Cảm xúc kích hoạt: ${a.emotionalTrigger}`
  )
  .join('\n\n')}

========================================
7. HOOKS (BỘ HOOK 3S ĐẦU)
${data.hooks
  .map(
    (h, i) =>
      `[HOOK ${i + 1} - ${h.angleTitle}]
- Visual Hook (Hình ảnh): ${h.visualHook}
- Audio Hook (Âm thanh/Lời mở): ${h.audioHook}
- Text On Screen (Chữ trên màn hình): ${h.textOnScreen}
- Chiến thuật giữ chân: ${h.retentionTactic}`
  )
  .join('\n\n')}

========================================
8. VOICE SCRIPTS (KỊCH BẢN VOICE-OVER)
${data.voiceScripts
  .map(
    (v, i) =>
      `[KỊCH BẢN ${i + 1} - ${v.angleTitle}]
- Thời lượng dự kiến: ${v.estimatedDuration} | Nhịp điệu: ${v.pacing}
- Lời thoại Voice-over:
"${v.scriptBody}"
- Chỉ dẫn khung hình (Visual Cues):
${v.visualCues.map((c) => `  > ${c}`).join('\n')}`
  )
  .join('\n\n')}

========================================
9. CTA (CALL TO ACTION)
${data.cta
  .map(
    (c, i) =>
      `[CTA ${i + 1}: ${c.type}]
- Lời kêu gọi: "${c.script}"
- Banner/Text màn hình: ${c.onScreenBanner}
- Yếu tố cấp bách: ${c.urgencyTactic}`
  )
  .join('\n\n')}

========================================
10. S001 PROMPT (HERO SHOT)
- English Prompt: ${data.s001HeroPrompt.promptEn}
- Bản dịch tiếng Việt: ${data.s001HeroPrompt.promptVi}
- Lighting & Lens: ${data.s001HeroPrompt.lightingAndLens}
- Tỷ lệ: ${data.s001HeroPrompt.aspectRatio}
- Negative Prompt: ${data.s001HeroPrompt.negativePrompt}

========================================
11. S002 PROMPT (DETAIL SHOT)
- English Prompt: ${data.s002DetailPrompt.promptEn}
- Bản dịch tiếng Việt: ${data.s002DetailPrompt.promptVi}
- Điểm lấy nét (Focal point): ${data.s002DetailPrompt.focalPoint}
- Chi tiết texture/vật liệu: ${data.s002DetailPrompt.textureDetails}
- Negative Prompt: ${data.s002DetailPrompt.negativePrompt}

========================================
12. S003 IMAGE PROMPT (LIFESTYLE PRODUCT SHOT)
- Rule: PRODUCT FIDELITY > BEAUTY (Giữ nguyên phom dáng, màu sắc, logo sản phẩm)
- English Prompt: ${data.s003LifestyleImagePrompt.promptEn}
- Bản dịch tiếng Việt: ${data.s003LifestyleImagePrompt.promptVi}
- Môi trường / Bối cảnh: ${data.s003LifestyleImagePrompt.environment}
- Negative Prompt: ${data.s003LifestyleImagePrompt.negativePrompt}

========================================
13. S003 VIDEO PROMPT (LIFESTYLE VIDEO SHOT)
- English Prompt: ${data.s003LifestyleVideoPrompt.promptEn}
- Bản dịch tiếng Việt: ${data.s003LifestyleVideoPrompt.promptVi}
- Chuyển động camera: ${data.s003LifestyleVideoPrompt.cameraMovement}
- Hành động: ${data.s003LifestyleVideoPrompt.actionDescription}
- Công cụ khuyên dùng: ${data.s003LifestyleVideoPrompt.toolRecommendation}

========================================
CẢNH BÁO BIẾN DẠNG & KỸ THUẬT COMPOSITING:
Mức độ rủi ro: ${data.fidelityWarning.riskLevel}
Cảnh báo: ${data.fidelityWarning.warningMessage}
Kỹ thuật khuyến nghị: ${data.fidelityWarning.recommendedTechnique}

========================================
14. QC CHECKLIST (BẢNG KIỂM DUYỆT CHẤT LƯỢNG)
${data.qcChecklist.map((q, i) => `[ ] ${q.checkItem} (Lý do: ${q.whyItMatters})`).join('\n')}
`;
  };

  const handleCopyAll = async () => {
    const fullText = compileFullSheetText();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2200);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadMarkdown = () => {
    const fullText = compileFullSheetText();
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phieu-san-xuat-${data.productProfile.productName.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="production-sheet-container" className="space-y-6">
      {/* Top Sheet Banner & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
              Dự thảo sản xuất #0421
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
              Nền tảng: {data.platform}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
              {data.salesAngles.length} Concepts
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase line-clamp-1">
            {data.productProfile.productName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thời gian lập: {new Date(data.generatedAt).toLocaleString('vi-VN')} • Chuẩn Product Fidelity
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            id="copy-all-sheet-btn"
            type="button"
            onClick={handleCopyAll}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-[0.98] ${
              copiedAll
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép toàn bộ</span>
              </>
            )}
          </button>

          <button
            id="download-md-btn"
            type="button"
            onClick={downloadMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Tải về tệp Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Markdown</span>
          </button>

          <button
            id="print-sheet-btn"
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="In hoặc Lưu thành PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In / PDF</span>
          </button>
        </div>
      </div>

      {/* QUICK JUMP NAVIGATION BAR */}
      <div className="bg-slate-200/60 backdrop-blur-sm p-1.5 rounded-xl border border-slate-300 flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px] font-medium text-slate-600">
        <span className="px-2 font-bold text-slate-500 uppercase text-[10px] tracking-wider shrink-0">Mục lục:</span>
        <a href="#section-profile" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">1. Profile</a>
        <a href="#section-verified" className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-slate-200 shrink-0 transition-colors text-emerald-700 font-semibold">2. Xác minh</a>
        <a href="#section-unverified" className="px-2.5 py-1 bg-white hover:bg-red-50 hover:text-red-700 rounded-lg border border-slate-200 shrink-0 transition-colors text-red-600 font-semibold">3. Không bịa đặt</a>
        <a href="#section-customer" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">4. Khách hàng</a>
        <a href="#section-usp" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">5. USP</a>
        <a href="#section-angles" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">6. Góc bán hàng</a>
        <a href="#section-hooks" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">7. Hooks</a>
        <a href="#section-scripts" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">8. Voice Scripts</a>
        <a href="#section-cta" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">9. CTA</a>
        <a href="#section-prompts" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors font-semibold text-blue-700">10-13. Prompts</a>
        <a href="#section-qc" className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-slate-200 shrink-0 transition-colors">14. QC Checklist</a>
      </div>

      {/* ========================================================== */}
      {/* 1. PRODUCT PROFILE */}
      {/* ========================================================== */}
      <section id="section-profile" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">1. HỒ SƠ SẢN PHẨM (PRODUCT PROFILE)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{data.productProfile.productName}</p>
            </div>
          </div>
          <CopyButton
            textToCopy={`PRODUCT PROFILE:\n- Tên: ${data.productProfile.productName}\n- Danh mục: ${data.productProfile.category}\n- Giá: ${data.productProfile.price}\n- Tính năng: ${data.productProfile.keyFeaturesSummary}\n- Giá trị cảm nhận: ${data.productProfile.perceivedValue}`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tên sản phẩm</span>
            <p className="font-bold text-slate-900 mt-1">{data.productProfile.productName}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mức giá / Ưu đãi</span>
            <p className="font-bold text-blue-600 mt-1">{data.productProfile.price}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Danh mục</span>
            <p className="font-medium text-slate-800 mt-1">{data.productProfile.category}</p>
          </div>
          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tóm tắt tính năng chủ chốt</span>
            <p className="text-slate-800 mt-1 leading-relaxed text-xs">{data.productProfile.keyFeaturesSummary}</p>
          </div>
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Giá trị cảm nhận (Perceived Value)</span>
            <p className="text-slate-900 font-medium mt-1 leading-relaxed text-xs italic">{data.productProfile.perceivedValue}</p>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 2 & 3: VERIFIED FACTS vs UNVERIFIED / DO NOT CLAIM (2 Columns) */}
      {/* ========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. VERIFIED FACTS */}
        <section id="section-verified" className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-[0.2em]">
                  2. THÔNG TIN XÁC MINH (VERIFIED FACTS)
                </h3>
                <p className="text-[11px] text-emerald-700">Được phép cam kết trong kịch bản video</p>
              </div>
            </div>
            <CopyButton
              variant="outline"
              textToCopy={`VERIFIED FACTS:\n${data.verifiedFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`}
            />
          </div>

          <ul className="space-y-2 text-xs">
            {data.verifiedFacts.map((fact, index) => (
              <li key={index} className="flex items-start gap-2.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="text-slate-800 leading-snug font-medium">{fact}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. UNVERIFIED / DO NOT CLAIM */}
        <section id="section-unverified" className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-red-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <div>
                <h3 className="text-xs font-bold text-red-800 uppercase tracking-[0.2em]">
                  3. CẤM KỴ BỊA ĐẶT (DO NOT CLAIM)
                </h3>
                <p className="text-[11px] text-red-700">Tuyệt đối không tự bịa / Tránh vi phạm chính sách sàn</p>
              </div>
            </div>
            <CopyButton
              variant="outline"
              textToCopy={`UNVERIFIED / DO NOT CLAIM:\n${data.unverifiedDoNotClaim.map((f, i) => `[!] ${f}`).join('\n')}`}
            />
          </div>

          <ul className="space-y-2 text-xs">
            {data.unverifiedDoNotClaim.map((item, index) => (
              <li key={index} className="flex items-start gap-2.5 bg-red-50/50 p-3 rounded-xl border border-red-100/80">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ✕
                </span>
                <span className="text-red-950 font-medium leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ========================================================== */}
      {/* 4. TARGET CUSTOMER */}
      {/* ========================================================== */}
      <section id="section-customer" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">4. CHÂN DUNG KHÁCH HÀNG (TARGET CUSTOMER)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Nỗi đau & Điểm chạm cảm xúc người mua</p>
            </div>
          </div>
          <CopyButton
            textToCopy={`TARGET CUSTOMER:\n- Nhân khẩu học: ${data.targetCustomer.demographics}\n- Tâm lý: ${data.targetCustomer.psychographics}\n- Nỗi đau:\n${data.targetCustomer.painPoints.map((p) => `* ${p}`).join('\n')}\n- Động cơ mua:\n${data.targetCustomer.desiresAndTriggers.map((d) => `* ${d}`).join('\n')}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Nhân khẩu học & Hành vi
            </span>
            <p className="text-slate-800 leading-relaxed font-medium text-sm">{data.targetCustomer.demographics}</p>
            <p className="text-xs text-slate-500 italic mt-1">{data.targetCustomer.psychographics}</p>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80 space-y-2">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block">
              Nỗi đau lớn nhất (Pain Points)
            </span>
            <ul className="space-y-1.5 text-slate-800 font-medium">
              {data.targetCustomer.painPoints.map((pain, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{pain}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 bg-blue-50/40 p-4 rounded-xl border border-blue-100 space-y-2">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">
              Mong muốn & Kích hoạt mua hàng (Desires & Buying Triggers)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
              {data.targetCustomer.desiresAndTriggers.map((desire, i) => (
                <div key={i} className="bg-white p-2.5 rounded-lg border border-blue-100 flex items-start gap-2 shadow-2xs">
                  <Target className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{desire}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 5. USP (UNIQUE SELLING PROPOSITION) */}
      {/* ========================================================== */}
      <section id="section-usp" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">5. LỢI THẾ ĐỘC NHẤT (USP)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Điểm khác biệt độc quyền so với thị trường</p>
            </div>
          </div>
          <CopyButton
            textToCopy={`USP:\n- Cốt lõi: ${data.usp.primaryUsp}\n- Lợi thế bổ trợ:\n${data.usp.secondaryUsps.map((u) => `* ${u}`).join('\n')}\n- So với đối thủ: ${data.usp.comparisonAdvantage}`}
          />
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block">
              USP CỐT LÕI (PRIMARY USP)
            </span>
            <p className="text-base font-bold text-slate-900 mt-1">{data.usp.primaryUsp}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Các lợi thế bổ trợ
              </span>
              <ul className="space-y-1.5 text-slate-800">
                {data.usp.secondaryUsps.map((sec, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{sec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                Lợi thế so sánh (Comparison Advantage)
              </span>
              <p className="text-slate-700 leading-relaxed mt-2">{data.usp.comparisonAdvantage}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 6. SALES ANGLES */}
      {/* ========================================================== */}
      <section id="section-angles" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">6. CÁC GÓC TIẾP CẬN BÁN HÀNG (SALES ANGLES)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{data.salesAngles.length} hướng nội dung A/B Testing</p>
            </div>
          </div>
          <CopyButton
            textToCopy={data.salesAngles
              .map(
                (a, i) =>
                  `[Góc ${i + 1}: ${a.title}]\n- Insight: ${a.coreInsight}\n- Hướng tiếp cận: ${a.angleDescription}\n- Cảm xúc: ${a.emotionalTrigger}`
              )
              .join('\n\n')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.salesAngles.map((angle, idx) => (
            <div key={angle.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-500 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                    Concept #{idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {angle.emotionalTrigger}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5">{angle.title}</h4>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                  <strong>Insight:</strong> {angle.coreInsight}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/80">
                  {angle.angleDescription}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 7. HOOKS (Bộ Hook 3s đầu) */}
      {/* ========================================================== */}
      <section id="section-hooks" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">7. HOOK 3 GIÂY ĐẦU (VISUAL • AUDIO • TEXT)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Chiến thuật chặn lướt và giữ chân người xem</p>
            </div>
          </div>
          <CopyButton
            textToCopy={data.hooks
              .map(
                (h, i) =>
                  `[HOOK ${i + 1} - ${h.angleTitle}]\n- Visual Hook: ${h.visualHook}\n- Audio Hook: ${h.audioHook}\n- Text On Screen: ${h.textOnScreen}\n- Chiến thuật: ${h.retentionTactic}`
              )
              .join('\n\n')}
          />
        </div>

        <div className="space-y-3">
          {data.hooks.map((hook, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  Concept: {hook.angleTitle}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  {hook.retentionTactic}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Visual */}
                <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    👁️ VISUAL HOOK (Mắt thấy):
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">{hook.visualHook}</p>
                </div>

                {/* Audio */}
                <div className="bg-white p-3 rounded-lg border-l-4 border-indigo-500 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    🔊 AUDIO HOOK (Tai nghe):
                  </span>
                  <p className="text-slate-900 font-semibold italic leading-relaxed">"{hook.audioHook}"</p>
                </div>

                {/* Text On Screen */}
                <div className="bg-white p-3 rounded-lg border-l-4 border-amber-500 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    📝 TEXT ON SCREEN (Chữ to):
                  </span>
                  <p className="text-amber-900 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-100">
                    {hook.textOnScreen}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 8. VOICE SCRIPTS */}
      {/* ========================================================== */}
      <section id="section-scripts" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">8. KỊCH BẢN THOẠI (VOICE SCRIPTS)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Lời thoại chuẩn 15-30s kèm nhịp điệu và khung hình</p>
            </div>
          </div>
          <CopyButton
            textToCopy={data.voiceScripts
              .map(
                (s, i) =>
                  `[KỊCH BẢN ${i + 1} - ${s.angleTitle}]\n- Thời lượng: ${s.estimatedDuration} | Nhịp điệu: ${s.pacing}\n- Lời thoại:\n"${s.scriptBody}"\n- Gợi ý khung hình:\n${s.visualCues.map((c) => `> ${c}`).join('\n')}`
              )
              .join('\n\n')}
          />
        </div>

        <div className="space-y-4">
          {data.voiceScripts.map((script, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white">
                    Kịch bản #{idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{script.angleTitle}</h4>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-700 font-medium text-[11px]">
                    ⏱️ {script.estimatedDuration}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-700 font-medium text-[11px]">
                    🎵 {script.pacing}
                  </span>
                  <CopyButton
                    label="Sao chép kịch bản"
                    size="sm"
                    textToCopy={`[KỊCH BẢN ${idx + 1}: ${script.angleTitle}]\n${script.scriptBody}`}
                  />
                </div>
              </div>

              {/* Script Body Text Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-900 leading-relaxed font-sans shadow-2xs whitespace-pre-line border-l-4 border-blue-500">
                "{script.scriptBody}"
              </div>

              {/* Visual Cues */}
              <div className="bg-blue-50/40 p-3 rounded-lg border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest block mb-1.5">
                  🎬 Gợi ý cảnh quay ăn khớp (Visual Cues):
                </span>
                <ul className="space-y-1 text-xs text-slate-700">
                  {script.visualCues.map((cue, cIdx) => (
                    <li key={cIdx} className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold">›</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 9. CTA (Call To Action) */}
      {/* ========================================================== */}
      <section id="section-cta" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">9. KÊU GỌI HÀNH ĐỘNG (CTA)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Mẫu câu chốt đơn, dẫn link bio và sticker kích cầu</p>
            </div>
          </div>
          <CopyButton
            textToCopy={data.cta
              .map(
                (c, i) =>
                  `[CTA ${i + 1}: ${c.type}]\n- Lời thoại: "${c.script}"\n- Banner/Sticker: ${c.onScreenBanner}\n- Cấp bách: ${c.urgencyTactic}`
              )
              .join('\n\n')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.cta.map((c, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 inline-block mb-1.5">
                  {c.type}
                </span>
                <p className="text-sm font-bold text-slate-900 leading-snug">"{c.script}"</p>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                <div className="text-blue-700 font-semibold">
                  📌 Chữ nổi/Sticker: <span className="font-normal text-slate-800">{c.onScreenBanner}</span>
                </div>
                <div className="text-slate-500">
                  ⚡ Kích thích: {c.urgencyTactic}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================== */}
      {/* 10, 11, 12, 13: PROMPTS SECTION (S001, S002, S003) */}
      {/* ========================================================== */}
      <section id="section-prompts" className="space-y-6">
        {/* COMPOSITING & FIDELITY WARNING BOX */}
        <div className="bg-amber-50/60 rounded-2xl border border-amber-300 p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                  QUY TẮC BẮT BUỘC: PRODUCT FIDELITY &gt; BEAUTY
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  data.fidelityWarning.riskLevel === 'HIGH'
                    ? 'bg-red-600 text-white'
                    : data.fidelityWarning.riskLevel === 'MEDIUM'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  Rủi ro AI sai lệch: {data.fidelityWarning.riskLevel}
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {data.fidelityWarning.warningMessage}
              </p>
              <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-amber-200 text-slate-800">
                <strong className="text-amber-950 font-bold">Kỹ thuật sản xuất khuyến nghị:</strong>{' '}
                {data.fidelityWarning.recommendedTechnique}
              </div>
            </div>
          </div>
        </div>

        {/* 10. S001 PROMPT (HERO SHOT) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">10. S001 PROMPT (HERO SHOT)</h3>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Góc chụp chính diện studio, rõ logo & nhãn mác</p>
              </div>
            </div>
            <CopyButton
              label="Sao chép Prompt EN"
              textToCopy={data.s001HeroPrompt.promptEn}
            />
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono leading-relaxed border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-sans mb-1 font-bold tracking-wider">Prompt tiếng Anh (Midjourney / Flux / SDXL):</div>
              {data.s001HeroPrompt.promptEn}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Mô tả tiếng Việt:</strong>
                <p className="text-slate-600">{data.s001HeroPrompt.promptVi}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Ánh sáng, Lens & Tỷ lệ:</strong>
                <p className="text-slate-600">{data.s001HeroPrompt.lightingAndLens} • {data.s001HeroPrompt.aspectRatio}</p>
                <p className="text-slate-500 mt-1 italic">Negative: {data.s001HeroPrompt.negativePrompt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 11. S002 PROMPT (DETAIL SHOT) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">11. S002 PROMPT (DETAIL SHOT)</h3>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Cận cảnh macro chất liệu & chi tiết gia công</p>
              </div>
            </div>
            <CopyButton
              label="Sao chép Prompt EN"
              textToCopy={data.s002DetailPrompt.promptEn}
            />
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono leading-relaxed border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-sans mb-1 font-bold tracking-wider">Prompt tiếng Anh (Macro / Close-up):</div>
              {data.s002DetailPrompt.promptEn}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Mô tả tiếng Việt:</strong>
                <p className="text-slate-600">{data.s002DetailPrompt.promptVi}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Điểm nhấn & Texture:</strong>
                <p className="text-slate-600">{data.s002DetailPrompt.focalPoint} • {data.s002DetailPrompt.textureDetails}</p>
                <p className="text-slate-500 mt-1 italic">Negative: {data.s002DetailPrompt.negativePrompt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 12. S003 IMAGE PROMPT (LIFESTYLE PRODUCT SHOT) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">12. S003 IMAGE PROMPT (LIFESTYLE PRODUCT SHOT)</h3>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Bối cảnh đời sống thực tế (Ưu tiên giữ nguyên sản phẩm gốc)</p>
              </div>
            </div>
            <CopyButton
              label="Sao chép Prompt EN"
              textToCopy={data.s003LifestyleImagePrompt.promptEn}
            />
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono leading-relaxed border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-sans mb-1 font-bold tracking-wider">Prompt tiếng Anh (Lifestyle Context):</div>
              {data.s003LifestyleImagePrompt.promptEn}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Môi trường & Bối cảnh:</strong>
                <p className="text-slate-600">{data.s003LifestyleImagePrompt.environment}</p>
                <p className="text-slate-500 mt-1 italic">{data.s003LifestyleImagePrompt.promptVi}</p>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <strong className="text-blue-900 block mb-1">Quy tắc trung thực sản phẩm (Fidelity Rule):</strong>
                <p className="text-blue-950 font-medium">{data.s003LifestyleImagePrompt.fidelityRule}</p>
                <p className="text-slate-500 mt-1 italic">Negative: {data.s003LifestyleImagePrompt.negativePrompt}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 13. S003 VIDEO PROMPT (LIFESTYLE VIDEO PROMPT) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">13. S003 VIDEO PROMPT (LIFESTYLE VIDEO PROMPT)</h3>
                <p className="text-sm font-bold text-slate-900 mt-0.5">Prompt cho Runway Gen-3, Kling AI, Luma Dream Machine, Veo</p>
              </div>
            </div>
            <CopyButton
              label="Sao chép Prompt Video"
              textToCopy={data.s003LifestyleVideoPrompt.promptEn}
            />
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono leading-relaxed border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-sans mb-1 font-bold tracking-wider">Video Motion Prompt (Camera & Motion):</div>
              {data.s003LifestyleVideoPrompt.promptEn}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Chuyển động Camera:</strong>
                <p className="text-slate-600">{data.s003LifestyleVideoPrompt.cameraMovement}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Hành động của chủ thể:</strong>
                <p className="text-slate-600">{data.s003LifestyleVideoPrompt.actionDescription}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-700 block mb-1">Công cụ & Lưu ý:</strong>
                <p className="text-slate-600">{data.s003LifestyleVideoPrompt.toolRecommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================== */}
      {/* 14. QC CHECKLIST */}
      {/* ========================================================== */}
      <section id="section-qc" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">14. BẢNG KIỂM TRA CHẤT LƯỢNG (QC CHECKLIST)</h3>
              <p className="text-sm font-bold text-slate-900 mt-0.5">Tích chọn trực tiếp để nghiệm thu video affiliate trước khi xuất bản</p>
            </div>
          </div>
          <CopyButton
            textToCopy={`QC CHECKLIST:\n${data.qcChecklist.map((q, i) => `[ ] ${q.checkItem} (Lý do: ${q.whyItMatters})`).join('\n')}`}
          />
        </div>

        <div className="space-y-2">
          {data.qcChecklist.map((item, idx) => {
            const isChecked = !!qcChecked[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleQc(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  isChecked
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // handled by parent onClick
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0"
                />
                <div className="flex-1 text-xs">
                  <div className={`font-bold ${isChecked ? 'line-through opacity-80 text-emerald-900' : 'text-slate-900'}`}>
                    {item.checkItem}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    <strong>Tầm quan trọng:</strong> {item.whyItMatters}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer Bottom Actions */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <h4 className="text-base font-bold text-slate-100">Hoàn tất kiểm duyệt phiếu sản xuất!</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Sẵn sàng chuyển giao kịch bản cho Creator, KOLs hoặc Team Dựng Video
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyAll}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Copy className="w-4 h-4" />
            <span>Sao chép toàn bộ phiếu</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
