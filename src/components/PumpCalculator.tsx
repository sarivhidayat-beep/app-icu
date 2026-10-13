import React, { useState, useEffect } from 'react';

interface PumpCalculatorProps {
  patientWeight: string;
  patientName: string;
  currentBed: string;
  onPrintPumpLabel: (labelData: PumpLabelData) => void;
}

export interface PumpLabelData {
  patientName: string;
  bed: string;
  drugName: string;
  drugAmount: number;
  drugUnitName: string;
  volume: number;
  dose: number;
  doseUnitName: string;
  timeName: string;
  rate: string;
  useWeight: boolean;
  weightDisplay: string;
  titrationRows: { dose: number; rate: string }[];
}

export const PumpCalculator: React.FC<PumpCalculatorProps> = ({
  patientWeight,
  patientName,
  currentBed,
  onPrintPumpLabel,
}) => {
  const [useWeight, setUseWeight] = useState(true);
  const [weight, setWeight] = useState<string>(patientWeight || '0');
  const [drugName, setDrugName] = useState('');
  const [drugAmount, setDrugAmount] = useState<string>('');
  const [drugUnit, setDrugUnit] = useState<number>(1000); // mg default
  const [drugUnitName, setDrugUnitName] = useState('mg');
  const [volume, setVolume] = useState<string>('');

  const [dose, setDose] = useState<string>('');
  const [doseUnit, setDoseUnit] = useState<number>(1); // mcg default
  const [doseUnitName, setDoseUnitName] = useState('mcg');

  // Pengaturan Basis Waktu: / Menit, / Jam, atau Manual Input Waktu
  const [timeMode, setTimeMode] = useState<'minute' | 'hour' | 'manual'>('minute');
  const [manualTimeValue, setManualTimeValue] = useState<string>('4');
  const [manualTimeUnit, setManualTimeUnit] = useState<'Jam' | 'Menit'>('Jam');

  // Titration
  const [doseLower, setDoseLower] = useState<string>('');
  const [doseUpper, setDoseUpper] = useState<string>('');
  const [doseStep, setDoseStep] = useState<string>('');

  // Sync weight if patientWeight changes
  useEffect(() => {
    if (patientWeight !== undefined) {
      setWeight(patientWeight);
    }
  }, [patientWeight]);

  const numWeight = useWeight ? parseFloat(weight) || 0 : 1;
  const numDrugAmount = parseFloat(drugAmount) || 0;
  const numVolume = parseFloat(volume) || 0;
  const numDose = parseFloat(dose) || 0;

  let effectiveTimeMultiplier = 60;
  let effectiveTimeName = '/ Menit';

  if (timeMode === 'hour') {
    effectiveTimeMultiplier = 1;
    effectiveTimeName = '/ Jam';
  } else if (timeMode === 'manual') {
    const numManual = parseFloat(manualTimeValue);
    const validManual = !isNaN(numManual) && numManual > 0 ? numManual : 1;
    if (manualTimeUnit === 'Jam') {
      effectiveTimeMultiplier = 1 / validManual;
      effectiveTimeName = `/ ${manualTimeValue || '1'} Jam`;
    } else {
      effectiveTimeMultiplier = 60 / validManual;
      effectiveTimeName = `/ ${manualTimeValue || '60'} Menit`;
    }
  }

  let calculatedRate = '0.0';
  let concentrationText = '0 mcg/cc';
  let requirementText = '0 mcg/jam';

  if (numDrugAmount > 0 && numVolume > 0 && numDose > 0) {
    const totalDrugBase = numDrugAmount * drugUnit;
    const concentration = totalDrugBase / numVolume;
    const doseInBase = numDose * doseUnit;
    const hourlyRequirement = doseInBase * effectiveTimeMultiplier * (useWeight ? numWeight : 1);
    const rate = hourlyRequirement / concentration;

    calculatedRate = rate > 0 ? (Math.round(rate * 10) / 10).toFixed(1) : '0.0';

    // Concentration formatting
    let concDisplay = concentration;
    let concUnit = drugUnitName === 'Unit' ? 'Unit/cc' : 'mcg/cc';
    if (drugUnitName !== 'Unit' && concentration >= 1000) {
      concDisplay = concentration / 1000;
      concUnit = 'mg/cc';
    }
    concentrationText = `${Math.round(concDisplay * 100) / 100} ${concUnit}`;

    // Hourly req formatting
    let reqDisplay = hourlyRequirement;
    let reqUnit = doseUnitName === 'Unit' ? 'Unit/jam' : 'mcg/jam';
    if (doseUnitName !== 'Unit' && hourlyRequirement >= 1000) {
      reqDisplay = hourlyRequirement / 1000;
      reqUnit = 'mg/jam';
    }
    requirementText = `${Math.round(reqDisplay * 100) / 100} ${reqUnit}`;
  }

  // Calculate titration rows
  const numLower = parseFloat(doseLower);
  const numUpper = parseFloat(doseUpper);
  const numStep = parseFloat(doseStep);

  const titrationRows: { dose: number; rate: string }[] = [];
  if (
    !isNaN(numLower) &&
    !isNaN(numUpper) &&
    !isNaN(numStep) &&
    numLower < numUpper &&
    numStep > 0 &&
    numDrugAmount > 0 &&
    numVolume > 0
  ) {
    const totalDrugBase = numDrugAmount * drugUnit;
    const conc = totalDrugBase / numVolume;
    for (let d = numLower; d <= numUpper + 0.0001; d += numStep) {
      const roundedDose = Math.round(d * 10000) / 10000;
      const dInBase = roundedDose * doseUnit;
      const dReq = dInBase * effectiveTimeMultiplier * (useWeight ? numWeight : 1);
      const dRate = dReq / conc;
      const dRateStr = dRate > 0 ? (Math.round(dRate * 10) / 10).toFixed(1) : '0.0';
      titrationRows.push({ dose: roundedDose, rate: dRateStr });
    }
  }

  const handlePrint = () => {
    onPrintPumpLabel({
      patientName: patientName || '.......................',
      bed: currentBed,
      drugName: drugName || 'OBAT PUMP',
      drugAmount: numDrugAmount,
      drugUnitName,
      volume: numVolume,
      dose: numDose,
      doseUnitName,
      timeName: effectiveTimeName,
      rate: calculatedRate,
      useWeight,
      weightDisplay: useWeight ? `${numWeight} kg` : 'Tanpa BB',
      titrationRows,
    });
  };

  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-calculator text-2xl text-teal-600 dark:text-teal-400"></i>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">
              Kalkulator Syringe / Infusion Pump
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konversi otomatis dosis obat kritis ke hitungan cc/jam.
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-md flex items-center justify-center gap-2 print-hidden cursor-pointer"
        >
          <i className="fa-solid fa-print"></i>
          <span>Cetak Label Pump</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel Parameter (Kiri) */}
        <div className="space-y-4">
          {/* Toggle Berat Badan */}
          <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div>
              <label className="font-bold text-sm text-slate-700 dark:text-slate-200 block">
                Gunakan Berat Badan (kg)
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Kalkulasi basis /kgBB
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={!useWeight}
                className="w-16 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1.5 text-sm text-center font-bold text-slate-700 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-50"
                placeholder="0"
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWeight}
                  onChange={(e) => setUseWeight(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 shadow-inner"></div>
              </label>
            </div>
          </div>

          {/* Setup Sediaan Obat */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-r-xl rounded-l-md border-y border-r border-slate-200 dark:border-slate-700 border-l-4 border-l-teal-500 shadow-sm relative">
            <h5 className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-3">
              1. Sediaan Obat (Dalam Spuit / Flabot)
            </h5>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Nama Obat (Opsional)
              </label>
              <input
                type="text"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Ketik nama obat (mis: Insulin, Dobutamin...)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Jml Obat
                </label>
                <input
                  type="number"
                  value={drugAmount}
                  onChange={(e) => setDrugAmount(e.target.value)}
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Contoh: 50"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Satuan Sediaan
                </label>
                <div className="relative w-full">
                  <select
                    aria-label="Satuan Sediaan"
                    value={drugUnitName}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setDrugUnitName(selected);
                      if (selected === 'mg') setDrugUnit(1000);
                      else if (selected === 'mcg') setDrugUnit(1);
                      else if (selected === 'Gram') setDrugUnit(1000000);
                      else if (selected === 'Unit') setDrugUnit(1);
                    }}
                    className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer font-medium appearance-none"
                  >
                    <option value="mg">mg (Miligram)</option>
                    <option value="mcg">mcg (Mikrogram)</option>
                    <option value="Gram">Gram (g)</option>
                    <option value="Unit">Unit (IU / Internasional)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Volume Pelarut (cc / ml)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Contoh: 50"
              />
            </div>
          </div>

          {/* Setup Dosis Diminta */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-r-xl rounded-l-md border-y border-r border-slate-200 dark:border-slate-700 border-l-4 border-l-amber-500 shadow-sm relative">
            <h5 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
              2. Permintaan Dokter (Dosis Instruksi)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dosis */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Dosis
                </label>
                <input
                  type="number"
                  step="any"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Contoh: 0.1"
                />
              </div>

              {/* Satuan Dosis */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Satuan Dosis
                </label>
                <div className="relative w-full">
                  <select
                    aria-label="Satuan Dosis"
                    value={doseUnitName}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setDoseUnitName(selected);
                      if (selected === 'mcg') setDoseUnit(1);
                      else if (selected === 'mg') setDoseUnit(1000);
                      else if (selected === 'Gram') setDoseUnit(1000000);
                      else if (selected === 'ng') setDoseUnit(0.001);
                      else if (selected === 'Unit') setDoseUnit(1);
                    }}
                    className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition cursor-pointer font-medium appearance-none"
                  >
                    <option value="mcg">mcg (Mikrogram)</option>
                    <option value="mg">mg (Miligram)</option>
                    <option value="Gram">Gram (g)</option>
                    <option value="ng">ng (Nanogram)</option>
                    <option value="Unit">Unit (IU)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>
              </div>

              {/* Kolom Waktu - Model Dropdown dengan Dukungan Penuh Mode Potrait */}
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Waktu
                </label>
                <div className="relative w-full">
                  <select
                    aria-label="Basis Waktu"
                    value={timeMode}
                    onChange={(e) => {
                      setTimeMode(e.target.value as 'minute' | 'hour' | 'manual');
                    }}
                    className="w-full h-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition cursor-pointer font-medium appearance-none"
                  >
                    <option value="minute">/ Menit (Per Menit)</option>
                    <option value="hour">/ Jam (Per Jam)</option>
                    <option value="manual">Manual (Input Durasi Waktu)</option>
                  </select>
                  <i className="fa-solid fa-chevron-down text-xs text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                </div>

                {/* Quick Toggle Pills: Memastikan opsi waktu dapat langsung diganti cepat di mode apapun */}
                <div className="grid grid-cols-3 gap-1 mt-1.5 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTimeMode('minute')}
                    className={`py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
                      timeMode === 'minute'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>/ Mnt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('hour')}
                    className={`py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
                      timeMode === 'hour'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>/ Jam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('manual')}
                    className={`py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition flex items-center justify-center gap-1 cursor-pointer ${
                      timeMode === 'manual'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>Manual</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Manual Input Pemberian Waktunya */}
            {timeMode === 'manual' && (
              <div className="mt-3 p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/80 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <label className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-clock-rotate-left text-amber-600 dark:text-amber-400"></i>
                    <span>Manual Input Waktu / Durasi Pemberian:</span>
                  </label>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded self-start sm:self-auto">
                    Kalkulasi: {effectiveTimeName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="min-w-0">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Jumlah Angka Waktu
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={manualTimeValue}
                      onChange={(e) => setManualTimeValue(e.target.value)}
                      className="w-full h-9 border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Contoh: 4 (habis dlm 4 jam)"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Satuan Waktu Pemberian
                    </label>
                    <div className="relative w-full">
                      <select
                        aria-label="Satuan Waktu Manual"
                        value={manualTimeUnit}
                        onChange={(e) => setManualTimeUnit(e.target.value as 'Jam' | 'Menit')}
                        className="w-full h-9 border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer font-medium appearance-none"
                      >
                        <option value="Jam">Jam (misal habis dalam ... Jam)</option>
                        <option value="Menit">Menit (misal habis dalam ... Menit)</option>
                      </select>
                      <i className="fa-solid fa-chevron-down text-xs text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                    </div>
                  </div>
                </div>

                {/* Tombol Pilihan Durasi Cepat */}
                <div className="mt-2.5 pt-2 border-t border-amber-200/80 dark:border-amber-800/60">
                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1.5">
                    Pilihan Cepat Durasi:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { val: '2', unit: 'Jam', label: '2 Jam' },
                      { val: '4', unit: 'Jam', label: '4 Jam' },
                      { val: '6', unit: 'Jam', label: '6 Jam' },
                      { val: '8', unit: 'Jam', label: '8 Jam' },
                      { val: '12', unit: 'Jam', label: '12 Jam' },
                      { val: '24', unit: 'Jam', label: '24 Jam' },
                      { val: '30', unit: 'Menit', label: '30 Mnt' },
                      { val: '60', unit: 'Menit', label: '60 Mnt' },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setManualTimeValue(p.val);
                          setManualTimeUnit(p.unit as 'Jam' | 'Menit');
                        }}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border transition cursor-pointer ${
                          manualTimeValue === p.val && manualTimeUnit === p.unit
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 p-2 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900/60">
              <label className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
                Tabel Panduan Titrasi (Otomatis)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Dosis Bawah
                  </label>
                  <input
                    type="number"
                    value={doseLower}
                    onChange={(e) => setDoseLower(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                    placeholder="Mis: 3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Dosis Atas
                  </label>
                  <input
                    type="number"
                    value={doseUpper}
                    onChange={(e) => setDoseUpper(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                    placeholder="Mis: 10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Interval Naik
                  </label>
                  <input
                    type="number"
                    value={doseStep}
                    onChange={(e) => setDoseStep(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                    placeholder="Mis: 1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Hasil (Kanan - Mode Monitor Gelap) */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] border-[4px] border-slate-800 flex flex-col justify-center relative overflow-hidden min-h-[250px]">
          {/* CRT scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none z-10 opacity-20"></div>

          <h5 className="text-slate-400 font-mono text-sm mb-2 relative z-20 flex items-center">
            <i className="fa-solid fa-gauge-high mr-2 text-teal-400"></i>
            {drugName ? (
              <span>
                RATE PUMP:{' '}
                <span className="text-white font-bold">{drugName.toUpperCase()}</span>
              </span>
            ) : (
              <span>RATE / KECEPATAN PUMP</span>
            )}
          </h5>

          <div className="flex items-baseline gap-3 relative z-20 mb-2">
            <span className="text-7xl md:text-8xl font-black text-green-400 font-mono tracking-tighter drop-shadow-[0_0_12px_rgba(74,222,128,0.4)]">
              {calculatedRate}
            </span>
            <span className="text-2xl text-green-600 font-mono font-bold">
              cc/jam
            </span>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-700/60 relative z-20 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Konsentrasi Obat:</span>
              <span className="text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {concentrationText}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Kebutuhan Dosis:</span>
              <span className="text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {requirementText}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Status Berat Badan:</span>
              <span
                className={
                  useWeight
                    ? 'text-green-400 font-bold'
                    : 'text-amber-400 font-bold'
                }
              >
                {useWeight ? `${numWeight} kg` : 'Tanpa BB'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Area Tabel Titrasi */}
      {titrationRows.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-800/90 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-teal-50 dark:bg-teal-950/60 border-b border-slate-200 dark:border-slate-700 p-3">
            <h5 className="font-bold text-teal-700 dark:text-teal-300 text-sm flex items-center">
              <i className="fa-solid fa-table-list mr-2"></i>
              Tabel Panduan Titrasi Dosis Kecepatan
            </h5>
          </div>
          <div className="overflow-x-auto custom-scrollbar max-h-64">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 shadow-sm text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-4 border-r border-slate-200 dark:border-slate-700 w-1/2">
                    Dosis ({doseUnitName} {effectiveTimeName})
                  </th>
                  <th className="py-2 px-4">Kecepatan (Rate cc/jam)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {titrationRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition">
                    <td className="py-2 px-4 font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      {row.dose}
                    </td>
                    <td className="py-2 px-4 font-bold text-teal-600 dark:text-teal-400 font-mono text-sm">
                      {row.rate} cc/jam
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
