import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Layers,
  Smartphone,
  DollarSign,
  Tag,
  Users,
  FileText,
  AlertCircle,
  HelpCircle,
  PlayCircle,
  CheckCircle2,
  FolderArchive,
  RotateCcw,
  PlusCircle,
  ShieldCheck,
  Film,
  FileCheck2,
} from 'lucide-react';
import { PlatformType, ConceptCount, ProductionProject } from '../types';
import { SAMPLE_PRODUCTS, SampleProduct } from '../data/samples';
import { findMatchingProject, getProjectById, PROJECT_P001 } from '../data/projectStore';
import { safeUtf8ToBase64 } from '../utils/encoding';

interface ProductFormProps {
  productName: string;
  setProductName: (val: string) => void;
  currentPrice: string;
  setCurrentPrice: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  targetAudience: string;
  setTargetAudience: (val: string) => void;
  platform: PlatformType;
  setPlatform: (val: PlatformType) => void;
  conceptCount: ConceptCount;
  setConceptCount: (val: ConceptCount) => void;
  imageData: { mimeType: string; data: string; previewUrl: string } | null;
  setImageData: (val: { mimeType: string; data: string; previewUrl: string } | null) => void;
  onSubmit: () => void;
  onRestoreProject?: (project: ProductionProject) => void;
  onOpenHistory?: () => void;
  isLoading: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  productName,
  setProductName,
  currentPrice,
  setCurrentPrice,
  description,
  setDescription,
  targetAudience,
  setTargetAudience,
  platform,
  setPlatform,
  conceptCount,
  setConceptCount,
  imageData,
  setImageData,
  onSubmit,
  onRestoreProject,
  onOpenHistory,
  isLoading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current input matches an existing historical project
  const matchedProject = findMatchingProject(productName);

