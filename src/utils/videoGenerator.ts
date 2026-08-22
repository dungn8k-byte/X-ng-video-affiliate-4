/**
 * High-Fidelity 9:16 Video Synthesis Engine for Affiliate Product Assets
 * Generates 9:16 vertical videos (8 seconds) with cinematic camera movement,
 * macro zoom/pan, and ambient lighting while strictly preserving product fidelity.
 */

export interface RenderVideoOptions {
  imageSrc: string;
  shotType: 'S001' | 'S002' | 'S003';
  durationSeconds?: number;
  fps?: number;
  width?: number;
  height?: number;
  onProgress?: (progress: number) => void;
}

export interface GeneratedVideoResult {
  videoUrl: string;
  videoBlob: Blob;
  snapshotBase64: string; // Base64 JPEG for Gemini QC inspection
  durationSeconds: number;
}

export async function renderProductVideo(
  options: RenderVideoOptions
): Promise<GeneratedVideoResult> {
  const {
    imageSrc,
    shotType,
    durationSeconds = 8,
    fps = 30,
    width = 720,
    height = 1280, // 9:16 vertical
    onProgress,
  } = options;

  // Load the reference product image
  const img = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas 2D context is not supported.');
  }

  // Set up MediaRecorder stream
  const stream = canvas.captureStream(fps);
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }
    }
  }

  const recordedChunks: Blob[] = [];
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  const totalFrames = durationSeconds * fps;
  let snapshotBase64 = '';

  return new Promise<GeneratedVideoResult>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      resolve({
        videoUrl,
        videoBlob: blob,
        snapshotBase64,
        durationSeconds,
      });
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    recorder.start();

    let currentFrame = 0;

    function renderFrame() {
      if (currentFrame >= totalFrames) {
        recorder.stop();
        return;
      }

      const progress = currentFrame / totalFrames;
      if (onProgress) {
        onProgress(Math.min(0.99, progress));
      }

      // Draw background
      drawBackground(ctx!, width, height, shotType, progress);

      // Draw product with specific cinematic motion
      drawProductMotion(ctx!, img, width, height, shotType, progress);

      // Capture middle frame for Gemini QC evaluation
      if (currentFrame === Math.floor(totalFrames / 2) && !snapshotBase64) {
        snapshotBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1] || '';
      }

      currentFrame++;
      requestAnimationFrame(renderFrame);
    }

    renderFrame();
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không thể tải ảnh sản phẩm gốc để tạo video.'));
    img.src = src;
  });
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shotType: 'S001' | 'S002' | 'S003',
  progress: number
) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (shotType === 'S001') {
    // S001 Hero Shot: Premium Dark Studio Backdrop with subtle dynamic spotlight
    const spotX = width * 0.5 + Math.sin(progress * Math.PI * 2) * 30;
    const spotY = height * 0.45 + Math.cos(progress * Math.PI * 2) * 20;

    const grad = ctx.createRadialGradient(spotX, spotY, 80, width * 0.5, height * 0.5, height * 0.75);
    grad.addColorStop(0, '#1e293b'); // slate-800
    grad.addColorStop(0.5, '#0f172a'); // slate-900
    grad.addColorStop(1, '#020617'); // slate-950

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle pedestal shadow at bottom
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.72, width * 0.35, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.filter = 'blur(12px)';
    ctx.fill();
    ctx.restore();
  } else if (shotType === 'S002') {
    // S002 Detail Shot: Neutral Clean Background with smooth ambient depth
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1e2f');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Cinematic light streak
    const streakX = -width + progress * (width * 3);
    const lightGrad = ctx.createLinearGradient(streakX, 0, streakX + 250, height);
    lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    lightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
    lightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // S003 Lifestyle: Dynamic atmospheric ambient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#111827');
    grad.addColorStop(0.6, '#1f2937');
    grad.addColorStop(1, '#030712');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warm ambient light glow
    const glowY = height * 0.3 + Math.sin(progress * Math.PI) * 40;
    const glow = ctx.createRadialGradient(width * 0.7, glowY, 40, width * 0.7, glowY, 350);
    glow.addColorStop(0, 'rgba(251, 146, 60, 0.08)'); // orange warmth
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawProductMotion(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  shotType: 'S001' | 'S002' | 'S003',
  progress: number
) {
  const imgAspect = img.width / img.height;
  const targetWidth = width * 0.75;
  const targetHeight = targetWidth / imgAspect;

  ctx.save();

  if (shotType === 'S001') {
    // S001 Hero Shot: Slow cinematic push-in (zoom 1.0 -> 1.15)
    // Product strictly stationary in place, only camera pushes in smoothly
    const easeProgress = easeInOutCubic(progress);
    const scale = 1.0 + easeProgress * 0.16;

    const centerX = width * 0.5;
    const centerY = height * 0.48;

    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // Draw original unmodified product
    ctx.drawImage(
      img,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
  } else if (shotType === 'S002') {
    // S002 Detail Shot: Macro close-up with slow cinematic pan
    // High zoom (1.5x) scanning from top details to core features
    const easeProgress = easeInOutSine(progress);
    const scale = 1.45 + Math.sin(progress * Math.PI) * 0.08;

    // Pan across product key details
    const panX = (Math.sin(easeProgress * Math.PI) - 0.5) * (width * 0.12);
    const panY = (easeProgress - 0.5) * (height * 0.08);

    const centerX = width * 0.5 + panX;
    const centerY = height * 0.46 + panY;

    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    ctx.drawImage(
      img,
      -targetWidth / 2,
      -targetHeight / 2,
      targetWidth,
      targetHeight
    );
  } else {
    // S003 Lifestyle: Slow camera push-in, slow pan, subtle parallax (Product strictly static within scene)
    const easeProgress = easeInOutSine(progress);
    const scale = 1.0 + easeProgress * 0.08; // Smooth 1.0 -> 1.08 camera push-in
    const panX = (easeProgress - 0.5) * (width * 0.035); // Subtle slow pan
    const panY = (easeProgress - 0.5) * (height * 0.02);

    const centerX = width * 0.5 + panX;
    const centerY = height * 0.5 + panY;

    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    // If the input image is already a 9:16 vertical image, render full frame
    const isVertical916 = Math.abs(imgAspect - 9 / 16) < 0.15;
    if (isVertical916) {
      ctx.drawImage(img, -width / 2, -height / 2, width, height);
    } else {
      ctx.drawImage(
        img,
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight
      );
    }
  }

  ctx.restore();
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}
