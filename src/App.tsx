import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BedData,
  DayBedsData,
  PatientInfo,
  Medication,
  CloudStatusType,
} from './types';
import {
  DEFAULT_BEDS,
  BASE_DOCTORS,
  createDefaultBedData,
} from './constants';
import {
  initFirebaseAuth,
  subscribeToDateRecords,
  saveBedsToRemote,
  getBedsForDate,
  getCustomBeds,
  saveCustomBeds,
  getCustomDoctors,
  addCustomDoctor,
} from './services/firebase';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PatientInfoCard } from './components/PatientInfoCard';
import { InjectionSchedule } from './components/InjectionSchedule';
import { FluidBalanceTable } from './components/FluidBalanceTable';
import { PumpCalculator, PumpLabelData } from './components/PumpCalculator';
import {
  BedModal,
  TransferModal,
  MedicationModal,
  ColumnModal,
  DialogModal,
  DialogConfig,
  SyringePrintModal,
} from './components/Modals';
import { PrintTemplates, SyringeLabelItem } from './components/PrintTemplates';

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [beds, setBeds] = useState<string[]>(() => {
    const custom = getCustomBeds();
    return [...DEFAULT_BEDS, ...custom];
  });
  const [currentBed, setCurrentBed] = useState<string>('BED 1');
  const [currentDateStr, setCurrentDateStr] = useState<string>(getLocalDateString());
  const [dayBeds, setDayBeds] = useState<DayBedsData>({});
  const [cloudStatus, setCloudStatus] = useState<CloudStatusType>('connecting');
  const [activeTab, setActiveTab] = useState<'schedule' | 'balance' | 'pump'>('schedule');

  // Undo copy state
  const [undoBackup, setUndoBackup] = useState<DayBedsData | null>(null);
  const [undoSeconds, setUndoSeconds] = useState<number | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Doctors list (base + custom)
  const [doctorsList, setDoctorsList] = useState<string[]>(() => {
    return [...BASE_DOCTORS, ...getCustomDoctors()];
  });

  // Modals state
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [medModalState, setMedModalState] = useState<{
    isOpen: boolean;
    editingIndex: number | null;
    med: Medication | null;
  }>({
    isOpen: false,
    editingIndex: null,
    med: null,
  });
  const [colModalState, setColModalState] = useState<{
    isOpen: boolean;
    type: 'intake_parenteral' | 'intake_enteral' | 'output' | null;
  }>({
    isOpen: false,
    type: null,
  });
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
  });

  // Print states
  const [pumpLabelData, setPumpLabelData] = useState<PumpLabelData | null>(null);
  const [syringeLabels, setSyringeLabels] = useState<SyringeLabelItem[] | null>(null);
  const [syringeModalState, setSyringeModalState] = useState<{
    isOpen: boolean;
    med: Medication | null;
  }>({
    isOpen: false,
    med: null,
  });

  // Helper for quick alert dialog
  const showAlert = (title: string, message: string) => {
    setDialogConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
    });
  };

  // Helper for confirmation dialog
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel,
    });
  };

  // Ensure current bed data exists
  const currentBedData: BedData = dayBeds[currentBed] || createDefaultBedData();

  // Load and subscribe to date records
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    setCloudStatus('connecting');

    initFirebaseAuth().then((isAuthed) => {
      if (!isMounted) return;

      if (isAuthed) {
        unsubscribe = subscribeToDateRecords(
          currentDateStr,
          (remoteBeds) => {
            if (!isMounted) return;
            if (remoteBeds) {
              setDayBeds(remoteBeds);
            } else {
              setDayBeds({});
            }
            setCloudStatus('synced');
          },
          (err) => {
            if (!isMounted) return;
            console.warn('Subscription error, falling back to local:', err);
            setCloudStatus('offline');
          }
        );
      } else {
        // Fallback to local storage
        getBedsForDate(currentDateStr).then((local) => {
          if (!isMounted) return;
          if (local) setDayBeds(local);
          else setDayBeds({});
          setCloudStatus('offline');
        });
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [currentDateStr]);

  // Persist bed changes
  const saveBedChanges = useCallback(
    async (bedId: string, updatedBedData: BedData) => {
      setDayBeds((prev) => {
        const next = {
          ...prev,
          [bedId]: updatedBedData,
        };
        return next;
      });

      setCloudStatus('saving');
      const success = await saveBedsToRemote(currentDateStr, {
        [bedId]: updatedBedData,
      });
      setCloudStatus(success ? 'synced' : 'offline');
    },
    [currentDateStr]
  );

  // Update whole day data (for undo and copy prev day)
  const saveAllBedsData = useCallback(
    async (allBeds: DayBedsData) => {
      setDayBeds(allBeds);
      setCloudStatus('saving');
      const success = await saveBedsToRemote(currentDateStr, allBeds);
      setCloudStatus(success ? 'synced' : 'offline');
    },
    [currentDateStr]
  );

  // Patient info updates
  const handleUpdatePatient = (updated: Partial<PatientInfo>) => {
    const existing = currentBedData;
    const newPatient = {
      ...existing.patient,
      ...updated,
    };

    // If doctor updated, sync with custom doctors list
    if (updated.doctor) {
      updated.doctor.split(',').forEach((d) => {
        const trimmed = d.trim();
        if (trimmed) {
          addCustomDoctor(trimmed);
          setDoctorsList((prev) =>
            prev.includes(trimmed) ? prev : [...prev, trimmed]
          );
        }
      });
    }

    const newBedData = {
      ...existing,
      patient: newPatient,
    };
    saveBedChanges(currentBed, newBedData);
  };

  // Medication handlers
  const handleToggleMedHour = (medIndex: number, hour: string) => {
    const meds = [...currentBedData.medications];
    const med = { ...meds[medIndex] };
    const checked = med.checkedHours || [];

    if (checked.includes(hour)) {
      med.checkedHours = checked.filter((h) => h !== hour);
    } else {
      med.checkedHours = [...checked, hour];
    }
    meds[medIndex] = med;

    const newBedData = {
      ...currentBedData,
      medications: meds,
    };
    saveBedChanges(currentBed, newBedData);
  };

  const handleSaveMedication = (med: Medication) => {
    const meds = [...currentBedData.medications];
    if (med.doctor) {
      addCustomDoctor(med.doctor);
      setDoctorsList((prev) =>
        prev.includes(med.doctor) ? prev : [...prev, med.doctor]
      );
    }

    if (
      medModalState.editingIndex !== null &&
      medModalState.editingIndex >= 0
    ) {
      meds[medModalState.editingIndex] = med;
    } else {
      meds.push(med);
    }

    const newBedData = {
      ...currentBedData,
      medications: meds,
    };
    saveBedChanges(currentBed, newBedData);
    setMedModalState({ isOpen: false, editingIndex: null, med: null });
  };

  const handleDeleteMedication = (index: number) => {
    showConfirm(
      'Konfirmasi Hapus',
      'Hapus obat ini dari jadwal terapi?',
      () => {
        const meds = [...currentBedData.medications];
        meds.splice(index, 1);
        const newBedData = {
          ...currentBedData,
          medications: meds,
        };
        saveBedChanges(currentBed, newBedData);
      }
    );
  };

  const handleReorderMeds = (newOrder: Medication[]) => {
    const newBedData = {
      ...currentBedData,
      medications: newOrder,
    };
    saveBedChanges(currentBed, newBedData);
  };

  // Fluid table handlers
  const handleUpdateFluidCell = (hour: string, fieldId: string, val: string) => {
    const existingFb = currentBedData.fluidBalance || {};
    const hourData = { ...(existingFb[hour] || {}) };
    hourData[fieldId] = val;

    const newBedData = {
      ...currentBedData,
      fluidBalance: {
        ...existingFb,
        [hour]: hourData,
      },
    };
    saveBedChanges(currentBed, newBedData);
  };

  const handleSaveColumn = (name: string) => {
    if (!colModalState.type || !name.trim()) return;
    const type = colModalState.type;
    const cleanName = name.trim();
    const newId =
      (type === 'intake_parenteral'
        ? 'par'
        : type === 'intake_enteral'
        ? 'ent'
        : 'out') +
      '_' +
      Date.now();

    const newBedData = { ...currentBedData };
    if (type === 'intake_parenteral') {
      newBedData.intakeParenteralCols = [
        ...(newBedData.intakeParenteralCols || []),
        { id: newId, name: cleanName },
      ];
    } else if (type === 'intake_enteral') {
      newBedData.intakeEnteralCols = [
        ...(newBedData.intakeEnteralCols || []),
        { id: newId, name: cleanName },
      ];
    } else {
      newBedData.outputCols = [
        ...(newBedData.outputCols || []),
        { id: newId, name: cleanName },
      ];
    }

    saveBedChanges(currentBed, newBedData);
    setColModalState({ isOpen: false, type: null });
  };

  const handleDeleteColumn = (
    type: 'intake_parenteral' | 'intake_enteral' | 'output',
    id: string
  ) => {
    showConfirm(
      'Hapus Kolom Cairan',
      'Hapus parameter cairan ini? Semua data input pada kolom ini untuk ruangan ini akan ikut terhapus.',
      () => {
        const newBedData = { ...currentBedData };
        if (type === 'intake_parenteral') {
          newBedData.intakeParenteralCols = (
            newBedData.intakeParenteralCols || []
          ).filter((c) => c.id !== id);
        } else if (type === 'intake_enteral') {
          newBedData.intakeEnteralCols = (
            newBedData.intakeEnteralCols || []
          ).filter((c) => c.id !== id);
        } else {
          newBedData.outputCols = (newBedData.outputCols || []).filter(
            (c) => c.id !== id
          );
        }
        saveBedChanges(currentBed, newBedData);
      }
    );
  };

  const handleResetFluid = () => {
    showConfirm(
      'Reset Balance Cairan',
      'Yakin ingin MENGHAPUS SEMUA ISI ANGKA pada tabel cairan untuk ruangan dan tanggal ini? Tindakan ini tidak dapat dibatalkan.',
      () => {
        const newBedData = {
          ...currentBedData,
          fluidBalance: {},
        };
        saveBedChanges(currentBed, newBedData);
        showAlert('Berhasil', 'Tabel balance cairan berhasil dikosongkan.');
      }
    );
  };

  // Bed & Patient operations
  const handleSaveNewBed = (newBedName: string) => {
    const clean = newBedName.trim().toUpperCase();
    if (!clean) {
      showAlert('Perhatian', 'Nama bed tidak boleh kosong!');
      return;
    }
    if (beds.includes(clean)) {
      showAlert('Perhatian', 'Nama bed sudah ada dalam daftar!');
      return;
    }

    const currentCustom = getCustomBeds();
    const updatedCustom = [...currentCustom, clean];
    saveCustomBeds(updatedCustom);

    const updatedBeds = [...beds, clean];
    setBeds(updatedBeds);
    setIsBedModalOpen(false);
    setCurrentBed(clean);
    showAlert('Sukses', `Bed "${clean}" berhasil ditambahkan ke dalam daftar.`);
  };

  const handleDeleteExtraBed = (bedName: string) => {
    showConfirm(
      'Hapus Extra Bed',
      `Yakin ingin MENGHAPUS secara permanen extra bed "${bedName}" dari daftar ruangan?`,
      () => {
        const currentCustom = getCustomBeds();
        const updatedCustom = currentCustom.filter((b) => b !== bedName);
        saveCustomBeds(updatedCustom);

        const updatedBeds = beds.filter((b) => b !== bedName);
        setBeds(updatedBeds);

        if (currentBed === bedName) {
          setCurrentBed(updatedBeds[0] || 'BED 1');
        }
        showAlert('Sukses', `Bed "${bedName}" berhasil dihapus dari daftar.`);
      }
    );
  };

  const handleDischargePatient = () => {
    showConfirm(
      'Pasien Keluar',
      `Yakin ingin MEMULANGKAN PASIEN dari ${currentBed}? Tindakan ini akan mengosongkan seluruh identitas pasien, jadwal obat, dan balance cairan HARI INI agar bed siap digunakan untuk pasien baru.`,
      () => {
        const freshBed = createDefaultBedData();
        saveBedChanges(currentBed, freshBed);
        showAlert(
          'Pasien Keluar Selesai',
          `Data pada ${currentBed} telah berhasil dikosongkan dan siap untuk menerima pasien baru.`
        );
      }
    );
  };

  const handleTransferPatient = (targetBed: string) => {
    showConfirm(
      'Konfirmasi Pindah Bed',
      `Perhatian! Anda akan memindahkan pasien dari ${currentBed} ke ${targetBed}. Jika sudah ada data pasien di bed tujuan tersebut, data lamanya akan TERTEMPA. Lanjutkan?`,
      () => {
        const sourceData = JSON.parse(JSON.stringify(currentBedData));
        const emptySource = createDefaultBedData();

        const updatedDayBeds: DayBedsData = {
          ...dayBeds,
          [targetBed]: sourceData,
          [currentBed]: emptySource,
        };

        saveAllBedsData(updatedDayBeds);
        setIsTransferModalOpen(false);
        setCurrentBed(targetBed);
        showAlert(
          'Sukses',
          `Berhasil! Pasien telah dipindahkan ke ${targetBed}. ${currentBed} sebelumnya otomatis telah dikosongkan.`
        );
      }
    );
  };

  // Copy yesterday data with undo
  const handleCopyPrevDay = async () => {
    const prevDateObj = new Date(currentDateStr);
    prevDateObj.setDate(prevDateObj.getDate() - 1);
    const yr = prevDateObj.getFullYear();
    const mo = String(prevDateObj.getMonth() + 1).padStart(2, '0');
    const da = String(prevDateObj.getDate()).padStart(2, '0');
    const prevDateStr = `${yr}-${mo}-${da}`;

    const prevData = await getBedsForDate(prevDateStr);
    if (!prevData || Object.keys(prevData).length === 0) {
      showAlert(
        'Data Tidak Ditemukan',
        `Tidak ditemukan data rekam medis pada tanggal kemarin (${prevDateStr}) di database.`
      );
      return;
    }

    showConfirm(
      'Salin Data Kemarin',
      `Salin seluruh data pasien & obat dari tanggal ${prevDateStr} ke ${currentDateStr}?`,
      () => {
        setUndoBackup(JSON.parse(JSON.stringify(dayBeds)));

        const copied: DayBedsData = JSON.parse(JSON.stringify(prevData));
        // Reset check hours for copied meds
        Object.keys(copied).forEach((b) => {
          if (copied[b]?.medications) {
            copied[b].medications.forEach((m) => {
              m.checkedHours = [];
            });
          }
        });

        saveAllBedsData(copied);

        // Start 60s undo timer
        setUndoSeconds(60);
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        undoTimerRef.current = setInterval(() => {
          setUndoSeconds((prev) => {
            if (prev === null || prev <= 1) {
              if (undoTimerRef.current) clearInterval(undoTimerRef.current);
              setUndoBackup(null);
              return null;
            }
            return prev - 1;
          });
        }, 1000);

        showAlert(
          'Berhasil Menyalin',
          'Data berhasil disalin! Anda memiliki 60 detik untuk membatalkan jika terjadi kesalahan.'
        );
      }
    );
  };

  const handleUndoCopy = () => {
    if (!undoBackup) return;
    showConfirm(
      'Batalkan Salin',
      'Batalkan salinan dan kembalikan data seperti semula?',
      () => {
        saveAllBedsData(undoBackup);
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);
        setUndoSeconds(null);
        setUndoBackup(null);
        showAlert('Selesai', 'Data telah berhasil dikembalikan ke kondisi semula.');
      }
    );
  };

  // Print Handlers
  const handlePrintOperan = () => {
    // Auto resize textareas for print layout
    document.querySelectorAll('textarea').forEach((el) => {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });
    window.print();
  };

  const handlePrintPumpLabel = (labelData: PumpLabelData) => {
    setPumpLabelData(labelData);
    document.body.classList.add('print-mode-label');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-mode-label');
      }, 500);
    }, 100);
  };

  const handlePrintSyringeLabel = (medIndex: number) => {
    const med = currentBedData.medications[medIndex];
    if (!med) return;
    setSyringeModalState({
      isOpen: true,
      med,
    });
  };

  const handlePrintSyringeWithHour = (timeStr: string) => {
    const med = syringeModalState.med;
    if (!med) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    setSyringeLabels([
      {
        patientName: currentBedData.patient.name.trim() || '.......................',
        patientRM: currentBedData.patient.rm.trim() || '......',
        medName: med.name,
        medDose: med.dose,
        medRoute: med.route,
        dateStr,
        timeStr,
      },
    ]);

    setSyringeModalState({ isOpen: false, med: null });

    document.body.classList.add('print-mode-syringe');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-mode-syringe');
      }, 500);
    }, 100);
  };

  const handlePrintSyringeBatch = (timeList: string[]) => {
    const med = syringeModalState.med;
    if (!med || timeList.length === 0) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const batchList: SyringeLabelItem[] = timeList.map((timeStr) => ({
      patientName: currentBedData.patient.name.trim() || '.......................',
      patientRM: currentBedData.patient.rm.trim() || '......',
      medName: med.name,
      medDose: med.dose,
      medRoute: med.route,
      dateStr,
      timeStr,
    }));

    setSyringeLabels(batchList);
    setSyringeModalState({ isOpen: false, med: null });

    document.body.classList.add('print-mode-syringe');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('print-mode-syringe');
      }, 500);
    }, 100);
  };

  const todayStr = getLocalDateString();
  const isHistoryView = currentDateStr !== todayStr;

  const printFormattedDate = new Date(currentDateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <Header
        currentDateStr={currentDateStr}
        onDateChange={setCurrentDateStr}
        cloudStatus={cloudStatus}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-5">
        <Sidebar
          beds={beds}
          currentBed={currentBed}
          onSelectBed={setCurrentBed}
          dayBeds={dayBeds}
          onOpenBedModal={() => setIsBedModalOpen(true)}
          onDeleteExtraBed={handleDeleteExtraBed}
          onCopyPrevDay={handleCopyPrevDay}
          onUndoCopy={handleUndoCopy}
          undoSeconds={undoSeconds}
        />

        <main className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Header Khusus Print Operan */}
          <div className="hidden print:block text-center border-b-2 border-slate-800 pb-3 mb-2">
            <h1 className="text-2xl font-bold uppercase text-slate-900 tracking-wide">
              Lembar Operan Jadwal Injeksi ICU
            </h1>
            <p className="text-sm mt-1 font-semibold text-slate-700">
              Tanggal: {printFormattedDate} | Ruangan: {currentBed}
            </p>
          </div>

          {/* History Notice Banner */}
          {isHistoryView && (
            <div
              id="historyNotice"
              className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg text-amber-800 text-sm flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-amber-600"></i>
                <span>
                  Anda sedang melihat <strong>Riwayat Rekam Medis Tanggal</strong>:{' '}
                  <b>{currentDateStr}</b>
                </span>
              </div>
            </div>
          )}

          {/* Patient Info Card */}
          <PatientInfoCard
            currentBed={currentBed}
            patient={currentBedData.patient}
            onUpdatePatient={handleUpdatePatient}
            onPrintOperan={handlePrintOperan}
            onOpenTransferModal={() => setIsTransferModalOpen(true)}
            onDischargePatient={handleDischargePatient}
          />

          {/* Main Action Tabs */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div
              id="tabButtons"
              className="flex border-b border-slate-200 bg-slate-50 print-hidden"
            >
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 py-3 px-2 sm:px-4 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'text-teal-700 border-b-2 border-teal-600 bg-white shadow-sm'
                    : 'text-slate-500 hover:text-teal-700 border-b-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-syringe"></i>
                <span className="hidden sm:inline">Jadwal Injeksi</span>
                <span className="sm:hidden">Injeksi</span>
              </button>
              <button
                onClick={() => setActiveTab('balance')}
                className={`flex-1 py-3 px-2 sm:px-4 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'balance'
                    ? 'text-teal-700 border-b-2 border-teal-600 bg-white shadow-sm'
                    : 'text-slate-500 hover:text-teal-700 border-b-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-droplet"></i>
                <span className="hidden sm:inline">Balance Cairan</span>
                <span className="sm:hidden">Cairan</span>
              </button>
              <button
                onClick={() => setActiveTab('pump')}
                className={`flex-1 py-3 px-2 sm:px-4 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'pump'
                    ? 'text-teal-700 border-b-2 border-teal-600 bg-white shadow-sm'
                    : 'text-slate-500 hover:text-teal-700 border-b-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <i className="fa-solid fa-calculator"></i>
                <span className="hidden sm:inline">Kalkulator Pump</span>
                <span className="sm:hidden">Pump</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className={activeTab === 'schedule' ? 'block' : 'hidden print:block'}>
              <InjectionSchedule
                currentBed={currentBed}
                medications={currentBedData.medications || []}
                onToggleHour={handleToggleMedHour}
                onOpenAddModal={() =>
                  setMedModalState({ isOpen: true, editingIndex: null, med: null })
                }
                onEditMed={(idx) =>
                  setMedModalState({
                    isOpen: true,
                    editingIndex: idx,
                    med: currentBedData.medications[idx],
                  })
                }
                onDeleteMed={handleDeleteMedication}
                onPrintSyringeLabel={handlePrintSyringeLabel}
                onReorderMeds={handleReorderMeds}
              />
            </div>

            <div className={activeTab === 'balance' ? 'block print-hidden' : 'hidden'}>
              <FluidBalanceTable
                bedData={currentBedData}
                onUpdateFluidCell={handleUpdateFluidCell}
                onUpdateTemp={(temp) => handleUpdatePatient({ temp })}
                onOpenColModal={(type) => setColModalState({ isOpen: true, type })}
                onConfirmDeleteCol={handleDeleteColumn}
                onResetFluid={handleResetFluid}
              />
            </div>

            <div className={activeTab === 'pump' ? 'block print-hidden' : 'hidden'}>
              <PumpCalculator
                patientWeight={currentBedData.patient.weight}
                patientName={currentBedData.patient.name}
                currentBed={currentBed}
                onPrintPumpLabel={handlePrintPumpLabel}
              />
            </div>
          </section>
        </main>
      </div>

      {/* MODALS */}
      <BedModal
        isOpen={isBedModalOpen}
        onClose={() => setIsBedModalOpen(false)}
        onSave={handleSaveNewBed}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        currentBed={currentBed}
        availableBeds={beds.filter((b) => b !== currentBed)}
        onClose={() => setIsTransferModalOpen(false)}
        onConfirm={handleTransferPatient}
      />

      <MedicationModal
        isOpen={medModalState.isOpen}
        initialMed={medModalState.med}
        onClose={() =>
          setMedModalState({ isOpen: false, editingIndex: null, med: null })
        }
        onSave={handleSaveMedication}
        doctorsList={doctorsList}
      />

      <ColumnModal
        isOpen={colModalState.isOpen}
        colType={colModalState.type}
        onClose={() => setColModalState({ isOpen: false, type: null })}
        onSave={handleSaveColumn}
      />

      <DialogModal
        config={dialogConfig}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <SyringePrintModal
        isOpen={syringeModalState.isOpen}
        med={syringeModalState.med}
        patientName={currentBedData.patient.name}
        patientRM={currentBedData.patient.rm}
        currentBed={currentBed}
        onClose={() => setSyringeModalState({ isOpen: false, med: null })}
        onPrintHour={handlePrintSyringeWithHour}
        onPrintBatch={handlePrintSyringeBatch}
      />

      {/* Hidden print templates for Labels */}
      <PrintTemplates
        pumpLabelData={pumpLabelData}
        syringeLabels={syringeLabels}
      />
    </div>
  );
}
