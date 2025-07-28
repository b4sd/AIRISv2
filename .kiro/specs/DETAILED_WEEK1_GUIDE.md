# Week 1 Detailed Implementation Guide

## 📋 **Current Status & Goals**

- ✅ Frontend: 9/22 tasks complete (41%)
- ✅ Backend: 1/20 tasks complete (5%)
- 🎯 **Week 1 Goal**: Complete Frontend Task 8 (TTS) + Backend Task 2 (Infrastructure)

---

## 🚀 **Day 1-2: Frontend Task 8 - Text-to-Speech Implementation**

### **Step 1: Create TTS Service Structure**

```bash
# Execute these commands in the frontend directory
mkdir -p frontend/src/services/tts
touch frontend/src/services/tts/ReadingEngine.ts
touch frontend/src/services/tts/TTSController.ts
touch frontend/src/services/tts/VoiceManager.ts
touch frontend/src/services/tts/types.ts
```

### **Step 2: Define TTS Types**

**Create: `frontend/src/services/tts/types.ts`**

```typescript
export interface TTSVoice {
  id: string;
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export interface TTSSettings {
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
  voice: string; // voice ID
  language: string; // 'vi-VN' or 'en-US'
}

export interface ReadingPosition {
  page: number;
  chapter: string;
  characterOffset: number;
  percentage: number;
  timestamp: Date;
}

export interface ReadingState {
  isReading: boolean;
  isPaused: boolean;
  currentText: string;
  position: ReadingPosition;
  totalDuration: number;
  currentTime: number;
}

export interface TTSEvent {
  type: "start" | "end" | "pause" | "resume" | "boundary" | "error";
  data?: any;
  timestamp: Date;
}
```

### **Step 3: Implement Voice Manager**

**Create: `frontend/src/services/tts/VoiceManager.ts`**

```typescript
import { TTSVoice, TTSSettings } from "./types";

export class VoiceManager {
  private voices: TTSVoice[] = [];
  private defaultSettings: TTSSettings = {
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: "",
    language: "vi-VN",
  };

  constructor() {
    this.initializeVoices();
  }

  private async initializeVoices(): Promise<void> {
    // Wait for voices to be loaded
    if (speechSynthesis.getVoices().length === 0) {
      await new Promise((resolve) => {
        speechSynthesis.addEventListener("voiceschanged", resolve, {
          once: true,
        });
      });
    }

    const systemVoices = speechSynthesis.getVoices();
    this.voices = systemVoices.map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default,
    }));

    // Set default Vietnamese voice if available
    const vietnameseVoice = this.voices.find((v) => v.lang.startsWith("vi"));
    if (vietnameseVoice) {
      this.defaultSettings.voice = vietnameseVoice.id;
    }
  }

  getAvailableVoices(): TTSVoice[] {
    return this.voices;
  }

  getVietnameseVoices(): TTSVoice[] {
    return this.voices.filter((voice) => voice.lang.startsWith("vi"));
  }

  getEnglishVoices(): TTSVoice[] {
    return this.voices.filter((voice) => voice.lang.startsWith("en"));
  }

  getVoiceById(id: string): TTSVoice | undefined {
    return this.voices.find((voice) => voice.id === id);
  }

  getDefaultSettings(): TTSSettings {
    return { ...this.defaultSettings };
  }

  validateSettings(settings: Partial<TTSSettings>): TTSSettings {
    return {
      rate: Math.max(
        0.1,
        Math.min(10, settings.rate ?? this.defaultSettings.rate)
      ),
      pitch: Math.max(
        0,
        Math.min(2, settings.pitch ?? this.defaultSettings.pitch)
      ),
      volume: Math.max(
        0,
        Math.min(1, settings.volume ?? this.defaultSettings.volume)
      ),
      voice: settings.voice ?? this.defaultSettings.voice,
      language: settings.language ?? this.defaultSettings.language,
    };
  }
}
```

