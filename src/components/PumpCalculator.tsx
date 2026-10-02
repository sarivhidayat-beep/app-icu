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
  const [timeUnit, setTimeUnit] = useState<number>(60); // / Menit default
  const [timeUnitName, setTimeUnitName] = useState('/ Menit');

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

  let calculatedRate = '0.0';
  let concentrationText = '0 mcg/cc';
  let requirementText = '0 mcg/jam';

  if (numDrugAmount > 0 && numVolume > 0 && numDose > 0) {
    const totalDrugBase = numDrugAmount * drugUnit;
    const concentration = totalDrugBase / numVolume;
    const doseInBase = numDose * doseUnit;
    const hourlyRequirement = doseInBase * timeUnit * (useWeight ? numWeight : 1);
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
      const dReq = dInBase * timeUnit * (useWeight ? numWeight : 1);
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
      timeName: timeUnitName,
      rate: calculatedRate,
      useWeight,
      weightDisplay: useWeight ? `${numWeight} kg` : 'Tanpa BB',
      titrationRows,
    });
  };

  return (
    <div className="p-5 bg-slate-50 border-t border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-slate-200 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-calculator text-2xl text-teal-600"></i>
          <div>
            <h4 className="font-bold text-slate-800 text-lg leading-tight">
              Kalkulator Syringe / Infusion Pump
            </h4>
            <p className="text-xs text-slate-500">
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
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <label className="font-bold text-sm text-slate-700 block">
                Gunakan Berat Badan (kg)
              </label>
              <span className="text-xs text-slate-500">
                Kalkulasi basis /kgBB
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                disabled={!useWeight}
                className="w-16 border border-slate-300 bg-slate-50 rounded-lg px-2 py-1.5 text-sm text-center font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-50"
                placeholder="0"
              />
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWeight}
                  onChange={(e) => setUseWeight(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 shadow-inner"></div>
              </label>
            </div>
          </div>

          {/* Setup Sediaan Obat */}
          <div className="bg-white p-4 rounded-r-xl rounded-l-md border-y border-r border-slate-200 border-l-4 border-l-teal-500 shadow-sm relative">
            <h5 className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mb-3">
              1. Sediaan Obat (Dalam Spuit / Flabot)
            </h5>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Nama Obat (Opsional)
              </label>
              <input
                type="text"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition"
                placeholder="Ketik nama obat (mis: Insulin, Dobutamin...)"
              />
            </div>

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Jml Obat
                </label>
                <input
                  type="number"
                  value={drugAmount}
                  onChange={(e) => setDrugAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition"
                  placeholder="Contoh: 50"
                />
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Satuan
                </label>
                <select
                  value={drugUnit}
                  onChange={(e) => {
                    const mult = parseFloat(e.target.value);
                    setDrugUnit(mult);
                    const idx = e.target.selectedIndex;
                    setDrugUnitName(e.target.options[idx].text);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white transition cursor-pointer"
                >
                  <option value={1000000}>Gram</option>
                  <option value={1000}>mg</option>
                  <option value={1}>mcg</option>
                  <option value={1}>Unit</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Volume Pelarut (cc / ml)
              </label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition"
                placeholder="Contoh: 50"
              />
            </div>
          </div>

          {/* Setup Dosis Diminta */}
          <div className="bg-white p-4 rounded-r-xl rounded-l-md border-y border-r border-slate-200 border-l-4 border-l-amber-500 shadow-sm relative">
            <h5 className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-3">
              2. Permintaan Dokter (Dosis Instruksi)
            </h5>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <div className="flex-1 min-w-[80px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Dosis
                </label>
                <input
                  type="number"
                  step="any"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  placeholder="Contoh: 0.1"
                />
              </div>
              <div className="w-full sm:w-1/3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Satuan
                </label>
                <select
                  value={doseUnit}
                  onChange={(e) => {
                    const mult = parseFloat(e.target.value);
                    setDoseUnit(mult);
                    const idx = e.target.selectedIndex;
                    setDoseUnitName(e.target.options[idx].text);
                  }}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white transition cursor-pointer"
                >
                  <option value={1000000}>Gram</option>
                  <option value={1000}>mg</option>
                  <option value={1}>mcg</option>
                  <option value={0.001}>ng</option>
                  <option value={1}>Unit</option>
                </select>
              </div>
              <div className="w-full sm:w-1/3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Waktu
                </label>
                <select
                  value={timeUnit}
                  onChange={(e) => {
                    const mult = parseFloat(e.target.value);
                    setTimeUnit(mult);
                    setTimeUnitName(mult === 60 ? '/ Menit' : '/ Jam');
                  }}
                  className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white transition cursor-pointer"
                >
                  <option value={60}>/ Menit</option>
                  <option value={1}>/ Jam</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 p-2 bg-amber-50/50 rounded-lg border border-amber-100">
              <div className="w-full">
                <label className="block text-[10px] font-bold text-amber-600 uppercase">
                  Tabel Panduan Titrasi (Otomatis)
                </label>
              </div>
              <div className="flex-1 min-w-[30%]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Dosis Bawah
                </label>
                <input
                  type="number"
                  value={doseLower}
                  onChange={(e) => setDoseLower(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  placeholder="Mis: 3"
                />
              </div>
              <div className="flex-1 min-w-[30%]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Dosis Atas
                </label>
                <input
                  type="number"
                  value={doseUpper}
                  onChange={(e) => setDoseUpper(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  placeholder="Mis: 10"
                />
              </div>
              <div className="flex-1 min-w-[30%]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Interval Naik
                </label>
                <input
                  type="number"
                  value={doseStep}
                  onChange={(e) => setDoseStep(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition"
                  placeholder="Mis: 1"
                />
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
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-teal-50 border-b border-slate-200 p-3">
            <h5 className="font-bold text-teal-700 text-sm flex items-center">
              <i className="fa-solid fa-table-list mr-2"></i>
              Tabel Panduan Titrasi Dosis Kecepatan
            </h5>
          </div>
          <div className="overflow-x-auto custom-scrollbar max-h-64">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 sticky top-0 shadow-sm text-slate-600">
                <tr>
                  <th className="py-2 px-4 border-r border-slate-200 w-1/2">
                    Dosis ({doseUnitName} {timeUnitName})
                  </th>
                  <th className="py-2 px-4">Kecepatan (Rate cc/jam)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {titrationRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-4 font-semibold text-slate-700 border-r border-slate-100 bg-slate-50/50">
                      {row.dose}
                    </td>
                    <td className="py-2 px-4 font-bold text-teal-600 font-mono text-sm">
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
