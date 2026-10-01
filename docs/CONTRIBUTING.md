# Contributing to Gym Pilot

Thank you for your interest in contributing to Gym Pilot! This guide will help you understand how to set up your development environment and contribute effectively to the project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style & Conventions](#code-style--conventions)
- [Architecture Principles](#architecture-principles)

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a branch for your changes (see [Branch Naming](#branch-naming))
4. Make your changes following our guidelines
5. Submit a pull request

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/asudbury/gym-pilot.git
cd gym-pilot

# Install dependencies
npm install

# Set up environment variables (if using Supabase)
cp apps/web/.env.example apps/web/.env
# Edit .env with your Supabase credentials
```

### Running Locally

```bash
# Start the web app in development mode
npm run dev:web

# Build the web app
npm run build:web

# Run linting and formatting checks
npm run lint:web
npm run format:web

# Run tests
npm run test:web          # Web app tests
npm run test:shared       # Shared package tests
npm run test:all          # All tests

# Run full verification (lint, test, build, knip)
npm run verify:precommit   # Pre-commit checks
npm run verify             # Full verification
```

## Branch Naming

Follow this convention for branch names:

- **Feature**: `feature/short-description` (e.g., `feature/add-workout-export`)
- **Bug fix**: `fix/short-description` (e.g., `fix/session-date-validation`)
- **Refactor**: `refactor/short-description` (e.g., `refactor/extract-plan-builder-logic`)
- **Documentation**: `docs/short-description` (e.g., `docs/api-reference`)
- **Chore**: `chore/short-description` (e.g., `chore/update-dependencies`)

Branch names should be:
- Lowercase
- Use hyphens to separate words
- Descriptive but concise (50 characters or less)

## Making Changes

### 1. Code Quality
Before committing, ensure your code passes all checks:

```bash
# Format your code
npm run format:web

# Check for linting issues
npm run lint:web

# Run type checking
npm run typecheck

# Run tests
npm run test:all
```

### 2. TypeScript & Types
- Use explicit types for all function parameters and return values
- Avoid using `any` — use more specific types or generics
- Keep TypeScript strict mode enabled (noUnusedLocals, noUnusedParameters)
- Prefer reusable domain types over ad-hoc inline object shapes

### 3. Component Organization
Follow the established architecture:

- **UI Components**: `apps/web/src/components/` — presentation and user interaction only
- **Feature Modules**: `apps/web/src/features/*/` — domain logic, hooks, services
  - `domain/` — pure helpers, view models, normalization
  - `hooks/` — stateful orchestration
  - `services/` — persistence and API concerns
- **Pages**: `apps/web/src/pages/` — thin orchestration layers
- **Shared Packages**: `packages/shared/` — cross-cutting logic and types

### 4. Hooks vs. Pure Functions
- Keep hooks focused on React state, effects, and side effects
- Extract business logic, transformations, and decisions into pure functions
- Place pure functions in the feature domain where they can be unit tested independently

### 5. Storage & Persistence
- Use centralized storage keys from `apps/web/src/constants/storageKeys.ts`
- Use `logger` from `@gym-pilot/shared` instead of `console.*`
- Encapsulate persistence behind repository-style abstractions in `packages/shared`

### 6. Documentation
- Add JSDoc comments to all exported functions and types in shared modules
- Document complex or non-obvious logic inline
- Update `docs/data-schema.md` if Supabase tables, columns, or relationships change
- Update relevant documentation in the same PR as schema changes

## Testing

### Test Structure
- Place tests close to the code they cover
- Name test files with `.test.ts` or `.test.tsx` suffix
- Focus on unit tests for domain helpers and view-model builders
- Prefer testing pure functions over UI-only tests

### Writing Tests
```typescript
// Good: Test domain logic independently
describe('exerciseFilter', () => {
  it('returns only exercises matching the search term', () => {
    const result = filterExercises(exercises, 'squat');
    expect(result).toHaveLength(1);
  });
});

// Avoid: Testing React internals without testing domain logic
describe('ExerciseList component', () => {
  it('renders without crashing', () => {
    render(<ExerciseList />);
  });
});
```

### Test Coverage
- Aim for coverage of domain helpers and services
- Shared package tests should have high coverage (70%+)
- Run coverage reports: `npm run test:coverage`

## Submitting a Pull Request

### Before Submitting
- [ ] Create a branch from the default branch (usually `main` or `develop`)
- [ ] Make sure all tests pass locally
- [ ] Run the full verification suite: `npm run verify:precommit`
- [ ] Follow the PR template provided

### PR Guidelines
1. **Title**: Use the same format as branch names
   - Example: `fix: Correct session date validation on mobile`

2. **Description**: Use the provided PR template to:
   - Explain what changed and why
   - Describe how it was tested
   - Link related issues
   - Include screenshots for UI changes

3. **Size**: Keep PRs focused and reasonably sized
   - Aim for 200-400 lines of changes when possible
   - Split large refactors into multiple PRs

4. **Review**: Address all feedback from reviewers
   - Respond to comments
   - Re-request review after making changes

## Code Style & Conventions

### TypeScript
- Use explicit return types for functions
- Prefer interfaces over type aliases for object shapes
- Use `Record<string, T>` instead of index signatures when possible
- Import types using `import type { T } from '...'`

### React
- Use functional components with hooks
- Prefer arrow functions for components
- Use `React.ReactNode` for component children
- Name component files in PascalCase

### Naming
- Constants: `UPPER_SNAKE_CASE`
- Functions/variables: `camelCase`
- Types/Interfaces: `PascalCase`
- CSS classes: `kebab-case`
- Components: `PascalCase`

### File Organization
```
feature/
├── domain/
│   ├── types.ts           # Domain types and interfaces
│   ├── helpers.ts         # Pure helper functions
│   └── viewModel.ts       # View model builders
├── hooks/
│   ├── useFeature.ts      # React hooks
│   └── useFeatureState.ts
├── services/
│   ├── featureService.ts  # Persistence/API
│   └── featureRepository.ts
└── index.ts               # Public exports
```

## Architecture Principles

### Layering
1. **Presentation**: Components focused on rendering and user interaction
2. **Domain**: Pure business logic, helpers, and transformations
3. **Services**: Persistence, API calls, and side effects
4. **State**: React hooks coordinating state and effects

### Key Rules
- Move business logic out of components into domain helpers
- Keep hooks thin — they orchestrate, not calculate
- Centralize persistence behind repository abstractions
- Prefer pure functions that can be tested independently
- Use typed data structures; avoid `any`

### Refactoring Guidelines
When touching existing code:
- Extract logic into feature-domain helpers before adding inline branching
- Move data mapping, filtering, grouping into domain helpers
- Test extracted helpers independently before refactoring
- Preserve existing user-facing behavior

## Helpful Resources

- [Architecture Guide](.github/copilot-instructions.md) — Detailed architecture principles and conventions
- [Data Schema](data-schema.md) — Database schema, tables, and persistence patterns
- [Tech Stack](README.md#tech-stack) — Libraries and frameworks used

## Questions?

- Check existing [issues](https://github.com/asudbury/gym-pilot/issues)
- Review [pull requests](https://github.com/asudbury/gym-pilot/pulls) for similar work
- Ask in the issue or PR you're working on

## Code of Conduct

Please be respectful and constructive in all interactions. We're committed to making this a welcoming community for contributors of all backgrounds.

---

Happy contributing! 🚀
