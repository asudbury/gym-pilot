# Gym Pilot data schema

## Data types

### Exercise
Represents a browsable exercise entry used on the home page and exercise detail pages.

- id: string
- name: string
- category: string
- body_part: string
- equipment: string
- instructions: { en: string }
- instruction_steps: { en: string[] }
- muscle_group: string
- secondary_muscles: string[]
- target: string
- image: string
- gif_url: string
- media_id: string
- created_at: string
- attribution: string

### Plan
Represents a base training plan created by a trainer or user and used as a template.

- id: string
- planName: string
- planSlug: string
- exercises: PlanItem[]

### Assignment
Represents a user-specific assignment that references a Plan and owns completion state for that user.

- id: string
- planId: string
- planName: string
- planSlug: string
- assignedUserId?: string
- assignedUserName?: string
- completedExercises?: Record<string, string>
- planItems: PlanItem[]
- per-item user data is stored on each PlanItem, such as reps, weight, or other completion values

### PlanItem
A plan-specific entry that references an Exercise by ID and can carry assignment-specific values.

- exerciseId: string
- note: string
- user data such as reps, weight, or completion values can be stored on this item

### User
Represents a person who can be assigned to plans and given a role.

- id: string
- name: string
- slug: string
- role: admin | trainer | user

## Storage model
The app now has a local-first data layer based on Dexie and a query layer based on TanStack Query.

- Dexie stores key/value records in IndexedDB.
- TanStack Query is used for API-backed state and caching.

## Supabase schema
The Supabase schema is now defined in a single migration file at [supabase/migrations/20260717120000_consolidated_gym_pilot_schema.sql](supabase/migrations/20260717120000_consolidated_gym_pilot_schema.sql).

### Entity relationship overview
```mermaid
erDiagram
    auth_users ||--o{ gym_pilot_app_state : owns
    auth_users ||--o{ gym_pilot_favorites : owns
    auth_users ||--o{ gym_pilot_plans : owns
    auth_users ||--o{ gym_pilot_assignments : creates
    gym_pilot_plans ||--o{ gym_pilot_assignments : uses

    gym_pilot_app_state {
        uuid id
        uuid user_id
        text key
        jsonb value
        timestamptz updated_at
    }

    gym_pilot_favorites {
        uuid id
        uuid user_id
        text path
        text label
        timestamptz created_at
        timestamptz updated_at
    }

    gym_pilot_plans {
        uuid id
        uuid user_id
        text plan_name
        text plan_slug
        jsonb plan_sessions
        timestamptz created_at
        timestamptz updated_at
    }

    gym_pilot_assignments {
        uuid id
        uuid user_id
        uuid plan_id
        text assignment_name
        uuid assigned_user_id
        text assigned_user_name
        jsonb completed_exercises
        jsonb plan_items
        timestamptz created_at
        timestamptz updated_at
    }
```

### Notes
- a shared app state table for user-scoped key/value persistence
- a favorites table for saved exercise and link shortcuts
- a plans table for plan templates
- an assignments table for user-specific plan assignments
- row-level security policies for authenticated users

The earlier split migrations for app state, plans/assignments, and the app-state uniqueness constraint are now consolidated into this single migration.
