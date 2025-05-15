# Post-Restructuring Steps

After restructuring the PatchLine AI codebase, follow these steps to ensure everything works correctly:

## 1. Update Import Paths

Since files have been moved to new locations, update import paths in all files to reflect the new structure. Some common patterns to update:

- Old: `import { ... } from '@/lib/utils'`
- New: `import { ... } from '@/shared/utils/utils'`

- Old: `import { ... } from '@/lib/config'`
- New: `import { ... } from '@/shared/utils/config'`

## 2. Update API Route References

Since API routes have been moved to the backend directory, ensure all frontend code references the correct API endpoints:

- Check for any fetch calls that may need updating
- Verify that Next.js API routes are being correctly referenced

## 3. Update tsconfig.json Paths

Update the path aliases in tsconfig.json to reflect the new structure:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/shared/*": ["./shared/*"],
      "@/backend/*": ["./backend/*"]
    }
  }
}
```

## 4. Test the Application

Run the application and ensure everything works correctly:

```bash
npm run dev
# or
pnpm dev
```

Check all major features:
- Navigation
- API calls
- Components rendering
- State management

## 5. Update CI/CD Configuration

If using CI/CD pipelines, update any configuration files to reflect the new directory structure.

## 6. Clean Up

Once everything is working correctly, remove the redundant directories by running:

```bash
./cleanup.ps1
```

This will:
- Remove the `patchline-main` directory
- Remove the `src` directory
- Add documentation about the restructuring

## 7. Commit Changes

Commit all changes to version control with a clear message:

```bash
git add .
git commit -m "Restructure codebase for improved organization"
```

## 8. Document Any Issues

If any issues arise during testing, document them here:

| Issue | Solution |
|-------|----------|
|       |          | 