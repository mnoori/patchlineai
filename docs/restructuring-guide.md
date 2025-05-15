# Restructuring Guide

This document provides a step-by-step guide for completing the restructuring of the PatchLine AI codebase.

## Overview of Scripts

The following scripts have been created to help with the restructuring process:

1. **restructure.ps1** - Creates the new directory structure and copies files to their new locations
2. **update-imports.ps1** - Updates import paths in the codebase to reflect the new structure
3. **cleanup.ps1** - Removes redundant directories and files after verification

## Step 1: Restructure the Codebase

The `restructure.ps1` script has already been run, creating the new directory structure and copying files to their new locations. The new structure includes:

- `/app` - Next.js app router pages
- `/components` - React components
- `/public` - Static assets
- `/backend` - Backend code
- `/shared` - Shared code
  - `/types` - TypeScript interfaces
  - `/utils` - Utility functions
- `/docs` - Documentation

## Step 2: Update Import Paths

Run the `update-imports.ps1` script to update import paths in the codebase:

```powershell
./update-imports.ps1
```

This script will:
- Find all TypeScript and JavaScript files
- Update import paths according to the new structure
- Report the changes that were made

## Step 3: Test the Application

Run the development server to test that the application works correctly with the new structure:

```powershell
pnpm dev
```

Verify that all features work as expected:
- Navigation
- API calls
- Components rendering
- Page transitions

## Step 4: Clean Up

Once you've verified that everything works correctly, run the `cleanup.ps1` script to remove redundant directories:

```powershell
./cleanup.ps1
```

This script will:
- Remove the `patchline-main` directory
- Remove the `src` directory
- Add documentation about the restructuring

## Step 5: Commit Changes

Commit all changes to version control with a clear message:

```bash
git add .
git commit -m "Restructure codebase for improved organization"
```

## Additional Resources

The following documentation has been created to help with the new structure:

- `docs/project-structure.md` - Describes the new project structure
- `docs/component-organization.md` - Explains how components are organized
- `docs/post-restructuring.md` - Steps to ensure the app works correctly after restructuring

## Troubleshooting

If you encounter any issues during the restructuring process:

1. Check the console output for errors
2. Verify that all files were copied correctly
3. Check that import paths have been updated correctly
4. Review any specific component or page that isn't working as expected

If you need to revert the changes, you can use git to restore the previous state of the repository. 