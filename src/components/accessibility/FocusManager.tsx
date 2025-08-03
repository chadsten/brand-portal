"use client";

import { useEffect, useRef, useCallback } from 'react';

interface FocusManagerProps {
  children: React.ReactNode;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  trapFocus?: boolean;
  className?: string;
}

export function FocusManager({ 
  children, 
  restoreFocus = true,
  autoFocus = false,
  trapFocus = false,
  className = ""
}: FocusManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when component mounts
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [restoreFocus]);

  // Auto-focus first focusable element if autoFocus is enabled
  useEffect(() => {
    if (autoFocus && containerRef.current) {
      const firstFocusable = getFocusableElements(containerRef.current)[0];
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [autoFocus]);

  // Restore focus when component unmounts
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  // Handle focus trapping
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!trapFocus || e.key !== 'Tab' || !containerRef.current) {
      return;
    }

    const focusableElements = getFocusableElements(containerRef.current);
    
    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (e.shiftKey) {
      // Shift + Tab
      if (activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [trapFocus]);

  return (
    <div
      ref={containerRef}
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={trapFocus ? -1 : undefined}
    >
      {children}
    </div>
  );
}

// Utility function to get all focusable elements
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled]):not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
    'select:not([disabled]):not([aria-hidden="true"])',
    'textarea:not([disabled]):not([aria-hidden="true"])',
    'a[href]:not([aria-hidden="true"])',
    '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
    '[contenteditable="true"]:not([aria-hidden="true"])',
    'audio[controls]:not([aria-hidden="true"])',
    'video[controls]:not([aria-hidden="true"])',
    'iframe:not([aria-hidden="true"])',
    'object:not([aria-hidden="true"])',
    'embed:not([aria-hidden="true"])',
    'area[href]:not([aria-hidden="true"])',
    'summary:not([aria-hidden="true"])'
  ];

  const elements = container.querySelectorAll(focusableSelectors.join(', '));
  
  return Array.from(elements).filter((element) => {
    const htmlElement = element as HTMLElement;
    return isVisible(htmlElement) && !isDisabled(htmlElement);
  }) as HTMLElement[];
}

function isVisible(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0';
}

function isDisabled(element: HTMLElement): boolean {
  return element.hasAttribute('disabled') || 
         element.getAttribute('aria-disabled') === 'true';
}

// Hook for managing focus programmatically
export function useFocusManager() {
  const focusFirst = useCallback((container?: HTMLElement) => {
    const target = container || document.body;
    const focusableElements = getFocusableElements(target);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  const focusLast = useCallback((container?: HTMLElement) => {
    const target = container || document.body;
    const focusableElements = getFocusableElements(target);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  const focusById = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    }
  }, []);

  const focusNext = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    const allFocusable = getFocusableElements(document.body);
    const currentIndex = allFocusable.indexOf(activeElement);
    
    if (currentIndex >= 0 && currentIndex < allFocusable.length - 1) {
      allFocusable[currentIndex + 1].focus();
    }
  }, []);

  const focusPrevious = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement) return;

    const allFocusable = getFocusableElements(document.body);
    const currentIndex = allFocusable.indexOf(activeElement);
    
    if (currentIndex > 0) {
      allFocusable[currentIndex - 1].focus();
    }
  }, []);

  return {
    focusFirst,
    focusLast,
    focusById,
    focusNext,
    focusPrevious,
    getFocusableElements
  };
}