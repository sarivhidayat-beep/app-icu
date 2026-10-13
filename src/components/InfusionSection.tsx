import React, { useState } from 'react';
import { ActiveInfusionItem } from '../types';
import { HOURS_START_08, sortHoursFrom08 } from '../constants';

interface InfusionSectionProps {
  infusions: ActiveInfusionItem[];
  onAddInfusion: (infusion: Omit<ActiveInfusionItem, 'id'>) => void;
  onUpdateInfusion: (id: string, updated: Partial<ActiveInfusionItem>) => void;
  onDeleteInfusion: (id: string) => void;
  onToggleInfusionHour: (id: string, hour: string) => void;
}

export const InfusionSection: React.FC<InfusionSectionProps> = ({
  infusions,
  onAddInfusion,
  onUpdateInfusion,
  onDeleteInfusion,
  onToggleInfusionHour,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [customHourInput, setCustomHourInput] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setRate('20 tpm');
    setLocation('Line 1');
    setNotes('');
    setSelectedHours(sortHoursFrom08(['08.00', '16.00', '00.00']));
    setCustomHourInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ActiveInfusionItem) => {
    setEditingId(item.id);
    setName(item.name || '');
    setRate(item.rate || '');
    setLocation(item.location || '');
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
      onUpdateInfusion(editingId, {
        name: name.trim(),
        rate: rate.trim(),
        location: location.trim(),
        notes: notes.trim(),
        hours: sortHoursFrom08(selectedHours),
      });
    } else {
      onAddInfusion({
        name: name.trim(),
        rate: rate.trim(),
        location: location.trim(),
        notes: notes.trim(),
        hours: sortHoursFrom08(selectedHours),
        checkedHours: [],
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="infusion-section bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-sm shadow-2xs">
            <i className="fa-solid fa-bottle-droplet"></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Cairan Infus Aktif
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Jenis cairan bebas diisi manual, tetesan & jadwal monitoring / ganti kolf
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="print-hidden bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span>Tambah Infus</span>
        </button>
      </div>

      {/* Content List */}
      {infusions.length === 0 ? (
        <div className="text-center py-5 px-3 bg-cyan-50/30 dark:bg-cyan-950/20 border border-dashed border-cyan-200 dark:border-cyan-800/60 rounded-xl">
          <i className="fa-solid fa-droplet text-cyan-400 dark:text-cyan-500 text-2xl mb-1.5"></i>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Belum ada cairan infus aktif terdaftar.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Klik tombol di bawah untuk mencatat cairan infus, kecepatan tetesan, dan jam pemantauan.
          </p>
          <button
            onClick={openAddModal}
            className="mt-2.5 print-hidden inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-white dark:bg-slate-800 hover:bg-cyan-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-cyan-300 dark:border-cyan-700 shadow-2xs transition cursor-pointer"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <span>Tambah Cairan Infus</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {infusions.map((inf) => {
            const hours = sortHoursFrom08(inf.hours || []);
            const checkedHours = inf.checkedHours || [];

            return (
              <div
                key={inf.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {/* Baris Atas: Nama Infus, Tetesan, Lokasi, Catatan & Aksi */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {inf.name}
                      </span>
                      {inf.rate && (
                        <span className="text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
                          {inf.rate}
                        </span>
                      )}
                      {inf.location && (
                        <span className="text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                          {inf.location}
                        </span>
                      )}
                    </div>
                    {inf.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        {inf.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 print-hidden">
                    <button
                      onClick={() => openEditModal(inf)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      title="Edit infus"
                    >
                      <i className="fa-solid fa-pen-to-square text-xs"></i>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus cairan infus "${inf.name}"?`)) {
                          onDeleteInfusion(inf.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Hapus infus"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* Jam Monitoring / Ganti Kolf */}
                {hours.length > 0 ? (
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-clock text-cyan-500 text-[10px]"></i>
                      <span>Jam Monitoring / Ganti Kolf (klik untuk tandai sudah dicek):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hours.map((h) => {
                        const isDone = checkedHours.includes(h);
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => onToggleInfusionHour(inf.id, h)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border flex items-center gap-1 cursor-pointer ${
                              isDone
                                ? 'bg-cyan-700 text-white border-cyan-700 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/40'
                            }`}
                            title={isDone ? `Jam ${h} sudah dicek / diganti (klik untuk batal)` : `Jam ${h} belum dicek (klik untuk tandai)`}
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
                    Belum ada jam monitoring / ganti kolf yang diatur untuk cairan ini.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Infus */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto transform transition-all max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-bottle-droplet"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {editingId ? 'Edit Cairan Infus' : 'Tambah Cairan Infus'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bebas menulis jenis cairan infus, kecepatan tetesan, dan jam monitoring
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
                  Jenis Cairan Infus <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bebas tulis apa saja: NaCl 0.9% 500cc/12j, Asering 20 tpm, KaEN 3B..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kecepatan / Tetesan
                  </label>
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="Contoh: 20 tpm, 83 cc/jam, 14 tpm mikro..."
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi / Jalur IV Line
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Line 1 Tangan Kanan, CVC Distal..."
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Ganti kolf tiap 12 jam, cek patensi jarum..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Opsi Jam Infus */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Opsi Jam Monitoring / Ganti Kolf ({selectedHours.length} jam dipilih)
                </label>

                {/* Preset Cepat */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 self-center mr-1">Preset:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00', '16.00', '00.00'])}
                    className="text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                  >
                    Per Shift (08, 16, 00)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00', '20.00'])}
                    className="text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                  >
                    Per 12 Jam (08, 20)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00'])}
                    className="text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                  >
                    Per 24 Jam (08.00)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(['08.00', '12.00', '16.00', '20.00', '00.00', '04.00'])}
                    className="text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 px-2 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800 transition cursor-pointer"
                  >
                    Tiap 4 Jam
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset([])}
                    className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>

                {/* Grid Pilihan Jam 24 Jam Dimulai 08.00 */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl mb-2.5 max-h-36 overflow-y-auto">
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold mb-1.5 flex items-center justify-between">
                    <span>Pilihan Jam (Dimulai Jam 08.00):</span>
                    <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold">08.00 s/d 07.00</span>
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
                              ? 'bg-cyan-600 text-white font-bold border-cyan-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/40'
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
                    className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomHour}
                    disabled={!customHourInput.trim()}
                    className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 cursor-pointer"
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
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
                >
                  Simpan Cairan Infus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
