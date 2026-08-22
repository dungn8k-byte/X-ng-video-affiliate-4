import React from 'react';
import { Film, Sparkles, RefreshCw, Zap, ShieldCheck, FileText, FolderArchive } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenHistory?: () => void;
  hasData: boolean;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onOpenHistory, hasData, isLoading }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-white uppercase">
                  Xưởng Video Affiliate 4.0
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  Voice Factory
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3 text-xs font-medium uppercase tracking-wider text-slate-400">
            {onOpenHistory && (
              <button
                type="button"
                id="header-history-btn"
                onClick={onOpenHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-300 hover:text-white bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/60 rounded-lg transition-all cursor-pointer"
              >
                <FolderArchive className="w-3.5 h-3.5 text-blue-400" />
                <span>Kho Project</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-md border border-slate-800 text-[11px] text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Fidelity &gt; Beauty</span>
            </div>

            <span className="hidden sm:block h-4 w-[1px] bg-slate-800"></span>
            
            <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Hệ thống sẵn sàng</span>
            </div>

            {hasData && (
              <>
                <span className="h-4 w-[1px] bg-slate-800"></span>
                <button
                  id="header-reset-btn"
                  type="button"
                  onClick={onReset}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tạo mới</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
