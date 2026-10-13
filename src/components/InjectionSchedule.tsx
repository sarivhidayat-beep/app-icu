import React, { useState } from 'react';
import { Medication } from '../types';
import {
  HOURS_SHIFT,
  PAGI_HOURS,
  SORE_HOURS,
  MALAM_HOURS,
  getHourShift,
  sortFlexibleHours,
} from '../constants';

interface InjectionScheduleProps {
  currentBed: string;
  medications: Medication[];
  onToggleHour: (medIndex: number, hour: string) => void;
  onOpenAddModal: () => void;
  onEditMed: (index: number) => void;
  onDeleteMed: (index: number) => void;
  onPrintSyringeLabel: (index: number) => void;
  onToggleStopMed?: (index: number) => void;
  onReorderMeds: (newOrder: Medication[]) => void;
  onOpenShiftPrintModal?: (
    shift: 'pagi' | 'sore' | 'malam' | 'all',
    scope?: 'current' | 'all'
  ) => void;
}

export type FilterOption = 'all' | 'pending' | 'done' | 'pagi' | 'sore' | 'malam';

export const InjectionSchedule: React.FC<InjectionScheduleProps> = ({
  currentBed,
  medications,
  onToggleHour,
  onOpenAddModal,
  onEditMed,
  onDeleteMed,
  onPrintSyringeLabel,
  onToggleStopMed,
  onReorderMeds,
  onOpenShiftPrintModal,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<'default' | 'doctor_asc' | 'name_asc'>('default');
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

  // Menghitung jumlah label terjadwal per shift (fleksibel) - hanya obat aktif yang dihitung untuk label
  const activeMeds = medications.filter((m) => !m.isStopped);
  const countPagiMeds = activeMeds.reduce(
    (acc, m) => acc + (m.hours || []).filter((h) => getHourShift(h) === 'pagi').length,
    0
  );
  const countSoreMeds = activeMeds.reduce(
    (acc, m) => acc + (m.hours || []).filter((h) => getHourShift(h) === 'sore').length,
    0
  );
  const countMalamMeds = activeMeds.reduce(
    (acc, m) => acc + (m.hours || []).filter((h) => getHourShift(h) === 'malam').length,
    0
  );

  // Compute filtered & sorted medications
  const indexedMeds = medications.map((med, originalIndex) => ({
    med,
    originalIndex,
  }));

  const filteredMeds = indexedMeds.filter(({ med }) => {
    // Search filter (mencakup nama obat, dpjp, rute, frekuensi, catatan, serta jam pemberian)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = med.name.toLowerCase().includes(q);
      const matchDoc = med.doctor?.toLowerCase().includes(q);
      const matchRoute = med.route.toLowerCase().includes(q);
      const matchFreq = med.frequency?.toLowerCase().includes(q);
      const matchNotes = med.notes?.toLowerCase().includes(q);
      // Pencarian jam pemberian injeksi (misal "08", "8", "08.00", "08:00", "12", "16", "24", dll)
      const cleanQ = q.replace(':', '.');
      const matchHour = (med.hours || []).some((h) => {
        const cleanH = h.toLowerCase().replace(':', '.');
        return cleanH.includes(cleanQ) || h.toLowerCase().includes(q);
      });
      if (!matchName && !matchDoc && !matchRoute && !matchFreq && !matchNotes && !matchHour) return false;
    }

    const scheduled = med.hours || [];
    const checked = med.checkedHours || [];

    // Filter berdasarkan jam pemberian (Shift fleksibel)
    if (filter === 'pagi') {
      return scheduled.some((h) => getHourShift(h) === 'pagi');
    }
    if (filter === 'sore') {
      return scheduled.some((h) => getHourShift(h) === 'sore');
    }
    if (filter === 'malam') {
      return scheduled.some((h) => getHourShift(h) === 'malam');
    }

    // Filter status
    if (filter === 'pending') {
      return (
        scheduled.length === 0 || scheduled.some((h) => !checked.includes(h))
      );
    }
    if (filter === 'done') {
      return (
        scheduled.length > 0 && scheduled.every((h) => checked.includes(h))
      );
    }
    return true;
  });

  if (sort === 'doctor_asc') {
    filteredMeds.sort((a, b) => (a.med.doctor || '').localeCompare(b.med.doctor || ''));
  } else if (sort === 'name_asc') {
    filteredMeds.sort((a, b) => a.med.name.localeCompare(b.med.name));
  }

  const isDragEnabled = search.trim() === '' && filter === 'all' && sort === 'default';

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragSourceIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragSourceIndex === null || dragSourceIndex === targetIdx) return;
    const reordered = [...medications];
    const [moved] = reordered.splice(dragSourceIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    onReorderMeds(reordered);
    setDragSourceIndex(null);
  };

  return (
    <div className="p-5 text-slate-800 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-100">Daftar Terapi Injeksi</h4>
          {filter === 'pagi' && (
            <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              Obat Pagi (07.00 - 14.00)
            </span>
          )}
          {filter === 'sore' && (
            <span className="text-xs bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
              Obat Sore (15.00 - 21.00)
            </span>
          )}
          {filter === 'malam' && (
            <span className="text-xs bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Obat Malam (22.00 - 06.00)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 print-hidden">
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari obat, dokter, jam (misal 08.00)..."
              className="pl-8 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-56 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Filter Dropdown dengan opsi Jam Pemberian Injeksi */}
          <select
            id="filterMed"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer font-medium"
          >
            <option value="all">Semua Status</option>
            <optgroup label="Shift / Jam Pemberian">
              <option value="pagi">Obat Pagi (07.00 - 14.00)</option>
              <option value="sore">Obat Sore (15.00 - 21.00)</option>
              <option value="malam">Obat Malam (22.00 - 06.00)</option>
            </optgroup>
            <optgroup label="Status Pemberian">
              <option value="pending">Belum Tercentang (Pending)</option>
              <option value="done">Sudah Selesai</option>
            </optgroup>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer font-medium"
          >
            <option value="default">Urutan Default</option>
            <option value="doctor_asc">Nama Dokter (A-Z)</option>
            <option value="name_asc">Nama Obat (A-Z)</option>
          </select>

          {onOpenShiftPrintModal && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() =>
                  onOpenShiftPrintModal(
                    filter === 'pagi' || filter === 'sore' || filter === 'malam'
                      ? filter
                      : 'pagi',
                    'current'
                  )
                }
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Cetak etiket spuit per shift untuk pasien di bed ini"
              >
                <i className="fa-solid fa-print text-purple-600"></i>
                <span>Spuit Shift (Bed Ini)</span>
              </button>

              <button
                onClick={() =>
                  onOpenShiftPrintModal(
                    filter === 'pagi' || filter === 'sore' || filter === 'malam'
                      ? filter
                      : 'pagi',
                    'all'
                  )
                }
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Cetak seluruh etiket spuit untuk SEMUA pasien sekaligus sesuai shift"
              >
                <i className="fa-solid fa-users"></i>
                <span>Cetak Spuit Semua Pasien</span>
              </button>
            </div>
          )}

          <button
            onClick={onOpenAddModal}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Tambah Obat</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Pill Buttons untuk Jam Pemberian Injeksi */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-xs print-hidden">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mr-1 flex items-center gap-1">
          <i className="fa-solid fa-clock text-slate-400"></i> Jam:
        </span>
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer ${
            filter === 'all'
              ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('pagi')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
            filter === 'pagi'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
          }`}
        >
          <i className="fa-solid fa-sun text-amber-500"></i>
          <span>Obat Pagi (07.00 - 14.00)</span>
          <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded-full font-bold">
            {countPagiMeds}
          </span>
        </button>
        <button
          onClick={() => setFilter('sore')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
            filter === 'sore'
              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
              : 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60'
          }`}
        >
          <i className="fa-solid fa-cloud-sun text-orange-500"></i>
          <span>Obat Sore (15.00 - 21.00)</span>
          <span className="text-[10px] bg-orange-200/60 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 px-1.5 py-0.2 rounded-full font-bold">
            {countSoreMeds}
          </span>
        </button>
        <button
          onClick={() => setFilter('malam')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
            filter === 'malam'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
          }`}
        >
          <i className="fa-solid fa-moon text-indigo-400"></i>
          <span>Obat Malam (22.00 - 06.00)</span>
          <span className="text-[10px] bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">
            {countMalamMeds}
          </span>
        </button>

        {onOpenShiftPrintModal && (
          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            {filter === 'pagi' ? (
              <>
                <button
                  onClick={() => onOpenShiftPrintModal('pagi', 'current')}
                  className="bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Cetak etiket spuit obat pagi untuk bed ini"
                >
                  <i className="fa-solid fa-print text-amber-700 dark:text-amber-400"></i>
                  <span>Spuit Pagi ({countPagiMeds})</span>
                </button>
                <button
                  onClick={() => onOpenShiftPrintModal('pagi', 'all')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  title="Cetak seluruh etiket spuit obat pagi untuk SEMUA pasien"
                >
                  <i className="fa-solid fa-users"></i>
                  <span>Spuit Pagi (Semua Pasien)</span>
                </button>
              </>
            ) : filter === 'sore' ? (
              <>
                <button
                  onClick={() => onOpenShiftPrintModal('sore', 'current')}
                  className="bg-orange-100 dark:bg-orange-950/60 hover:bg-orange-200 dark:hover:bg-orange-900/60 text-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-800 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Cetak etiket spuit obat sore untuk bed ini"
                >
                  <i className="fa-solid fa-print text-orange-700 dark:text-orange-400"></i>
                  <span>Spuit Sore ({countSoreMeds})</span>
                </button>
                <button
                  onClick={() => onOpenShiftPrintModal('sore', 'all')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  title="Cetak seluruh etiket spuit obat sore untuk SEMUA pasien"
                >
                  <i className="fa-solid fa-users"></i>
                  <span>Spuit Sore (Semua Pasien)</span>
                </button>
              </>
            ) : filter === 'malam' ? (
              <>
                <button
                  onClick={() => onOpenShiftPrintModal('malam', 'current')}
                  className="bg-indigo-100 dark:bg-indigo-950/60 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800 font-semibold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Cetak etiket spuit obat malam untuk bed ini"
                >
                  <i className="fa-solid fa-print text-indigo-700 dark:text-indigo-400"></i>
                  <span>Spuit Malam ({countMalamMeds})</span>
                </button>
                <button
                  onClick={() => onOpenShiftPrintModal('malam', 'all')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                  title="Cetak seluruh etiket spuit obat malam untuk SEMUA pasien"
                >
                  <i className="fa-solid fa-users"></i>
                  <span>Spuit Malam (Semua Pasien)</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenShiftPrintModal('pagi', 'all')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                title="Cetak etiket spuit semua pasien per shift"
              >
                <i className="fa-solid fa-users"></i>
                <span>Cetak Spuit Semua Pasien</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
              <th className="py-3 px-3 w-56">Nama Obat & Catatan</th>
              <th className="py-3 px-2 w-28">Dosis / Frekuensi</th>
              <th className="py-3 px-2 w-20">Rute</th>
              <th className="py-3 px-3">
                Jam Pemberian (Centang Jika Sudah Diberikan)
                {filter === 'pagi' && (
                  <span className="ml-2 font-normal text-amber-700 dark:text-amber-400 normal-case">
                    — Menampilkan jadwal shift pagi
                  </span>
                )}
                {filter === 'sore' && (
                  <span className="ml-2 font-normal text-orange-700 dark:text-orange-400 normal-case">
                    — Menampilkan jadwal shift sore
                  </span>
                )}
                {filter === 'malam' && (
                  <span className="ml-2 font-normal text-indigo-700 dark:text-indigo-400 normal-case">
                    — Menampilkan jadwal shift malam
                  </span>
                )}
              </th>
              <th className="py-3 px-2 w-32 text-center print-hidden">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {medications.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-900/60">
                  <i className="fa-solid fa-pills text-3xl mb-2 text-slate-300 dark:text-slate-600 block"></i>
                  Belum ada daftar obat injeksi untuk {currentBed}.
                  <br />
                  Klik &quot;Tambah Obat&quot; untuk memulai.
                </td>
              </tr>
            ) : filteredMeds.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-900/60">
                  <i className="fa-solid fa-magnifying-glass text-2xl mb-1 text-slate-300 dark:text-slate-600 block"></i>
                  Tidak ada obat injeksi yang cocok dengan pencarian / filter{' '}
                  <strong>
                    {filter === 'pagi'
                      ? 'Obat Pagi (07.00 - 14.00)'
                      : filter === 'sore'
                      ? 'Obat Sore (15.00 - 21.00)'
                      : filter === 'malam'
                      ? 'Obat Malam (22.00 - 06.00)'
                      : search
                      ? `"${search}"`
                      : 'saat ini'}
                  </strong>
                  .
                </td>
              </tr>
            ) : (
              filteredMeds.map(({ med, originalIndex }, loopIndex) => {
                // Tampilan warna netral (bersih) tanpa warna-warni pelangi
                const rowBg = loopIndex % 2 === 0
                  ? 'bg-white dark:bg-slate-900'
                  : 'bg-slate-50/70 dark:bg-slate-800/40';
                const scheduledHours = sortFlexibleHours(med.hours || []);

                // Filter hours yang relevan sesuai filter yang dipilih
                let displayHours = scheduledHours;
                if (filter === 'pagi') {
                  displayHours = scheduledHours.filter((h) => getHourShift(h) === 'pagi');
                } else if (filter === 'sore') {
                  displayHours = scheduledHours.filter((h) => getHourShift(h) === 'sore');
                } else if (filter === 'malam') {
                  displayHours = scheduledHours.filter((h) => getHourShift(h) === 'malam');
                } else if (filter === 'pending') {
                  displayHours = scheduledHours.filter(
                    (h) => !(med.checkedHours && med.checkedHours.includes(h))
                  );
                }

                // Cek shift apa saja yang ada pada obat ini untuk badge indikator
                const hasPagi = scheduledHours.some((h) => getHourShift(h) === 'pagi');
                const hasSore = scheduledHours.some((h) => getHourShift(h) === 'sore');
                const hasMalam = scheduledHours.some((h) => getHourShift(h) === 'malam');

                const isStopped = Boolean(med.isStopped);
                const finalRowBg = isStopped
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-l-4 border-l-rose-500'
                  : rowBg;

                return (
                  <tr
                    key={originalIndex}
                    draggable={isDragEnabled}
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, originalIndex)}
                    className={`${finalRowBg} hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition border-b border-slate-200 dark:border-slate-800 group ${
                      dragSourceIndex === originalIndex ? 'opacity-40 border-dashed border-teal-500' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-base md:text-lg leading-snug ${isStopped ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                          {med.name}
                        </span>
                        {isStopped && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow-xs tracking-wider flex items-center gap-1">
                            <i className="fa-solid fa-ban"></i> DI-STOP
                          </span>
                        )}
                      </div>
                      {isStopped && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                          <i className="fa-solid fa-circle-exclamation"></i>
                          <span>Terapi Di-Stop DPJP (Tidak Masuk Label Spuit)</span>
                        </div>
                      )}
                      {med.doctor && (
                        <div className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <i className="fa-solid fa-user-doctor text-slate-400 text-xs"></i>
                          <span>{med.doctor}</span>
                        </div>
                      )}
                      {/* Catatan / Instruksi Khusus */}
                      {med.notes && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-200 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700 rounded-md px-2 py-1 shadow-2xs">
                          <i className="fa-solid fa-note-sticky text-amber-600 dark:text-amber-400 text-xs mt-0.5 shrink-0"></i>
                          <span className="font-medium leading-tight">{med.notes}</span>
                        </div>
                      )}
                      {/* Badge ringkasan shift obat (Warna khas shift seperti semula) */}
                      <div className="flex items-center gap-1 mt-1 print-hidden">
                        {hasPagi && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pagi
                          </span>
                        )}
                        {hasSore && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                            Sore
                          </span>
                        )}
                        {hasMalam && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Malam
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-700 dark:text-slate-200 font-semibold text-sm">
                      <div className={isStopped ? 'line-through text-slate-400 dark:text-slate-500' : ''}>{med.dose}</div>
                      {med.frequency && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                          {med.frequency}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 rounded-md font-bold text-[10px] shadow-2xs">
                        {med.route}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {isStopped ? (
                        <div className="flex items-center gap-2 py-1">
                          <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                            <i className="fa-solid fa-ban"></i> Terapi Di-stop
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Jadwal tidak aktif</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {scheduledHours.length === 0 ? (
                            <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                              Belum ada jadwal
                            </span>
                          ) : displayHours.length === 0 ? (
                            <span className="text-teal-600 dark:text-teal-400 font-semibold italic text-[11px] flex items-center gap-1">
                              <i className="fa-solid fa-check-double"></i>
                              Selesai
                            </span>
                          ) : (
                            displayHours.map((h) => {
                              const isChecked =
                                med.checkedHours && med.checkedHours.includes(h);
                              return (
                                <label
                                  key={h}
                                  className={`inline-flex items-center justify-center cursor-pointer border rounded px-1.5 py-1 shadow-sm transition ${
                                    isChecked
                                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700'
                                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                  }`}
                                  title={`Tandai injeksi jam ${h}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={Boolean(isChecked)}
                                    onChange={() => onToggleHour(originalIndex, h)}
                                    className="w-4 h-4 text-teal-600 dark:text-teal-500 rounded cursor-pointer mr-1 print:w-3 print:h-3"
                                  />
                                  <span
                                    className={`text-sm font-mono ${
                                      isChecked
                                        ? 'font-bold text-teal-700 dark:text-teal-300 line-through'
                                        : 'text-slate-800 dark:text-slate-100 font-semibold'
                                    }`}
                                  >
                                    {h}
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center print-hidden whitespace-nowrap">
                      <div className="flex items-center justify-center gap-0.5">
                        {isDragEnabled && (
                          <button
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 transition rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Tahan dan geser untuk memindahkan urutan"
                          >
                            <i className="fa-solid fa-grip-vertical"></i>
                          </button>
                        )}
                        {onToggleStopMed && (
                          <button
                            onClick={() => onToggleStopMed(originalIndex)}
                            className={`p-1.5 rounded bg-white dark:bg-slate-800 border transition shadow-sm cursor-pointer ${
                              isStopped
                                ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            }`}
                            title={isStopped ? 'Aktifkan Kembali Terapi Obat' : 'Stop Pemberian Obat Ini'}
                          >
                            <i className={`fa-solid ${isStopped ? 'fa-play' : 'fa-ban'}`}></i>
                          </button>
                        )}
                        <button
                          onClick={() => onEditMed(originalIndex)}
                          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          onClick={() => onDeleteMed(originalIndex)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 hover:bg-red-50 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
                          title="Hapus"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                        {isStopped ? (
                          <button
                            disabled
                            className="text-slate-300 dark:text-slate-600 p-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-transparent cursor-not-allowed"
                            title="Obat Di-Stop (Tidak dapat dicetak label spuit)"
                          >
                            <i className="fa-solid fa-print"></i>
                          </button>
                        ) : (
                          <button
                            onClick={() => onPrintSyringeLabel(originalIndex)}
                            className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-200 hover:bg-purple-50 dark:hover:bg-slate-700 transition shadow-sm cursor-pointer"
                            title="Cetak Label Spuit"
                          >
                            <i className="fa-solid fa-print"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
