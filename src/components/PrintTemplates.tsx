import React from 'react';
import { PumpLabelData } from './PumpCalculator';

export interface SyringeLabelItem {
  patientName: string;
  patientRM: string;
  medName: string;
  medDose: string;
  medRoute: string;
  dateStr: string;
  timeStr: string;
}

interface PrintTemplatesProps {
  pumpLabelData: PumpLabelData | null;
  syringeLabels: SyringeLabelItem[] | null;
}

export const PrintTemplates: React.FC<PrintTemplatesProps> = ({
  pumpLabelData,
  syringeLabels,
}) => {
  return (
    <>
      {/* Container for Pump Label */}
      <div id="printLabelArea" className="hidden">
        {pumpLabelData && (
          <div
            style={{
              width: '6cm',
              minHeight: '8cm',
              height: 'max-content',
              border: '2px solid black',
              padding: '5px 6px',
              fontFamily: 'sans-serif',
              boxSizing: 'border-box',
              margin: 0,
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              pageBreakInside: 'avoid',
            }}
          >
            <h3
              style={{
                margin: '0 0 5px 0',
                textAlign: 'center',
                fontSize: '11pt',
                borderBottom: '2px solid black',
                paddingBottom: '3px',
                fontWeight: 'bold',
              }}
            >
              LABEL PUMP ICU
            </h3>
            <div
              style={{
                fontSize: '8.5pt',
                lineHeight: 1.3,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
              }}
            >
              <div>
                <strong>Pasien:</strong> {pumpLabelData.patientName} (
                {pumpLabelData.bed})
                <br />
                <strong>BB Kalkulasi:</strong>{' '}
                <span style={{ fontWeight: 'bold', color: '#111' }}>
                  {pumpLabelData.weightDisplay}
                </span>
                <br />
                <strong>Obat:</strong>{' '}
                <span style={{ fontSize: '9.5pt', fontWeight: 'bold' }}>
                  {pumpLabelData.drugName.toUpperCase()}
                </span>
                <br />
                <strong>Sediaan:</strong> {pumpLabelData.drugAmount}{' '}
                {pumpLabelData.drugUnitName} / {pumpLabelData.volume} cc
                <br />
                <strong>Dosis Awal:</strong> {pumpLabelData.dose}{' '}
                {pumpLabelData.doseUnitName} {pumpLabelData.timeName}
              </div>

              <div
                style={{
                  marginTop: '5px',
                  padding: '3px',
                  border: '1px solid black',
                  textAlign: 'center',
                  fontSize: '10pt',
                  background: '#f8fafc',
                }}
              >
                <strong>
                  RATE AWAL:{' '}
                  <span style={{ fontSize: '11pt' }}>
                    {pumpLabelData.rate} cc/jam
                  </span>
                </strong>
              </div>

              {pumpLabelData.titrationRows.length > 0 && (
                <div style={{ marginTop: '4px', fontSize: '7.5pt' }}>
                  <strong>
                    Tabel Titrasi ({pumpLabelData.doseUnitName}{' '}
                    {pumpLabelData.timeName}):
                  </strong>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginTop: '3px',
                      fontSize: '7.5pt',
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th
                          style={{
                            border: '1px solid #64748b',
                            padding: '2px 4px',
                            textAlign: 'center',
                          }}
                        >
                          Dosis
                        </th>
                        <th
                          style={{
                            border: '1px solid #64748b',
                            padding: '2px 4px',
                            textAlign: 'center',
                          }}
                        >
                          Rate (cc/jam)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pumpLabelData.titrationRows.map((tr, idx) => (
                        <tr key={idx}>
                          <td
                            style={{
                              border: '1px solid #64748b',
                              padding: '1px 4px',
                              textAlign: 'center',
                            }}
                          >
                            {tr.dose}
                          </td>
                          <td
                            style={{
                              border: '1px solid #64748b',
                              padding: '1px 4px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            {tr.rate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '7.5pt',
                  color: '#333',
                  paddingTop: '5px',
                  borderTop: '1px dashed #ccc',
                }}
              >
                <span>
                  Tgl:{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}{' '}
                  {new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>Sign: _________</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Container for Syringe Label (Supports Single or Batch Printing) */}
      <div id="printSyringeArea" className="hidden">
        {syringeLabels &&
          syringeLabels.map((lbl, idx) => (
            <div
              key={idx}
              style={{
                width: '53mm',
                height: '18mm',
                padding: '1mm 2mm',
                fontFamily: 'sans-serif',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'white',
                color: 'black',
                overflow: 'hidden',
                margin: 0,
                pageBreakAfter: idx < syringeLabels.length - 1 ? 'always' : 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '6.5pt',
                  fontWeight: 'bold',
                  borderBottom: '1px solid black',
                  paddingBottom: '1px',
                  marginBottom: '1px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '65%',
                  }}
                >
                  {lbl.patientName.toUpperCase()}
                </span>
                <span>RM: {lbl.patientRM}</span>
              </div>
              <div
                style={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  lineHeight: 1.1,
                }}
              >
                <span
                  style={{
                    fontSize: '8.5pt',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  {lbl.medName}
                </span>
                <span
                  style={{
                    fontSize: '6.5pt',
                    fontWeight: 'bold',
                    marginTop: '1px',
                  }}
                >
                  {lbl.medDose} ({lbl.medRoute})
                </span>
              </div>
              <div
                style={{
                  fontSize: '5.5pt',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px dashed black',
                  paddingTop: '1px',
                  marginTop: '1px',
                }}
              >
                <span>
                  Tgl: {lbl.dateStr} Jam: {lbl.timeStr}
                </span>
                <span>Sign: _______</span>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};
