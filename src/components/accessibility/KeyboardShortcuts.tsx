"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  global?: boolean;
}

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  showHelper?: boolean;
}

export function KeyboardShortcuts({ 
  shortcuts, 
  enabled = true,
  showHelper = true 
}: KeyboardShortcutsProps) {
  const [isHelperOpen, setIsHelperOpen] = React.useState(false);
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);

  // Update shortcuts ref when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true') {
      return;
    }

    // Check for help shortcut (?)
    if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      setIsHelperOpen(true);
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const modifiersMatch = (shortcut.modifiers || []).every(modifier => {
        switch (modifier) {
          case 'ctrl': return event.ctrlKey;
          case 'alt': return event.altKey;
          case 'shift': return event.shiftKey;
          case 'meta': return event.metaKey;
          default: return false;
        }
      });

      const noExtraModifiers = 
        (!event.ctrlKey || (shortcut.modifiers || []).includes('ctrl')) &&
        (!event.altKey || (shortcut.modifiers || []).includes('alt')) &&
        (!event.shiftKey || (shortcut.modifiers || []).includes('shift')) &&
        (!event.metaKey || (shortcut.modifiers || []).includes('meta'));

      return shortcut.key.toLowerCase() === event.key.toLowerCase() && 
             modifiersMatch && 
             noExtraModifiers;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = [...(shortcut.modifiers || []), shortcut.key];
    return parts
      .map(part => {
        switch (part) {
          case 'ctrl': return 'Ctrl';
          case 'alt': return 'Alt';
          case 'shift': return 'Shift';
          case 'meta': return 'Cmd';
          default: return part.toUpperCase();
        }
      })
      .join(' + ');
  };

  if (!showHelper) return null;

  return (
    <>
      <dialog 
        id="keyboard-shortcuts-modal" 
        className="modal"
        open={isHelperOpen}
      >
        <div className="modal-box w-11/12 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="h-5 w-5" />
            <h3 className="font-bold text-lg">Keyboard Shortcuts</h3>
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setIsHelperOpen(false)}
              aria-label="Close shortcuts help"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-base-content/70 mb-4">
                Use these keyboard shortcuts to navigate the application efficiently.
                Press <kbd className="kbd kbd-sm">?</kbd> anytime to show this help.
              </p>
            </div>

            <div className="grid gap-4">
              {shortcuts.map((shortcut, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {shortcut.description}
                    </p>
                    {shortcut.global && (
                      <p className="text-xs text-base-content/60 mt-1">
                        Global shortcut - works anywhere in the app
                      </p>
                    )}
                  </div>
                  <kbd className="kbd kbd-sm">
                    {formatShortcut(shortcut)}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-base-300">
              <h4 className="font-semibold mb-2">General Navigation</h4>
              <div className="space-y-2 text-sm text-base-content/70">
                <div className="flex justify-between">
                  <span>Tab / Shift + Tab</span>
                  <span>Navigate between interactive elements</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter / Space</span>
                  <span>Activate buttons and links</span>
                </div>
                <div className="flex justify-between">
                  <span>Escape</span>
                  <span>Close dialogs and dropdowns</span>
                </div>
                <div className="flex justify-between">
                  <span>Arrow Keys</span>
                  <span>Navigate within menus and lists</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsHelperOpen(false)}>close</button>
        </form>
      </dialog>
    </>
  );
}

// Hook for managing keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.contentEditable === 'true') {
      return;
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      const modifiersMatch = (shortcut.modifiers || []).every(modifier => {
        switch (modifier) {
          case 'ctrl': return event.ctrlKey;
          case 'alt': return event.altKey;
          case 'shift': return event.shiftKey;
          case 'meta': return event.metaKey;
          default: return false;
        }
      });

      const noExtraModifiers = 
        (!event.ctrlKey || (shortcut.modifiers || []).includes('ctrl')) &&
        (!event.altKey || (shortcut.modifiers || []).includes('alt')) &&
        (!event.shiftKey || (shortcut.modifiers || []).includes('shift')) &&
        (!event.metaKey || (shortcut.modifiers || []).includes('meta'));

      return shortcut.key.toLowerCase() === event.key.toLowerCase() && 
             modifiersMatch && 
             noExtraModifiers;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return { shortcuts: shortcutsRef.current };
}