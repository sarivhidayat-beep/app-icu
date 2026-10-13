import React, { useState } from 'react';
import { PatientDietItem } from '../types';
import { HOURS_START_08, sortHoursFrom08 } from '../constants';

interface DietSectionProps {
  diets: PatientDietItem[];
  onAddDiet: (diet: Omit<PatientDietItem, 'id'>) => void;
  onUpdateDiet: (id: string, updated: Partial<PatientDietItem>) => void;
  onDeleteDiet: (id: string) => void;
  onToggleDietHour: (id: string, hour: string) => void;
  onReorderDiets?: (newDiets: PatientDietItem[]) => void;
}

export const DietSection: React.FC<DietSectionProps> = ({
  diets,
  onAddDiet,
  onUpdateDiet,
  onDeleteDiet,
  onToggleDietHour,
  onReorderDiets,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [route, setRoute] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [customHourInput, setCustomHourInput] = useState('');

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
    if (dragSourceIndex === null || dragSourceIndex === targetIdx || !onReorderDiets) return;
    const reordered = [...diets];
    const [moved] = reordered.splice(dragSourceIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    onReorderDiets(reordered);
    setDragSourceIndex(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setRoute('NGT');
    setNotes('');
    setSelectedHours(sortHoursFrom08(['08.00', '11.00', '14.00', '17.00', '20.00', '23.00']));
    setCustomHourInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: PatientDietItem) => {
    setEditingId(item.id);
    setName(item.name || '');
    setRoute(item.route || '');
    setNotes(item.notes || '');
    setSelectedHours(sortHoursFrom08(item.hours || []));
    setCustomHourInput('');
    setIsModalOpen(true);
  };

  const handleToggleHourSelect = (hour: string) => {
    setSelectedHours((prev) => {
      if (prev.includes(hour)) {
        return prev.filter((h) => h !== hour);
      } else {
        return sortHoursFrom08([...prev, hour]);
      }
    });
  };

  const handleAddCustomHour = () => {
    if (!customHourInput.trim()) return;
    let formatted = customHourInput.trim().replace(':', '.');
    if (!formatted.includes('.')) formatted += '.00';
    if (!selectedHours.includes(formatted)) {
      setSelectedHours(sortHoursFrom08([...selectedHours, formatted]));
    }
    setCustomHourInput('');
  };

  const applyPreset = (presetHours: string[]) => {
    setSelectedHours(sortHoursFrom08(presetHours));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      onUpdateDiet(editingId, {
        name: name.trim(),
        route: route.trim(),
        notes: notes.trim(),
        hours: sortHoursFrom08(selectedHours),
      });
    } else {
      onAddDiet({
        name: name.trim(),
        route: route.trim(),
        notes: notes.trim(),
        hours: sortHoursFrom08(selectedHours),
        checkedHours: [],
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="diet-section bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm shadow-2xs">
            <i className="fa-solid fa-utensils"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Diet / Makanan Pasien
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Jenis diet, jadwal pemberian & catatan nutrisi
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="print-hidden bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span>Tambah Diet</span>
        </button>
      </div>

      {/* Content List */}
      {diets.length === 0 ? (
        <div className="text-center py-5 px-3 bg-amber-50/40 dark:bg-amber-950/20 border border-dashed border-amber-200 dark:border-amber-800/60 rounded-xl">
          <i className="fa-solid fa-bowl-food text-amber-300 dark:text-amber-600 text-2xl mb-1.5"></i>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Belum ada data diet / nutrisi pasien.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Klik tombol di bawah untuk menambahkan jenis diet & jadwal jam pemberian.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2.5 print-hidden inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 shadow-2xs transition cursor-pointer"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Tambah Data Diet</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {diets.map((diet, idx) => {
            const hours = sortHoursFrom08(diet.hours || []);
            const checkedHours = diet.checkedHours || [];

            return (
              <div
                key={diet.id}
                draggable={Boolean(onReorderDiets && diets.length > 1)}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className={`p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition ${
                  dragSourceIndex === idx ? 'opacity-40 border-dashed border-amber-500' : ''
                }`}
              >
                {/* Baris Atas: Nama Diet, Rute, Catatan & Tombol Aksi */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {onReorderDiets && diets.length > 1 && (
                        <span
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing p-1 -ml-1 print-hidden"
                          title="Tarik (drag) untuk memindahkan urutan diet"
                        >
                          <i className="fa-solid fa-grip-vertical text-xs"></i>
                        </span>
                      )}
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {diet.name}
                      </span>
                      {diet.route && (
                        <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          {diet.route}
                        </span>
                      )}
                    </div>

                    {/* CATATAN PADA DIET DIBUAT JAUH LEBIH TERLIHAT */}
                    {diet.notes && (
                      <div className="mt-2 mb-1.5 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 py-1.5 px-2.5 rounded-r-lg shadow-2xs">
                        <div className="flex items-start gap-2">
                          <i className="fa-solid fa-clipboard-list text-amber-600 dark:text-amber-400 text-sm mt-0.5 shrink-0"></i>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 dark:text-amber-300 block">
                              Catatan / Instruksi Khusus Diet:
                            </span>
                            <span className="text-xs font-bold text-amber-950 dark:text-amber-100 leading-snug break-words">
                              {diet.notes}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 print-hidden shrink-0">
                    <button
                      onClick={() => openEditModal(diet)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Edit diet"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus diet "${diet.name}"?`)) {
                          onDeleteDiet(diet.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Hapus diet"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* Jam Pemberian Diet */}
                {hours.length > 0 ? (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-clock text-amber-500 text-[10px]"></i>
                      <span>Jam Pemberian (klik untuk tandai sudah diberikan):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hours.map((h) => {
                        const isDone = checkedHours.includes(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => onToggleDietHour(diet.id, h)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border flex items-center gap-1 cursor-pointer ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-700'
                            }`}
                            title={isDone ? `Jam ${h} sudah diberikan (klik untuk batal)` : `Jam ${h} belum diberikan (klik untuk tandai)`}
                          >
                            <i
                              className={`fa-solid ${
                                isDone ? 'fa-check text-[10px]' : 'fa-circle text-[6px] text-slate-300 dark:text-slate-600'
                              }`}
                            ></i>
                            <span>{h}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                    Belum ada jam pemberian yang diatur untuk diet ini.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Diet */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto transform transition-all max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-utensils"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {editingId ? 'Edit Diet Pasien' : 'Tambah Diet Pasien'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bebas menulis jenis diet dan menentukan jam pemberian
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jenis Diet / Makanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bebas tulis apa saja: Sonde MC 6x200cc, Diet Lunak RG, Puasa..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rute / Jalur Pemberian
                  </label>
                  <input
                    type="text"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                    placeholder="Contoh: NGT, Oral, OGT, Gastrostomi..."
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan / Target Nutrisi
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Target 1500 kkal, residu < 50cc..."
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Opsi Jam Diet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opsi Jam Pemberian Diet ({selectedHours.length} jam dipilih)
                </label>

                {/* Preset Cepat */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Preset:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00', '12.00', '16.00', '20.00', '00.00', '04.00'])}
                    className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                    title="Jadwal diet per 4 jam: 08, 12, 16, 20, 24/00, 04"
                  >
                    Per 4 Jam (08, 12, 16, 20, 24, 04)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00', '12.00', '16.00', '20.00'])}
                    className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                    title="Jadwal diet per 6 jam: 08, 12, 16, 20"
                  >
                    Per 6 Jam (08, 12, 16, 20)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00', '12.00', '16.00'])}
                    className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                    title="Jadwal diet per 3 jam: 08, 12, 16"
                  >
                    Per 3 Jam (08, 12, 16)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00', '11.00', '14.00', '17.00', '20.00', '23.00'])}
                    className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                    title="Sonde 6x: 08, 11, 14, 17, 20, 23"
                  >
                    Sonde 6x (08, 11, 14, 17, 20, 23)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([])}
                    className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    Kosongkan / Puasa
                  </button>
                </div>

                {/* Grid Pilihan Jam 24 Jam Dimulai 08.00 */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl mb-2.5 max-h-36 overflow-y-auto">
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold mb-1.5 flex items-center justify-between">
                    <span>Pilihan Jam (Dimulai Jam 08.00):</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">08.00 s/d 07.00</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                    {HOURS_START_08.map((h) => {
                      const isSel = selectedHours.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleToggleHourSelect(h)}
                          className={`py-1 px-1.5 text-xs font-mono rounded-lg transition border text-center cursor-pointer ${
                            isSel
                              ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Jam Kustom */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customHourInput}
                    onChange={(e) => setCustomHourInput(e.target.value)}
                    placeholder="Ketik jam lain (misal: 10.30)"
                    className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomHour}
                    disabled={!customHourInput.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
                  >
                    Tambah Jam
                  </button>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
                >
                  Simpan Diet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
