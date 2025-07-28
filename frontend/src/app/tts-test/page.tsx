/**
 * TTS Test Page
 * Test page for Text-to-Speech functionality with accessibility features
 */

'use client';

import React, { useState } from 'react';
import { TTSControls } from '../../components/TTS/TTSControls';

export default function TTSTestPage() {
  const [testText, setTestText] = useState(
    'Xin chào! Đây là ứng dụng đọc sách bằng giọng nói tiếng Việt. ' +
      'Bạn có thể sử dụng các phím tắt để điều khiển việc đọc. ' +
      'Nhấn Ctrl+R để bắt đầu đọc, Ctrl+P để tạm dừng, và Ctrl+S để dừng hoàn toàn.'
  );

  const [englishText] = useState(
    'Hello! This is a Vietnamese voice reading application. ' +
      'You can use keyboard shortcuts to control reading. ' +
      'Press Ctrl+R to start reading, Ctrl+P to pause, and Ctrl+S to stop completely.'
  );

  const [currentText, setCurrentText] = useState(testText);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h1 className="mb-6 text-3xl font-bold text-gray-900">
            TTS Test Page - Text-to-Speech Testing
          </h1>

          {/* Instructions */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-blue-900">
              🎯 Testing Instructions
            </h2>
            <div className="space-y-2 text-blue-800">
              <p>
                • Select text below and click "Read Aloud" or press{' '}
                <kbd className="rounded bg-blue-100 px-1 py-0.5">Ctrl+R</kbd>
              </p>
              <p>
                • Use keyboard shortcuts:{' '}
                <kbd className="rounded bg-blue-100 px-1 py-0.5">Ctrl+P</kbd>{' '}
                (pause),{' '}
                <kbd className="rounded bg-blue-100 px-1 py-0.5">Ctrl+S</kbd>{' '}
                (stop)
              </p>
              <p>
                • Press{' '}
                <kbd className="rounded bg-blue-100 px-1 py-0.5">F1</kbd> to see
                all keyboard shortcuts
              </p>
              <p>• Test Vietnamese and English voices in the settings</p>
              <p>• Audio feedback sounds indicate success/error states</p>
            </div>
          </div>

          {/* Text Selection */}
          <div className="mb-6">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Select Test Text
            </h2>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setCurrentText(testText)}
                className={`rounded px-4 py-2 ${
                  currentText === testText
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Vietnamese Text
              </button>
              <button
                onClick={() => setCurrentText(englishText)}
                className={`rounded px-4 py-2 ${
                  currentText === englishText
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English Text
              </button>
            </div>
          </div>

          {/* Text Display */}
          <div className="mb-6">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              Text to Read
            </h2>
            <div
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 leading-relaxed text-gray-800"
              data-reading-content
            >
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                className="h-32 w-full resize-none border-none bg-transparent focus:outline-none"
                placeholder="Enter text to read aloud..."
                aria-label="Text to read aloud"
              />
            </div>
          </div>

          {/* TTS Controls */}
          <div className="mb-6">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              TTS Controls
            </h2>
            <TTSControls
              text={currentText}
              showAdvancedControls={true}
              className="max-w-2xl"
            />
          </div>

          {/* Accessibility Features */}
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-green-900">
              ♿ Accessibility Features
            </h2>
            <div className="space-y-2 text-green-800">
              <p>
                ✅ <strong>Keyboard Shortcuts:</strong> All functions accessible
                via keyboard
              </p>
              <p>
                ✅ <strong>Audio Feedback:</strong> Sound indicators for
                success/error states
              </p>
              <p>
                ✅ <strong>Screen Reader Support:</strong> ARIA labels and
                semantic HTML
              </p>
              <p>
                ✅ <strong>Vietnamese Support:</strong> Optimized for Vietnamese
                text-to-speech
              </p>
              <p>
                ✅ <strong>Focus Management:</strong> Logical tab order and
                focus indicators
              </p>
            </div>
          </div>

          {/* Testing Checklist */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-yellow-900">
              ✅ Testing Checklist
            </h2>
            <div className="space-y-1 text-sm text-yellow-800">
              <div>
                □ Vietnamese text reads correctly with proper pronunciation
              </div>
              <div>□ English text reads correctly</div>
              <div>
                □ Keyboard shortcuts work (Ctrl+R, Ctrl+P, Ctrl+S, Ctrl+↑/↓)
              </div>
              <div>□ Audio feedback sounds play for actions</div>
              <div>□ Voice selection works (Vietnamese voices preferred)</div>
              <div>□ Speed, volume, and pitch controls work</div>
              <div>□ Pause and resume functionality works</div>
              <div>□ Settings panel toggles correctly</div>
              <div>□ Tab navigation works through all controls</div>
              <div>□ F1 shows keyboard shortcuts help</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
