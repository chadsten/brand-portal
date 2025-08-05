# DAISY-FIX.md - DaisyUI 5 Migration Plan

DO NOT CHANGE ANYTHING IN THIS FILE OTHER THAN CHECKING OFF A TASK

## Overview
This comprehensive plan removes all HeroUI and DaisyUI 4 remnants from the ReactJS Brand Portal, ensuring the project uses only DaisyUI 5.

## Task List

[x] 1. Phase 1: Critical HeroUI Removal
**Agent: code-refactoring-specialist**

[x] 1.1 Remove HeroUI Backup Files
- Delete `src/app/help/page_backup.tsx` (contains HeroUI imports)
- Delete `src/components/collaboration/RealTimeCollaboration.backup.tsx` (contains HeroUI imports)
- Verify no other backup files contain HeroUI references
- _Requirements: None_

[x] 1.2 Comprehensive HeroUI Search
- Search entire codebase for any remaining "heroui" references
- Search for "@heroui" import patterns
- Document any findings for removal
- _Requirements: 1.1_

[x] 2. Phase 2: Form Pattern Migration
**Agent: code-refactoring-specialist + frontend-designer**

[x] 2.1 Workflow Components Migration
- Update `src/components/workflow/AutomatedWorkflow.tsx`
  - Replace all `form-control` with DaisyUI 5 fieldset pattern
  - Replace all `label-text` with proper label elements
  - Test component functionality after migration
- _Requirements: 1.2_

[x] 2.2 Upload Components Migration
- Update `src/components/upload/BulkUploadManager.tsx`
  - Migrate 3 instances of form-control pattern
  - Update label structures to DaisyUI 5
  - Verify file upload functionality
- _Requirements: 1.2_

[x] 2.3 Showcase Page Migration
- Update `src/app/showcase/page.tsx`
  - Extensive form-control usage needs complete refactoring
  - Migrate all form patterns to fieldset/legend structure
  - Update all label-text classes
  - Test all showcase components
- _Requirements: 1.2_

[x] 2.4 Settings Page Migration
- Update `src/app/settings/page.tsx`
  - Extensive form-control usage needs complete refactoring
  - Migrate all form patterns to DaisyUI 5
  - Update theme settings component
- Update `src/components/settings/ThemeSettings.tsx`
  - Fix 1 instance of form-control pattern
- _Requirements: 1.2_

[x] 2.5 Authentication Pages Migration
- Update `src/app/login/page.tsx`
  - Fix 2 instances of form-control pattern
  - Update login form structure
  - Ensure authentication flow works
- _Requirements: 1.2_

[x] 2.6 Profile Page Migration
- Update `src/app/profile/page.tsx`
  - Multiple form-control instances need migration
  - Update all profile form fields
  - Test profile update functionality
- _Requirements: 1.2_

[x] 2.7 Filter Components Migration
- Update `src/components/filters/DateRangeFilter.tsx`
  - Fix 2 instances of form-control pattern  
  - Update date picker integration
- _Requirements: 1.2_

[x] 2.8 Search Components Migration
- Update all files in `src/components/search/` directory:
  - `AdvancedSearch.tsx`
  - `SavedSearches.tsx`
  - `SearchFilters.tsx`
  - `SearchResults.tsx`
  - Migrate all form patterns to DaisyUI 5
  - Fix btn-group pattern in SearchResults.tsx (line 568)
- _Requirements: 1.2_

[x] 2.9 Notification Center Migration
- Update `src/components/notifications/NotificationCenter.tsx`
  - Extensive form-control usage needs refactoring
  - Update all notification settings forms
  - Test notification functionality
- _Requirements: 1.2_

[x] 2.10 Collection Components Migration
- Update `src/components/collections/CollectionFiltersSidebar.tsx`
  - Migrate form-control patterns
  - Update filter sidebar structure
- _Requirements: 1.2_

[x] 3. Phase 3: Component Pattern Updates
**Agent: code-refactoring-specialist**

[x] 3.1 Button Group Pattern Migration
- Update `src/components/search/SearchResults.tsx`
  - Replace `btn-group` with `join` pattern (line 568)
  - Add `join-item` class to child buttons
  - Verify button group functionality
