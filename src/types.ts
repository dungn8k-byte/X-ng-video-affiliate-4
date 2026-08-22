export type PlatformType = 'TikTok' | 'Facebook Reels' | 'YouTube Shorts';
export type ConceptCount = 3 | 5 | 10;

export interface SalesAngle {
  id: string;
  title: string;
  coreInsight: string;
  angleDescription: string;
  emotionalTrigger: string;
}

export interface HookItem {
  angleId: string;
  angleTitle: string;
  visualHook: string;
  audioHook: string;
  textOnScreen: string;
  retentionTactic: string;
}

export interface VoiceScriptItem {
  angleId: string;
  angleTitle: string;
  estimatedDuration: string;
  pacing: string;
  scriptBody: string;
  visualCues: string[];
}

export interface CtaItem {
  type: string;
  script: string;
  onScreenBanner: string;
  urgencyTactic: string;
}

export interface ProductionSheetData {
  productProfile: {
    productName: string;
    category: string;
    price: string;
    keyFeaturesSummary: string;
    perceivedValue: string;
  };
  verifiedFacts: string[];
  unverifiedDoNotClaim: string[];
  targetCustomer: {
    demographics: string;
    psychographics: string;
    painPoints: string[];
    desiresAndTriggers: string[];
  };
  usp: {
    primaryUsp: string;
    secondaryUsps: string[];
    comparisonAdvantage: string;
  };
  salesAngles: SalesAngle[];
  hooks: HookItem[];
  voiceScripts: VoiceScriptItem[];
  cta: CtaItem[];
  s001HeroPrompt: {
    promptEn: string;
    promptVi: string;
    lightingAndLens: string;
    aspectRatio: string;
    negativePrompt: string;
  };
  s002DetailPrompt: {
    promptEn: string;
    promptVi: string;
    focalPoint: string;
    textureDetails: string;
    negativePrompt: string;
  };
  s003LifestyleImagePrompt: {
    promptEn: string;
    promptVi: string;
    environment: string;
    fidelityRule: string;
    negativePrompt: string;
  };
  s003LifestyleVideoPrompt: {
    promptEn: string;
    promptVi: string;
    cameraMovement: string;
    actionDescription: string;
    toolRecommendation: string;
  };
  fidelityWarning: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    warningMessage: string;
    recommendedTechnique: string;
  };
  qcChecklist: {
    checkItem: string;
    whyItMatters: string;
    statusDefault: boolean;
  }[];
  generatedAt: string;
  platform: PlatformType;
}

export interface AnalyzeRequest {
  image?: {
    mimeType: string;
    data: string; // base64 without prefix
  } | null;
  productName: string;
  currentPrice: string;
  description: string;
  targetAudience: string;
  platform: PlatformType;
  conceptCount: ConceptCount;
}

export type AssetStatus = 'IDLE' | 'GENERATING' | 'COMPLETED' | 'ERROR';

export type QcCriterionStatus = 'PASS' | 'REVIEW' | 'FAIL';
export type QcOverallStatus = 'PASS' | 'REVIEW' | 'FAIL';

export interface QcCriterionResult {
  score: number; // 0 - 100 (or 0 - 10)
  note: string;
  status: QcCriterionStatus;
}

export interface QcEvaluation {
  status: QcOverallStatus;
  score: number; // Overall FIDELITY SCORE: 0 - 100 (90-100: PASS, 80-89: REVIEW, 0-79: FAIL)
  colorFidelity: QcCriterionResult;
  shapeFidelity: QcCriterionResult;
  proportionFidelity: QcCriterionResult;
  logoFidelity: QcCriterionResult;
  detailFidelity: QcCriterionResult;
  partsCountFidelity: QcCriterionResult;
  noHallucinatedDetails: QcCriterionResult;
  summary: string;
  verdictReason: string;
  hasCriticalMismatch?: boolean;
  criticalMismatchDetails?: string;
  isHumanApproved?: boolean;
}

