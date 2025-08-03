# Content Rules

## CRITICAL RULE: NO MOCK/TEST/FAKE DATA SYSTEMS

**NEVER** create separate systems for mock, test, or fake data. This includes:

- Mock APIs or endpoints
- Test data generators
- Fake content systems
- Development-only data paths
- Sample/example data fallbacks
- Placeholder content systems

## What to do instead:

1. **Create REAL data seeding systems** that populate the actual database with real, production-ready content
2. **Fix the actual system** rather than working around it with fake alternatives
3. **Use real database operations** that work with the actual schema
4. **Build proper seeding scripts** that create legitimate data entries

## Examples of FORBIDDEN approaches:

```typescript
// ❌ WRONG - Mock data fallback
if (realData.length === 0) {
  return mockData;
}

// ❌ WRONG - Development-only paths
if (process.env.NODE_ENV === 'development') {
  return fakeData;
}

// ❌ WRONG - Test content systems
const mockAssets = [{ id: 'mock-1', ... }];
```

## Examples of CORRECT approaches:

```typescript
// ✅ CORRECT - Real database operations
const results = await db.query.assets.findMany({...});
return results;

// ✅ CORRECT - Proper seeding
await db.insert(assets).values(realAssetData);

// ✅ CORRECT - Fix the actual issue
// If database is empty, create a seeding system, don't fake it
```

## Key Principles:

1. **ALWAYS work with real data systems**
2. **NEVER create parallel fake systems**
3. **FIX the actual problem, don't work around it**
4. **Build proper seeding/migration tools**
5. **Use production-ready approaches from day one**

## Enforcement:

Any code that creates mock/test/fake data systems will be immediately reverted and the developer will be required to implement the proper real data solution.