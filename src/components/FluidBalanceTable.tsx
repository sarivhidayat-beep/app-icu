import React from 'react';
import { BedData } from '../types';
import { HOURS_SHIFT, THREE_HOUR_MARKS } from '../constants';

interface FluidBalanceTableProps {
  bedData: BedData;
  onUpdateFluidCell: (hour: string, fieldId: string, val: string) => void;
  onUpdateTemp: (temp: number | string) => void;
  onOpenColModal: (type: 'intake_parenteral' | 'intake_enteral' | 'output') => void;
  onConfirmDeleteCol: (type: 'intake_parenteral' | 'intake_enteral' | 'output', id: string) => void;
  onResetFluid: () => void;
}

export const FluidBalanceTable: React.FC<FluidBalanceTableProps> = ({
  bedData,
  onUpdateFluidCell,
  onUpdateTemp,
  onOpenColModal,
  onConfirmDeleteCol,
  onResetFluid,
}) => {
  const patientWeight = parseFloat(bedData.patient.weight) || 0;
  const patientTemp = parseFloat(String(bedData.patient.temp)) || 36.5;

  // IWL formula
  const calculateIWLHourly = () => {
    if (patientWeight <= 0) return 0;
    let baseIWL = (10 * patientWeight) / 24;
    if (patientTemp > 37.5) {
      const feverDiff = patientTemp - 37.5;
      baseIWL += baseIWL * (0.10 * feverDiff);
    }
    return parseFloat(baseIWL.toFixed(3));
  };

  const defaultIWL = calculateIWLHourly();

  const parenteralCols = bedData.intakeParenteralCols || [];
  const enteralCols = bedData.intakeEnteralCols || [];
  const outputCols = bedData.outputCols || [];
  const fb = bedData.fluidBalance || {};

  const sf = (num: number) => parseFloat(Number(num).toFixed(3));

  // Compute 24-hr and period stats
  let total24Intake = 0;
  let total24Output = 0;
  let total24IWL = 0;
  let runningCumBalance = 0;

  // Temporary accumulators for period
  let periodParAcc = 0;
  let periodEntAcc = 0;
  let periodOutAcc = 0;
  let periodNetAcc = 0;

  // Pre-calculate rows
  const rowCalculations = HOURS_SHIFT.map((h, rowIdx) => {
    const row = fb[h] || {};

    let hrParenteral = 0;
    parenteralCols.forEach((col) => {
      const val = parseFloat(row[col.id]) || 0;
      hrParenteral += val;
    });

    let hrEnteral = 0;
    enteralCols.forEach((col) => {
      const val = parseFloat(row[col.id]) || 0;
      hrEnteral += val;
    });

    const hrIntake = hrParenteral + hrEnteral;
    total24Intake += hrIntake;

    let hrOutputOnly = 0;
    outputCols.forEach((col) => {
      const val = parseFloat(row[col.id]) || 0;
      hrOutputOnly += val;
    });

    const iwlVal =
      row.iwl !== undefined && row.iwl !== ''
        ? parseFloat(row.iwl) || 0
        : defaultIWL;

    total24IWL += iwlVal;
    const hrTotalOutput = hrOutputOnly + iwlVal;
    total24Output += hrTotalOutput;

    const hrBalance = sf(hrIntake - hrTotalOutput);

    periodParAcc += hrParenteral;
    periodEntAcc += hrEnteral;
    periodOutAcc += hrOutputOnly;
    periodNetAcc = sf(periodNetAcc + hrBalance);
    runningCumBalance = sf(runningCumBalance + hrBalance);

    const is3Hr = THREE_HOUR_MARKS.includes(h);

    const snapshot = {
      hour: h,
      rowIdx,
      row,
      is3Hr,
      displayJmlPar: is3Hr ? (periodParAcc > 0 ? sf(periodParAcc) : '-') : '',
      displayJmlEnt: is3Hr ? (periodEntAcc > 0 ? sf(periodEntAcc) : '-') : '',
      displayJmlOut: is3Hr ? (periodOutAcc > 0 ? sf(periodOutAcc) : '-') : '',
      displayPeriodBalance: is3Hr
        ? periodNetAcc > 0
          ? `+${periodNetAcc}`
          : String(periodNetAcc)
        : '',
      periodBalanceNum: periodNetAcc,
      displayCumBalance: is3Hr
        ? runningCumBalance > 0
          ? `+${runningCumBalance}`
          : String(runningCumBalance)
        : '',
      cumBalanceNum: runningCumBalance,
    };

    if (is3Hr) {
      periodParAcc = 0;
      periodEntAcc = 0;
      periodOutAcc = 0;
      periodNetAcc = 0;
    }

    return snapshot;
  });

  // Keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colIdx: number) => {
    let nextRow = rowIdx;
    let nextCol = colIdx;

    if (e.key === 'ArrowUp') nextRow--;
    else if (e.key === 'ArrowDown') nextRow++;
    else if (e.key === 'ArrowLeft') nextCol--;
    else if (e.key === 'ArrowRight') nextCol++;
    else return;

    e.preventDefault();
    const target = document.querySelector<HTMLInputElement>(
      `input[data-rowidx="${nextRow}"][data-colidx="${nextCol}"]`
    );
    if (target) {
      target.focus();
      target.select();
    }
  };

  return (
    <div className="p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="font-bold text-slate-700">Tabel Balance Cairan (24 Jam)</h4>
          <div className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm print-hidden">
            <i className="fa-solid fa-droplet text-purple-500"></i>
            <div className="text-xs font-semibold">
              <span className="block text-[10px] text-purple-600 leading-none">
                Est. IWL Saat Ini
              </span>
              <span className="font-mono">{defaultIWL} cc/jam</span>
            </div>
          </div>
          <div className="flex items-center print-hidden">
            <label className="bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs text-slate-600 rounded-l-lg font-semibold">
              Suhu
            </label>
            <input
              type="number"
              step="0.1"
              value={patientTemp}
              onChange={(e) => onUpdateTemp(e.target.value)}
              className="w-16 border-y border-r border-slate-300 rounded-r-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="36.5"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print-hidden">
          <button
            onClick={() => onOpenColModal('intake_parenteral')}
            className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i> Parenteral
          </button>
          <button
            onClick={() => onOpenColModal('intake_enteral')}
            className="bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i> Enteral
          </button>
          <button
            onClick={() => onOpenColModal('output')}
            className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i> Output
          </button>
          <button
            onClick={onResetFluid}
            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm ml-1 flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-trash-can"></i> Reset
          </button>
        </div>
      </div>

      {/* HASIL BALANCE ATAS TABEL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 print-hidden">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase">
              Total Intake (24j)
            </p>
            <p className="text-xl font-bold text-blue-800 font-mono mt-1">
              <span>{Math.round(total24Intake)}</span> <span className="text-xs">cc</span>
            </p>
          </div>
          <i className="fa-solid fa-arrow-right-to-bracket text-blue-300 text-3xl"></i>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-amber-500 uppercase">
              Total Output (24j)
            </p>
            <p className="text-xl font-bold text-amber-800 font-mono mt-1">
              <span>{Math.round(total24Output)}</span> <span className="text-xs">cc</span>
            </p>
          </div>
          <i className="fa-solid fa-arrow-right-from-bracket text-amber-300 text-3xl"></i>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-purple-500 uppercase">
              Total IWL (24j)
            </p>
            <p className="text-xl font-bold text-purple-800 font-mono mt-1">
              <span>{Math.round(total24IWL)}</span> <span className="text-xs">cc</span>
            </p>
          </div>
          <i className="fa-solid fa-droplet-slash text-purple-300 text-3xl"></i>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-teal-600 uppercase">
              Balance Akumulatif
            </p>
            <p className="text-xl font-bold text-teal-800 font-mono mt-1">
              <span>
                {runningCumBalance > 0 ? `+${runningCumBalance}` : runningCumBalance}
              </span>{' '}
              <span className="text-xs">cc</span>
            </p>
          </div>
          <i className="fa-solid fa-scale-balanced text-teal-300 text-3xl"></i>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl shadow-sm mb-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr>
              <th
                className="py-2.5 px-3 border border-slate-300 text-center w-16 bg-slate-100 font-semibold"
                rowSpan={2}
              >
                Jam
              </th>
              <th
                className="py-1.5 px-2 border border-blue-300 text-center bg-blue-100 text-blue-900 font-bold"
                colSpan={parenteralCols.length + 1}
              >
                INTAKE PARENTERAL - cc
              </th>
              <th
                className="py-1.5 px-2 border border-cyan-300 text-center bg-cyan-100 text-cyan-900 font-bold"
                colSpan={enteralCols.length + 1}
              >
                INTAKE ENTERAL - cc
              </th>
              <th
                className="py-1.5 px-2 border border-amber-300 text-center bg-amber-100 text-amber-900 font-bold"
                colSpan={outputCols.length + 2}
              >
                OUTPUT (KELUAR) - cc
              </th>
              <th
                className="py-2.5 px-3 border border-slate-300 text-center bg-teal-100/70 w-[88px] font-bold"
                rowSpan={2}
              >
                Balance (Per 3 Jam)
              </th>
              <th
                className="py-2.5 px-3 border border-slate-300 text-center bg-emerald-100/70 w-[96px] font-bold"
                rowSpan={2}
              >
                Balance Akumulatif
              </th>
            </tr>
            <tr className="text-[10px]">
              {parenteralCols.map((col) => {
                const isDefault = ['infus', 'injeksi', 'par_lain'].includes(col.id);
                return (
                  <th
                    key={col.id}
                    className="py-2 px-2 border border-blue-200 text-center bg-blue-50/80 relative group text-blue-800 font-semibold"
                  >
                    <span>{col.name}</span>
                    {!isDefault && (
                      <button
                        onClick={() => onConfirmDeleteCol('intake_parenteral', col.id)}
                        className="absolute top-0 right-0 m-0.5 text-red-500 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 rounded-full w-4 h-4 flex items-center justify-center transition shadow-sm cursor-pointer"
                        title="Hapus"
                      >
                        <i className="fa-solid fa-times text-[9px]"></i>
                      </button>
                    )}
                  </th>
                );
              })}
              <th className="py-2 px-2 border border-blue-300 text-center bg-blue-200/50 text-blue-900 font-bold w-[72px] shadow-inner">
                Jml Par
              </th>

              {enteralCols.map((col) => {
                const isDefault = ['sonde', 'ent_lain'].includes(col.id);
                return (
                  <th
                    key={col.id}
                    className="py-2 px-2 border border-cyan-200 text-center bg-cyan-50/80 relative group text-cyan-800 font-semibold"
                  >
                    <span>{col.name}</span>
                    {!isDefault && (
                      <button
                        onClick={() => onConfirmDeleteCol('intake_enteral', col.id)}
                        className="absolute top-0 right-0 m-0.5 text-red-500 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 rounded-full w-4 h-4 flex items-center justify-center transition shadow-sm cursor-pointer"
                        title="Hapus"
                      >
                        <i className="fa-solid fa-times text-[9px]"></i>
                      </button>
                    )}
                  </th>
                );
              })}
              <th className="py-2 px-2 border border-cyan-300 text-center bg-cyan-200/50 text-cyan-900 font-bold w-[72px] shadow-inner">
                Jml Ent
              </th>

              {outputCols.map((col) => {
                const isDefault = ['urine', 'drain', 'bab'].includes(col.id);
                return (
                  <th
                    key={col.id}
                    className="py-2 px-2 border border-amber-200 text-center bg-amber-50/80 relative group text-amber-800 font-semibold"
                  >
                    <span>{col.name}</span>
                    {!isDefault && (
                      <button
                        onClick={() => onConfirmDeleteCol('output', col.id)}
                        className="absolute top-0 right-0 m-0.5 text-red-500 opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 rounded-full w-4 h-4 flex items-center justify-center transition shadow-sm cursor-pointer"
                        title="Hapus"
                      >
                        <i className="fa-solid fa-times text-[9px]"></i>
                      </button>
                    )}
                  </th>
                );
              })}
              <th className="py-2 px-2 border border-amber-300 text-center bg-amber-200/50 text-amber-900 font-bold w-[72px] shadow-inner">
                Jml Output
              </th>
              <th className="py-2 px-2 border border-amber-200 text-center bg-purple-50/80 text-purple-800 w-[72px] font-bold">
                IWL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rowCalculations.map((item) => {
              const {
                hour,
                rowIdx,
                row,
                is3Hr,
                displayJmlPar,
                displayJmlEnt,
                displayJmlOut,
                displayPeriodBalance,
                periodBalanceNum,
                displayCumBalance,
                cumBalanceNum,
              } = item;

              let colTracker = 0;

              return (
                <tr key={hour} className="hover:bg-slate-50 transition group">
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200">
                    {hour}
                  </td>

                  {/* Parenteral Cells */}
                  {parenteralCols.map((col) => {
                    const cIdx = colTracker++;
                    return (
                      <td
                        key={col.id}
                        className="py-1 px-1 border border-blue-100 bg-blue-50/40 text-center"
                      >
                        <input
                          type="number"
                          data-rowidx={rowIdx}
                          data-colidx={cIdx}
                          value={row[col.id] !== undefined ? row[col.id] : ''}
                          onChange={(e) =>
                            onUpdateFluidCell(hour, col.id, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, cIdx)}
                          className="w-[72px] mx-auto block bg-white border border-blue-200 rounded px-1.5 py-1 text-[11px] text-center focus:ring-1 focus:ring-blue-500 font-mono transition"
                          placeholder="-"
                        />
                      </td>
                    );
                  })}

                  {/* Jml Parenteral */}
                  <td
                    className={`py-1.5 px-1.5 text-center font-mono font-bold text-blue-800 text-[11px] border ${
                      is3Hr
                        ? 'bg-blue-200/60 shadow-inner border-blue-300'
                        : 'bg-blue-100/40 border-blue-200'
                    }`}
                  >
                    {displayJmlPar}
                  </td>

                  {/* Enteral Cells */}
                  {enteralCols.map((col) => {
                    const cIdx = colTracker++;
                    return (
                      <td
                        key={col.id}
                        className="py-1 px-1 border border-cyan-100 bg-cyan-50/40 text-center"
                      >
                        <input
                          type="number"
                          data-rowidx={rowIdx}
                          data-colidx={cIdx}
                          value={row[col.id] !== undefined ? row[col.id] : ''}
                          onChange={(e) =>
                            onUpdateFluidCell(hour, col.id, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, cIdx)}
                          className="w-[72px] mx-auto block bg-white border border-cyan-200 rounded px-1.5 py-1 text-[11px] text-center focus:ring-1 focus:ring-cyan-500 font-mono transition"
                          placeholder="-"
                        />
                      </td>
                    );
                  })}

                  {/* Jml Enteral */}
                  <td
                    className={`py-1.5 px-1.5 text-center font-mono font-bold text-cyan-800 text-[11px] border ${
                      is3Hr
                        ? 'bg-cyan-200/60 shadow-inner border-cyan-300'
                        : 'bg-cyan-100/40 border-cyan-200'
                    }`}
                  >
                    {displayJmlEnt}
                  </td>

                  {/* Output Cells */}
                  {outputCols.map((col) => {
                    const cIdx = colTracker++;
                    return (
                      <td
                        key={col.id}
                        className="py-1 px-1 border border-amber-100 bg-amber-50/40 text-center"
                      >
                        <input
                          type="number"
                          data-rowidx={rowIdx}
                          data-colidx={cIdx}
                          value={row[col.id] !== undefined ? row[col.id] : ''}
                          onChange={(e) =>
                            onUpdateFluidCell(hour, col.id, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, cIdx)}
                          className="w-[72px] mx-auto block bg-white border border-amber-200 rounded px-1.5 py-1 text-[11px] text-center focus:ring-1 focus:ring-amber-500 font-mono transition"
                          placeholder="-"
                        />
                      </td>
                    );
                  })}

                  {/* Jml Output */}
                  <td
                    className={`py-1.5 px-1.5 text-center font-mono font-bold text-amber-800 text-[11px] border ${
                      is3Hr
                        ? 'bg-amber-200/60 shadow-inner border-amber-300'
                        : 'bg-amber-100/40 border-amber-200'
                    }`}
                  >
                    {displayJmlOut}
                  </td>

                  {/* IWL Cell */}
                  {(() => {
                    const cIdx = colTracker++;
                    return (
                      <td className="py-1 px-1 border border-slate-100 text-center">
                        <input
                          type="number"
                          data-rowidx={rowIdx}
                          data-colidx={cIdx}
                          value={row.iwl !== undefined ? row.iwl : ''}
                          onChange={(e) =>
                            onUpdateFluidCell(hour, 'iwl', e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, cIdx)}
                          className="w-[72px] mx-auto block bg-purple-50/30 border border-purple-200 rounded px-1.5 py-1 text-[11px] text-center text-purple-700 font-mono focus:ring-1 focus:ring-purple-500"
                          placeholder={String(defaultIWL)}
                        />
                      </td>
                    );
                  })()}

                  {/* Period Balance */}
                  <td
                    className={`py-1.5 px-1.5 text-center font-mono font-semibold text-[11px] border border-slate-200 ${
                      is3Hr
                        ? periodBalanceNum >= 0
                          ? 'text-teal-700 bg-teal-50/80 shadow-inner'
                          : 'text-red-600 font-bold bg-teal-50/80 shadow-inner'
                        : 'bg-slate-50/50'
                    }`}
                  >
                    {displayPeriodBalance}
                  </td>

                  {/* Cumulative Balance */}
                  <td
                    className={`py-1.5 px-1.5 text-center font-mono text-xs border border-slate-200 ${
                      is3Hr
                        ? cumBalanceNum >= 0
                          ? 'text-emerald-800 font-bold bg-emerald-100/80 shadow-inner'
                          : 'text-red-600 font-bold bg-emerald-100/80 shadow-inner'
                        : 'bg-slate-50/50'
                    }`}
                  >
                    {displayCumBalance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
