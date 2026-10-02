import React, { useState } from 'react';
import { Medication } from '../types';
import { HOURS_SHIFT, PAGI_HOURS, SORE_HOURS, MALAM_HOURS } from '../constants';

interface InjectionScheduleProps {
  currentBed: string;
  medications: Medication[];
  onToggleHour: (medIndex: number, hour: string) => void;
  onOpenAddModal: () => void;
  onEditMed: (index: number) => void;
  onDeleteMed: (index: number) => void;
  onPrintSyringeLabel: (index: number) => void;
  onReorderMeds: (newOrder: Medication[]) => void;
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
  onReorderMeds,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sort, setSort] = useState<'default' | 'doctor_asc' | 'name_asc'>('default');
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

  // Compute filtered & sorted medications
  const indexedMeds = medications.map((med, originalIndex) => ({
    med,
    originalIndex,
  }));

  const filteredMeds = indexedMeds.filter(({ med }) => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = med.name.toLowerCase().includes(q);
      const matchDoc = med.doctor?.toLowerCase().includes(q);
      const matchRoute = med.route.toLowerCase().includes(q);
      if (!matchName && !matchDoc && !matchRoute) return false;
    }

    const scheduled = med.hours || [];
    const checked = med.checkedHours || [];

    // Filter berdasarkan jam pemberian (Shift)
    if (filter === 'pagi') {
      return scheduled.some((h) => PAGI_HOURS.includes(h));
    }
    if (filter === 'sore') {
      return scheduled.some((h) => SORE_HOURS.includes(h));
    }
    if (filter === 'malam') {
      return scheduled.some((h) => MALAM_HOURS.includes(h));
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

  const bgColors = [
    'bg-sky-50/40',
    'bg-emerald-50/40',
    'bg-amber-50/40',
    'bg-purple-50/40',
    'bg-rose-50/40',
    'bg-indigo-50/40',
  ];

  return (
    <div className="p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-700">Daftar Terapi Injeksi</h4>
          {filter === 'pagi' && (
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              Obat Pagi (07.00 - 14.00)
            </span>
          )}
          {filter === 'sore' && (
            <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full border border-orange-200">
              Obat Sore (15.00 - 21.00)
            </span>
          )}
          {filter === 'malam' && (
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
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
              placeholder="Cari obat / dokter..."
              className="pl-8 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-44 transition"
            />
          </div>

          {/* Filter Dropdown dengan opsi Jam Pemberian Injeksi */}
          <select
            id="filterMed"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterOption)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white transition cursor-pointer font-medium"
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
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 outline-none bg-white transition cursor-pointer"
          >
            <option value="default">Urutan Default</option>
            <option value="doctor_asc">Nama Dokter (A-Z)</option>
            <option value="name_asc">Nama Obat (A-Z)</option>
          </select>

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
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('pagi')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
            filter === 'pagi'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <i className="fa-solid fa-sun text-amber-500"></i>
          <span>Obat Pagi (07.00 - 14.00)</span>
        </button>
        <button
          onClick={() => setFilter('sore')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
            filter === 'sore'
              ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
              : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
          }`}
        >
          <i className="fa-solid fa-cloud-sun text-orange-500"></i>
          <span>Obat Sore (15.00 - 21.00)</span>
        </button>
        <button
          onClick={() => setFilter('malam')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition border cursor-pointer flex items-center gap-1.5 ${
            filter === 'malam'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <i className="fa-solid fa-moon text-indigo-400"></i>
          <span>Obat Malam (22.00 - 06.00)</span>
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <th className="py-3 px-3 w-48">Nama Obat</th>
              <th className="py-3 px-2 w-24">Dosis</th>
              <th className="py-3 px-2 w-20">Rute</th>
              <th className="py-3 px-3">
                Jam Pemberian (Centang Jika Sudah Diberikan)
                {filter === 'pagi' && (
                  <span className="ml-2 font-normal text-amber-700 normal-case">
                    — Menampilkan jadwal shift pagi
                  </span>
                )}
                {filter === 'sore' && (
                  <span className="ml-2 font-normal text-orange-700 normal-case">
                    — Menampilkan jadwal shift sore
                  </span>
                )}
                {filter === 'malam' && (
                  <span className="ml-2 font-normal text-indigo-700 normal-case">
                    — Menampilkan jadwal shift malam
                  </span>
                )}
              </th>
              <th className="py-3 px-2 w-32 text-center print-hidden">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medications.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400 italic bg-slate-50">
                  <i className="fa-solid fa-pills text-3xl mb-2 text-slate-300 block"></i>
                  Belum ada daftar obat injeksi untuk {currentBed}.
                  <br />
                  Klik &quot;Tambah Obat&quot; untuk memulai.
                </td>
              </tr>
            ) : filteredMeds.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 italic bg-slate-50">
                  <i className="fa-solid fa-magnifying-glass text-2xl mb-1 text-slate-300 block"></i>
                  Tidak ada obat injeksi yang dijadwalkan pada filter{' '}
                  <strong>
                    {filter === 'pagi'
                      ? 'Obat Pagi (07.00 - 14.00)'
                      : filter === 'sore'
                      ? 'Obat Sore (15.00 - 21.00)'
                      : filter === 'malam'
                      ? 'Obat Malam (22.00 - 06.00)'
                      : 'saat ini'}
                  </strong>
                  .
                </td>
              </tr>
            ) : (
              filteredMeds.map(({ med, originalIndex }, loopIndex) => {
                const rowBg = bgColors[loopIndex % bgColors.length];
                const scheduledHours = (med.hours || []).sort(
                  (a, b) => HOURS_SHIFT.indexOf(a) - HOURS_SHIFT.indexOf(b)
                );

                // Filter hours yang relevan sesuai filter yang dipilih
                let displayHours = scheduledHours;
                if (filter === 'pagi') {
                  displayHours = scheduledHours.filter((h) => PAGI_HOURS.includes(h));
                } else if (filter === 'sore') {
                  displayHours = scheduledHours.filter((h) => SORE_HOURS.includes(h));
                } else if (filter === 'malam') {
                  displayHours = scheduledHours.filter((h) => MALAM_HOURS.includes(h));
                } else if (filter === 'pending') {
                  displayHours = scheduledHours.filter(
                    (h) => !(med.checkedHours && med.checkedHours.includes(h))
                  );
                }

                // Cek shift apa saja yang ada pada obat ini untuk badge indikator
                const hasPagi = scheduledHours.some((h) => PAGI_HOURS.includes(h));
                const hasSore = scheduledHours.some((h) => SORE_HOURS.includes(h));
                const hasMalam = scheduledHours.some((h) => MALAM_HOURS.includes(h));

                return (
                  <tr
                    key={originalIndex}
                    draggable={isDragEnabled}
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, originalIndex)}
                    className={`${rowBg} hover:opacity-95 transition border-b border-slate-200 group ${
                      dragSourceIndex === originalIndex ? 'opacity-40 border-dashed border-teal-500' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800 text-base md:text-lg leading-snug">
                        {med.name}
                      </div>
                      {med.doctor && (
                        <div className="text-xs md:text-sm font-medium text-slate-600 mt-0.5 flex items-center gap-1.5">
                          <i className="fa-solid fa-user-doctor text-slate-400 text-xs"></i>
                          <span>{med.doctor}</span>
                        </div>
                      )}
                      {/* Badge ringkasan shift obat */}
                      <div className="flex items-center gap-1 mt-1 print-hidden">
                        {hasPagi && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Pagi
                          </span>
                        )}
                        {hasSore && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            Sore
                          </span>
                        )}
                        {hasMalam && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            Malam
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-600 font-semibold text-sm">
                      {med.dose}
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-md font-semibold text-[10px] shadow-sm">
                        {med.route}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1.5">
                        {scheduledHours.length === 0 ? (
                          <span className="text-slate-400 italic text-xs">
                            Belum ada jadwal
                          </span>
                        ) : displayHours.length === 0 ? (
                          <span className="text-teal-600 font-semibold italic text-[11px] flex items-center gap-1">
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
                                    ? 'bg-teal-50 border-teal-300'
                                    : 'bg-white/80 border-slate-300 hover:bg-white'
                                }`}
                                title={`Tandai injeksi jam ${h}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(isChecked)}
                                  onChange={() => onToggleHour(originalIndex, h)}
                                  className="w-4 h-4 text-teal-600 rounded cursor-pointer mr-1 print:w-3 print:h-3"
                                />
                                <span
                                  className={`text-sm font-mono ${
                                    isChecked
                                      ? 'font-bold text-teal-700 line-through'
                                      : 'text-slate-800 font-semibold'
                                  }`}
                                >
                                  {h}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center print-hidden whitespace-nowrap">
                      <div className="flex items-center justify-center gap-0.5">
                        {isDragEnabled && (
                          <button
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1.5 transition rounded hover:bg-slate-200"
                            title="Tahan dan geser untuk memindahkan urutan"
                          >
                            <i className="fa-solid fa-grip-vertical"></i>
                          </button>
                        )}
                        <button
                          onClick={() => onEditMed(originalIndex)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded bg-white border border-transparent hover:border-blue-200 hover:bg-blue-50 transition shadow-sm cursor-pointer"
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          onClick={() => onDeleteMed(originalIndex)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded bg-white border border-transparent hover:border-red-200 hover:bg-red-50 transition shadow-sm cursor-pointer"
                          title="Hapus"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                        <button
                          onClick={() => onPrintSyringeLabel(originalIndex)}
                          className="text-slate-400 hover:text-purple-600 p-1.5 rounded bg-white border border-transparent hover:border-purple-200 hover:bg-purple-50 transition shadow-sm cursor-pointer"
                          title="Cetak Label Spuit"
                        >
                          <i className="fa-solid fa-print"></i>
                        </button>
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
