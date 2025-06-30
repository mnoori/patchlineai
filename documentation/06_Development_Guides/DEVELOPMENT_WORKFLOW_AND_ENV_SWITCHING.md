# Development Workflow and Environment Switching

## 1. Overview

This guide provides the official procedure for working with the Patchline AI platform in both local development and production environments. The workflow has been simplified to eliminate manual configuration changes.

## 2. Key Changes (As of December 2024)

- **Automatic Mode Detection**: The application now automatically detects whether it's running in development or production based on `NODE_ENV`
- **No Manual Config Changes**: You no longer need to edit `lib/config.ts` before deploying
- **Single Next.js Config**: We use only `next.config.mjs` (deleted `next.config.js`)
- **Turbopack Support**: You can now use `pnpm dev --turbo` for faster development

## 3. The Golden Rules

1. **DO NOT commit changes to `tsconfig.json` without team consensus**
2. **DO NOT manually change `IS_DEVELOPMENT_MODE` in `lib/config.ts`**
3. **DO NOT create a `next.config.js` file (use only `next.config.mjs`)**

## 4. Development Workflow

### Starting Development

```bash
# Install dependencies
pnpm install

# Run development server (standard)
pnpm dev

# Run development server with Turbopack (faster)
pnpm dev --turbo
```

The application will automatically run in development mode. No configuration changes needed!

## 5. Deployment Workflow

### Deploying to Production

When you're ready to deploy, simply push your changes:

```bash
# Ensure tsconfig.json is clean (if you made any changes)
git checkout tsconfig.json

# Commit your feature changes
git add .
git commit -m "feat: Your feature description"

# Push to your branch
git push origin your-branch

# Merge to master (or create PR)
git checkout master
git merge your-branch
git push origin master
```

The application will automatically run in production mode on Amplify. No configuration changes needed!

## 5. How the Production Build Works

The `amplify.yml` file contains a build step that performs the following actions:

1.  Renames the existing `tsconfig.json` to `tsconfig.original.json`.
2.  Generates a new, optimized `tsconfig.production.json`.
3.  Renames `tsconfig.production.json` to `tsconfig.json`.
4.  Runs the build.
5.  Restores the original `tsconfig.json`.

This ensures a consistent and optimized build environment, but it relies on the committed `tsconfig.json` being in its expected state.

## 6. Troubleshooting

**Symptom:** Build fails on Amplify with TypeScript or type errors.

**Cause:** A modified `tsconfig.json` was likely committed to the repository.

**Solution:**
1.  On your local machine, check out the `main` or `master` branch.
2.  Get the clean, original version of `tsconfig.json`: `git checkout origin/main -- tsconfig.json`
3.  Commit this file and merge it into your feature branch.
4.  Re-deploy on Amplify. 