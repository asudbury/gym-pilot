# Gym Pilot data schema

## Data types

### App setting — app_setting

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| setting_key | string | Unique setting identifier |
| setting_value | Json | Stored JSON payload |
| created_at | string | Creation timestamp |
| updated_at | string | Last update timestamp |

### Assignment — assignment

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| user_id | string | Owner of the assignment |
| plan_id | string | Related plan template |
| assignment_name | string | Friendly assignment title |
| assigned_user_id | string \| null | Optional assignee |
| assigned_user_name | string \| null | Optional assignee display name |
| completed_exercises | Json | Completion tracking payload |
| plan_items | Json | Assignment-specific plan rows |
| created_at | string | Creation timestamp |
| updated_at | string | Last update timestamp |

### Audit log — audit_log

| Field      | Type                            | Notes                   |
| ---------- | ------------------------------- | ----------------------- |
| id         | string                          | Primary key             |
| message    | string                          | Audit event description |
| details    | Record<string, unknown> \| null | Optional payload        |
| created_at | string                          | Creation timestamp      |

### Error log — error_log

| Field      | Type                            | Notes                  |
| ---------- | ------------------------------- | ---------------------- |
| id         | string                          | Primary key            |
| message    | string                          | Error description      |
| details    | Record<string, unknown> \| null | Optional error payload |
| created_at | string                          | Creation timestamp     |

### Exercise — local/seed data (no dedicated Supabase table)

| Field             | Type             | Notes                           |
| ----------------- | ---------------- | ------------------------------- |
| id                | string           | Primary key                     |
| name              | string           | Exercise name                   |
| category          | string           | Exercise category               |
| body_part         | string           | Main body part                  |
| equipment         | string           | Equipment requirement           |
| instructions      | { en: string }   | Localised instructions          |
| instruction_steps | { en: string[] } | Localised step-by-step guidance |
| muscle_group      | string           | Primary muscle group            |
| secondary_muscles | string[]         | Secondary muscle groups         |
| target            | string           | Target focus                    |
| image             | string           | Image path                      |
| gif_url           | string           | GIF media path                  |
| media_id          | string           | Media reference                 |
| created_at        | string           | Creation timestamp              |
| attribution       | string           | Source attribution              |

### Favourite folder — gym_pilot_favourite_folder

| Field      | Type   | Notes                 |
| ---------- | ------ | --------------------- |
| id         | string | Primary key           |
| user_id    | string | Owner of the folder   |
| name       | string | Folder label          |
| created_at | string | Creation timestamp    |
| updated_at | string | Last update timestamp |

### Favourite link — gym_pilot_favourite

| Field      | Type           | Notes                     |
| ---------- | -------------- | ------------------------- |
| id         | string         | Primary key               |
| user_id    | string         | Owner of the link         |
| path       | string         | Route or target path      |
| label      | string         | Display label             |
| folder     | string \| null | Optional folder name      |
| folder_id  | string \| null | Optional folder reference |
| created_at | string         | Creation timestamp        |
| updated_at | string         | Last update timestamp     |

### Plan — gym_pilot_plan
| Field      | Type   | Notes                       |
| ---------- | ------ | --------------------------- |
| id         | string | Primary key                 |
| user_id    | string | Plan owner                  |
| plan_name  | string | Plan title                  |
| plan_slug  | string | URL-friendly slug           |
| created_at | string | Creation timestamp          |
| updated_at | string | Last update timestamp       |

### Workout plan exercise — workout_plan_exercise

| Field      | Type   | Notes               |
| ---------- | ------ | ------------------- |
| exerciseId | string | Referenced exercise |
| note       | string | Optional note       |

| Field         | Type   | Notes                               |
| ------------- | ------ | ----------------------------------- |
| id            | string | Primary key                         |
| plan_id       | string | Foreign key to `workout_plan`       |
| exercise_id   | string | Catalog exercise id (stored as text)|
| exercise_name | string | Denormalised exercise name for display |
| position      | number | Ordering within the plan            |
| details       | Json   | JSON details / overrides            |
| created_at    | string | Creation timestamp                  |
| updated_at    | string | Last update timestamp               |

### Profile — gym_pilot_profile

