/**
 * Generates valid standard WAV Audio Data URIs for offline/pre-rendered voice assets
 */

export function generateSyntheticWavAudio(
  durationSec: number = 18,
  sampleRate: number = 24000,
  pitchHz: number = 220
): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const dataSize = totalSamples * numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write string
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Generate speech-like harmonic cadence
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Modulation envelope simulating sentences and pauses
    const cadence = Math.sin(2 * Math.PI * 0.4 * t);
    const pauseGate = cadence > -0.3 ? 1 : 0.05;
    
    // Harmonic frequencies simulating human voice fundamental + formants
    const sampleVal =
      pauseGate *
      (0.45 * Math.sin(2 * Math.PI * pitchHz * t) +
        0.25 * Math.sin(2 * Math.PI * (pitchHz * 2.1) * t) +
        0.15 * Math.sin(2 * Math.PI * (pitchHz * 3.2) * t));

    // Convert float to 16-bit PCM integer (-32768 to 32767)
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767 * 0.5)));
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:audio/wav;base64,${base64}`;
}
