import React, { useState, useEffect } from 'react';
import { PatientInfo, PostOpItem, InvasiveDeviceItem } from '../types';
import {
  calculateDayOfCare,
  calculatePostOpInfo,
  formatDateID,
  BASE_DOCTORS,
  DEFAULT_INVASIVE_TYPES,
  checkInvasiveReplacement,
} from '../constants';

interface PatientInfoCardProps {
  currentBed: string;
  patient: PatientInfo;
  currentDateStr?: string;
  doctorsList?: string[];
  onAddCustomDoctor?: (name: string) => void;
  onUpdatePatient: (updated: Partial<PatientInfo>) => void;
  onPrintOperan: () => void;
  onOpenTransferModal: () => void;
  onDischargePatient: () => void;
  onOpenAllOperanModal?: () => void;
}

type ModalType =
  | 'patient_identity'
  | 'doctor'
  | 'diagnosis'
  | 'ventilation'
  | 'invasive'
  | 'notes'
  | null;

export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
  currentBed,
  patient,
  currentDateStr,
  doctorsList = BASE_DOCTORS,
  onAddCustomDoctor,
  onUpdatePatient,
  onPrintOperan,
  onOpenTransferModal,
  onDischargePatient,
  onOpenAllOperanModal,
}) => {
  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // States untuk masing-masing form terpisah
  // 1. Identitas & Post-Op
  const [identityForm, setIdentityForm] = useState<PatientInfo>({ ...patient });
  const [postOpsList, setPostOpsList] = useState<PostOpItem[]>([]);

  // 2. DPJP & Konsulen
  const [doctorListForm, setDoctorListForm] = useState<string[]>([]);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorFeedback, setNewDoctorFeedback] = useState<string | null>(null);

  // 3. Diagnosa Medis
  const [diagnosisForm, setDiagnosisForm] = useState('');

  // 4. Ventilasi
  const [ventilationForm, setVentilationForm] = useState('');

  // 5. Alat Invasif
  const [invasiveListForm, setInvasiveListForm] = useState<InvasiveDeviceItem[]>([]);

  // 6. Catatan Perawat & Alergi
  const [notesForm, setNotesForm] = useState('');

  // Sinkronkan data lokal setiap kali pasien berganti atau modal dibuka
  useEffect(() => {
    // Identitas
    setIdentityForm({ ...patient });

    // Post-op
    if (patient.postOps && patient.postOps.length > 0) {
      setPostOpsList([...patient.postOps]);
    } else {
      setPostOpsList([]);
    }

    // Dokter
    if (patient.doctors && patient.doctors.length > 0) {
      setDoctorListForm([...patient.doctors]);
    } else if (patient.doctor && patient.doctor.trim()) {
      const parsed = patient.doctor
        .split(/[\n,]+/)
        .map((d) => d.trim())
        .filter(Boolean);
      setDoctorListForm(parsed.length > 0 ? parsed : ['']);
    } else {
      setDoctorListForm(['']);
    }

    // Diagnosa
    setDiagnosisForm(patient.diagnosis || '');

    // Ventilasi
    setVentilationForm(patient.ventilation || '');

    // Alat Invasif
    if (patient.invasiveDevices && patient.invasiveDevices.length > 0) {
      setInvasiveListForm([...patient.invasiveDevices]);
    } else {
      setInvasiveListForm([]);
    }

    // Catatan
    setNotesForm(patient.notes || '');
  }, [patient, activeModal]);

  // Fungsi buka modal khusus
  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setNewDoctorName('');
    setNewDoctorFeedback(null);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // --- Handlers: Identitas Pasien & Post-Op ---
  const handleAddPostOp = () => {
    const today = currentDateStr || new Date().toISOString().split('T')[0];
    const newOp: PostOpItem = {
      id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      date: today,
      procedure: '',
      notes: '',
    };
    setPostOpsList((prev) => [...prev, newOp]);
  };

  const handleUpdatePostOp = (id: string, field: keyof PostOpItem, val: string) => {
    setPostOpsList((prev) =>
      prev.map((op) => (op.id === id ? { ...op, [field]: val } : op))
    );
  };

  const handleRemovePostOp = (id: string) => {
    setPostOpsList((prev) => prev.filter((op) => op.id !== id));
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDayOfCare = identityForm.dayOfCare || '';
    if (identityForm.admissionDate) {
      const autoDay = calculateDayOfCare(identityForm.admissionDate, currentDateStr);
      if (autoDay) finalDayOfCare = autoDay;
    }

    const validPostOps = postOpsList.filter(
      (op) => op.procedure.trim() || op.date
    );

    let legacyPostOpDay = identityForm.postOpDay || '';
    if (validPostOps.length > 0) {
      legacyPostOpDay = validPostOps
        .map((op) => {
          const info = calculatePostOpInfo(op.date, currentDateStr);
          const code = info ? info.code : '';
          return `${code} ${op.procedure}`.trim();
        })
        .join('; ');
    }

    onUpdatePatient({
      name: identityForm.name || '',
      rm: identityForm.rm || '',
      age: identityForm.age || '',
      gender: identityForm.gender || 'L',
      weight: identityForm.weight || '',
      origin: identityForm.origin || '',
      admissionDate: identityForm.admissionDate || '',
      dayOfCare: finalDayOfCare,
      postOps: validPostOps,
      postOpDay: legacyPostOpDay,
    });
    closeModal();
  };

  // --- Handlers: DPJP & Konsulen ---
  const handleDoctorChange = (index: number, val: string) => {
    const updated = [...doctorListForm];
    updated[index] = val;
    setDoctorListForm(updated);
  };

  const handleAddDoctorField = () => {
    setDoctorListForm((prev) => [...prev, '']);
  };

  const handleRemoveDoctorField = (index: number) => {
    if (doctorListForm.length <= 1) {
      setDoctorListForm(['']);
      return;
    }
    setDoctorListForm((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveNewDoctorMaster = () => {
    const clean = newDoctorName.trim();
    if (!clean) return;

    if (onAddCustomDoctor) {
      onAddCustomDoctor(clean);
    }

    setDoctorListForm((prev) => {
      const copy = [...prev];
      if (copy.length === 1 && !copy[0].trim()) {
        copy[0] = clean;
        return copy;
      }
      if (!copy.includes(clean)) {
        return [...copy, clean];
      }
      return copy;
    });

    setNewDoctorFeedback(`"${clean}" berhasil disimpan ke daftar dokter master!`);
    setNewDoctorName('');
    setTimeout(() => setNewDoctorFeedback(null), 3500);
  };

  const handleSaveDoctors = (e: React.FormEvent) => {
    e.preventDefault();
    const validDoctors = doctorListForm.map((d) => d.trim()).filter(Boolean);
    const doctorStr = validDoctors.join(', ');

    onUpdatePatient({
      doctors: validDoctors,
      doctor: doctorStr,
    });
    closeModal();
  };

  // --- Handlers: Diagnosa Medis ---
  const handleSaveDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePatient({ diagnosis: diagnosisForm.trim() });
    closeModal();
  };

  // --- Handlers: Ventilasi ---
  const handleSaveVentilation = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePatient({ ventilation: ventilationForm.trim() });
    closeModal();
  };

  // --- Handlers: Alat Invasif ---
  const handleAddInvasive = () => {
    const today = currentDateStr || new Date().toISOString().split('T')[0];
    const newDev: InvasiveDeviceItem = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: 'Infus',
      customName: '',
      sizeNumber: 'No. 20',
      position: 'Tangan Kanan',
      date: today,
      notes: '',
    };
    setInvasiveListForm((prev) => [...prev, newDev]);
  };

  const handleUpdateInvasive = (
    id: string,
    field: keyof InvasiveDeviceItem,
    val: string
  ) => {
    setInvasiveListForm((prev) =>
      prev.map((dev) => (dev.id === id ? { ...dev, [field]: val } : dev))
    );
  };

  const handleRemoveInvasive = (id: string) => {
    setInvasiveListForm((prev) => prev.filter((dev) => dev.id !== id));
  };

  const handleSaveInvasive = (e: React.FormEvent) => {
    e.preventDefault();
    const validInvasive = invasiveListForm.filter(
      (dev) => dev.type || dev.customName || dev.position
    );

    let legacyInvasiveStr = '';
    if (validInvasive.length > 0) {
      legacyInvasiveStr = validInvasive
        .map((d) => {
          const name = d.type === 'Lainnya' ? d.customName || 'Lainnya' : d.type;
          const details = [name];
          if (d.sizeNumber) details.push(d.sizeNumber);
          if (d.position) details.push(`(${d.position})`);
          if (d.date) details.push(`tgl ${formatDateID(d.date)}`);
          return details.join(' ');
        })
        .join(', ');
    }

    onUpdatePatient({
      invasiveDevices: validInvasive,
      invasive: legacyInvasiveStr,
    });
    closeModal();
  };

  // --- Handlers: Catatan Perawat / Alergi ---
  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePatient({ notes: notesForm.trim() });
    closeModal();
  };

  // Hitung otomatis hari rawat saat ini untuk display
  const activeDayOfCare = patient.admissionDate
    ? calculateDayOfCare(patient.admissionDate, currentDateStr) || patient.dayOfCare
    : patient.dayOfCare;

  // Cek apakah ada alat invasif yang waktunya ganti
  const devicesNeedingReplacement = (patient.invasiveDevices || []).filter((d) => {
    const check = checkInvasiveReplacement(d, currentDateStr);
    return check.needsReplacement;
  });

  const hasPatientData = Boolean(
    patient.name?.trim() ||
    patient.rm?.trim() ||
    patient.admissionDate
  );

  return (
    <>
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-all text-slate-800 dark:text-slate-100">
        {/* Peringatan Waktunya Ganti Alat Invasif (Jika Ada) */}
        {devicesNeedingReplacement.length > 0 && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/60 border-l-4 border-rose-500 p-3 rounded-r-xl text-rose-800 dark:text-rose-200 text-xs shadow-sm flex items-start justify-between gap-2.5 animate-pulse print-hidden">
            <div className="flex items-start gap-2.5">
              <i className="fa-solid fa-triangle-exclamation text-rose-600 dark:text-rose-400 text-base mt-0.5 shrink-0"></i>
              <div>
                <div className="font-bold text-sm text-rose-900 dark:text-rose-100 mb-0.5">
                  Peringatan: Waktunya Ganti Alat Invasif!
                </div>
                <div className="space-y-1">
                  {devicesNeedingReplacement.map((d, i) => {
                    const check = checkInvasiveReplacement(d, currentDateStr);
                    const name = d.type === 'Lainnya' ? d.customName || 'Alat' : d.type;
                    return (
                      <div key={i} className="font-medium">
                        • <strong>{name}</strong> {d.sizeNumber ? `(${d.sizeNumber})` : ''} di {d.position || 'pasien'} terpasang sejak {formatDateID(d.date)} —{' '}
                        <span className="font-bold text-rose-700 dark:text-rose-300 underline">{check.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={() => openModal('invasive')}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
            >
              Kelola Alat Invasif
            </button>
          </div>
        )}

        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 bg-teal-600 text-white font-bold text-sm rounded-lg shadow-sm">
              {currentBed}
            </span>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Informasi Pasien</h3>
              {hasPatientData ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terisi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Kosong
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap print-hidden">
            {/* Tombol Utama Ubah Identitas Pasien */}
            <button
              onClick={() => openModal('patient_identity')}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
              title="Isi atau perbarui data identitas pasien & operasi"
            >
              <i className="fa-solid fa-user-pen"></i>
              <span>{hasPatientData ? 'Ubah Data Pasien' : 'Isi Data Pasien'}</span>
            </button>

            <button
              onClick={onPrintOperan}
              className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-2 shadow-sm cursor-pointer"
              title="Cetak lembar operan pasien ini"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak Operan Bed Ini</span>
            </button>

            {onOpenAllOperanModal && (
              <button
                onClick={onOpenAllOperanModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Buka rekap operan asuhan keperawatan semua pasien ICU"
              >
                <i className="fa-solid fa-clipboard-user"></i>
                <span>Operan Semua Pasien</span>
              </button>
            )}

            <button
              onClick={onOpenTransferModal}
              className="bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 transition flex items-center gap-2 shadow-sm cursor-pointer"
              title="Pindah ruangan/bed pasien tanpa ketik ulang"
            >
              <i className="fa-solid fa-truck-medical"></i>
              <span>Pindah Bed</span>
            </button>

            <button
              onClick={onDischargePatient}
              className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition flex items-center gap-2 shadow-sm cursor-pointer"
              title="Kosongkan bed jika pasien pulang/pindah"
            >
              <i className="fa-solid fa-person-walking-arrow-right"></i>
              <span>Pasien Keluar</span>
            </button>
          </div>
        </div>

        {/* Content Display */}
        {!hasPatientData ? (
          /* Empty State Display */
          <div className="bg-slate-50 dark:bg-slate-850 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl mb-3 shadow-2xs">
              <i className="fa-solid fa-hospital-user"></i>
            </div>
            <h4 className="font-bold text-slate-700 text-base mb-1">
              Belum Ada Data Pasien di {currentBed}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Silakan klik tombol di bawah untuk mengisi identitas pasien, jenis kelamin, tanggal masuk, dan riwayat operasi.
            </p>
            <button
              onClick={() => openModal('patient_identity')}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow transition cursor-pointer"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>+ Isi Data Pasien Sekarang</span>
            </button>
          </div>
        ) : (
          /* Structured Clinical Display */
          <div className="space-y-4">
            {/* Primary Patient Identifiers Banner */}
            <div className="bg-gradient-to-r from-teal-50/70 dark:from-teal-950/40 via-slate-50/50 dark:via-slate-900 to-teal-50/40 dark:to-teal-950/30 border border-teal-100/80 dark:border-teal-900/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {patient.name?.trim() ? patient.name.trim().charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-black text-slate-800 dark:text-slate-100 text-lg md:text-xl tracking-tight">
                      {patient.name || '-'}
                    </h2>
                    {patient.rm && (
                      <span className="px-2.5 py-0.5 bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold text-xs rounded-md shadow-2xs">
                        RM: {patient.rm}
                      </span>
                    )}
                    {/* Badge Jenis Kelamin */}
                    {patient.gender && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-xs border flex items-center gap-1 shadow-2xs ${
                          patient.gender === 'P' || patient.gender === 'Perempuan'
                            ? 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            patient.gender === 'P' || patient.gender === 'Perempuan'
                              ? 'fa-venus text-pink-500'
                              : 'fa-mars text-blue-500'
                          }`}
                        ></i>
                        <span>
                          {patient.gender === 'P' || patient.gender === 'Perempuan'
                            ? 'Perempuan (P)'
                            : 'Laki-laki (L)'}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1 flex-wrap font-medium">
                    {patient.age && (
                      <span>
                        <i className="fa-solid fa-cake-candles text-slate-400 mr-1"></i>
                        Usia: <strong className="text-slate-700 dark:text-slate-200">{patient.age}</strong>
                      </span>
                    )}
                    {patient.weight && (
                      <span>
                        <i className="fa-solid fa-weight-scale text-slate-400 mr-1"></i>
                        BB: <strong className="text-slate-700 dark:text-slate-200">{patient.weight} kg</strong>
                      </span>
                    )}
                    {patient.origin && (
                      <span>
                        <i className="fa-solid fa-door-open text-slate-400 mr-1"></i>
                        Asal: <strong className="text-slate-700 dark:text-slate-200">{patient.origin}</strong>
                      </span>
                    )}
                    {patient.admissionDate && (
                      <span className="text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                        <i className="fa-regular fa-calendar-check text-teal-600 dark:text-teal-400 mr-1"></i>
                        Masuk: <strong>{formatDateID(patient.admissionDate)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Badges Rawat & Post-Op */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Hari Rawat (Otomatis / Manual) */}
                {activeDayOfCare && (
                  <div className="bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 px-3 py-1.5 rounded-lg shadow-2xs text-center">
                    <span className="block text-[10px] text-teal-600 dark:text-teal-400 uppercase font-bold tracking-wider">
                      Hari Rawat
                    </span>
                    <span className="font-black text-teal-800 dark:text-teal-200 text-sm">
                      Ke-{activeDayOfCare}
                    </span>
                  </div>
                )}

                {/* Multiple Post-Op Badges */}
                {patient.postOps && patient.postOps.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-w-sm">
                    {patient.postOps.map((op, idx) => {
                      const postOpInfo = calculatePostOpInfo(op.date, currentDateStr);
                      return (
                        <div
                          key={op.id || idx}
                          className="bg-white dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 px-2.5 py-1 rounded-lg shadow-2xs text-xs flex items-center gap-2"
                        >
                          <span className="px-1.5 py-0.2 rounded font-black text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 text-[11px] border border-amber-300 dark:border-amber-700">
                            {postOpInfo ? postOpInfo.code : 'Post Op'}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {op.procedure || 'Operasi'}
                            </span>
                            {op.date && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                                ({formatDateID(op.date)})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : patient.postOpDay ? (
                  <div className="bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 px-3 py-1.5 rounded-lg shadow-2xs text-center">
                    <span className="block text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">
                      Post Op
                    </span>
                    <span className="font-black text-amber-800 dark:text-amber-200 text-xs">
                      {patient.postOpDay}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Medical Info Grid (Masing-masing dengan Tombol Edit Terpisah) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Dokter DPJP & Konsulen */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-teal-300 dark:hover:border-teal-600 transition">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-user-doctor text-teal-600 dark:text-teal-400"></i>
                      <span>DPJP & Konsulen</span>
                    </div>
                    {/* Tombol Edit DPJP */}
                    <button
                      onClick={() => openModal('doctor')}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-slate-600 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer print-hidden"
                      title="Edit dokter DPJP & Konsulen"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 space-y-1">
                    {patient.doctors && patient.doctors.length > 0 ? (
                      patient.doctors.map((doc, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-teal-500 font-bold text-[11px] mt-0.5">•</span>
                          <span>{doc}</span>
                        </div>
                      ))
                    ) : patient.doctor ? (
                      <div className="whitespace-pre-line leading-relaxed">
                        {patient.doctor}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic font-normal">Belum diisi</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Diagnosa Medis */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-600 transition">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-stethoscope text-indigo-600 dark:text-indigo-400"></i>
                      <span>Diagnosa Medis</span>
                    </div>
                    {/* Tombol Edit Diagnosa */}
                    <button
                      onClick={() => openModal('diagnosis')}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer print-hidden"
                      title="Edit Diagnosa Medis"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {patient.diagnosis || (
                      <span className="text-slate-400 dark:text-slate-500 italic font-normal">Belum diisi</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Ventilasi & Oksigenasi */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-sky-300 dark:hover:border-sky-600 transition">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-lungs text-sky-600 dark:text-sky-400"></i>
                      <span>Ventilasi / Oksigenasi</span>
                    </div>
                    {/* Tombol Edit Ventilasi */}
                    <button
                      onClick={() => openModal('ventilation')}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer print-hidden"
                      title="Edit Pola Ventilasi & Oksigenasi"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {patient.ventilation || (
                      <span className="text-slate-400 dark:text-slate-500 italic font-normal">Belum diisi</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Alat Invasif Terpasang */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-600 transition">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-bold text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-syringe text-emerald-600 dark:text-emerald-400"></i>
                      <span>Alat Invasif Terpasang</span>
                    </div>
                    {/* Tombol Edit Alat Invasif */}
                    <button
                      onClick={() => openModal('invasive')}
                      className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer print-hidden"
                      title="Edit Alat Invasif Terpasang"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {patient.invasiveDevices && patient.invasiveDevices.length > 0 ? (
                      patient.invasiveDevices.map((dev, idx) => {
                        const check = checkInvasiveReplacement(dev, currentDateStr);
                        const devName =
                          dev.type === 'Lainnya' ? dev.customName || 'Alat Invasif' : dev.type;
                        return (
                          <div
                            key={dev.id || idx}
                            className={`p-2 rounded-lg border text-xs leading-tight transition ${
                              check.needsReplacement
                                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-bold">
                                {devName} {dev.sizeNumber ? `(${dev.sizeNumber})` : ''}
                              </span>
                              {check.needsReplacement ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                  ⚠️ Waktunya Ganti!
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {check.message}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                              <span>Lokasi: {dev.position || '-'}</span>
                              {dev.date && <span>Tgl: {formatDateID(dev.date)}</span>}
                            </div>
                          </div>
                        );
                      })
                    ) : patient.invasive ? (
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                        {patient.invasive}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic font-normal text-xs">
                        Belum ada alat terpasang
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Catatan Khusus & Alergi (Dengan Tombol Edit Khusus) */}
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 flex-1">
                <div className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0 text-base">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-0.5">
                    Catatan Perawat / Riwayat Alergi
                  </div>
                  <div className="text-xs text-amber-800 dark:text-amber-300 whitespace-pre-line leading-relaxed font-medium">
                    {patient.notes ? (
                      patient.notes
                    ) : (
                      <span className="italic text-amber-700/60 dark:text-amber-400/60 font-normal">
                        Belum ada catatan khusus atau riwayat alergi yang ditambahkan.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tombol Edit Catatan */}
              <button
                onClick={() => openModal('notes')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold shadow-2xs transition flex items-center gap-1.5 shrink-0 cursor-pointer print-hidden"
                title="Edit Catatan Perawat & Alergi"
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Edit Catatan</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          MODAL 1: EDIT IDENTITAS PASIEN & POST-OP
          ========================================================================= */}
      {activeModal === 'patient_identity' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto sm:my-6 transform transition-all border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
            <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-id-card"></i>
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    Edit Identitas Pasien & Riwayat Operasi
                  </h3>
                  <p className="text-xs text-teal-100">Bed Aktif: <strong>{currentBed}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-teal-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveIdentity} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Identitas Pasien */}
              <div>
                <h4 className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <i className="fa-solid fa-user text-teal-600 dark:text-teal-400"></i>
                  <span>Identitas Pasien</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Pasien <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={identityForm.name || ''}
                      onChange={(e) => setIdentityForm({ ...identityForm, name: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="Tn. Budi Santoso"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. Rekam Medis (RM)
                    </label>
                    <input
                      type="text"
                      value={identityForm.rm || ''}
                      onChange={(e) => setIdentityForm({ ...identityForm, rm: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="00-12-34"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tgl. Lahir / Umur
                    </label>
                    <input
                      type="text"
                      value={identityForm.age || ''}
                      onChange={(e) => setIdentityForm({ ...identityForm, age: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="45 Thn"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kelamin
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIdentityForm({ ...identityForm, gender: 'L' })}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                          identityForm.gender === 'L' || identityForm.gender === 'Laki-laki' || !identityForm.gender
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                        }`}
                      >
                        <i className="fa-solid fa-mars"></i>
                        <span>Laki (L)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdentityForm({ ...identityForm, gender: 'P' })}
                        className={`py-2 px-2 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                          identityForm.gender === 'P' || identityForm.gender === 'Perempuan'
                            ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                        }`}
                      >
                        <i className="fa-solid fa-venus"></i>
                        <span>Perempuan (P)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Berat Badan (BB)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.1"
                        value={identityForm.weight || ''}
                        onChange={(e) => setIdentityForm({ ...identityForm, weight: e.target.value })}
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-l-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="60"
                      />
                      <span className="bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 rounded-r-lg font-bold">
                        kg
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Asal Ruangan
                    </label>
                    <input
                      type="text"
                      value={identityForm.origin || ''}
                      onChange={(e) => setIdentityForm({ ...identityForm, origin: e.target.value })}
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="IGD, Rawat Inap, ICU..."
                    />
                  </div>

                  <div className="bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/90 dark:border-teal-800 rounded-xl p-2">
                    <label className="block text-[11px] font-bold text-teal-900 dark:text-teal-200 mb-0.5">
                      Tanggal Masuk
                    </label>
                    <input
                      type="date"
                      value={identityForm.admissionDate || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const autoDay = calculateDayOfCare(val, currentDateStr);
                        setIdentityForm({
                          ...identityForm,
                          admissionDate: val,
                          dayOfCare: autoDay || identityForm.dayOfCare,
                        });
                      }}
                      className="w-full border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-700 dark:text-slate-100"
                    />
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-teal-800 dark:text-teal-300 font-semibold">Hari Rawat:</span>
                      {identityForm.admissionDate ? (
                        <span className="font-bold text-teal-800 dark:text-teal-200 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-teal-300 dark:border-teal-700">
                          Ke-{calculateDayOfCare(identityForm.admissionDate, currentDateStr) || 1}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={identityForm.dayOfCare || ''}
                          onChange={(e) => setIdentityForm({ ...identityForm, dayOfCare: e.target.value })}
                          placeholder="Manual (3)"
                          className="w-16 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded px-1 text-[10px] text-center"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tindakan Operasi & Post-Op */}
              <div>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="fa-solid fa-bed-pulse text-amber-600 dark:text-amber-400"></i>
                    <span>Tindakan Operasi & Hari Post-Op (H+X Otomatis)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddPostOp}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i>
                    <span>Tambah Operasi</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {postOpsList.length === 0 ? (
                    <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-dashed border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-800 dark:text-amber-300 mb-2">
                        Belum ada data tindakan operasi.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddPostOp}
                        className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <i className="fa-solid fa-plus text-amber-600 dark:text-amber-400"></i>
                        <span>+ Tambah Operasi Pasien</span>
                      </button>
                    </div>
                  ) : (
                    postOpsList.map((op, idx) => {
                      const postOpInfo = calculatePostOpInfo(op.date, currentDateStr);
                      return (
                        <div
                          key={op.id}
                          className="bg-amber-50/40 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex flex-wrap items-center gap-3 relative"
                        >
                          <div className="flex items-center gap-1.5 min-w-[70px]">
                            <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            {postOpInfo && (
                              <span className="px-2 py-0.5 rounded-md font-black text-xs bg-amber-500 text-white shadow-2xs">
                                {postOpInfo.code}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-[180px]">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Jenis Operasi / Tindakan
                            </label>
                            <input
                              type="text"
                              value={op.procedure}
                              onChange={(e) => handleUpdatePostOp(op.id, 'procedure', e.target.value)}
                              placeholder="Laparotomi Eksplorasi, Trepanasi..."
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>

                          <div className="w-36">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Tanggal Operasi
                            </label>
                            <input
                              type="date"
                              value={op.date}
                              onChange={(e) => handleUpdatePostOp(op.id, 'date', e.target.value)}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePostOp(op.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                            title="Hapus operasi ini"
                          >
                            <i className="fa-solid fa-trash-can text-sm"></i>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Simpan Data Pasien</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT DOKTER DPJP & KONSULEN
          ========================================================================= */}
      {activeModal === 'doctor' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-auto sm:my-6 transform transition-all border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
            <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-user-doctor"></i>
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    Edit Dokter DPJP & Konsulen
                  </h3>
                  <p className="text-xs text-teal-100">Bed: <strong>{currentBed}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-teal-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveDoctors} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daftar Dokter yang Merawat:</span>
                <button
                  type="button"
                  onClick={handleAddDoctorField}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                  <span>Tambah Dokter</span>
                </button>
              </div>

              {/* List Input Dokter */}
              <div className="space-y-2.5">
                {doctorListForm.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-24 text-right shrink-0">
                      {idx === 0 ? 'DPJP Utama:' : `Konsulen ${idx}:`}
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        list="modalDoctorsList"
                        value={doc}
                        onChange={(e) => handleDoctorChange(idx, e.target.value)}
                        placeholder="Pilih dari daftar atau ketik nama dokter..."
                        className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <i className="fa-solid fa-user-doctor absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500 text-xs"></i>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoctorField(idx)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Hapus dokter ini"
                    >
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                  </div>
                ))}
                <datalist id="modalDoctorsList">
                  {doctorsList.map((d, i) => (
                    <option key={i} value={d} />
                  ))}
                </datalist>
              </div>

              {/* Fitur Tambah Dokter Baru ke Master Database */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 mt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  <i className="fa-solid fa-user-plus text-teal-600 dark:text-teal-400"></i>
                  <span>Tambah Dokter Baru ke Daftar Tersimpan</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveNewDoctorMaster();
                      }
                    }}
                    placeholder="Ketik nama dokter baru (mis: dr. Satria Sp.OT)..."
                    className="flex-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNewDoctorMaster}
                    disabled={!newDoctorName.trim()}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <i className="fa-solid fa-floppy-disk text-[11px]"></i>
                    <span>Simpan Dokter</span>
                  </button>
                </div>
                {newDoctorFeedback && (
                  <div className="mt-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400"></i>
                    <span>{newDoctorFeedback}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Simpan DPJP & Konsulen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT DIAGNOSA MEDIS
          ========================================================================= */}
      {activeModal === 'diagnosis' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto sm:my-6 transform transition-all border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-stethoscope"></i>
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">Edit Diagnosa Medis</h3>
                  <p className="text-xs text-indigo-100">Bed: <strong>{currentBed}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-indigo-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveDiagnosis} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Diagnosa Utama & Penyerta Pasien
                </label>
                <textarea
                  rows={4}
                  value={diagnosisForm}
                  onChange={(e) => setDiagnosisForm(e.target.value)}
                  placeholder="Tuliskan diagnosa medis (mis: Syok Septik ec Pneumonia, Post Laparatomi H-1, dll)..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  autoFocus
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Bantuan Cepat / Diagnosa Umum ICU:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Syok Septik',
                    'Pneumonia',
                    'Post Laparatomi Eksplorasi',
                    'Post Craniotomy',
                    'CKD on HD',
                    'Post EVD',
                    'EDH',
                    'SDH',
                    'KAD (Ketoasidosis Diabetik)',
                    'Post Op Excici Tumor',
                  ].map((diag) => (
                    <button
                      key={diag}
                      type="button"
                      onClick={() => {
                        setDiagnosisForm((prev) =>
                          prev ? `${prev}, ${diag}` : diag
                        );
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 font-medium transition cursor-pointer"
                    >
                      + {diag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Simpan Diagnosa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT VENTILASI & OKSIGENASI
          ========================================================================= */}
      {activeModal === 'ventilation' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto sm:my-6 transform transition-all border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
            <div className="bg-gradient-to-r from-sky-700 to-sky-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-lungs"></i>
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">Edit Pola Ventilasi & Oksigenasi</h3>
                  <p className="text-xs text-sky-100">Bed: <strong>{currentBed}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-sky-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveVentilation} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mode Ventilator / Terapi Oksigenasi
                </label>
                <textarea
                  rows={3}
                  value={ventilationForm}
                  onChange={(e) => setVentilationForm(e.target.value)}
                  placeholder="Misal: Ventilator SIMV, FiO2 50%, PEEP 5, RR 14 | SpO2 99%..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  autoFocus
                />
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Preset Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Room Air (SpO2 98%)',
                    'O2 Nasal 4 lpm',
                    'O2 Simple Mask 6 lpm',
                    'NRM 10 lpm',
                    'NRM 12 lpm',
                    'HFNC (FiO2 50%, Flow 40)',
                    'Ventilator Mode Bipap',
                    'Ventilator Mode CPAP/PSV',
                    'Ventilator Mode PCV',
                    'T-Piece O2 8 lpm',
                  ].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setVentilationForm(mode)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 font-medium transition cursor-pointer"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Simpan Ventilasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: EDIT ALAT INVASIF TERPASANG & PEMANTAUAN MASA PAKAI
          ========================================================================= */}
      {activeModal === 'invasive' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto sm:my-6 transform transition-all border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-syringe"></i>
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    Edit Alat Invasif Terpasang & Jadwal Ganti
                  </h3>
                  <p className="text-xs text-emerald-100">Bed: <strong>{currentBed}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-emerald-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveInvasive} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Daftar Alat Invasif Pasien:</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Batas ganti: <strong>Infus &gt; 3 hari</strong> • <strong>NGT &gt; 10 hari</strong> • <strong>DC/Kateter &gt; 14 hari</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddInvasive}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                  <span>Tambah Alat Invasif</span>
                </button>
              </div>

              {/* List Alat Invasif */}
              <div className="space-y-3">
                {invasiveListForm.length === 0 ? (
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/30 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mb-3">
                      Belum ada alat invasif terpasang yang didaftarkan.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddInvasive}
                      className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <i className="fa-solid fa-plus text-emerald-600 dark:text-emerald-400"></i>
                      <span>+ Tambah Alat Invasif Pertama</span>
                    </button>
                  </div>
                ) : (
                  invasiveListForm.map((dev, idx) => {
                    const check = checkInvasiveReplacement(dev, currentDateStr);
                    return (
                      <div
                        key={dev.id}
                        className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                          check.needsReplacement
                            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                              {dev.type === 'Lainnya' ? dev.customName || 'Alat Invasif' : dev.type}
                            </span>
                          </div>

                          {/* Badge Status Masa Pakai */}
                          {check.needsReplacement ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-600 text-white shadow-2xs flex items-center gap-1 animate-pulse">
                              <i className="fa-solid fa-triangle-exclamation"></i>
                              {check.message}
                            </span>
                          ) : dev.date ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              {check.message}
                            </span>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleRemoveInvasive(dev.id)}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Hapus alat ini"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Jenis Alat
                            </label>
                            <select
                              value={dev.type}
                              onChange={(e) => handleUpdateInvasive(dev.id, 'type', e.target.value)}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              {DEFAULT_INVASIVE_TYPES.map((t) => (
                                <option key={t} value={t} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Nomor / Ukuran
                            </label>
                            <input
                              type="text"
                              value={dev.sizeNumber || ''}
                              onChange={(e) => handleUpdateInvasive(dev.id, 'sizeNumber', e.target.value)}
                              placeholder="No. 18, Fr 16..."
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Posisi / Lokasi
                            </label>
                            <input
                              type="text"
                              value={dev.position || ''}
                              onChange={(e) => handleUpdateInvasive(dev.id, 'position', e.target.value)}
                              placeholder="Tangan Kanan..."
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Tanggal Pasang
                            </label>
                            <input
                              type="date"
                              value={dev.date}
                              onChange={(e) => handleUpdateInvasive(dev.id, 'date', e.target.value)}
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                            />
                          </div>
                        </div>

                        {dev.type === 'Lainnya' && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                              Nama Alat Manual (Lainnya)
                            </label>
                            <input
                              type="text"
                              value={dev.customName || ''}
                              onChange={(e) => handleUpdateInvasive(dev.id, 'customName', e.target.value)}
                              placeholder="Ketik nama alat invasif lainnya (mis: WSD, Drain Abdomen, PICC)..."
                              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Simpan Alat Invasif</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: EDIT CATATAN PERAWAT / RIWAYAT ALERGI
          ========================================================================= */}
      {activeModal === 'notes' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[90] overflow-y-auto modal-backdrop-scroll">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto sm:my-6 transform transition-all border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh]">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  <i className="fa-solid fa-note-sticky"></i>
                </div>
                <div>
                  <h3 className="font-bold text-base md:text-lg">
                    Edit Catatan Perawat & Riwayat Alergi
                  </h3>
                  <p className="text-xs text-amber-100">Bed: <strong>{currentBed}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-amber-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Perawat, Riwayat Alergi Obat & Instruksi Khusus
                </label>
                <textarea
                  rows={4}
                  value={notesForm}
                  onChange={(e) => setNotesForm(e.target.value)}
                  placeholder="Riwayat Alergi Obat (Ceftriaxone, Penisilin), Instruksi Puasa, Awasi TTV..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-y placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  autoFocus
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  Pilihan Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Alergi',
                    'Cek Lab',
                    'Foto Torax',
                    'weaning Ventilator',
                    'Puasa Pre-Op',
                    'Konsul',
                    'Setting EVD',
                    'Head Up 30-45°',
                    'Rencana Ekstubasi Hari Ini',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setNotesForm((prev) => (prev ? `${prev}\n• ${tag}` : `• ${tag}`));
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 font-medium transition cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Simpan Catatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
