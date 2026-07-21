# Copilot instructions for Gym Pilot

## Project overview
- This repository is a monorepo with a Vite React web app in apps/web, shared packages in packages/, and Supabase assets in supabase/.
- Prefer small, focused changes that preserve current behavior while making the codebase easier to maintain.

## Architecture principles
- Keep UI components focused on presentation and user interaction.
- Move business logic, data shaping, filtering, mapping, and route-specific decisions into feature-domain modules under apps/web/src/features/.
- Keep hooks thin and focused on React state, effects, and side effects. If logic can be expressed as a decision or transformation, move it into a pure function in the feature domain instead of keeping it inline in the hook.
- Prefer pure helpers for state transitions, view-model construction, normalization, validation, filtering, grouping, role resolution, and route selection so they can be tested independently from React.
- Use shared packages under packages/ for cross-cutting types and data contracts whenever the logic is shared outside a single page.
- Keep page-level components thin; they should orchestrate state and render views rather than contain domain logic inline.
- Centralise shared persistence and storage orchestration behind repository-style abstractions in packages/shared so local-first and remote-backed flows remain consistent and testable.

## Preferred structure
- Feature modules should follow this pattern when practical:
  - domain/ for pure helpers, view models, normalization, and mapping logic
  - hooks/ for stateful orchestration that is shared across pages/components
  - services/ for persistence or API access concerns
- Shared persistence concerns should live in packages/shared, typically behind repository-style modules that expose a consistent interface for local and remote storage.
- Page components should primarily:
  - read from hooks or feature modules
  - manage local UI state only when the state is view-specific
  - delegate derived state calculations to domain helpers

## Refactor expectations
- When touching existing pages, prefer extracting logic into a feature-domain helper before adding more inline branching or transformation code.
- If a component or hook is doing data mapping, filtering, grouping, role resolution, route selection, or state transitions, move that logic into a helper in the relevant feature domain.
- Treat hooks as orchestration layers: React state and effects stay in the hook, while reusable business rules live in pure functions that can be unit tested.
- Preserve current user-facing behavior while improving testability and readability.
- If persistence logic is shared across features, move it behind a repository-style abstraction in packages/shared before adding more ad-hoc storage calls.
- For shared Supabase work, prefer extracting focused modules by responsibility (for example auth/session helpers, activity logging, session history, workout persistence) instead of expanding one large module. Keep the main shared module as a compatibility surface and re-export the extracted helpers from dedicated files.
- When splitting a large shared module, preserve the existing public API for consumers and update exports in a backward-compatible way. Avoid creating new duplicate implementations when a helper can be moved to a new module and re-exported.

## Testing expectations
- Add or update tests for extracted helpers whenever behavior changes or new domain logic is introduced.
- Prefer focused unit tests for domain helpers and view-model builders over brittle UI-only tests.
- Keep tests close to the feature domain they cover.

## Supabase and documentation expectations
- When changing Supabase tables, columns, relationships, or client-side calls, update the documentation in [docs/data-schema.md](docs/data-schema.md) and keep the Mermaid schema diagram in sync.
- If the data model, persistence strategy, storage keys, or schema shape changes, update the relevant documentation immediately so the repo stays consistent.
- Document the relevant Supabase call patterns and the target tables in the shared Supabase module so future changes are easy to audit.
- Keep the shared Supabase interface and persistence boundary documented with concise JSDoc on exported helpers and types, especially where the app talks to the backend.
- If a change is environment-specific (for example, localhost-only behavior), note that clearly in the docs.

## TypeScript and React guidance
- Use explicit types for shared data structures and helper return values.
- Prefer reusable domain types over ad-hoc inline object shapes.
- Keep imports aligned with the new architecture: feature modules for domain logic, shared packages for shared contracts.
- Add JSDoc comments for exported functions, shared helpers, and service modules, especially in packages/shared, describing purpose, inputs, outputs, side effects, and important assumptions.
- Prefer concise JSDoc blocks like `/** ... */` above exported symbols rather than leaving complex logic undocumented.

## Existing conventions to preserve
- Continue to support the current routing, Supabase-backed data flows, and plan/assignment builder experience.
- Preserve the current app behavior for auth, favorites, plans, assignments, admin, and timetable features while improving structure.
