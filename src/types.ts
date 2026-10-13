export interface PostOpItem {
  id: string;
  date: string; // YYYY-MM-DD
  procedure: string; // Jenis operasi / tindakan
  notes?: string;
}

export interface InvasiveDeviceItem {
  id: string;
  type: string; // 'Infus' | 'NGT' | 'DC/Kateter' | 'CVC' | 'ETT' | 'Lainnya'
  customName?: string; // jika type === 'Lainnya'
  sizeNumber?: string; // nomor / ukuran
  position?: string; // posisi / lokasi pemasangan
  date: string; // YYYY-MM-DD tanggal pemasangan
  notes?: string;
}

export interface PatientInfo {
  name: string;
  rm: string;
  age: string;
  gender?: string;        // 'L' | 'P' | 'Laki-laki' | 'Perempuan'
  weight: string;
  origin?: string;
  admissionDate?: string; // Tanggal masuk pasien (YYYY-MM-DD)
  dayOfCare?: string;     // Otomatis terisi dari admissionDate (atau manual)
  postOpDay?: string;     // String legacy
  postOps?: PostOpItem[]; // Daftar operasi dengan tanggal & jenis operasi
  doctor?: string;        // String legacy
  doctors?: string[];     // Daftar dokter DPJP / Konsulen
  diagnosis?: string;
  ventilation?: string;
  diet?: string;
  fluids?: string;
  invasive?: string;      // String legacy
  invasiveDevices?: InvasiveDeviceItem[]; // Daftar alat invasif terstruktur
  notes?: string;
  temp?: number | string;
}

export interface Medication {
  name: string;
  dose: string;
  route: string;
  doctor: string;
  hours: string[];
  checkedHours: string[];
  frequency?: string;
  notes?: string;
  isStopped?: boolean;    // Penanda obat di-stop
  stoppedReason?: string;
}

export interface FluidColumn {
  id: string;
  name: string;
}

export interface PatientDietItem {
  id: string;
  name: string;
  route?: string;
  notes?: string;
  hours: string[];
  checkedHours: string[];
}

export interface ActiveInfusionItem {
  id: string;
  name: string;
  rate?: string;
  location?: string;
  notes?: string;
  hours: string[];
  checkedHours: string[];
}

export interface BedData {
  patient: PatientInfo;
  medications: Medication[];
  fluidBalance: Record<string, Record<string, string>>;
  intakeParenteralCols: FluidColumn[];
  intakeEnteralCols: FluidColumn[];
  outputCols: FluidColumn[];
  diets?: PatientDietItem[];
  infusions?: ActiveInfusionItem[];
}

export type DayBedsData = Record<string, BedData>;

export type CloudStatusType = 'connecting' | 'synced' | 'saving' | 'offline' | 'error';