export interface AssetItemState {
  id: 'S001' | 'S002' | 'S003';
  title: string;
  subtitle: string;
  prompt: string;
  status: AssetStatus;
  mediaType: 'video' | 'image';
  mediaUrl: string | null;
  downloadUrl?: string | null;
  qcResult: QcEvaluation | null;
  error?: string | null;
  duration?: string;
  aspectRatio?: string;
}

export interface S003LifestyleState {
  id: 'S003';
  title: string;
  subtitle: string;
  stage1Image: {
    prompt: string;
    status: AssetStatus;
    imageUrl: string | null;
    qcResult: QcEvaluation | null;
    isApproved: boolean;
    error?: string | null;
  };
  stage2Video: {
    prompt: string;
    status: AssetStatus;
    videoUrl: string | null;
    qcResult: QcEvaluation | null;
    error?: string | null;
  };
}

export type VideoVariationCount = 3 | 5 | 10;

export type ClaimStatus = 'VERIFIED' | 'INFERRED' | 'UNVERIFIED' | 'PROHIBITED';

export interface ContentQcClaim {
  claim: string;
  source: string; // e.g. "Product Data", "Image / Visual", "User Input", "No evidence", "Prohibited fake experience"
  status: ClaimStatus;
  note?: string;
}

export type ContentQcStatus = 'PASS' | 'REVIEW' | 'FAIL';

export interface ContentQcEvaluation {
  status: ContentQcStatus;
  score: number; // 0 - 100
  breakdown: {
    factualAccuracy: number; // Max 40
    noFakeExperience: number; // Max 25
    claimSafety: number; // Max 20
    naturalLanguage: number; // Max 10
    ctaAccuracy: number; // Max 5
  };
  hasFakePersonalExperience: boolean;
  claims: ContentQcClaim[];
  feedback: string;
}

export interface TimelineSegment {
  timeRange: string; // e.g. "00:00 - 00:03"
  shotId: 'S001' | 'S002' | 'S003';
  shotTitle: string; // e.g. "S001 Hero Shot"
  visualAction: string; // e.g. "Toàn cảnh góc nghiêng 45° zoom nhẹ vào mũi giày và nơ da"
}

export interface OnScreenTextItem {
  hookText: string;
  benefitText: string;
  ctaText: string;
}

export interface EditingInstructions {
  scenes: string;
  cutsAndTransitions: string;
  textPlacement: string;
  captions: string;
  musicMood: string;
  audioMix: string;
}

export interface VideoVariation {
  id: string; // e.g. "P001_V01"
  salesAngle: string; // e.g. "PRICE / VALUE", "CURIOSITY", "PRODUCT DETAIL", "STYLE / USE CASE", "NATURAL PRODUCT INTRODUCTION"
  salesAngleDesc: string;
  hook: string; // Hook 1-3s
  voiceScript: string; // Voice-over script in natural Vietnamese (15-25s, format for Vbee AI)
  estimatedDuration: string; // e.g. "18s"
  timeline: TimelineSegment[];
  onScreenText: OnScreenTextItem;
  cta: string;
  editingInstructions: EditingInstructions;
  requiresPriceCheck: boolean;
  isApproved: boolean;
  contentQc?: ContentQcEvaluation;
}

export interface AssetReadinessState {
  s001Ready: boolean;
  s001Status: AssetStatus;
  s001Approved: boolean;
  s002Ready: boolean;
  s002Status: AssetStatus;
  s002Approved: boolean;
  s003Ready: boolean;
  s003Status: AssetStatus;
  s003Approved: boolean;
}

// ==========================================
// MODULE: VOICE FACTORY (VERSION 4.0)
// ==========================================

export type VoiceEngineType =
  | 'GEMINI_2_5_FLASH_TTS'
  | 'GEMINI_3_1_FLASH_TTS'
  | 'GEMINI_TTS'
  | 'VBEE_MANUAL';

export type VoiceGender = 'female' | 'male';

