import React, { useState, useEffect } from 'react';
import { Medication, FluidColumn } from '../types';
import { MED_ROUTES, HOURS_SHIFT } from '../constants';

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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Tambah Extra Bed</h3>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nama Bed Baru
          </label>
          <input
            type="text"
            value={bedName}
            onChange={(e) => setBedName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Misal: EXTRA 1, IGD 1..."
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[55]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-100 text-amber-600 p-2 rounded-full">
            <i className="fa-solid fa-truck-medical"></i>
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Pindah Bed Pasien</h3>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Pindahkan seluruh data pasien dari{' '}
          <strong className="text-slate-700 font-bold bg-slate-100 px-1 py-0.5 rounded">
            {currentBed}
          </strong>{' '}
          ke bed tujuan.
        </p>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Pilih Bed Tujuan
          </label>
          <select
            value={targetBed}
            onChange={(e) => setTargetBed(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-700 cursor-pointer"
          >
            {availableBeds.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onConfirm(targetBed)}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition shadow-md flex items-center gap-2 cursor-pointer"
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
  const [doctor, setDoctor] = useState('');
  const [selectedHours, setSelectedHours] = useState<string[]>([]);

  useEffect(() => {
    if (initialMed) {
      setName(initialMed.name);
      setDose(initialMed.dose);
      setRoute(initialMed.route || 'IV');
      setDoctor(initialMed.doctor || '');
      setSelectedHours(initialMed.hours || []);
    } else {
      setName('');
      setDose('');
      setRoute('IV');
      setDoctor('');
      setSelectedHours([]);
    }
  }, [initialMed, isOpen]);

  if (!isOpen) return null;

  const toggleHour = (h: string) => {
    setSelectedHours((prev) =>
      prev.includes(h) ? prev.filter((item) => item !== h) : [...prev, h]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      dose: dose.trim(),
      route,
      doctor: doctor.trim(),
      hours: selectedHours,
      checkedHours: initialMed ? initialMed.checkedHours : [],
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">
            {initialMed ? 'Edit Obat Injeksi' : 'Tambah Obat Injeksi'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Obat
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Ceftriaxone, Furosemide..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Dosis
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                placeholder="1 gram, 50 mg..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Rute
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white cursor-pointer"
              >
                {MED_ROUTES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Dokter Pemberi Terapi
            </label>
            <input
              type="text"
              list="listDokterModal"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Pilih dari daftar atau ketik nama dokter"
            />
            <datalist id="listDokterModal">
              {doctorsList.map((d, i) => (
                <option key={i} value={d} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Pilih Jam Pemberian Injeksi
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-40 overflow-y-auto custom-scrollbar">
              {HOURS_SHIFT.map((h) => {
                const checked = selectedHours.includes(h);
                return (
                  <label
                    key={h}
                    className={`flex items-center gap-1.5 border px-2 py-1.5 rounded text-xs cursor-pointer transition shadow-sm ${
                      checked
                        ? 'bg-teal-50 border-teal-400 text-teal-800'
                        : 'bg-white border-slate-200 hover:bg-teal-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleHour(h)}
                      className="w-3.5 h-3.5 text-teal-600 rounded cursor-pointer"
                    />
                    <span className="font-mono text-[11px] font-semibold">{h}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition shadow-md cursor-pointer"
          >
            Simpan
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[55]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
        <h3 className="font-bold text-slate-800 text-lg mb-4">{title}</h3>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nama Parameter Cairan
          </label>
          <input
            type="text"
            value={colName}
            onChange={(e) => setColName(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Misal: Drip Dobutamin, WSD..."
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center transform transition-all">
        <div className="mb-4 flex justify-center">
          {config.type === 'alert' ? (
            <i className="fa-solid fa-circle-exclamation text-5xl text-amber-500 drop-shadow-sm"></i>
          ) : (
            <i className="fa-solid fa-circle-question text-5xl text-blue-500 drop-shadow-sm"></i>
          )}
        </div>
        <h3 className="font-bold text-slate-800 text-xl mb-2">{config.title}</h3>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
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
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
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

  const scheduledHours = med.hours || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[65]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
              <i className="fa-solid fa-syringe"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Cetak Label Spuit Injeksi
              </h3>
              <p className="text-xs text-slate-500">
                Pilih jam pemberian injeksi untuk dicetak pada label
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Info Singkat Pasien & Obat */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Pasien:</span>
            <span className="font-bold text-slate-800">
              {patientName.toUpperCase() || '-'} ({currentBed})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">No. RM:</span>
            <span className="font-mono font-semibold text-slate-700">
              {patientRM || '-'}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Obat & Dosis:</span>
            <span className="font-bold text-purple-700">
              {med.name} — {med.dose} ({med.route})
            </span>
          </div>
        </div>

        {/* Pilihan Jam Terjadwal */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-clock text-teal-600"></i>
            <span>Pilih Jam Pemberian Injeksi:</span>
          </label>

          {scheduledHours.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {scheduledHours.map((h) => {
                  const hourNum = parseInt(h.split('.')[0] || '0', 10);
                  const isPagi = hourNum >= 7 && hourNum <= 14;
                  const isSore = hourNum >= 15 && hourNum <= 21;

                  return (
                    <button
                      key={h}
                      onClick={() => onPrintHour(h)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 text-left transition shadow-sm group cursor-pointer flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono font-bold text-slate-800 text-sm group-hover:text-purple-700">
                          {h}
                        </span>
                        <i className="fa-solid fa-print text-slate-300 group-hover:text-purple-600 text-xs"></i>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {isPagi ? '☀️ Pagi' : isSore ? '⛅ Sore' : '🌙 Malam'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {scheduledHours.length > 1 && (
                <button
                  onClick={() => onPrintBatch(scheduledHours)}
                  className="w-full mt-2 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl border border-purple-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>
                    Cetak Semua Jam ({scheduledHours.length} Label Sekaligus)
                  </span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-amber-600 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200 mb-2">
              Belum ada jam pemberian yang dijadwalkan pada obat ini. Silakan gunakan opsi jam di bawah:
            </p>
          )}
        </div>

        {/* Opsi Jam Lainnya (Waktu Sekarang & Manual) */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Opsi jam lainnya:</span>
            <button
              onClick={() => onPrintHour(currentClock)}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition cursor-pointer flex items-center gap-1.5"
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
              className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
            />
            <button
              onClick={() => {
                if (customTime.trim()) onPrintHour(customTime.trim());
              }}
              disabled={!customTime.trim()}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition disabled:opacity-40 cursor-pointer"
            >
              Cetak
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