| Field                     | Type               | Notes                                            |
| ------------------------- | ------------------ | ------------------------------------------------ |
| id                        | string             | Primary key                                      |
| user_id                   | string             | Supabase auth user (unique)                      |
| friendly_name             | string \| null     | Display name                                     |
| must_change_password      | boolean            | Flag to require password change on next sign-in  |
| terms_accepted            | boolean            | Acceptance flag                                  |
| terms_accepted_at         | string \| null     | Acceptance timestamp                             |
| trainer_id                | string \| null     | Optional trainer reference                       |
| application_name          | string \| null     | App identifier for the profile                   |
| gym_brand                 | string \| null     | Gym brand name                                   |
| gym_name                  | string \| null     | Gym or club display name                         |
| gym_club_id               | number \| null     | External gym/club id                             |
| account_tier              | 'free'|'bronze'|'silver'|'gold' | Account tier (enum)                              |
| access_ends_at            | string \| null     | Subscription / access expiry timestamp           |
| is_frozen                 | boolean            | Whether the profile is frozen                    |
| last_logged_in_at         | string \| null     | Last login timestamp                             |
| previous_last_logged_in_at| string \| null     | Previous login timestamp                         |
| email                     | string \| null     | Optional email (kept in profile snapshot)        |
| created_at                | string             | Creation timestamp                               |
| updated_at                | string             | Last update timestamp                            |

### Session workout item — gym_pilot_user_session_workout_item

| Field            | Type                                                       | Notes                          |
| ---------------- | ---------------------------------------------------------- | ------------------------------ |
| id               | string                                                     | Primary key                    |
| session_id       | string                                                     | Parent session identifier      |
| session_row_id   | string \| null                                             | Optional session row reference |
| user_id          | string                                                     | Owner of the workout row       |
| item_index       | number                                                     | Position within the session    |
| category         | exercise \| warm_up \| stretch \| cool_down \| run \| spin | Workout item category          |
| exercise_name    | string \| null                                             | Exercise label                 |
| exercise_id      | string \| null                                             | Optional canonical exercise id |
| reps             | string \| null                                             | Repetition value               |
| sets             | string \| null                                             | Set count                      |
| weight           | string \| null                                             | Weight value                   |
| duration_minutes | string \| null                                             | Duration value                 |
| distance_km      | string \| null                                             | Distance value                 |
| speed_kph        | string \| null                                             | Speed value                    |
| notes            | string \| null                                             | Optional notes                 |
| plan_item_id     | string \| null                                             | Optional related plan item     |
| sort_order       | number \| null                                             | Optional ordering field        |
| created_at       | string                                                     | Creation timestamp             |
| updated_at       | string                                                     | Last update timestamp          |

### Imported workout — gym_pilot_imported_workout

| Field        | Type           | Notes |
| ------------ | -------------- | ------------------------------------------------------------- |
| id           | string         | Primary key                                                   |
| user_id      | string         | Owner of the imported workout                                  |
| display_name | string         | Human-friendly workout name                                    |
| start_date   | string         | Start timestamp                                                |
| duration     | number         | Duration in seconds                                            |
| energy       | number \| null | Optional energy reading                                         |
| energy_unit  | string \| null | Optional energy unit                                            |
| original_id  | string \| null | Optional original provider id (for de-duplication)             |
| session_id   | string \| null | Optional linked `user_workout` session identifier              |
| created_at   | string         | Creation timestamp                                              |

### Workout template — workout_template

| Field      | Type           | Notes |
| ---------- | -------------- | ------------------------------------------------------------- |
| id         | string         | Primary key                                                   |
| user_id    | string         | Owner of the template                                         |
| name       | string         | Template name                                                 |
| description| string \| null | Optional long description                                      |
| metadata   | Record<string, unknown> | Arbitrary JSON metadata                               |
| created_at | string         | Creation timestamp                                            |
| updated_at | string \| null | Last update timestamp                                         |

### Workout template exercise — workout_template_exercise

| Field       | Type           | Notes |
| ----------- | -------------- | ------------------------------------------------------------- |
| id          | string         | Primary key                                                   |
| template_id | string         | Foreign key to `workout_template`                             |
| exercise_id | string         | Catalog exercise id (stored as text)                          |
| exercise_name | string \| null | Denormalised exercise name for display                     |
| position    | number         | Ordering within the template                                  |
| details     | Record<string, unknown> | JSON details / overrides for the exercise             |
| created_at  | string         | Creation timestamp                                            |

### User — auth.users

| Field | Type                                | Notes                   |
| ----- | ----------------------------------- | ----------------------- |
| id    | string                              | Primary key             |
| name  | string                              | Display name            |
| slug  | string                              | URL-friendly identifier |
| role  | admin \| trainer \| client \| guest | Assigned role           |

### User role — gym_pilot_user_role

| Field      | Type                                | Notes                  |
| ---------- | ----------------------------------- | ---------------------- |
| id         | string                              | Primary key            |
| user_id    | string                              | User who owns the role |
| role       | admin \| trainer \| client \| guest | Assigned role          |
| created_at | string                              | Creation timestamp     |
| updated_at | string                              | Last update timestamp  |

### User session — user_workout

