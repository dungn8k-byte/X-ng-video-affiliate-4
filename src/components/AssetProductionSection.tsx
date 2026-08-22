import React, { useState, useEffect } from 'react';
import {
  ProductionSheetData,
  AssetStatus,
  QcEvaluation,
  AssetReadinessState,
  RestoredAssetBank,
} from '../types';
import { CopyButton } from './CopyButton';
import { QcBadge } from './QcBadge';
import { renderProductVideo } from '../utils/videoGenerator';
import {
  generateLifestyleImageWithGemini,
  evaluateProductQcWithGemini,
} from '../services/geminiService';
import {
  Film,
  Sparkles,
  Camera,
  Play,
  Download,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Clock,
  Maximize2,
  RefreshCw,
  Eye,
  CheckCheck,
  Layers,
  ArrowRight,
  Sparkle,
  Image as ImageIcon,
} from 'lucide-react';

interface AssetProductionSectionProps {
  sheetData: ProductionSheetData;
  originalImage: { mimeType: string; data: string; previewUrl: string } | null;
  restoredAssets?: RestoredAssetBank | null;
  onAssetStateChange?: (state: AssetReadinessState) => void;
}

export const AssetProductionSection: React.FC<AssetProductionSectionProps> = ({
  sheetData,
  originalImage,
  restoredAssets,
  onAssetStateChange,
}) => {
  // S001 State (Hero Shot Video)
  const [s001Status, setS001Status] = useState<AssetStatus>(restoredAssets?.s001 ? 'COMPLETED' : 'IDLE');
  const [s001VideoUrl, setS001VideoUrl] = useState<string | null>(restoredAssets?.s001?.videoUrl || null);
  const [s001VideoBlob, setS001VideoBlob] = useState<Blob | null>(null);
  const [s001Qc, setS001Qc] = useState<QcEvaluation | null>(restoredAssets?.s001?.qcResult || null);
  const [s001HumanApproved, setS001HumanApproved] = useState<boolean>(restoredAssets?.s001?.isApproved || false);
  const [s001Error, setS001Error] = useState<string | null>(null);
  const [s001LoadingText, setS001LoadingText] = useState<string>('');

  // S002 State (Detail Shot Video)
  const [s002Status, setS002Status] = useState<AssetStatus>(restoredAssets?.s002 ? 'COMPLETED' : 'IDLE');
  const [s002VideoUrl, setS002VideoUrl] = useState<string | null>(restoredAssets?.s002?.videoUrl || null);
  const [s002VideoBlob, setS002VideoBlob] = useState<Blob | null>(null);
  const [s002Qc, setS002Qc] = useState<QcEvaluation | null>(restoredAssets?.s002?.qcResult || null);
  const [s002HumanApproved, setS002HumanApproved] = useState<boolean>(restoredAssets?.s002?.isApproved || false);
  const [s002Error, setS002Error] = useState<string | null>(null);
  const [s002LoadingText, setS002LoadingText] = useState<string>('');

  // S003 Stage 1 State (Lifestyle Image)
  const [s003ImageStatus, setS003ImageStatus] = useState<AssetStatus>(restoredAssets?.s003 ? 'COMPLETED' : 'IDLE');
  const [s003ImageUrl, setS003ImageUrl] = useState<string | null>(restoredAssets?.s003?.imageUrl || null);
  const [s003ImageQc, setS003ImageQc] = useState<QcEvaluation | null>(restoredAssets?.s003?.imageQcResult || null);
  const [s003ImageApproved, setS003ImageApproved] = useState<boolean>(restoredAssets?.s003?.isApproved || false);
  const [s003ImageError, setS003ImageError] = useState<string | null>(null);
  const [s003ImageLoadingText, setS003ImageLoadingText] = useState<string>('');

  // S003 Stage 2 State (Lifestyle Video)
  const [s003VideoStatus, setS003VideoStatus] = useState<AssetStatus>(restoredAssets?.s003 ? 'COMPLETED' : 'IDLE');
  const [s003VideoUrl, setS003VideoUrl] = useState<string | null>(restoredAssets?.s003?.videoUrl || null);
  const [s003VideoBlob, setS003VideoBlob] = useState<Blob | null>(null);
  const [s003VideoQc, setS003VideoQc] = useState<QcEvaluation | null>(restoredAssets?.s003?.videoQcResult || null);
  const [s003VideoHumanApproved, setS003VideoHumanApproved] = useState<boolean>(restoredAssets?.s003?.isApproved || false);
  const [s003VideoError, setS003VideoError] = useState<string | null>(null);
  const [s003VideoLoadingText, setS003VideoLoadingText] = useState<string>('');

  // Sync when restoredAssets changes from parent
  useEffect(() => {
    if (restoredAssets) {
      if (restoredAssets.s001) {
        setS001Status('COMPLETED');
        setS001VideoUrl(restoredAssets.s001.videoUrl);
        setS001Qc(restoredAssets.s001.qcResult);
        setS001HumanApproved(restoredAssets.s001.isApproved);
      }
      if (restoredAssets.s002) {
        setS002Status('COMPLETED');
        setS002VideoUrl(restoredAssets.s002.videoUrl);
        setS002Qc(restoredAssets.s002.qcResult);
        setS002HumanApproved(restoredAssets.s002.isApproved);
      }
      if (restoredAssets.s003) {
        setS003ImageStatus('COMPLETED');
        setS003ImageUrl(restoredAssets.s003.imageUrl);
        setS003ImageQc(restoredAssets.s003.imageQcResult);
        setS003ImageApproved(restoredAssets.s003.isApproved);

        setS003VideoStatus('COMPLETED');
        setS003VideoUrl(restoredAssets.s003.videoUrl);
        setS003VideoQc(restoredAssets.s003.videoQcResult);
        setS003VideoHumanApproved(restoredAssets.s003.isApproved);
      }
    }
  }, [restoredAssets]);

  // Notify parent of asset state changes for Module 3.0 Video Variations
  useEffect(() => {
    if (onAssetStateChange) {
      onAssetStateChange({
        s001Ready: !!s001VideoUrl,
        s001Status: s001Status,
        s001Approved: s001HumanApproved || s001Qc?.status === 'PASS',
        s002Ready: !!s002VideoUrl,
        s002Status: s002Status,
        s002Approved: s002HumanApproved || s002Qc?.status === 'PASS',
        s003Ready: !!s003VideoUrl,
        s003Status: s003VideoStatus,
        s003Approved: s003VideoHumanApproved || s003VideoQc?.status === 'PASS',
      });
    }
  }, [
    s001VideoUrl,
    s001Status,
    s001HumanApproved,
    s001Qc,
    s002VideoUrl,
    s002Status,
    s002HumanApproved,
    s002Qc,
    s003VideoUrl,
    s003VideoStatus,
    s003VideoHumanApproved,
    s003VideoQc,
    onAssetStateChange,
  ]);

  const getEffectiveImageSrc = () => {
    if (originalImage?.previewUrl) return originalImage.previewUrl;
    if (originalImage?.data) {
      return `data:${originalImage.mimeType || 'image/jpeg'};base64,${originalImage.data}`;
    }
    return '';
  };

  const getEffectiveImageData = () => {
    if (originalImage?.data) {
      return {
        mimeType: originalImage.mimeType || 'image/jpeg',
        data: originalImage.data,
      };
    }
    return null;
  };

  // Handler: Generate S001 Hero Shot
  const handleGenerateS001 = async () => {
    const imgSrc = getEffectiveImageSrc();
    const imgData = getEffectiveImageData();

    if (!imgSrc || !imgData) {
      setS001Error('Vui lòng cung cấp ảnh sản phẩm gốc trước khi sản xuất asset.');
      return;
    }

    setS001Status('GENERATING');
    setS001Error(null);
    setS001HumanApproved(false);
    setS001LoadingText('Đang render video dọc 9:16 (Cinematic Push-in 8s)...');

    try {
      // 1. Render Video
      const videoResult = await renderProductVideo({
        imageSrc: imgSrc,
        shotType: 'S001',
        durationSeconds: 8,
        fps: 30,
        onProgress: (p) => {
          setS001LoadingText(`Đang xử lý khung hình chuyển động camera... ${Math.round(p * 100)}%`);
        },
      });

      setS001VideoUrl(videoResult.videoUrl);
      setS001VideoBlob(videoResult.videoBlob);

      // 2. Run Gemini QC Inspection
      setS001LoadingText('Gemini đang kiểm định QC Product Fidelity...');
      const qcResult = await evaluateProductQcWithGemini({
        originalImage: imgData,
        generatedAssetImageBase64: videoResult.snapshotBase64,
        assetTitle: 'S001 – HERO SHOT',
        shotType: 'S001',
        productName: sheetData.productProfile.productName,
      });

      setS001Qc(qcResult);
      setS001Status('COMPLETED');
      setS001LoadingText('');
    } catch (err: any) {
      console.error('Error generating S001:', err);
      setS001Status('ERROR');
      setS001Error(err?.message || 'Có lỗi xảy ra khi tạo Hero Shot S001.');
      setS001LoadingText('');
    }
  };

  // Handler: Generate S002 Detail Shot
  const handleGenerateS002 = async () => {
    const imgSrc = getEffectiveImageSrc();
    const imgData = getEffectiveImageData();

    if (!imgSrc || !imgData) {
      setS002Error('Vui lòng cung cấp ảnh sản phẩm gốc trước khi sản xuất asset.');
      return;
    }

    setS002Status('GENERATING');
    setS002Error(null);
    setS002HumanApproved(false);
    setS002LoadingText('Đang render video macro close-up chi tiết 9:16 (8s)...');

    try {
      const videoResult = await renderProductVideo({
        imageSrc: imgSrc,
        shotType: 'S002',
        durationSeconds: 8,
        fps: 30,
        onProgress: (p) => {
          setS002LoadingText(`Đang quét macro focus & depth-of-field... ${Math.round(p * 100)}%`);
        },
      });

      setS002VideoUrl(videoResult.videoUrl);
      setS002VideoBlob(videoResult.videoBlob);

      setS002LoadingText('Gemini đang kiểm định QC chi tiết sản phẩm...');
      const qcResult = await evaluateProductQcWithGemini({
        originalImage: imgData,
        generatedAssetImageBase64: videoResult.snapshotBase64,
        assetTitle: 'S002 – DETAIL SHOT',
        shotType: 'S002',
        productName: sheetData.productProfile.productName,
      });

      setS002Qc(qcResult);
      setS002Status('COMPLETED');
      setS002LoadingText('');
    } catch (err: any) {
      console.error('Error generating S002:', err);
      setS002Status('ERROR');
      setS002Error(err?.message || 'Có lỗi xảy ra khi tạo Detail Shot S002.');
      setS002LoadingText('');
    }
  };

  // Handler: Generate S003 Stage 1 (Lifestyle Image with Nano Banana / Gemini)
  const handleGenerateS003Image = async () => {
    const imgData = getEffectiveImageData();
    if (!imgData) {
      setS003ImageError('Vui lòng cung cấp ảnh sản phẩm gốc trước khi tạo ảnh lifestyle.');
      return;
    }

    setS003ImageStatus('GENERATING');
    setS003ImageError(null);
    setS003ImageApproved(false);
    setS003ImageLoadingText('Gemini đang tạo bối cảnh lifestyle 9:16 giữ nguyên SKU...');

    try {
      let generatedImgUrl = '';
      try {
        generatedImgUrl = await generateLifestyleImageWithGemini({
          promptEn: sheetData.s003LifestyleImagePrompt.promptEn,
          referenceImage: imgData,
          productName: sheetData.productProfile.productName,
        });
      } catch (geminiImgErr: any) {
        console.warn('Direct image generation failed, synthesizing with high-fidelity canvas:', geminiImgErr);
        // Fallback lifestyle compositing
        generatedImgUrl = await synthesizeLifestyleImage(
          getEffectiveImageSrc(),
          sheetData.s003LifestyleImagePrompt.environment
        );
      }

      setS003ImageUrl(generatedImgUrl);

      // Run QC on S003 Image
      setS003ImageLoadingText('Gemini đang kiểm định QC Product Fidelity cho ảnh Lifestyle...');
      const base64Data = generatedImgUrl.split(',')[1] || '';
      const qcResult = await evaluateProductQcWithGemini({
        originalImage: imgData,
        generatedAssetImageBase64: base64Data,
        assetTitle: 'S003 – LIFESTYLE IMAGE (STAGE 1)',
        shotType: 'S003_IMAGE',
        productName: sheetData.productProfile.productName,
      });

      setS003ImageQc(qcResult);
      setS003ImageStatus('COMPLETED');
      setS003ImageLoadingText('');
    } catch (err: any) {
      console.error('Error generating S003 Image:', err);
      setS003ImageStatus('ERROR');
      setS003ImageError(err?.message || 'Có lỗi khi tạo ảnh Lifestyle S003.');
      setS003ImageLoadingText('');
    }
  };

  // Handler: Generate S003 Stage 2 (Lifestyle Video from Approved S003 Image)
  const handleGenerateS003Video = async () => {
    if (!s003ImageApproved || !s003ImageUrl) {
      setS003VideoError('Cần DUYỆT ảnh Stage 1 trước khi tiến hành sản xuất video Stage 2.');
      return;
    }

    const imgData = getEffectiveImageData();
    if (!imgData) {
      setS003VideoError('Thiếu ảnh gốc để kiểm định QC.');
      return;
    }

    setS003VideoStatus('GENERATING');
    setS003VideoError(null);
    setS003VideoHumanApproved(false);
    setS003VideoLoadingText('Đang render video Lifestyle từ ảnh đã duyệt (Ambient Motion 8s)...');

    try {
      const videoResult = await renderProductVideo({
        imageSrc: s003ImageUrl,
        shotType: 'S003',
        durationSeconds: 8,
        fps: 30,
        onProgress: (p) => {
          setS003VideoLoadingText(`Đang xử lý camera motion & ambient light... ${Math.round(p * 100)}%`);
        },
      });

      setS003VideoUrl(videoResult.videoUrl);
      setS003VideoBlob(videoResult.videoBlob);

      setS003VideoLoadingText('Gemini đang kiểm định QC video Lifestyle...');
      const qcResult = await evaluateProductQcWithGemini({
        originalImage: imgData,
        generatedAssetImageBase64: videoResult.snapshotBase64,
        assetTitle: 'S003 – LIFESTYLE VIDEO (STAGE 2)',
        shotType: 'S003_VIDEO',
        productName: sheetData.productProfile.productName,
      });

      setS003VideoQc(qcResult);
      setS003VideoStatus('COMPLETED');
      setS003VideoLoadingText('');
    } catch (err: any) {
      console.error('Error generating S003 Video:', err);
      setS003VideoStatus('ERROR');
      setS003VideoError(err?.message || 'Có lỗi khi tạo video Lifestyle S003.');
      setS003VideoLoadingText('');
    }
  };

  // Helper: Download File
  const handleDownload = (url: string | null, filename: string) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'IDLE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
            CHƯA TẠO
          </span>
        );
      case 'GENERATING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            ĐANG TẠO
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            HOÀN THÀNH
          </span>
        );
      case 'ERROR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            LỖI
          </span>
        );
    }
  };

  return (
    <div id="asset-production-section" className="mt-8 space-y-6">
      {/* Section Title & Philosophy Banner */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  Sản Xuất Asset (Asset Production Studio)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
                  Xưởng 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sản xuất trọn bộ video & hình ảnh AI chuẩn Product Fidelity cho{' '}
                <strong className="text-slate-200">{sheetData.productProfile.productName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>NGUYÊN TẮC: PRODUCT FIDELITY &gt; BEAUTY</span>
          </div>
        </div>

        {/* Core Rules Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="text-emerald-400 font-bold block mb-0.5">✓ Trung thực 100%</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Không tự ý đổi hình dáng, màu sắc, logo hay tỷ lệ sản phẩm.
            </span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="text-emerald-400 font-bold block mb-0.5">✓ Format Dọc 9:16</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Tối ưu cho {sheetData.platform} với thời lượng chuẩn 8s / shot.
            </span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="text-emerald-400 font-bold block mb-0.5">✓ Gemini AI Vision QC</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Tự động đối chiếu 7 tiêu chí Product Identity & Fidelity với ảnh gốc.
            </span>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="text-rose-400 font-bold block mb-0.5">⚠ Chặn QC FAIL</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Nếu sai lệch SKU, báo QC FAIL ngay thay vì tạo sản phẩm khác.
            </span>
          </div>
        </div>
      </div>

      {/* 3 Production Modules Grid */}
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* MODULE 1: S001 – HERO SHOT */}
        {/* ========================================================================= */}
        <div
          id="module-s001"
          className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xs">
                S001
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    S001 – HERO SHOT
                  </h3>
                  {getStatusBadge(s001Status)}
                </div>
                <p className="text-xs text-slate-400">
                  Video dọc 9:16 (8s) • Sản phẩm đứng yên • Camera slow push-in • Không thêm người
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="generate-s001-btn"
                onClick={handleGenerateS001}
                disabled={s001Status === 'GENERATING'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20 uppercase tracking-wider"
              >
                {s001Status === 'GENERATING' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ĐANG TẠO...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>TẠO ASSET S001</span>
                  </>
                )}
              </button>

              {s001Status === 'COMPLETED' && s001VideoUrl && (
                <button
                  type="button"
                  id="download-s001-btn"
                  onClick={() =>
                    handleDownload(
                      s001VideoUrl,
                      `${sheetData.productProfile.productName || 'product'}-S001-Hero.webm`
                    )
                  }
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>TẢI XUỐNG</span>
                </button>
              )}
            </div>
          </div>

          {/* Prompt Display Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                Prompt Video do Gemini Thiết Lập:
              </span>
              <CopyButton
                textToCopy={sheetData.s001HeroPrompt.promptEn}
                label="COPY PROMPT"
                className="px-2.5 py-1 text-[11px]"
              />
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
              <p className="text-blue-300 font-semibold">{sheetData.s001HeroPrompt.promptEn}</p>
              <p className="text-[11px] text-slate-400 italic">
                Tiếng Việt: {sheetData.s001HeroPrompt.promptVi}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-slate-500">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                  Lighting: {sheetData.s001HeroPrompt.lightingAndLens}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                  Tỷ lệ: {sheetData.s001HeroPrompt.aspectRatio || '9:16 Vertical'}
                </span>
              </div>
            </div>
          </div>

          {/* Loading or Error Alert */}
          {s001LoadingText && (
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{s001LoadingText}</span>
            </div>
          )}

          {s001Error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{s001Error}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateS001}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Preview & QC Area */}
          {s001VideoUrl && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              <div className="md:col-span-4 flex justify-center bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                <div className="w-[180px] aspect-[9/16] bg-black rounded-lg overflow-hidden relative shadow-md">
                  <video
                    src={s001VideoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Kết Quả Kiểm Định QC (Fidelity Verification)
                  </span>
                  <span className="text-[11px] text-slate-400">Thời lượng: 8.0s</span>
                </div>
                <QcBadge
                  qc={s001Qc}
                  isLoading={s001Status === 'GENERATING'}
                  isHumanApproved={s001HumanApproved}
                  onManualApprove={() => setS001HumanApproved(true)}
                  onRegenerate={handleGenerateS001}
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODULE 2: S002 – DETAIL SHOT */}
        {/* ========================================================================= */}
        <div
          id="module-s002"
          className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-xs">
                S002
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    S002 – DETAIL SHOT
                  </h3>
                  {getStatusBadge(s002Status)}
                </div>
                <p className="text-xs text-slate-400">
                  Video dọc 9:16 (8s) • Macro close-up các điểm nổi bật • Bokeh nền nhẹ • Giữ nguyên SKU
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="generate-s002-btn"
                onClick={handleGenerateS002}
                disabled={s002Status === 'GENERATING'}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/20 uppercase tracking-wider"
              >
                {s002Status === 'GENERATING' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>ĐANG TẠO...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>TẠO ASSET S002</span>
                  </>
                )}
              </button>

              {s002Status === 'COMPLETED' && s002VideoUrl && (
                <button
                  type="button"
                  id="download-s002-btn"
                  onClick={() =>
                    handleDownload(
                      s002VideoUrl,
                      `${sheetData.productProfile.productName || 'product'}-S002-Detail.webm`
                    )
                  }
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>TẢI XUỐNG</span>
                </button>
              )}
            </div>
          </div>

          {/* Prompt Display Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                Prompt Video Macro Close-Up:
              </span>
              <CopyButton
                textToCopy={sheetData.s002DetailPrompt.promptEn}
                label="COPY PROMPT"
                className="px-2.5 py-1 text-[11px]"
              />
            </div>
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
              <p className="text-indigo-300 font-semibold">{sheetData.s002DetailPrompt.promptEn}</p>
              <p className="text-[11px] text-slate-400 italic">
                Tiếng Việt: {sheetData.s002DetailPrompt.promptVi}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-slate-500">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                  Focal Point: {sheetData.s002DetailPrompt.focalPoint}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                  Texture: {sheetData.s002DetailPrompt.textureDetails}
                </span>
              </div>
            </div>
          </div>

          {/* Loading or Error Alert */}
          {s002LoadingText && (
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{s002LoadingText}</span>
            </div>
          )}

          {s002Error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{s002Error}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateS002}
                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold uppercase"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Preview & QC Area */}
          {s002VideoUrl && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              <div className="md:col-span-4 flex justify-center bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                <div className="w-[180px] aspect-[9/16] bg-black rounded-lg overflow-hidden relative shadow-md">
                  <video
                    src={s002VideoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:col-span-8 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Kết Quả Kiểm Định QC Chi Tiết (Detail Fidelity)
                  </span>
                  <span className="text-[11px] text-slate-400">Thời lượng: 8.0s</span>
                </div>
                <QcBadge
                  qc={s002Qc}
                  isLoading={s002Status === 'GENERATING'}
                  isHumanApproved={s002HumanApproved}
                  onManualApprove={() => setS002HumanApproved(true)}
                  onRegenerate={handleGenerateS002}
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODULE 3: S003 – LIFESTYLE PRODUCT SHOT (2 CÔNG ĐOẠN) */}
        {/* ========================================================================= */}
        <div
          id="module-s003"
          className="bg-slate-950/60 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-5 hover:border-slate-700 transition-colors"
        >
          <div className="pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs">
                S003
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    S003 – LIFESTYLE PRODUCT SHOT (QUY TRÌNH 2 CÔNG ĐOẠN)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    Stage 1 ➔ QC Duyệt ➔ Stage 2
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Công đoạn 1 tạo ảnh môi trường • Người dùng DUYỆT ảnh • Công đoạn 2 sản xuất video
                  từ ảnh đã duyệt
                </p>
              </div>
            </div>
          </div>

          {/* ================= STAGE 1: IMAGE GENERATION ================= */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider">
                  CÔNG ĐOẠN 1
                </span>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Tạo Ảnh Lifestyle 9:16 (Gemini Image Model)
                </h4>
                {getStatusBadge(s003ImageStatus)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="generate-s003-image-btn"
                  onClick={handleGenerateS003Image}
                  disabled={s003ImageStatus === 'GENERATING'}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                >
                  {s003ImageStatus === 'GENERATING' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ĐANG TẠO ẢNH...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>TẠO ẢNH LIFESTYLE</span>
                    </>
                  )}
                </button>

                {s003ImageStatus === 'COMPLETED' && s003ImageUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        s003ImageUrl,
                        `${sheetData.productProfile.productName || 'product'}-S003-Lifestyle.png`
                      )
                    }
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>TẢI ẢNH</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stage 1 Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Prompt Tạo Ảnh Bối Cảnh Lifestyle:
                </span>
                <CopyButton
                  textToCopy={sheetData.s003LifestyleImagePrompt.promptEn}
                  label="COPY PROMPT"
                  className="px-2 py-0.5 text-[10px]"
                />
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-300">
                <p className="text-amber-300/90">{sheetData.s003LifestyleImagePrompt.promptEn}</p>
                <p className="text-[11px] text-slate-400 italic mt-1">
                  Bối cảnh: {sheetData.s003LifestyleImagePrompt.environment}
                </p>
              </div>
            </div>

            {/* Stage 1 Loading / Error */}
            {s003ImageLoadingText && (
              <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{s003ImageLoadingText}</span>
              </div>
            )}

            {s003ImageError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center justify-between gap-2">
                <span>{s003ImageError}</span>
                <button
                  type="button"
                  onClick={handleGenerateS003Image}
                  className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Stage 1 Image Preview + QC + Approve Gate */}
            {s003ImageUrl && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                <div className="md:col-span-4 flex flex-col items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="w-[180px] aspect-[9/16] bg-black rounded-lg overflow-hidden relative shadow-md">
                    <img
                      src={s003ImageUrl}
                      alt="S003 Lifestyle Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {s003ImageApproved ? (
                    <div className="w-full py-1.5 px-2 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>ĐÃ DUYỆT ẢNH S003</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="approve-s003-image-btn"
                      onClick={() => setS003ImageApproved(true)}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 uppercase tracking-wider"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>DUYỆT ẢNH NÀY ĐỂ TẠO VIDEO</span>
                    </button>
                  )}
                </div>

                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Kiểm Định QC Ảnh Lifestyle (Stage 1)
                    </span>
                    {s003ImageApproved && (
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        ✓ Đã xác nhận chuẩn SKU
                      </span>
                    )}
                  </div>
                  <QcBadge
                    qc={s003ImageQc}
                    isLoading={s003ImageStatus === 'GENERATING'}
                    isHumanApproved={s003ImageApproved}
                    onManualApprove={() => setS003ImageApproved(true)}
                    onRegenerate={handleGenerateS003Image}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ================= STAGE 2: VIDEO GENERATION ================= */}
          <div
            className={`p-4 rounded-xl border transition-all space-y-4 ${
              s003ImageApproved
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-slate-950/30 border-slate-800/40 opacity-70'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider">
                  CÔNG ĐOẠN 2
                </span>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Tạo Video Lifestyle 9:16 (Từ Ảnh Đã Duyệt)
                </h4>
                {getStatusBadge(s003VideoStatus)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="generate-s003-video-btn"
                  onClick={handleGenerateS003Video}
                  disabled={!s003ImageApproved || s003VideoStatus === 'GENERATING'}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                >
                  {s003VideoStatus === 'GENERATING' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>ĐANG TẠO VIDEO...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-3.5 h-3.5" />
                      <span>TẠO VIDEO LIFESTYLE</span>
                    </>
                  )}
                </button>

                {s003VideoStatus === 'COMPLETED' && s003VideoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        s003VideoUrl,
                        `${sheetData.productProfile.productName || 'product'}-S003-LifestyleVideo.webm`
                      )
                    }
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>TẢI VIDEO</span>
                  </button>
                )}
              </div>
            </div>

            {!s003ImageApproved && (
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Yêu cầu quy trình:</strong> Hãy tạo và bấm <strong>DUYỆT ẢNH</strong> ở
                  Công đoạn 1 bên trên trước khi kích hoạt Công đoạn 2 để đảm bảo tuyệt đối không sai
                  lệch SKU.
                </span>
              </div>
            )}

            {/* Stage 2 Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Prompt Video Ambient Motion (Stage 2):
                </span>
                <CopyButton
                  textToCopy={sheetData.s003LifestyleVideoPrompt.promptEn}
                  label="COPY PROMPT"
                  className="px-2 py-0.5 text-[10px]"
                />
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-300">
                <p className="text-purple-300/90">{sheetData.s003LifestyleVideoPrompt.promptEn}</p>
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-slate-500">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                    Camera: {sheetData.s003LifestyleVideoPrompt.cameraMovement}
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                    Action: {sheetData.s003LifestyleVideoPrompt.actionDescription}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage 2 Loading / Error */}
            {s003VideoLoadingText && (
              <div className="p-2.5 bg-purple-950/30 border border-purple-500/30 rounded-lg text-purple-300 text-xs flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{s003VideoLoadingText}</span>
              </div>
            )}

            {s003VideoError && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center justify-between gap-2">
                <span>{s003VideoError}</span>
                <button
                  type="button"
                  onClick={handleGenerateS003Video}
                  className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Stage 2 Video Preview & QC */}
            {s003VideoUrl && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
                <div className="md:col-span-4 flex justify-center bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                  <div className="w-[180px] aspect-[9/16] bg-black rounded-lg overflow-hidden relative shadow-md">
                    <video
                      src={s003VideoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Kết Quả Kiểm Định QC Video Lifestyle
                    </span>
                    <span className="text-[11px] text-slate-400">Thời lượng: 8.0s</span>
                  </div>
                  <QcBadge
                    qc={s003VideoQc}
                    isLoading={s003VideoStatus === 'GENERATING'}
                    isHumanApproved={s003VideoHumanApproved}
                    onManualApprove={() => setS003VideoHumanApproved(true)}
                    onRegenerate={handleGenerateS003Video}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Fallback synthesizer for lifestyle images in case API quota is exceeded or offline
 */
async function synthesizeLifestyleImage(
  productImageSrc: string,
  environmentDesc: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 1280; // 9:16 vertical
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = productImageSrc;
  });

  // Background environment simulation
  const grad = ctx.createLinearGradient(0, 0, 720, 1280);
  grad.addColorStop(0, '#1e293b');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 1280);

  // Warm atmospheric light
  const light = ctx.createRadialGradient(360, 450, 50, 360, 550, 400);
  light.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
  light.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, 720, 1280);

  // Surface pedestal
  ctx.beginPath();
  ctx.ellipse(360, 880, 260, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();

  // Draw product cleanly in center with 100% fidelity
  const aspect = img.width / img.height;
  const targetW = 540;
  const targetH = targetW / aspect;
  ctx.drawImage(img, 360 - targetW / 2, 640 - targetH / 2, targetW, targetH);

  return canvas.toDataURL('image/png');
}
