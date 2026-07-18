# Copilot instructions for Gym Pilot

## Project overview
- This repository is a monorepo with a Vite React web app in apps/web, shared packages in packages/, and Supabase assets in supabase/.
- Prefer small, focused changes that preserve current behavior while making the codebase easier to maintain.

## Architecture principles
- Keep UI components focused on presentation and user interaction.
- Move business logic, data shaping, filtering, mapping, and route-specific decisions into feature-domain modules under apps/web/src/features/.
- Use shared packages under packages/ for cross-cutting types and data contracts whenever the logic is shared outside a single page.
- Keep page-level components thin; they should orchestrate state and render views rather than contain domain logic inline.

## Preferred structure
- Feature modules should follow this pattern when practical:
  - domain/ for pure helpers, view models, normalization, and mapping logic
  - hooks/ for stateful orchestration that is shared across pages/components
  - services/ for persistence or API access concerns
- Page components should primarily:
  - read from hooks or feature modules
  - manage local UI state only when the state is view-specific
  - delegate derived state calculations to domain helpers

## Refactor expectations
- When touching existing pages, prefer extracting logic into a feature-domain helper before adding more inline branching or transformation code.
- If a component is doing data mapping, filtering, grouping, role resolution, or route selection, move that logic into a helper in the relevant feature domain.
- Preserve current user-facing behavior while improving testability and readability.

## Testing expectations
- Add or update tests for extracted helpers whenever behavior changes or new domain logic is introduced.
- Prefer focused unit tests for domain helpers and view-model builders over brittle UI-only tests.
- Keep tests close to the feature domain they cover.

## TypeScript and React guidance
- Use explicit types for shared data structures and helper return values.
- Prefer reusable domain types over ad-hoc inline object shapes.
- Keep imports aligned with the new architecture: feature modules for domain logic, shared packages for shared contracts.

## Existing conventions to preserve
- Continue to support the current routing, Supabase-backed data flows, and plan/assignment builder experience.
- Preserve the current app behavior for auth, favorites, plans, assignments, admin, and timetable features while improving structure.