### **Step 4: Implement TTS Controller**

**Create: `frontend/src/services/tts/TTSController.ts`**

```typescript
import { TTSSettings, TTSEvent, ReadingState } from "./types";
import { VoiceManager } from "./VoiceManager";

export class TTSController {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceManager: VoiceManager;
  private settings: TTSSettings;
  private eventListeners: Map<string, ((event: TTSEvent) => void)[]> =
    new Map();
  private state: ReadingState = {
    isReading: false,
    isPaused: false,
    currentText: "",
    position: {
      page: 1,
      chapter: "",
      characterOffset: 0,
      percentage: 0,
      timestamp: new Date(),
    },
    totalDuration: 0,
    currentTime: 0,
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voiceManager = new VoiceManager();
    this.settings = this.voiceManager.getDefaultSettings();
  }

  // Event handling
  addEventListener(event: string, callback: (event: TTSEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(
    event: string,
    callback: (event: TTSEvent) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: TTSEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }
  }

  // Settings management
  updateSettings(newSettings: Partial<TTSSettings>): void {
    this.settings = this.voiceManager.validateSettings({
      ...this.settings,
      ...newSettings,
    });
  }

  getSettings(): TTSSettings {
    return { ...this.settings };
  }

  // Reading control
  async speak(
    text: string,
    position?: Partial<ReadingState["position"]>
  ): Promise<void> {
    if (this.state.isReading) {
      this.stop();
    }

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.setupUtterance(this.currentUtterance);

    // Update state
    this.state = {
      ...this.state,
      isReading: true,
      isPaused: false,
      currentText: text,
      position: {
        ...this.state.position,
        ...position,
        timestamp: new Date(),
      },
    };

    return new Promise((resolve, reject) => {
      if (!this.currentUtterance) {
        reject(new Error("No utterance created"));
        return;
      }

      this.currentUtterance.onend = () => {
        this.state.isReading = false;
        this.state.isPaused = false;
        this.emit({
          type: "end",
          timestamp: new Date(),
        });
        resolve();
      };

      this.currentUtterance.onerror = (event) => {
        this.state.isReading = false;
        this.state.isPaused = false;
        this.emit({
          type: "error",
          data: event.error,
          timestamp: new Date(),
        });
        reject(new Error(`TTS Error: ${event.error}`));
      };

      this.synthesis.speak(this.currentUtterance);
      this.emit({
        type: "start",
        timestamp: new Date(),
      });
    });
  }

  pause(): void {
    if (this.state.isReading && !this.state.isPaused) {
      this.synthesis.pause();
      this.state.isPaused = true;
      this.emit({
        type: "pause",
        timestamp: new Date(),
      });
    }
  }

  resume(): void {
    if (this.state.isReading && this.state.isPaused) {
      this.synthesis.resume();
      this.state.isPaused = false;
      this.emit({
        type: "resume",
        timestamp: new Date(),
      });
    }
  }

  stop(): void {
    if (this.state.isReading) {
      this.synthesis.cancel();
      this.state.isReading = false;
      this.state.isPaused = false;
      this.currentUtterance = null;
      this.emit({
        type: "end",
        timestamp: new Date(),
      });
    }
  }

  // State getters
  getState(): ReadingState {
    return { ...this.state };
  }

  isReading(): boolean {
    return this.state.isReading;
  }

  isPaused(): boolean {
    return this.state.isPaused;
  }

  // Private methods
  private setupUtterance(utterance: SpeechSynthesisUtterance): void {
    // Apply current settings
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    utterance.lang = this.settings.language;

    // Set voice if available
    const voice = this.voiceManager.getVoiceById(this.settings.voice);
    if (voice) {
      const systemVoice = speechSynthesis
        .getVoices()
        .find((v) => v.voiceURI === voice.id);
      if (systemVoice) {
        utterance.voice = systemVoice;
      }
    }

    // Add boundary event for position tracking
    utterance.onboundary = (event) => {
      this.emit({
        type: "boundary",
        data: {
          charIndex: event.charIndex,
          charLength: event.charLength,
          name: event.name,
        },
        timestamp: new Date(),
      });
    };
  }
}
```

