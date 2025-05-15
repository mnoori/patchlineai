# PatchLine AI Project Structure

This document outlines the folder structure and organization of the PatchLine AI codebase.

## Root Directory Structure

```
/project-root (Next.js app)
  /app                  # Next.js app router pages
  /components           # React components
  /public               # Static assets
  /backend              # Backend code
  /shared               # Shared code
    /types              # TypeScript interfaces
    /utils              # Utility functions
  /docs                 # Documentation
```

## Detailed Structure

### `/app`

The `/app` directory contains Next.js App Router pages. Each folder represents a route in the application.

- `/app/layout.tsx` - The root layout for the entire application
- `/app/page.tsx` - The homepage
- `/app/globals.css` - Global CSS styles
- `/app/api` - API routes (may be moved to backend directory)
- `/app/patchline` - Patchline-specific pages
- `/app/pitch-deck` - Pitch deck presentation pages
- `/app/team` - Team-related pages

### `/components`

The `/components` directory contains all React components used in the application.

- `/components/ui` - UI components (buttons, inputs, etc.)
- `/components/pitch-deck` - Components specific to the pitch deck feature
- Other components at the root level

### `/public`

Static assets like images, fonts, and other files that don't need to be processed.

### `/backend`

Backend-specific code including API logic, database connections, etc. This is separate from frontend code to maintain a clear separation of concerns.

### `/shared`

Code shared between frontend and backend:

- `/shared/types` - TypeScript type definitions
- `/shared/utils` - Utility functions that can be used throughout the application

### `/docs`

Project documentation, including:

- Project structure
- Development guides
- API documentation
- Restructuring history

## File Naming Conventions

- React components: PascalCase (e.g., `Hero.tsx`, `TeamSection.tsx`)
- Utility functions: camelCase (e.g., `utils.ts`, `spotifyAuth.ts`)
- Pages: lowercase with hyphens for multi-word filenames (`about-us.tsx`)

## Coding Standards

- Use TypeScript for type safety
- Follow the directory structure outlined above
- Keep components modular and reusable
- Document complex logic and components
- Use Tailwind CSS for styling 