import React, { useState, useEffect } from 'react';
import { DayBedsData, BedData } from '../types';
import { formatDateID, sortHoursFrom08, getLocalDateString } from '../constants';
import { getBedsForDate } from '../services/firebase';

interface AllPatientsDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  beds: string[];
  dayBeds: DayBedsData;
  currentDateStr: string;
}

export const AllPatientsDietModal: React.FC<AllPatientsDietModalProps> = ({
  isOpen,
  onClose,
  beds,
  dayBeds,
  currentDateStr,
}) => {
  const [orderDate, setOrderDate] = useState<string>(() => currentDateStr || getLocalDateString());
  const [showOnlyOccupied, setShowOnlyOccupied] = useState(true);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [targetDateBeds, setTargetDateBeds] = useState<DayBedsData | null>(null);
  const [isLoadingTargetDate, setIsLoadingTargetDate] = useState(false);
  const [dataSource, setDataSource] = useState<'current_beds' | 'target_date_beds'>('current_beds');

  // Sinkronkan orderDate saat currentDateStr berubah
  useEffect(() => {
    if (currentDateStr) {
      setOrderDate(currentDateStr);
    }
  }, [currentDateStr]);

  // Muat data jika tanggal order dipilih berbeda dari currentDateStr
  useEffect(() => {
    if (orderDate && orderDate !== currentDateStr) {
      setIsLoadingTargetDate(true);
      getBedsForDate(orderDate)
        .then((data) => {
          setTargetDateBeds(data);
        })
        .catch(() => {
          setTargetDateBeds(null);
        })
        .finally(() => {
          setIsLoadingTargetDate(false);
        });
    } else {
      setTargetDateBeds(null);
      setDataSource('current_beds');
    }
  }, [orderDate, currentDateStr]);

  if (!isOpen) return null;

  const getOffsetDateString = (offsetDays: number) => {
    const base = new Date();
    base.setDate(base.getDate() + offsetDays);
    const yr = base.getFullYear();
    const mo = String(base.getMonth() + 1).padStart(2, '0');
    const dy = String(base.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const formattedOrderDate = formatDateID(orderDate);
  const formattedOrderDateLong = (() => {
    try {
      const parts = orderDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch {}
    return formattedOrderDate;
  })();

  const effectiveDayBeds =
    dataSource === 'target_date_beds' && targetDateBeds
      ? targetDateBeds
      : dayBeds;

  // Helper memeriksa pasien aktif
  const isBedOccupied = (bedData?: BedData) => {
    if (!bedData || !bedData.patient) return false;
    const { name, rm, diagnosis, doctor, doctors } = bedData.patient;
    return Boolean(
      (name && name.trim()) ||
        (rm && rm.trim()) ||
        (diagnosis && diagnosis.trim()) ||
        (doctor && doctor.trim()) ||
        (doctors && doctors.length > 0)
    );
  };

  // Helper periksa apakah pasien puasa / NPO
  const isPatientNPO = (bedData?: BedData): boolean => {
    if (!bedData) return false;
    const pDiet = (bedData.patient?.diet || '').toLowerCase();
    const pNotes = (bedData.patient?.notes || '').toLowerCase();
    if (
      pDiet.includes('npo') ||
      pDiet.includes('puasa') ||
      pNotes.includes('npo') ||
      pNotes.includes('puasa')
    ) {
      return true;
    }
    const diets = bedData.diets || [];
    return diets.some(
      (d) =>
        d.name.toLowerCase().includes('npo') ||
        d.name.toLowerCase().includes('puasa') ||
        (d.notes || '').toLowerCase().includes('npo') ||
        (d.notes || '').toLowerCase().includes('puasa')
    );
  };

  // Helper format Menu Diet per bed
  const getMenuDietDisplay = (bedData?: BedData) => {
    if (!bedData) return { text: '-', isNpo: false, items: [] };
    const isNpo = isPatientNPO(bedData);
    if (isNpo) {
      return {
        text: 'PUASA / NPO',
        isNpo: true,
        items: ['PUASA / NPO'],
      };
    }

    const items: string[] = [];

    // Jika ada diet umum di identitas pasien (misal: "Diet Jantung II", "Diet DM 1700 kkal")
    if (bedData.patient?.diet?.trim()) {
      items.push(bedData.patient.diet.trim());
    }

    // Jika ada item diet terjadwal / formulasi di section diet
    const diets = bedData.diets || [];
    diets.forEach((d) => {
      const routeStr = d.route ? ` (${d.route})` : '';
      const hoursStr =
        d.hours && d.hours.length > 0 ? ` [${sortHoursFrom08(d.hours).join(', ')}]` : '';
      const formatted = `${d.name}${routeStr}${hoursStr}`;
      if (!items.includes(formatted)) {
        items.push(formatted);
      }
    });

    if (items.length === 0) {
      return {
        text: 'Diet Biasa',
        isNpo: false,
        items: ['Diet Biasa'],
      };
    }

    return {
      text: items.join('; '),
      isNpo: false,
      items,
    };
  };

  // Bed yang ditampilkan
  const displayedBeds = showOnlyOccupied
    ? beds.filter((b) => isBedOccupied(effectiveDayBeds[b]))
    : beds;

  const occupiedBedsCount = beds.filter((b) => isBedOccupied(effectiveDayBeds[b])).length;

  // Fungsi Cetak / Unduh PDF Terisolasi (HANYA 3 KOLOM: Bed Pasien, Nama, Menu Diet)
  const handlePrintDietPdf = () => {
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

    const rowsHtml = displayedBeds
      .map((bedName) => {
        const bedData = effectiveDayBeds[bedName];
        const isOcc = isBedOccupied(bedData);

        if (!isOcc) {
          return `
            <tr class="empty-row">
              <td class="col-bed"><strong>${bedName}</strong></td>
              <td colspan="2" class="col-empty">[ Bed Kosong ]</td>
            </tr>
          `;
        }

        const p = bedData.patient;
        const dietInfo = getMenuDietDisplay(bedData);

        const dietHtml = dietInfo.isNpo
          ? `<span class="tag-npo">PUASA / NPO</span>`
          : dietInfo.items.map((it) => `<div class="diet-line">• ${it}</div>`).join('');

        return `
          <tr>
            <td class="col-bed"><strong>${bedName}</strong></td>
            <td class="col-name"><strong>${(p.name || 'TANPA NAMA').toUpperCase()}</strong></td>
            <td class="col-diet">${dietHtml}</td>
          </tr>
        `;
      })
      .join('');

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Rekap_Gizi_ICU_RSUD_Blambangan_${orderDate}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 15mm 12mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11.5px;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-box {
      border-bottom: 2px solid #b45309;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .hospital-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .hospital-sub {
      font-size: 11px;
      font-weight: bold;
      color: #334155;
    }
    .doc-title {
      font-size: 15px;
      font-weight: 900;
      color: #b45309;
      text-transform: uppercase;
      text-align: right;
    }
    .doc-meta {
      font-size: 11px;
      color: #475569;
      text-align: right;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 6px;
      margin-bottom: 15px;
    }
    table.data-table th {
      background-color: #b45309;
      color: #ffffff;
      font-weight: bold;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #92400e;
      font-size: 11px;
    }
    table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .col-bed { width: 22%; text-align: center; font-weight: bold; }
    .col-name { width: 36%; }
    .col-diet { width: 42%; }
    .tag-npo {
      display: inline-block;
      background: #ffe4e6;
      color: #b91c1c;
      border: 1px solid #fecdd3;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 11px;
    }
    .diet-line {
      margin-bottom: 2px;
    }
    .empty-row td {
      background-color: #f1f5f9;
      color: #64748b;
      font-style: italic;
      text-align: center;
      padding: 6px;
    }
    .footer-table {
      width: 100%;
      margin-top: 25px;
      border-collapse: collapse;
      page-break-inside: avoid;
    }
    .footer-table td {
      width: 50%;
      text-align: center;
      vertical-align: top;
      font-size: 11px;
    }
    .sign-space { height: 50px; }
    .sign-line {
      display: inline-block;
      width: 180px;
      border-bottom: 1px solid #334155;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <div class="hospital-title">RSUD BLAMBANGAN - KABUPATEN BANYUWANGI</div>
      <div class="hospital-sub">INSTALASI RAWAT INTENSIF (ICU) &middot; INSTALASI GIZI / DAPUR</div>
      <div style="font-size: 10px; color: #64748b;">Rekapitulasi Permintaan Diet Pasien ke Bagian Gizi / Dapur</div>
    </div>
    <div>
      <div class="doc-title">REKAP GIZI PASIEN</div>
      <div class="doc-meta">Tanggal Permintaan Order: <strong>${formattedOrderDateLong}</strong></div>
      <div class="doc-meta" style="font-size: 10px; color: #475569;">(${formattedOrderDate}) &middot; Tanggal Cetak: ${formatDateID(getLocalDateString())}</div>
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th class="col-bed">Bed Pasien</th>
        <th class="col-name">Nama</th>
        <th class="col-diet">Menu Diet</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <table class="footer-table">
    <tr>
      <td>
        <div>Diserahkan Oleh,</div>
        <div style="font-weight: bold; color: #0f766e;">Perawat Jaga ICU</div>
        <div class="sign-space"></div>
        <div class="sign-line"></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Nama & Tanda Tangan</div>
      </td>
      <td>
        <div>Diterima Oleh,</div>
        <div style="font-weight: bold; color: #b45309;">Petugas Instalasi Gizi / Dapur</div>
        <div class="sign-space"></div>
        <div class="sign-line"></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Nama & Jam Terima</div>
      </td>
    </tr>
  </table>
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

  // Fungsi Salin WhatsApp HANYA 3 DATA: Bed Pasien, Nama, Menu Diet
  const handleCopyDietReport = () => {
    let report = `*REKAP GIZI PASIEN ICU RSUD BLAMBANGAN*\n`;
    report += `📅 *Tanggal Permintaan Order Diet*: ${formattedOrderDateLong} (${formattedOrderDate})\n`;
    report += `-------------------------------------\n\n`;

    displayedBeds.forEach((bedName) => {
      const bedData = effectiveDayBeds[bedName];
      if (!isBedOccupied(bedData)) {
        if (!showOnlyOccupied) {
          report += `*Bed Pasien*: ${bedName}\n`;
          report += `• *Nama*: [Bed Kosong]\n`;
          report += `• *Menu Diet*: -\n\n`;
        }
        return;
      }

      const p = bedData.patient;
      const dietInfo = getMenuDietDisplay(bedData);

      report += `*Bed Pasien*: ${bedName}\n`;
      report += `• *Nama*: ${(p.name || 'TANPA NAMA').toUpperCase()}\n`;
      report += `• *Menu Diet*: ${dietInfo.text}\n\n`;
    });

    report += `-------------------------------------\n`;
    report += `Diberikan untuk petugas instalasi gizi / dapur RSUD Blambangan.`;

    navigator.clipboard.writeText(report).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="bg-amber-700 text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800/80 border border-amber-500/40 flex items-center justify-center text-amber-200 text-lg shadow-inner">
              <i className="fa-solid fa-utensils"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  Rekap Gizi Pasien ICU (Bagian Gizi & Dapur)
                </h3>
                <span className="bg-amber-850 text-amber-200 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-600/50">
                  {occupiedBedsCount} Pasien
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                RSUD Blambangan · Tanggal Permintaan Order: <strong>{formattedOrderDateLong}</strong> ({formattedOrderDate})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-amber-800/60 hover:bg-amber-800 text-amber-100 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Tutup Modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Panel Pengaturan & Ubah Tanggal Permintaan Order Diet */}
        <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-850 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <i className="fa-regular fa-calendar-days text-amber-600 dark:text-amber-400"></i>
              <span>Tanggal Permintaan Order:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl px-2.5 py-1.5 shadow-2xs focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                title="Klik untuk memilih atau mengubah tanggal permintaan order diet"
              />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOrderDate(getOffsetDateString(0))}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition border cursor-pointer ${
                    orderDate === getOffsetDateString(0)
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                  title="Pilih tanggal hari ini"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDate(getOffsetDateString(1))}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition border cursor-pointer ${
                    orderDate === getOffsetDateString(1)
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800/80'
                  }`}
                  title="Pilih tanggal besok (+1 hari) untuk pemesanan diet gizi berikutnya"
                >
                  Besok (+1 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDate(getOffsetDateString(2))}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition border cursor-pointer ${
                    orderDate === getOffsetDateString(2)
                      ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                  title="Pilih tanggal lusa (+2 hari)"
                >
                  Lusa (+2)
                </button>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-900/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
              {formattedOrderDateLong}
            </span>
          </div>

          {/* Opsi sumber data jika tanggal terpilih berbeda dari tanggal sistem */}
          {orderDate !== currentDateStr && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Sumber Data:</span>
              <button
                type="button"
                onClick={() => setDataSource('current_beds')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  dataSource === 'current_beds'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
                title="Gunakan pasien yang dirawat saat ini untuk order diet tgl tersebut"
              >
                Pasien Saat Ini
              </button>
              {targetDateBeds && (
                <button
                  type="button"
                  onClick={() => setDataSource('target_date_beds')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                    dataSource === 'target_date_beds'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Gunakan data yang tersimpan pada tanggal terpilih"
                >
                  Tersimpan Tgl {formattedOrderDate}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Toolbar Ringkas */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Checkbox Filter */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-200/70 dark:hover:bg-slate-750 transition">
            <input
              type="checkbox"
              checked={showOnlyOccupied}
              onChange={(e) => setShowOnlyOccupied(e.target.checked)}
              className="w-4 h-4 text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded cursor-pointer accent-amber-600 dark:accent-amber-500"
            />
            <span>Hanya Bed Terisi ({occupiedBedsCount})</span>
          </label>

          {/* Action Buttons: Cetak PDF & Salin WA */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDietReport}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                copiedSuccess
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-750'
              }`}
              title="Salin rekap diet ke pesan WhatsApp bagian gizi / dapur"
            >
              <i
                className={`fa-solid ${
                  copiedSuccess ? 'fa-check text-white' : 'fa-copy text-amber-600 dark:text-amber-400'
                }`}
              ></i>
              <span>{copiedSuccess ? 'Tersalin ke Clipboard!' : 'Salin Pesan WA Gizi'}</span>
            </button>

            <button
              onClick={handlePrintDietPdf}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
              title="Cetak atau unduh rekap gizi (hanya bed, nama, menu diet) ke PDF"
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>Cetak / Ekspor PDF</span>
            </button>
          </div>
        </div>

        {/* Modal Body: HANYA MENAMPILKAN TABEL 3 KOLOM */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
          {displayedBeds.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <i className="fa-solid fa-bowl-food text-4xl text-slate-300 dark:text-slate-600 mb-2"></i>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Tidak Ada Pasien Aktif
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Semua bed saat ini kosong. Hapus centang "Hanya Bed Terisi" untuk melihat seluruh daftar bed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-700 text-white font-bold border-b border-amber-800">
                    <th className="py-2.5 px-3.5 whitespace-nowrap w-28">Bed Pasien</th>
                    <th className="py-2.5 px-3.5 min-w-[180px] w-1/3">Nama</th>
                    <th className="py-2.5 px-3.5 min-w-[240px]">Menu Diet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {displayedBeds.map((bedName) => {
                    const bedData = effectiveDayBeds[bedName];
                    const isOcc = isBedOccupied(bedData);

                    if (!isOcc) {
                      return (
                        <tr
                          key={bedName}
                          className="bg-slate-50/70 dark:bg-slate-850/60 text-slate-400 dark:text-slate-500 italic"
                        >
                          <td className="py-2.5 px-3.5 font-bold text-slate-500 dark:text-slate-400">
                            {bedName}
                          </td>
                          <td colSpan={2} className="py-2.5 px-3.5">
                            [ Bed Kosong ]
                          </td>
                        </tr>
                      );
                    }

                    const p = bedData.patient;
                    const dietInfo = getMenuDietDisplay(bedData);

                    return (
                      <tr
                        key={bedName}
                        className="bg-white dark:bg-slate-900 hover:bg-amber-50/40 dark:hover:bg-slate-850 transition-colors"
                      >
                        {/* 1. Bed Pasien */}
                        <td className="py-3 px-3.5 font-bold align-top text-amber-700 dark:text-amber-400 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs inline-block">
                            {bedName}
                          </span>
                        </td>

                        {/* 2. Nama */}
                        <td className="py-3 px-3.5 align-top">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {p.name || 'TANPA NAMA'}
                          </div>
                        </td>

                        {/* 3. Menu Diet */}
                        <td className="py-3 px-3.5 align-top">
                          {dietInfo.isNpo ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-bold text-xs inline-block">
                              PUASA / NPO
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {dietInfo.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="font-semibold text-slate-800 dark:text-slate-200"
                                >
                                  • {item}
                                </div>
                              ))}
                            </div>
                          )}
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
            Khusus Bagian Gizi / Dapur: Hanya menampilkan Bed Pasien, Nama, dan Menu Diet
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrintDietPdf}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>Cetak / Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