### **Step 5: Create React Hook for TTS**

**Create: `frontend/src/hooks/useTTS.ts`**

```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import { TTSController } from "../services/tts/TTSController";
import { TTSSettings, ReadingPosition, TTSVoice } from "../services/tts/types";
import { VoiceManager } from "../services/tts/VoiceManager";

export interface UseTTSReturn {
  // State
  isReading: boolean;
  isPaused: boolean;
  currentPosition: ReadingPosition | null;
  availableVoices: TTSVoice[];
  settings: TTSSettings;

  // Actions
  readText: (text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;

  // Settings
  updateSettings: (settings: Partial<TTSSettings>) => void;
  changeVoice: (voiceId: string) => void;
  adjustRate: (rate: number) => void;
  adjustVolume: (volume: number) => void;
}

export const useTTS = (): UseTTSReturn => {
  const ttsControllerRef = useRef<TTSController | null>(null);
  const voiceManagerRef = useRef<VoiceManager | null>(null);

  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] =
    useState<ReadingPosition | null>(null);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: "",
    language: "vi-VN",
  });

  // Initialize controllers
  useEffect(() => {
    ttsControllerRef.current = new TTSController();
    voiceManagerRef.current = new VoiceManager();

    // Load initial data
    const loadInitialData = async () => {
      if (voiceManagerRef.current) {
        const voices = voiceManagerRef.current.getAvailableVoices();
        const defaultSettings = voiceManagerRef.current.getDefaultSettings();

        setAvailableVoices(voices);
        setSettings(defaultSettings);
      }
    };

    loadInitialData();

    // Set up state update interval
    const interval = setInterval(() => {
      if (ttsControllerRef.current) {
        setIsReading(ttsControllerRef.current.isReading());
        setIsPaused(ttsControllerRef.current.isPaused());
        const state = ttsControllerRef.current.getState();
        setCurrentPosition(state.position);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (ttsControllerRef.current) {
        ttsControllerRef.current.stop();
      }
    };
  }, []);

  // Actions
  const readText = useCallback(async (text: string) => {
    if (ttsControllerRef.current) {
      await ttsControllerRef.current.speak(text);
    }
  }, []);

  const pause = useCallback(() => {
    if (ttsControllerRef.current) {
      ttsControllerRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (ttsControllerRef.current) {
      ttsControllerRef.current.resume();
    }
  }, []);

  const stop = useCallback(() => {
    if (ttsControllerRef.current) {
      ttsControllerRef.current.stop();
    }
  }, []);

  // Settings
  const updateSettings = useCallback(
    (newSettings: Partial<TTSSettings>) => {
      if (ttsControllerRef.current && voiceManagerRef.current) {
        const validatedSettings = voiceManagerRef.current.validateSettings({
          ...settings,
          ...newSettings,
        });

        ttsControllerRef.current.updateSettings(validatedSettings);
        setSettings(validatedSettings);
      }
    },
    [settings]
  );

  const changeVoice = useCallback(
    (voiceId: string) => {
      updateSettings({ voice: voiceId });
    },
    [updateSettings]
  );

  const adjustRate = useCallback(
    (rate: number) => {
      updateSettings({ rate });
    },
    [updateSettings]
  );

  const adjustVolume = useCallback(
    (volume: number) => {
      updateSettings({ volume });
    },
    [updateSettings]
  );

  return {
    // State
    isReading,
    isPaused,
    currentPosition,
    availableVoices,
    settings,

    // Actions
    readText,
    pause,
    resume,
    stop,

    // Settings
    updateSettings,
    changeVoice,
    adjustRate,
    adjustVolume,
  };
};
```

