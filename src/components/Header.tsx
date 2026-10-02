import React from 'react';
import { CloudStatusType } from '../types';

interface HeaderProps {
  currentDateStr: string;
  onDateChange: (newDate: string) => void;
  cloudStatus: CloudStatusType;
}

export const Header: React.FC<HeaderProps> = ({
  currentDateStr,
  onDateChange,
  cloudStatus,
}) => {
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
                Jadwal Injeksi & Balance Cairan Ruang ICU RSUD Blambangan
              </h1>
              <p className="text-xs text-teal-100">
                Pemantauan Pasien Real-Time (Terhubung ke Cloud)
              </p>
            </div>
            <div className="mt-1 sm:mt-0">{renderStatus()}</div>
          </div>
        </div>

        {/* Tanggal Navigator */}
        <div className="flex items-center gap-2 bg-teal-800/60 p-1.5 rounded-lg border border-teal-600/50 shrink-0">
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
          />
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
      </div>
    </header>
  );
};
