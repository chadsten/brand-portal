// React/Next.js Cursor Debug Component
// Add this to any page to debug cursor issues in your app

'use client';

import React, { useEffect, useState } from 'react';

interface CursorDebugElement {
  element: HTMLElement;
  tagName: string;
  classes: string;
  computedCursor: string;
  expectedCursor: string;
  hasClickHandler: boolean;
  isDisabled: boolean;
  hasCorrectCursor: boolean;
}

export const CursorDebugger: React.FC = () => {
  const [debugResults, setDebugResults] = useState<CursorDebugElement[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const analyzeElements = () => {
    const selectors = [
      'button',
      '.btn',
      '.tab',
      '[role="button"]',
      '.card[onclick]',
      '.card.cursor-pointer',
      'a[onclick]',
      '.menu li > *',
      '.dropdown > *[tabindex]',
      '.cursor-pointer',
    ];

    const results: CursorDebugElement[] = [];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const element = el as HTMLElement;
        const computed = window.getComputedStyle(element);
        const hasClickHandler = element.onclick !== null || 
                                element.hasAttribute('onclick') ||
                                element.addEventListener !== undefined;
        const isDisabled = element.hasAttribute('disabled') ||
                          element.hasAttribute('aria-disabled') ||
                          element.classList.contains('btn-disabled') ||
                          element.classList.contains('tab-disabled');
        
        const expectedCursor = isDisabled ? 'not-allowed' : 'pointer';
        const hasCorrectCursor = computed.cursor === expectedCursor;

        if (!hasCorrectCursor) {
          results.push({
            element,
            tagName: element.tagName.toLowerCase(),
            classes: element.className,
            computedCursor: computed.cursor,
            expectedCursor,
            hasClickHandler,
            isDisabled,
            hasCorrectCursor,
          });
        }
      });
    });

    setDebugResults(results);
  };

  const fixElement = (debugElement: CursorDebugElement) => {
    debugElement.element.style.cursor = debugElement.expectedCursor;
    analyzeElements(); // Re-analyze after fix
  };

  const fixAllElements = () => {
    debugResults.forEach(item => {
      item.element.style.cursor = item.expectedCursor;
    });
    analyzeElements();
  };

  useEffect(() => {
    if (isVisible) {
      analyzeElements();
      
      // Re-analyze when DOM changes
      const observer = new MutationObserver(() => {
        setTimeout(analyzeElements, 100);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'disabled', 'aria-disabled']
      });

      return () => observer.disconnect();
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          className="btn btn-error btn-sm"
          onClick={() => setIsVisible(true)}
        >
          🐛 Debug Cursors
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-base-100 w-full max-w-4xl max-h-[80vh] overflow-auto rounded-lg shadow-xl">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-lg font-bold">Cursor Debug Results</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setIsVisible(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Problems Found</div>
                <div className="stat-value text-error">{debugResults.length}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Elements Checked</div>
                <div className="stat-value">{document.querySelectorAll('button, .btn, .tab, [role="button"]').length}</div>
              </div>
            </div>
          </div>

          {debugResults.length === 0 ? (
            <div className="alert alert-success">
              <span>✅ All interactive elements have correct cursor styles!</span>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={fixAllElements}
                >
                  🔧 Fix All Elements
                </button>
                <button
                  className="btn btn-ghost btn-sm ml-2"
                  onClick={analyzeElements}
                >
                  🔄 Re-analyze
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Element</th>
                      <th>Classes</th>
                      <th>Current Cursor</th>
                      <th>Expected</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugResults.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <code className="text-xs bg-base-200 p-1 rounded">
                            {item.tagName}
                          </code>
                          {item.isDisabled && (
                            <div className="badge badge-warning badge-xs mt-1">disabled</div>
                          )}
                          {item.hasClickHandler && (
                            <div className="badge badge-info badge-xs mt-1">has onClick</div>
                          )}
                        </td>
                        <td>
                          <div className="text-xs font-mono max-w-xs overflow-hidden">
                            {item.classes || '<no classes>'}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-error badge-sm">
                            {item.computedCursor}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-success badge-sm">
                            {item.expectedCursor}
                          </span>
                        </td>
                        <td>
                          <span className="text-error text-sm">❌ Incorrect</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-xs btn-primary"
                            onClick={() => fixElement(item)}
                          >
                            Fix
                          </button>
                          <button
                            className="btn btn-xs btn-ghost ml-1"
                            onClick={() => {
                              item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              item.element.style.outline = '3px solid red';
                              item.element.style.outlineOffset = '2px';
                              setTimeout(() => {
                                item.element.style.outline = '';
                                item.element.style.outlineOffset = '';
                              }, 2000);
                            }}
                          >
                            Locate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-6 p-4 bg-base-200 rounded-lg">
            <h3 className="font-semibold mb-2">Common Issues & Solutions:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>CSS Specificity:</strong> DaisyUI or Tailwind base styles might override custom cursor styles</li>
              <li>• <strong>Build Process:</strong> Check if styles are being purged in production</li>
              <li>• <strong>Layer Order:</strong> Ensure @layer utilities comes after @layer components</li>
              <li>• <strong>Browser Cache:</strong> Clear cache and hard refresh (Ctrl+Shift+R)</li>
              <li>• <strong>Dynamic Content:</strong> Elements added after page load might need cursor styles reapplied</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-info bg-opacity-10 rounded-lg">
            <h3 className="font-semibold mb-2">Manual Testing:</h3>
            <p className="text-sm">
              Open DevTools → Elements tab → Hover over problem elements → Check Computed tab for 'cursor' property.
              Look for overriding styles in the Styles tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for easy debugging
export const useCursorDebug = () => {
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Press Ctrl+Shift+D to toggle cursor debugger
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebugger(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    showDebugger,
    setShowDebugger,
    CursorDebugger: showDebugger ? CursorDebugger : null,
  };
};

export default CursorDebugger;