### **Step 6: Create TTS UI Component**

**Create: `frontend/src/components/TTS/TTSControls.tsx`**

```typescript
import React from "react";
import { useTTS } from "../../hooks/useTTS";

interface TTSControlsProps {
  className?: string;
  text?: string;
}

export const TTSControls: React.FC<TTSControlsProps> = ({
  className = "",
  text = "",
}) => {
  const {
    isReading,
    isPaused,
    settings,
    availableVoices,
    readText,
    pause,
    resume,
    stop,
    adjustRate,
    adjustVolume,
    changeVoice,
  } = useTTS();

  const handlePlayPause = () => {
    if (isReading && !isPaused) {
      pause();
    } else if (isReading && isPaused) {
      resume();
    } else if (text) {
      readText(text);
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    adjustRate(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    adjustVolume(parseFloat(e.target.value));
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeVoice(e.target.value);
  };

  return (
    <div className={`tts-controls bg-white p-4 rounded-lg shadow ${className}`}>
      {/* Playback Controls */}
      <div className="playback-controls flex gap-2 mb-4">
        <button
          onClick={handlePlayPause}
          className="btn btn-primary flex items-center gap-2"
          disabled={!text && !isReading}
          aria-label={
            isReading && !isPaused
              ? "Pause reading"
              : isReading && isPaused
              ? "Resume reading"
              : "Start reading"
          }
        >
          {isReading && !isPaused ? (
            <>⏸️ Pause</>
          ) : isReading && isPaused ? (
            <>▶️ Resume</>
          ) : (
            <>▶️ Read Aloud</>
          )}
        </button>

        <button
          onClick={stop}
          disabled={!isReading}
          className="btn btn-secondary"
          aria-label="Stop reading"
        >
          ⏹️ Stop
        </button>
      </div>

      {/* Settings Controls */}
      <div className="settings-controls space-y-4">
        {/* Voice Selection */}
        <div className="voice-selection">
          <label
            htmlFor="voice-select"
            className="block text-sm font-medium mb-1"
          >
            Voice:
          </label>
          <select
            id="voice-select"
            value={settings.voice}
            onChange={handleVoiceChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Default Voice</option>
            {availableVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Rate Control */}
        <div className="rate-control">
          <label
            htmlFor="rate-slider"
            className="block text-sm font-medium mb-1"
          >
            Speed: {settings.rate.toFixed(1)}x
          </label>
          <input
            id="rate-slider"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.rate}
            onChange={handleRateChange}
            className="w-full"
            aria-label="Reading speed"
          />
        </div>

        {/* Volume Control */}
        <div className="volume-control">
          <label
            htmlFor="volume-slider"
            className="block text-sm font-medium mb-1"
          >
            Volume: {Math.round(settings.volume * 100)}%
          </label>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={handleVolumeChange}
            className="w-full"
            aria-label="Volume level"
          />
        </div>
      </div>

      {/* Status Display */}
      {isReading && (
        <div className="status-display mt-4 p-2 bg-blue-50 rounded">
          <div className="text-sm text-blue-700">
            {isPaused ? "⏸️ Paused" : "🔊 Reading..."}
          </div>
        </div>
      )}
    </div>
  );
};
```

### **Step 7: Integration with Voice Commands**

**Update: `frontend/src/services/voice/VoiceCommandRouter.ts`**

