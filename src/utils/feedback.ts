// Utility untuk Audio & Haptic Feedback pada Checklist Pasien ICU RSUD Blambangan

export interface FeedbackSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

const STORAGE_KEY = 'icu_sound_haptic_settings';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Memainkan suara audio sintetis bernada klinis & menyenangkan menggunakan Web Audio API
 */
export function playCheckSound(type: 'check' | 'uncheck' = 'check') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    if (type === 'check') {
      // Nada lembut ganda (pleasant modern high tick: D5 ~587Hz naik cepat ke A5 ~880Hz)
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      // Nada lembut batal centang (subtle soft drop: 520Hz turun ke 330Hz)
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    }
  } catch {
    // Abaikan jika browser membatasi autoplay sebelum interaksi
  }
}

/**
 * Memicu getaran haptik (Haptic Vibration) pada perangkat sentuh / smartphone / tablet
 */
export function triggerHaptic(type: 'check' | 'uncheck' = 'check') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'check') {
        navigator.vibrate(20); // 20ms responsif
      } else {
        navigator.vibrate(12); // 12ms lembut
      }
    } catch {
      // Abaikan jika perangkat tidak mendukung vibration API
    }
  }
}

/**
 * Ambil konfigurasi suara & haptik yang tersimpan di localStorage
 */
export function getSavedFeedbackSettings(): FeedbackSettings {
  if (typeof window === 'undefined') {
    return { soundEnabled: true, hapticEnabled: true };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        soundEnabled: parsed.soundEnabled ?? true,
        hapticEnabled: parsed.hapticEnabled ?? true,
      };
    }
  } catch {
    // Fallback default
  }
  return { soundEnabled: true, hapticEnabled: true };
}

/**
 * Simpan konfigurasi suara & haptik ke localStorage
 */
export function saveFeedbackSettings(settings: FeedbackSettings) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Abaikan jika private browsing storage error
    }
  }
}

/**
 * Memicu umpan balik suara dan getaran sesuai preferensi yang aktif
 */
export function triggerFeedback(
  type: 'check' | 'uncheck' = 'check',
  settings?: FeedbackSettings
) {
  const current = settings || getSavedFeedbackSettings();
  if (current.soundEnabled) {
    playCheckSound(type);
  }
  if (current.hapticEnabled) {
    triggerHaptic(type);
  }
}
