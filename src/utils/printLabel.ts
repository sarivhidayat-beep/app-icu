import { PumpLabelData } from '../components/PumpCalculator';

export interface SyringeLabelPrintData {
  patientName: string;
  patientRM: string;
  bedName?: string;
  medName: string;
  medDose: string;
  medRoute: string;
  dateStr: string;
  timeStr: string;
  frequency?: string;
  notes?: string;
}

/**
 * Mencetak label spuit secara terisolasi menggunakan iframe tersembunyi.
 * Cara ini menjamin 100% bahwa lembar operan TIDAK AKAN PERNAH ikut tercetak
 * karena dokumen yang dicetak benar-benar HANYA berisi etiket spuit.
 */
export function printSyringeLabelsIsolated(labels: SyringeLabelPrintData[]) {
  if (!labels || labels.length === 0) return;

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

  const cardsHtml = labels
    .map(
      (lbl) => `
    <div class="syringe-label-card">
      <div class="label-header">
        <span class="patient-name">${lbl.patientName.toUpperCase()}${lbl.bedName ? ` [${lbl.bedName}]` : ''}</span>
        <span class="patient-rm">RM: ${lbl.patientRM}</span>
      </div>
      <div class="label-body">
        <div class="med-name">${lbl.medName}</div>
        <div class="med-dose">${lbl.medDose} (${lbl.medRoute})${lbl.frequency ? ` • ${lbl.frequency}` : ''}</div>
      </div>
      <div class="label-footer">
        <span>Tgl: ${lbl.dateStr} Jam: ${lbl.timeStr}</span>
        <span>Sign: _______</span>
      </div>
    </div>
  `
    )
    .join('');

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cetak Label Spuit Injeksi</title>
  <style>
    @page {
      size: 55mm 20mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: black !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: white;
      width: 55mm;
    }
    .syringe-label-card {
      width: 53mm;
      height: 18mm;
      max-height: 18mm;
      padding: 1mm 2mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: white;
      color: black;
      overflow: hidden;
      margin: 0 auto;
      page-break-after: always;
      break-after: page;
    }
    .syringe-label-card:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .label-header {
      font-size: 6.5pt;
      font-weight: bold;
      border-bottom: 1px solid black;
      padding-bottom: 1px;
      margin-bottom: 1px;
      display: flex;
      justify-content: space-between;
    }
    .patient-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 65%;
      font-weight: bold;
    }
    .patient-rm {
      font-weight: bold;
    }
    .label-body {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      line-height: 1.1;
    }
    .med-name {
      font-size: 8.5pt;
      font-weight: 900;
      text-transform: uppercase;
    }
    .med-dose {
      font-size: 6.5pt;
      font-weight: bold;
      margin-top: 1px;
    }
    .label-footer {
      font-size: 5.5pt;
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed black;
      padding-top: 1px;
      margin-top: 1px;
    }
  </style>
</head>
<body>
  ${cardsHtml}
</body>
</html>`;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Gagal mencetak lewat iframe:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 200);
}

/**
 * Mencetak label pump secara terisolasi menggunakan iframe tersembunyi.
 */
export function printPumpLabelIsolated(labelData: PumpLabelData) {
  if (!labelData) return;

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

  const titrationRowsHtml = labelData.titrationRows
    .map(
      (tr) => `
    <tr>
      <td style="border: 1px solid #64748b; padding: 1px 4px; text-align: center; color: black;">${tr.dose}</td>
      <td style="border: 1px solid #64748b; padding: 1px 4px; text-align: center; font-weight: bold; color: black;">${tr.rate}</td>
    </tr>
  `
    )
    .join('');

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Cetak Label Pump ICU</title>
  <style>
    @page {
      margin: 5mm;
      size: auto;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: black !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: white;
      padding: 0;
      margin: 0;
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
    }
    .pump-card {
      width: 6cm;
      min-height: 8cm;
      height: max-content;
      border: 2px solid black;
      padding: 5px 6px;
      box-sizing: border-box;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      background: white;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="pump-card">
    <h3 style="margin: 0 0 5px 0; text-align: center; fontSize: 11pt; border-bottom: 2px solid black; padding-bottom: 3px; font-weight: bold;">
      LABEL PUMP ICU
    </h3>
    <div style="font-size: 8.5pt; line-height: 1.3; display: flex; flex-direction: column; flex-grow: 1;">
      <div>
        <strong>Pasien:</strong> ${labelData.patientName} (${labelData.bed})<br />
        <strong>BB Kalkulasi:</strong> <strong>${labelData.weightDisplay}</strong><br />
        <strong>Obat:</strong> <span style="font-size: 9.5pt; font-weight: bold;">${labelData.drugName.toUpperCase()}</span><br />
        <strong>Sediaan:</strong> ${labelData.drugAmount} ${labelData.drugUnitName} / ${labelData.volume} cc<br />
        <strong>Dosis Awal:</strong> ${labelData.dose} ${labelData.doseUnitName} ${labelData.timeName}
      </div>

      <div style="margin-top: 5px; padding: 3px; border: 1px solid black; text-align: center; font-size: 10pt; background: #f8fafc;">
        <strong>RATE AWAL: <span style="font-size: 11pt;">${labelData.rate} cc/jam</span></strong>
      </div>

      ${
        labelData.titrationRows.length > 0
          ? `
        <div style="margin-top: 4px; font-size: 7.5pt;">
          <strong>Tabel Titrasi (${labelData.doseUnitName} ${labelData.timeName}):</strong>
          <table style="width: 100%; border-collapse: collapse; margin-top: 3px; font-size: 7.5pt;">
            <thead>
              <tr style="background-color: #f1f5f9;">
                <th style="border: 1px solid #64748b; padding: 2px 4px; text-align: center;">Dosis</th>
                <th style="border: 1px solid #64748b; padding: 2px 4px; text-align: center;">Rate (cc/jam)</th>
              </tr>
            </thead>
            <tbody>
              ${titrationRowsHtml}
            </tbody>
          </table>
        </div>
      `
          : ''
      }

      <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 7.5pt; padding-top: 5px; border-top: 1px dashed #ccc;">
        <span>Tgl: ${dateStr} Jam: ${timeStr}</span>
        <span>Sign: _________</span>
      </div>
    </div>
  </div>
</body>
</html>`;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Gagal mencetak pump lewat iframe:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 200);
}
