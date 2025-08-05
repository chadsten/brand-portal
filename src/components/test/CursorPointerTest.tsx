'use client';

import React, { useState } from 'react';
import { useCursorFix, fixCursorOnElement, fixCursorOnElements } from '@/hooks/useCursorFix';

/**
 * COMPREHENSIVE CURSOR:POINTER TEST COMPONENT
 * 
 * This component tests every possible scenario where cursor:pointer should work.
 * It verifies both the CSS solution and JavaScript fallback.
 * 
 * Use this component to verify that the cursor solution is working correctly.
 * Open your browser's developer tools and hover over elements to see cursor changes.
 */

export default function CursorPointerTest() {
  const [dynamicElements, setDynamicElements] = useState<string[]>([]);
  const [jsFixEnabled, setJsFixEnabled] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Initialize cursor fix hook with debug mode
  useCursorFix({ 
    debug: debugMode,
    autoDetect: jsFixEnabled,
    watchDynamic: jsFixEnabled 
  });

  const addDynamicElement = () => {
    const newElement = `Dynamic Element ${dynamicElements.length + 1}`;
    setDynamicElements([...dynamicElements, newElement]);
  };

  const clearDynamicElements = () => {
    setDynamicElements([]);
  };

  const manualJsFix = () => {
    const fixed = fixCursorOnElements('.manual-fix-target');
    alert(`Manually fixed cursor on ${fixed} elements`);
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Cursor:Pointer Ultimate Test</h1>
        <p className="text-base-content/70 mb-6">
          This component tests every scenario where cursor:pointer should work.
          Hover over elements below to verify the cursor changes to a pointer.
        </p>
        
        {/* Test Controls */}
        <div className="card bg-base-200 p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <label className="label cursor-pointer">
              <span className="label-text mr-2">Enable JS Fallback</span>
              <input 
                type="checkbox" 
                className="toggle" 
                checked={jsFixEnabled}
                onChange={(e) => setJsFixEnabled(e.target.checked)}
              />
            </label>
            <label className="label cursor-pointer">
              <span className="label-text mr-2">Debug Mode</span>
              <input 
                type="checkbox" 
                className="toggle" 
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
              />
            </label>
            <button 
              className="btn btn-primary" 
              onClick={manualJsFix}
            >
              Manual JS Fix
            </button>
          </div>
        </div>
      </div>

      {/* Level 1: DaisyUI Buttons */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 1: DaisyUI Buttons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          <button className="btn btn-accent">Accent Button</button>
          <button className="btn btn-neutral">Neutral Button</button>
          <button className="btn btn-info">Info Button</button>
          <button className="btn btn-success">Success Button</button>
          <button className="btn btn-warning">Warning Button</button>
          <button className="btn btn-error">Error Button</button>
          <button className="btn btn-ghost">Ghost Button</button>
          <button className="btn btn-link">Link Button</button>
          <button className="btn btn-outline">Outline Button</button>
          <button className="btn btn-soft">Soft Button</button>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Button Sizes</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-xs">XS Button</button>
            <button className="btn btn-sm">SM Button</button>
            <button className="btn btn-md">MD Button</button>
            <button className="btn btn-lg">LG Button</button>
            <button className="btn btn-xl">XL Button</button>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Button Shapes</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-square">□</button>
            <button className="btn btn-circle">○</button>
            <button className="btn btn-wide">Wide Button</button>
            <button className="btn btn-block">Block Button</button>
          </div>
        </div>
      </section>

      {/* Level 2: Disabled States (Should NOT have pointer cursor) */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 2: Disabled States (Should show not-allowed cursor)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn btn-primary" disabled>Disabled Button</button>
          <button className="btn btn-secondary btn-disabled">Btn-Disabled</button>
          <button className="btn btn-accent" aria-disabled="true">Aria-Disabled</button>
          <input type="button" className="btn btn-neutral" value="Disabled Input" disabled />
        </div>
      </section>

      {/* Level 3: Native HTML Elements */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 3: Native HTML Elements</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button type="button">Native Button</button>
          <input type="button" value="Input Button" />
          <input type="submit" value="Submit Input" />
          <input type="reset" value="Reset Input" />
          <a href="#test">Link with href</a>
          <a role="button">Link as Button</a>
          <div role="button" tabIndex={0}>Div as Button</div>
          <span tabIndex={0}>Span with tabindex</span>
        </div>
      </section>

      {/* Level 4: Form Controls */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 4: Form Controls</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="label cursor-pointer">
            <span className="label-text">Checkbox</span>
            <input type="checkbox" className="checkbox" />
          </label>
          <label className="label cursor-pointer">
            <span className="label-text">Radio</span>
            <input type="radio" name="test" className="radio" />
          </label>
          <select className="select w-full max-w-xs">
            <option>Select Option</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
          <input type="range" className="range" />
          <input type="checkbox" className="toggle" />
          <div className="rating">
            <input type="radio" name="rating-1" className="mask mask-star" />
            <input type="radio" name="rating-1" className="mask mask-star" />
          </div>
        </div>
      </section>

      {/* Level 5: DaisyUI Interactive Components */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 5: DaisyUI Interactive Components</h2>
        
        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          <a className="tab">Tab 1</a>
          <a className="tab tab-active">Tab 2</a>
          <a className="tab">Tab 3</a>
        </div>

        {/* Menu */}
        <div className="menu bg-base-200 w-56 rounded-box mb-4">
          <li><a>Menu Item 1</a></li>
          <li><a>Menu Item 2</a></li>
          <li><a>Menu Item 3</a></li>
        </div>

        {/* Dropdown */}
        <div className="dropdown mb-4">
          <div tabIndex={0} role="button" className="btn m-1">Dropdown</div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><a>Item 1</a></li>
            <li><a>Item 2</a></li>
          </ul>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-base-200 shadow-xl cursor-pointer">
            <div className="card-body">
              <h3 className="card-title">Clickable Card</h3>
              <p>This card has cursor-pointer class</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-xl" role="button">
            <div className="card-body">
              <h3 className="card-title">Button Role Card</h3>
              <p>This card has role=&quot;button&quot;</p>
            </div>
          </div>
          <div className="card bg-base-200 shadow-xl" tabIndex={0}>
            <div className="card-body">
              <h3 className="card-title">Focusable Card</h3>
              <p>This card has tabIndex</p>
            </div>
          </div>
        </div>
      </section>

      {/* Level 6: Utility Classes */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 6: Utility Classes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-base-200 cursor-pointer">cursor-pointer</div>
          <div className="p-4 bg-base-200 cursor-pointer-force">cursor-pointer-force</div>
          <div className="p-4 bg-base-200 force-pointer">force-pointer</div>
          <div className="p-4 bg-base-200" data-cursor="pointer">data-cursor=&quot;pointer&quot;</div>
          <div className="p-4 bg-base-200 cursor-pointer-important">cursor-pointer-important</div>
          <div className="p-4 bg-base-200 force-cursor-pointer">force-cursor-pointer</div>
          <div className="p-4 bg-base-200 manual-fix-target">manual-fix-target</div>
          <div className="p-4 bg-base-200" style={{ cursor: 'pointer' }}>inline style</div>
        </div>
      </section>

      {/* Level 7: Dynamic Elements */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 7: Dynamic Elements</h2>
        <div className="mb-4">
          <button className="btn btn-primary mr-2" onClick={addDynamicElement}>
            Add Dynamic Element
          </button>
          <button className="btn btn-secondary" onClick={clearDynamicElements}>
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dynamicElements.map((element, index) => (
            <div key={index} className="card bg-base-200 shadow cursor-pointer">
              <div className="card-body">
                <h3 className="card-title">{element}</h3>
                <p>Added dynamically - should have pointer cursor</p>
                <div className="card-actions">
                  <button className="btn btn-sm btn-primary">Action</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Level 8: Edge Cases */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 8: Edge Cases</h2>
        <div className="space-y-4">
          {/* Nested elements */}
          <div className="p-4 bg-base-200 cursor-pointer">
            <span>Parent with cursor-pointer</span>
            <button className="btn btn-sm ml-2">Nested Button</button>
          </div>
          
          {/* Elements with conflicting classes */}
          <div className="p-4 bg-base-200 cursor-pointer cursor-not-allowed">
            Conflicting cursor classes (should be not-allowed)
          </div>
          
          {/* Elements that change state */}
          <button 
            className="btn btn-primary"
            onClick={(e) => {
              const target = e.target as HTMLButtonElement;
              target.disabled = !target.disabled;
              target.textContent = target.disabled ? 'Disabled (no pointer)' : 'Enabled (pointer)';
            }}
          >
            Toggle Disabled State
          </button>
          
          {/* Performance test */}
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }, (_, i) => (
              <button key={i} className="btn btn-xs btn-primary">
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Level 9: Drag and Drop */}
      <section className="card bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Level 9: Drag and Drop (Should show grab cursor)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-base-200 border-2 border-dashed" draggable="true">
            Draggable Item 1
          </div>
          <div className="p-4 bg-base-200 border-2 border-dashed" draggable="true">
            Draggable Item 2
          </div>
          <div className="p-4 bg-base-200 border-2 border-dashed" draggable="true">
            Draggable Item 3
          </div>
          <div className="p-4 bg-base-200 border-2 border-dashed" draggable="true">
            Draggable Item 4
          </div>
        </div>
      </section>

      {/* Test Results */}
      <section className="card bg-success text-success-content shadow-xl p-6">
        <h2 className="card-title text-2xl mb-4">Test Results</h2>
        <div className="space-y-2">
          <p>✅ If all elements above show the correct cursor on hover, the solution is working!</p>
          <p>✅ Buttons and interactive elements should show pointer cursor</p>
          <p>✅ Disabled elements should show not-allowed cursor</p>
          <p>✅ Draggable elements should show grab cursor</p>
          <p>✅ Dynamic elements should automatically get pointer cursor (if JS fallback enabled)</p>
        </div>
        <div className="mt-4 p-4 bg-success-content/10 rounded-lg">
          <h3 className="font-semibold mb-2">How to Verify:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open browser developer tools</li>
            <li>Hover over each element type above</li>
            <li>Verify the cursor changes appropriately</li>
            <li>Test with JS fallback enabled/disabled</li>
            <li>Add dynamic elements and verify they work</li>
          </ol>
        </div>
      </section>
    </div>
  );
}