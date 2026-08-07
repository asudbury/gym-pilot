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
- Guide new users through a welcome step that records terms-and-conditions acceptance before access is granted

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


Run the web app locally:

```bash
npm run dev:web
```

Build the web app for production:

```bash
npm run build:web
```

## GitHub Pages deployment

The web app is configured for GitHub Pages under the repository subpath `/gym-pilot/`. If the repository name changes, update the base path in [apps/web/vite.config.ts](apps/web/vite.config.ts) so the built app, manifest, and install links continue to resolve correctly on the published site.

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

## Help — For Business Users

This section is a short, non-technical guide describing what the product does and how to use it for planning, templates, and member assignments.

- **Purpose:** Gym Pilot helps trainers and managers build repeatable workout plans from reusable workout templates, assign plans to members, and record session activity. It is designed to speed up programme creation and keep consistent workouts across staff.

- **Core concepts:**
	- **Workout Template:** a saved list of exercises (the building block). Templates snapshot exercise names and positions so they are stable.
	- **Plan:** a collection of workout templates arranged into days/tabs and enriched with scheduling/assignment details.
	- **Assignment:** a plan given to a user or cohort for a period of time.
	- **Session:** a recorded training instance (actual performed workout) linked back to plan/template information for reporting.

- **Common workflows (quick):**
	1. Create a **Workout Template**: go to Templates → Create, add exercises, save. Templates are reusable across plans.
 2. Build a **Plan**: create a new plan, add templates (or individual exercises) into tabs/days, adjust ordering, then save.
 3. **Assign** a plan: from Plans, choose the plan and assign it to a member or group with start/end dates.
 4. **Record Sessions**: members and trainers record sessions; data is stored locally and optionally synced to Supabase.

- **Admin tasks & roles:**
	- Admins can manage user profiles, roles, and view/override templates or assignments.
	- Be mindful of access: templates and plans are owned by the creator unless transferred.

- **Data & migrations:**
	- The app persists data locally and can sync to a Supabase backend. Database migrations live in `supabase/migrations` and are applied with `supabase db push`.
	- Template rows include a snapshot of exercise names to keep historical accuracy when exercise catalog entries change.

- **Tips for non-technical staff:**
	- Use Templates for commonly repeated sessions (e.g., "Full Body — Monday").
	- Encourage naming consistency so exported plans are readable.
	- Use Favourites to store quick links to frequently used plans or templates.

- **Support & contacts:**
	- For product questions, contact the product owner or the operations lead (add your team's contact info here).
	- For technical deployments or DB migrations, contact the engineering lead and reference the `supabase/migrations` folder.

If you'd like, I can turn this into a dedicated `docs/help.md` page, or expand any workflow into step-by-step screenshots or a short video script.
