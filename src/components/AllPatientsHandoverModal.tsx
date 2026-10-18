import React, { useState } from 'react';
import { DayBedsData, BedData, Medication, InvasiveDeviceItem } from '../types';
import {
  formatDateID,
  calculateDayOfCare,
  calculatePostOpInfo,
  getHourShift,
  checkInvasiveReplacement,
} from '../constants';

interface AllPatientsHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  beds: string[];
  dayBeds: DayBedsData;
  currentDateStr: string;
}

type ShiftFilter = 'pagi' | 'sore' | 'malam' | 'all';
type ViewMode = 'sbar' | 'table';

export const AllPatientsHandoverModal: React.FC<AllPatientsHandoverModalProps> = ({
  isOpen,
  onClose,
  beds,
  dayBeds,
  currentDateStr,
}) => {
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('pagi');
  const [viewMode, setViewMode] = useState<ViewMode>('sbar');
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(true);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  // Helper untuk mendapatkan kode Post-Op (H-0, H+1, dst) dari daftar operasi
  const getPrimaryPostOpCode = (
    postOps?: import('../types').PostOpItem[],
    targetDate?: string
  ): string => {
    if (!postOps || postOps.length === 0) return '';
    const latest = postOps[postOps.length - 1];
    const info = calculatePostOpInfo(latest.date, targetDate);
    return info ? info.code : '';
  };

  // Format tanggal Indonesia
  const formattedDate = formatDateID(currentDateStr);

  // Ambil label shift
  const getShiftLabel = (shift: ShiftFilter) => {
    switch (shift) {
      case 'pagi':
        return 'Shift Pagi (07.00 - 14.00)';
      case 'sore':
        return 'Shift Sore (14.00 - 21.00)';
      case 'malam':
        return 'Shift Malam (21.00 - 07.00)';
      case 'all':
      default:
        return 'Semua Shift (24 Jam)';
    }
  };

  // Helper untuk memeriksa apakah bed memiliki data pasien aktif
  const isBedOccupied = (bedData?: BedData) => {
    if (!bedData || !bedData.patient) return false;
    const { name, rm, diagnosis, doctor, doctors } = bedData.patient;
    const hasName = Boolean(name && name.trim());
    const hasRm = Boolean(rm && rm.trim());
    const hasDx = Boolean(diagnosis && diagnosis.trim());
    const hasDoc = Boolean((doctor && doctor.trim()) || (doctors && doctors.length > 0));
    return hasName || hasRm || hasDx || hasDoc;
  };

  // Hitung statistik ruangan
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => isBedOccupied(dayBeds[b]));
  const emptyBedsCount = totalBeds - occupiedBeds.length;

  // Filter daftar bed sesuai pengaturan
  const displayedBeds = showOnlyOccupied
    ? beds.filter((b) => isBedOccupied(dayBeds[b]))
    : beds;

  // Helper kalkulasi balance cairan per bed
  const calculateFluidSummary = (bedData?: BedData) => {
    if (!bedData || !bedData.fluidBalance) {
      return { intakeParenteral: 0, intakeEnteral: 0, output: 0, balance: 0 };
    }
    const fb = bedData.fluidBalance;
    let intakeP = 0;
    let intakeE = 0;
    let totalOut = 0;

    Object.keys(fb).forEach((hour) => {
      const row = fb[hour] || {};
      // Jumlahkan intake parenteral
      (bedData.intakeParenteralCols || []).forEach((c) => {
        const val = parseFloat(row[c.id]) || 0;
        intakeP += val;
      });
      // Jumlahkan intake enteral
      (bedData.intakeEnteralCols || []).forEach((c) => {
        const val = parseFloat(row[c.id]) || 0;
        intakeE += val;
      });
      // Jumlahkan output
      (bedData.outputCols || []).forEach((c) => {
        const val = parseFloat(row[c.id]) || 0;
        totalOut += val;
      });
    });

    const totalIntake = intakeP + intakeE;
    const balance = totalIntake - totalOut;

    return {
      intakeParenteral: intakeP,
      intakeEnteral: intakeE,
      totalIntake,
      output: totalOut,
      balance,
    };
  };

  // Helper filter obat berdasarkan shift
  const filterMedsByShift = (meds: Medication[] = [], shift: ShiftFilter) => {
    return meds.filter((m) => {
      if (m.isStopped) return true; // Tetap sertakan untuk status operan
      if (shift === 'all') return true;
      const hours = m.hours || [];
      return hours.some((h) => getHourShift(h) === shift);
    });
  };

  // Hitung jumlah ventilator
  const ventCount = beds.filter((b) => {
    const p = dayBeds[b]?.patient;
    if (!p) return false;
    const vent = (p.ventilation || '').toLowerCase();
    return (
      vent.includes('vent') ||
      vent.includes('ett') ||
      vent.includes('simv') ||
      vent.includes('cpap') ||
      vent.includes('bipap')
    );
  }).length;

  // Fungsi Cetak Terisolasi Format Laporan Operan Semua Pasien
  const handlePrintHandover = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '100px';
    iframe.style.height = '100px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      return;
    }

    const patientRowsHtml = displayedBeds
      .map((bedName, idx) => {
        const bedData = dayBeds[bedName];
        const isOcc = isBedOccupied(bedData);

        if (!isOcc) {
          return `
            <div class="patient-card empty-card">
              <div class="bed-title"><strong>${bedName}</strong> — [BED KOSONG / SIAP PAKAI]</div>
            </div>
          `;
        }

        const p = bedData.patient;
        const hoc = calculateDayOfCare(p.admissionDate, currentDateStr);
        const podInfo = getPrimaryPostOpCode(p.postOps, currentDateStr);
        const fbSummary = calculateFluidSummary(bedData);
        const shiftMeds = filterMedsByShift(bedData.medications || [], shiftFilter);
        const activeMeds = shiftMeds.filter((m) => !m.isStopped);
        const stoppedMeds = shiftMeds.filter((m) => m.isStopped);

        // Dokter DPJP & Konsulen
        const doctorStr =
          p.doctors && p.doctors.length > 0
            ? p.doctors.join(', ')
            : p.doctor || '-';

        // Alat invasif
        const invList = p.invasiveDevices || [];
        const invStr =
          invList.length > 0
            ? invList
                .map((d) => {
                  const name = d.type === 'Lainnya' ? d.customName || 'Lainnya' : d.type;
                  const pos = d.position ? `(${d.position})` : '';
                  const sz = d.sizeNumber ? `[${d.sizeNumber}]` : '';
                  const check = checkInvasiveReplacement(d, currentDateStr);
                  const warn = check.needsReplacement
                    ? ` <span class="warn">(${check.message})</span>`
                    : '';
                  return `${name} ${sz} ${pos} tgl ${d.date || '-'}${warn}`;
                })
                .join('; ')
            : p.invasive || 'Tidak ada alat invasif khusus';

        // Infus
        const infStr =
          (bedData.infusions || []).length > 0
            ? bedData.infusions
                ?.map((inf) => `${inf.name}${inf.rate ? ` @ ${inf.rate}` : ''}`)
                .join(', ')
            : 'Tidak ada cairan infus tercatat';

        // Diet
        const dietStr =
          (bedData.diets || []).length > 0
            ? bedData.diets?.map((d) => `${d.name} (${d.route || 'Oral'})`).join(', ')
            : p.diet || 'Diet biasa / NPO';

        // Terapi Obat
        const medsStr =
          activeMeds.length > 0
            ? activeMeds
                .map((m) => {
                  const hrs = (m.hours || []).join(', ');
                  return `<b>${m.name}</b> ${m.dose} (${m.route || 'IV'}) [${hrs}]`;
                })
                .join('; ')
            : 'Tidak ada obat injeksi shift ini';

        const stoppedStr =
          stoppedMeds.length > 0
            ? `<div class="stopped-meds"><b>Obat Stop:</b> ${stoppedMeds
                .map((m) => `${m.name} (${m.dose})`)
                .join(', ')}</div>`
            : '';

        return `
          <div class="patient-card">
            <div class="card-header">
              <span class="bed-badge">${bedName}</span>
              <span class="patient-identity">
                <b>${(p.name || 'TANPA NAMA').toUpperCase()}</b> (RM: ${p.rm || '-'}) · 
                ${p.age ? `${p.age} Th` : ''} ${p.gender ? `[${p.gender}]` : ''} · 
                HOC: <b>${hoc || 'H+1'}</b>${podInfo ? ` · POD: <b>${podInfo}</b>` : ''}
              </span>
              <span class="dpjp">DPJP: <b>${doctorStr}</b></span>
            </div>

            <div class="sbar-grid">
              <div class="sbar-box sbar-s">
                <div class="sbar-tag">S - SITUATION</div>
                <div><b>Diagnosa:</b> ${p.diagnosis || '-'}</div>
                <div><b>Asal Pasien:</b> ${p.origin || '-'}</div>
              </div>

              <div class="sbar-box sbar-b">
                <div class="sbar-tag">B - BACKGROUND</div>
                <div><b>Riwayat Operasi:</b> ${
                  p.postOps && p.postOps.length > 0
                    ? p.postOps.map((o) => `${o.procedure} (${o.date})`).join('; ')
                    : '-'
                }</div>
                <div><b>Alat Invasif:</b> ${invStr}</div>
              </div>

              <div class="sbar-box sbar-a">
                <div class="sbar-tag">A - ASSESSMENT</div>
                <div><b>Respirasi / Ventilasi:</b> ${p.ventilation || 'Spontan'}</div>
                <div><b>Diet / Nutrisi:</b> ${dietStr}</div>
                <div><b>Infus:</b> ${infStr}</div>
                <div><b>Balance Cairan Kumulatif:</b> Intake: ${fbSummary.totalIntake} cc | Output: ${fbSummary.output} cc | Balance: <b>${
          fbSummary.balance >= 0 ? '+' : ''
        }${fbSummary.balance} cc</b></div>
              </div>

              <div class="sbar-box sbar-r">
                <div class="sbar-tag">R - RECOMMENDATION & TERAPI</div>
                <div><b>Terapi Obat (${getShiftLabel(shiftFilter)}):</b> ${medsStr}</div>
                ${stoppedStr}
                <div><b>Catatan Khusus / Instruksi:</b> ${p.notes || '-'}</div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Lembar Operan Asuhan Keperawatan ICU - RSUD Blambangan</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 15mm 12mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .header-logo {
      font-size: 15px;
      font-weight: bold;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-sub {
      font-size: 10px;
      color: #475569;
    }
    .header-title {
      font-size: 13px;
      font-weight: bold;
      text-align: right;
      color: #0f172a;
    }
    .header-meta {
      font-size: 10px;
      text-align: right;
      color: #334155;
    }
    .stat-banner {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 8px;
      border-radius: 4px;
      margin-bottom: 10px;
      font-size: 10px;
      display: flex;
      justify-content: space-between;
    }
    .patient-card {
      border: 1px solid #94a3b8;
      border-radius: 5px;
      margin-bottom: 10px;
      page-break-inside: avoid;
      background: #ffffff;
    }
    .empty-card {
      border: 1px dashed #cbd5e1;
      background: #f8fafc;
      padding: 6px 10px;
    }
    .card-header {
      background: #f8fafc;
      border-bottom: 1px solid #cbd5e1;
      padding: 5px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .bed-badge {
      background: #0f766e;
      color: #ffffff;
      font-weight: bold;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .patient-identity {
      font-size: 11px;
      flex: 1;
    }
    .dpjp {
      font-size: 10px;
      color: #334155;
    }
    .sbar-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px 8px;
    }
    .sbar-box {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 5px 7px;
      font-size: 10px;
      background: #ffffff;
    }
    .sbar-tag {
      font-weight: bold;
      font-size: 9px;
      text-transform: uppercase;
      padding: 1px 4px;
      border-radius: 2px;
      display: inline-block;
      margin-bottom: 3px;
    }
    .sbar-s .sbar-tag { background: #e0f2fe; color: #0369a1; }
    .sbar-b .sbar-tag { background: #f1f5f9; color: #334155; }
    .sbar-a .sbar-tag { background: #fef3c7; color: #b45309; }
    .sbar-r .sbar-tag { background: #dcfce7; color: #15803d; }
    .stopped-meds {
      color: #be123c;
      margin-top: 2px;
      font-size: 9.5px;
    }
    .warn {
      color: #dc2626;
      font-weight: bold;
    }
    .signature-section {
      margin-top: 15px;
      width: 100%;
      border-top: 1px solid #94a3b8;
      padding-top: 8px;
      page-break-inside: avoid;
    }
    .sig-table {
      width: 100%;
      text-align: center;
      font-size: 10px;
    }
    .sig-table td {
      width: 33.33%;
      padding: 4px;
      vertical-align: top;
    }
    .sig-space {
      height: 45px;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="header-logo">RSUD BLAMBANGAN BANYUWANGI</div>
        <div class="header-sub">Instalasi Perawatan Intensif (ICU) · Rekam Medis Elektronik Terintegrasi</div>
      </td>
      <td>
        <div class="header-title">LEMBAR OPERAN ASUHAN KEPERAWATAN SHIFT</div>
        <div class="header-meta">Tanggal: <b>${formattedDate}</b> | Periode: <b>${getShiftLabel(
      shiftFilter
    )}</b></div>
      </td>
    </tr>
  </table>

  <div class="stat-banner">
    <span><b>Status Ruangan ICU:</b> Total Bed: ${totalBeds} | Terisi: <b>${
      occupiedBeds.length
    } Pasien</b> | Kosong: <b>${emptyBedsCount} Bed</b></span>
    <span>Pasien Ventilasi / ETT: <b>${ventCount} Orang</b> | Dicetak: ${new Date().toLocaleTimeString(
      'id-ID',
      { hour: '2-digit', minute: '2-digit' }
    )} WIB</span>
  </div>

  <div class="patient-list">
    ${patientRowsHtml}
  </div>

  <div class="signature-section">
    <table class="sig-table">
      <tr>
        <td>
          <div><b>Perawat Jaga Menyerahkan:</b></div>
          <div class="sig-space"></div>
          <div>( ..................................................... )</div>
          <div>NIP.</div>
        </td>
        <td>
          <div><b>Perawat Jaga Menerima:</b></div>
          <div class="sig-space"></div>
          <div>( ..................................................... )</div>
          <div>NIP.</div>
        </td>
        <td>
          <div><b>Mengetahui, KaRu / Katim ICU:</b></div>
          <div class="sig-space"></div>
          <div>( ..................................................... )</div>
          <div>NIP.</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    doc.open();
    doc.write(fullHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 500);
  };

  // Salin Rangkuman Teks untuk WhatsApp / Telegram Dinas Jaga
  const handleCopyTextReport = () => {
    let report = `*LAPORAN OPERAN SHIFT ICU RSUD BLAMBANGAN*\n`;
    report += `📅 Tanggal: ${formattedDate}\n`;
    report += `⏰ ${getShiftLabel(shiftFilter)}\n`;
    report += `🏥 Status: ${occupiedBeds.length} Pasien Terisi, ${emptyBedsCount} Bed Kosong (Ventilator: ${ventCount})\n`;
    report += `=====================================\n\n`;

    displayedBeds.forEach((bedName) => {
      const bedData = dayBeds[bedName];
      if (!isBedOccupied(bedData)) {
        if (!showOnlyOccupied) {
          report += `*${bedName}*: [KOSONG]\n\n`;
        }
        return;
      }

      const p = bedData.patient;
      const hoc = calculateDayOfCare(p.admissionDate, currentDateStr);
      const podInfo = getPrimaryPostOpCode(p.postOps, currentDateStr);
      const fbSummary = calculateFluidSummary(bedData);
      const shiftMeds = filterMedsByShift(bedData.medications || [], shiftFilter);
      const activeMeds = shiftMeds.filter((m) => !m.isStopped);
      const stoppedMeds = shiftMeds.filter((m) => m.isStopped);

      const doctorStr =
        p.doctors && p.doctors.length > 0 ? p.doctors.join(', ') : p.doctor || '-';

      report += `*【 ${bedName} 】 ${p.name || 'Tn/Ny'}* (RM: ${p.rm || '-'} | ${
        p.age || '-'
      } th | ${p.gender || '-'}) - HOC ${hoc || '1'}${podInfo ? `, POD ${podInfo}` : ''}\n`;
      report += `• *DPJP*: ${doctorStr}\n`;
      report += `• *Dx*: ${p.diagnosis || '-'}\n`;
      if (p.ventilation) report += `• *Respirasi*: ${p.ventilation}\n`;

      if (p.invasiveDevices && p.invasiveDevices.length > 0) {
        const invStr = p.invasiveDevices
          .map((d) => {
            const name = d.type === 'Lainnya' ? d.customName || 'Lainnya' : d.type;
            return `${name}${d.position ? ` (${d.position})` : ''}`;
          })
          .join(', ');
        report += `• *Alat Invasif*: ${invStr}\n`;
      }

      if (bedData.infusions && bedData.infusions.length > 0) {
        const infStr = bedData.infusions
          .map((inf) => `${inf.name}${inf.rate ? ` @ ${inf.rate}` : ''}`)
          .join(', ');
        report += `• *Infus*: ${infStr}\n`;
      }

      report += `• *Balance Cairan*: ${
        fbSummary.balance >= 0 ? '+' : ''
      }${fbSummary.balance} cc (In: ${fbSummary.totalIntake}, Out: ${fbSummary.output})\n`;

      if (activeMeds.length > 0) {
        const medsSummary = activeMeds
          .map((m) => `${m.name} ${m.dose} [${(m.hours || []).join(',')}]`)
          .join('; ');
        report += `• *Terapi Shift*: ${medsSummary}\n`;
      }

      if (stoppedMeds.length > 0) {
        report += `• *STOP*: ${stoppedMeds.map((m) => m.name).join(', ')}\n`;
      }

      if (p.notes) {
        report += `• *Instruksi Khusus*: ${p.notes}\n`;
      }

      report += `-------------------------------------\n\n`;
    });

    report += `Laporan otomatis dibuat dari Sistem Jadwal Injeksi & Asuhan Keperawatan ICU RSUD Blambangan.`;

    navigator.clipboard.writeText(report).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-teal-700 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800/80 border border-teal-500/50 flex items-center justify-center text-teal-200 text-lg shadow-inner">
              <i className="fa-solid fa-clipboard-user"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Ringkasan Operan Asuhan Keperawatan Semua Pasien ICU
                </h3>
                <span className="bg-teal-800 text-teal-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-teal-600/50">
                  {occupiedBeds.length} Pasien Terisi
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">
                RSUD Blambangan · Tanggal: <strong>{formattedDate}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-teal-800/60 hover:bg-teal-800 text-teal-100 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Tutup Modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Toolbar Kontrol & Filter */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Pilihan Shift & View Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Shift Filter Pills */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setShiftFilter('pagi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  shiftFilter === 'pagi'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-sun text-xs"></i>
                <span>Pagi</span>
              </button>
              <button
                onClick={() => setShiftFilter('sore')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  shiftFilter === 'sore'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-cloud-sun text-xs"></i>
                <span>Sore</span>
              </button>
              <button
                onClick={() => setShiftFilter('malam')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  shiftFilter === 'malam'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-moon text-xs"></i>
                <span>Malam</span>
              </button>
              <button
                onClick={() => setShiftFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  shiftFilter === 'all'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-clock text-xs"></i>
                <span>24 Jam</span>
              </button>
            </div>

            {/* View Mode Toggle: SBAR Cards vs Matrix Table */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('sbar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'sbar'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Tampilan Kartu SBAR Komprehensif"
              >
                <i className="fa-solid fa-table-cells-large"></i>
                <span>Kartu SBAR</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title="Tampilan Matriks Tabel Kompak"
              >
                <i className="fa-solid fa-table-list"></i>
                <span>Tabel Matriks</span>
              </button>
            </div>

            {/* Checkbox Filter: Hanya Pasien Aktif */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-200/70 dark:hover:bg-slate-750 transition">
              <input
                type="checkbox"
                checked={showOnlyOccupied}
                onChange={(e) => setShowOnlyOccupied(e.target.checked)}
                className="w-4 h-4 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded cursor-pointer accent-teal-600 dark:accent-teal-500"
              />
              <span>Hanya Bed Terisi ({occupiedBeds.length})</span>
            </label>
          </div>

          {/* Action Buttons: Cetak & Salin Laporan WA */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTextReport}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                copiedSuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-750'
              }`}
              title="Salin rekap operan shift dalam format teks WhatsApp / Telegram"
            >
              <i className={`fa-solid ${copiedSuccess ? 'fa-check text-white' : 'fa-copy text-teal-600 dark:text-teal-400'}`}></i>
              <span>{copiedSuccess ? 'Tersalin ke Clipboard!' : 'Salin Teks WA'}</span>
            </button>

            <button
              onClick={handlePrintHandover}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
              title="Cetak lembar operan resmi asuhan keperawatan semua pasien ICU"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak Operan Semua Pasien</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Statistik Cepat */}
        <div className="px-5 py-2.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Total Ruangan: <strong className="text-slate-800 dark:text-slate-200">{totalBeds} Bed</strong>
            </span>
            <span>·</span>
            <span>
              Bed Terisi: <strong className="text-teal-600 dark:text-teal-400">{occupiedBeds.length} Pasien</strong>
            </span>
            <span>·</span>
            <span>
              Bed Kosong: <strong className="text-slate-500 dark:text-slate-400">{emptyBedsCount} Bed</strong>
            </span>
            <span>·</span>
            <span>
              Pasien Ventilator / ETT: <strong className="text-rose-600 dark:text-rose-400">{ventCount} Pasien</strong>
            </span>
          </div>

          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Shift Aktif: <span className="font-bold text-teal-700 dark:text-teal-300">{getShiftLabel(shiftFilter)}</span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
          {displayedBeds.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <i className="fa-solid fa-hospital-user text-4xl text-slate-300 dark:text-slate-600 mb-2"></i>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Tidak Ada Data Pasien yang Ditampilkan
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Semua ruangan saat ini belum memiliki data pasien aktif. Hapus centang "Hanya Bed Terisi" untuk melihat seluruh daftar ruangan.
              </p>
            </div>
          ) : viewMode === 'sbar' ? (
            /* VIEW MODE 1: KARTU SBAR DETAIL */
            <div className="space-y-4">
              {displayedBeds.map((bedName) => {
                const bedData = dayBeds[bedName];
                const isOcc = isBedOccupied(bedData);

                if (!isOcc) {
                  return (
                    <div
                      key={bedName}
                      className="p-3 bg-slate-100/70 dark:bg-slate-850/60 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex items-center justify-between opacity-80"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-md border border-slate-300 dark:border-slate-700">
                          {bedName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                          Bed Kosong / Belum terisi pasien
                        </span>
                      </div>
                      <span className="text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-semibold border border-slate-300 dark:border-slate-700">
                        Siap Pakai
                      </span>
                    </div>
                  );
                }

                const p = bedData.patient;
                const hoc = calculateDayOfCare(p.admissionDate, currentDateStr);
                const podInfo = getPrimaryPostOpCode(p.postOps, currentDateStr);
                const fbSummary = calculateFluidSummary(bedData);
                const shiftMeds = filterMedsByShift(bedData.medications || [], shiftFilter);
                const activeMeds = shiftMeds.filter((m) => !m.isStopped);
                const stoppedMeds = shiftMeds.filter((m) => m.isStopped);

                const doctorStr =
                  p.doctors && p.doctors.length > 0
                    ? p.doctors.join(', ')
                    : p.doctor || '-';

                return (
                  <div
                    key={bedName}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Header Kartu Pasien */}
                    <div className="bg-slate-100/80 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1 bg-teal-600 text-white font-bold text-sm rounded-lg shadow-2xs">
                          {bedName}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {p.name || 'TANPA NAMA'}
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                              (RM: <strong className="text-slate-800 dark:text-slate-200">{p.rm || '-'}</strong>)
                            </span>
                            {p.age && (
                              <span className="text-xs bg-slate-200 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
                                {p.age} Th {p.gender ? `· ${p.gender}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 rounded-lg font-bold">
                          Hari Rawat: {hoc || 'H+1'}
                        </span>
                        {podInfo && (
                          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg font-bold">
                            Post-Op: {podInfo}
                          </span>
                        )}
                        <span className="text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                          DPJP: <strong className="text-slate-800 dark:text-slate-200">{doctorStr}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Kuadran SBAR (Situation, Background, Assessment, Recommendation) */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                      {/* S: Situation */}
                      <div className="bg-sky-50/70 dark:bg-slate-850 border border-sky-200 dark:border-sky-900/60 rounded-xl p-3.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold uppercase tracking-wide text-[11px] pb-1 border-b border-sky-200/80 dark:border-sky-900/60">
                          <span className="w-5 h-5 rounded bg-sky-600 text-white flex items-center justify-center text-[10px] font-black">
                            S
                          </span>
                          <span>Situation (Kondisi Saat Ini)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Diagnosa Medis:</span>{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {p.diagnosis || 'Belum diisi'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Asal Masuk:</span>{' '}
                          <span className="text-slate-700 dark:text-slate-300">{p.origin || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Tgl Masuk ICU:</span>{' '}
                          <span className="text-slate-700 dark:text-slate-300">
                            {p.admissionDate ? formatDateID(p.admissionDate) : '-'}
                          </span>
                        </div>
                      </div>

                      {/* B: Background */}
                      <div className="bg-slate-100/60 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wide text-[11px] pb-1 border-b border-slate-200 dark:border-slate-800">
                          <span className="w-5 h-5 rounded bg-slate-600 text-white flex items-center justify-center text-[10px] font-black">
                            B
                          </span>
                          <span>Background (Riwayat & Alat Invasif)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Riwayat Operasi:</span>{' '}
                          <span className="text-slate-800 dark:text-slate-200">
                            {p.postOps && p.postOps.length > 0
                              ? p.postOps
                                  .map((o) => `${o.procedure} (${formatDateID(o.date)})`)
                                  .join('; ')
                              : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Alat Invasif:</span>{' '}
                          {p.invasiveDevices && p.invasiveDevices.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {p.invasiveDevices.map((dev, i) => {
                                const check = checkInvasiveReplacement(dev, currentDateStr);
                                const devName =
                                  dev.type === 'Lainnya' ? dev.customName || 'Lainnya' : dev.type;
                                return (
                                  <span
                                    key={i}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 ${
                                      check.needsReplacement
                                        ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <span>
                                      {devName} {dev.sizeNumber ? `[${dev.sizeNumber}]` : ''} (
                                      {dev.position || 'Pasien'})
                                    </span>
                                    {check.needsReplacement && (
                                      <i
                                        className="fa-solid fa-triangle-exclamation text-rose-600 text-[10px]"
                                        title={check.message}
                                      ></i>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 italic">
                              {p.invasive || 'Tidak ada alat invasif khusus'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* A: Assessment */}
                      <div className="bg-amber-50/70 dark:bg-slate-850 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wide text-[11px] pb-1 border-b border-amber-200/80 dark:border-amber-900/60">
                          <span className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">
                            A
                          </span>
                          <span>Assessment (Ventilasi, Cairan & Diet)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Respirasi / Oksigenasi:</span>{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.ventilation || 'Spontan'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Diet / Nutrisi:</span>{' '}
                          <span className="text-slate-800 dark:text-slate-200">
                            {(bedData.diets || []).length > 0
                              ? bedData.diets
                                  ?.map((d) => `${d.name} (${d.route || 'Oral'})`)
                                  .join(', ')
                              : p.diet || 'Diet biasa / NPO'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Cairan Infus Aktif:</span>{' '}
                          <span className="text-slate-800 dark:text-slate-200">
                            {(bedData.infusions || []).length > 0
                              ? bedData.infusions
                                  ?.map((inf) => `${inf.name}${inf.rate ? ` (${inf.rate})` : ''}`)
                                  .join(', ')
                              : 'Tidak ada infus tercatat'}
                          </span>
                        </div>
                        <div className="mt-1 pt-1.5 border-t border-amber-200/60 dark:border-amber-900/50 flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            Balance Cairan:
                          </span>
                          <span className="font-mono font-bold text-xs">
                            In: {fbSummary.totalIntake} | Out: {fbSummary.output} |{' '}
                            <span
                              className={
                                fbSummary.balance > 0
                                  ? 'text-teal-700 dark:text-teal-300'
                                  : fbSummary.balance < 0
                                  ? 'text-rose-700 dark:text-rose-300'
                                  : 'text-slate-700 dark:text-slate-300'
                              }
                            >
                              Bal: {fbSummary.balance >= 0 ? '+' : ''}
                              {fbSummary.balance} cc
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* R: Recommendation */}
                      <div className="bg-emerald-50/70 dark:bg-slate-850 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wide text-[11px] pb-1 border-b border-emerald-200/80 dark:border-emerald-900/60">
                          <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                            R
                          </span>
                          <span>Recommendation (Terapi Shift & Rencana)</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            Terapi Obat ({getShiftLabel(shiftFilter)}):
                          </span>
                          {activeMeds.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {activeMeds.map((med, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 border border-emerald-300/80 dark:border-emerald-800 font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                                >
                                  <strong>{med.name}</strong> {med.dose} ({med.route || 'IV'}){' '}
                                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                                    [{(med.hours || []).join(', ')}]
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 dark:text-slate-400 italic mt-0.5">
                              Tidak ada jadwal obat pada shift ini
                            </p>
                          )}
                        </div>

                        {stoppedMeds.length > 0 && (
                          <div className="mt-1 p-1.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-[11px]">
                            <i className="fa-solid fa-ban mr-1"></i>
                            <strong>Obat DI-STOP:</strong>{' '}
                            {stoppedMeds.map((m) => `${m.name} (${m.dose})`).join(', ')}
                          </div>
                        )}

                        <div className="mt-1 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/50">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            Catatan / Instruksi DPJP:
                          </span>
                          <p className="text-slate-800 dark:text-slate-100 font-medium mt-0.5 italic">
                            {p.notes || 'Tidak ada catatan khusus'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE 2: TABEL MATRIKS KOMPAK */
            <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-teal-700 text-white font-bold border-b border-teal-800 dark:border-teal-900">
                    <th className="py-2.5 px-3 whitespace-nowrap">Bed</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Pasien & Identitas</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Diagnosa & DPJP</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Alat Invasif & Resp</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Infus & Balance</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Terapi Shift ({shiftFilter})</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Catatan / Instruksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {displayedBeds.map((bedName) => {
                    const bedData = dayBeds[bedName];
                    const isOcc = isBedOccupied(bedData);

                    if (!isOcc) {
                      return (
                        <tr key={bedName} className="bg-slate-50 dark:bg-slate-850/60 text-slate-400 dark:text-slate-500 italic">
                          <td className="py-2 px-3 font-bold text-slate-500 dark:text-slate-400">{bedName}</td>
                          <td colSpan={6} className="py-2 px-3">
                            [Bed Kosong / Siap Digunakan]
                          </td>
                        </tr>
                      );
                    }

                    const p = bedData.patient;
                    const hoc = calculateDayOfCare(p.admissionDate, currentDateStr);
                    const podInfo = getPrimaryPostOpCode(p.postOps, currentDateStr);
                    const fbSummary = calculateFluidSummary(bedData);
                    const shiftMeds = filterMedsByShift(bedData.medications || [], shiftFilter);
                    const activeMeds = shiftMeds.filter((m) => !m.isStopped);

                    const doctorStr =
                      p.doctors && p.doctors.length > 0
                        ? p.doctors.join(', ')
                        : p.doctor || '-';

                    return (
                      <tr
                        key={bedName}
                        className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-bold align-top text-teal-700 dark:text-teal-400 whitespace-nowrap">
                          {bedName}
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {p.name || 'TANPA NAMA'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            RM: {p.rm || '-'} · {p.age ? `${p.age}th` : ''} {p.gender || ''}
                          </div>
                          <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                            HOC: {hoc || 'H+1'}{podInfo ? ` · POD: ${podInfo}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">
                            {p.diagnosis || '-'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            DPJP: {doctorStr}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-medium text-slate-700 dark:text-slate-300">
                            Resp: <strong>{p.ventilation || 'Spontan'}</strong>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {p.invasiveDevices && p.invasiveDevices.length > 0
                              ? p.invasiveDevices.map((d) => d.type).join(', ')
                              : p.invasive || '-'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          <div className="font-mono text-xs">
                            Bal:{' '}
                            <strong
                              className={
                                fbSummary.balance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {fbSummary.balance >= 0 ? '+' : ''}
                              {fbSummary.balance}
                            </strong>{' '}
                            cc
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            In: {fbSummary.totalIntake} | Out: {fbSummary.output}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 align-top">
                          {activeMeds.length > 0 ? (
                            <div className="space-y-0.5">
                              {activeMeds.map((m, i) => (
                                <div key={i} className="text-[11px] text-slate-800 dark:text-slate-200">
                                  • <strong>{m.name}</strong> {m.dose} ({(m.hours || []).join(',')})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">Tidak ada obat shift ini</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 align-top text-[11px] text-slate-700 dark:text-slate-300 italic">
                          {p.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
            Menampilkan ringkasan asuhan keperawatan resmi Instalasi Perawatan Intensif (ICU) RSUD Blambangan
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrintHandover}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <i className="fa-solid fa-print"></i>
              <span>Cetak Lembar Operan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
