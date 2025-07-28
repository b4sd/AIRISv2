/**
 * Keyboard Shortcuts System for Accessibility
 * Provides keyboard alternatives to voice commands
 */

import { TTSKeyboardShortcuts } from '../tts/types';

export type ShortcutAction =
  | 'toggleReading'
  | 'pauseReading'
  | 'stopReading'
  | 'increaseSpeed'
  | 'decreaseSpeed'
  | 'toggleVoiceRecognition'
  | 'cancelOperation'
  | 'openHelp'
  | 'focusNext'
  | 'focusPrevious';

export interface ShortcutHandler {
  action: ShortcutAction;
  handler: () => void | Promise<void>;
  description: string;
}

export class KeyboardShortcuts {
  private shortcuts: Map<string, ShortcutHandler> = new Map();
  private isListening: boolean = false;
  private settings: TTSKeyboardShortcuts = {
    toggleReading: 'Ctrl+KeyR',
    pauseReading: 'Ctrl+KeyP',
    stopReading: 'Ctrl+KeyS',
    increaseSpeed: 'Ctrl+ArrowUp',
    decreaseSpeed: 'Ctrl+ArrowDown',
    toggleVoiceRecognition: 'Ctrl+KeyV',
  };

  constructor() {
    this.setupDefaultShortcuts();
  }

  private setupDefaultShortcuts(): void {
    // Essential TTS controls
    this.registerShortcut('Space', {
      action: 'toggleVoiceRecognition',
      handler: () => this.handleToggleVoiceRecognition(),
      description: 'Toggle voice recognition on/off',
    });

    this.registerShortcut('Escape', {
      action: 'cancelOperation',
      handler: () => this.handleCancelOperation(),
      description: 'Cancel current operation or stop TTS',
    });

    this.registerShortcut('F1', {
      action: 'openHelp',
      handler: () => this.handleOpenHelp(),
      description: 'Open keyboard shortcuts help',
    });

    // Tab navigation (handled by browser, but we track it)
    this.registerShortcut('Tab', {
      action: 'focusNext',
      handler: () => this.handleFocusNext(),
      description: 'Move to next interactive element',
    });

    this.registerShortcut('Shift+Tab', {
      action: 'focusPrevious',
      handler: () => this.handleFocusPrevious(),
      description: 'Move to previous interactive element',
    });
  }

  registerShortcut(keyCombo: string, handler: ShortcutHandler): void {
    this.shortcuts.set(keyCombo, handler);
  }

  unregisterShortcut(keyCombo: string): void {
    this.shortcuts.delete(keyCombo);
  }

  updateShortcutSettings(newSettings: Partial<TTSKeyboardShortcuts>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.updateRegisteredShortcuts();
  }

  private updateRegisteredShortcuts(): void {
    // Re-register shortcuts with new key combinations
    this.shortcuts.clear();
    this.setupDefaultShortcuts();

    // Register TTS-specific shortcuts
    this.registerShortcut(this.settings.toggleReading, {
      action: 'toggleReading',
      handler: () => this.handleToggleReading(),
      description: 'Start or resume reading',
    });

    this.registerShortcut(this.settings.pauseReading, {
      action: 'pauseReading',
      handler: () => this.handlePauseReading(),
      description: 'Pause reading',
    });

    this.registerShortcut(this.settings.stopReading, {
      action: 'stopReading',
      handler: () => this.handleStopReading(),
      description: 'Stop reading',
    });

    this.registerShortcut(this.settings.increaseSpeed, {
      action: 'increaseSpeed',
      handler: () => this.handleIncreaseSpeed(),
      description: 'Increase reading speed',
    });

    this.registerShortcut(this.settings.decreaseSpeed, {
      action: 'decreaseSpeed',
      handler: () => this.handleDecreaseSpeed(),
      description: 'Decrease reading speed',
    });

    this.registerShortcut(this.settings.toggleVoiceRecognition, {
      action: 'toggleVoiceRecognition',
      handler: () => this.handleToggleVoiceRecognition(),
      description: 'Toggle voice recognition',
    });
  }

