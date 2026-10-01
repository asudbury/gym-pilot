# Gym Pilot API Reference

This document describes the public API for shared persistence, hooks, and services used across the Gym Pilot application.

## Table of Contents
- [Core Interfaces](#core-interfaces)
- [Persistence Repository](#persistence-repository)
- [Session Data Service](#session-data-service)
- [Supabase Integration](#supabase-integration)
- [Common Patterns](#common-patterns)

## Core Interfaces

### PersistenceRepository

The main repository interface for consistent access to both local and remote storage.

**Location**: `packages/shared/src/repositories/persistenceRepository.ts`

```typescript
interface PersistenceRepository {
  // Profile operations
  getProfile(): Promise<ProfileRecord | null>;
  saveProfile(profile: ProfileRecord): Promise<void>;
  updateProfile(updates: Partial<ProfileRecord>): Promise<void>;

  // Favorite operations
  saveFavorite(favorite: FavoriteRecord): Promise<void>;
  deleteFavorite(id: string): Promise<void>;
  getFavorites(): Promise<FavoriteRecord[]>;

  // Plan operations
  savePlan(plan: PlanRecord): Promise<void>;
  getPlan(id: string): Promise<PlanRecord | null>;
  deletePlan(id: string): Promise<void>;

  // Assignment operations
  saveAssignment(assignment: AssignmentRecord): Promise<void>;
  getAssignment(id: string): Promise<AssignmentRecord | null>;
  deleteAssignment(id: string): Promise<void>;

  // Session operations
  saveSession(session: SessionRecord): Promise<void>;
  getSession(id: string): Promise<SessionRecord | null>;
  deleteSessions(ids: string[]): Promise<void>;
}
```

**Key Notes**:
- All operations are database-agnostic
- Returns `Promise<T | null>` for reads; `null` indicates not found
- Writes throw on error; no error return values
- Repository handles both Dexie (local) and Supabase (remote) backends

### Storage Keys

**Location**: `apps/web/src/constants/storageKeys.ts`

All localStorage keys are centralized as constants. When adding new local storage keys:

1. Add the key to `storageKeys.ts`
2. Import it where needed
3. Never hardcode storage key strings

Example:
```typescript
export const STORAGE_KEYS = {
  THEME_PREFERENCE: 'gym-pilot-theme-preference',
  RECENT_EXERCISES: 'gym-pilot-recent-exercises',
  // Add new keys here
};

// Usage
localStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, 'dark');
```

## Persistence Repository

### Creating/Updating Records

The repository uses explicit `insert` vs `update` patterns for clarity:

```typescript
// Insert new record
await persistenceRepository.savePlan({
  id: generateId(),
  name: 'Monday Workout',
  created_at: new Date(),
  // ... other fields
});

// Update existing record
await persistenceRepository.updateProfile({
  display_name: 'John Doe',
  gym_name: 'My Gym',
});
```

**Why explicit insert/update?**
- Avoids unexpected side effects from upsert behavior
- Makes intent clear in code
- Easier to audit and maintain

### Error Handling

```typescript
try {
  await persistenceRepository.savePlan(plan);
} catch (error) {
  logger.error('Failed to save plan', { error, plan });
  // Show error to user
}
```

Operations throw on error; there are no error returns. Always wrap in try/catch.

## Session Data Service

**Location**: `packages/shared/src/dataServices/sessionDataService.ts`

Specialized service for session and workout item persistence with advanced querying.

```typescript
interface SessionDataService {
  // Session lifecycle
  createSession(session: SessionInsert): Promise<SessionRecord>;
  updateSession(id: string, updates: Partial<SessionRecord>): Promise<void>;
  getSession(id: string): Promise<SessionRecord | null>;
  deleteSession(id: string): Promise<void>;

  // Workout items
  addWorkoutItem(item: WorkoutItemInsert): Promise<WorkoutItemRecord>;
  updateWorkoutItem(id: string, updates: Partial<WorkoutItemRecord>): Promise<void>;
  deleteWorkoutItem(id: string): Promise<void>;

  // Queries
  getSessionsByAssignment(assignmentId: string): Promise<SessionRecord[]>;
  getWorkoutItemsBySession(sessionId: string): Promise<WorkoutItemRecord[]>;
  getRecentSessions(limit: number): Promise<SessionRecord[]>;
}
```

**Key patterns**:
- All operations are async and use Promises
- `getX` returns `null` if not found
- Bulk operations accept arrays
- Queries support filtering and pagination

## Supabase Integration

**Location**: `packages/shared/src/gymPilotSupabase.ts`

Direct Supabase client methods for when repository abstraction isn't sufficient.

### Authentication

```typescript
import { gymPilotSupabase } from '@gym-pilot/shared';

// Sign up
const { data, error } = await gymPilotSupabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await gymPilotSupabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
await gymPilotSupabase.auth.signOut();

// Get current session
const { data: { session } } = await gymPilotSupabase.auth.getSession();
```

### Direct Database Queries

When repository methods don't cover your use case:

```typescript
import { gymPilotSupabase } from '@gym-pilot/shared';

// Select
const { data, error } = await gymPilotSupabase
  .from('gym_pilot_plan')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Insert
const { data, error } = await gymPilotSupabase
  .from('gym_pilot_plan')
  .insert([{ name: 'New Plan', user_id: userId }]);

// Update
const { error } = await gymPilotSupabase
  .from('gym_pilot_plan')
  .update({ name: 'Updated Name' })
  .eq('id', planId);

// Delete
const { error } = await gymPilotSupabase
  .from('gym_pilot_plan')
  .delete()
  .eq('id', planId);
```

**Important**: Prefer the repository abstraction over direct Supabase calls when possible to maintain consistency.

## Common Patterns

### View Model Builders

Build strongly-typed view models from domain data:

```typescript
// In feature domain
export function buildPlanViewModel(
  plan: PlanRecord,
  assignments: AssignmentRecord[]
): PlanViewModel {
  return {
    id: plan.id,
    name: plan.name,
    assignmentCount: assignments.length,
    lastModified: new Date(plan.updated_at).toLocaleDateString(),
  };
}

// Usage in component
const viewModel = buildPlanViewModel(plan, assignments);
```

**Benefits**:
- Testable independently from React
- Clear data transformation logic
- Reusable across components

### Pure Helper Functions

Extract filtering, grouping, and transformations into helpers:

```typescript
// In feature domain
export function filterActiveAssignments(
  assignments: AssignmentRecord[],
  now: Date = new Date()
): AssignmentRecord[] {
  return assignments.filter(
    (a) => new Date(a.start_date) <= now && new Date(a.end_date) >= now
  );
}

export function groupAssignmentsByUser(
  assignments: AssignmentRecord[]
): Map<string, AssignmentRecord[]> {
  const map = new Map<string, AssignmentRecord[]>();
  for (const assignment of assignments) {
    if (!map.has(assignment.user_id)) {
      map.set(assignment.user_id, []);
    }
    map.get(assignment.user_id)!.push(assignment);
  }
  return map;
}

// Usage
const active = filterActiveAssignments(assignments);
const byUser = groupAssignmentsByUser(active);
```

### Logging

Always use the shared logger instead of `console.*`:

```typescript
import { logger } from '@gym-pilot/shared';

// Log levels
logger.error('Operation failed', { error, context });
logger.warn('Deprecated API used', { api: 'oldMethod' });
logger.info('Session created', { sessionId: '123' });
```

**Why not console?**
- Centralized logging management
- Can be redirected to services (e.g., error reporting)
- Consistent formatting
- Supports log levels

### Error Handling

```typescript
try {
  const plan = await persistenceRepository.getPlan(planId);
  if (!plan) {
    throw new Error(`Plan not found: ${planId}`);
  }
  // Process plan
} catch (error) {
  logger.error('Failed to process plan', { error, planId });
  // Notify user
}
```

## File Organization Reference

When creating new features or services:

```
feature/
├── domain/
│   ├── types.ts              # Domain types and interfaces
│   ├── helpers.test.ts        # Pure function tests
│   ├── helpers.ts             # Pure helpers (filtering, grouping, transforms)
│   ├── viewModel.test.ts      # View model builder tests
│   └── viewModel.ts           # View model constructors
├── hooks/
│   ├── useFeature.test.ts
│   └── useFeature.ts          # React hook orchestration
├── services/
│   ├── featureRepository.ts   # Persistence abstractions
│   └── featureService.ts      # API/external service calls
└── index.ts                   # Public exports
```

Shared persistence:
```
packages/shared/
├── repositories/
│   ├── persistenceRepository.ts   # Main repository abstraction
│   └── index.ts                   # Public exports
├── dataServices/
│   ├── sessionDataService.ts      # Session-specific queries
│   └── index.ts
└── gymPilotSupabase.ts            # Direct Supabase client
```

---

For more details on architecture and conventions, see [.github/copilot-instructions.md](.github/copilot-instructions.md).
