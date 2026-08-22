import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProductForm } from './components/ProductForm';
import { ProductionSheetView } from './components/ProductionSheetView';
import { AssetProductionSection } from './components/AssetProductionSection';
import { VideoVariationsSection } from './components/VideoVariationsSection';
import { VoiceFactorySection } from './components/VoiceFactorySection';
import { ProjectHistoryModal } from './components/ProjectHistoryModal';
import {
  PlatformType,
  ConceptCount,
  ProductionSheetData,
  AssetReadinessState,
  VideoVariation,
  ProductionProject,
  RestoredAssetBank,
  AudioBankItem,
} from './types';
import { generateProductionSheetWithGemini } from './services/geminiService';
import {
  Sparkles,
  Film,
  AlertCircle,
  FileCheck2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  RotateCcw,
  FolderArchive,
  Volume2,
} from 'lucide-react';

export default function App() {
  const [productName, setProductName] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('TikTok');
  const [conceptCount, setConceptCount] = useState<ConceptCount>(5);
  const [imageData, setImageData] = useState<{
    mimeType: string;
    data: string;
    previewUrl: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [productionSheet, setProductionSheet] = useState<ProductionSheetData | null>(null);
  const [assetState, setAssetState] = useState<AssetReadinessState>({
    s001Ready: false,
    s001Status: 'IDLE',
    s001Approved: false,
    s002Ready: false,
    s002Status: 'IDLE',
    s002Approved: false,
    s003Ready: false,
    s003Status: 'IDLE',
    s003Approved: false,
  });
  const [variations, setVariations] = useState<VideoVariation[]>([]);
  const [restoredAssets, setRestoredAssets] = useState<RestoredAssetBank | null>(null);
  const [restoredAudioBank, setRestoredAudioBank] = useState<Record<string, AudioBankItem> | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [restorationBanner, setRestorationBanner] = useState<string | null>(null);

  const handleReset = () => {
    setProductName('');
    setCurrentPrice('');
    setDescription('');
    setTargetAudience('');
    setPlatform('TikTok');
    setConceptCount(5);
    setImageData(null);
    setProductionSheet(null);
    setRestoredAssets(null);
    setRestoredAudioBank(null);
    setCurrentProjectId(null);
    setRestorationBanner(null);
    setAssetState({
      s001Ready: false,
      s001Status: 'IDLE',
      s001Approved: false,
      s002Ready: false,
      s002Status: 'IDLE',
      s002Approved: false,
      s003Ready: false,
      s003Status: 'IDLE',
      s003Approved: false,
    });
    setVariations([]);
    setError(null);
  };

  // Restore existing project (e.g. Mary Jane P001) without generating new assets/scripts
  const handleRestoreProject = (project: ProductionProject) => {
    setIsLoading(false);
    setError(null);

    // 1. Populate form fields
    setProductName(project.name);
    setCurrentPrice(project.price);
    setDescription(project.description);
    setTargetAudience(project.targetAudience);
    setPlatform(project.platform);
    setConceptCount(project.conceptCount);

    if (project.imageData) {
      setImageData(project.imageData);
    }

    // 2. Restore full verified data
    setProductionSheet(project.productionSheet);
    setAssetState(project.assetState);
    setRestoredAssets(project.restoredAssets || null);
    setRestoredAudioBank(project.audioBank || null);
    setVariations(project.variations || []);
    setCurrentProjectId(project.id);
    setRestorationBanner(
      `Đã khôi phục thành công Project ${project.id} (${project.name}). Dữ liệu đã duyệt, bản Voice V01 (VOICE APPROVED) và 5 kịch bản được bảo toàn nguyên vẹn.`
    );

    // 3. Scroll directly to Step 5: Voice Factory
    setTimeout(() => {
      const voiceFactorySection =
        document.getElementById('voice-factory-container') ||
        document.getElementById('voice-factory-section');
      if (voiceFactorySection) {
        voiceFactorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 250);
  };

  const isOverloadedError = (errMessage: string, statusCode?: number) => {
    if (statusCode === 503 || statusCode === 429) return true;
    const lower = (errMessage || '').toLowerCase();
    return (
      lower.includes('503') ||
      lower.includes('429') ||
      lower.includes('unavailable') ||
      lower.includes('high demand') ||
      lower.includes('overloaded') ||
      lower.includes('resource_exhausted') ||
      lower.includes('rate_limit') ||
      lower.includes('rate_limited') ||
      lower.includes('gemini_unavailable') ||
      lower.includes('quá tải') ||
      lower.includes('bận')
    );
  };

  const isRetryableError = (err: any) => {
    const status = err?.status || err?.statusCode || (err?.response?.status);
    if (status && [429, 500, 502, 503, 504].includes(status)) {
      return true;
    }
    return isOverloadedError(err?.message || '', status);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setRestoredAssets(null);
    setRestoredAudioBank(null);
    setCurrentProjectId(null);
    setRestorationBanner(null);
    setLoadingStep('Đang phân tích hình ảnh và tính năng sản phẩm...');

    const RETRY_DELAYS = [2000, 5000, 10000]; // Lần 1: 2s, Lần 2: 5s, Lần 3: 10s
    let lastError: any = null;

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        if (attempt > 0) {
          setLoadingStep('Gemini đang bận, hệ thống đang tự động thử lại...');
        }

        const sheetData = await generateProductionSheetWithGemini({
          image: imageData ? { mimeType: imageData.mimeType, data: imageData.data } : null,
          productName,
          currentPrice,
          description,
          targetAudience,
          platform,
          conceptCount,
        });

        setProductionSheet(sheetData);
        setIsLoading(false);
        setLoadingStep('');
        setError(null);

        // Smooth scroll to top of production sheet
        setTimeout(() => {
          const sheetElement = document.getElementById('production-sheet-container');
          if (sheetElement) {
            sheetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        return;
      } catch (err: any) {
        lastError = err;
        const shouldRetry = isRetryableError(err);

        if (shouldRetry && attempt < RETRY_DELAYS.length) {
          setLoadingStep('Gemini đang bận, hệ thống đang tự động thử lại...');
          const waitMs = RETRY_DELAYS[attempt];
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        } else {
          break;
        }
      }
    }

    setIsLoading(false);
    setLoadingStep('');

    const isUnavailable = isOverloadedError(lastError?.message || '', lastError?.status);
    if (isUnavailable) {
      setError(
        'Gemini đang quá tải tạm thời. Dữ liệu sản phẩm của bạn đã được giữ nguyên. Vui lòng nhấn Thử lại sau.'
      );
    } else {
      setError(lastError?.message || 'Đã xảy ra lỗi khi tạo phiếu sản xuất. Vui lòng thử lại.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        onOpenHistory={() => setIsHistoryOpen(true)}
        hasData={!!productionSheet}
        isLoading={isLoading}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Restoration Notification Banner */}
        {restorationBanner && (
          <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl flex items-center justify-between gap-4 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-relaxed">{restorationBanner}</p>
                <p className="text-[11px] text-emerald-300">
                  Đã tự động chuyển đến Bước 5: Voice Factory. Toàn bộ kịch bản và asset đã được bảo toàn.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const voiceFactorySection =
                    document.getElementById('voice-factory-container') ||
                    document.getElementById('voice-factory-section');
                  if (voiceFactorySection) {
                    voiceFactorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Xem Voice Factory</span>
              </button>
              <button
                type="button"
                onClick={() => setRestorationBanner(null)}
                className="px-2 py-1 text-slate-400 hover:text-white text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Error Alert with Retry Action */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/70 border border-red-800/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-200 text-sm shadow-lg">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-100 font-medium leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                id="retry-error-btn"
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>THỬ LẠI</span>
              </button>
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-2.5 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Controls (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Cấu Hình Sản Phẩm</h2>
                    <p className="text-[11px] text-slate-400">Tải ảnh &amp; nhập thông số để Gemini phân tích</p>
                  </div>
                </div>

                {currentProjectId && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                    {currentProjectId}
                  </span>
                )}
              </div>

              <ProductForm
                productName={productName}
                setProductName={setProductName}
                currentPrice={currentPrice}
                setCurrentPrice={setCurrentPrice}
                description={description}
                setDescription={setDescription}
                targetAudience={targetAudience}
                setTargetAudience={setTargetAudience}
                platform={platform}
                setPlatform={setPlatform}
                conceptCount={conceptCount}
                setConceptCount={setConceptCount}
                imageData={imageData}
                setImageData={setImageData}
                onSubmit={handleGenerate}
                onRestoreProject={handleRestoreProject}
                onOpenHistory={() => setIsHistoryOpen(true)}
                isLoading={isLoading}
              />
            </div>

            {/* Quality Standard Card */}
            <div className="bg-slate-950/30 text-slate-300 p-4 rounded-xl border border-slate-800/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Tiêu Chuẩn Xưởng Sản Xuất 4.0</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong className="text-slate-300">Khôi phục phiên làm việc:</strong> Nhận diện Product ID / Project P001, khôi phục nguyên trạng kịch bản và asset.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong className="text-slate-300">Chống bịa đặt:</strong> Tách biệt rõ sự thật xác minh và điều cấm kỵ chém gió.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong className="text-slate-300">Product Fidelity &gt; Beauty:</strong> AI không tự ý biến dạng hay đổi logo sản phẩm.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">★</span>
                  <span><strong className="text-slate-300">Voice Factory 4.0:</strong> Biến kịch bản đã duyệt thành bản thu Voice-over chuyên nghiệp (Gemini TTS / Vbee).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Output / Production Sheet or Empty Placeholder (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[460px] space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="absolute -inset-2 rounded-2xl bg-blue-500/10 animate-ping -z-10" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-lg font-bold text-slate-900">
                    Xưởng AI Đang Xử Lý &amp; Lập Phiếu Sản Xuất
                  </h3>
                  <p className="text-sm text-blue-600 font-medium animate-pulse">
                    {loadingStep || 'Đang phân tích thông tin...'}
                  </p>
                  <p className="text-xs text-slate-500 pt-2">
                    Đang thiết lập {conceptCount} concept cho nền tảng {platform} theo tiêu chuẩn Product Fidelity...
                  </p>
                </div>
              </div>
            ) : productionSheet ? (
              <div className="space-y-8">
                {/* 1. Phiếu Sản Xuất */}
                <ProductionSheetView data={productionSheet} onPrint={handlePrint} />

                {/* 2. SẢN XUẤT ASSET: S001, S002, S003 */}
                <AssetProductionSection
                  sheetData={productionSheet}
                  originalImage={imageData}
                  restoredAssets={restoredAssets}
                  onAssetStateChange={setAssetState}
                />

                {/* 3. SCRIPT FACTORY: VIDEO VARIATIONS (V01 - V05) */}
                <VideoVariationsSection
                  sheetData={productionSheet}
                  assetState={assetState}
                  initialVariations={variations}
                  onVariationsUpdate={setVariations}
                />

                {/* 4. MODULE 4.0: VOICE FACTORY (GEMINI TTS / VBEE MANUAL) */}
                <VoiceFactorySection
                  key={currentProjectId || `new-${productionSheet.productProfile.productName || 'project'}`}
                  projectId={currentProjectId}
                  sheetData={productionSheet}
                  variations={variations}
                  restoredAudioBank={restoredAudioBank}
                  onToggleApproveScript={(id) => {
                    setVariations((prev) =>
                      prev.map((v) => (v.id === id ? { ...v, isApproved: !v.isApproved } : v))
                    );
                  }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm flex flex-col items-center justify-center min-h-[460px] space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block">
                    Sẵn sàng tiếp nhận
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Phiếu Sản Xuất, Asset Studio &amp; Voice Factory 4.0
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Tải ảnh sản phẩm hoặc nạp <strong className="text-blue-600">Dữ liệu mẫu / Project P001</strong> ở bảng bên trái rồi nhấn <strong className="text-slate-800">"Tiếp tục Project"</strong>.
                  </p>
                </div>

                <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left w-full max-w-lg text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 block">1. Product Profile</span>
                    <span className="text-slate-500 text-[11px]">Định vị &amp; Giá trị</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="font-bold text-emerald-800 block">2. Verified Facts</span>
                    <span className="text-emerald-600 text-[11px]">Chống bịa đặt</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 block">3. Script Factory</span>
                    <span className="text-slate-500 text-[11px]">Content QC V01-V05</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="font-bold text-blue-800 block">4. S001-S003 Assets</span>
                    <span className="text-blue-600 text-[11px]">Hero &amp; Lifestyle</span>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="font-bold text-indigo-800 block">5. Voice Factory</span>
                    <span className="text-indigo-600 text-[11px]">Gemini TTS &amp; Vbee</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-800 block">6. Audio Bank</span>
                    <span className="text-amber-600 text-[11px]">Duration &amp; QC Pass</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Project History Modal */}
      <ProjectHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectProject={handleRestoreProject}
        currentProjectId={currentProjectId}
      />

      {/* Footer */}
      <footer className="mt-auto h-9 bg-slate-950 border-t border-slate-800 flex items-center px-6 justify-between text-[10px] text-slate-500 uppercase tracking-widest">
        <span>© XƯỞNG VIDEO AFFILIATE 4.0 — GEMINI VOICE FACTORY</span>
        <div className="flex space-x-4">
          <span className="text-emerald-400">● Hệ thống sẵn sàng</span>
          <span>V4.0.0 PRODUCTION</span>
        </div>
      </footer>
    </div>
  );
}
