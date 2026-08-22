import { AudioBankItem } from '../types';
import { P001_AUDIO_BANK } from '../data/projectStore';
import { generateSyntheticWavAudio } from './audioGenerator';

const AUDIO_STORAGE_KEY_PREFIX = 'xuong_audio_bank_v4_';

const LEGACY_P001_V01_SYNTHETIC_AUDIO =
  generateSyntheticWavAudio(18, 24000, 220);

function normalizeProjectId(projectIdOrName: string = 'P001'): string {
  const raw = String(projectIdOrName || 'P001').trim();
  const lower = raw.toLowerCase();
  if (lower === 'p001' || lower === 'sample-5' || lower.includes('mary jane')) return 'P001';
  return raw || 'P001';
}

function getStorageKey(projectIdOrName: string = 'P001'): string {
  return `${AUDIO_STORAGE_KEY_PREFIX}${normalizeProjectId(projectIdOrName)}`;
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function isAudioBankItem(value: unknown): value is AudioBankItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AudioBankItem>;
  return (
    typeof item.videoId === 'string' &&
    typeof item.isApproved === 'boolean' &&
    typeof item.duration === 'number' &&
    typeof item.targetDuration === 'number'
  );
}

function sanitizeBank(value: unknown): Record<string, AudioBankItem> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const result: Record<string, AudioBankItem> = {};

  for (const [key, candidate] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (!isAudioBankItem(candidate)) continue;

    // Legacy P001_V01 synthetic test tone: exact signature only.
    if (
      key === 'P001_V01' &&
      candidate.videoId === 'P001_V01' &&
      candidate.audioUrl === LEGACY_P001_V01_SYNTHETIC_AUDIO
    ) {
      result[key] = {
        ...candidate,
        audioUrl: null,
        duration: 0,
        targetDuration: 19,
        durationStatus: 'DURATION MISMATCH',
        voiceStatus: 'NOT_CREATED',
        voiceQc: null,
        isApproved: false,
        approvedAt: null,
        error: null,
      };
      continue;
    }

    // GENERATING restored after reload is stale.
    if (candidate.voiceStatus === 'GENERATING') {
      result[key] = {
        ...candidate,
        voiceStatus: 'RETRY_REQUIRED',
        isApproved: false,
        error:
          'Phiên tạo Voice trước đã kết thúc hoặc bị gián đoạn. Hãy thử lại thủ công.',
      };
      continue;
    }

    // blob URLs cannot survive browser reload.
    if (
      typeof candidate.audioUrl === 'string' &&
      candidate.audioUrl.startsWith('blob:')
    ) {
      result[key] = {
        ...candidate,
        audioUrl: null,
        duration: 0,
        durationStatus: 'DURATION MISMATCH',
        voiceStatus: candidate.isApproved
          ? candidate.voiceStatus
          : 'NOT_CREATED',
        voiceQc: candidate.isApproved ? candidate.voiceQc : null,
        error: candidate.isApproved
          ? candidate.error
          : 'Audio tạm thời đã hết hiệu lực sau khi tải lại.',
      };
    } else {
      result[key] = candidate;
    }
  }

  return result;
}

export function mergeAudioBanks(
  projectIdOrName: string,
  ...banks: Array<Record<string, AudioBankItem> | null | undefined>
): Record<string, AudioBankItem> {
  const projectId = normalizeProjectId(projectIdOrName);
  const base: Record<string, AudioBankItem> = projectId === 'P001' ? { ...P001_AUDIO_BANK } : {};
  const merged = banks.reduce<Record<string, AudioBankItem>>((acc, bank) => {
    if (!bank) return acc;
    return { ...acc, ...sanitizeBank(bank) };
  }, base);

  return merged;
}

export function loadStoredAudioBank(projectIdOrName: string = 'P001'): Record<string, AudioBankItem> {
  const projectId = normalizeProjectId(projectIdOrName);
  if (!hasLocalStorage()) return mergeAudioBanks(projectId);

  try {
    const raw = window.localStorage.getItem(getStorageKey(projectId));
    const parsed = raw ? JSON.parse(raw) : null;
    return mergeAudioBanks(projectId, sanitizeBank(parsed));
  } catch (err) {
    console.warn('[AudioStorage] Failed to read audio bank; using safe defaults:', err);
    return mergeAudioBanks(projectId);
  }
}

export function hydrateAudioBank(
  projectIdOrName: string,
  restoredAudioBank?: Record<string, AudioBankItem> | null
): Record<string, AudioBankItem> {
  const stored = loadStoredAudioBank(projectIdOrName);
  // Persisted storage is newer than the project snapshot, so it wins on conflicts.
  return mergeAudioBanks(projectIdOrName, restoredAudioBank || undefined, stored);
}

export function persistAudioBank(
  projectIdOrName: string = 'P001',
  audioBank: Record<string, AudioBankItem>
): void {
  if (!audioBank || typeof audioBank !== 'object' || !hasLocalStorage()) return;

  try {
    window.localStorage.setItem(getStorageKey(projectIdOrName), JSON.stringify(sanitizeBank(audioBank)));
  } catch (err) {
    // Quota/security errors must never crash the React tree.
    console.warn('[AudioStorage] Failed to persist audio bank:', err);
  }
}
