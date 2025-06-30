# Development Workflow and Environment Switching

## 1. Overview

This guide provides the official procedure for switching between local development and production modes. Following these steps is crucial to prevent build failures in the Amplify production environment.

The key issue is the management of `tsconfig.json`. The production build on Amplify uses a specific, stripped-down version of this file for performance and memory reasons. A developer's local `tsconfig.json` can easily conflict with this.

## 2. The Golden Rule

**DO NOT commit changes to `tsconfig.json` without team consensus.**

The `tsconfig.json` in the repository is the standard for local development. The production build will always generate its own configuration.

## 3. Switching to Development Mode

When you start working on a new feature, you'll be in development mode.

1.  **Ensure `lib/config.ts` is in development mode:**

    ```typescript
    // lib/config.ts
    export const IS_DEVELOPMENT_MODE = true;
    ```

    **Note:** This change should **NEVER** be committed to the main branch. Use a feature branch.

2.  **Run the development server:**
    ```bash
    pnpm dev
    ```

Next.js might automatically modify `tsconfig.json` for you. These changes are usually safe for local development but should not be committed.

## 4. Switching to Production Mode (for Deployment)

When you are ready to deploy, you must ensure your branch is clean and configured for production.

1.  **Revert any changes to `tsconfig.json`:**
    ```bash
    git checkout tsconfig.json
    ```

2.  **Set `lib/config.ts` to production mode:**
    ```typescript
    // lib/config.ts
    export const IS_DEVELOPMENT_MODE = false;
    ```

3.  **Commit and Push:**
    ```bash
    git add lib/config.ts
    git commit -m "feat: Ready for production deployment"
    git push origin your-branch
    ```

The Amplify build process (`amplify.yml`) will handle the rest.

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