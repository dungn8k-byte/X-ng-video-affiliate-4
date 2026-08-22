import React, { useState } from 'react';
import {
  VideoVariation,
  VideoVariationCount,
  ProductionSheetData,
  AssetReadinessState,
  ClaimStatus,
  ContentQcEvaluation,
} from '../types';
import {
  generateVideoVariationsWithGemini,
  regenerateSingleVariationWithGemini,
  safeRewriteVariationWithGemini,
} from '../services/geminiService';
import { CopyButton } from './CopyButton';
import {
  Sparkles,
  Layers,
  Film,
  CheckCircle2,
  Clock,
  Mic,
  RotateCcw,
  Volume2,
  Music,
  Scissors,
  Download,
  AlertTriangle,
  Tv,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Wand2,
  Eye,
  X,
  FileCheck2,
  Info,
  SlidersHorizontal,
} from 'lucide-react';

interface VideoVariationsSectionProps {
  sheetData: ProductionSheetData;
  assetState?: AssetReadinessState;
  initialVariations?: VideoVariation[];
  onVariationsUpdate?: (variations: VideoVariation[]) => void;
}

export const VideoVariationsSection: React.FC<VideoVariationsSectionProps> = ({
  sheetData,
  assetState,
  initialVariations,
  onVariationsUpdate,
}) => {
  const [variationCount, setVariationCount] = useState<VideoVariationCount>(
    (initialVariations && initialVariations.length > 0 ? (initialVariations.length as VideoVariationCount) : 5)
  );
  const [variations, setVariations] = useState<VideoVariation[]>(initialVariations || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [rewritingId, setRewritingId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'approved' | 'pending' | 'failed'>('all');
  const [expandedEditingMap, setExpandedEditingMap] = useState<Record<string, boolean>>({});
  const [selectedClaimsVariation, setSelectedClaimsVariation] = useState<VideoVariation | null>(null);

  // Sync variations when initialVariations prop changes (e.g. project restoration)
  React.useEffect(() => {
    if (initialVariations && initialVariations.length > 0) {
      setVariations(initialVariations);
      setVariationCount(initialVariations.length as VideoVariationCount);
    }
  }, [initialVariations]);

  // Sync variations with parent whenever it updates
  React.useEffect(() => {
    if (onVariationsUpdate) {
      onVariationsUpdate(variations);
    }
  }, [variations, onVariationsUpdate]);

  // Asset readiness checks
  const s001Ok = assetState ? assetState.s001Ready || assetState.s001Approved : true;
  const s002Ok = assetState ? assetState.s002Ready || assetState.s002Approved : true;
  const s003Ok = assetState ? assetState.s003Ready || assetState.s003Approved : true;

  const handleGenerateVariations = async () => {
    setIsLoading(true);
    setLoadingMessage(`Đang sáng tạo & kiểm định Content QC cho ${variationCount} kịch bản video affiliate...`);
    try {
      const results = await generateVideoVariationsWithGemini({
        sheetData,
        count: variationCount,
        readyAssets: {
          s001: s001Ok,
          s002: s002Ok,
          s003: s003Ok,
        },
      });
      setVariations(results);
    } catch (err) {
      console.error('Error in handleGenerateVariations:', err);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleToggleApprove = (id: string) => {
    setVariations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isApproved: !v.isApproved } : v))
    );
  };

  const handleApproveAll = () => {
    setVariations((prev) => prev.map((v) => ({ ...v, isApproved: true })));
  };

  const handleRegenerateSingle = async (variation: VideoVariation) => {
    setRegeneratingId(variation.id);
    try {
      const updated = await regenerateSingleVariationWithGemini(variation, sheetData);
      setVariations((prev) => prev.map((v) => (v.id === variation.id ? updated : v)));
      if (selectedClaimsVariation?.id === variation.id) {
        setSelectedClaimsVariation(updated);
      }
    } catch (err) {
      console.error('Error regenerating single variation:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleSafeRewrite = async (variation: VideoVariation) => {
    setRewritingId(variation.id);
    try {
      const safeRewritten = await safeRewriteVariationWithGemini(variation, sheetData);
      setVariations((prev) => prev.map((v) => (v.id === variation.id ? safeRewritten : v)));
      if (selectedClaimsVariation?.id === variation.id) {
        setSelectedClaimsVariation(safeRewritten);
      }
    } catch (err) {
      console.error('Error in handleSafeRewrite:', err);
    } finally {
      setRewritingId(null);
    }
  };

  const toggleExpandEditing = (id: string) => {
    setExpandedEditingMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredVariations = variations.filter((v) => {
    if (selectedFilter === 'approved') return v.isApproved;
    if (selectedFilter === 'pending') return !v.isApproved;
    if (selectedFilter === 'failed') return v.contentQc?.status === 'FAIL';
    return true;
  });

  const approvedCount = variations.filter((v) => v.isApproved).length;
  const failedCount = variations.filter((v) => v.contentQc?.status === 'FAIL').length;

  const handleExportText = () => {
    if (variations.length === 0) return;
    const textContent = variations
      .map(
        (v) => `====================================================
VIDEO ID: ${v.id}
SALES ANGLE: ${v.salesAngle}
TRẠNG THÁI: ${v.isApproved ? 'SCRIPT APPROVED [ĐÃ DUYỆT]' : 'PENDING APPROVAL'}
CONTENT QC: ${v.contentQc ? `${v.contentQc.status} (${v.contentQc.score}/100)` : 'CHƯA KIỂM ĐỊNH'}
${v.requiresPriceCheck ? 'LƯU Ý: [PRICE CHECK REQUIRED - CẦN XÁC NHẬN GIÁ TRƯỚC KHI ĐĂNG]' : ''}
THỜI LƯỢNG ƯỚC TÍNH: ${v.estimatedDuration}

1. HOOK (0-3s):
${v.hook}

2. VOICE SCRIPT (VBEE TTS READY):
${v.voiceScript}

3. TIMELINE (S001 / S002 / S003):
${v.timeline.map((t) => `- ${t.timeRange}: [${t.shotId}] ${t.shotTitle} ➔ ${t.visualAction}`).join('\n')}

4. ON-SCREEN TEXT:
- Text Hook: ${v.onScreenText.hookText}
- Text Benefit/Feature: ${v.onScreenText.benefitText}
- Text CTA: ${v.onScreenText.ctaText}

5. CTA:
${v.cta}

6. HƯỚNG DẪN DỰNG (EDITING INSTRUCTIONS):
- Cảnh: ${v.editingInstructions.scenes}
- Cắt & Chuyển cảnh: ${v.editingInstructions.cutsAndTransitions}
- Vị trí Text: ${v.editingInstructions.textPlacement}
- Caption: ${v.editingInstructions.captions}
- Mood Nhạc: ${v.editingInstructions.musicMood}
- Mix Audio: ${v.editingInstructions.audioMix}
`
      )
      .join('\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Affiliate_Scripts_${sheetData.productProfile.productName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getShotBadgeClass = (shotId: 'S001' | 'S002' | 'S003') => {
    switch (shotId) {
      case 'S001':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'S002':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'S003':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getClaimStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>VERIFIED</span>
          </span>
        );
      case 'INFERRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Info className="w-3 h-3 text-blue-600" />
            <span>INFERRED</span>
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>UNVERIFIED</span>
          </span>
        );
      case 'PROHIBITED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldX className="w-3 h-3 text-rose-600" />
            <span>PROHIBITED</span>
          </span>
        );
      default:
        return null;
    }
  };

  const renderContentQcBadge = (qc?: ContentQcEvaluation) => {
    if (!qc) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>Chưa QC</span>
        </span>
      );
    }

    if (qc.status === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>CONTENT PASS ({qc.score}/100)</span>
        </span>
      );
    }

    if (qc.status === 'REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>CONTENT REVIEW ({qc.score}/100)</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold shadow-xs animate-pulse">
        <ShieldX className="w-3.5 h-3.5 text-rose-600" />
        <span>CONTENT FAIL ({qc.score}/100)</span>
      </span>
    );
  };

  return (
    <div
      id="video-variations-section"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
                Script Factory 3.0
              </span>
              <span className="text-xs text-slate-400 font-medium">Nhà Máy Kịch Bản Video &amp; Content QC</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>VIDEO VARIATIONS – NHÀ MÁY KỊCH BẢN</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Tự động tạo nhiều phương án kịch bản video affiliate và tự động kiểm định <strong>CONTENT QC</strong> đối chiếu trực tiếp với Product Data: loại bỏ trải nghiệm cá nhân giả mạo, claim kỹ thuật không căn cứ và đảm bảo an toàn về giá.
            </p>
          </div>

          {/* Asset Status Overview Pill */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-xs space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Asset Sẵn Sàng Để Dựng:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                  s001Ok
                    ? 'bg-blue-950/60 text-blue-300 border-blue-700/60'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <Film className="w-3 h-3 text-blue-400" />
                <span>S001 Hero</span>
                {s001Ok && <Check className="w-3 h-3 text-emerald-400" />}
              </div>

              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                  s002Ok
                    ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <Film className="w-3 h-3 text-indigo-400" />
                <span>S002 Detail</span>
                {s002Ok && <Check className="w-3 h-3 text-emerald-400" />}
              </div>

              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                  s003Ok
                    ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <Film className="w-3 h-3 text-amber-400" />
                <span>S003 Lifestyle</span>
                {s003Ok && <Check className="w-3 h-3 text-emerald-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar: Select Count & Generate Button */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Số lượng kịch bản:
            </span>
            <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              {([3, 5, 10] as VideoVariationCount[]).map((num) => (
                <button
                  key={num}
                  type="button"
                  id={`variation-count-${num}`}
                  onClick={() => setVariationCount(num)}
                  disabled={isLoading}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    variationCount === num
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {num} Video {num === 5 && '(Mặc định)'}
                </button>
              ))}
            </div>
          </div>

          {/* Action Generate Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="generate-video-variations-btn"
              onClick={handleGenerateVariations}
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-white" />
                  <span>Đang Tạo &amp; Kiểm Định QC...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-indigo-200" />
                  <span>{variations.length > 0 ? 'TẠO LẠI BỘ VIDEO' : 'TẠO BỘ VIDEO'}</span>
                </>
              )}
            </button>

            {variations.length > 0 && (
              <button
                type="button"
                id="export-scripts-btn"
                onClick={handleExportText}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                title="Tải toàn bộ kịch bản dạng Text"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất File TXT</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-bounce shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-base font-bold text-slate-900">
                Gemini Đang Tạo {variationCount} Kịch Bản &amp; Chạy Content QC
              </h4>
              <p className="text-xs text-indigo-600 font-medium animate-pulse">
                {loadingMessage}
              </p>
              <p className="text-[11px] text-slate-500">
                Kiểm định Claim Factual Accuracy (40), No Fake Experience (25), Claim Safety (20), V05 Natural Product Introduction...
              </p>
            </div>
          </div>
        ) : variations.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-4 max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
              <Film className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                Chưa có kịch bản Video Variations nào được tạo
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Nhấn nút <strong className="text-indigo-600">[TẠO BỘ VIDEO]</strong> phía trên để tự động sinh ra {variationCount} phương án kịch bản với đầy đủ Hook, Voice Script, Timeline S001-S003 và hệ thống <strong>CONTENT QC</strong> xác minh từng claim.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-600">
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-200 font-medium">
                V01 – Price/Value
              </span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-200 font-medium">
                V02 – Curiosity
              </span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-200 font-medium">
                V03 – Product Detail
              </span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-200 font-medium">
                V04 – Style/Use Case
              </span>
              <span className="px-2.5 py-1 bg-white rounded-md border border-slate-200 font-medium">
                V05 – Natural Product Introduction
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter and Approval Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">Lọc kịch bản:</span>
                <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('all')}
                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      selectedFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({variations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('approved')}
                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      selectedFilter === 'approved'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    Đã duyệt ({approvedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFilter('pending')}
                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      selectedFilter === 'pending'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-amber-700'
                    }`}
                  >
                    Chờ duyệt ({variations.length - approvedCount})
                  </button>
                  {failedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedFilter('failed')}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        selectedFilter === 'failed'
                          ? 'bg-rose-600 text-white shadow-xs font-bold'
                          : 'text-rose-600 hover:text-rose-800'
                      }`}
                    >
                      QC Cảnh báo ({failedCount})
                    </button>
                  )}
                </div>
              </div>

              {approvedCount < variations.length && (
                <button
                  type="button"
                  id="approve-all-scripts-btn"
                  onClick={handleApproveAll}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DUYỆT TẤT CẢ ({variations.length} KỊCH BẢN)</span>
                </button>
              )}
            </div>

            {/* List of Video Variation Cards */}
            <div className="grid grid-cols-1 gap-6">
              {filteredVariations.map((variation) => {
                const isRegenerating = regeneratingId === variation.id;
                const isRewriting = rewritingId === variation.id;
                const isEditingExpanded = !!expandedEditingMap[variation.id];
                const qc = variation.contentQc;
                const isQcFail = qc?.status === 'FAIL';

                return (
                  <div
                    key={variation.id}
                    id={`card-${variation.id}`}
                    className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs overflow-hidden ${
                      variation.isApproved
                        ? 'border-emerald-300 ring-1 ring-emerald-400/30'
                        : isQcFail
                        ? 'border-rose-300 ring-1 ring-rose-300/40'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Top Header */}
                    <div
                      className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
                        variation.isApproved
                          ? 'bg-emerald-50/60 border-emerald-100'
                          : isQcFail
                          ? 'bg-rose-50/60 border-rose-100'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono font-bold text-sm px-2.5 py-1 bg-slate-900 text-white rounded-lg shadow-xs">
                          {variation.id}
                        </span>

                        <span className="font-bold text-xs px-2.5 py-1 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg uppercase tracking-wide">
                          {variation.salesAngle}
                        </span>

                        <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>~{variation.estimatedDuration} (Vbee Ready)</span>
                        </div>

                        {variation.requiresPriceCheck && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>PRICE CHECK REQUIRED</span>
                          </span>
                        )}
                      </div>

                      {/* Right QC Badge & Approve Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        {renderContentQcBadge(qc)}

                        <button
                          type="button"
                          id={`view-claims-btn-${variation.id}`}
                          onClick={() => setSelectedClaimsVariation(variation)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                          title="Xem phân loại chi tiết các claims"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>XEM CLAIM</span>
                        </button>

                        {variation.isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>SCRIPT APPROVED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-semibold">
                            <span>Chờ Duyệt</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* QC Warning Alert Banner if FAIL or PROHIBITED */}
                    {isQcFail && (
                      <div className="px-5 py-3 bg-rose-50 border-b border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <ShieldX className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-900 block">
                              CẢNH BÁO CONTENT QC: Phát hiện claim chưa xác minh hoặc bị cấm!
                            </span>
                            <p className="text-rose-700 text-[11px] leading-relaxed">
                              {qc?.feedback ||
                                'Kịch bản chứa câu khẳng định phóng đại hoặc trải nghiệm cá nhân không có căn cứ.'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          id={`safe-rewrite-banner-btn-${variation.id}`}
                          onClick={() => handleSafeRewrite(variation)}
                          disabled={isRewriting}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
                        >
                          <Wand2 className={`w-3.5 h-3.5 ${isRewriting ? 'animate-spin' : ''}`} />
                          <span>{isRewriting ? 'Đang viết lại...' : 'VIẾT LẠI AN TOÀN'}</span>
                        </button>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 space-y-5">
                      {/* 1. Hook Box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>1. Hook (1–3 Giây Đầu)</span>
                          </span>
                          <CopyButton
                            textToCopy={variation.hook}
                            label="Copy Hook"
                            variant="ghost"
                            size="sm"
                          />
                        </div>
                        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-slate-900 font-semibold text-sm leading-relaxed">
                          "{variation.hook}"
                        </div>
                      </div>

                      {/* 2. Voice Script (15-25s) with Vbee Copy Action */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5 text-blue-600" />
                              <span>2. Voice Script Tiếng Việt (Tối ưu cho Vbee AI)</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (Đã định dạng ngắt nghỉ chuẩn đọc)
                            </span>
                          </div>

                          <CopyButton
                            textToCopy={variation.voiceScript}
                            label="COPY FOR VBEE"
                            copiedLabel="ĐÃ COPY CHO VBEE!"
                            variant="primary"
                            size="sm"
                          />
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                          {variation.voiceScript}
                        </div>
                      </div>

                      {/* 3. Timeline (S001, S002, S003 Sequence) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5 text-indigo-600" />
                            <span>3. Timeline Phân Bổ Shot (S001 / S002 / S003)</span>
                          </span>
                        </div>

                        {/* Visual Step Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {variation.timeline.map((segment, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px] font-bold text-slate-600">
                                  {segment.timeRange}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getShotBadgeClass(
                                    segment.shotId
                                  )}`}
                                >
                                  {segment.shotId}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 font-medium line-clamp-2">
                                {segment.visualAction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. On-Screen Text & 5. CTA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* On-Screen Text */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Tv className="w-3.5 h-3.5 text-blue-600" />
                            <span>4. On-Screen Text (Chữ Trên Màn Hình)</span>
                          </span>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-slate-500 shrink-0">Text Hook:</span>
                              <span className="text-slate-900 font-semibold">
                                {variation.onScreenText.hookText}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-slate-500 shrink-0">Text Benefit:</span>
                              <span className="text-slate-700">
                                {variation.onScreenText.benefitText}
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-slate-500 shrink-0">Text CTA:</span>
                              <span className="text-emerald-700 font-semibold">
                                {variation.onScreenText.ctaText}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CTA Box */}
                        <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-emerald-600" />
                              <span>5. Call To Action (Tự Nhiên)</span>
                            </span>
                            <CopyButton
                              textToCopy={variation.cta}
                              label="Copy CTA"
                              variant="ghost"
                              size="sm"
                            />
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            "{variation.cta}"
                          </p>
                        </div>
                      </div>

                      {/* 6. Editing Instructions (Expandable) */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
                        <button
                          type="button"
                          onClick={() => toggleExpandEditing(variation.id)}
                          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-indigo-600" />
                            <span>6. HƯỚNG DẪN DỰNG &amp; ÂM THANH (EDITING INSTRUCTIONS)</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 font-normal">
                            <span>{isEditingExpanded ? 'Thu gọn' : 'Xem chi tiết'}</span>
                            {isEditingExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {isEditingExpanded && (
                          <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-600 block">Cảnh xuất hiện:</span>
                              <p className="text-slate-800">{variation.editingInstructions.scenes}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-slate-600 block">Cắt &amp; Chuyển cảnh:</span>
                              <p className="text-slate-800">{variation.editingInstructions.cutsAndTransitions}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-slate-600 block">Vị trí Text &amp; Khung hình:</span>
                              <p className="text-slate-800">{variation.editingInstructions.textPlacement}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-slate-600 block">Phong cách Caption:</span>
                              <p className="text-slate-800">{variation.editingInstructions.captions}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-slate-600 flex items-center gap-1">
                                <Music className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Gợi ý Nhạc Nền Mood:</span>
                              </span>
                              <p className="text-indigo-900 font-medium">{variation.editingInstructions.musicMood}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-slate-600 flex items-center gap-1">
                                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Mix Âm Lượng:</span>
                              </span>
                              <p className="text-slate-800 font-medium">{variation.editingInstructions.audioMix}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CopyButton
                            textToCopy={`VIDEO ID: ${variation.id}
SALES ANGLE: ${variation.salesAngle}
CONTENT QC: ${variation.contentQc?.status || 'PASS'} (${variation.contentQc?.score || 95}/100)
HOOK: ${variation.hook}
VOICE SCRIPT:
${variation.voiceScript}
TIMELINE:
${variation.timeline.map((t) => `${t.timeRange} [${t.shotId}] ${t.visualAction}`).join('\n')}
ON-SCREEN TEXT:
- Hook: ${variation.onScreenText.hookText}
- Benefit: ${variation.onScreenText.benefitText}
- CTA: ${variation.onScreenText.ctaText}
CTA: ${variation.cta}`}
                            label="Sao chép toàn bộ kịch bản"
                            variant="outline"
                            size="sm"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Safe Rewrite Button */}
                          <button
                            type="button"
                            id={`safe-rewrite-btn-${variation.id}`}
                            onClick={() => handleSafeRewrite(variation)}
                            disabled={isRewriting}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            title="Tự động biên tập lại kịch bản để đạt chuẩn an toàn 100%"
                          >
                            <Wand2
                              className={`w-3.5 h-3.5 text-indigo-600 ${isRewriting ? 'animate-spin' : ''}`}
                            />
                            <span>{isRewriting ? 'Đang viết lại...' : 'VIẾT LẠI AN TOÀN'}</span>
                          </button>

                          <button
                            type="button"
                            id={`regen-btn-${variation.id}`}
                            onClick={() => handleRegenerateSingle(variation)}
                            disabled={isRegenerating}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <RotateCcw
                              className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-indigo-600' : ''}`}
                            />
                            <span>{isRegenerating ? 'Đang tạo lại...' : 'TẠO LẠI'}</span>
                          </button>

                          <button
                            type="button"
                            id={`approve-btn-${variation.id}`}
                            onClick={() => handleToggleApprove(variation.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                              variation.isApproved
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{variation.isApproved ? 'ĐÃ DUYỆT (BẤM ĐỂ HỦY)' : 'DUYỆT KỊCH BẢN'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Claims Modal / Inspector */}
      {selectedClaimsVariation && (
        <div
          id="claims-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedClaimsVariation(null)}
        >
          <div
            id="claims-modal-dialog"
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {selectedClaimsVariation.id}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    {selectedClaimsVariation.salesAngle}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-400" />
                  <span>BẢNG KIỂM ĐỊNH CONTENT QC &amp; CLAIMS</span>
                </h3>
              </div>

              <button
                type="button"
                id="close-claims-modal-btn"
                onClick={() => setSelectedClaimsVariation(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Score Breakdown Header */}
              {selectedClaimsVariation.contentQc && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block">Trạng thái tổng thể:</span>
                      <div className="mt-1">{renderContentQcBadge(selectedClaimsVariation.contentQc)}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-semibold block">Điểm kiểm định:</span>
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {selectedClaimsVariation.contentQc.score}
                        <span className="text-sm font-normal text-slate-400">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* 5 Scoring Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Factual Accuracy</span>
                      <span className="font-bold text-slate-800">
                        {selectedClaimsVariation.contentQc.breakdown.factualAccuracy}/40
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">No Fake Exp</span>
                      <span
                        className={`font-bold ${
                          selectedClaimsVariation.contentQc.breakdown.noFakeExperience === 25
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {selectedClaimsVariation.contentQc.breakdown.noFakeExperience}/25
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Claim Safety</span>
                      <span className="font-bold text-slate-800">
                        {selectedClaimsVariation.contentQc.breakdown.claimSafety}/20
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">Natural Lang</span>
                      <span className="font-bold text-slate-800">
                        {selectedClaimsVariation.contentQc.breakdown.naturalLanguage}/10
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-500 block">CTA Accuracy</span>
                      <span className="font-bold text-slate-800">
                        {selectedClaimsVariation.contentQc.breakdown.ctaAccuracy}/5
                      </span>
                    </div>
                  </div>

                  {selectedClaimsVariation.contentQc.feedback && (
                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                      <strong>Nhận xét kiểm định:</strong> {selectedClaimsVariation.contentQc.feedback}
                    </div>
                  )}
                </div>
              )}

              {/* Claims Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Danh Sách Chi Tiết Các Claims &amp; Nguồn Căn Cứ:
                </span>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-3 w-5/12">Nội dung Claim</th>
                        <th className="p-3 w-3/12">Nguồn / Căn cứ</th>
                        <th className="p-3 w-2/12">Phân loại</th>
                        <th className="p-3 w-2/12">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedClaimsVariation.contentQc?.claims &&
                      selectedClaimsVariation.contentQc.claims.length > 0 ? (
                        selectedClaimsVariation.contentQc.claims.map((item, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              item.status === 'PROHIBITED'
                                ? 'bg-rose-50/40'
                                : item.status === 'UNVERIFIED'
                                ? 'bg-amber-50/30'
                                : ''
                            }`}
                          >
                            <td className="p-3 font-medium text-slate-800">{item.claim}</td>
                            <td className="p-3 text-slate-600">{item.source}</td>
                            <td className="p-3">{getClaimStatusBadge(item.status)}</td>
                            <td className="p-3 text-[11px] text-slate-500">{item.note || '—'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-500">
                            Không có claim bất thường. Kịch bản bám sát 100% dữ liệu sản phẩm.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Classification Glossary */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-[11px] space-y-1.5 text-slate-600">
                <span className="font-bold text-slate-700 block">Quy chuẩn phân loại Claim:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-emerald-700">VERIFIED:</span>
                    <span>Có căn cứ trực tiếp từ dữ liệu sản phẩm hoặc hình ảnh.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-blue-700">INFERRED:</span>
                    <span>Suy luận thẩm mỹ/phong cách hợp lý, không quy thành fact kỹ thuật.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-700">UNVERIFIED:</span>
                    <span>Khẳng định tính năng không có dữ liệu chứng minh (bền, siêu êm...).</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-rose-700">PROHIBITED:</span>
                    <span>Cấm tự bịa trải nghiệm cá nhân ("mình vừa mua / mình đi cả ngày").</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedClaimsVariation(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="modal-safe-rewrite-btn"
                  onClick={() => handleSafeRewrite(selectedClaimsVariation)}
                  disabled={rewritingId === selectedClaimsVariation.id}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Wand2
                    className={`w-3.5 h-3.5 ${
                      rewritingId === selectedClaimsVariation.id ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {rewritingId === selectedClaimsVariation.id
                      ? 'Đang viết lại an toàn...'
                      : 'VIẾT LẠI AN TOÀN'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

