# Database Maintenance Scripts

This directory contains scripts for database operations and asset management.

## Asset Restoration Scripts (2025-08-02)

These scripts were created to fix an issue where non-image assets were incorrectly soft-deleted during a storage mismatch cleanup:

### analyze-deleted-assets.ts
Analyzes soft-deleted assets and categorizes them by type (image vs non-image).
```bash
npx tsx scripts/analyze-deleted-assets.ts
```

### restore-non-image-assets-final.ts
Restores non-image assets (documents, videos, audio, etc.) that were incorrectly soft-deleted.
Only keeps image assets deleted that had actual storage file mismatches.
```bash
npx tsx scripts/restore-non-image-assets-final.ts
```

### verify-restoration.ts
Verifies the restoration was successful and shows current asset statistics.
```bash
npx tsx scripts/verify-restoration.ts
```

### Utility Scripts

#### check-deleted-assets.ts
Simple check for current deletion status and asset counts.

#### simple-db-test.ts
Basic database connection test.

## Infrastructure Scripts

### deploy.sh
Production deployment script.

### setup-dev.sh
Development environment setup script.

### init-db.sql
Database initialization SQL for fresh setup.

## Notes

- All TypeScript scripts require tsx to run: `npx tsx scripts/<script-name>.ts`
- Scripts automatically load environment variables from `.env.local`
- Database connection is configured for PostgreSQL as defined in DATABASE_URL