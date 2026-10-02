import React from 'react';
import { DEFAULT_BEDS } from '../constants';
import { DayBedsData } from '../types';

interface SidebarProps {
  beds: string[];
  currentBed: string;
  onSelectBed: (bed: string) => void;
  dayBeds: DayBedsData;
  onOpenBedModal: () => void;
  onDeleteExtraBed: (bed: string) => void;
  onCopyPrevDay: () => void;
  onUndoCopy: () => void;
  undoSeconds: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  beds,
  currentBed,
  onSelectBed,
  dayBeds,
  onOpenBedModal,
  onDeleteExtraBed,
  onCopyPrevDay,
  onUndoCopy,
  undoSeconds,
}) => {
  return (
    <aside className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 shrink-0 h-fit md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar z-30">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        Daftar Ruangan / Bed
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2">
        {beds.map((bed) => {
          const isSelected = bed === currentBed;
          const isCustom = !DEFAULT_BEDS.includes(bed);
          const bedData = dayBeds[bed];
          const patientName = bedData?.patient?.name?.trim();

          return (
            <button
              key={bed}
              onClick={() => onSelectBed(bed)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition border cursor-pointer group ${
                isSelected
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 shadow-sm'
              }`}
            >
              <span className="flex items-center gap-2 truncate max-w-[50%]">
                <i
                  className={`fa-solid fa-bed shrink-0 ${
                    isSelected
                      ? 'text-teal-200'
                      : 'text-slate-400 group-hover:text-teal-400'
                  }`}
                ></i>
                <span className="truncate">{bed}</span>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  title={patientName || 'Bed Kosong'}
                  className={`text-[10px] px-2 py-0.5 rounded font-bold truncate max-w-[85px] sm:max-w-[100px] ${
                    isSelected
                      ? 'bg-teal-500 text-white'
                      : patientName
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-100 text-slate-400 italic'
                  }`}
                >
                  {patientName || 'Kosong'}
                </span>
                {isCustom && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteExtraBed(bed);
                    }}
                    className="text-slate-300 hover:text-red-500 px-1 py-0.5 hover:bg-red-50 rounded transition flex items-center justify-center cursor-pointer"
                    title="Hapus Bed"
                  >
                    <i className="fa-solid fa-times"></i>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tombol Tambah Extra Bed */}
      <button
        onClick={onOpenBedModal}
        className="w-full mt-3 text-xs border-2 border-dashed border-slate-300 text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-400 font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <i className="fa-solid fa-plus"></i>
        <span>Tambah Extra Bed</span>
      </button>

      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onCopyPrevDay}
          className="w-full text-xs bg-slate-50 hover:bg-teal-50 text-teal-700 font-semibold py-2.5 px-3 rounded-lg border border-slate-200 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <i className="fa-solid fa-copy"></i>
          <span>Salin Data Kemarin</span>
        </button>

        {undoSeconds !== null && (
          <button
            onClick={onUndoCopy}
            className="w-full text-xs bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 px-3 rounded-lg border border-red-200 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer animate-pulse"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span>Batal Salin ({undoSeconds}s)</span>
          </button>
        )}
      </div>
    </aside>
  );
};
