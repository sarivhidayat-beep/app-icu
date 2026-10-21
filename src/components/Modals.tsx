import React, { useState, useEffect, useMemo } from 'react';
import { Medication, FluidColumn, DayBedsData } from '../types';
import {
  MED_ROUTES,
  HOURS_SHIFT,
  PAGI_HOURS,
  SORE_HOURS,
  MALAM_HOURS,
  COMMON_FREQUENCIES,
  FREQUENCY_SUGGESTED_HOURS,
  COMMON_MED_NOTES,
  getHourShift,
  formatFlexibleHour,
  sortFlexibleHours,
} from '../constants';
import { SyringeLabelPrintData } from '../utils/printLabel';

// --- Bed Modal ---
interface BedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bedName: string) => void;
}

export const BedModal: React.FC<BedModalProps> = ({ isOpen, onClose, onSave }) => {
  const [bedName, setBedName] = useState('');

  useEffect(() => {
    if (isOpen) setBedName('');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl w-full max-w-sm p-6 my-auto transform transition-all border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4">Tambah Extra Bed</h3>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Nama Bed Baru
          </label>
          <input
            type="text"
            value={bedName}
            onChange={(e) => setBedName(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Misal: EXTRA 1, IGD 1..."
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(bedName)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition shadow-md cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Transfer Modal ---
interface TransferModalProps {
  isOpen: boolean;
  currentBed: string;
  availableBeds: string[];
  onClose: () => void;
  onConfirm: (targetBed: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  currentBed,
  availableBeds,
  onClose,
  onConfirm,
}) => {
  const [targetBed, setTargetBed] = useState('');

  useEffect(() => {
    if (isOpen && availableBeds.length > 0) {
      setTargetBed(availableBeds[0]);
    }
  }, [isOpen, availableBeds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl w-full max-w-sm p-6 my-auto transform transition-all border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 p-2 rounded-full">
            <i className="fa-solid fa-truck-medical"></i>
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Pindah Bed Pasien</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Pindahkan seluruh data pasien dari{' '}
          <strong className="text-slate-700 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
            {currentBed}
          </strong>{' '}
          ke bed tujuan.
        </p>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Pilih Bed Tujuan
          </label>
          <select
            value={targetBed}
            onChange={(e) => setTargetBed(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {availableBeds.map((b) => (
              <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(targetBed)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition shadow-md flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-arrow-left"></i> Pindahkan
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Medication Modal ---
interface MedicationModalProps {
  isOpen: boolean;
  initialMed: Medication | null;
  onClose: () => void;
  onSave: (med: Medication) => void;
  doctorsList: string[];
}

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  initialMed,
  onClose,
  onSave,
  doctorsList,
}) => {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [route, setRoute] = useState('IV');
  const [frequency, setFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [doctor, setDoctor] = useState('');
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [customHourInput, setCustomHourInput] = useState('');
  const [hourFilterShift, setHourFilterShift] = useState<'all' | 'pagi' | 'sore' | 'malam'>('all');
  const [isStopped, setIsStopped] = useState(false);

  useEffect(() => {
    if (initialMed) {
      setName(initialMed.name || '');
      setDose(initialMed.dose || '');
      setRoute(initialMed.route || 'IV');
      setFrequency(initialMed.frequency || '');
      setNotes(initialMed.notes || '');
      setDoctor(initialMed.doctor || '');
      setSelectedHours(initialMed.hours || []);
      setIsStopped(Boolean(initialMed.isStopped));
    } else {
      setName('');
      setDose('');
      setRoute('IV');
      setFrequency('');
      setNotes('');
      setDoctor('');
      setSelectedHours([]);
      setIsStopped(false);
    }
    setCustomHourInput('');
    setHourFilterShift('all');
  }, [initialMed, isOpen]);

  if (!isOpen) return null;

  const handleToggleHour = (h: string) => {
    setSelectedHours((prev) => {
      const next = prev.includes(h)
        ? prev.filter((item) => item !== h)
        : [...prev, h];
      return sortFlexibleHours(next);
    });
  };

  const handleRemoveHour = (h: string) => {
    setSelectedHours((prev) => prev.filter((item) => item !== h));
  };

  const handleAddCustomHour = () => {
    if (!customHourInput.trim()) return;
    const formatted = formatFlexibleHour(customHourInput);
    if (!formatted) return;

    if (!selectedHours.includes(formatted)) {
      setSelectedHours((prev) => sortFlexibleHours([...prev, formatted]));
    }
    setCustomHourInput('');
  };

  const handleSelectShiftHours = (shift: 'pagi' | 'sore' | 'malam') => {
    const hoursToAdd =
      shift === 'pagi' ? PAGI_HOURS : shift === 'sore' ? SORE_HOURS : MALAM_HOURS;
    setSelectedHours((prev) => {
      const set = new Set(prev);
      hoursToAdd.forEach((h) => set.add(h));
      return sortFlexibleHours(Array.from(set));
    });
  };

  const handleClearShiftHours = (shift: 'pagi' | 'sore' | 'malam') => {
    setSelectedHours((prev) =>
      prev.filter((h) => getHourShift(h) !== shift)
    );
  };

  const applyFrequencyPreset = (freq: string) => {
    setFrequency(freq);
    // Jika ada jam standar yang disarankan dan belum ada jam dipilih, sarankan langsung
    const suggested = FREQUENCY_SUGGESTED_HOURS[freq];
    if (suggested && suggested.length > 0) {
      if (selectedHours.length === 0) {
        setSelectedHours(suggested);
      }
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      dose: dose.trim(),
      route,
      frequency: frequency.trim(),
      notes: notes.trim(),
      doctor: doctor.trim(),
      hours: sortFlexibleHours(selectedHours),
      checkedHours: initialMed ? initialMed.checkedHours : [],
      isStopped,
    });
  };

  const sortedSelectedHours = sortFlexibleHours(selectedHours);

  // Filter jam standar untuk grid
  const displayedGridHours =
    hourFilterShift === 'pagi'
      ? PAGI_HOURS
      : hourFilterShift === 'sore'
      ? SORE_HOURS
      : hourFilterShift === 'malam'
      ? MALAM_HOURS
      : HOURS_SHIFT;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800">
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center text-lg">
              <i className="fa-solid fa-pills"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                {initialMed ? 'Edit Terapi Obat Injeksi' : 'Tambah Terapi Obat Injeksi'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur informasi obat, frekuensi, catatan khusus, dan jam fleksibel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Nama Obat */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Obat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Ceftriaxone, Furosemide, Omeprazole, Ketorolac..."
              autoFocus
            />
          </div>

          {/* Dosis & Rute */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dosis
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="1 gram, 40 mg, 2 ampul..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rute Pemberian
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer font-medium"
              >
                {MED_ROUTES.map((r) => (
                  <option key={r} value={r} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frekuensi Pemberian Obat */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Frekuensi Pemberian Obat
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Pilih opsi cepat atau ketik</span>
            </div>
            <input
              type="text"
              list="listFrekuensiModal"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Misal: 3x1, 2x1, 1x1, Tiap 8 Jam, k/p (bila perlu)..."
            />
            <datalist id="listFrekuensiModal">
              {COMMON_FREQUENCIES.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>

            {/* Quick chips frekuensi */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {['1x1', '2x1', '3x1', '4x1', 'Tiap 8 Jam', 'Tiap 12 Jam', 'k/p (bila perlu)'].map((f) => {
                const isMatch = frequency.toLowerCase().includes(f.toLowerCase());
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => applyFrequencyPreset(f)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border transition cursor-pointer ${
                      isMatch
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-750 hover:text-teal-800 dark:hover:text-teal-300'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catatan / Keterangan Khusus */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Catatan / Keterangan Khusus (Opsional)
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Instruksi perawat</span>
            </div>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Misal: Skin test dulu, Drip dalam 100 cc PZ pelan, Bolus 3-5 menit..."
            />
            {/* Quick tags catatan */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {COMMON_MED_NOTES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    if (!notes) setNotes(n);
                    else if (!notes.includes(n)) setNotes(`${notes}, ${n}`);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded font-medium border bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer flex items-center gap-1"
                >
                  <i className="fa-regular fa-note-sticky text-amber-600 dark:text-amber-400 text-[10px]"></i>
                  <span>{n}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dokter Pemberi Terapi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dokter Pemberi Terapi (DPJP)
            </label>
            <input
              type="text"
              list="listDokterModal"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Pilih dari daftar atau ketik nama dokter"
            />
            <datalist id="listDokterModal">
              {doctorsList.map((d, i) => (
                <option key={i} value={d} />
              ))}
            </datalist>
          </div>

          {/* Opsi Stop Obat */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isStopped}
                onChange={(e) => setIsStopped(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded cursor-pointer"
              />
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <i className="fa-solid fa-ban text-rose-500"></i>
                  <span>Tandai Terapi Obat Ini DI-STOP</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Obat yang di-stop akan ditandai khusus di tabel dan otomatis TIDAK dicantumkan pada cetak label spuit.
                </p>
              </div>
              {isStopped && (
                <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded shadow-2xs">
                  DI-STOP
                </span>
              )}
            </label>
          </div>

          {/* Jam Pemberian Injeksi Fleksibel */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <i className="fa-solid fa-clock text-teal-600 dark:text-teal-400"></i>
                <span>Jadwal Jam Pemberian Injeksi (Fleksibel)</span>
                <span className="bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[11px] font-bold px-2 py-0.2 rounded-full ml-1">
                  {selectedHours.length} Jam
                </span>
              </label>
              {selectedHours.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedHours([])}
                  className="text-[11px] text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold hover:underline cursor-pointer"
                >
                  Hapus Semua Jam
                </button>
              )}
            </div>

            {/* Kotak Jam Terpilih (Chips Fleksibel) */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl mb-3 min-h-[46px] flex flex-wrap items-center gap-1.5">
              {sortedSelectedHours.length === 0 ? (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                  Belum ada jam dipilih. Ketik jam kustom di bawah atau klik opsi jam standar.
                </span>
              ) : (
                sortedSelectedHours.map((h) => {
                  const shift = getHourShift(h);
                  const badgeClass =
                    shift === 'pagi'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                      : shift === 'sore'
                      ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-800'
                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-800';
                  const icon =
                    shift === 'pagi' ? '☀️' : shift === 'sore' ? '⛅' : '🌙';

                  return (
                    <span
                      key={h}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-mono font-bold border shadow-2xs ${badgeClass}`}
                    >
                      <span>
                        {icon} {h}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHour(h)}
                        className="w-4 h-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 transition cursor-pointer text-xs leading-none"
                        title={`Hapus jam ${h}`}
                      >
                        &times;
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Input Jam Fleksibel (Bebas Ketik Jam/Menit) */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customHourInput}
                  onChange={(e) => setCustomHourInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomHour();
                    }
                  }}
                  placeholder="Ketik jam fleksibel (misal: 08.30, 09:15, 14.30)..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <i className="fa-regular fa-clock absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500 text-xs"></i>
              </div>
              <button
                type="button"
                onClick={handleAddCustomHour}
                disabled={!customHourInput.trim()}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                <span>Tambah Jam</span>
              </button>
            </div>

            {/* Filter Tab & Pintasan Shift Standar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setHourFilterShift('all')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      hourFilterShift === 'all'
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Semua (24 Jam)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHourFilterShift('pagi')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      hourFilterShift === 'pagi'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    ☀️ Pagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setHourFilterShift('sore')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      hourFilterShift === 'sore'
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    ⛅ Sore
                  </button>
                  <button
                    type="button"
                    onClick={() => setHourFilterShift('malam')}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      hourFilterShift === 'malam'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    🌙 Malam
                  </button>
                </div>

                {hourFilterShift !== 'all' && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSelectShiftHours(hourFilterShift)}
                      className="text-[10px] text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 font-semibold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition cursor-pointer"
                    >
                      + Pilih Shift Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearShiftHours(hourFilterShift)}
                      className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 font-semibold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>

              {/* Grid Checkbox Jam Standar */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                {displayedGridHours.map((h) => {
                  const checked = selectedHours.includes(h);
                  const shift = getHourShift(h);
                  const activeBg =
                    shift === 'pagi'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : shift === 'sore'
                      ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-400 dark:border-orange-700 text-orange-900 dark:text-orange-200'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200';

                  return (
                    <label
                      key={h}
                      className={`flex items-center gap-1.5 border px-2 py-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                        checked
                          ? `${activeBg} shadow-2xs font-bold`
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-teal-50/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleHour(h)}
                        className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                      />
                      <span className="font-mono text-[11px]">{h}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-check"></i>
            <span>Simpan Obat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Column Modal ---
interface ColumnModalProps {
  isOpen: boolean;
  colType: 'intake_parenteral' | 'intake_enteral' | 'output' | null;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const ColumnModal: React.FC<ColumnModalProps> = ({
  isOpen,
  colType,
  onClose,
  onSave,
}) => {
  const [colName, setColName] = useState('');

  useEffect(() => {
    if (isOpen) setColName('');
  }, [isOpen]);

  if (!isOpen || !colType) return null;

  let title = 'Tambah Parameter Cairan';
  if (colType === 'intake_parenteral') title = 'Tambah Parameter Parenteral';
  else if (colType === 'intake_enteral') title = 'Tambah Parameter Enteral';
  else if (colType === 'output') title = 'Tambah Parameter Output';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl shadow-2xl w-full max-w-sm p-6 my-auto transform transition-all border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-4">{title}</h3>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Nama Parameter Cairan
          </label>
          <input
            type="text"
            value={colName}
            onChange={(e) => setColName(e.target.value)}
            className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Misal: Drip Dobutamin, WSD..."
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(colName)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition shadow-md cursor-pointer"
          >
            Tambahkan
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Custom Dialog / Confirm Modal ---
export interface DialogConfig {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const DialogModal: React.FC<{
  config: DialogConfig;
  onClose: () => void;
}> = ({ config, onClose }) => {
  if (!config.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[95] overflow-y-auto modal-backdrop-scroll">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-sm p-6 my-auto text-center transform transition-all border border-slate-200 dark:border-slate-800">
        <div className="mb-4 flex justify-center">
          {config.type === 'alert' ? (
            <i className="fa-solid fa-circle-exclamation text-5xl text-amber-500 drop-shadow-sm"></i>
          ) : (
            <i className="fa-solid fa-circle-question text-5xl text-blue-500 drop-shadow-sm"></i>
          )}
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl mb-2">{config.title}</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
          {config.message}
        </p>
        <div className="flex justify-center gap-3">
          {config.type === 'confirm' ? (
            <>
              <button
                onClick={() => {
                  if (config.onCancel) config.onCancel();
                  onClose();
                }}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (config.onConfirm) config.onConfirm();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-md transition cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (config.onConfirm) config.onConfirm();
                onClose();
              }}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-md transition w-full cursor-pointer"
            >
              Mengerti
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Syringe Print Selection Modal ---
interface SyringePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientRM: string;
  med: Medication | null;
  currentBed: string;
  onPrintHour: (timeStr: string) => void;
  onPrintBatch: (timeList: string[]) => void;
  onOpenShiftModal?: (shift: 'pagi' | 'sore' | 'malam') => void;
}

export const SyringePrintModal: React.FC<SyringePrintModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientRM,
  med,
  currentBed,
  onPrintHour,
  onPrintBatch,
  onOpenShiftModal,
}) => {
  const [customTime, setCustomTime] = useState('');

  if (!isOpen || !med) return null;

  const now = new Date();
  const currentClock = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const scheduledHours = sortFlexibleHours(med.hours || []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar transform transition-all border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center text-lg">
              <i className="fa-solid fa-syringe"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Cetak Label Spuit Injeksi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih jam pemberian injeksi untuk dicetak pada label
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Info Singkat Pasien & Obat */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Pasien:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {patientName.toUpperCase() || '-'} ({currentBed})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">No. RM:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
              {patientRM || '-'}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Obat & Dosis:</span>
            <span className="font-bold text-purple-700 dark:text-purple-300">
              {med.name} — {med.dose} ({med.route})
            </span>
          </div>
          {med.frequency && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Frekuensi:</span>
              <span className="font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                {med.frequency}
              </span>
            </div>
          )}
          {med.notes && (
            <div className="flex justify-between items-start pt-0.5">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">Catatan:</span>
              <span className="font-medium text-amber-800 dark:text-amber-300 italic text-right pl-2">
                {med.notes}
              </span>
            </div>
          )}
        </div>

        {med.isStopped && (
          <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl p-3 mb-4 text-xs font-bold flex items-center gap-2">
            <i className="fa-solid fa-ban text-rose-600 dark:text-rose-400 text-base"></i>
            <span>Obat ini berstatus DI-STOP. Label spuit tidak dapat dicetak.</span>
          </div>
        )}

        {/* Pilihan Jam Terjadwal */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-clock text-teal-600 dark:text-teal-400"></i>
            <span>Pilih Jam Pemberian Injeksi:</span>
          </label>

          {scheduledHours.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {scheduledHours.map((h) => {
                  const shift = getHourShift(h);
                  const isPagi = shift === 'pagi';
                  const isSore = shift === 'sore';

                  return (
                    <button
                      key={h}
                      onClick={() => onPrintHour(h)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 bg-white dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition shadow-sm group cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-purple-700 dark:group-hover:text-purple-300">
                          {h}
                        </span>
                        <i className="fa-solid fa-print text-slate-300 dark:text-slate-600 group-hover:text-purple-600 dark:group-hover:text-purple-400 text-xs"></i>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1">
                        {isPagi ? '☀️ Pagi' : isSore ? '⛅ Sore' : '🌙 Malam'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {scheduledHours.length > 1 && (
                <button
                  onClick={() => onPrintBatch(scheduledHours)}
                  className="w-full mt-2 py-2 px-3 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-semibold text-xs rounded-xl border border-purple-200 dark:border-purple-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>
                    Cetak Semua Jam ({scheduledHours.length} Label Sekaligus)
                  </span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 mb-2">
              Belum ada jam pemberian yang dijadwalkan pada obat ini. Silakan gunakan opsi jam di bawah:
            </p>
          )}
        </div>

        {/* Pintasan Cetak Seluruh Obat Shift */}
        {onOpenShiftModal && (
          <div className="bg-gradient-to-r from-purple-50 dark:from-purple-950/40 to-indigo-50 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 mb-3 text-xs">
            <div className="font-semibold text-purple-900 dark:text-purple-200 mb-1 flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group text-purple-600 dark:text-purple-400"></i>
              <span>Cetak Seluruh Obat Pasien Berdasarkan Shift:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenShiftModal('pagi');
                }}
                className="py-1 px-2 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-semibold transition text-center cursor-pointer shadow-2xs"
              >
                ☀️ Pagi (07-14)
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenShiftModal('sore');
                }}
                className="py-1 px-2 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg text-[11px] font-semibold transition text-center cursor-pointer shadow-2xs"
              >
                ⛅ Sore (15-21)
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenShiftModal('malam');
                }}
                className="py-1 px-2 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-semibold transition text-center cursor-pointer shadow-2xs"
              >
                🌙 Malam (22-06)
              </button>
            </div>
          </div>
        )}

        {/* Opsi Jam Lainnya (Waktu Sekarang & Manual) */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Opsi jam lainnya:</span>
            <button
              onClick={() => onPrintHour(currentClock)}
              className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-stopwatch"></i>
              <span>Jam Sekarang ({currentClock})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              placeholder="Atau ketik jam lain (misal: 10.30)"
              className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              onClick={() => {
                if (customTime.trim()) onPrintHour(customTime.trim());
              }}
              disabled={!customTime.trim()}
              className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 dark:hover:bg-slate-600 transition disabled:opacity-40 cursor-pointer"
            >
              Cetak
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Modal Cetak Spuit Seluruh Obat per Shift Pasien (Mendukung Pasien Ini & Semua Pasien) ---
export interface ShiftSyringePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShift?: 'pagi' | 'sore' | 'malam' | 'all';
  initialScope?: 'current' | 'all';
  patientName: string;
  patientRM: string;
  currentBed: string;
  medications: Medication[];
  dayBeds?: DayBedsData;
  beds?: string[];
  onPrintLabels: (labels: SyringeLabelPrintData[]) => void;
}

export const ShiftSyringePrintModal: React.FC<ShiftSyringePrintModalProps> = ({
  isOpen,
  onClose,
  initialShift = 'pagi',
  initialScope = 'current',
  patientName,
  patientRM,
  currentBed,
  medications,
  dayBeds,
  beds,
  onPrintLabels,
}) => {
  const [activeScope, setActiveScope] = useState<'current' | 'all'>(initialScope || 'current');
  const [activeShift, setActiveShift] = useState<'pagi' | 'sore' | 'malam' | 'all'>(initialShift);
  const [bedFilter, setBedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Sinkronisasi saat modal dibuka atau initial props berubah
  useEffect(() => {
    if (isOpen) {
      setActiveShift(initialShift || 'pagi');
      setActiveScope(initialScope || 'current');
      setBedFilter('all');
      setSearchQuery('');
    }
  }, [isOpen, initialShift, initialScope]);

  // Mengumpulkan seluruh item obat yang terjadwal beserta shift-nya berdasarkan scope aktif
  const allShiftItems = useMemo(() => {
    const list: Array<{
      key: string;
      bedName: string;
      patientName: string;
      patientRM: string;
      medIndex: number;
      medName: string;
      medDose: string;
      medRoute: string;
      medFrequency?: string;
      medNotes?: string;
      hour: string;
      doctor?: string;
      shift: 'pagi' | 'sore' | 'malam';
    }> = [];

    if (activeScope === 'current') {
      medications.forEach((med, mIdx) => {
        // Obat yang di-stop tidak tercantum di cetak label spuit
        if (med.isStopped) return;

        (med.hours || []).forEach((h) => {
          const shift = getHourShift(h);

          list.push({
            key: `${currentBed}-${mIdx}-${h}-${med.name}`,
            bedName: currentBed,
            patientName: patientName || '',
            patientRM: patientRM || '',
            medIndex: mIdx,
            medName: med.name,
            medDose: med.dose,
            medRoute: med.route,
            medFrequency: med.frequency,
            medNotes: med.notes,
            hour: h,
            doctor: med.doctor,
            shift,
          });
        });
      });
    } else {
      // Cakupan SEMUA PASIEN
      const bedList = beds && beds.length > 0 ? beds : Object.keys(dayBeds || {});
      bedList.forEach((bed) => {
        const bData = dayBeds?.[bed];
        if (!bData) return;
        const bPatient = bData.patient || {};
        const bMeds = bData.medications || [];

        bMeds.forEach((med, mIdx) => {
          // Obat yang di-stop tidak tercantum di cetak label spuit
          if (med.isStopped) return;

          (med.hours || []).forEach((h) => {
            const shift = getHourShift(h);

            list.push({
              key: `${bed}-${mIdx}-${h}-${med.name}`,
              bedName: bed,
              patientName: bPatient.name?.trim() || `(Pasien ${bed})`,
              patientRM: bPatient.rm?.trim() || '-',
              medIndex: mIdx,
              medName: med.name,
              medDose: med.dose,
              medRoute: med.route,
              medFrequency: med.frequency,
              medNotes: med.notes,
              hour: h,
              doctor: med.doctor,
              shift,
            });
          });
        });
      });
    }

    // Urutkan berdasarkan jam siklus pemberian ICU (mulai 07.00) dan bed
    const getMin = (timeStr: string) => {
      let clean = timeStr.trim().replace(':', '.');
      if (!clean.includes('.')) clean += '.00';
      const parts = clean.split('.');
      let hr = parseInt(parts[0], 10) || 0;
      const min = parseInt(parts[1], 10) || 0;
      if (hr === 24) hr = 0;
      return (hr * 60 + min - 7 * 60 + 1440) % 1440;
    };

    list.sort((a, b) => {
      if (activeScope === 'all') {
        const bedIndexA = (beds || []).indexOf(a.bedName);
        const bedIndexB = (beds || []).indexOf(b.bedName);
        if (bedIndexA !== -1 && bedIndexB !== -1 && bedIndexA !== bedIndexB) {
          return bedIndexA - bedIndexB;
        }
      }
      return getMin(a.hour) - getMin(b.hour);
    });

    return list;
  }, [activeScope, medications, currentBed, patientName, patientRM, dayBeds, beds]);

  // Statistik label & pasien
  const countPagi = useMemo(() => allShiftItems.filter((i) => i.shift === 'pagi').length, [allShiftItems]);
  const countSore = useMemo(() => allShiftItems.filter((i) => i.shift === 'sore').length, [allShiftItems]);
  const countMalam = useMemo(() => allShiftItems.filter((i) => i.shift === 'malam').length, [allShiftItems]);
  const countAll = allShiftItems.length;

  // Daftar bed yang memiliki jadwal obat pada dataset saat ini
  const activeBedsWithItems = useMemo(() => {
    const set = new Set<string>();
    allShiftItems.forEach((it) => set.add(it.bedName));
    return Array.from(set);
  }, [allShiftItems]);

  // Filter items berdasarkan shift aktif, bedFilter, dan pencarian
  const currentItems = useMemo(() => {
    let result = activeShift === 'all'
      ? allShiftItems
      : allShiftItems.filter((i) => i.shift === activeShift);

    if (activeScope === 'all' && bedFilter !== 'all') {
      result = result.filter((i) => i.bedName === bedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.medName.toLowerCase().includes(q) ||
          i.patientName.toLowerCase().includes(q) ||
          i.patientRM.toLowerCase().includes(q) ||
          i.bedName.toLowerCase().includes(q) ||
          (i.medNotes && i.medNotes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allShiftItems, activeShift, activeScope, bedFilter, searchQuery]);

  // Kelompokkan item berdasarkan Bed untuk tampilan terstruktur
  const groupedByBed = useMemo(() => {
    const map = new Map<string, typeof currentItems>();
    currentItems.forEach((it) => {
      if (!map.has(it.bedName)) {
        map.set(it.bedName, []);
      }
      map.get(it.bedName)!.push(it);
    });
    return map;
  }, [currentItems]);

  // Pilih semua item saat shift, scope, atau filter berganti
  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(new Set(currentItems.map((i) => i.key)));
    }
  }, [isOpen, activeShift, activeScope, bedFilter, searchQuery, allShiftItems]);

  if (!isOpen) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleToggle = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedKeys.size === currentItems.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(currentItems.map((i) => i.key)));
    }
  };

  const handleToggleBedGroup = (bedName: string) => {
    const bedItems = currentItems.filter((i) => i.bedName === bedName);
    const allBedSelected = bedItems.every((i) => selectedKeys.has(i.key));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      bedItems.forEach((i) => {
        if (allBedSelected) next.delete(i.key);
        else next.add(i.key);
      });
      return next;
    });
  };

  const handlePrint = () => {
    const labelsToPrint: SyringeLabelPrintData[] = currentItems
      .filter((it) => selectedKeys.has(it.key))
      .map((it) => ({
        patientName: it.patientName.trim() || '.......................',
        patientRM: it.patientRM.trim() || '......',
        bedName: it.bedName,
        medName: it.medName,
        medDose: it.medDose,
        medRoute: it.medRoute,
        dateStr,
        timeStr: it.hour,
        frequency: it.medFrequency,
        notes: it.medNotes,
      }));

    if (labelsToPrint.length === 0) return;
    onPrintLabels(labelsToPrint);
    onClose();
  };

  const getShiftBadge = (shift: 'pagi' | 'sore' | 'malam') => {
    if (shift === 'pagi') {
      return (
        <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
          ☀️ Pagi
        </span>
      );
    }
    if (shift === 'sore') {
      return (
        <span className="text-[10px] font-semibold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded border border-orange-200">
          ⛅ Sore
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
        🌙 Malam
      </span>
    );
  };

  const shiftTitle =
    activeShift === 'pagi'
      ? 'Shift Pagi (07.00 - 14.00)'
      : activeShift === 'sore'
      ? 'Shift Sore (15.00 - 21.00)'
      : activeShift === 'malam'
      ? 'Shift Malam (22.00 - 06.00)'
      : 'Semua Shift (24 Jam)';

  const distinctPatientsInCurrentShift = new Set(currentItems.map((i) => i.bedName)).size;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
      <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-2xl p-4 sm:p-6 my-auto transform transition-all flex flex-col max-h-[94vh] border border-slate-200 dark:border-slate-800">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              <i className="fa-solid fa-print"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <span>Cetak Label Spuit per Shift</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sesuaikan jadwal injeksi dengan shift jaga (Pagi, Sore, Malam) untuk label spuit 55mm × 20mm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Tutup"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* TAB PILIHAN CAKUPAN: PASIEN BED INI vs SEMUA PASIEN */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3 border border-slate-200/80 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveScope('current')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeScope === 'current'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs border border-teal-200 dark:border-teal-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-bed"></i>
            <span>Pasien Bed Ini ({currentBed})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScope('all')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeScope === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300'
            }`}
          >
            <i className="fa-solid fa-users"></i>
            <span>Semua Pasien ({activeBedsWithItems.length} Bed Aktif)</span>
          </button>
        </div>

        {/* Informasi Pasien & Ruangan / Banner Scope */}
        {activeScope === 'current' ? (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Pasien:</span>{' '}
              <strong className="text-slate-800 dark:text-slate-100 uppercase font-bold">
                {patientName || '-'}
              </strong>{' '}
              <span className="text-slate-500 dark:text-slate-400">({currentBed})</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">No. RM:</span>{' '}
              <strong className="font-mono text-slate-700 dark:text-slate-200">{patientRM || '-'}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Tgl:</span>{' '}
              <strong className="text-slate-700 dark:text-slate-200">{dateStr}</strong>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-3 mb-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 font-bold text-purple-950 dark:text-purple-200">
                <i className="fa-solid fa-hospital-user text-purple-600 dark:text-purple-400 text-sm"></i>
                <span>Cetak Label Spuit Seluruh Pasien ICU</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-medium">
                <span>{distinctPatientsInCurrentShift} Pasien • Tgl: </span>
                <strong className="text-slate-700 dark:text-slate-200">{dateStr}</strong>
              </div>
            </div>

            {/* Quick Bed Filter Chips */}
            {activeBedsWithItems.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase shrink-0">Filter Bed:</span>
                <button
                  type="button"
                  onClick={() => setBedFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 transition cursor-pointer ${
                    bedFilter === 'all'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Semua ({activeBedsWithItems.length})
                </button>
                {activeBedsWithItems.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBedFilter(b)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 transition cursor-pointer ${
                      bedFilter === b
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pilihan Shift (Tab Selector Pagi, Sore, Malam, Semua) */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => setActiveShift('pagi')}
            className={`py-2 px-1 text-xs font-semibold rounded-lg transition flex flex-col items-center justify-center cursor-pointer ${
              activeShift === 'pagi'
                ? 'bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-300 shadow-xs border border-amber-200 dark:border-amber-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            <span className="flex items-center gap-1 font-bold">
              ☀️ Pagi
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {countPagi} Label
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShift('sore')}
            className={`py-2 px-1 text-xs font-semibold rounded-lg transition flex flex-col items-center justify-center cursor-pointer ${
              activeShift === 'sore'
                ? 'bg-white dark:bg-slate-900 text-orange-900 dark:text-orange-300 shadow-xs border border-orange-200 dark:border-orange-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            <span className="flex items-center gap-1 font-bold">
              ⛅ Sore
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {countSore} Label
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShift('malam')}
            className={`py-2 px-1 text-xs font-semibold rounded-lg transition flex flex-col items-center justify-center cursor-pointer ${
              activeShift === 'malam'
                ? 'bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-300 shadow-xs border border-indigo-200 dark:border-indigo-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            <span className="flex items-center gap-1 font-bold">
              🌙 Malam
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {countMalam} Label
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShift('all')}
            className={`py-2 px-1 text-xs font-semibold rounded-lg transition flex flex-col items-center justify-center cursor-pointer ${
              activeShift === 'all'
                ? 'bg-white dark:bg-slate-900 text-purple-900 dark:text-purple-300 shadow-xs border border-purple-200 dark:border-purple-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
            }`}
          >
            <span className="flex items-center gap-1 font-bold">
              📋 Semua
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {countAll} Label
            </span>
          </button>
        </div>

        {/* Search Bar & Action Select All */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-1 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              Daftar Label {shiftTitle}
            </span>
            <span className="text-[11px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              {selectedKeys.size} dari {currentItems.length} dipilih
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Cari obat / pasien..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 w-36 sm:w-44 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {currentItems.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 transition cursor-pointer"
              >
                {selectedKeys.size === currentItems.length
                  ? 'Batal Semua'
                  : 'Pilih Semua'}
              </button>
            )}
          </div>
        </div>

        {/* DAFTAR ITEM LABEL (SCROLLABLE & GROUPED) */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 min-h-[180px] max-h-[340px]">
          {currentItems.length > 0 ? (
            activeScope === 'all' ? (
              /* Grouped by Bed for All Patients */
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {Array.from(groupedByBed.entries()).map(([bName, items]) => {
                  const bPatientName = items[0]?.patientName || bName;
                  const bPatientRM = items[0]?.patientRM || '-';
                  const allInBedSelected = items.every((it) => selectedKeys.has(it.key));

                  return (
                    <div key={bName} className="bg-slate-50/40 dark:bg-slate-850">
                      {/* Bed Group Header */}
                      <div className="bg-slate-100/90 dark:bg-slate-800/90 px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 text-xs sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-teal-600 text-white rounded font-bold text-[11px]">
                            {bName}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {bPatientName}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            (RM: {bPatientRM})
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            • {items.length} label
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleBedGroup(bName)}
                          className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 cursor-pointer"
                        >
                          {allInBedSelected ? 'Batal Bed Ini' : 'Pilih Bed Ini'}
                        </button>
                      </div>

                      {/* Items under this Bed */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {items.map((item) => {
                          const isChecked = selectedKeys.has(item.key);
                          return (
                            <div
                              key={item.key}
                              onClick={() => handleToggle(item.key)}
                              className={`p-2.5 px-3 flex items-center justify-between gap-3 text-xs transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                                isChecked ? 'bg-purple-50/40 dark:bg-purple-950/30' : 'opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 focus:ring-purple-500 cursor-pointer pointer-events-none"
                                />
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 flex-wrap">
                                    <span>{item.medName}</span>
                                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                      {item.medDose} ({item.medRoute})
                                    </span>
                                    {item.medFrequency && (
                                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 font-semibold">
                                        {item.medFrequency}
                                      </span>
                                    )}
                                  </div>
                                  {item.medNotes && (
                                    <div className="text-[11px] text-amber-800 dark:text-amber-300 italic flex items-center gap-1 mt-0.5">
                                      <i className="fa-regular fa-note-sticky text-amber-600 dark:text-amber-400 text-[10px]"></i>
                                      <span>{item.medNotes}</span>
                                    </div>
                                  )}
                                  <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                                    {item.doctor && <span>DPJP: {item.doctor}</span>}
                                    {activeShift === 'all' && getShiftBadge(item.shift)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
                                  Jam {item.hour}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Patient List */
              currentItems.map((item) => {
                const isChecked = selectedKeys.has(item.key);
                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggle(item.key)}
                    className={`p-3 flex items-center justify-between gap-3 text-xs transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      isChecked ? 'bg-purple-50/40 dark:bg-purple-950/30' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 focus:ring-purple-500 cursor-pointer pointer-events-none"
                      />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 flex-wrap">
                          <span>{item.medName}</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            {item.medDose} ({item.medRoute})
                          </span>
                          {item.medFrequency && (
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 font-semibold">
                              {item.medFrequency}
                            </span>
                          )}
                        </div>
                        {item.medNotes && (
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 italic flex items-center gap-1 mt-0.5">
                            <i className="fa-regular fa-note-sticky text-amber-600 dark:text-amber-400 text-[10px]"></i>
                            <span>{item.medNotes}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                          {item.doctor && <span>DPJP: {item.doctor}</span>}
                          {activeShift === 'all' && getShiftBadge(item.shift)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-xs">
                        Jam {item.hour}
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500">
              <i className="fa-solid fa-clipboard-check text-3xl mb-2 text-slate-300 dark:text-slate-600"></i>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Tidak ada obat injeksi yang dijadwalkan pada {shiftTitle}.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Silakan pilih shift lain di atas atau jadwalkan jam pemberian pada tabel terapi injeksi.
              </p>
            </div>
          )}
        </div>

        {/* Catatan Standar Spuit */}
        <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
          <i className="fa-solid fa-circle-info text-purple-600 dark:text-purple-400 shrink-0"></i>
          <span>
            Setiap label dicetak pada etiket spuit standar (55mm × 20mm) lengkap dengan Nama Pasien, Bed Ruangan, No. RM, Nama Obat, Dosis, Rute, Tgl, dan Jam Pemberian.
          </span>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={selectedKeys.size === 0}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-print"></i>
            <span>
              Cetak {selectedKeys.size} Label Spuit ({activeScope === 'all' ? 'Semua Pasien' : currentBed} - {activeShift === 'pagi' ? 'Pagi' : activeShift === 'sore' ? 'Sore' : activeShift === 'malam' ? 'Malam' : 'Semua Shift'})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};


