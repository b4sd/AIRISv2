/**
 * TTS Controls Component
 * Accessible UI for Text-to-Speech controls with keyboard shortcuts
 */

import React, { useState } from 'react';
import { useTTS } from '../../hooks/useTTS';

interface TTSControlsProps {
  className?: string;
  text?: string;
  showAdvancedControls?: boolean;
}

export const TTSControls: React.FC<TTSControlsProps> = ({
  className = '',
  text = '',
  showAdvancedControls = true,
}) => {
  const {
    isReading,
    isPaused,
    settings,
    availableVoices,
    capabilities,
    readText,
    pause,
    resume,
    stop,
    adjustRate,
    adjustVolume,
    adjustPitch,
    changeVoice,
    testCurrentVoice,
    getCurrentVoiceInfo,
    getVietnameseVoices,
    audioFeedbackSettings,
    updateAudioFeedbackSettings,
  } = useTTS();

  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handlePlayPause = async () => {
    try {
      if (isReading && !isPaused) {
        pause();
      } else if (isReading && isPaused) {
        resume();
      } else if (text) {
        await readText(text);
      }
    } catch (error) {
      console.error('TTS control error:', error);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleRateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    await adjustRate(rate);
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    await adjustVolume(volume);
  };

  const handlePitchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pitch = parseFloat(e.target.value);
    await adjustPitch(pitch);
  };

  const handleVoiceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceId = e.target.value;
    await changeVoice(voiceId);
  };

  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    try {
      await testCurrentVoice();
    } catch (error) {
      console.error('Voice test failed:', error);
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleAudioFeedbackToggle = (
    setting: keyof typeof audioFeedbackSettings
  ) => {
    updateAudioFeedbackSettings({
      [setting]: !audioFeedbackSettings[setting],
    });
  };

  const currentVoiceInfo = getCurrentVoiceInfo();
  const vietnameseVoices = getVietnameseVoices();

  return (
    <div
      className={`tts-controls rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      {/* Main Controls */}
      <div className="main-controls mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            disabled={!text && !isReading}
            className="btn btn-primary flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            aria-label={
              isReading && !isPaused
                ? 'Pause reading (Ctrl+P)'
                : isReading && isPaused
                  ? 'Resume reading (Ctrl+R)'
                  : 'Start reading (Ctrl+R)'
            }
            title={
              isReading && !isPaused
                ? 'Pause reading (Ctrl+P)'
                : isReading && isPaused
                  ? 'Resume reading (Ctrl+R)'
                  : 'Start reading (Ctrl+R)'
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
            onClick={handleStop}
            disabled={!isReading}
            className="btn btn-secondary rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            aria-label="Stop reading (Ctrl+S)"
            title="Stop reading (Ctrl+S)"
          >
            ⏹️ Stop
          </button>

          {showAdvancedControls && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-outline rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
              aria-label="Toggle TTS settings"
              aria-expanded={showSettings}
            >
              ⚙️ Settings
            </button>
          )}
        </div>

        {/* Status Display */}
        {isReading && (
          <div
            className="status-display mt-2 rounded bg-blue-50 p-2 text-sm"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-blue-700">
              {isPaused ? (
                <>⏸️ Paused - Press Ctrl+R to resume</>
              ) : (
                <>🔊 Reading... - Press Ctrl+P to pause</>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      {showAdvancedControls && showSettings && (
        <div className="settings-panel border-t pt-4">
          <h3 className="mb-3 text-lg font-semibold">TTS Settings</h3>

          {/* Voice Selection */}
          <div className="voice-selection mb-4">
            <label
              htmlFor="voice-select"
              className="mb-2 block text-sm font-medium"
            >
              Voice:
              {currentVoiceInfo && (
                <span className="ml-2 text-gray-600">
                  ({currentVoiceInfo.name} - {currentVoiceInfo.language})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <select
                id="voice-select"
                value={settings.voice}
                onChange={handleVoiceChange}
                className="flex-1 rounded border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                aria-describedby="voice-help"
              >
                <option value="">Default Voice</option>
                {vietnameseVoices.length > 0 && (
                  <optgroup label="Vietnamese Voices">
                    {vietnameseVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name}{' '}
                        {voice.localService ? '(Local)' : '(Online)'}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All Voices">
                  {availableVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} ({voice.lang}){' '}
                      {voice.localService ? '(Local)' : '(Online)'}
                    </option>
                  ))}
                </optgroup>
              </select>
              <button
                onClick={handleTestVoice}
                disabled={isTestingVoice}
                className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
                aria-label="Test current voice"
              >
                {isTestingVoice ? '🔊' : '🎵'} Test
              </button>
            </div>
            <div id="voice-help" className="mt-1 text-xs text-gray-600">
              {capabilities.hasVietnameseVoices
                ? `${vietnameseVoices.length} Vietnamese voices available`
                : 'No Vietnamese voices found - using system default'}
            </div>
          </div>

          {/* Speed Control */}
          <div className="rate-control mb-4">
            <label
              htmlFor="rate-slider"
              className="mb-2 block text-sm font-medium"
            >
              Speed: {settings.rate.toFixed(1)}x
              <span className="ml-2 text-gray-600">(Ctrl+↑/↓ to adjust)</span>
            </label>
            <input
              id="rate-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.rate}
              onChange={handleRateChange}
              className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              aria-label="Reading speed"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Slow (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Fast (2.0x)</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="volume-control mb-4">
            <label
              htmlFor="volume-slider"
              className="mb-2 block text-sm font-medium"
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
              className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              aria-label="Volume level"
            />
          </div>

          {/* Pitch Control */}
          <div className="pitch-control mb-4">
            <label
              htmlFor="pitch-slider"
              className="mb-2 block text-sm font-medium"
            >
              Pitch: {settings.pitch.toFixed(1)}
            </label>
            <input
              id="pitch-slider"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={handlePitchChange}
              className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              aria-label="Voice pitch"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Low (0.0)</span>
              <span>Normal (1.0)</span>
              <span>High (2.0)</span>
            </div>
          </div>

          {/* Audio Feedback Settings */}
          <div className="audio-feedback-settings mb-4">
            <h4 className="mb-2 text-sm font-medium">
              Audio Feedback (for accessibility)
            </h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={audioFeedbackSettings.enabled}
                  onChange={() => handleAudioFeedbackToggle('enabled')}
                  className="mr-2"
                />
                <span className="text-sm">Enable audio feedback sounds</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={audioFeedbackSettings.successSound}
                  onChange={() => handleAudioFeedbackToggle('successSound')}
                  disabled={!audioFeedbackSettings.enabled}
                  className="mr-2"
                />
                <span className="text-sm">Success sounds</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={audioFeedbackSettings.errorSound}
                  onChange={() => handleAudioFeedbackToggle('errorSound')}
                  disabled={!audioFeedbackSettings.enabled}
                  className="mr-2"
                />
                <span className="text-sm">Error sounds</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={audioFeedbackSettings.statusSound}
                  onChange={() => handleAudioFeedbackToggle('statusSound')}
                  disabled={!audioFeedbackSettings.enabled}
                  className="mr-2"
                />
                <span className="text-sm">Status sounds</span>
              </label>
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="keyboard-shortcuts-info">
            <h4 className="mb-2 text-sm font-medium">Keyboard Shortcuts</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div>
                <kbd className="rounded bg-gray-100 px-1 py-0.5">Ctrl+R</kbd>{' '}
                Start/Resume reading
              </div>
              <div>
                <kbd className="rounded bg-gray-100 px-1 py-0.5">Ctrl+P</kbd>{' '}
                Pause reading
              </div>
              <div>
                <kbd className="rounded bg-gray-100 px-1 py-0.5">Ctrl+S</kbd>{' '}
                Stop reading
              </div>
              <div>
                <kbd className="rounded bg-gray-100 px-1 py-0.5">Ctrl+↑/↓</kbd>{' '}
                Adjust speed
              </div>
              <div>
                <kbd className="rounded bg-gray-100 px-1 py-0.5">Space</kbd>{' '}
                Toggle voice recognition
              </div>
              <div>
                <kbd className="rounded bg-gray-100 px-1 py-0.5">Escape</kbd>{' '}
                Cancel operation
              </div>
              <div>
                <kbd className="rounded bg-gray-100 px-1 py-0.5">F1</kbd> Show
                all shortcuts
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capabilities Info */}
      {showAdvancedControls && (
        <div className="capabilities-info mt-4 border-t pt-4 text-xs text-gray-500">
          <div>
            Voices: {capabilities.voiceCount} total
            {capabilities.hasVietnameseVoices &&
              `, ${vietnameseVoices.length} Vietnamese`}
          </div>
        </div>
      )}
    </div>
  );
};
