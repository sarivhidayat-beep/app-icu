# Ringkasan Asuhan Keperawatan & Operan Semua Pasien ICU

Fitur operan shift terpadu yang merangkum asuhan keperawatan seluruh pasien rawat intensif (ICU RSUD Blambangan) dalam satu tampilan terstruktur berstandar SBAR, dilengkapi opsi cetak dokumen operan shift dan salin format laporan dinas jaga perawat.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Pertanyaan klarifikasi telah dilewati (*dismissed*), sehingga rencana ini menggunakan standar operasional prosedur (SOP) operan keperawatan ICU terbaik:

- **Format Asuhan Keperawatan Utama**: Menggunakan struktur **SBAR (Situation, Background, Assessment, Recommendation)** yang merupakan standar akreditasi rumah sakit (KARS/JCI) untuk keselamatan pasien (*patient safety*) saat serah terima asuhan (*handover*).
- **Opsi Tampilan Kompak**: Disediakan tombol peralihan antara **Kartu Detail SBAR** dan **Tabel Matriks Shift Kompak** untuk kecepatan telaah saat operan keliling (*ward round*).
- **Penyaringan Pasien**: Secara *default* hanya menampilkan **bed yang terisi pasien aktif** (dengan opsi centang untuk menyertakan bed kosong).
- **Akses Menu**: Tombol ditempatkan secara ergonomis di **Sidebar** (menu utama ICU) dan tautan pendukung di **Kartu Pasien** samping tombol operan per-bed.

---

## 1. Overview & Core Concept

### What It Does
Menyediakan modul rekapitulasi operan komprehensif yang mengumpulkan seluruh rekam medis pasien di semua bed ICU pada tanggal yang dipilih:
1. **Identitas & Status**: Bed, Nama, No. RM, Usia, Jenis Kelamin, DPJP & Konsulen, Hari Perawatan (HOC), Hari Post-Op (POD).
2. **Diagnosa & Riwayat**: Diagnosa medis dan riwayat prosedur pembedahan.
3. **Alat Invasif & Monitoring**: Kateter, NGT, ETT, CVC, jalur infus beserta tanggal pasang & peringatan masa ganti.
4. **Respirasi & Nutrisi**: Mode ventilasi / oksigenasi serta rute dan target diet.
5. **Terapi Obat Shift**: Daftar obat aktif, dosis, rute, frekuensi, dan penandaan obat stop.
6. **Balance Cairan Terakhir**: Kumulatif intake enteral/parenteral, output drain/urine, dan total balance cairan.

### Target Audience / Persona
- **Perawat Penanggung Jawab Pasien (PPJP) & Kepala Ruang ICU**: Memimpin dan memvalidasi serah terima shift jaga (Pagi, Sore, Malam).
- **Dokter Jaga ICU & DPJP**: Memperoleh gambaran cepat kondisi klinis seluruh pasien ICU tanpa harus membuka kartu bed satu per satu.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Membuka Ringkasan Operan**:
   - Perawat mengklik tombol **"Operan Semua Pasien"** di Sidebar (dengan ikon `fa-clipboard-user`).
2. **Menyesuaikan Shift & Tampilan**:
   - Memilih shift dinas yang sedang berlangsung: **Pagi (07.00 - 14.00)**, **Sore (14.00 - 21.00)**, atau **Malam (21.00 - 07.00)**.
   - Beralih antara mode **Kartu Asuhan SBAR** atau **Matriks Tabular**.
3. **Cetak & Bagikan**:
   - Klik **"Cetak Lembar Operan Semua Pasien"** untuk mencetak laporan resmi format kertas A4/F4 dengan kop rumah sakit.
   - Klik **"Salin Teks Operan (WhatsApp/Telegram)"** untuk menempelkan rangkuman otomatis ke grup koordinasi dinas jaga perawat.

