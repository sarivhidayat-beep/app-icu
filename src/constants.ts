export const DEFAULT_BEDS = [
  'BED 1',
  'BED 2',
  'BED 3',
  'BED 4',
  'BED 5',
  'BED 6',
  'BED 7',
  'OBS 1',
  'OBS 2',
  'OBS 3',
  'KOHORT'
];

export const HOURS_SHIFT = [
  '07.00',
  '08.00',
  '09.00',
  '10.00',
  '11.00',
  '12.00',
  '13.00',
  '14.00',
  '15.00',
  '16.00',
  '17.00',
  '18.00',
  '19.00',
  '20.00',
  '21.00',
  '22.00',
  '23.00',
  '00.00',
  '01.00',
  '02.00',
  '03.00',
  '04.00',
  '05.00',
  '06.00'
];

export const THREE_HOUR_MARKS = [
  '09.00',
  '12.00',
  '15.00',
  '18.00',
  '21.00',
  '00.00',
  '03.00',
  '06.00'
];

export const PAGI_HOURS = [
  '07.00',
  '08.00',
  '09.00',
  '10.00',
  '11.00',
  '12.00',
  '13.00',
  '14.00'
];

export const SORE_HOURS = [
  '15.00',
  '16.00',
  '17.00',
  '18.00',
  '19.00',
  '20.00',
  '21.00'
];

export const MALAM_HOURS = [
  '22.00',
  '23.00',
  '00.00',
  '01.00',
  '02.00',
  '03.00',
  '04.00',
  '05.00',
  '06.00'
];

export const BASE_DOCTORS = [
  "dr. Halim Sp.An (Anestesi)",
  "dr. Ode Sp.An (Anestesi)",
  "dr. Ni Putu Lisa Sp.An (Anestesi)",
  "dr. Mahresya Sp.PD (Penyakit Dalam)",
  "dr. Median, Sp.PD",
  "dr. Kurnia Sp.PD",
  "dr. Indah Sp.PD (HD)",
  "dr. Nelly Sp.JP (Jantung)",
  "dr. Rika Sp.JP",
  "dr. KIA Sp.JP",
  "dr. Erwin Sp.B (Bedah)",
  "dr. Agus Sp.B",
  "dr. Arif Sp.B",
  "dr. Firman Sp.BS",
  "dr. Aji Sp.BS",
  "dr. Ananta Sp.OT",
  "dr. Hilmi Sp.OT",
  "dr. Indah Sp.N (Saraf)",
  "dr. Prita Sp.N",
  "dr. Ririk Sp.P (Paru)",
  "dr. Dian Sp.P",
  "dr. Dedy Sp.P",
  "dr. inggrit Sp.KFR",
  "dr. Umum"
];

export const MED_ROUTES = [
  "IV",
  "IM",
  "SC",
  "IC",
  "Drip",
  "Syringe Pump",
  "Per Oral",
  "Per Rectal",
  "Tetes Mata",
  "Tetes Telinga",
  "Tetes Hidung",
  "Nebul",
  "Topikal/Salep",
  "Via Epidural"
];

export function createDefaultBedData(): import('./types').BedData {
  return {
    patient: {
      name: '',
      rm: '',
      age: '',
      weight: '',
      origin: '',
      dayOfCare: '',
      postOpDay: '',
      doctor: '',
      diagnosis: '',
      ventilation: '',
      diet: '',
      fluids: '',
      invasive: '',
      notes: '',
      temp: 36.5
    },
    medications: [],
    fluidBalance: {},
    intakeParenteralCols: [
      { id: 'infus', name: 'Infus' },
      { id: 'injeksi', name: 'Injeksi' },
      { id: 'par_lain', name: 'Lain-lain' }
    ],
    intakeEnteralCols: [
      { id: 'sonde', name: 'Sonde' },
      { id: 'ent_lain', name: 'Lain-lain' }
    ],
    outputCols: [
      { id: 'urine', name: 'Urine' },
      { id: 'drain', name: 'NGT / Drain' },
      { id: 'bab', name: 'BAB/Colostomy' }
    ]
  };
}