```typescript
// Add this to your existing VoiceCommandRouter class

import { TTSController } from "../tts/TTSController";

export class VoiceCommandRouter {
  private ttsController: TTSController;

  constructor() {
    // ... existing initialization ...
    this.ttsController = new TTSController();
  }

  async routeCommand(intent: CommandIntent): Promise<boolean> {
    const { action, parameters } = intent;

    // Handle TTS commands
    switch (action) {
      case "start_reading":
      case "read_aloud":
        return await this.handleStartReading(parameters);

      case "pause_reading":
      case "stop_reading":
        return this.handlePauseReading();

      case "resume_reading":
        return this.handleResumeReading();

      case "read_faster":
        return this.handleAdjustSpeed(0.1);

      case "read_slower":
        return this.handleAdjustSpeed(-0.1);

      default:
        // ... existing command routing ...
        break;
    }

    return false;
  }

  private async handleStartReading(parameters: any): Promise<boolean> {
    try {
      const currentText = this.getCurrentPageText();
      if (currentText) {
        await this.ttsController.speak(currentText);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to start reading:", error);
      return false;
    }
  }

  private handlePauseReading(): boolean {
    try {
      if (this.ttsController.isReading()) {
        this.ttsController.pause();
      } else {
        this.ttsController.stop();
      }
      return true;
    } catch (error) {
      console.error("Failed to pause reading:", error);
      return false;
    }
  }

  private handleResumeReading(): boolean {
    try {
      this.ttsController.resume();
      return true;
    } catch (error) {
      console.error("Failed to resume reading:", error);
      return false;
    }
  }

  private handleAdjustSpeed(adjustment: number): boolean {
    try {
      const currentSettings = this.ttsController.getSettings();
      const newRate = Math.max(
        0.5,
        Math.min(2.0, currentSettings.rate + adjustment)
      );
      this.ttsController.updateSettings({ rate: newRate });
      return true;
    } catch (error) {
      console.error("Failed to adjust speed:", error);
      return false;
    }
  }

  private getCurrentPageText(): string {
    // Get currently selected text or current page content
    const selection = window.getSelection()?.toString();
    if (selection) {
      return selection;
    }

    // Fallback to current page content
    const contentElement = document.querySelector("[data-reading-content]");
    return contentElement?.textContent || "";
  }
}
```

### **Step 8: Test TTS Implementation**

**Create: `frontend/src/services/tts/__tests__/TTSController.test.ts`**

```typescript
import { TTSController } from "../TTSController";

// Mock SpeechSynthesis
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
};

Object.defineProperty(window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
});

describe("TTSController", () => {
  let ttsController: TTSController;

  beforeEach(() => {
    ttsController = new TTSController();
    jest.clearAllMocks();
  });

  test("should initialize with default settings", () => {
    const settings = ttsController.getSettings();
    expect(settings.rate).toBe(1.0);
    expect(settings.volume).toBe(0.8);
    expect(settings.language).toBe("vi-VN");
  });

  test("should speak text", async () => {
    const text = "Hello world";
    const speakPromise = ttsController.speak(text);

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    expect(ttsController.isReading()).toBe(true);
  });

  test("should pause and resume", () => {
    ttsController.speak("Test text");

    ttsController.pause();
    expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    expect(ttsController.isPaused()).toBe(true);

    ttsController.resume();
    expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    expect(ttsController.isPaused()).toBe(false);
  });

  test("should stop reading", () => {
    ttsController.speak("Test text");

    ttsController.stop();
    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    expect(ttsController.isReading()).toBe(false);
  });
});
```

### **Step 9: Update Task Status**

```bash
# Mark Frontend Task 8 as complete
# Update the tasks.md file to show Task 8 as completed
```

---

## 🛠️ **Day 3-4: Backend Task 2 - Core Infrastructure**

### **Step 1: Initialize Backend Project**

```bash
# Create backend directory structure
mkdir -p backend/src/{controllers,services,middleware,utils,types,config}
mkdir -p backend/src/{routes,models,jobs,tests}
mkdir -p backend/prisma

cd backend
```

### **Step 2: Create Package.json**

**Create: `backend/package.json`**

