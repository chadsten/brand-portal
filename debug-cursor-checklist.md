# Cursor Pointer Debug Checklist

## Root Cause Analysis Steps

### 1. Browser DevTools Inspection
- [ ] Open DevTools (F12)
- [ ] Navigate to the page with cursor issues
- [ ] Hover over problematic buttons/elements
- [ ] Check the **Computed** tab for `cursor` property
- [ ] Look for overriding styles in **Styles** tab
- [ ] Check if `!important` rules are being overridden

### 2. CSS Specificity Investigation
- [ ] Check if DaisyUI base styles are overriding custom cursor styles
- [ ] Look for CSS reset styles that might set cursor: auto
- [ ] Verify Tailwind utilities layer order
- [ ] Check for third-party CSS conflicts

### 3. Common Issues to Check

#### A. CSS Layer Order Problems
```css
/* Ensure utilities layer comes after components */
@import 'tailwindcss/base';
@import 'tailwindcss/components'; 
@import 'tailwindcss/utilities';  /* This should be last */
```

#### B. DaisyUI Theme Overrides
- [ ] Check if DaisyUI theme has cursor overrides
- [ ] Verify if button components have default cursor styles
- [ ] Look for theme-specific cursor definitions

#### C. Tailwind CSS Purging Issues
- [ ] Check if cursor classes are being purged from production build
- [ ] Verify tailwind.config.js content paths include all component files
- [ ] Check if dynamic class names are being detected

#### D. Browser-Specific Issues
- [ ] Test in different browsers (Chrome, Firefox, Safari)
- [ ] Check for user agent stylesheet overrides
- [ ] Test on different operating systems

### 4. Element-Specific Debugging

#### Buttons
```javascript
// In browser console:
const buttons = document.querySelectorAll('button, .btn');
buttons.forEach(btn => {
    const computed = window.getComputedStyle(btn);
    console.log('Button:', btn, 'Cursor:', computed.cursor);
});
```

#### Tabs
```javascript
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    const computed = window.getComputedStyle(tab);
    console.log('Tab:', tab, 'Cursor:', computed.cursor, 'Classes:', tab.className);
});
```

#### Cards
```javascript
const cards = document.querySelectorAll('.card');
cards.forEach(card => {
    const computed = window.getComputedStyle(card);
    console.log('Card:', card, 'Cursor:', computed.cursor, 'Has onclick:', !!card.onclick);
});
```

### 5. Production vs Development
- [ ] Test cursor behavior in development mode
- [ ] Test cursor behavior in production build
- [ ] Check if build process affects CSS output
- [ ] Verify if CSS minification removes cursor styles

### 6. Accessibility Testing
- [ ] Test with keyboard navigation (Tab key)
- [ ] Verify focus states show cursor changes
- [ ] Check ARIA attributes don't interfere with cursor styles
- [ ] Test with screen readers

## Quick Fixes to Try

### 1. Force Cursor with Higher Specificity
```css
/* Add to globals.css */
@layer utilities {
  /* Force cursor on all interactive elements */
  button:not(:disabled),
  .btn:not(:disabled):not(.btn-disabled),
  [role="button"]:not([aria-disabled="true"]) {
    cursor: pointer !important;
  }
}
```

### 2. Add Cursor Classes to Components
```jsx
// In React components, explicitly add cursor-pointer class
<button className="btn btn-primary cursor-pointer">
  Click Me
</button>
```

### 3. CSS Custom Properties Override
```css
:root {
  --cursor-pointer: pointer;
}

.btn:not(:disabled) {
  cursor: var(--cursor-pointer) !important;
}
```

### 4. JavaScript Fallback
```javascript
// Add to layout or main component
useEffect(() => {
  const addCursorStyles = () => {
    const interactiveElements = document.querySelectorAll(
      'button:not(:disabled), .btn:not(:disabled):not(.btn-disabled), [role="button"], .tab:not(.tab-disabled)'
    );
    
    interactiveElements.forEach(el => {
      if (el.style.cursor !== 'pointer') {
        el.style.cursor = 'pointer';
      }
    });
  };
  
  // Run on mount and after dynamic content loads
  addCursorStyles();
  
  // Observer for dynamic content
  const observer = new MutationObserver(addCursorStyles);
  observer.observe(document.body, { childList: true, subtree: true });
  
  return () => observer.disconnect();
}, []);
```

## Testing Commands

### Check CSS Build Output
```bash
# Build the project and check CSS output
npm run build
# Look for cursor styles in .next/static/css/*.css
```

### Verify Tailwind Configuration
```bash
# Check if cursor utilities are included
npx tailwindcss --help
```

### Test in Development
```bash
npm run dev
# Open test-cursor-debug.html in browser alongside app
```

## Expected Results
- All buttons should show pointer cursor on hover
- Disabled buttons should show not-allowed cursor
- Tabs should be clickable with pointer cursor
- Cards with click handlers should show pointer cursor
- No console errors related to CSS loading