export type VoiceStyle =
  | 'natural'
  | 'youthful'
  | 'energetic'
  | 'gentle'
  | 'trustworthy'
  | 'natural_review'
  | 'soft_sell';

export type VoiceSpeed = 'slow' | 'medium' | 'fast';

export interface VoiceProfile {
  gender: VoiceGender;
  style: VoiceStyle;
  speed: VoiceSpeed;
  geminiVoiceName?: string; // 'Kore' | 'Aoede' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir'
}

export type VoiceStatus =
  | 'NOT_CREATED'
  | 'QUEUED'
  | 'GENERATING'
  | 'RATE_LIMIT_WAIT'
  | 'RETRY_REQUIRED'
  | 'READY'
  | 'FAILED';

export type VoiceQcOverallStatus = 'VOICE QC PASS' | 'VOICE QC REVIEW' | 'VOICE QC FAIL';

export interface VoiceQcItem {
  status: 'PASS' | 'REVIEW' | 'FAIL';
  note: string;
}

export interface VoiceQcEvaluation {
  status: VoiceQcOverallStatus;
  score: number; // 0 - 100
  durationStatus: 'DURATION PASS' | 'DURATION MISMATCH';
  diffSec: number;
  fullScriptRead: VoiceQcItem;
  noAddedOrDroppedSentences: VoiceQcItem;
  pacingAndSpeed: VoiceQcItem;
  naturalPauses: VoiceQcItem;
  volumeLevels: VoiceQcItem;
  brandPronunciation: VoiceQcItem;
  durationAlignment: VoiceQcItem;
  summary: string;
}

export interface AudioBankItem {
  productId: string;
  videoId: string; // e.g. "P001_V01"
  scriptVersion: string; // e.g. "v1.0 (SCRIPT APPROVED)"
  salesAngle: string;
  voiceProfile: VoiceProfile;
  engine: VoiceEngineType;
  voiceStatus: VoiceStatus;
  audioUrl: string | null;
  duration: number; // Actual measured duration in seconds
  targetDuration: number; // Target timeline duration in seconds
  durationStatus: 'DURATION PASS' | 'DURATION MISMATCH';
  voiceDirection: string;
  voiceQc: VoiceQcEvaluation | null;
  isApproved: boolean; // Human approved -> "VOICE APPROVED"
  approvedAt?: string | null;
  createdAt: string;
  error?: string | null;
  retryAttempt?: number;
  maxRetries?: number;
  cooldownSec?: number;
}

export interface VoiceQueueItem {
  videoId: string;
  status: VoiceStatus;
  retryCount: number;
  maxRetries?: number;
  cooldownSec?: number;
  error?: string | null;
}

// ==========================================
// MODULE: PROJECT & SESSION RESTORATION (VERSION 4.0)
// ==========================================

export interface RestoredAssetBank {
  s001: {
    videoUrl: string | null;
    qcResult: QcEvaluation | null;
    isApproved: boolean;
  };
  s002: {
    videoUrl: string | null;
    qcResult: QcEvaluation | null;
    isApproved: boolean;
  };
  s003: {
    imageUrl: string | null;
    videoUrl: string | null;
    imageQcResult: QcEvaluation | null;
    videoQcResult: QcEvaluation | null;
    isApproved: boolean;
  };
}

export interface ProductionProject {
  id: string; // e.g. "P001"
  name: string;
  category: string;
  price: string;
  verifiedPrice: string;
  description: string;
  targetAudience: string;
  platform: PlatformType;
  conceptCount: ConceptCount;
  imageData: {
    mimeType: string;
    data: string;
    previewUrl: string;
  } | null;
  productionSheet: ProductionSheetData;
  assetState: AssetReadinessState;
  restoredAssets: RestoredAssetBank;
  variations: VideoVariation[];
  audioBank?: Record<string, AudioBankItem>;
  status: 'COMPLETED_STAGE_4' | 'IN_PROGRESS' | 'COMPLETED';
  lastModified: string;
  createdAt: string;
  totalScriptsApproved: number;
  assetsReadyCount: number;
}