```json
{
  "name": "voice-reading-backend",
  "version": "1.0.0",
  "description": "Backend API for Voice Reading App",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "fastify": "^4.24.3",
    "@fastify/cors": "^8.4.0",
    "@fastify/helmet": "^11.1.1",
    "@fastify/rate-limit": "^9.0.1",
    "@fastify/jwt": "^7.2.4",
    "@fastify/multipart": "^8.0.0",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.9.0",
    "typescript": "^5.2.2",
    "tsx": "^4.1.4",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@typescript-eslint/eslint-plugin": "^6.12.0",
    "@typescript-eslint/parser": "^6.12.0",
    "eslint": "^8.54.0"
  }
}
```

### **Step 3: Install Dependencies**

```bash
npm install
```

### **Step 4: TypeScript Configuration**

**Create: `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "removeComments": true,
    "moduleResolution": "node",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/types/*": ["types/*"],
      "@/services/*": ["services/*"],
      "@/controllers/*": ["controllers/*"],
      "@/middleware/*": ["middleware/*"],
      "@/utils/*": ["utils/*"],
      "@/config/*": ["config/*"]
    }
  },
  "include": ["src/**/*", "../shared/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### **Step 5: Environment Configuration**

**Create: `backend/src/config/env.ts`**

```typescript
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default(8000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Invalid environment variables:", error);
  process.exit(1);
}

export { env };

export const serverConfig = {
  port: env.PORT,
  host: env.HOST,
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
};

export const loggingConfig = {
  level: env.LOG_LEVEL,
};
```

### **Step 6: Logger Configuration**

**Create: `backend/src/config/logger.ts`**

```typescript
import winston from "winston";
import { loggingConfig, serverConfig } from "./env";

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: loggingConfig.level,
  format: logFormat,
  defaultMeta: {
    service: "voice-reading-api",
    environment: serverConfig.nodeEnv,
  },
  transports: [
    new winston.transports.Console({
      format: serverConfig.isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : logFormat,
    }),
  ],
});

export { logger };
```

### **Step 7: Fastify Server Setup**

**Create: `backend/src/server.ts`**

```typescript
import Fastify, { FastifyInstance } from "fastify";
import { serverConfig } from "./config/env";
import { logger } from "./config/logger";
import { registerPlugins } from "./plugins";
import { registerRoutes } from "./routes";

async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: "info",
    },
    requestIdHeader: "x-request-id",
    genReqId: () =>
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });

  // Register plugins
  await registerPlugins(server);

  // Register routes
  await registerRoutes(server);

  // Health check endpoint
  server.get("/health", async (request, reply) => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: serverConfig.nodeEnv,
    };
  });

  // Global error handler
  server.setErrorHandler(async (error, request, reply) => {
    logger.error("Unhandled error", {
      error: error.message,
      stack: error.stack,
      requestId: request.id,
      url: request.url,
      method: request.method,
    });

    const statusCode = error.statusCode || 500;
    const message = serverConfig.isDevelopment
      ? error.message
      : "Internal Server Error";

    return reply.status(statusCode).send({
      error: {
        code: error.code || "INTERNAL_ERROR",
        message,
        requestId: request.id,
        timestamp: new Date().toISOString(),
      },
    });
  });

  return server;
}

