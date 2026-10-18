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

// Siklus 24 jam dimulai dari jam 08.00 (Khusus Diet & Infus)
export const HOURS_START_08 = [
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
  '06.00',
  '07.00'
];

/**
 * Mengurutkan jam agar penempatan selalu dimulai dari jam 08.00 hingga 07.00 berikutnya.
 */
export function sortHoursFrom08(hours: string[]): string[] {
  const getMinutesFrom08 = (h: string): number => {
    let clean = h.trim().replace(':', '.');
    if (!clean.includes('.')) clean += '.00';
    const parts = clean.split('.');
    const hr = parseInt(parts[0], 10) || 0;
    const min = parseInt(parts[1], 10) || 0;
    const totalMinFromMidnight = hr * 60 + min;
    // Jam 08.00 = menit 0, jam 09.00 = menit 60 ... jam 07.59 = menit 1439
    return (totalMinFromMidnight - (8 * 60) + 1440) % 1440;
  };

  return [...hours].sort((a, b) => getMinutesFrom08(a) - getMinutesFrom08(b));
}

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

/**
 * Menentukan shift untuk jam apa pun (fleksibel: standar maupun menit kustom, cth: 08.00, 08.30, 14.15).
 * - Pagi: 07.00 s/d 14.59
 * - Sore: 15.00 s/d 21.59
 * - Malam: 22.00 s/d 06.59
 */
export function getHourShift(h: string): 'pagi' | 'sore' | 'malam' {
  if (!h) return 'pagi';
  const clean = h.trim().replace(':', '.');
  const parts = clean.split('.');
  const hr = parseInt(parts[0], 10);
  if (isNaN(hr)) return 'pagi';
  if (hr >= 7 && hr <= 14) return 'pagi';
  if (hr >= 15 && hr <= 21) return 'sore';
  return 'malam';
}

/**
 * Normalisasi format jam fleksibel (misal '8' -> '08.00', '8.30' / '08:30' -> '08.30')
 */
export function formatFlexibleHour(input: string): string {
  let val = input.trim().replace(':', '.');
  if (!val) return '';
  const parts = val.split('.');
  let hr = parseInt(parts[0], 10);
  let min = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (isNaN(hr)) return val;
  if (isNaN(min)) min = 0;
  if (hr > 24) hr = hr % 24;
  if (min > 59) min = 59;
  const hrStr = String(hr).padStart(2, '0');
  const minStr = String(min).padStart(2, '0');
  return `${hrStr}.${minStr}`;
}

/**
 * Mengurutkan jam fleksibel berdasarkan jam mulai siklus (default 07.00 untuk shift operan ICU)
 */
export function sortFlexibleHours(hours: string[], startHour = 7): string[] {
  const getMinutesFromStart = (h: string): number => {
    let clean = h.trim().replace(':', '.');
    if (!clean.includes('.')) clean += '.00';
    const parts = clean.split('.');
    let hr = parseInt(parts[0], 10) || 0;
    const min = parseInt(parts[1], 10) || 0;
    if (hr === 24) hr = 0;
    const totalMinFromMidnight = hr * 60 + min;
    return (totalMinFromMidnight - (startHour * 60) + 1440) % 1440;
  };

  return [...hours].sort((a, b) => getMinutesFromStart(a) - getMinutesFromStart(b));
}

export const COMMON_FREQUENCIES = [
  '1x1 (1x sehari)',
  '2x1 (Tiap 12 jam)',
  '3x1 (Tiap 8 jam)',
  '4x1 (Tiap 6 jam)',
  'Tiap 24 Jam',
  'Tiap 12 Jam',
  'Tiap 8 Jam',
  'Tiap 6 Jam',
  'Tiap 4 Jam',
  'k/p (bila perlu / prn)',
  'Sekali (Stat / Extra)'
];

export const FREQUENCY_SUGGESTED_HOURS: Record<string, string[]> = {
  '1x1': ['08.00'],
  '1x1 (1x sehari)': ['08.00'],
  '1x sehari': ['08.00'],
  'Tiap 24 Jam': ['08.00'],
  '2x1': ['08.00', '20.00'],
  '2x1 (Tiap 12 jam)': ['08.00', '20.00'],
  'Tiap 12 Jam': ['08.00', '20.00'],
  '3x1': ['08.00', '16.00', '24.00'],
  '3x1 (Tiap 8 jam)': ['08.00', '16.00', '24.00'],
  'Tiap 8 Jam': ['08.00', '16.00', '24.00'],
  '4x1': ['06.00', '12.00', '18.00', '24.00'],
  '4x1 (Tiap 6 jam)': ['06.00', '12.00', '18.00', '24.00'],
  'Tiap 6 Jam': ['06.00', '12.00', '18.00', '24.00'],
  'Tiap 4 Jam': ['08.00', '12.00', '16.00', '20.00', '24.00', '04.00']
};