### Layout & Visual Hierarchy
- **Header Modal**: Teal-700 / Slate-900 dengan badge rekapitulasi pasien aktif (misal: "8 Pasien Terisi · 2 Bed Kosong").
- **Kartu SBAR Tiap Pasien**:
  - `S` (*Situation* - Aksen Biru Muda): Bed, Identitas Pasien, DPJP, Hari Perawatan.
  - `B` (*Background* - Aksen Abu-abu/Slate): Diagnosa masuk, post-op day.
  - `A` (*Assessment* - Aksen Amber/Kuning): Alat invasif, ventilator, diet, balance cairan kumulatif.
  - `R` (*Recommendation* - Aksen Emerald/Hijau): Terapi obat terjadwal pada shift tersebut & instruksi khusus.
- **Dukungan Dark Mode**: Warna latar slate-900 dengan border slate-800, kontras teks WCAG AA untuk kenyamanan mata saat shift malam di ruang intensif.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Format SBAR Terstruktur vs Teks Naratif Bebas
- *Pendekatan Terpilih*: **SBAR Otomatis Terstruktur**. Seluruh data yang sudah diinput pada aplikasi (obat, balance, alat, diagnosa) langsung dipetakan secara dinamis ke kuadran S-B-A-R tanpa mengharuskan perawat mengetik ulang.
- *Rationale*: Menghemat waktu dinas jaga perawat hingga 15-20 menit per shift dan mencegah kesalahan transkripsi data.

### Decision 2: Aksesibilitas Ekspor (Cetak & Salin Teks)
- *Pendekatan Terpilih*: Mendukung **Cetak CSS Print** serta **Salin Format Teks WA/Telegram**.
- *Rationale*: Sebagian perawat mencetak fisik di clipboard meja operan, sementara shift malam sering memanfaatkan pesan grup instan untuk serah terima ringkas.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Sidebar.tsx                           │
│  [Tombol: "Operan Semua Pasien" (Rekap Asuhan ICU)]         │
└──────────────────────────────┬──────────────────────────────┘
                               │ onClick()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 AllPatientsHandoverModal.tsx                │
│                                                             │
│  Props:                                                     │
│   - beds: string[]                                          │
│   - dayBeds: DayBedsData                                    │
│   - currentDateStr: string                                  │
│   - isDarkMode: boolean                                     │
│                                                             │
│  Features:                                                  │
│   ├── Shift Selector (Pagi / Sore / Malam / 24 Jam)         │
│   ├── Filter Toggle (Hanya Terisi / Tampilkan Semua Bed)    │
│   ├── View Mode (SBAR Detailed Cards / Matrix Table)        │
│   ├── SBAR Formatter Engine                                 │
│   ├── WhatsApp / Text Formatter Generator                   │
│   └── Print Preview Handler (Isolated Print Template)       │
└─────────────────────────────────────────────────────────────┘
```

### Komponen yang Dimodifikasi & Dibuat:
1. **`src/components/AllPatientsHandoverModal.tsx`** *(Baru)*:
   - Komponen modal utama penampil ringkasan asuhan keperawatan seluruh pasien dengan mode SBAR dan Matriks.
   - Logika ekstraksi kalkulasi balance cairan kumulatif, pemilahan obat berdasarkan jam shift, dan peringatan alat invasif.
2. **`src/components/Sidebar.tsx`**:
   - Menambahkan tombol menu "Operan Semua Pasien" di bawah navigasi ruangan bed.
3. **`src/components/PatientInfoCard.tsx`**:
   - Menambahkan opsi pintasan ke ringkasan operan semua pasien di samping tombol cetak operan individual.
4. **`src/App.tsx`**:
   - Mengintegrasikan state pembukaan modal (`isAllOperanModalOpen`) dan meneruskan `dayBeds` serta `beds`.
5. **`src/utils/printLabel.ts`** atau cetak khusus operan:
   - Menyediakan utilitas cetak terisolasi untuk operan semua pasien dengan layout multi-halaman rapi.
