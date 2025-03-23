# CLAUDE.md - Agent Assistant Reference

## Build & Development Commands
- Dev: `pnpm dev` or `next dev --turbopack`
- Build: `pnpm build` or `next build`
- Start: `pnpm start` or `next start`
- Lint: `pnpm lint` or `next lint`

## Code Style Guidelines
- TypeScript with strict type checking enabled
- React functional components with explicit type annotations
- Mark client components with `'use client'` directive
- Use PascalCase for component names, camelCase for variables/functions
- Define interfaces for component props and API responses
- Leverage Next.js App Router conventions for API routes
- Use try/catch blocks for async operations with appropriate error handling
- Prefer named exports over default exports
- Group imports by: 1) external libraries, 2) internal components, 3) types/utils
- Follow Next.js patterns for data fetching and state management
- Use CSS modules or Tailwind for styling