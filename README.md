# PatchLine AI

A Next.js application for PatchLine AI.

## Project Structure

The project follows a clean and organized structure:

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

## Directory Explanations

- **/app**: Contains Next.js app router pages and layouts
- **/components**: React components used throughout the application
- **/public**: Static assets like images, fonts, etc.
- **/backend**: Backend-specific code and API routes
- **/shared**: Code shared between frontend and backend
  - **/types**: TypeScript type definitions
  - **/utils**: Utility functions
- **/docs**: Project documentation

## Getting Started

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Development

- Make sure to follow the established directory structure
- Keep components in the `/components` directory
- Place shared code in the `/shared` directory
- Document any significant changes in the `/docs` directory