export const COMMON_MED_NOTES = [
  'Skin test dulu',
  'Drip dalam 100 cc PZ habis 1 jam',
  'Bolus pelan 3-5 menit',
  'Encerkan dengan Aquabidest',
  'Stop jika TD < 90/60',
  'Berikan sesudah makan',
  'Bilas NaCl setelah injeksi',
  'Periksa GDS sebelum pemberian'
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
  "dr. Aji, Sp.BS",
  "dr. Ananta, Sp.OT",
  "dr. Hasmi, Sp.OT",
  "dr. Indah Sp.N (Saraf)",
  "dr. Prita Sp.N",
  "dr. Ririk Sp.P (Paru)",
  "dr. Dian Sp.P",
  "dr. Dedy Sp.P",
  "dr. inggrit Sp.KFR",
  "dr. Wulan Sp.KK",
  "dr. Bagus Sp.BTKV",
  "dr. Unu Sp.M",
  "dr. Joko Sp.M",
  "dr. Erva Sp.OG",
  "dr. Haris Sp.OG",
  "dr. Nasir Sp.OG",
  "dr. Surya Sp.U",
  "dr. Asdi Sp.ONK",
  "dr. Irvan Sp.A",
  "dr. Sri Sp.A",
  "dr. Widhi Sp.A",
  "dr. Umum"
];

export const MED_ROUTES = [
  "IV",
  "IM",
  "SC",
  "IC",
  "Drip",
  "Transfusi",
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

/**
 * Menghitung hari rawat otomatis berdasarkan tanggal masuk pasien dan tanggal target.
 * Jika masuk hari ini, maka hari rawat = 1 (Hari ke-1).
 */
export function calculateDayOfCare(admissionDateStr?: string, targetDateStr?: string): string {
  if (!admissionDateStr) return '';
  const adm = new Date(admissionDateStr);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();
  if (isNaN(adm.getTime()) || isNaN(target.getTime())) return '';

  const admUtc = Date.UTC(adm.getFullYear(), adm.getMonth(), adm.getDate());
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetUtc - admUtc) / (1000 * 60 * 60 * 24));

  if (diffDays >= 0) {
    return String(diffDays + 1);
  } else {
    return `Rencana (H${diffDays})`;
  }
}

/**
 * Menghitung hari post-op otomatis berdasarkan tanggal operasi dan tanggal target.
 * Hari operasi = H-0, besoknya = H+1, dst.
 */
export function calculatePostOpInfo(opDateStr?: string, targetDateStr?: string): { code: string; label: string; days: number } | null {
  if (!opDateStr) return null;
  const op = new Date(opDateStr);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();
  if (isNaN(op.getTime()) || isNaN(target.getTime())) return null;

  const opUtc = Date.UTC(op.getFullYear(), op.getMonth(), op.getDate());
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((targetUtc - opUtc) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { code: 'H-0', label: 'Hari Operasi', days: 0 };
  } else if (diffDays > 0) {
    return { code: `H+${diffDays}`, label: `Post Op Hari ke-${diffDays}`, days: diffDays };
  } else {
    return { code: `H${diffDays}`, label: `Pre Op (H${diffDays})`, days: diffDays };
  }
}

/**
 * Format tanggal YYYY-MM-DD ke format Indonesia DD/MM/YYYY
 */
export function formatDateID(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
}

export const DEFAULT_INVASIVE_TYPES = [
  'Infus',
  'NGT',
  'DC/Kateter',
  'CVC',
  'ETT',
  'Lainnya'
];

/**
 * Aturan masa pakai alat invasif:
 * - Infus: batas 3 hari (bila > 3 hari -> Waktunya Ganti)
 * - NGT: batas 10 hari (bila > 10 hari -> Waktunya Ganti)
 * - DC / Kateter: batas 14 hari (bila > 14 hari -> Waktunya Ganti)
 */
export function checkInvasiveReplacement(
  device: import('./types').InvasiveDeviceItem,
  targetDateStr?: string
): {
  needsReplacement: boolean;
  daysInstalled: number;
  maxDays: number | null;
  message: string;
} {
  if (!device.date) {
    return { needsReplacement: false, daysInstalled: 0, maxDays: null, message: '' };
  }

  const d = new Date(device.date);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();
  if (isNaN(d.getTime()) || isNaN(target.getTime())) {
    return { needsReplacement: false, daysInstalled: 0, maxDays: null, message: '' };
  }

  const dUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const days = Math.round((targetUtc - dUtc) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { needsReplacement: false, daysInstalled: 0, maxDays: null, message: 'Tanggal di masa depan' };
  }

  const typeLower = (device.type || '').toLowerCase();
  let maxDays: number | null = null;

  if (typeLower.includes('infus')) {
    maxDays = 3;
  } else if (typeLower.includes('ngt')) {
    maxDays = 10;
  } else if (typeLower.includes('dc') || typeLower.includes('kateter') || typeLower.includes('catheter')) {
    maxDays = 14;
  }

  if (maxDays !== null && days > maxDays) {
    return {
      needsReplacement: true,
      daysInstalled: days,
      maxDays,
      message: `Waktunya Ganti! (${days} hari, maks ${maxDays} hari)`
    };
  }

  return {
    needsReplacement: false,
    daysInstalled: days,
    maxDays,
    message: maxDays ? `Hari ke-${days} (Maks ${maxDays} hr)` : `Hari ke-${days}`
  };
}

export function createDefaultBedData(): import('./types').BedData {
  return {
    patient: {
      name: '',
      rm: '',
      age: '',
      gender: 'L',
      weight: '',
      origin: '',
      admissionDate: '',
      dayOfCare: '',
      postOpDay: '',
      postOps: [],
      doctor: '',
      doctors: [],
      diagnosis: '',
      ventilation: '',
      diet: '',
      fluids: '',
      invasive: '',
      invasiveDevices: [],
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
    ],
    diets: [],
    infusions: []
  };
}