- _Requirements: 2.8_

[x] 3.2 Card Pattern Migration
- Update `src/styles/globals.css`
  - Replace `card-compact` with `card-sm` (line 150)
  - Verify card styling throughout application
- _Requirements: 1.2_

[x] 3.3 Additional Pattern Search
- Search for any other deprecated DaisyUI 4 patterns
- Document and migrate any findings
- _Requirements: 3.1, 3.2_

[x] 4. Phase 4: Test Infrastructure Updates
**Agent: test-suite-generator + code-refactoring-specialist**

[x] 4.1 Jest Configuration Update
- Update `jest.config.cjs`
  - Remove HeroUI reference from transformIgnorePatterns
  - Update any DaisyUI-related configurations
  - Verify jest runs successfully
- _Requirements: All Phase 2 tasks_

[x] 4.2 Test Mock Updates
- Update test files with HeroUI mocks:
  - `__tests__/components/settings/SettingsCard.test.tsx`
  - `__tests__/components/common/LoadingSpinner.test.tsx`
  - `__tests__/components/assets/AssetGrid.test.tsx`
  - `__tests__/components/navigation/MainNavigation.test.tsx`
  - `__tests__/components/search/SearchFilters.test.tsx`
- Replace all HeroUI mocks with DaisyUI 5 patterns
- Ensure all tests pass
- _Requirements: 4.1_

[x] 4.3 Development File Updates
- Update `test-tab-fix.html`
  - Replace DaisyUI 4.12.14 CDN reference with DaisyUI 5
  - Update any test patterns to match DaisyUI 5
- _Requirements: 1.2_

[x] 5. Phase 5: Validation & Documentation
**Agent: design-reviewer + documentation-generator**

[x] 5.1 Comprehensive Validation
- Run `npm run typecheck` to verify no type errors
- Run `npm run check` for linting errors
- Test all major UI flows
- Verify all forms work correctly
- _Requirements: All previous phases_

[x] 5.2 Documentation Updates
- Update `doc/IMPLEMENTATION-PLAN.md`
  - Remove all HeroUI references
  - Update to reflect DaisyUI 5 usage
- Update `RESUME.md`
  - Remove HeroUI from technology stack
  - Add DaisyUI 5 reference
- Update `doc/ARCHITECTURE.md`
  - Remove HeroUI framework reference
  - Document DaisyUI 5 as the UI framework
- _Requirements: 5.1_

[x] 5.3 Final Quality Assurance
- Perform comprehensive UI review
- Test responsive design
- Verify accessibility compliance
- Document any remaining issues
- _Requirements: 5.2_

[x] 5.4 Create Migration Summary
- Document all changes made
- List any breaking changes
- Provide migration guide for future reference
- _Requirements: 5.3_

## Migration Patterns Reference

### Form Control Migration Pattern
```tsx
// OLD (DaisyUI 4/Legacy)
<label className="form-control w-full">
  <div className="label">
    <span className="label-text">Field Label</span>
  </div>
  <input className="input" />
</label>

// NEW (DaisyUI 5)
<fieldset className="fieldset">
  <legend>Form Section</legend>
  <label className="label" htmlFor="field-id">Field Label</label>
  <input id="field-id" className="input" />
</fieldset>
```

### Button Group Migration Pattern
```tsx
// OLD
<div className="btn-group">
  <button className="btn">Button 1</button>
  <button className="btn">Button 2</button>
</div>

// NEW
<div className="join">
  <button className="btn join-item">Button 1</button>
  <button className="btn join-item">Button 2</button>
</div>
```

## Success Criteria
- Zero HeroUI imports or references
- Zero DaisyUI 4 deprecated patterns
- All tests passing
- All forms using DaisyUI 5 fieldset/legend structure
- Documentation updated to reflect DaisyUI 5

## Estimated Completion Time
- Phase 1: 30 minutes
- Phase 2: 4-6 hours (most complex phase)
- Phase 3: 1 hour
- Phase 4: 2 hours
- Phase 5: 1-2 hours

Total: 8-12 hours of focused work