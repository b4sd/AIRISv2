/**
 * TTS Controller Tests
 * Tests for the Text-to-Speech controller functionality
 */

import { TTSController } from '../TTSController';

// Mock SpeechSynthesis API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => [
    {
      voiceURI: 'test-vi-voice',
      name: 'Vietnamese Voice',
      lang: 'vi-VN',
      localService: true,
      default: false,
    },
    {
      voiceURI: 'test-en-voice',
      name: 'English Voice',
      lang: 'en-US',
      localService: true,
      default: true,
    },
  ]),
};

const mockUtterance = {
  text: '',
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: '',
  voice: null,
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onboundary: null,
};

// Mock Web Audio API for AudioFeedback
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    type: 'sine',
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
};

// Setup global mocks
Object.defineProperty(window, 'speechSynthesis', {
  value: mockSpeechSynthesis,
  writable: true,
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  value: jest.fn().mockImplementation((text) => ({
    ...mockUtterance,
    text,
  })),
  writable: true,
});

Object.defineProperty(window, 'AudioContext', {
  value: jest.fn().mockImplementation(() => mockAudioContext),
  writable: true,
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: jest.fn().mockImplementation(() => mockAudioContext),
  writable: true,
});

describe('TTSController', () => {
  let ttsController: TTSController;

  beforeEach(() => {
    jest.clearAllMocks();
    ttsController = new TTSController();
  });

  afterEach(() => {
    if (ttsController) {
      ttsController.destroy();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default settings', () => {
      const settings = ttsController.getSettings();
      expect(settings.rate).toBe(1.0);
      expect(settings.volume).toBe(0.8);
      expect(settings.language).toBe('vi-VN');
    });

    test('should load available voices', () => {
      const voices = ttsController.getAvailableVoices();
      expect(voices).toHaveLength(2);
      expect(voices[0].lang).toBe('vi-VN');
    });

    test('should identify Vietnamese voices', () => {
      const vietnameseVoices = ttsController.getVietnameseVoices();
      expect(vietnameseVoices).toHaveLength(1);
      expect(vietnameseVoices[0].name).toBe('Vietnamese Voice');
    });
  });

  describe('Basic TTS Operations', () => {
    test('should speak text', async () => {
      const text = 'Xin chào, đây là kiểm tra TTS';

      // Mock the utterance events
      const utterancePromise = ttsController.speak(text);

      // Simulate successful speech
      const utteranceInstance = (window.SpeechSynthesisUtterance as jest.Mock)
        .mock.results[0].value;
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }

      await utterancePromise;

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(ttsController.isReading()).toBe(false); // Should be false after completion
    });

    test('should handle pause and resume', async () => {
      const text = 'Test text for pause and resume';

      // Start speaking
      const utterancePromise = ttsController.speak(text);
      const utteranceInstance = (window.SpeechSynthesisUtterance as jest.Mock)
        .mock.results[0].value;

      // Simulate start
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }

      expect(ttsController.isReading()).toBe(true);

      // Test pause
      ttsController.pause();
      if (utteranceInstance.onpause) {
        utteranceInstance.onpause();
      }

      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
      expect(ttsController.isPaused()).toBe(true);

      // Test resume
      ttsController.resume();
      if (utteranceInstance.onresume) {
        utteranceInstance.onresume();
      }

      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
      expect(ttsController.isPaused()).toBe(false);

      // Complete the speech
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }

      await utterancePromise;
    });

    test('should stop reading', async () => {
      const text = 'Test text for stopping';

      // Start speaking
      const utterancePromise = ttsController.speak(text);
      const utteranceInstance = (window.SpeechSynthesisUtterance as jest.Mock)
        .mock.results[0].value;

      // Simulate start
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }

      expect(ttsController.isReading()).toBe(true);

      // Stop
      ttsController.stop();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(ttsController.isReading()).toBe(false);

      // Complete the promise to avoid hanging
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }

      await utterancePromise;
    });
  });

  describe('Settings Management', () => {
    test('should update rate setting', async () => {
      await ttsController.adjustRate(1.5);

      const settings = ttsController.getSettings();
      expect(settings.rate).toBe(1.5);
    });

    test('should update volume setting', async () => {
      await ttsController.adjustVolume(0.5);

      const settings = ttsController.getSettings();
      expect(settings.volume).toBe(0.5);
    });

    test('should update pitch setting', async () => {
      await ttsController.adjustPitch(1.2);

      const settings = ttsController.getSettings();
      expect(settings.pitch).toBe(1.2);
    });

    test('should validate rate bounds', async () => {
      await ttsController.adjustRate(15); // Above max
      expect(ttsController.getSettings().rate).toBe(10); // Should be clamped to max

      await ttsController.adjustRate(-1); // Below min
      expect(ttsController.getSettings().rate).toBe(0.1); // Should be clamped to min
    });

    test('should increase and decrease rate', async () => {
      const initialRate = ttsController.getSettings().rate;

      await ttsController.increaseRate();
      expect(ttsController.getSettings().rate).toBe(initialRate + 0.1);

      await ttsController.decreaseRate();
      expect(ttsController.getSettings().rate).toBe(initialRate);
    });
  });

  describe('Voice Management', () => {
    test('should change voice', async () => {
      const voices = ttsController.getAvailableVoices();
      const targetVoice = voices[1]; // English voice

      await ttsController.changeVoice(targetVoice.id);

      const settings = ttsController.getSettings();
      expect(settings.voice).toBe(targetVoice.id);
    });

    test('should get current voice info', () => {
      const voiceInfo = ttsController.getCurrentVoiceInfo();
      expect(voiceInfo).toBeTruthy();
    });

    test('should get capabilities', () => {
      const capabilities = ttsController.getCapabilities();
      expect(capabilities.hasVietnameseVoices).toBe(true);
      expect(capabilities.voiceCount).toBe(2);
      expect(capabilities.maxRate).toBe(10);
      expect(capabilities.minRate).toBe(0.1);
    });
  });

  describe('Event Handling', () => {
    test('should emit events during speech', async () => {
      const startListener = jest.fn();
      const endListener = jest.fn();
      const errorListener = jest.fn();

      ttsController.addEventListener('start', startListener);
      ttsController.addEventListener('end', endListener);
      ttsController.addEventListener('error', errorListener);

      const text = 'Test text for events';
      const utterancePromise = ttsController.speak(text);
      const utteranceInstance = (window.SpeechSynthesisUtterance as jest.Mock)
        .mock.results[0].value;

      // Simulate events
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }

      await utterancePromise;

      expect(startListener).toHaveBeenCalled();
      expect(endListener).toHaveBeenCalled();
      expect(errorListener).not.toHaveBeenCalled();
    });

    test('should handle speech errors', async () => {
      const errorListener = jest.fn();
      ttsController.addEventListener('error', errorListener);

      const text = 'Test text for error';
      const utterancePromise = ttsController.speak(text).catch(() => {
        // Expected to fail
      });

      const utteranceInstance = (window.SpeechSynthesisUtterance as jest.Mock)
        .mock.results[0].value;

      // Simulate error
      if (utteranceInstance.onerror) {
        utteranceInstance.onerror({ error: 'synthesis-failed' });
      }

      await utterancePromise;

      expect(errorListener).toHaveBeenCalled();
    });

    test('should remove event listeners', async () => {
      const listener = jest.fn();

      ttsController.addEventListener('start', listener);
      ttsController.removeEventListener('start', listener);

      const text = 'Test text';
      const utterancePromise = ttsController.speak(text);
      const utteranceInstance = (window.SpeechSynthesisUtterance as jest.Mock)
        .mock.results[0].value;

      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }

      await utterancePromise;

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty text', async () => {
      await expect(ttsController.speak('')).rejects.toThrow(
        'No text provided for TTS'
      );
    });

    test('should handle invalid voice ID', async () => {
      await expect(
        ttsController.changeVoice('invalid-voice-id')
      ).rejects.toThrow('Voice not found');
    });
  });

  describe('State Management', () => {
    test('should track reading state correctly', async () => {
      expect(ttsController.isReading()).toBe(false);
      expect(ttsController.isPaused()).toBe(false);

      const text = 'Test state tracking';
      const utterancePromise = ttsController.speak(text);
      const utteranceInstance = (window.SpeechSynthesisUtterance as jest.Mock)
        .mock.results[0].value;

      // Simulate start
      if (utteranceInstance.onstart) {
        utteranceInstance.onstart();
      }

      expect(ttsController.isReading()).toBe(true);
      expect(ttsController.isPaused()).toBe(false);

      // Simulate pause
      ttsController.pause();
      if (utteranceInstance.onpause) {
        utteranceInstance.onpause();
      }

      expect(ttsController.isReading()).toBe(true);
      expect(ttsController.isPaused()).toBe(true);

      // Simulate end
      if (utteranceInstance.onend) {
        utteranceInstance.onend();
      }

      await utterancePromise;

      expect(ttsController.isReading()).toBe(false);
      expect(ttsController.isPaused()).toBe(false);
    });

    test('should get current state', () => {
      const state = ttsController.getState();
      expect(state).toHaveProperty('isReading');
      expect(state).toHaveProperty('isPaused');
      expect(state).toHaveProperty('currentText');
      expect(state).toHaveProperty('position');
    });
  });
});
