import type { AudioKey } from '../types';

let audioContext: AudioContext | null = null;
const audioBuffers: Partial<Record<AudioKey, AudioBuffer>> = {};

const initAudioContext = () => {
  if (!audioContext) {
    // For broader compatibility
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Resume context if it's in a suspended state (required by modern browsers)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }
};

// Helper to decode base64 audio data into an ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64.split(',')[1]);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// Base64 encoded 8-bit "coin" sound for blinking
const audioSources: Record<AudioKey, string> = {
  blink: 'data:audio/wav;base64,UklGRlAAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUEAAAAAgMzM/v//MzP/v//MzP/v//MzP/v//AAAAAAA',
  angry: 'data:audio/wav;base64,UklGRlQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVwAAACAgIAAgP+A/4D/gACAgIAAgP+A/4D/gACAgIAAgP+A/4D/gACAgIAAgP+A/4D/gACAgIAAgP+A/4D/gACAgIAAgP+A/4D/gACAgIAA',
};

/**
 * Preloads all audio sources defined in `audioSources`.
 * This should be called once, ideally after a user interaction.
 */
export const preloadSounds = async () => {
  initAudioContext();
  if (!audioContext) {
    console.error("AudioContext could not be initialized.");
    return;
  }

  const promises = (Object.keys(audioSources) as AudioKey[]).map(async (key) => {
    if (!audioBuffers[key]) {
      try {
        const arrayBuffer = base64ToArrayBuffer(audioSources[key]);
        const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
        audioBuffers[key] = audioBuffer;
      } catch (error) {
        console.error(`Failed to decode audio for key: ${key}`, error);
      }
    }
  });

  await Promise.all(promises);
};

/**
 * Plays the sound associated with the given key.
 * @param key The key of the sound to play.
 */
export const playSound = (key: AudioKey) => {
  initAudioContext(); // Ensure context is running
  if (!audioContext || !audioBuffers[key]) {
    return;
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffers[key]!;
  source.connect(audioContext.destination);
  source.start(0);
};