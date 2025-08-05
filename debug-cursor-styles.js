// Cursor Pointer Debug Script
// Paste this into browser console to diagnose cursor issues

(function debugCursorStyles() {
    console.log('🔍 Starting Cursor Pointer Debug Analysis...');
    console.log('==========================================');
    
    // Helper function to get detailed style info
    function analyzeElement(element, elementType) {
        const computed = window.getComputedStyle(element);
        const hasClickHandler = element.onclick || element.hasAttribute('onclick');
        const hasTabIndex = element.hasAttribute('tabindex');
        const isDisabled = element.disabled || element.hasAttribute('disabled') || element.classList.contains('btn-disabled') || element.classList.contains('tab-disabled');
        
        return {
            element,
            elementType,
            cursor: computed.cursor,
            classes: element.className,
            hasClickHandler,
            hasTabIndex,
            isDisabled,
            styles: {
                cursor: computed.cursor,
                pointerEvents: computed.pointerEvents,
                display: computed.display,
                visibility: computed.visibility,
            },
            shouldHavePointer: !isDisabled && (hasClickHandler || hasTabIndex || element.tagName === 'BUTTON' || element.classList.contains('btn') || element.classList.contains('tab')),
        };
    }
    
    // Elements to check
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
    
    const results = [];
    let problemElements = [];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`\n📋 Checking ${selector}: Found ${elements.length} elements`);
        
        elements.forEach((element, index) => {
            const analysis = analyzeElement(element, selector);
            results.push(analysis);
            
            // Check if element should have pointer cursor but doesn't
            if (analysis.shouldHavePointer && analysis.cursor !== 'pointer') {
                problemElements.push(analysis);
                console.log(`❌ Problem found:`, {
                    selector,
                    index,
                    element: element,
                    expectedCursor: 'pointer',
                    actualCursor: analysis.cursor,
                    classes: analysis.classes,
                    disabled: analysis.isDisabled,
                });
            } else if (analysis.shouldHavePointer && analysis.cursor === 'pointer') {
                console.log(`✅ Working correctly:`, {
                    selector,
                    index,
                    cursor: analysis.cursor,
                });
            }
        });
    });
    
    // Summary report
    console.log('\n📊 SUMMARY REPORT');
    console.log('==================');
    console.log(`Total elements checked: ${results.length}`);
    console.log(`Elements with problems: ${problemElements.length}`);
    
    if (problemElements.length > 0) {
        console.log('\n🚨 PROBLEMATIC ELEMENTS:');
        problemElements.forEach((problem, index) => {
            console.log(`${index + 1}. ${problem.elementType}:`);
            console.log(`   Expected: pointer`);
            console.log(`   Actual: ${problem.cursor}`);
            console.log(`   Classes: ${problem.classes}`);
            console.log(`   Disabled: ${problem.isDisabled}`);
            console.log(`   Element:`, problem.element);
            console.log('   ---');
        });
        
        // Check for common issues
        console.log('\n🔧 POTENTIAL FIXES:');
        
        // Check CSS layer order
        const stylesheets = Array.from(document.styleSheets);
        console.log('📄 Loaded stylesheets:');
        stylesheets.forEach((sheet, index) => {
            try {
                console.log(`${index + 1}. ${sheet.href || 'inline'} (${sheet.cssRules?.length || 0} rules)`);
            } catch (e) {
                console.log(`${index + 1}. ${sheet.href || 'inline'} (cross-origin)`);
            }
        });
        
        // Check for cursor overrides
        console.log('\n🎯 Checking for cursor overrides...');
        problemElements.forEach(problem => {
            const styles = getComputedStyle(problem.element);
            const allStyles = [];
            for (let prop of styles) {
                if (prop.includes('cursor')) {
                    allStyles.push(`${prop}: ${styles.getPropertyValue(prop)}`);
                }
            }
            if (allStyles.length > 0) {
                console.log(`Element cursor styles:`, allStyles);
            }
        });
        
    } else {
        console.log('✅ All elements have correct cursor styles!');
    }
    
    // Export results for further analysis
    window.cursorDebugResults = {
        results,
        problemElements,
        timestamp: new Date().toISOString(),
    };
    
    console.log('\n💾 Results saved to window.cursorDebugResults');
    console.log('You can inspect individual elements by accessing window.cursorDebugResults.problemElements');
    
    // Provide quick fix
    if (problemElements.length > 0) {
        console.log('\n⚡ QUICK FIX: Run the following to temporarily fix cursor issues:');
        console.log(`
problemElements = window.cursorDebugResults.problemElements;
problemElements.forEach(item => {
    if (!item.isDisabled) {
        item.element.style.cursor = 'pointer';
        console.log('Fixed cursor for:', item.element);
    }
});
        `);
    }
    
    return {
        results,
        problemElements,
        totalChecked: results.length,
        problemCount: problemElements.length,
    };
})();

// Additional helper functions
console.log('\n🛠️  Helper functions available:');
console.log('- checkSpecificElement(element): Analyze a specific DOM element');
console.log('- fixElementCursor(element): Apply pointer cursor to element');
console.log('- findCSSOverrides(): Look for CSS rules that might override cursor');

window.checkSpecificElement = function(element) {
    if (!element) {
        console.log('❌ No element provided');
        return;
    }
    
    const computed = window.getComputedStyle(element);
    console.log('🔍 Element Analysis:', {
        element,
        tagName: element.tagName,
        classes: element.className,
        cursor: computed.cursor,
        pointerEvents: computed.pointerEvents,
        disabled: element.disabled || element.hasAttribute('disabled'),
        onclick: !!element.onclick,
        tabindex: element.getAttribute('tabindex'),
    });
};

window.fixElementCursor = function(element) {
    if (!element) {
        console.log('❌ No element provided');
        return;
    }
    
    element.style.cursor = 'pointer';
    console.log('✅ Applied pointer cursor to:', element);
};

window.findCSSOverrides = function() {
    console.log('🔍 Searching for CSS cursor overrides...');
    
    // This is a simplified check - full analysis would require parsing all CSS rules
    const computedStyle = getComputedStyle(document.body);
    console.log('Body cursor:', computedStyle.cursor);
    
    // Check for common reset styles
    const testDiv = document.createElement('div');
    testDiv.className = 'btn';
    document.body.appendChild(testDiv);
    const btnStyle = getComputedStyle(testDiv);
    console.log('.btn default cursor:', btnStyle.cursor);
    document.body.removeChild(testDiv);
};