  // Handle file reading
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationError('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Dung lượng ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setValidationError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const [meta, base64] = result.split(',');
        const mimeMatch = meta.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : file.type;

        setImageData({
          mimeType,
          data: base64,
          previewUrl: result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadSample = (sample: SampleProduct) => {
    // If selecting Mary Jane (sample-5), we detect Project P001!
    if (sample.id === 'sample-5') {
      const p001 = getProjectById('P001') || PROJECT_P001;
      setProductName(p001.name);
      setCurrentPrice(p001.price);
      setDescription(p001.description);
      setTargetAudience(p001.targetAudience);
      setPlatform(p001.platform);
      setConceptCount(p001.conceptCount);

      if (p001.imageData) {
        setImageData(p001.imageData);
      }
      setValidationError(null);
      return;
    }

    setProductName(sample.name);
    setCurrentPrice(sample.price);
    setDescription(sample.description);
    setTargetAudience(sample.targetAudience);
    setPlatform(sample.platform);
    setConceptCount(sample.conceptCount);

    // Set sample image
    const [meta, rawPart] = sample.imageThumbnail.split(',');
    const mimeMatch = meta ? meta.match(/data:([^;]+);/) : null;
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/svg+xml';
    // If rawPart is not already base64, encode it safely
    const isBase64 = meta && meta.includes('base64');
    const base64Data = isBase64 ? rawPart : safeUtf8ToBase64(rawPart || sample.imageThumbnail);

    setImageData({
      mimeType,
      data: base64Data,
      previewUrl: sample.imageThumbnail,
    });
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() && !description.trim() && !imageData) {
      setValidationError('Vui lòng tải lên ảnh sản phẩm hoặc nhập tên/mô tả sản phẩm.');
      return;
    }
    setValidationError(null);
    onSubmit();
  };

  return (
    <form id="affiliate-product-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Sample Presets Bar + Project History Trigger */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Nạp mẫu / Lịch sử Project:
          </span>
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
            >
              <FolderArchive className="w-3 h-3" />
              <span>Kho Projects (1)</span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PRODUCTS.map((s) => {
            const isMaryJane = s.id === 'sample-5';
            return (
              <button
                key={s.id}
                type="button"
                id={`preset-btn-${s.id}`}
                onClick={() => loadSample(s)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer text-left truncate max-w-[195px] flex items-center gap-1.5 ${
                  isMaryJane
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 hover:text-blue-400 hover:border-blue-500/50 text-slate-300 border border-slate-700'
                }`}
                title={s.name}
              >
                {isMaryJane && <span className="text-[9px] px-1 py-0.2 bg-amber-500/30 text-amber-200 rounded font-mono">P001</span>}
                <span className="truncate">{s.name.split(' ')[0]} {s.name.split(' ')[1]} {s.name.split(' ')[2]}...</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DETECTED EXISTING PROJECT BANNER */}
      {matchedProject && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border-2 border-blue-500/50 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500 text-white font-mono text-[11px] font-extrabold uppercase tracking-wider">
                  {matchedProject.id}
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã có lịch sử sản xuất đầy đủ
                </span>
              </div>
              <p className="text-xs font-bold text-white leading-tight">
                {matchedProject.name}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>● Giá xác minh: <strong className="text-white">{matchedProject.verifiedPrice}</strong></span>
              <span className="text-emerald-400 font-bold">● Fidelity QC: 98/100</span>
            </div>
            <div className="text-slate-400">
              <span>● Asset Bank: <strong className="text-blue-300">S001, S002, S003 (Đã duyệt)</strong></span>
            </div>
            <div className="text-slate-400">
              <span>● Script Factory: <strong className="text-emerald-300">5/5 Kịch bản đã duyệt (Content QC Pass)</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {onRestoreProject && (
              <button
                type="button"
                id="continue-project-btn"
                onClick={() => onRestoreProject(matchedProject)}
                className="flex-1 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 uppercase tracking-wide"
              >
                <RotateCcw className="w-4 h-4" />
                <span>TIẾP TỤC PROJECT ({matchedProject.id})</span>
              </button>
            )}
            <button
              type="submit"
              id="create-new-project-btn"
              disabled={isLoading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Tạo phiên bản mới không ghi đè Project cũ"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tạo mới (Không ghi đè)</span>
            </button>
          </div>
          <p className="text-[10px] text-emerald-400/90 text-center font-medium">
            ⚡ Nhấn "Tiếp tục Project" để khôi phục dữ liệu đã duyệt và vào ngay Bước 5: Voice Factory
          </p>
        </div>
      )}

      {/* 1. Upload ảnh sản phẩm */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            Ảnh sản phẩm
          </label>
          <span className="text-[10px] text-slate-500">
            {imageData ? 'Đã tải ảnh' : 'PNG, JPG, WEBP'}
          </span>
        </div>

        <input
          ref={fileInputRef}
          id="product-image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {!imageData ? (
          <div
            id="dropzone-area"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 bg-slate-900/60 hover:border-blue-500 hover:bg-blue-500/5'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center mb-1.5 group-hover:text-blue-400">
              <Upload className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium text-slate-300">
              Tải lên hoặc kéo thả ảnh vào đây
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Gemini sẽ soi chi tiết bao bì, màu sắc, phom dáng
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl border border-slate-700 bg-slate-950 p-3 flex items-center gap-3">
            <div className="w-20 h-20 shrink-0 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
              <img
                src={imageData.previewUrl}
                alt="Product Preview"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã nạp Vision</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {imageData.mimeType.toUpperCase()}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  id="change-image-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  Thay ảnh
                </button>
                <button
                  type="button"
                  id="remove-image-btn"
                  onClick={removeImage}
                  className="text-[11px] px-2 py-1 text-red-400 hover:text-red-300 rounded transition-colors cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Tên sản phẩm */}
      <div className="space-y-1">
        <label htmlFor="product-name-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Tag className="w-3 h-3 text-blue-400" />
          Tên sản phẩm <span className="text-red-400">*</span>
        </label>
        <input
          id="product-name-input"
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="VD: Tai nghe Bluetooth X3, Nồi chiên không dầu..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        />
      </div>

      {/* 3 & 4. Giá và Số lượng concept */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Giá hiện tại */}
        <div className="space-y-1">
          <label htmlFor="product-price-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-blue-400" />
            Giá hiện tại / Ưu đãi
          </label>
          <input
            id="product-price-input"
            type="text"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder="VD: 1.250.000đ / Flash sale"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Số lượng Concept */}
        <div className="space-y-1">
          <label htmlFor="concept-count-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            Số lượng Concept
          </label>
          <select
            id="concept-count-select"
            value={conceptCount}
            onChange={(e) => setConceptCount(Number(e.target.value) as ConceptCount)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value={3}>3 Concepts</option>
            <option value={5}>5 Concepts</option>
            <option value={10}>10 Concepts</option>
          </select>
        </div>
      </div>

      {/* 5. Mô tả sản phẩm */}
      <div className="space-y-1">
        <label htmlFor="product-description-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <FileText className="w-3 h-3 text-blue-400" />
          Mô tả sản phẩm & Thông số kỹ thuật
        </label>
        <textarea
          id="product-description-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập thông số kỹ thuật, công năng, phụ kiện hoặc chính sách..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-y"
        />
      </div>

      {/* 6. Đối tượng khách hàng */}
      <div className="space-y-1">
        <label htmlFor="product-target-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Users className="w-3 h-3 text-blue-400" />
          Đối tượng khách hàng mục tiêu
        </label>
        <input
          id="product-target-input"
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="VD: Dân văn phòng, 25-35 tuổi, gia đình trẻ..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        />
      </div>

      {/* 7. Nền tảng video */}
      <div className="space-y-1">
        <label htmlFor="platform-select" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-blue-400" />
          Nền tảng mục tiêu
        </label>
        <select
          id="platform-select"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as PlatformType)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all cursor-pointer"
        >
          <option value="TikTok">TikTok (9:16 - Giỏ hàng Shop)</option>
          <option value="Facebook Reels">Facebook Reels (9:16 - Link bio/cmt)</option>
          <option value="YouTube Shorts">YouTube Shorts (9:16 - Ghim bình luận)</option>
        </select>
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 8. Nút Lớn: TẠO PROJECT MỚI / TIẾP TỤC PROJECT */}
      <div className="pt-2 space-y-2">
        {!matchedProject ? (
          <button
            id="submit-analysis-btn"
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang phân tích & lập phiếu...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-white" />
                <span>TẠO PROJECT MỚI &amp; PHÂN TÍCH</span>
              </>
            )}
          </button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {onRestoreProject && (
              <button
                type="button"
                id="submit-continue-project-btn"
                onClick={() => onRestoreProject(matchedProject)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                <span>TIẾP TỤC PROJECT</span>
              </button>
            )}
            <button
              id="submit-analysis-new-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3.5 rounded-xl border border-slate-700 transition-all active:scale-[0.98] uppercase text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 text-slate-400" />
                  <span>TẠO PROJECT MỚI</span>
                </>
              )}
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-500 mt-2">
          Áp dụng tiêu chuẩn <strong className="text-slate-400">Product Fidelity &gt; Beauty</strong> • Tuyệt đối không ghi đè Project cũ
        </p>
      </div>
    </form>
  );
};
