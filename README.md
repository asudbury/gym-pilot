# Gym Pilot

Gym Pilot is a monorepo for a fitness planning workspace with a React web app, shared packages, and Supabase-backed persistence. The current focus is a web-based plan builder for creating, editing, and exporting training plans, with local-first storage and optional remote sync for profiles, favourites, plans, and activity.

## What’s in this repo

- Web app: a React + Vite experience for browsing exercises, building plans, managing favourites, and exporting workbooks
- Mobile app: a lightweight app shell for future mobile development
- Shared packages: reusable data, hooks, types, storage helpers, and plan state for the workspace

## Key features

- Browse and search exercises
- Create and edit workout plans across multiple tabs
- Organise favourites and quick links
- Export plan tabs to Excel workbooks using ExcelJS
- Persist data locally in the browser and optionally sync to Supabase
- Support authenticated profile and access state flows

## Project structure

- apps/web - main web application
- apps/mobile - mobile app shell
- packages/shared - shared storage, Supabase helpers, and data utilities
- packages/hooks - reusable hooks
- packages/api - API layer scaffolding
- packages/types - shared TypeScript types

## Documentation

- [docs/data-schema.md](docs/data-schema.md) - current data model, Supabase schema, and call inventory
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - repository conventions and refactor guidance for future changes
- [Supabase](https://supabase.com/) - the hosted backend and database service used by the app

## Getting started

Install dependencies:

```bash
npm install
```

If you want to use Supabase-backed persistence locally, copy the example environment file and provide the required values:

```bash
cp apps/web/.env.example apps/web/.env
```

Set at least:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

You can also set VITE_FEATURE_SUPABASE_PERSISTENCE_ENABLED=false to disable remote persistence while keeping the app local.

Run the web app locally:

```bash
npm run dev:web
```

Build the web app for production:

```bash
npm run build:web
```

Run the test suite:

```bash
npm test
```

## Local tooling commands

Useful commands for local development and quality checks:

```bash
npm run format:web   # format the web app files
npm run lint:web     # run ESLint
npm run test:web     # run Vitest
npm run knip         # check for unused files, exports, and dependencies
npm run sonar:up     # start a local SonarQube instance with Docker
npm run sonar:analyze # run SonarQube analysis against the local instance
```

## How to use the planner

1. Open the web app and navigate to the plan builder.
2. Search for exercises and add them to the active tab.
3. Create additional tabs for different days or workout sections.
4. Rename each tab to match your plan.
5. Use the export button to download the full plan as an Excel workbook with one worksheet per tab.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- AG Grid
- ExcelJS
- React Router
- Supabase
- Dexie
- TanStack Query
- Vitest
