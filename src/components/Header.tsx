import React, { useState, useRef, useEffect } from 'react';
import { CloudStatusType } from '../types';
import { FeedbackSettings, triggerFeedback } from '../utils/feedback';

interface HeaderProps {
  currentDateStr: string;
  onDateChange: (newDate: string) => void;
  cloudStatus: CloudStatusType;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  feedbackSettings: FeedbackSettings;
  onUpdateFeedbackSettings: (newSettings: FeedbackSettings) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDateStr,
  onDateChange,
  cloudStatus,
  isDarkMode = false,
  onToggleDarkMode,
  feedbackSettings,
  onUpdateFeedbackSettings,
}) => {
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false);
  const soundMenuRef = useRef<HTMLDivElement>(null);

  // Tutup menu sound & haptic saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        soundMenuRef.current &&
        !soundMenuRef.current.contains(event.target as Node)
      ) {
        setIsSoundMenuOpen(false);
      }
    }
    if (isSoundMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSoundMenuOpen]);

  const handleShiftDate = (days: number) => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + days);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    onDateChange(`${yr}-${mo}-${da}`);
  };

  const handleToday = () => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    onDateChange(`${yr}-${mo}-${da}`);
  };

  const isSilent = !feedbackSettings.soundEnabled && !feedbackSettings.hapticEnabled;

  const handleToggleSilent = () => {
    if (isSilent) {
      // Aktifkan kembali suara & haptik
      const newSettings: FeedbackSettings = { soundEnabled: true, hapticEnabled: true };
      onUpdateFeedbackSettings(newSettings);
      triggerFeedback('check', newSettings);
    } else {
      // Masuk ke mode silent
      onUpdateFeedbackSettings({ soundEnabled: false, hapticEnabled: false });
    }
  };

  const renderStatus = () => {
    switch (cloudStatus) {
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 text-[10px] bg-teal-800/80 px-2 py-1 rounded-md text-teal-100 border border-teal-600/50 w-fit">
            <i className="fa-solid fa-circle-notch animate-spin"></i> Menghubungkan...
          </span>
        );
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-[10px] bg-teal-800/80 px-2 py-1 rounded-md text-amber-200 border border-teal-600/50 w-fit">
            <i className="fa-solid fa-arrows-rotate animate-spin"></i> Menyimpan...
          </span>
        );
      case 'synced':
        return (
          <span className="flex items-center gap-1.5 text-[10px] bg-teal-800/80 px-2 py-1 rounded-md text-teal-100 border border-teal-600/50 w-fit">
            <i className="fa-solid fa-cloud text-teal-200"></i> Tersinkronisasi
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="flex items-center gap-1.5 text-[10px] bg-teal-800/80 px-2 py-1 rounded-md text-slate-200 border border-teal-600/50 w-fit">
            <i className="fa-solid fa-hard-drive"></i> Offline Mode
          </span>
        );
    }
  };

  return (
    <header className="bg-teal-700 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-cloud-arrow-up text-2xl text-teal-200 font-bold shrink-0"></i>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <div>
              <h1 className="text-xl font-bold leading-tight">
                Jadwal Injeksi ICU RSUD Blambangan
              </h1>
            </div>
            <div className="mt-1 sm:mt-0">{renderStatus()}</div>
          </div>
        </div>

        {/* Action & Tanggal Navigator */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Menu Sound & Haptic Feedback */}
          <div className="relative" ref={soundMenuRef}>
            <button
              onClick={() => setIsSoundMenuOpen((prev) => !prev)}
              className={`p-2 sm:px-3 sm:py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 text-xs font-bold border ${
                isSilent
                  ? 'bg-rose-900/80 hover:bg-rose-900 text-rose-200 border-rose-500/60'
                  : 'bg-teal-800/80 hover:bg-teal-900 text-teal-100 hover:text-white border border-teal-500/60'
              }`}
              title={
                isSilent
                  ? 'Mode Silent Aktif (Klik untuk buka Menu Suara & Haptik)'
                  : 'Suara & Haptik Aktif (Klik untuk buka Menu Suara & Haptik)'
              }
            >
              {isSilent ? (
                <>
                  <i className="fa-solid fa-volume-xmark text-rose-300 text-sm"></i>
                  <span className="hidden sm:inline">Silent</span>
                </>
              ) : feedbackSettings.soundEnabled && feedbackSettings.hapticEnabled ? (
                <>
                  <i className="fa-solid fa-volume-high text-teal-200 text-sm"></i>
                  <i className="fa-solid fa-mobile-screen text-[10px] text-teal-300 -ml-0.5"></i>
                  <span className="hidden sm:inline">Suara & Haptik</span>
                </>
              ) : feedbackSettings.soundEnabled ? (
                <>
                  <i className="fa-solid fa-volume-high text-teal-200 text-sm"></i>
                  <span className="hidden sm:inline">Suara Aktif</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-mobile-screen text-teal-200 text-sm"></i>
                  <span className="hidden sm:inline">Getar Aktif</span>
                </>
              )}
              <i
                className={`fa-solid fa-chevron-down text-[10px] opacity-70 transition-transform ${
                  isSoundMenuOpen ? 'rotate-180' : ''
                }`}
              ></i>
            </button>

            {/* Dropdown Menu Pengaturan Suara & Haptik */}
            {isSoundMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs">
                      <i className="fa-solid fa-sliders"></i>
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        Pengaturan Suara & Haptik
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Feedback saat checklist ditekan
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSoundMenuOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md text-xs cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                {/* Tombol Cepat Silent / Aktifkan */}
                <div className="mb-3">
                  <button
                    onClick={handleToggleSilent}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      isSilent
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <i className={`fa-solid ${isSilent ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
                    <span>{isSilent ? 'Aktifkan Suara & Haptik' : 'Matikan Semua (Mode Silent)'}</span>
                  </button>
                </div>

                {/* Pilihan Mode Presets */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilihan Mode
                  </div>

                  <button
                    onClick={() => {
                      const next = { soundEnabled: true, hapticEnabled: true };
                      onUpdateFeedbackSettings(next);
                      triggerFeedback('check', next);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer border ${
                      feedbackSettings.soundEnabled && feedbackSettings.hapticEnabled
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-bell text-teal-600 dark:text-teal-400"></i>
                      <span>Suara & Getar (Aktif)</span>
                    </div>
                    {feedbackSettings.soundEnabled && feedbackSettings.hapticEnabled && (
                      <i className="fa-solid fa-check text-teal-600 dark:text-teal-400 text-xs"></i>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const next = { soundEnabled: true, hapticEnabled: false };
                      onUpdateFeedbackSettings(next);
                      triggerFeedback('check', next);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer border ${
                      feedbackSettings.soundEnabled && !feedbackSettings.hapticEnabled
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-volume-high text-cyan-600 dark:text-cyan-400"></i>
                      <span>Hanya Suara</span>
                    </div>
                    {feedbackSettings.soundEnabled && !feedbackSettings.hapticEnabled && (
                      <i className="fa-solid fa-check text-teal-600 dark:text-teal-400 text-xs"></i>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      const next = { soundEnabled: false, hapticEnabled: true };
                      onUpdateFeedbackSettings(next);
                      triggerFeedback('check', next);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer border ${
                      !feedbackSettings.soundEnabled && feedbackSettings.hapticEnabled
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-mobile-screen text-indigo-600 dark:text-indigo-400"></i>
                      <span>Hanya Getar (Haptik)</span>
                    </div>
                    {!feedbackSettings.soundEnabled && feedbackSettings.hapticEnabled && (
                      <i className="fa-solid fa-check text-teal-600 dark:text-teal-400 text-xs"></i>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onUpdateFeedbackSettings({ soundEnabled: false, hapticEnabled: false });
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition flex items-center justify-between cursor-pointer border ${
                      isSilent
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-bold'
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-volume-xmark text-rose-500"></i>
                      <span>Silent (Senyap)</span>
                    </div>
                    {isSilent && (
                      <i className="fa-solid fa-check text-rose-600 dark:text-rose-400 text-xs"></i>
                    )}
                  </button>
                </div>

                {/* Tes Suara Checklist */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => triggerFeedback('check', feedbackSettings)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Uji coba efek suara centang"
                  >
                    <i className="fa-solid fa-play text-[10px] text-teal-600 dark:text-teal-400"></i>
                    <span>Tes Centang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerFeedback('uncheck', feedbackSettings)}
                    className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Uji coba efek suara batal centang"
                  >
                    <i className="fa-solid fa-rotate-left text-[10px] text-amber-600 dark:text-amber-400"></i>
                    <span>Tes Batal</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tanggal Navigator */}
          <div className="flex items-center gap-2 bg-teal-800/60 p-1.5 rounded-lg border border-teal-600/50">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-2 hover:bg-teal-600 rounded text-teal-100 hover:text-white transition cursor-pointer"
              title="Hari Sebelumnya"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-teal-900 border border-teal-600 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
            >
            </input>
            <button
              onClick={() => handleShiftDate(1)}
              className="p-2 hover:bg-teal-600 rounded text-teal-100 hover:text-white transition cursor-pointer"
              title="Hari Berikutnya"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-xs font-semibold rounded text-white transition ml-1 cursor-pointer"
            >
              Hari Ini
            </button>
          </div>

          {/* Toggle Pilihan Tema Mode Gelap / Terang */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="bg-teal-800/80 hover:bg-teal-900 text-teal-100 hover:text-white border border-teal-500/60 p-2 sm:px-3 sm:py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 text-xs font-bold"
              title={
                isDarkMode
                  ? 'Beralih ke Mode Terang (Light Mode)'
                  : 'Beralih ke Mode Gelap (Dark Mode)'
              }
            >
              {isDarkMode ? (
                <>
                  <i className="fa-solid fa-sun text-amber-300 text-sm"></i>
                  <span className="hidden sm:inline">Mode Terang</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-moon text-teal-200 text-sm"></i>
                  <span className="hidden sm:inline">Mode Gelap</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