| Field            | Type                                                           | Notes                      |
| ---------------- | -------------------------------------------------------------- | -------------------------- |
| id               | string                                                         | Primary key                |
| user_id          | string \| null                                                 | Session owner              |
| session_type     | class \| personal_training \| solo                             | Session category           |
| start_at         | string                                                         | Start timestamp            |
| duration_minutes | number \| null                                                 | Optional duration          |
| trainer_id       | string \| null                                                 | Optional trainer reference |
| trainer_name     | string \| null                                                 | Optional trainer label     |
| class_id         | string \| null                                                 | Optional class reference   |
| class_name       | string \| null                                                 | Optional class label       |
| location         | string \| null                                                 | Optional location          |
| capacity         | number \| null                                                 | Optional capacity          |
| price            | number \| null                                                 | Optional price             |
| metadata         | Record<string, unknown> \| null                                | Session metadata payload   |
| role             | client \| trainer \| null                                      | User role for the session  |
| status           | booked \| cancelled \| attended \| no_show \| declined \| null | Booking state              |
| notes            | string \| null                                                 | Optional notes             |
| rating           | number \| null                                                 | Optional rating            |
| attendance_type  | attended \| taught \| null                                     | Attendance classification  |
| created_at       | string                                                         | Creation timestamp         |
| updated_at       | string                                                         | Last update timestamp      |

## Storage model

The app now has a local-first data layer based on Dexie and a query layer based on TanStack Query.

- Dexie stores key/value records in IndexedDB.
- TanStack Query is used for API-backed state and caching.

## Supabase schema

The current Supabase schema is defined in the migrations folder [supabase/migrations](supabase/migrations).

### Supabase call inventory

The shared Supabase helpers in [packages/shared/src/gymPilotSupabase.ts](packages/shared/src/gymPilotSupabase.ts) centralise the app's remote persistence and auth calls. When this surface changes, update this section and the Mermaid diagram below.

| Area                    | Current call patterns                                                                                                                                                                                                                                                                                                                                                                                 | Tables / resources                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Auth and session        | `client.auth.getSession()`, `client.auth.signInWithOAuth()`, `client.auth.signInWithPassword()`, `client.auth.signUp()`, `client.auth.resetPasswordForEmail()`, `client.auth.updateUser()`, `client.auth.signOut()`                                                                                                                                                                                   | Supabase Auth users and session state                                                            |
| Profiles and settings   | `loadSupabaseProfileSnapshot()`, `saveSupabaseProfileName()`, `saveSupabaseApplicationName()`, `saveSupabaseGymBrand()`, `saveSupabaseGymName()`, `saveSupabaseProfileAccessSettings()`, `saveSupabaseProfileFlag()`, `saveSupabaseProfileLastLoggedIn()`, `loadSupabaseProfileTermsAcceptance()`, `saveSupabaseProfileTermsAcceptance()`, `loadSupabaseProfileRoles()`, `saveSupabaseProfileRoles()` | `gym_pilot_profile`, `gym_pilot_user_role` |
| Key/value persistence   | `loadSupabaseJsonRecord()`, `saveSupabaseJsonRecord()`, `removeSupabaseJsonRecord()`                                                                                                                                                                                                                                                                                                                  | `gym_pilot_app_state` plus table-specific rows for plans, assignments, favourites, and app state |
| Plans and assignments   | `select`, `insert`, `upsert`, `delete` against remote rows                                                                                                                                                                                                                                                                                                                                            | `gym_pilot_plan`, `assignment` |
| Favourites and folders  | `select`, `insert`, `upsert`, `delete` against remote rows                                                                                                                                                                                                                                                                                                                                            | `gym_pilot_favourite_folder`, `gym_pilot_favourite`                                              |
| Activity logging        | `recordSupabaseUserActivity()` uses `insert` into `user_activity`; it skips inserts when the app is running on localhost-style hosts                                                                                                                                                                                                                                                        | `user_activity`                                                                        |
| Session recording       | `saveTimetableAttendance()` inserts role-based session records with optional notes and a 1-5 rating for a session/class                                                                                                                                                                                                                                                                               | `user_workout`                                                                         |
| Workout items           | `loadWorkoutItemsForSession()` and `saveWorkoutItemsForSession()` read/write ordered workout rows for a session                                                                                                                                                                                                                                                                                       | `gym_pilot_user_session_workout_item`                                                            |
| Imported workouts       | Import pipeline and CSV/GPX/connected-service imports — `importWorkout()` and related helpers read/write imported workout rows                                                                                                                                                                                                                                                                        | `gym_pilot_imported_workout`                                                            |
| Templates               | Create and reuse workout templates via `createWorkoutTemplate()`, `loadWorkoutTemplates()` and related helpers                                                                                                                                                                                                                                                                                         | `workout_template`, `workout_template_exercise`                                          |
| Error and audit logging | `persistErrorLog()` and `persistAuditLog()` write to `error_log` and `audit_log` only when the matching app settings are enabled                                                                                                                                                                                                                                                  | `error_log`, `audit_log`                                                     |

