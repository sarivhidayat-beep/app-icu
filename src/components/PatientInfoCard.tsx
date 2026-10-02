import React from 'react';
import { PatientInfo } from '../types';

interface PatientInfoCardProps {
  currentBed: string;
  patient: PatientInfo;
  onUpdatePatient: (updated: Partial<PatientInfo>) => void;
  onPrintOperan: () => void;
  onOpenTransferModal: () => void;
  onDischargePatient: () => void;
}

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  currentBed,
  patient,
  onUpdatePatient,
  onPrintOperan,
  onOpenTransferModal,
  onDischargePatient,
}) => {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-teal-100 text-teal-800 font-bold text-sm rounded-lg border border-teal-200 shadow-sm">
            {currentBed}
          </span>
          <h3 className="font-bold text-slate-700">Informasi Pasien</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md print-hidden">
            <i className="fa-solid fa-cloud-arrow-up mr-1"></i> Auto-save
          </span>
          <button
            onClick={onPrintOperan}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 transition flex items-center gap-2 shadow-sm print-hidden cursor-pointer"
            title="Cetak lembar operan pasien ini"
          >
            <i className="fa-solid fa-print"></i>
            <span>Cetak Operan</span>
          </button>
          <button
            onClick={onOpenTransferModal}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 transition flex items-center gap-2 shadow-sm print-hidden cursor-pointer"
            title="Pindah ruangan/bed pasien tanpa ketik ulang"
          >
            <i className="fa-solid fa-truck-medical"></i>
            <span>Pindah Bed</span>
          </button>
          <button
            onClick={onDischargePatient}
            className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 transition flex items-center gap-2 shadow-sm print-hidden cursor-pointer"
            title="Kosongkan bed jika pasien pulang/pindah"
          >
            <i className="fa-solid fa-person-walking-arrow-right"></i>
            <span>Pasien Keluar (Reset)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Nama Pasien
          </label>
          <input
            type="text"
            value={patient.name || ''}
            onChange={(e) => onUpdatePatient({ name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Nama Pasien"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            No. RM
          </label>
          <input
            type="text"
            value={patient.rm || ''}
            onChange={(e) => onUpdatePatient({ rm: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="00-00-00"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Umur
          </label>
          <input
            type="text"
            value={patient.age || ''}
            onChange={(e) => onUpdatePatient({ age: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Thn / Bln"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Berat Badan (BB)
          </label>
          <div className="flex items-center">
            <input
              type="number"
              value={patient.weight || ''}
              onChange={(e) => onUpdatePatient({ weight: e.target.value })}
              className="w-full border border-slate-300 rounded-l-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="0"
            />
            <span className="bg-slate-100 border border-l-0 border-slate-300 px-3 py-2 text-xs text-slate-600 rounded-r-lg font-medium">
              kg
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Asal Ruangan
          </label>
          <input
            type="text"
            value={patient.origin || ''}
            onChange={(e) => onUpdatePatient({ origin: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="IGD, R. Inap..."
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Hari Rawat Ke
          </label>
          <input
            type="number"
            value={patient.dayOfCare || ''}
            onChange={(e) => onUpdatePatient({ dayOfCare: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Mis: 3"
          />
        </div>
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Post Op Hari Ke
          </label>
          <textarea
            value={patient.postOpDay || ''}
            onChange={(e) => onUpdatePatient({ postOpDay: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            placeholder="H-1, Hari ke-2, dll..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Dokter DPJP / Konsulen
          </label>
          <textarea
            value={patient.doctor || ''}
            onChange={(e) => onUpdatePatient({ doctor: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            placeholder="Ketik nama dokter (bisa dienter jika lebih dari satu)..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Diagnosa Medis
          </label>
          <textarea
            value={patient.diagnosis || ''}
            onChange={(e) => onUpdatePatient({ diagnosis: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            placeholder="Tuliskan diagnosa utama dan penyerta..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Pola Ventilasi / Oksigenasi
          </label>
          <textarea
            value={patient.ventilation || ''}
            onChange={(e) => onUpdatePatient({ ventilation: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            placeholder="Ventilator Mode, O2 Nasal, SpO2..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Diit / Nutrisi
          </label>
          <textarea
            value={patient.diet || ''}
            onChange={(e) => onUpdatePatient({ diet: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            placeholder="Cair / Lunak / TKTP / NGT..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Cairan Infus Active
          </label>
          <textarea
            value={patient.fluids || ''}
            onChange={(e) => onUpdatePatient({ fluids: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            placeholder="1. RL 20 tpm&#10;2. NDS 500cc/24j"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Alat Invasif Terpasang
          </label>
          <textarea
            value={patient.invasive || ''}
            onChange={(e) => onUpdatePatient({ invasive: e.target.value })}
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
            placeholder="CVC, ETT, Kateter, WSD..."
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1">
          Catatan Perawat / Alergi
        </label>
        <textarea
          value={patient.notes || ''}
          onChange={(e) => onUpdatePatient({ notes: e.target.value })}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none resize-y"
          placeholder="Alergi Obat, Instruksi Khusus..."
        />
      </div>
    </section>
  );
};
