# Gym Pilot

Gym Pilot is a multi-app fitness planning workspace built as a monorepo. The current focus is a web-based workout planner for creating, editing, and exporting training plans, with support for multiple tabs and Excel export.

## What’s in this repo

- Web app: a React + Vite experience for browsing exercises, creating plans, and exporting them
- Mobile app: a placeholder app entry for future mobile development
- Shared packages: reusable data, hooks, types, and plan state for the workspace

## Key features

- Browse and search exercises
- Create and edit workout plans
- Organise plans across multiple tabs
- Export plan tabs to Excel workbooks using ExcelJS
- Persist plans locally in the browser

## Project structure

- apps/web - main web application
- apps/mobile - mobile app shell
- packages/shared - shared data and plan context
- packages/hooks - reusable hooks
- packages/api - API layer scaffolding
- packages/types - shared TypeScript types

## Getting started

Install dependencies:

```bash
npm install
```

Run the web app locally:

```bash
npm run dev:web
```

Build the web app for production:

```bash
npm run build:web
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
