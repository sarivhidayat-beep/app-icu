export interface PatientInfo {
  name: string;
  rm: string;
  age: string;
  weight: string;
  origin: string;
  dayOfCare: string;
  postOpDay: string;
  doctor: string;
  diagnosis: string;
  ventilation: string;
  diet: string;
  fluids: string;
  invasive: string;
  notes: string;
  temp: number | string;
}

export interface Medication {
  name: string;
  dose: string;
  route: string;
  doctor: string;
  hours: string[];
  checkedHours: string[];
}

export interface FluidColumn {
  id: string;
  name: string;
}

export interface BedData {
  patient: PatientInfo;
  medications: Medication[];
  fluidBalance: Record<string, Record<string, string>>;
  intakeParenteralCols: FluidColumn[];
  intakeEnteralCols: FluidColumn[];
  outputCols: FluidColumn[];
}

export type DayBedsData = Record<string, BedData>;

export type CloudStatusType = 'connecting' | 'synced' | 'saving' | 'offline' | 'error';