  startListening(): void {
    if (this.isListening) return;

    this.isListening = true;
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  stopListening(): void {
    if (!this.isListening) return;

    this.isListening = false;
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const keyCombo = this.getKeyCombo(event);
    const shortcut = this.shortcuts.get(keyCombo);

    if (shortcut) {
      // Prevent default browser behavior for our shortcuts
      event.preventDefault();
      event.stopPropagation();

      // Execute the handler
      try {
        shortcut.handler();
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    // Handle key up events if needed (e.g., for continuous actions)
  };

  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    // Use event.code for physical key position (better for shortcuts)
    parts.push(event.code);

    return parts.join('+');
  }

  // Default shortcut handlers (to be overridden by TTS system)
  private handleToggleReading(): void {
    console.log('Toggle reading shortcut pressed');
    // This will be overridden by the TTS system
  }

  private handlePauseReading(): void {
    console.log('Pause reading shortcut pressed');
    // This will be overridden by the TTS system
  }

  private handleStopReading(): void {
    console.log('Stop reading shortcut pressed');
    // This will be overridden by the TTS system
  }

  private handleIncreaseSpeed(): void {
    console.log('Increase speed shortcut pressed');
    // This will be overridden by the TTS system
  }

  private handleDecreaseSpeed(): void {
    console.log('Decrease speed shortcut pressed');
    // This will be overridden by the TTS system
  }

  private handleToggleVoiceRecognition(): void {
    console.log('Toggle voice recognition shortcut pressed');
    // This will be overridden by the voice system
  }

  private handleCancelOperation(): void {
    console.log('Cancel operation shortcut pressed');
    // This will be overridden by the main system
  }

  private handleOpenHelp(): void {
    console.log('Open help shortcut pressed');
    // This will show the keyboard shortcuts help
    this.showShortcutsHelp();
  }

  private handleFocusNext(): void {
    // Let browser handle tab navigation naturally
  }

  private handleFocusPrevious(): void {
    // Let browser handle shift+tab navigation naturally
  }

  private showShortcutsHelp(): void {
    // Create and show help modal with all shortcuts
    const helpContent = this.generateHelpContent();
    this.displayHelpModal(helpContent);
  }

  private generateHelpContent(): string {
    let content = 'Keyboard Shortcuts:\n\n';

    for (const [keyCombo, handler] of this.shortcuts) {
      content += `${keyCombo}: ${handler.description}\n`;
    }

    return content;
  }

  private displayHelpModal(content: string): void {
    // Create accessible modal for help content
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'shortcuts-help-title');
    modal.setAttribute('aria-modal', 'true');
    modal.className = 'shortcuts-help-modal';

    modal.innerHTML = `
      <div class="modal-content">
        <h2 id="shortcuts-help-title">Keyboard Shortcuts</h2>
        <pre>${content}</pre>
        <button id="close-help" class="btn btn-primary">Close (Escape)</button>
      </div>
    `;

    // Style the modal
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = modal.querySelector('.modal-content') as HTMLElement;
    if (modalContent) {
      modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        color: black;
      `;
    }

    document.body.appendChild(modal);

    // Focus the close button
    const closeButton = modal.querySelector('#close-help') as HTMLButtonElement;
    if (closeButton) {
      closeButton.focus();
      closeButton.addEventListener('click', () => this.closeHelpModal(modal));
    }

    // Close on Escape
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.closeHelpModal(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  private closeHelpModal(modal: HTMLElement): void {
    document.body.removeChild(modal);
    // Return focus to the element that opened the help
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.focus) {
      activeElement.focus();
    }
  }

  // Method to set custom handlers for TTS integration
  setTTSHandlers(handlers: {
    toggleReading?: () => void;
    pauseReading?: () => void;
    stopReading?: () => void;
    increaseSpeed?: () => void;
    decreaseSpeed?: () => void;
  }): void {
    if (handlers.toggleReading) {
      this.registerShortcut(this.settings.toggleReading, {
        action: 'toggleReading',
        handler: handlers.toggleReading,
        description: 'Start or resume reading',
      });
    }

    if (handlers.pauseReading) {
      this.registerShortcut(this.settings.pauseReading, {
        action: 'pauseReading',
        handler: handlers.pauseReading,
        description: 'Pause reading',
      });
    }

    if (handlers.stopReading) {
      this.registerShortcut(this.settings.stopReading, {
        action: 'stopReading',
        handler: handlers.stopReading,
        description: 'Stop reading',
      });
    }

    if (handlers.increaseSpeed) {
      this.registerShortcut(this.settings.increaseSpeed, {
        action: 'increaseSpeed',
        handler: handlers.increaseSpeed,
        description: 'Increase reading speed',
      });
    }

    if (handlers.decreaseSpeed) {
      this.registerShortcut(this.settings.decreaseSpeed, {
        action: 'decreaseSpeed',
        handler: handlers.decreaseSpeed,
        description: 'Decrease reading speed',
      });
    }
  }

  // Get all registered shortcuts for display
  getAllShortcuts(): Array<{
    keyCombo: string;
    description: string;
    action: ShortcutAction;
  }> {
    return Array.from(this.shortcuts.entries()).map(([keyCombo, handler]) => ({
      keyCombo,
      description: handler.description,
      action: handler.action,
    }));
  }

  // Check if a key combination is already registered
  isShortcutRegistered(keyCombo: string): boolean {
    return this.shortcuts.has(keyCombo);
  }

  // Get current settings
  getSettings(): TTSKeyboardShortcuts {
    return { ...this.settings };
  }
}
