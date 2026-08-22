import { useState, useRef, useEffect, FC, ChangeEvent, DragEvent } from 'react';
import {
  ProductionSheetData,
  VideoVariation,
  VoiceEngineType,
  VoiceProfile,
  VoiceGender,
  VoiceStyle,
  VoiceSpeed,
  AudioBankItem,
  VoiceQueueItem,
} from '../types';
import {
  generateVoiceWithGemini,
  previewVoiceProfileSample,
  measureAudioDuration,
  evaluateManualAudioQc,
  getSalesAngleVoiceDirection,
} from '../services/voiceService';
import { hydrateAudioBank, persistAudioBank } from '../utils/audioStorage';
import { CopyButton } from './CopyButton';
import {
  Mic,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Check,
  Sparkles,
  Layers,
  Radio,
  FileAudio,
  Upload,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  Sliders,
  FolderArchive,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  FastForward,
  Rewind,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface VoiceFactorySectionProps {
  sheetData: ProductionSheetData;
  variations: VideoVariation[];
  restoredAudioBank?: Record<string, AudioBankItem> | null;
  projectId?: string | null;
  onToggleApproveScript?: (id: string) => void;
}

export const VoiceFactorySection: FC<VoiceFactorySectionProps> = ({
  sheetData,
  variations,
  restoredAudioBank,
  projectId,
  onToggleApproveScript,
}) => {
  // Voice Engine State
  const [engine, setEngine] = useState<VoiceEngineType>('GEMINI_TTS');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash-preview-tts');

  // Voice Profile State (Default: Nữ, Tự nhiên, Vừa)
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({
    gender: 'female',
    style: 'natural',
    speed: 'medium',
    geminiVoiceName: 'Kore',
  });

  // Sample Preview State
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Bank Map (Key: videoId, e.g. "P001_V01").
  // IMPORTANT: use a stable Project ID, never the editable product name, as the storage key.
  const projectStorageId = projectId || 'P001';
  const [audioBank, setAudioBank] = useState<Record<string, AudioBankItem>>(() =>
    hydrateAudioBank(projectStorageId, restoredAudioBank)
  );

  // Persist changes for the current mounted project only. App.tsx remounts this component when project ID changes,
  // preventing an old project's state from being written under a new project's storage key.
  useEffect(() => {
    if (Object.keys(audioBank).length > 0) {
      persistAudioBank(projectStorageId, audioBank);
    }
  }, [audioBank, projectStorageId]);

  // Batch Generation State (Fail-Fast + Cooldown + Resume)
  const VOICE_RATE_LIMIT_COOLDOWN_SEC = 60;
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchRateLimitPaused, setBatchRateLimitPaused] = useState<boolean>(false);
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState<number>(0);
  const [cooldownPausedVideoId, setCooldownPausedVideoId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Record<string, VoiceQueueItem>>({});
  const [batchMessage, setBatchMessage] = useState<string>('');

  // Cooldown countdown timer effect (runs locally without firing API requests)
  useEffect(() => {
    if (cooldownRemainingSec <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemainingSec]);

  // Audio Playback State for each variation
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [playbackTimeMap, setPlaybackTimeMap] = useState<Record<string, number>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Expanded details map for Voice QC inspection
  const [expandedQcMap, setExpandedQcMap] = useState<Record<string, boolean>>({});

  // Manual Upload Drag State
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // IMMUTABLE ASSET CONFIRMATION MODALS
  const [unlockConfirmItem, setUnlockConfirmItem] = useState<{
    variation: VideoVariation;
    customSpeed?: VoiceSpeed;
  } | null>(null);

  const [vbeeConfirmUpload, setVbeeConfirmUpload] = useState<{
    videoId: string;
    variation: VideoVariation;
    file: File;
  } | null>(null);

  // Computed counts and lists
  const approvedScripts = variations.filter((v) => v.isApproved);
  const approvedScriptsCount = approvedScripts.length;

  // 1. VOICE APPROVED: Locked Immutable Approved Assets (Script Approved + Voice Approved)
  const lockedApprovedScripts = variations.filter(
    (v) => v.isApproved && audioBank[v.id]?.isApproved
  );
  const lockedApprovedCount = lockedApprovedScripts.length;

  // 2. Compute Duration QC audit strictly based on actual audio duration vs target duration
  // Single Source of Truth: delta = Math.abs(actualAudioDuration - targetTimeline)
  // PASS iff delta <= 1.0, MISMATCH iff delta > 1.0
  const durationAuditList = variations.map((v) => {
    const audioItem = audioBank[v.id];
    const targetDurationSec = parseTargetDuration(v.estimatedDuration);
    const hasAudio = !!(
      audioItem &&
      (audioItem.voiceStatus === 'READY' || audioItem.isApproved) &&
      typeof audioItem.duration === 'number' &&
      audioItem.duration > 0 &&
      !!audioItem.audioUrl
    );
    const actualDurationSec = hasAudio ? audioItem.duration : null;
    const deltaSec =
      actualDurationSec !== null
        ? Math.round(Math.abs(actualDurationSec - targetDurationSec) * 10) / 10
        : null;
    const isPass = deltaSec !== null && deltaSec <= 1.0;
    const isMismatch = deltaSec !== null && deltaSec > 1.0;
    const status: 'DURATION PASS' | 'DURATION MISMATCH' | 'NO_AUDIO' = !hasAudio
      ? 'NO_AUDIO'
      : isPass
      ? 'DURATION PASS'
      : 'DURATION MISMATCH';

    return {
      videoId: v.id,
      targetDurationSec,
      actualDurationSec,
      deltaSec,
      isPass,
      isMismatch,
      status,
      hasAudio,
      audioItem,
    };
  });

  const totalAudiosWithAudioCount = durationAuditList.filter((item) => item.hasAudio).length;
  const durationPassCount = durationAuditList.filter((item) => item.isPass).length;
  const durationMismatchCount = durationAuditList.filter((item) => item.isMismatch).length;

  // Eligible for batch generation (Script Approved + NOT Voice Approved)
  const eligibleBatchScripts = variations.filter(
    (v) => v.isApproved && !audioBank[v.id]?.isApproved
  );
  const eligibleBatchCount = eligibleBatchScripts.length;

  // 2. VOICE READY: Unapproved but already READY (generated successfully in batch or single)
  const voiceReadyUnapprovedScripts = variations.filter(
    (v) => v.isApproved && !audioBank[v.id]?.isApproved && audioBank[v.id]?.voiceStatus === 'READY'
  );
  const voiceReadyUnapprovedCount = voiceReadyUnapprovedScripts.length;

  // 3. RATE LIMIT WAIT: Videos stopped due to 429 Rate Limit
  const rateLimitWaitScripts = variations.filter(
    (v) =>
      v.isApproved &&
      !audioBank[v.id]?.isApproved &&
      (audioBank[v.id]?.voiceStatus === 'RATE_LIMIT_WAIT' ||
        queue[v.id]?.status === 'RATE_LIMIT_WAIT')
  );
  const rateLimitWaitCount = rateLimitWaitScripts.length;

  // 4. CHƯA TẠO: Videos not generated yet or in fresh queue
  const notCreatedScripts = variations.filter(
    (v) =>
      v.isApproved &&
      !audioBank[v.id]?.isApproved &&
      (!audioBank[v.id] ||
        audioBank[v.id]?.voiceStatus === 'NOT_CREATED' ||
        audioBank[v.id]?.voiceStatus === 'QUEUED')
  );
  const notCreatedCount = notCreatedScripts.length;

  // In Progress / Generating
  const generatingScripts = variations.filter(
    (v) =>
      v.isApproved &&
      !audioBank[v.id]?.isApproved &&
      (audioBank[v.id]?.voiceStatus === 'GENERATING' || queue[v.id]?.status === 'GENERATING')
  );
  const generatingCount = generatingScripts.length;
  const inProgressOrWaitingCount = rateLimitWaitCount + generatingCount;

  // Remaining unready videos to generate (NOT Voice Approved and NOT Ready)
  const remainingUnreadyScripts = variations.filter(
    (v) => v.isApproved && !audioBank[v.id]?.isApproved && audioBank[v.id]?.voiceStatus !== 'READY'
  );
  const remainingUnreadyCount = remainingUnreadyScripts.length;

  const audioBankList = Object.values(audioBank) as AudioBankItem[];
  const readyAudiosCount = audioBankList.filter((a) => a.voiceStatus === 'READY').length;
  const approvedAudiosCount = audioBankList.filter((a) => a.isApproved).length;

  // Cleanup audio objects on unmount
  useEffect(() => {
    return () => {
      (Object.values(audioElementsRef.current) as HTMLAudioElement[]).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.src = '';
      }
    };
  }, []);

  // Update Voice Profile Gemini Voice Name when gender/style change
  const handleGenderChange = (gender: VoiceGender) => {
    let name = 'Kore';
    if (gender === 'male') {
      name = voiceProfile.style === 'energetic' ? 'Fenrir' : voiceProfile.style === 'trustworthy' ? 'Charon' : 'Puck';
    } else {
      name = voiceProfile.style === 'gentle' ? 'Aoede' : voiceProfile.style === 'youthful' ? 'Zephyr' : 'Kore';
    }
    setVoiceProfile((prev) => ({ ...prev, gender, geminiVoiceName: name }));
  };

  const handleStyleChange = (style: VoiceStyle) => {
    let name = voiceProfile.geminiVoiceName;
    if (voiceProfile.gender === 'male') {
      name = style === 'energetic' ? 'Fenrir' : style === 'trustworthy' ? 'Charon' : 'Puck';
    } else {
      name = style === 'gentle' ? 'Aoede' : style === 'youthful' ? 'Zephyr' : 'Kore';
    }
    setVoiceProfile((prev) => ({ ...prev, style, geminiVoiceName: name }));
  };

  const handleSpeedChange = (speed: VoiceSpeed) => {
    setVoiceProfile((prev) => ({ ...prev, speed }));
  };

  // Preview Voice Profile
  const handlePreviewVoice = async () => {
    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
      return;
    }

    setIsPreviewLoading(true);
    try {
      const audioUrl = await previewVoiceProfileSample(voiceProfile, geminiModel);
      setPreviewAudioUrl(audioUrl);

      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      previewAudioRef.current.src = audioUrl;
      previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      previewAudioRef.current.onerror = () => setIsPlayingPreview(false);

      await previewAudioRef.current.play();
      setIsPlayingPreview(true);
    } catch (err: any) {
      console.error('Error previewing voice:', err);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Extract target duration from variation estimatedDuration or timeline
  const parseTargetDuration = (estimatedDurationStr?: string): number => {
    if (!estimatedDurationStr) return 18;
    const match = estimatedDurationStr.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 18;
  };

  // Toggle Audio Playback for a specific Video Variation
  const handleTogglePlayAudio = (videoId: string, audioUrl: string) => {
    if (activePlayingId === videoId) {
      const audio = audioElementsRef.current[videoId];
      if (audio) {
        audio.pause();
      }
      setActivePlayingId(null);
      return;
    }

    // Stop currently active audio if another is playing
    if (activePlayingId && audioElementsRef.current[activePlayingId]) {
      audioElementsRef.current[activePlayingId].pause();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }

    let audio = audioElementsRef.current[videoId];
    if (!audio) {
      audio = new Audio(audioUrl);
      audioElementsRef.current[videoId] = audio;
    } else if (audio.src !== audioUrl) {
      audio.src = audioUrl;
    }

    audio.ontimeupdate = () => {
      setPlaybackTimeMap((prev) => ({ ...prev, [videoId]: audio.currentTime }));
    };

    audio.onended = () => {
      setActivePlayingId(null);
      setPlaybackTimeMap((prev) => ({ ...prev, [videoId]: 0 }));
    };

    audio.onerror = () => {
      setActivePlayingId(null);
    };

    audio.play().then(() => {
      setActivePlayingId(videoId);
    }).catch((e) => console.error('Play failed:', e));
  };

  // User requests single voice creation (or recreation)
  const handleRequestGenerateSingleVoice = (
    variation: VideoVariation,
    customSpeed?: VoiceSpeed
  ) => {
    const videoId = variation.id;
    const currentAudio = audioBank[videoId];

    // IMMUTABLE ASSET CHECK: If already VOICE APPROVED, prompt explicit confirmation modal!
    if (currentAudio?.isApproved) {
      setUnlockConfirmItem({ variation, customSpeed });
      return;
    }

    // Otherwise directly execute
    executeGenerateSingleVoice(variation, customSpeed);
  };

  // Actual execution of single voice generation (when confirmed or unapproved)
  const executeGenerateSingleVoice = async (
    variation: VideoVariation,
    customSpeed?: VoiceSpeed,
    allowApprovedOverwrite: boolean = false
  ) => {
    const videoId = variation.id;

    // Cooldown Guard: prevent calls during active cooldown
    if (cooldownRemainingSec > 0) return;

    // Immutable Guard: prevent modifying approved assets
    if (audioBank[videoId]?.isApproved && !allowApprovedOverwrite) return;

    const targetDurationSec = parseTargetDuration(variation.estimatedDuration);
    const activeProfile: VoiceProfile = customSpeed
      ? { ...voiceProfile, speed: customSpeed }
      : voiceProfile;

    console.log(`[VoiceFactory] Sending ONE Gemini TTS request for ${videoId}`);

    // Set Status GENERATING
    setAudioBank((prev) => {
      if (prev[videoId]?.isApproved && !allowApprovedOverwrite) return prev;
      return {
        ...prev,
        [videoId]: {
          productId: projectStorageId,
          videoId,
          scriptVersion: 'v1.0 (SCRIPT APPROVED)',
          salesAngle: variation.salesAngle,
          voiceProfile: activeProfile,
          engine: 'GEMINI_TTS',
          voiceStatus: 'GENERATING',
          audioUrl: prev[videoId]?.audioUrl || null,
          duration: prev[videoId]?.duration || 0,
          targetDuration: targetDurationSec,
          durationStatus: prev[videoId]?.durationStatus || 'DURATION MISMATCH',
          voiceDirection: getSalesAngleVoiceDirection(variation.salesAngle, activeProfile),
          voiceQc: prev[videoId]?.voiceQc || null,
          isApproved: false, // Unapproved upon deliberate user regeneration
          createdAt: new Date().toISOString(),
          error: null,
        },
      };
    });

    try {
      // EXACTLY 1 REQUEST - FAIL-FAST ARCHITECTURE
      const response = await generateVoiceWithGemini({
        text: variation.voiceScript,
        salesAngle: variation.salesAngle,
        voiceProfile: activeProfile,
        targetDurationSec,
        videoId,
        model: geminiModel,
      });

      setAudioBank((prev) => {
        if (prev[videoId]?.isApproved && !allowApprovedOverwrite) return prev;
        return {
          ...prev,
          [videoId]: {
            productId: projectStorageId,
            videoId,
            scriptVersion: 'v1.0 (SCRIPT APPROVED)',
            salesAngle: variation.salesAngle,
            voiceProfile: response.voiceProfile,
            engine: 'GEMINI_TTS',
            voiceStatus: 'READY',
            audioUrl: response.audioUrl,
            duration: response.duration,
            targetDuration: response.targetDuration,
            durationStatus: response.durationStatus,
            voiceDirection: response.voiceDirection,
            voiceQc: response.voiceQc,
            isApproved: false,
            createdAt: new Date().toISOString(),
            error: null,
          },
        };
      });
    } catch (err: any) {
      const isRateLimited =
        err?.status === 429 ||
        err?.status === 503 ||
        err?.code === 'RATE_LIMITED' ||
        err?.code === 'SERVICE_UNAVAILABLE' ||
        String(err?.message || '').includes('429') ||
        String(err?.message || '').includes('503') ||
        String(err?.message || '').includes('RESOURCE_EXHAUSTED') ||
        String(err?.message || '').includes('quota');

      if (isRateLimited) {
        console.warn(`[VoiceFactory] RATE_LIMITED – single voice paused at ${videoId}`);
        const cooldown = typeof err?.retryAfterSec === 'number' && err.retryAfterSec > 0 ? err.retryAfterSec : VOICE_RATE_LIMIT_COOLDOWN_SEC;
        setCooldownRemainingSec(cooldown);
        setCooldownPausedVideoId(videoId);
        setBatchRateLimitPaused(true);

        const errorText = err?.message || 'GEMINI TTS ĐANG GIỚI HẠN TẦN SUẤT (429). Xưởng đã tạm dừng để bảo vệ quota.';

        setAudioBank((prev) => {
          if (prev[videoId]?.isApproved && !allowApprovedOverwrite) return prev;
          return {
            ...prev,
            [videoId]: {
              ...(prev[videoId] || {
                productId: projectStorageId,
                videoId,
                scriptVersion: 'v1.0 (SCRIPT APPROVED)',
                salesAngle: variation.salesAngle,
                voiceProfile: activeProfile,
                engine: 'GEMINI_TTS',
                audioUrl: null,
                duration: 0,
                targetDuration: targetDurationSec,
                durationStatus: 'DURATION MISMATCH',
                voiceDirection: getSalesAngleVoiceDirection(variation.salesAngle, activeProfile),
                voiceQc: null,
                isApproved: false,
                createdAt: new Date().toISOString(),
              }),
              voiceStatus: 'RATE_LIMIT_WAIT',
              error: errorText,
            },
          };
        });
      } else {
        console.error(`[VoiceFactory] Error generating voice for ${videoId}:`, err);
        setAudioBank((prev) => {
          if (prev[videoId]?.isApproved && !allowApprovedOverwrite) return prev;
          return {
            ...prev,
            [videoId]: {
              ...(prev[videoId] || {
                productId: projectStorageId,
                videoId,
                scriptVersion: 'v1.0 (SCRIPT APPROVED)',
                salesAngle: variation.salesAngle,
                voiceProfile: activeProfile,
                engine: 'GEMINI_TTS',
                audioUrl: null,
                duration: 0,
                targetDuration: targetDurationSec,
                durationStatus: 'DURATION MISMATCH',
                voiceDirection: getSalesAngleVoiceDirection(variation.salesAngle, activeProfile),
                voiceQc: null,
                isApproved: false,
                createdAt: new Date().toISOString(),
              }),
              voiceStatus: 'FAILED',
              error: err?.message || 'Lỗi tạo audio voice-over.',
            },
          };
        });
      }
    }
  };

  // =========================================================================
  // BATCH VOICE GENERATION - PLAN C: FAIL-FAST + COOLDOWN + RESUME
  // 1 Video = 1 Request Gemini TTS (ZERO Server/Client retries)
  // =========================================================================
  const handleBatchGenerateVoice = async (onlyPendingUnready: boolean = false) => {
    // 1. Cooldown Guard
    if (cooldownRemainingSec > 0) return;

    // 2. STRICT FILTER: Only variations that have SCRIPT_APPROVED and DO NOT have VOICE_APPROVED
    let targetVariations = variations.filter(
      (v) => v.isApproved && !audioBank[v.id]?.isApproved
    );

    // If resuming, skip items that already have voiceStatus === 'READY'
    if (onlyPendingUnready) {
      targetVariations = targetVariations.filter(
        (v) => audioBank[v.id]?.voiceStatus !== 'READY'
      );
    }

    // Absolute filter safeguard: never process voice approved items
    targetVariations = targetVariations.filter(
      (v) => !audioBank[v.id]?.isApproved
    );

    // If nothing to process or already running, return immediately
    if (targetVariations.length === 0 || isBatchRunning) return;

    setIsBatchRunning(true);
    setBatchRateLimitPaused(false);
    setCooldownPausedVideoId(null);
    setBatchMessage(
      `Đang khởi chạy Batch Voice cho ${targetVariations.length} video chưa duyệt... (Đã khóa bảo vệ ${lockedApprovedCount} video VOICE APPROVED)`
    );

    // 3. Initialize queue for target variations ONLY
    const initialQueue: Record<string, VoiceQueueItem> = {};
    targetVariations.forEach((v) => {
      initialQueue[v.id] = { videoId: v.id, status: 'QUEUED', retryCount: 0 };
    });
    setQueue((prev) => ({ ...prev, ...initialQueue }));

    // 4. Process sequentially strictly for target variations (1 REQUEST PER VIDEO - ZERO RETRY)
    for (let i = 0; i < targetVariations.length; i++) {
      const variation = targetVariations[i];
      const videoId = variation.id;

      // IMMUTABLE ASSET LOCK GUARD: Double check that item is NOT approved
      if (audioBank[videoId]?.isApproved) {
        console.warn(`[VoiceFactory] Bỏ qua ${videoId} vì là Immutable Approved Asset.`);
        continue;
      }

      const targetDurationSec = parseTargetDuration(variation.estimatedDuration);

      console.log(`[VoiceFactory] Sending ONE Gemini TTS request for ${videoId}`);
      setBatchMessage(
        `Đang tạo voice cho [${videoId}] (${i + 1}/${targetVariations.length}) bằng Gemini TTS... [Bảo toàn nguyên vẹn ${lockedApprovedCount} video đã duyệt]`
      );

      // Update queue & audio bank status to GENERATING
      setQueue((prev) => ({
        ...prev,
        [videoId]: { videoId, status: 'GENERATING', retryCount: 0 },
      }));

      setAudioBank((prev) => {
        if (prev[videoId]?.isApproved) return prev;
        return {
          ...prev,
          [videoId]: {
            productId: projectStorageId,
            videoId,
            scriptVersion: 'v1.0 (SCRIPT APPROVED)',
            salesAngle: variation.salesAngle,
            voiceProfile,
            engine: 'GEMINI_TTS',
            voiceStatus: 'GENERATING',
            audioUrl: prev[videoId]?.audioUrl || null,
            duration: prev[videoId]?.duration || targetDurationSec,
            targetDuration: targetDurationSec,
            durationStatus: prev[videoId]?.durationStatus || 'DURATION PASS',
            voiceDirection: getSalesAngleVoiceDirection(variation.salesAngle, voiceProfile),
            voiceQc: prev[videoId]?.voiceQc || null,
            isApproved: false,
            createdAt: new Date().toISOString(),
            error: null,
          },
        };
      });

      try {
        // EXACTLY 1 REQUEST - FAIL FAST
        const response = await generateVoiceWithGemini({
          text: variation.voiceScript,
          salesAngle: variation.salesAngle,
          voiceProfile,
          targetDurationSec,
          videoId,
          model: geminiModel,
        });

        // SAVE IMMEDIATELY after successful request
        setAudioBank((prev) => {
          if (prev[videoId]?.isApproved) return prev;
          return {
            ...prev,
            [videoId]: {
              productId: projectStorageId,
              videoId,
              scriptVersion: 'v1.0 (SCRIPT APPROVED)',
              salesAngle: variation.salesAngle,
              voiceProfile: response.voiceProfile,
              engine: 'GEMINI_TTS',
              voiceStatus: 'READY',
              audioUrl: response.audioUrl,
              duration: response.duration,
              targetDuration: response.targetDuration,
              durationStatus: response.durationStatus,
              voiceDirection: response.voiceDirection,
              voiceQc: response.voiceQc,
              isApproved: false,
              createdAt: new Date().toISOString(),
              error: null,
            },
          };
        });

        setQueue((prev) => ({
          ...prev,
          [videoId]: { videoId, status: 'READY', retryCount: 0 },
        }));

        // Gentle pause between batch items if not last
        if (i < targetVariations.length - 1) {
          await new Promise((r) => setTimeout(r, 1200));
        }
      } catch (err: any) {
        const isRateLimited =
          err?.status === 429 ||
          err?.status === 503 ||
          err?.code === 'RATE_LIMITED' ||
          err?.code === 'SERVICE_UNAVAILABLE' ||
          String(err?.message || '').includes('429') ||
          String(err?.message || '').includes('503') ||
          String(err?.message || '').includes('RESOURCE_EXHAUSTED') ||
          String(err?.message || '').includes('quota');

        if (isRateLimited) {
          // LOG: [VoiceFactory] RATE_LIMITED – batch paused at P001_V02
          console.warn(`[VoiceFactory] RATE_LIMITED – batch paused at ${videoId}`);
          const cooldown = typeof err?.retryAfterSec === 'number' && err.retryAfterSec > 0 ? err.retryAfterSec : VOICE_RATE_LIMIT_COOLDOWN_SEC;
          const errorText = err?.message || 'GEMINI TTS ĐANG GIỚI HẠN TẦN SUẤT (429). Xưởng đã tạm dừng để bảo vệ quota.';

          setAudioBank((prev) => {
            if (prev[videoId]?.isApproved) return prev;
            return {
              ...prev,
              [videoId]: {
                ...(prev[videoId] || {
                  productId: projectStorageId,
                  videoId,
                  scriptVersion: 'v1.0 (SCRIPT APPROVED)',
                  salesAngle: variation.salesAngle,
                  voiceProfile,
                  engine: 'GEMINI_TTS',
                  audioUrl: null,
                  duration: 0,
                  targetDuration: targetDurationSec,
                  durationStatus: 'DURATION MISMATCH',
                  voiceDirection: getSalesAngleVoiceDirection(variation.salesAngle, voiceProfile),
                  voiceQc: null,
                  isApproved: false,
                  createdAt: new Date().toISOString(),
                }),
                voiceStatus: 'RATE_LIMIT_WAIT',
                error: errorText,
              },
            };
          });

          setQueue((prev) => ({
            ...prev,
            [videoId]: {
              videoId,
              status: 'RATE_LIMIT_WAIT',
              retryCount: 0,
              error: errorText,
            },
          }));

          // Trigger Cooldown
          setCooldownRemainingSec(cooldown);
          setCooldownPausedVideoId(videoId);
          setBatchRateLimitPaused(true);
          setIsBatchRunning(false);
          setBatchMessage(
            `GEMINI TTS ĐANG GIỚI HẠN TẦN SUẤT. Xưởng đã tạm dừng an toàn tại ${videoId} để bảo vệ quota. Thử lại sau ${cooldown}s.`
          );

          // FAIL-FAST STOP: DỪNG BATCH NGAY TẠI VIDEO ĐÓ, KHÔNG TIẾP TỤC VIDEO TIẾP THEO
          return;
        } else {
          console.error(`[VoiceFactory] Error at ${videoId}:`, err);
          setAudioBank((prev) => {
            if (prev[videoId]?.isApproved) return prev;
            return {
              ...prev,
              [videoId]: {
                ...(prev[videoId] || {
                  productId: projectStorageId,
                  videoId,
                  scriptVersion: 'v1.0 (SCRIPT APPROVED)',
                  salesAngle: variation.salesAngle,
                  voiceProfile,
                  engine: 'GEMINI_TTS',
                  audioUrl: null,
                  duration: 0,
                  targetDuration: targetDurationSec,
                  durationStatus: 'DURATION MISMATCH',
                  voiceDirection: getSalesAngleVoiceDirection(variation.salesAngle, voiceProfile),
                  voiceQc: null,
                  isApproved: false,
                  createdAt: new Date().toISOString(),
                }),
                voiceStatus: 'FAILED',
                error: err?.message || 'Lỗi khi tạo audio voice-over.',
              },
            };
          });

          setQueue((prev) => ({
            ...prev,
            [videoId]: {
              videoId,
              status: 'FAILED',
              retryCount: 0,
              error: err?.message || 'Lỗi khi tạo audio voice-over.',
            },
          }));

          setBatchRateLimitPaused(true);
          setIsBatchRunning(false);
          setBatchMessage(`Đã dừng hàng đợi tại [${videoId}] do lỗi: ${err?.message || 'Lỗi không xác định'}.`);
          return;
        }
      }
    }

    setIsBatchRunning(false);
    setBatchRateLimitPaused(false);
    setBatchMessage('');
  };

  // Toggle Human Approval for a Voice
  const handleToggleApproveVoice = (videoId: string) => {
    setAudioBank((prev) => {
      const item = prev[videoId];
      if (!item) return prev;

      // Never approve a missing or duration-mismatched audio asset.
      if (!item.isApproved) {
        const hasAudio = typeof item.audioUrl === 'string' && item.audioUrl.length > 0;
        const diff = Math.abs((item.duration || 0) - (item.targetDuration || 0));
        if (!hasAudio || item.duration <= 0 || diff > 1.0 || item.durationStatus !== 'DURATION PASS') {
          console.warn(`[VoiceFactory] Approval blocked for ${videoId}: audio/duration QC not ready.`);
          return prev;
        }
      }

      return {
        ...prev,
        [videoId]: {
          ...item,
          isApproved: !item.isApproved,
          approvedAt: !item.isApproved ? new Date().toISOString() : null,
        },
      };
    });
  };

  // Handle Manual File Upload for Vbee Manual Mode
  const handleRequestFileUpload = (videoId: string, variation: VideoVariation, file: File) => {
    const existing = audioBank[videoId];
    if (existing?.isApproved) {
      setVbeeConfirmUpload({ videoId, variation, file });
      return;
    }
    executeFileUpload(videoId, variation, file);
  };

  const executeFileUpload = async (videoId: string, variation: VideoVariation, file: File) => {
    if (!file) return;
    const targetDurationSec = parseTargetDuration(variation.estimatedDuration);

    try {
      const duration = await measureAudioDuration(file);
      const reader = new FileReader();

      reader.onload = () => {
        const audioUrl = reader.result as string;
        const voiceQc = evaluateManualAudioQc(
          variation.voiceScript,
          duration,
          targetDurationSec,
          voiceProfile
        );

        setAudioBank((prev) => ({
          ...prev,
          [videoId]: {
            productId: projectStorageId,
            videoId,
            scriptVersion: 'v1.0 (SCRIPT APPROVED)',
            salesAngle: variation.salesAngle,
            voiceProfile,
            engine: 'VBEE_MANUAL',
            voiceStatus: 'READY',
            audioUrl,
            duration,
            targetDuration: targetDurationSec,
            durationStatus: voiceQc.durationStatus,
            voiceDirection: getSalesAngleVoiceDirection(variation.salesAngle, voiceProfile),
            voiceQc,
            isApproved: false,
            createdAt: new Date().toISOString(),
            error: null,
          },
        }));
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error uploading manual audio:', err);
    }
  };

  // Download single audio file (.wav)
  const handleDownloadAudio = (item: AudioBankItem) => {
    if (!item.audioUrl) return;
    const link = document.createElement('a');
    link.href = item.audioUrl;
    link.download = `${item.videoId}_Voice_${item.voiceProfile.gender}_${item.duration}s.wav`;
    link.click();
  };

  // Download all approved audio files
  const handleDownloadAllApproved = () => {
    const approvedAudios = (Object.values(audioBank) as AudioBankItem[]).filter(
      (a) => a.isApproved && a.audioUrl
    );
    if (approvedAudios.length === 0) return;

    approvedAudios.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadAudio(item);
      }, index * 400);
    });
  };

  return (
    <section id="voice-factory-section" className="space-y-6 pt-4">
      {/* Module Header Card */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                <Mic className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <span>VOICE FACTORY 4.0</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 font-extrabold uppercase">
                  Studio Audio
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Biến Voice Script đã được <strong className="text-emerald-400">SCRIPT APPROVED</strong> thành bản thu âm Voice-over chuyên nghiệp (Gemini TTS / Vbee Manual), đồng bộ chuẩn Voice Profile, Duration Check và Voice QC tự động.
            </p>
          </div>

          {/* Quick Metrics Badges - Đã duyệt / Đã tạo / Duration Pass / Duration Mismatch / Rate Limit Wait / Chưa tạo */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">VOICE APPROVED:</span>
              <span className="font-bold text-emerald-400">{lockedApprovedCount}/{approvedScriptsCount}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center gap-2 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300">VOICE READY:</span>
              <span className="font-bold text-blue-400">{voiceReadyUnapprovedCount}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2 text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">DURATION PASS:</span>
              <span className="font-bold text-emerald-400">{durationPassCount}/{totalAudiosWithAudioCount || approvedScriptsCount}</span>
            </div>

            {durationMismatchCount > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-600/70 flex items-center gap-2 text-xs animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">DURATION MISMATCH:</span>
                <span className="font-bold text-amber-400">{durationMismatchCount}</span>
              </div>
            )}

            {rateLimitWaitCount > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">RATE LIMIT WAIT:</span>
                <span className="font-bold text-amber-400">{rateLimitWaitCount}</span>
              </div>
            )}

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">CHƯA TẠO:</span>
              <span className="font-bold text-slate-300">{notCreatedCount}</span>
            </div>
          </div>
        </div>

        {/* 1. VOICE ENGINE & 2. VOICE PROFILE SETUP */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Engine Toggle */}
          <div className="lg:col-span-4 space-y-3">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>1. Voice Engine</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                id="voice-engine-gemini-btn"
                onClick={() => setEngine('GEMINI_TTS')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  engine === 'GEMINI_TTS'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>GEMINI TTS</span>
              </button>

              <button
                type="button"
                id="voice-engine-vbee-btn"
                onClick={() => setEngine('VBEE_MANUAL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  engine === 'VBEE_MANUAL'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>VBEE MANUAL</span>
              </button>
            </div>

            {engine === 'GEMINI_TTS' && (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Gemini TTS Model (Engine chính)
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGeminiModel('gemini-2.5-flash-preview-tts')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                      geminiModel === 'gemini-2.5-flash-preview-tts'
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
                    }`}
                  >
                    <span>Gemini 2.5 Flash TTS</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 uppercase font-bold">
                      Default / Ổn định
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGeminiModel('gemini-3.1-flash-tts-preview')}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                      geminiModel === 'gemini-3.1-flash-tts-preview'
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
                    }`}
                  >
                    <span>Gemini 3.1 Flash TTS</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50 uppercase font-bold">
                      Experimental
                    </span>
                  </button>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-normal">
              {engine === 'GEMINI_TTS'
                ? 'Sử dụng Gemini 2.5 Flash TTS mặc định (hoặc 3.1 thử nghiệm) trực tiếp từ server.'
                : 'Copy kịch bản sang Vbee AI và tải tệp audio (.mp3, .wav) lên từng Video ID.'}
            </p>
          </div>

          {/* Right: Voice Profile Selectors */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Voice Profile &amp; Consistency</span>
              </label>

              {/* Sample Audition Button */}
              {engine === 'GEMINI_TTS' && (
                <button
                  type="button"
                  id="preview-voice-btn"
                  onClick={handlePreviewVoice}
                  disabled={isPreviewLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPreviewLoading ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                  ) : isPlayingPreview ? (
                    <Pause className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-blue-400" />
                  )}
                  <span>{isPlayingPreview ? 'Đang phát...' : 'Nghe thử giọng mẫu'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Gender */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Giới tính giọng
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleGenderChange('female')}
                    className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                      voiceProfile.gender === 'female'
                        ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
                    }`}
                  >
                    Nữ (Female)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderChange('male')}
                    className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                      voiceProfile.gender === 'male'
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
                    }`}
                  >
                    Nam (Male)
                  </button>
                </div>
              </div>

              {/* Style */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Phong cách
                </span>
                <select
                  value={voiceProfile.style}
                  onChange={(e) => handleStyleChange(e.target.value as VoiceStyle)}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="natural">Tự nhiên (Mặc định)</option>
                  <option value="youthful">Trẻ trung</option>
                  <option value="energetic">Năng lượng</option>
                  <option value="gentle">Nhẹ nhàng</option>
                  <option value="trustworthy">Tin cậy</option>
                  <option value="natural_review">Review tự nhiên</option>
                  <option value="soft_sell">Bán hàng mềm</option>
                </select>
              </div>

              {/* Speed */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tốc độ
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(['slow', 'medium', 'fast'] as VoiceSpeed[]).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSpeedChange(spd)}
                      className={`py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                        voiceProfile.speed === spd
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
                      }`}
                    >
                      {spd === 'slow' ? 'Chậm' : spd === 'fast' ? 'Nhanh' : 'Vừa'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Consistency notice */}
            <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-800/30">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Voice Consistency Lock:</strong> Toàn bộ video V01–V05 sẽ sử dụng cùng một giọng đọc này để bảo đảm tính nhận diện thương hiệu thống nhất.
              </span>
            </div>
          </div>
        </div>

        {/* 5. BATCH VOICE ACTION BAR & PROGRESS DASHBOARD (IMMUTABLE ASSET PROTECTED & RATE LIMIT RESILIENT) */}
        {engine === 'GEMINI_TTS' && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-4">
            {/* Visual Progress Bar */}
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">Tiến Độ Batch Voice:</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {lockedApprovedCount + voiceReadyUnapprovedCount}/{approvedScriptsCount} video
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Đã duyệt: {lockedApprovedCount}
                  </span>
                  <span className="flex items-center gap-1 text-blue-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Đã tạo: {voiceReadyUnapprovedCount}
                  </span>
                  {inProgressOrWaitingCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-400 font-semibold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Đang xử lý: {inProgressOrWaitingCount}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                    Còn lại: {remainingUnreadyCount}
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(lockedApprovedCount / (approvedScriptsCount || 1)) * 100}%`,
                  }}
                  title={`Đã duyệt: ${lockedApprovedCount}`}
                />
                <div
                  className="bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${(voiceReadyUnapprovedCount / (approvedScriptsCount || 1)) * 100}%`,
                  }}
                  title={`Đã tạo: ${voiceReadyUnapprovedCount}`}
                />
                <div
                  className="bg-amber-400 animate-pulse transition-all duration-500"
                  style={{
                    width: `${(inProgressOrWaitingCount / (approvedScriptsCount || 1)) * 100}%`,
                  }}
                  title={`Đang chờ/Xử lý: ${inProgressOrWaitingCount}`}
                />
              </div>
            </div>

            {/* Active Cooldown Banner (when cooldownRemainingSec > 0) */}
            {cooldownRemainingSec > 0 && (
              <div className="p-4 bg-amber-950/60 border-2 border-amber-500/80 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 shadow-lg shadow-amber-950/40 animate-pulse">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-600/30 border border-amber-500/50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-amber-300 font-bold uppercase tracking-wider text-xs">
                        PAUSED – RATE LIMIT (429)
                      </strong>
                      {cooldownPausedVideoId && (
                        <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-600/40 text-amber-200 font-mono text-[11px] font-bold">
                          Video: {cooldownPausedVideoId}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs mt-0.5">
                      GEMINI TTS ĐANG GIỚI HẠN TẦN SUẤT - Xưởng đã tạm dừng để bảo vệ quota. Thử lại sau:{' '}
                      <span className="font-bold text-amber-300 font-mono text-sm">{cooldownRemainingSec}s</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-amber-950/80 px-3.5 py-2 rounded-lg border border-amber-600/40 shrink-0">
                  <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">Cooldown:</span>
                  <span className="font-mono text-base font-black text-amber-400">
                    00:{cooldownRemainingSec.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {/* Rate limit pause alert banner (when cooldown completed and needs resume) */}
            {cooldownRemainingSec === 0 && (batchRateLimitPaused || rateLimitWaitCount > 0) && !isBatchRunning && (
              <div className="p-3.5 bg-amber-950/40 border border-amber-600/60 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong className="block text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                      Hàng đợi đã tạm dừng an toàn do Gemini TTS Rate Limit (429/503)
                    </strong>
                    <span className="text-slate-300 text-[11px]">
                      Tất cả các bản Voice đã tạo trước đó và các video đã duyệt vẫn được bảo toàn nguyên vẹn ({lockedApprovedCount} Đã duyệt, {voiceReadyUnapprovedCount} Đã tạo).
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="resume-batch-voice-btn"
                  onClick={() => handleBatchGenerateVoice(true)}
                  disabled={remainingUnreadyCount === 0}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>TIẾP TỤC TẠO VOICE CÒN LẠI ({remainingUnreadyCount} VIDEO)</span>
                </button>
              </div>
            )}

            {/* Action Bar controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300 space-y-0.5">
                {isBatchRunning ? (
                  <div className="flex items-center gap-2 text-blue-400 font-medium animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{batchMessage || 'Đang tạo voice hàng loạt...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>
                      Sẵn sàng tạo: <strong className="text-blue-400">{eligibleBatchCount}</strong> video chưa duyệt voice.
                    </span>
                    {lockedApprovedCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                        <Lock className="w-3 h-3" />
                        <span>Đã khóa bảo vệ {lockedApprovedCount} video (VOICE APPROVED)</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Secondary: Resume remaining unready videos button if some are ready and some unready */}
                {!isBatchRunning && cooldownRemainingSec === 0 && remainingUnreadyCount > 0 && remainingUnreadyCount < eligibleBatchCount && (
                  <button
                    type="button"
                    id="resume-remaining-voice-btn"
                    onClick={() => handleBatchGenerateVoice(true)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/40 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>TẠO TIẾP CÒN LẠI ({remainingUnreadyCount} VIDEO)</span>
                  </button>
                )}

                {/* Primary: Batch Generate Button */}
                <button
                  type="button"
                  id="batch-generate-voice-btn"
                  onClick={() => handleBatchGenerateVoice(false)}
                  disabled={isBatchRunning || eligibleBatchCount === 0 || cooldownRemainingSec > 0}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider ${
                    eligibleBatchCount === 0 && lockedApprovedCount > 0
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20 disabled:opacity-40 disabled:pointer-events-none'
                  }`}
                >
                  {isBatchRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ĐANG TẠO VOICE TUẦN TỰ...</span>
                    </>
                  ) : cooldownRemainingSec > 0 ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin text-amber-300" />
                      <span>ĐANG CHỜ COOLDOWN ({cooldownRemainingSec}s)...</span>
                    </>
                  ) : eligibleBatchCount === 0 && lockedApprovedCount > 0 ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>TẤT CẢ VOICE ĐÃ DUYỆT KHÓA AN TOÀN ({lockedApprovedCount}/{approvedScriptsCount})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>TẠO VOICE TUẦN TỰ ({eligibleBatchCount} VIDEO CHƯA DUYỆT)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. VIDEO VARIATIONS VOICE LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Danh Sách Video Variation (V01 – V05)</span>
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cơ chế <strong>Immutable Approved Asset</strong> bảo toàn nguyên vẹn Voice đã duyệt</span>
          </span>
        </div>

        {variations.length === 0 ? (
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <FileAudio className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">Chưa có kịch bản video nào được tạo từ Script Factory.</p>
            <p className="text-xs text-slate-500">Vui lòng tạo và duyệt SCRIPT APPROVED ở module bên trên trước.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variations.map((variation) => {
              const videoId = variation.id;
              const audioItem = audioBank[videoId];
              const isApprovedScript = variation.isApproved;
              const isGenerating = audioItem?.voiceStatus === 'GENERATING' || queue[videoId]?.status === 'GENERATING';
              const isRateLimitWait = audioItem?.voiceStatus === 'RATE_LIMIT_WAIT' || queue[videoId]?.status === 'RATE_LIMIT_WAIT';
              const isRetryRequired = audioItem?.voiceStatus === 'RETRY_REQUIRED' || queue[videoId]?.status === 'RETRY_REQUIRED';
              const hasAudio = !!(
                audioItem &&
                (audioItem.voiceStatus === 'READY' || audioItem.isApproved) &&
                typeof audioItem.duration === 'number' &&
                audioItem.duration > 0 &&
                !!audioItem.audioUrl
              );
              const isReady = hasAudio;
              const isFailed = audioItem?.voiceStatus === 'FAILED' || queue[videoId]?.status === 'FAILED';
              const isVoiceApproved = audioItem?.isApproved;
              const isPlaying = activePlayingId === videoId;
              const currentTime = playbackTimeMap[videoId] || 0;
              const targetDurationSec = parseTargetDuration(variation.estimatedDuration);
              const actualDurationSec = hasAudio ? audioItem.duration : null;

              // STRICT DURATION QC CALCULATION: delta = Math.abs(actualAudioDuration - targetTimeline)
              // PASS iff delta <= 1.0, MISMATCH iff delta > 1.0
              const deltaSec =
                actualDurationSec !== null
                  ? Math.round(Math.abs(actualDurationSec - targetDurationSec) * 10) / 10
                  : null;
              const isDurationPass = deltaSec !== null && deltaSec <= 1.0;
              const isDurationMismatch = deltaSec !== null && deltaSec > 1.0;
              const durationStatus: 'DURATION PASS' | 'DURATION MISMATCH' | 'NO_AUDIO' = !hasAudio
                ? 'NO_AUDIO'
                : isDurationPass
                ? 'DURATION PASS'
                : 'DURATION MISMATCH';

              const voiceQc = audioItem?.voiceQc;
              const isQcExpanded = expandedQcMap[videoId] || false;

              const voiceDirectionText = getSalesAngleVoiceDirection(
                variation.salesAngle,
                audioItem?.voiceProfile || voiceProfile
              );

              return (
                <div
                  key={videoId}
                  id={`voice-card-${videoId}`}
                  className={`bg-slate-950/80 border rounded-2xl p-5 transition-all shadow-md space-y-4 ${
                    isVoiceApproved
                      ? 'border-emerald-600/80 bg-emerald-950/15 ring-1 ring-emerald-500/20'
                      : isReady
                      ? 'border-blue-600/60 bg-slate-950/90'
                      : isRateLimitWait
                      ? 'border-amber-500/60 bg-amber-950/10'
                      : isRetryRequired
                      ? 'border-orange-500/60 bg-orange-950/10'
                      : isApprovedScript
                      ? 'border-slate-800'
                      : 'border-slate-800/40 opacity-70 bg-slate-950/30'
                  }`}
                >
                  {/* Top Bar: Video ID + Sales Angle + Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-black tracking-wider">
                        {videoId}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">
                          {variation.salesAngle}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Target Timeline: <strong>{targetDurationSec}s</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Script Status */}
                      {isApprovedScript ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-600/40">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>SCRIPT APPROVED</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-600/40">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            <span>CHƯA DUYỆT SCRIPT</span>
                          </span>
                          {onToggleApproveScript && (
                            <button
                              type="button"
                              onClick={() => onToggleApproveScript(videoId)}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Duyệt ngay
                            </button>
                          )}
                        </div>
                      )}

                      {/* Voice Status Badge (With Immutable Lock Indicator & Rate Limit States) */}
                      {isVoiceApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 shadow-sm">
                          <Lock className="w-3 h-3 text-slate-950" />
                          <span>VOICE APPROVED (IMMUTABLE LOCKED)</span>
                        </span>
                      ) : isReady ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40">
                          <Volume2 className="w-3 h-3 text-blue-400" />
                          <span>VOICE READY</span>
                        </span>
                      ) : isRateLimitWait ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>RATE LIMIT WAIT ({audioItem?.cooldownSec || 10}s - Lần {audioItem?.retryAttempt || 1}/3)</span>
                        </span>
                      ) : isRetryRequired ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-500/50">
                          <AlertTriangle className="w-3 h-3 text-orange-400" />
                          <span>RETRY REQUIRED (TẠM DỪNG AN TOÀN)</span>
                        </span>
                      ) : isGenerating ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-600/40 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>GENERATING...</span>
                        </span>
                      ) : isFailed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-300 border border-red-600/40">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span>FAILED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          <span>CHƯA TẠO VOICE</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* IMMUTABLE ASSET LOCK NOTICE BANNER */}
                  {isVoiceApproved && (
                    <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 text-xs text-emerald-300/90 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>Tài sản khóa an toàn:</strong> Bản Voice này đã được Human QC duyệt đạt chuẩn. Tác vụ <em>Tạo Voice Hàng Loạt</em> sẽ tự động bỏ qua video này để bảo toàn nguyên vẹn audio và điểm QC ({voiceQc?.score || 96}/100).
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-900/60 text-emerald-200 rounded font-mono shrink-0">
                        PROTECTED
                      </span>
                    </div>
                  )}

                  {/* 6. VOICE DIRECTION BANNER */}
                  <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                      <Radio className="w-3 h-3" />
                      <span>Voice Direction (Định hướng diễn đọc theo Sales Angle)</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed italic">
                      "{voiceDirectionText}"
                    </p>
                    <div className="text-[10px] text-slate-500">
                      * Định hướng giọng đọc không làm thay đổi nội dung kịch bản đã duyệt.
                    </div>
                  </div>

                  {/* Script Preview */}
                  <div className="bg-slate-900/40 rounded-xl p-3 border border-slate-800/60 text-xs text-slate-300 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase">
                      <span>Nội dung Voice Script ({variation.voiceScript.trim().split(/\s+/).length} từ):</span>
                      <CopyButton text={variation.voiceScript} label="Copy Script" />
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans">
                      {variation.voiceScript}
                    </p>
                  </div>

                  {/* Main Action Area (Depending on Status & Engine) */}
                  {!isApprovedScript ? (
                    <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs text-amber-300/90 flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Kịch bản video này chưa được duyệt. Bạn cần nhấn <strong>[DUYỆT KỊCH BẢN]</strong> ở Script Factory để mở khóa tạo Voice-over.
                      </span>
                    </div>
                  ) : engine === 'GEMINI_TTS' ? (
                    <div className="space-y-3">
                      {/* Audio Controls if READY */}
                      {isReady && audioItem?.audioUrl && (
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Playback Button + Time */}
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                id={`play-btn-${videoId}`}
                                onClick={() => handleTogglePlayAudio(videoId, audioItem.audioUrl!)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md transition-transform active:scale-95 cursor-pointer ${
                                  isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'
                                }`}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                              </button>

                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{isPlaying ? 'Đang phát voice' : 'Audio sẵn sàng'}</span>
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    ({currentTime.toFixed(1)}s / {actualDurationSec.toFixed(1)}s)
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  Giọng {audioItem.voiceProfile.gender === 'male' ? 'Nam' : 'Nữ'} • {audioItem.voiceProfile.style} • {audioItem.voiceProfile.speed}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons: Duyệt Voice, Tải Audio, Tạo Lại */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                id={`download-audio-btn-${videoId}`}
                                onClick={() => handleDownloadAudio(audioItem)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-400" />
                                <span>Tải Audio</span>
                              </button>

                              {/* REGENERATE BUTTON - Protected by Immutable Asset confirmation */}
                              <button
                                type="button"
                                id={`regen-voice-btn-${videoId}`}
                                onClick={() => handleRequestGenerateSingleVoice(variation)}
                                disabled={isGenerating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isVoiceApproved
                                    ? 'bg-slate-800/80 hover:bg-amber-950/40 text-amber-300/90 border-amber-800/50'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                }`}
                                title={isVoiceApproved ? 'Mở khóa để tạo lại voice mới' : 'Tạo lại voice'}
                              >
                                {isVoiceApproved ? (
                                  <>
                                    <Unlock className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Mở khóa &amp; Tạo lại</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Tạo lại</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                id={`approve-voice-btn-${videoId}`}
                                onClick={() => handleToggleApproveVoice(videoId)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                                  isVoiceApproved
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 ring-2 ring-emerald-400/40'
                                    : 'bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40'
                                }`}
                              >
                                {isVoiceApproved ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>ĐÃ DUYỆT VOICE (LOCKED)</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>DUYỆT VOICE</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* 7. DURATION CHECK */}
                          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-400 font-medium">Duration Check:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                                Target: {targetDurationSec}s
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono text-[11px]">
                                Voice: {actualDurationSec !== null ? `${actualDurationSec.toFixed(1)}s` : 'Chưa có'}
                              </span>

                              {isDurationPass ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>DURATION PASS (±{deltaSec !== null ? deltaSec.toFixed(1) : 0}s &lt;= 1.0s)</span>
                                </span>
                              ) : isDurationMismatch ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <AlertCircle className="w-3 h-3 text-amber-400" />
                                  <span>DURATION MISMATCH (Lệch {deltaSec !== null ? deltaSec.toFixed(1) : 0}s &gt; 1.0s)</span>
                                </span>
                              ) : null}
                            </div>

                            {/* Options when Duration Mismatch */}
                            {isDurationMismatch && actualDurationSec !== null && (
                              <div className="flex items-center gap-2 flex-wrap">
                                {actualDurationSec > targetDurationSec ? (
                                  <>
                                    <button
                                      type="button"
                                      id={`regen-faster-btn-${videoId}`}
                                      onClick={() => handleRequestGenerateSingleVoice(variation, 'fast')}
                                      disabled={isGenerating || cooldownRemainingSec > 0}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                                      title="Voice dài hơn Target: tăng nhẹ tốc độ đọc để khớp timeline"
                                    >
                                      <FastForward className="w-3 h-3" />
                                      <span>TẠO LẠI NHANH HƠN</span>
                                    </button>
                                    <button
                                      type="button"
                                      id={`regen-slower-btn-${videoId}`}
                                      onClick={() => handleRequestGenerateSingleVoice(variation, 'slow')}
                                      disabled={isGenerating || cooldownRemainingSec > 0}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1 border border-slate-700"
                                      title="Thử tạo lại với nhịp chậm hơn"
                                    >
                                      <Rewind className="w-3 h-3 text-slate-400" />
                                      <span>TẠO LẠI CHẬM HƠN</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      id={`regen-slower-btn-${videoId}`}
                                      onClick={() => handleRequestGenerateSingleVoice(variation, 'slow')}
                                      disabled={isGenerating || cooldownRemainingSec > 0}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                                      title="Voice ngắn hơn Target: giảm nhẹ tốc độ đọc để kéo dài khớp timeline"
                                    >
                                      <Rewind className="w-3 h-3" />
                                      <span>TẠO LẠI CHẬM HƠN</span>
                                    </button>
                                    <button
                                      type="button"
                                      id={`regen-faster-btn-${videoId}`}
                                      onClick={() => handleRequestGenerateSingleVoice(variation, 'fast')}
                                      disabled={isGenerating || cooldownRemainingSec > 0}
                                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-[11px] font-medium cursor-pointer transition-all flex items-center gap-1 border border-slate-700"
                                      title="Thử tạo lại với nhịp nhanh hơn"
                                    >
                                      <FastForward className="w-3 h-3 text-slate-400" />
                                      <span>TẠO LẠI NHANH HƠN</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 8. VOICE QC CARD */}
                          {voiceQc && (
                            <div className="pt-3 border-t border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                                    Voice QC Result:
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      voiceQc.status === 'VOICE QC PASS'
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                                        : voiceQc.status === 'VOICE QC REVIEW'
                                        ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                                        : 'bg-red-950 text-red-300 border border-red-600/40'
                                    }`}
                                  >
                                    {voiceQc.status} ({voiceQc.score}/100)
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setExpandedQcMap((prev) => ({ ...prev, [videoId]: !prev[videoId] }))}
                                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-medium"
                                >
                                  <span>{isQcExpanded ? 'Thu gọn tiêu chí' : 'Xem chi tiết tiêu chí QC'}</span>
                                  {isQcExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              <p className="text-[11px] text-slate-400 italic">
                                {voiceQc.summary}
                              </p>

                              {/* Detailed QC Criteria List */}
                              {isQcExpanded && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
                                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-slate-300 block">1. Đọc đầy đủ kịch bản:</span>
                                    <span className="text-slate-400">{voiceQc.fullScriptRead.note}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-slate-300 block">2. Không thêm bớt câu:</span>
                                    <span className="text-slate-400">{voiceQc.noAddedOrDroppedSentences.note}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-slate-300 block">3. Tốc độ &amp; Nhịp điệu:</span>
                                    <span className="text-slate-400">{voiceQc.pacingAndSpeed.note}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-slate-300 block">4. Khoảng nghỉ ngắt câu:</span>
                                    <span className="text-slate-400">{voiceQc.naturalPauses.note}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-slate-300 block">5. Âm lượng chuẩn hóa:</span>
                                    <span className="text-slate-400">{voiceQc.volumeLevels.note}</span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-slate-300 block">6. Phát âm thương hiệu:</span>
                                    <span className="text-slate-400">{voiceQc.brandPronunciation.note}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Not Created or Generating / Rate Limit / Failed CTA */}
                      {!isReady && (
                        <div className="space-y-3">
                          {/* Rate Limit Wait Notice */}
                          {isRateLimitWait && (
                            <div className="p-3.5 bg-amber-950/50 border border-amber-500/70 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
                              <div className="flex items-center gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <div>
                                  <strong className="block text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                                    GEMINI TTS ĐANG GIỚI HẠN TẦN SUẤT (429)
                                  </strong>
                                  <span className="text-slate-300 text-[11px]">
                                    {cooldownRemainingSec > 0
                                      ? `Đang tạm dừng bảo vệ quota (${cooldownRemainingSec}s). Bạn có thể thử lại sau hoặc chuyển sang Vbee ngay.`
                                      : 'Đã hoàn tất thời gian chờ. Bạn có thể bấm Thử lại hoặc chuyển sang Vbee.'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleRequestGenerateSingleVoice(variation)}
                                  disabled={cooldownRemainingSec > 0}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>THỬ LẠI {cooldownRemainingSec > 0 ? `(${cooldownRemainingSec}s)` : ''}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEngine('VBEE_MANUAL')}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>CHUYỂN SANG VBEE</span>
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              id={`create-voice-btn-${videoId}`}
                              onClick={() => handleRequestGenerateSingleVoice(variation)}
                              disabled={isGenerating || cooldownRemainingSec > 0}
                              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20 uppercase tracking-wider"
                            >
                              {isGenerating ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>ĐANG TẠO VOICE...</span>
                                </>
                              ) : cooldownRemainingSec > 0 && isRateLimitWait ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 animate-spin" />
                                  <span>ĐANG CHỜ COOLDOWN ({cooldownRemainingSec}s)...</span>
                                </>
                              ) : (
                                <>
                                  <Mic className="w-3.5 h-3.5" />
                                  <span>TẠO VOICE (GEMINI TTS)</span>
                                </>
                              )}
                            </button>

                            {isFailed && audioItem?.error && (
                              <span className="text-xs text-red-400 font-medium">
                                {audioItem.error}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* VBEE MANUAL WORKFLOW */
                    <div className="space-y-3 p-4 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Vbee Manual Audio Upload</span>
                        </div>
                        <CopyButton text={variation.voiceScript} label="Copy for Vbee" />
                      </div>

                      <p className="text-[11px] text-slate-400">
                        1. Nhấn <strong>"Copy for Vbee"</strong> để sao chép kịch bản sang Vbee AI.<br />
                        2. Tạo voice trên Vbee và tải tệp audio (.mp3, .wav, .m4a) vào ô bên dưới.
                      </p>

                      {/* Drag & Drop Upload Zone */}
                      <div
                        onDragOver={(e: DragEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          setDragOverId(videoId);
                        }}
                        onDragLeave={() => setDragOverId(null)}
                        onDrop={(e: DragEvent<HTMLDivElement>) => {
                          e.preventDefault();
                          setDragOverId(null);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleRequestFileUpload(videoId, variation, e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                          dragOverId === videoId
                            ? 'border-amber-400 bg-amber-950/20'
                            : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                        }`}
                      >
                        <input
                          type="file"
                          id={`vbee-upload-${videoId}`}
                          accept="audio/*"
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            if (e.target.files && e.target.files[0]) {
                              handleRequestFileUpload(videoId, variation, e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`vbee-upload-${videoId}`}
                          className="cursor-pointer block space-y-1.5"
                        >
                          <FileAudio className="w-6 h-6 mx-auto text-amber-400" />
                          <div className="text-xs font-bold text-slate-200">
                            Kéo thả hoặc nhấn để tải tệp Audio Vbee (.mp3, .wav)
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Tự động đo thời lượng và thực hiện Duration Check &amp; Voice QC
                          </div>
                        </label>
                      </div>

                      {/* Audio Controls if uploaded */}
                      {isReady && audioItem?.audioUrl && (
                        <div className="pt-3 border-t border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleTogglePlayAudio(videoId, audioItem.audioUrl!)}
                                className="w-8 h-8 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center cursor-pointer shadow"
                              >
                                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                              </button>
                              <div>
                                <span className="text-xs font-bold text-white block">File audio Vbee đã tải lên</span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Thời lượng: {actualDurationSec.toFixed(1)}s (Target: {targetDurationSec}s)
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleApproveVoice(videoId)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isVoiceApproved
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isVoiceApproved ? 'ĐÃ DUYỆT VOICE' : 'DUYỆT VOICE'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 10. AUDIO BANK REPOSITORY */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-emerald-400" />
              <span>10. AUDIO BANK REPOSITORY (KHO AUDIO ĐÃ TẠO)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Quản lý kho Audio Voice-over liên kết Product ID, Video ID, Script Version, Voice Profile và Duration.
            </p>
          </div>

          {approvedAudiosCount > 0 && (
            <button
              type="button"
              id="download-all-approved-btn"
              onClick={handleDownloadAllApproved}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TẢI TẤT CẢ AUDIO ĐÃ DUYỆT ({approvedAudiosCount})</span>
            </button>
          )}
        </div>

        {Object.keys(audioBank).length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs space-y-1">
            <FileAudio className="w-7 h-7 mx-auto text-slate-600 mb-2" />
            <p>Chưa có file audio nào trong Audio Bank.</p>
            <p className="text-[11px] text-slate-600">Chọn kịch bản SCRIPT APPROVED ở trên và nhấn [TẠO VOICE].</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-wider bg-slate-900/50">
                  <th className="py-2.5 px-3">Video ID</th>
                  <th className="py-2.5 px-3">Sales Angle</th>
                  <th className="py-2.5 px-3">Voice Profile</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Engine</th>
                  <th className="py-2.5 px-3">Voice QC</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(Object.values(audioBank) as AudioBankItem[]).map((item) => (
                  <tr key={item.videoId} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">
                      {item.videoId}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-200">
                      {item.salesAngle}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {item.voiceProfile.gender === 'male' ? 'Nam' : 'Nữ'} • {item.voiceProfile.style}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="text-white font-bold">{item.duration.toFixed(1)}s</span>
                      <span className="text-slate-500 text-[10px] block">Target: {item.targetDuration}s</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {item.engine}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {item.voiceQc ? (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            item.voiceQc.status === 'VOICE QC PASS'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-700/40'
                          }`}
                        >
                          {item.voiceQc.status}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {item.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>VOICE APPROVED</span>
                        </span>
                      ) : item.voiceStatus === 'READY' ? (
                        <span className="text-blue-400 text-[10px] font-bold">READY</span>
                      ) : item.voiceStatus === 'GENERATING' ? (
                        <span className="text-indigo-400 text-[10px] font-bold animate-pulse">GENERATING</span>
                      ) : (
                        <span className="text-red-400 text-[10px] font-bold">FAILED</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.audioUrl && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePlayAudio(item.videoId, item.audioUrl!)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
                            title="Nghe"
                          >
                            {activePlayingId === item.videoId ? (
                              <Pause className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-blue-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadAudio(item)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer"
                            title="Tải audio"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Future Pipeline Notice */}
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Quy tắc luồng sản xuất:</strong> Chỉ những Audio có trạng thái <strong className="text-emerald-400">VOICE APPROVED</strong> mới được phép chuyển sang module <strong>VIDEO BUILDER</strong> ở phiên bản tiếp theo.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IMMUTABLE ASSET CONFIRMATION MODAL (WHEN USER CLICKS REGENERATE ON APPROVED VOICE) */}
      {/* ========================================================================= */}
      {unlockConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-600/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>XÁC NHẬN MỞ KHÓA &amp; TẠO LẠI VOICE</span>
                </h4>
                <p className="text-xs text-amber-400 font-semibold">
                  Cơ chế bảo vệ tài sản khóa (Immutable Approved Asset Lock)
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Bản Voice của <strong className="text-blue-400 font-mono">[{unlockConfirmItem.variation.id}]</strong> hiện đang có trạng thái <strong className="text-emerald-400">VOICE APPROVED</strong> với điểm Voice QC: <strong className="text-white">{audioBank[unlockConfirmItem.variation.id]?.voiceQc?.score || 96}/100</strong>.
              </p>
              <p className="text-slate-400">
                Tác vụ này sẽ <strong>hủy trạng thái phê duyệt</strong> và tạo lại một bản Voice mới thay thế bản đã duyệt hiện tại.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnlockConfirmItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy (Giữ nguyên bản đã duyệt)
              </button>
              <button
                type="button"
                onClick={() => {
                  const { variation, customSpeed } = unlockConfirmItem;
                  setUnlockConfirmItem(null);
                  executeGenerateSingleVoice(variation, customSpeed, true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-600/30"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Xác nhận Mở khóa &amp; Tạo lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IMMUTABLE ASSET CONFIRMATION MODAL FOR MANUAL VBEE OVERWRITE */}
      {/* ========================================================================= */}
      {vbeeConfirmUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-600/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>XÁC NHẬN GHI ĐÈ FILE AUDIO VBEE</span>
                </h4>
                <p className="text-xs text-amber-400 font-semibold">
                  Cơ chế bảo vệ tài sản khóa (Immutable Approved Asset Lock)
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Bản Voice của <strong className="text-blue-400 font-mono">[{vbeeConfirmUpload.videoId}]</strong> đang có trạng thái <strong className="text-emerald-400">VOICE APPROVED</strong>.
              </p>
              <p className="text-slate-400">
                Bạn có chắc chắn muốn thay thế bằng file mới <strong>{vbeeConfirmUpload.file.name}</strong> không?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVbeeConfirmUpload(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Hủy (Giữ nguyên)
              </button>
              <button
                type="button"
                onClick={() => {
                  const { videoId, variation, file } = vbeeConfirmUpload;
                  setVbeeConfirmUpload(null);
                  executeFileUpload(videoId, variation, file);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Xác nhận Tải lên &amp; Thay thế</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
