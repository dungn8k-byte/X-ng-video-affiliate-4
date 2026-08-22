import React from 'react';
import {
  FolderArchive,
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Film,
  FileCheck2,
  Play,
  RotateCcw,
  Mic,
} from 'lucide-react';
import { ProductionProject } from '../types';
import { getAllProjects } from '../data/projectStore';

interface ProjectHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: ProductionProject) => void;
  currentProjectId?: string | null;
}

export const ProjectHistoryModal: React.FC<ProjectHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  currentProjectId,
}) => {
  if (!isOpen) return null;

  const projects = getAllProjects();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>Kho Phiên Sản Xuất (Projects History)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                  {projects.length} Projects
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Khôi phục nguyên vẹn Product Profile, Asset Bank S001-S003 & 5 Kịch bản đã duyệt.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Project List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-800/60">
          {projects.map((proj) => {
            const isCurrent = currentProjectId === proj.id;
            return (
              <div
                key={proj.id}
                className={`pt-4 first:pt-0 p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-500/50 bg-blue-950/20'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {proj.id}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã duyệt {proj.totalScriptsApproved || proj.variations.length}/5 Scripts
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(proj.lastModified).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {proj.name}
                    </h4>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>

                    {/* Features / Assets badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Giá xác minh: <strong className="text-white">{proj.verifiedPrice || proj.price}</strong>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        <Film className="w-3 h-3 text-blue-400" />
                        Asset Bank: S001, S002, S003 (Đã duyệt)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        <FileCheck2 className="w-3 h-3 text-indigo-400" />
                        Content QC: 100% PASS
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 flex sm:flex-col items-center justify-end gap-2">
                    <button
                      type="button"
                      id={`restore-proj-btn-${proj.id}`}
                      onClick={() => {
                        onSelectProject(proj);
                        onClose();
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>TIẾP TỤC PROJECT</span>
                    </button>
                    <span className="text-[10px] text-slate-500 text-center block">
                      ➔ Chuyển ngay đến Voice Factory
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Quy tắc: Không ghi đè Project cũ khi tạo sản phẩm mới.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