### Entity relationship overview

```mermaid
erDiagram
    auth_users ||--o{ gym_pilot_app_state : owns
    auth_users ||--o{ gym_pilot_profile : owns
    auth_users ||--o{ gym_pilot_user_role : has
    auth_users ||--o{ gym_pilot_favourite_folder : owns
    auth_users ||--o{ gym_pilot_favourite : owns
    auth_users ||--o{ gym_pilot_plan : owns
    auth_users ||--o{ assignment : owns
    auth_users ||--o{ user_activity : records
    auth_users ||--o{ user_workout : records
    gym_pilot_plan ||--o{ assignment : uses
    user_workout ||--o{ gym_pilot_user_session_workout_item : contains

    gym_pilot_app_state {
        uuid id
        uuid user_id
        text key
        jsonb value
        timestamptz updated_at
    }

    gym_pilot_profile {
        uuid id
        uuid user_id
        text friendly_name
        boolean must_change_password
        uuid trainer_id
        text application_name
        text gym_brand
        text gym_name
        bigint gym_club_id
        text account_tier
        timestamptz access_ends_at
        boolean is_frozen
        boolean terms_accepted
        timestamptz terms_accepted_at
        timestamptz last_logged_in_at
        timestamptz previous_last_logged_in_at
        timestamptz created_at
        timestamptz updated_at
    }

    gym_pilot_user_role {
        uuid id
        uuid user_id
        text role
        timestamptz created_at
        timestamptz updated_at
    }

    gym_pilot_favourite_folder {
        uuid id
        uuid user_id
        text name
        timestamptz created_at
        timestamptz updated_at
    }

    gym_pilot_favourite {
        uuid id
        uuid user_id
        text path
        text label
        text folder
        uuid folder_id
        timestamptz created_at
        timestamptz updated_at
    }

    workout_plan {
        uuid id
        uuid user_id
        text plan_name
        text plan_slug
        timestamptz created_at
        timestamptz updated_at
    }

    workout_plan_exercise {
        uuid id
        uuid plan_id
        text exercise_id
        text exercise_name
        integer position
        jsonb details
        timestamptz created_at
        timestamptz updated_at
    }

    gym_pilot_plan {
        uuid id
        uuid user_id
        text plan_name
        text plan_slug
        jsonb plan_sessions
        timestamptz created_at
        timestamptz updated_at
    }

    assignment {
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

    user_activity {
        uuid id
        uuid user_id
        text event_type
        jsonb event_data
        timestamptz created_at
    }

    user_workout {
        uuid id
        bigint gym_club_id
        text session_type
        text class_id
        text class_name
        uuid trainer_id
        text trainer_name
        timestamptz start_at
        int duration_minutes
        text location
        int capacity
        int price
        jsonb metadata
        uuid user_id
        text session_id
        text role
        text status
        text notes
        smallint rating
        text attendance_type
        double precision energy
        text energy_unit
        timestamptz created_at
        timestamptz updated_at
    }

    gym_pilot_user_session_workout_item {
        uuid id
        text session_id
        uuid session_row_id
        uuid user_id
        int item_index
        text category
        text exercise_name
        text exercise_id
        text reps
        text sets
        text weight
        text duration_minutes
        text distance_km
        text speed_kph
        text notes
        text plan_item_id
        int sort_order
        timestamptz created_at
        timestamptz updated_at
    }
```

### Notes

- a shared app state table for user-scoped key/value persistence
- a profile table for friendly names, gym brand/club metadata, optional user settings, and the terms-and-conditions acceptance state used by the welcome flow
- a favourites table plus folders for saved exercise and link shortcuts
- a plans table for plan templates
- an assignments table for user-specific plan assignments
- a dedicated workout-item table for session workout rows so workout data can be queried independently from the session metadata payload
- row-level security policies for authenticated users
- auth metadata can mark a user as requiring a password change on next sign-in

### Client-side preference storage

The app currently keeps UI preferences such as theme choice and the version banner visibility in browser storage rather than Supabase.

- `gym-pilot-theme-preference` is stored in localStorage and controls the light/dark theme

These values are intentionally kept client-side because they are lightweight UI preferences rather than shared domain data. They are suitable for localStorage unless the product later decides that preferences should follow a user across devices or be managed as part of a broader profile experience.

The schema is intentionally consolidated into a single migration so the profile, favourites, assignments, and activity tables can be applied together while remaining safe for existing environments.
