"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useScreenReaderAnnouncement } from './ScreenReaderAnnouncements';
import { SkipToContent } from '../common/SkipToContent';
import { KeyboardShortcuts, useKeyboardShortcuts } from './KeyboardShortcuts';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announcePageChange: (pageName: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    screenReaderMode: false,
    keyboardNavigation: true,
    focusVisible: true,
  });

  const { announce } = useScreenReaderAnnouncement();

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Detect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
      }));
    }
  }, []);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible');
    } else {
      root.classList.remove('focus-visible');
    }

    // Screen reader mode
    if (settings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('accessibility-settings', JSON.stringify(updated));
      return updated;
    });
  };

  const announcePageChange = (pageName: string) => {
    announce(`Navigated to ${pageName} page`, 'polite');
  };

  const announceError = (error: string) => {
    announce(`Error: ${error}`, 'assertive');
  };

  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`, 'polite');
  };

  // Global keyboard shortcuts
  const globalShortcuts = [
    {
      key: 'h',
      description: 'Go to home page',
      action: () => window.location.href = '/',
      global: true,
    },
    {
      key: 's',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      global: true,
    },
    {
      key: 'm',
      description: 'Open main menu',
      action: () => {
        const menuButton = document.querySelector('[aria-label*="menu"]') as HTMLButtonElement;
        if (menuButton) {
          menuButton.click();
        }
      },
      global: true,
    },
    {
      key: 'Escape',
      description: 'Close dialogs and menus',
      action: () => {
        // Close any open modals or menus
        const closeButtons = document.querySelectorAll('[aria-label*="close"], [aria-label*="Close"]');
        if (closeButtons.length > 0) {
          (closeButtons[0] as HTMLButtonElement).click();
        }
      },
      global: true,
    }
  ];

  useKeyboardShortcuts(globalShortcuts, settings.keyboardNavigation);

  const value = {
    settings,
    updateSettings,
    announce,
    announcePageChange,
    announceError,
    announceSuccess,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <SkipToContent />
      {children}
      {settings.keyboardNavigation && (
        <KeyboardShortcuts shortcuts={globalShortcuts} enabled={true} />
      )}
    </AccessibilityContext.Provider>
  );
}

// CSS for accessibility features
export const accessibilityStyles = `
  /* High Contrast Mode */
  .high-contrast {
    --background: #000000;
    --foreground: #ffffff;
    --primary: #ffffff;
    --primary-foreground: #000000;
    --secondary: #666666;
    --secondary-foreground: #ffffff;
    --muted: #333333;
    --muted-foreground: #ffffff;
    --border: #ffffff;
  }

  .high-contrast * {
    border-color: #ffffff !important;
  }

  .high-contrast button,
  .high-contrast a,
  .high-contrast input,
  .high-contrast textarea {
    border: 2px solid #ffffff !important;
  }

  /* Reduced Motion */
  .reduce-motion *,
  .reduce-motion *::before,
  .reduce-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Large Text */
  .large-text {
    font-size: 1.25em;
  }

  .large-text button,
  .large-text input,
  .large-text textarea {
    font-size: 1.25em;
    padding: 0.75rem 1rem;
  }

  /* Enhanced Focus Visibility */
  .focus-visible *:focus {
    outline: 3px solid #005fcc !important;
    outline-offset: 2px !important;
  }

  .focus-visible button:focus,
  .focus-visible a:focus,
  .focus-visible input:focus,
  .focus-visible textarea:focus,
  .focus-visible select:focus {
    box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.5) !important;
  }

  /* Screen Reader Mode Optimizations */
  .screen-reader-mode .sr-only {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: 0.5rem !important;
    margin: 0.25rem !important;
    overflow: visible !important;
    clip: none !important;
    white-space: normal !important;
    background: #f0f0f0;
    border: 1px solid #ccc;
  }

  /* Skip Links */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: white;
    padding: 8px;
    text-decoration: none;
    border-radius: 4px;
    z-index: 1000;
  }

  .skip-link:focus {
    top: 6px;
  }

  /* Keyboard Navigation Indicators */
  .keyboard-navigation {
    outline: 2px solid #005fcc;
    outline-offset: 2px;
  }
`;

// Hook for managing focus announcements
export function useFocusAnnouncement() {
  const { announce } = useAccessibility();

  const announceFocus = (element: HTMLElement) => {
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('title') || 
                  element.textContent?.trim() || 
                  'Interactive element';
    announce(`Focused: ${label}`, 'polite');
  };

  const announceSelection = (item: string) => {
    announce(`Selected: ${item}`, 'polite');
  };

  const announceStateChange = (element: string, state: string) => {
    announce(`${element} is now ${state}`, 'polite');
  };

  return {
    announceFocus,
    announceSelection,
    announceStateChange,
  };
}