async function start() {
  try {
    const server = await createServer();

    await server.listen({
      port: serverConfig.port,
      host: serverConfig.host,
    });

    logger.info(`🚀 Server started successfully`, {
      port: serverConfig.port,
      host: serverConfig.host,
      environment: serverConfig.nodeEnv,
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

export { createServer, start };
```

### **Step 8: Plugin Registration**

**Create: `backend/src/plugins/index.ts`**

```typescript
import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { serverConfig } from "../config/env";
import { logger } from "../config/logger";

export async function registerPlugins(server: FastifyInstance) {
  // CORS
  await server.register(cors, {
    origin: serverConfig.isDevelopment
      ? ["http://localhost:3000", "http://localhost:3001"]
      : false,
    credentials: true,
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: serverConfig.isDevelopment ? false : undefined,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: "15 minutes",
  });

  // Request logging
  server.addHook("onRequest", async (request, reply) => {
    logger.info("Request received", {
      requestId: request.id,
      method: request.method,
      url: request.url,
      ip: request.ip,
    });
  });

  // Response logging
  server.addHook("onSend", async (request, reply, payload) => {
    const responseTime = reply.getResponseTime();

    logger.info("Request completed", {
      requestId: request.id,
      statusCode: reply.statusCode,
      responseTime: Math.round(responseTime),
    });

    return payload;
  });

  logger.info("✅ All plugins registered successfully");
}
```

### **Step 9: Basic Routes**

**Create: `backend/src/routes/index.ts`**

```typescript
import { FastifyInstance } from "fastify";
import { logger } from "../config/logger";

export async function registerRoutes(server: FastifyInstance) {
  // API prefix
  await server.register(
    async function (server) {
      // Basic API info endpoint
      server.get("/", async (request, reply) => {
        return {
          name: "Voice Reading API",
          version: "1.0.0",
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
        };
      });

      // Placeholder routes
      server.get("/auth/status", async (request, reply) => {
        return { message: "Auth endpoints will be implemented in Task 5" };
      });

      server.get("/books", async (request, reply) => {
        return { message: "Book endpoints will be implemented in Task 7" };
      });
    },
    { prefix: "/api/v1" }
  );

  logger.info("✅ Routes registered successfully");
}
```

### **Step 10: Testing Setup**

**Create: `backend/jest.config.js`**

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/tests/**"],
};
```

**Create: `backend/src/tests/server.test.ts`**

```typescript
import { createServer } from "../server";

describe("Server", () => {
  let server: any;

  beforeAll(async () => {
    server = await createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  test("should respond to health check", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.status).toBe("ok");
  });

  test("should respond to API info", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/v1/",
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.name).toBe("Voice Reading API");
  });
});
```

### **Step 11: Start Development Server**

```bash
# Start development server
npm run dev

# In another terminal, run tests
npm test

# Check if server is running
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/
```

---

## ✅ **Week 1 Completion Checklist**

### **Frontend Task 8: TTS Implementation**

- [ ] TTS service structure created (`types.ts`, `VoiceManager.ts`, `TTSController.ts`)
- [ ] React hook for TTS integration (`useTTS.ts`)
- [ ] UI components for TTS controls (`TTSControls.tsx`)
- [ ] Voice command integration (updated `VoiceCommandRouter.ts`)
- [ ] Tests written and passing
- [ ] TTS works with Vietnamese voices
- [ ] Voice commands can control TTS (start, pause, resume, stop, speed)

### **Backend Task 2: Infrastructure**

- [ ] Fastify server setup with TypeScript
- [ ] Environment configuration with validation
- [ ] Structured logging with Winston
- [ ] Plugin registration (CORS, security, rate limiting)
- [ ] Basic route structure
- [ ] Health check endpoint working
- [ ] Error handling middleware
- [ ] Tests written and passing
- [ ] Development server running on port 8000

### **Integration Verification**

- [ ] Frontend TTS works independently
- [ ] Backend server responds to health checks
- [ ] Both systems can run simultaneously
- [ ] Shared types are accessible from both projects
- [ ] Voice commands can control TTS functionality

---

## 🎯 **Success Criteria**

1. **Frontend TTS Complete**: Users can use voice commands "Đọc to cho tôi nghe" to start reading, "Tạm dừng" to pause, "Tiếp tục" to resume
2. **Backend Infrastructure Ready**: Server running at http://localhost:8000 with proper logging and error handling
3. **Development Environment**: Both frontend (port 3000) and backend (port 8000) running simultaneously
4. **Testing**: All tests pass for both TTS functionality and server endpoints
5. **Voice Integration**: TTS responds to Vietnamese voice commands correctly

**Next Week**: We'll implement database setup (Task 3), Redis integration (Task 4), and authentication system (Task 5) for the backend, while the frontend continues to work with the completed TTS functionality.
