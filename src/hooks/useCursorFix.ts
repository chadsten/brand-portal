import { useEffect } from 'react';

/**
 * ULTIMATE CURSOR:POINTER HOOK - JavaScript Fallback Solution
 * 
 * This hook provides a JavaScript-based fallback for cursor:pointer issues.
 * It automatically detects and fixes cursor issues on interactive elements.
 * 
 * Features:
 * - Automatic detection of interactive elements
 * - Manual cursor override capabilities
 * - Dynamic element support with MutationObserver
 * - Performance optimized with minimal DOM operations
 * - Works with all DaisyUI components
 * 
 * Usage:
 * ```tsx
 * // Automatic mode - fixes all interactive elements
 * useCursorFix();
 * 
 * // Manual mode - only fix specific elements
 * useCursorFix({ 
 *   selectors: ['.my-button', '.my-card'],
 *   autoDetect: false 
 * });
 * 
 * // Force mode - override everything
 * useCursorFix({ 
 *   force: true,
 *   cursor: 'pointer' 
 * });
 * ```
 */

interface CursorFixOptions {
  /** Enable automatic detection of interactive elements (default: true) */
  autoDetect?: boolean;
  
  /** Custom selectors to apply cursor fix to */
  selectors?: string[];
  
  /** Force cursor on all elements regardless of state (use with caution) */
  force?: boolean;
  
  /** Cursor type to apply (default: 'pointer') */
  cursor?: 'pointer' | 'grab' | 'grabbing' | 'not-allowed' | 'default' | 'auto';
  
  /** Watch for dynamically added elements (default: true) */
  watchDynamic?: boolean;
  
  /** Exclude certain selectors from cursor fix */
  exclude?: string[];
  
  /** Enable debug logging */
  debug?: boolean;
}

// Comprehensive selector list for interactive elements
const INTERACTIVE_SELECTORS = [
  // DaisyUI Buttons
  '.btn:not(:disabled):not(.btn-disabled):not([disabled]):not([aria-disabled="true"])',
  'button.btn:not(:disabled):not(.btn-disabled):not([disabled]):not([aria-disabled="true"])',
  
  // Native HTML Buttons
  'button:not(:disabled):not([disabled]):not([aria-disabled="true"]):not(.btn-disabled)',
  'input[type="button"]:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  'input[type="submit"]:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  'input[type="reset"]:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  
  // Links and Interactive Elements
  'a[href]:not([aria-disabled="true"])',
  'a[role="button"]:not([aria-disabled="true"])',
  '[role="button"]:not([aria-disabled="true"]):not(:disabled):not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([aria-disabled="true"]):not(:disabled):not([disabled])',
  
  // DaisyUI Components
  '.tab:not(.tab-disabled):not([disabled]):not([aria-disabled="true"])',
  '.menu li > *:not([disabled]):not([aria-disabled="true"]):not(.menu-disabled)',
  '.dropdown-content li:not([aria-disabled="true"])',
  '.card.cursor-pointer:not([aria-disabled="true"])',
  '.card[role="button"]:not([aria-disabled="true"])',
  '.card[onclick]:not([aria-disabled="true"])',
  '.modal-backdrop',
  '.drawer-toggle:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  '.drawer-overlay',
  
  // Form Controls
  'input[type="checkbox"]:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  'input[type="radio"]:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  'select:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  '.select:not(:disabled):not([disabled]):not([aria-disabled="true"]) > select',
  '.range:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  '.toggle:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  
  // Navigation
  '.navbar .btn:not(:disabled):not(.btn-disabled):not([disabled]):not([aria-disabled="true"])',
  '.breadcrumbs a:not([aria-disabled="true"])',
  '.steps .step:not([aria-disabled="true"])',
  '.pagination .btn:not(:disabled):not(.btn-disabled):not([disabled]):not([aria-disabled="true"])',
  
  // Utility Classes
  '.cursor-pointer:not(:disabled):not([disabled]):not([aria-disabled="true"])',
  '.force-pointer:not([aria-disabled="true"])',
  '[data-cursor="pointer"]:not([aria-disabled="true"])',
];

// Elements that should never have pointer cursor
const EXCLUDED_SELECTORS = [
  ':disabled',
  '[disabled]',
  '[aria-disabled="true"]',
  '.btn-disabled',
  '.cursor-not-allowed',
  '.loading',
  '.skeleton',
];

