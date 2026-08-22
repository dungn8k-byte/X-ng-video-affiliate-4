import React, { useState } from 'react';
import { QcEvaluation, QcCriterionResult } from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface QcBadgeProps {
  qc: QcEvaluation | null;
  isLoading?: boolean;
  isHumanApproved?: boolean;
  onManualApprove?: () => void;
  onRegenerate?: () => void;
}

export const QcBadge: React.FC<QcBadgeProps> = ({
  qc,
  isLoading,
  isHumanApproved,
  onManualApprove,
  onRegenerate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-semibold animate-pulse shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
        <span>Gemini đang phân tích thị giác AI & Kiểm định Product Identity / Fidelity...</span>
      </div>
    );
  }

  if (!qc) return null;

  const isApproved = isHumanApproved || qc.isHumanApproved;
  const status = qc.status; // 'PASS' | 'REVIEW' | 'FAIL'
  const isPass = status === 'PASS';
  const isReview = status === 'REVIEW';
  const isFail = status === 'FAIL';

  // Card theme styling
  const getContainerStyle = () => {
    if (isApproved) {
      return 'bg-purple-950/40 border-purple-500/40 text-purple-200 shadow-purple-900/10';
    }
    if (isPass) {
      return 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-emerald-900/10';
    }
    if (isReview) {
      return 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-amber-900/10';
    }
    return 'bg-rose-950/40 border-rose-500/40 text-rose-200 shadow-rose-900/10';
  };

  const getStatusBadgeStyle = () => {
    if (isApproved) {
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
    }
    if (isPass) {
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
    if (isReview) {
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }
    return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
  };

  const getIconBadge = () => {
    if (isApproved) {
      return (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 bg-purple-600 text-white shadow-md shadow-purple-600/30">
          <UserCheck className="w-4 h-4" />
        </div>
      );
    }
    if (isPass) {
      return (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
          <ShieldCheck className="w-4 h-4" />
        </div>
      );
    }
    if (isReview) {
      return (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 bg-amber-600 text-white shadow-md shadow-amber-600/30">
          <ShieldQuestion className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 bg-rose-600 text-white shadow-md shadow-rose-600/30">
        <ShieldAlert className="w-4 h-4" />
      </div>
    );
  };

  const getStatusText = () => {
    if (isApproved) return 'HUMAN APPROVED';
    if (isPass) return 'QC PASS (90-100)';
    if (isReview) return 'QC REVIEW (80-89)';
    return 'QC FAIL (0-79)';
  };

  return (
    <div className={`rounded-xl border shadow-sm transition-all ${getContainerStyle()}`}>
      {/* Header bar */}
      <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {getIconBadge()}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md ${getStatusBadgeStyle()}`}
              >
                {getStatusText()}
              </span>
              <span className="text-xs font-bold text-slate-200">
                Fidelity Score: <span className="text-white font-black">{qc.score}</span>/100
              </span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1 mt-1 font-medium">
              {qc.summary || qc.verdictReason}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          {/* Nút DUYỆT THỦ CÔNG (khi REVIEW hoặc FAIL muốn force override) */}
          {(isReview || isFail) && !isApproved && onManualApprove && (
            <button
              type="button"
              onClick={onManualApprove}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              title="Người dùng thẩm định và duyệt thủ công asset này"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>DUYỆT THỦ CÔNG</span>
            </button>
          )}

          {/* Nút TẠO LẠI (khi REVIEW hoặc FAIL) */}
          {(isReview || isFail) && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              title="Tạo lại asset để đạt chuẩn Fidelity cao hơn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>TẠO LẠI</span>
            </button>
          )}

          {/* Nút Thu gọn / Mở rộng 7 tiêu chí */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Thu gọn' : 'Chi tiết 7 tiêu chí'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Cảnh báo Mismatch Nghiêm trọng nếu có */}
      {qc.hasCriticalMismatch && qc.criticalMismatchDetails && (
        <div className="mx-3.5 mb-2.5 p-2.5 rounded-lg bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-rose-300 font-bold block mb-0.5 uppercase tracking-wide">
              Phát hiện sai lệch đặc điểm nhận dạng SKU:
            </strong>
            <p className="text-[11px] text-rose-200/90 leading-relaxed">
              {qc.criticalMismatchDetails}
            </p>
          </div>
        </div>
      )}

      {/* Expanded 7 Criteria Checklist */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between pt-2 pb-1">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Bảng Chấm Điểm 7 Tiêu Chí Product Identity
            </span>
            <span className="text-[10px] text-slate-400 italic">
              *Product Fidelity là ưu tiên tuyệt đối
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. Color */}
            <CriterionRow label="1. Màu sắc (Color)" item={qc.colorFidelity} />
            {/* 2. Shape */}
            <CriterionRow label="2. Hình dáng / Form tổng thể" item={qc.shapeFidelity} />
            {/* 3. Proportion */}
            <CriterionRow label="3. Tỷ lệ (Proportion)" item={qc.proportionFidelity} />
            {/* 4. Logo */}
            <CriterionRow label="4. Logo / Chữ / Nhãn hiệu" item={qc.logoFidelity} />
            {/* 5. Details */}
            <CriterionRow label="5. Chi tiết nhận dạng đặc trưng" item={qc.detailFidelity} />
            {/* 6. Parts Count */}
            <CriterionRow label="6. Số lượng bộ phận / Phụ kiện" item={qc.partsCountFidelity} />
            {/* 7. No Hallucinated Details */}
            <div className="sm:col-span-2">
              <CriterionRow
                label="7. Không xuất hiện chi tiết mới (No Hallucinations)"
                item={qc.noHallucinatedDetails}
              />
            </div>
          </div>

          {qc.verdictReason && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
              <strong className="text-amber-400 block mb-0.5 font-bold uppercase tracking-wider">
                Nhận định Trưởng ban Kiểm định QC:
              </strong>
              <p className="leading-relaxed">{qc.verdictReason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface CriterionRowProps {
  label: string;
  item: QcCriterionResult;
}

const CriterionRow: React.FC<CriterionRowProps> = ({ label, item }) => {
  if (!item) return null;
  const status = item.status || (item.score >= 90 ? 'PASS' : item.score >= 80 ? 'REVIEW' : 'FAIL');
  const isPass = status === 'PASS';
  const isReview = status === 'REVIEW';

  const getBadgeStyle = () => {
    if (isPass) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (isReview) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  const getContainerStyle = () => {
    if (isPass) return 'bg-emerald-950/20 border-emerald-800/30 text-emerald-200';
    if (isReview) return 'bg-amber-950/20 border-amber-800/30 text-amber-200';
    return 'bg-rose-950/20 border-rose-800/30 text-rose-200';
  };

  const getIcon = () => {
    if (isPass) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (isReview) return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
  };

  return (
    <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${getContainerStyle()}`}>
      <div className="mt-0.5 shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-[11px] text-slate-200 truncate">{label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono text-slate-300 font-semibold">
              {item.score}/100
            </span>
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${getBadgeStyle()}`}
            >
              {status === 'PASS' ? 'ĐẠT' : status === 'REVIEW' ? 'CẦN XEM' : 'CHƯA ĐẠT'}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{item.note}</p>
      </div>
    </div>
  );
};