export function useCursorFix(options: CursorFixOptions = {}) {
  const {
    autoDetect = true,
    selectors = [],
    force = false,
    cursor = 'pointer',
    watchDynamic = true,
    exclude = [],
    debug = false,
  } = options;

  useEffect(() => {
    if (debug) {
      console.log('[useCursorFix] Initializing cursor fix...');
    }

    // Combined selectors
    const allSelectors = autoDetect 
      ? [...INTERACTIVE_SELECTORS, ...selectors]
      : selectors;

    if (allSelectors.length === 0) {
      if (debug) {
        console.warn('[useCursorFix] No selectors provided and autoDetect is disabled');
      }
      return;
    }

    // Function to apply cursor fix
    const applyCursorFix = (elements?: NodeListOf<Element> | Element[]) => {
      const targets = elements || document.querySelectorAll(allSelectors.join(', '));
      let fixedCount = 0;

      targets.forEach((element) => {
        const htmlElement = element as HTMLElement;
        
        // Skip if element should be excluded
        if (exclude.some(excludeSelector => htmlElement.matches(excludeSelector))) {
          return;
        }

        // Skip if element matches excluded selectors (unless force is true)
        if (!force && EXCLUDED_SELECTORS.some(excludedSelector => htmlElement.matches(excludedSelector))) {
          return;
        }

        // Check current cursor style
        const currentCursor = window.getComputedStyle(htmlElement).cursor;
        
        // Only apply if cursor is not already set correctly
        if (currentCursor !== cursor) {
          htmlElement.style.cursor = cursor;
          fixedCount++;
          
          if (debug) {
            console.log(`[useCursorFix] Fixed cursor on:`, htmlElement, `${currentCursor} -> ${cursor}`);
          }
        }
      });

      if (debug && fixedCount > 0) {
        console.log(`[useCursorFix] Fixed cursor on ${fixedCount} elements`);
      }

      return fixedCount;
    };

    // Initial fix
    const initialFixed = applyCursorFix();
    
    if (debug) {
      console.log(`[useCursorFix] Initial scan completed. Fixed ${initialFixed} elements.`);
    }

    // Set up MutationObserver for dynamic elements
    let observer: MutationObserver | null = null;
    
    if (watchDynamic) {
      observer = new MutationObserver((mutations) => {
        let hasRelevantChanges = false;
        const newElements: Element[] = [];

        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                
                // Check if the added element or its children match our selectors
                allSelectors.forEach(selector => {
                  try {
                    if (element.matches(selector)) {
                      newElements.push(element);
                      hasRelevantChanges = true;
                    }
                    
                    // Check children
                    const childMatches = element.querySelectorAll(selector);
                    childMatches.forEach(child => {
                      newElements.push(child);
                      hasRelevantChanges = true;
                    });
                  } catch (error) {
                    // Handle invalid selectors gracefully
                    if (debug) {
                      console.warn(`[useCursorFix] Invalid selector: ${selector}`, error);
                    }
                  }
                });
              }
            });
          }
          
          // Handle attribute changes that might affect our selectors
          if (mutation.type === 'attributes') {
            const element = mutation.target as Element;
            const attributeName = mutation.attributeName;
            
            // Check if the attribute change affects interactivity
            if (attributeName && ['disabled', 'aria-disabled', 'class', 'role', 'tabindex'].includes(attributeName)) {
              allSelectors.forEach(selector => {
                try {
                  if (element.matches(selector)) {
                    newElements.push(element);
                    hasRelevantChanges = true;
                  }
                } catch (error) {
                  // Handle invalid selectors gracefully
                  if (debug) {
                    console.warn(`[useCursorFix] Invalid selector: ${selector}`, error);
                  }
                }
              });
            }
          }
        });

        if (hasRelevantChanges && newElements.length > 0) {
          const fixedCount = applyCursorFix(newElements);
          
          if (debug) {
            console.log(`[useCursorFix] Dynamic scan completed. Fixed ${fixedCount} new elements.`);
          }
        }
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled', 'class', 'role', 'tabindex']
      });

      if (debug) {
        console.log('[useCursorFix] MutationObserver started for dynamic elements');
      }
    }

    // Cleanup function
    return () => {
      if (observer) {
        observer.disconnect();
        if (debug) {
          console.log('[useCursorFix] MutationObserver disconnected');
        }
      }
    };
  }, [autoDetect, selectors, force, cursor, watchDynamic, exclude, debug]);
}

/**
 * Utility function to manually fix cursor on specific elements
 * Use this for one-off fixes or in event handlers
 */
export function fixCursorOnElement(
  element: HTMLElement | null, 
  cursor: CursorFixOptions['cursor'] = 'pointer'
) {
  if (!element) return;
  
  // Don't override if element is disabled
  if (element.matches(':disabled, [disabled], [aria-disabled="true"], .btn-disabled')) {
    element.style.cursor = 'not-allowed';
    return;
  }
  
  element.style.cursor = cursor;
}

/**
 * Utility function to fix cursor on elements by selector
 * Use this for bulk fixes or in components
 */
export function fixCursorOnElements(
  selector: string, 
  cursor: CursorFixOptions['cursor'] = 'pointer',
  container: Element = document.body
) {
  const elements = container.querySelectorAll(selector);
  elements.forEach((element) => {
    fixCursorOnElement(element as HTMLElement, cursor);
  });
  return elements.length;
}

// Default export for convenience
export default useCursorFix;