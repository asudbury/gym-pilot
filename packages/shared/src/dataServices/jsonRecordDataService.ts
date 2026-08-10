import { TableNames } from "@gym-pilot/shared/src/dataServices/tableNames";
import type { Plan, WorkoutPlanSession } from "../dataServices/types";
import { logger } from "../logging"; // Assuming logger is defined elsewhere
import { getSupabaseClient } from "../supabase";
import { getAuthenticatedUserId } from "../supabaseAuth";
import type { WorkoutPlanExercise } from "./types";

type PlanWithExercises = Plan & { planExercises?: WorkoutPlanExercise[] };

export type SupabaseRecordResponse<T> = {
  found: boolean;
  value: T | null;
};

export type FavoriteLink = {
  id?: string;
  label: string;
  path: string;
  folder?: string;
};

export type FavoriteStorageValue = {
  favorites: FavoriteLink[];
  folders: string[];
};

export function buildPlanSessionsWithExercises<
  TSession extends { id: string; planItems?: TExercise[] },
  TExercise,
>(sessions: TSession[], exercises: TExercise[]): TSession[] {
  if (sessions.length === 0) {
    return sessions;
  }

  const exercisesBySessionId = new Map<string, TExercise[]>();
  const sessionOrder = sessions.map((session) => session.id);

  exercises.forEach((exercise, index) => {
    const sessionId = sessionOrder[index % sessionOrder.length];
    const sessionExercises = exercisesBySessionId.get(sessionId) || [];
    sessionExercises.push(exercise);
    exercisesBySessionId.set(sessionId, sessionExercises);
  });

  return sessions.map((session) => ({
    ...session,
    planItems: exercisesBySessionId.get(session.id) || [],
  }));
}

const DEFAULT_SUPABASE_TABLE = TableNames.AppState;

const SUPABASE_TABLE_BY_KEY: Record<string, string> = {
  "gym-pilot-plans": TableNames.WorkoutPlan,
  "gym-pilot-assignments": TableNames.WorkoutAssignment,
};

export function normalizeFolderName(value?: string) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function isFavoritesKey(key: string) {
  return key === "gym-pilot.favorites";
}

export function getSupabaseTableName(key: string) {
  if (isFavoritesKey(key)) {
    return TableNames.Favourite;
  }

  return SUPABASE_TABLE_BY_KEY[key] ?? DEFAULT_SUPABASE_TABLE;
}

export function normalizeFavoriteStorageValue(
  value: unknown,
): FavoriteStorageValue {
  if (Array.isArray(value)) {
    return {
      favorites: value
        .filter((item): item is FavoriteLink =>
          Boolean(
            item &&
            typeof item === "object" &&
            typeof (item as FavoriteLink).path === "string" &&
            typeof (item as FavoriteLink).label === "string",
          ),
        )
        .map((item) => ({
          ...item,
          folder: normalizeFolderName(item.folder) || undefined,
        })),
      folders: [],
    };
  }

  if (value && typeof value === "object") {
    const candidate = value as Partial<FavoriteStorageValue>;
    const folders = Array.isArray(candidate.folders)
      ? candidate.folders.filter(
          (folder): folder is string =>
            typeof folder === "string" && folder.trim().length > 0,
        )
      : [];
    const favorites = Array.isArray(candidate.favorites)
      ? candidate.favorites
          .filter((item): item is FavoriteLink =>
            Boolean(
              item &&
              typeof item === "object" &&
              typeof (item as FavoriteLink).path === "string" &&
              typeof (item as FavoriteLink).label === "string",
            ),
          )
          .map((item) => ({
            ...item,
            folder: normalizeFolderName(item.folder) || undefined,
          }))
      : [];

    return {
      favorites,
      folders: Array.from(new Set(folders.map((folder) => folder.trim()))).sort(
        (left, right) => left.localeCompare(right),
      ),
    };
  }

  return { favorites: [], folders: [] };
}

export async function loadSupabaseJsonRecord<T>(
  key: string,
): Promise<SupabaseRecordResponse<T>> {
  const client = getSupabaseClient();

  if (!client) {
    return { found: false, value: null };
  }

  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return { found: false, value: null };
  }

  if (key === "gym-pilot-plans") {
    const { data: planData, error: planError } = await client
      .from(TableNames.WorkoutPlan)
      .select("id, plan_name, created_at, updated_at")
      .eq("user_id", userId); // Assuming user_id is part of the select for Plan type

    if (planError) {
      logger.error("[Supabase] Remote plans load failed", {
        key,
        error: planError,
      });
      throw planError;
    }

    const planIds = (planData ?? []).map((plan) => plan.id);

    // Fetch sessions for these plans
    const { data: sessionsData, error: sessionsError } = await client
      .from(TableNames.WorkoutPlanSession)
      .select("id, plan_id, name, position, created_at, updated_at")
      .in("plan_id", planIds)
      .order("position", { ascending: true });

    if (sessionsError) {
      logger.error("[Supabase] Remote plan sessions load failed", {
        key,
        error: sessionsError,
      });
      throw sessionsError;
    }

    const sessionsByPlanId = new Map<string, WorkoutPlanSession[]>();
    (sessionsData ?? []).forEach((session) => {
      const planSessions = sessionsByPlanId.get(session.plan_id) || [];
      planSessions.push({ ...session, planItems: [] });
      sessionsByPlanId.set(session.plan_id, planSessions);
    });

    const { data: exercisesData, error: exercisesError } = await client
      .from(TableNames.WorkoutPlanExercise)
      .select(
        "id, plan_id, exercise_id, exercise_name, position, created_at, updated_at",
      )
      .in("plan_id", planIds)
      .order("position", { ascending: true });

    if (exercisesError) {
      logger.error("[Supabase] Remote plan exercises load failed", {
        key,
        error: exercisesError,
      });
      throw exercisesError;
    }

    const plans = (planData ?? []).map((planRow) => {
      const planSessions = sessionsByPlanId.get(planRow.id) || [];
      const sessionsWithExercises = buildPlanSessionsWithExercises(
        planSessions,
        (exercisesData ?? []) as WorkoutPlanExercise[],
      );
      return {
        id: planRow.id,
        planName: planRow.plan_name,
        planSessions: sessionsWithExercises,
        createdByUserId: userId, // Assuming this is part of your Plan type
      };
    });

    return { found: true, value: plans as T };
  }

  if (key === "gym-pilot-assignments") {
    const { data: assignmentRows, error: assignmentError } = await client
      .from(TableNames.WorkoutAssignment)
      .select(
        "id, assignment_name, assigned_to_user_id, allocated_by_user_id, description, goal, notes, source_plan_id, created_at, updated_at",
      )
      .eq("user_id", userId);

    if (assignmentError) {
      logger.error("[Supabase] Remote assignments load failed", {
        key,
        error: assignmentError,
      });
      throw assignmentError;
    }

    const assignmentIds = (assignmentRows ?? []).map((row) => row.id);

    const { data: sessionRows, error: sessionError } = await client
      .from(TableNames.WorkoutAssignmentSession)
      .select(
        "id, assignment_id, name, position, goal, notes, created_at, updated_at",
      )
      .in("assignment_id", assignmentIds)
      .order("position", { ascending: true });

    if (sessionError) {
      logger.error("[Supabase] Remote assignment sessions load failed", {
        key,
        error: sessionError,
      });
      throw sessionError;
    }

    const { data: exerciseRows, error: exerciseError } = await client
      .from(TableNames.WorkoutAssignmentExercise)
      .select(
        "id, assignment_id, assignment_session_id, exercise_id, exercise_name, position, reps, weight, notes, goal, created_at, updated_at",
      )
      .in("assignment_id", assignmentIds)
      .order("position", { ascending: true });

    if (exerciseError) {
      logger.error("[Supabase] Remote assignment exercises load failed", {
        key,
        error: exerciseError,
      });
      throw exerciseError;
    }

    const sessionsByAssignmentId = new Map<
      string,
      Array<Record<string, unknown>>
    >();
    (sessionRows ?? []).forEach((row) => {
      const assignmentId = String(row.assignment_id);
      const sessions = sessionsByAssignmentId.get(assignmentId) ?? [];
      sessions.push(row);
      sessionsByAssignmentId.set(assignmentId, sessions);
    });

    const exercisesByAssignmentSessionId = new Map<
      string,
      Array<Record<string, unknown>>
    >();
    (exerciseRows ?? []).forEach((row) => {
      const sessionId = String(row.assignment_session_id);
      const exercises = exercisesByAssignmentSessionId.get(sessionId) ?? [];
      exercises.push(row);
      exercisesByAssignmentSessionId.set(sessionId, exercises);
    });

    const assignments = (assignmentRows ?? []).map((row) => ({
      id: row.id,
      assignmentName: row.assignment_name,
      planId: row.source_plan_id ?? "",
      planName: row.assignment_name,
      planSessions: (sessionsByAssignmentId.get(String(row.id)) ?? []).map(
        (session) => ({
          id: String(session.id),
          title: String(session.name),
          name: String(session.name),
          position: Number(session.position),
          goal: session.goal != null ? String(session.goal) : undefined,
          notes: session.notes != null ? String(session.notes) : undefined,
          planItems: (
            exercisesByAssignmentSessionId.get(String(session.id)) ?? []
          ).map((exercise) => ({
            id: String(exercise.id),
            exercise_id: String(exercise.exercise_id),
            exercise_name:
              exercise.exercise_name != null
                ? String(exercise.exercise_name)
                : undefined,
            position: Number(exercise.position),
            reps: exercise.reps != null ? String(exercise.reps) : undefined,
            weight:
              exercise.weight != null ? String(exercise.weight) : undefined,
            notes: exercise.notes != null ? String(exercise.notes) : undefined,
            goal: exercise.goal != null ? String(exercise.goal) : undefined,
          })),
        }),
      ),
      assignedUserId: row.assigned_to_user_id ?? undefined,
      allocatedByUserId: row.allocated_by_user_id ?? undefined,
      assignedUserName: undefined,
      completedExercises: {},
    }));

    return { found: true, value: assignments as T };
  }

  if (isFavoritesKey(key)) {
    const { data: folderRows, error: folderError } = await client
      .from(TableNames.FavouriteFolder)
      .select("id,name")
      .eq("user_id", userId);

    if (folderError) {
      logger.error("[Supabase] Remote favorite folders load failed", {
        key,
        error: folderError,
      });
      throw folderError;
    }

    const folderLookup = new Map(
      (folderRows ?? []).map((row) => [row.id, row.name]),
    );

    const { data, error } = await client
      .from("favourite")
      .select("path,label,folder,folder_id")
      .eq("user_id", userId);

    if (error) {
      logger.error("[Supabase] Remote favorites load failed", { key, error });
      throw error;
    }

    const favorites = (data ?? []).map((row) => {
      const folderName = row.folder_id
        ? folderLookup.get(row.folder_id)
        : undefined;
      const fallbackFolder = normalizeFolderName(row.folder);

      return {
        id: row.path,
        label: row.label,
        path: row.path,
        folder: folderName ?? (fallbackFolder || undefined),
      };
    });

    const folders = Array.from(
      new Set(
        (folderRows ?? [])
          .map((row) => normalizeFolderName(row.name))
          .filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right));

    const payload: FavoriteStorageValue = { favorites, folders };
    return { found: true, value: payload as T };
  }

  const { data, error } = await client
    .from(getSupabaseTableName(key))
    .select("value")
    .eq("key", key)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("[Supabase] Remote record load failed", { key, error });
    throw error;
  }

  if (!data?.value) {
    logger.info("[Supabase] Remote record not found", { key });
    return { found: false, value: null };
  }

  return {
    found: true,
    value: JSON.parse(data.value) as T,
  };
}

export async function saveSupabaseJsonRecord<T>(key: string, value: T) {
  logger.info("[Supabase] Saving remote record", { key, value });
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return;
  }

  if (key === "gym-pilot-plans") {
    const plansToSave = Array.isArray(value)
      ? (value as PlanWithExercises[])
      : []; // Changed to Plan[]

    // Delete existing plans, which will cascade delete sessions and exercises due to ON DELETE CASCADE
    const { error: deletePlansError } = await client
      .from(TableNames.WorkoutPlan)
      .delete() // This will also delete related sessions and exercises due to CASCADE
      .eq("user_id", userId);

    if (deletePlansError) {
      throw deletePlansError;
    }

    // Insert new plans
    if (plansToSave.length > 0) {
      const { error: insertPlansError } = await client
        .from(TableNames.WorkoutPlan)
        .insert(
          plansToSave.map((plan) => ({
            id: plan.id,
            user_id: userId,
            plan_name: plan.planName,
          })),
        );

      if (insertPlansError) {
        throw insertPlansError;
      }

      // Insert sessions for each plan
      const allSessionsToInsert = plansToSave.flatMap((plan) =>
        (plan.planSessions || []).map((session) => ({
          id: session.id,
          plan_id: plan.id,
          name: session.name,
          position: session.position,
        })),
      );

      if (allSessionsToInsert.length > 0) {
        const { error: insertSessionsError } = await client
          .from(TableNames.WorkoutPlanSession)
          .insert(allSessionsToInsert);

        if (insertSessionsError) {
          throw insertSessionsError;
        }
      }

      // Insert associated exercises
      const allExercises = plansToSave.flatMap((plan) =>
        (plan.planSessions || []).flatMap((session) =>
          (session.planItems || []).map((item) => ({
            ...item,
            plan_id: plan.id,
          })),
        ),
      );

      if (allExercises.length > 0) {
        const { error: insertExercisesError } = await client
          .from(TableNames.WorkoutPlanExercise)
          .insert(
            allExercises.map((exercise) => ({
              id: exercise.id,
              exercise_id: exercise.exercise_id,
              exercise_name: exercise.exercise_name,
              position: exercise.position,
              plan_id: exercise.plan_id,
            })),
          );

        if (insertExercisesError) {
          throw insertExercisesError;
        }
      }
    }

    return;
  }

  if (key === "gym-pilot-assignments") {
    const assignments = Array.isArray(value)
      ? (value as Array<Record<string, unknown>>)
      : [];

    const { error: deleteAssignmentsError } = await client
      .from(TableNames.WorkoutAssignment)
      .delete()
      .eq("user_id", userId);

    if (deleteAssignmentsError) {
      throw deleteAssignmentsError;
    }

    const assignmentPayload = assignments.map((assignment) => ({
      id: assignment.id,
      user_id: userId,
      assignment_name:
        assignment.assignmentName ??
        assignment.assignment_name ??
        "Untitled assignment",
      assigned_to_user_id: assignment.assignedUserId ?? null,
      allocated_by_user_id: assignment.allocatedByUserId ?? null,
      description: assignment.description ?? null,
      goal: assignment.goal ?? null,
      notes: assignment.notes ?? null,
      source_plan_id: assignment.planId ?? null,
    }));

    if (assignmentPayload.length > 0) {
      const { error: insertAssignmentsError } = await client
        .from(TableNames.WorkoutAssignment)
        .insert(assignmentPayload);

      if (insertAssignmentsError) {
        throw insertAssignmentsError;
      }

      const sessionPayload = assignments.flatMap((assignment) =>
        Array.isArray(assignment.planSessions)
          ? assignment.planSessions.map((session: any, index: number) => ({
              id: session.id,
              assignment_id: assignment.id,
              name: session.name ?? session.title ?? `Day ${index + 1}`,
              position: session.position ?? index + 1,
              goal: session.goal ?? null,
              notes: session.notes ?? null,
            }))
          : [],
      );

      if (sessionPayload.length > 0) {
        const { error: insertSessionError } = await client
          .from(TableNames.WorkoutAssignmentSession)
          .insert(sessionPayload);

        if (insertSessionError) {
          throw insertSessionError;
        }
      }

      const exercisePayload = assignments.flatMap((assignment) =>
        Array.isArray(assignment.planSessions)
          ? assignment.planSessions.flatMap((session: any) =>
              Array.isArray(session.planItems)
                ? session.planItems.map((item: any, index: number) => ({
                    id: item.id,
                    assignment_id: assignment.id,
                    assignment_session_id: session.id,
                    exercise_id: item.exercise_id ?? item.id ?? "",
                    exercise_name: item.exercise_name ?? null,
                    position: item.position ?? index + 1,
                    reps: item.reps ?? null,
                    weight: item.weight ?? null,
                    notes: item.notes ?? null,
                    goal: item.goal ?? null,
                  }))
                : [],
            )
          : [],
      );

      if (exercisePayload.length > 0) {
        const { error: insertExerciseError } = await client
          .from(TableNames.WorkoutAssignmentExercise)
          .insert(exercisePayload);

        if (insertExerciseError) {
          throw insertExerciseError;
        }
      }
    }

    return;
  }

  if (isFavoritesKey(key)) {
    const normalizedValue = normalizeFavoriteStorageValue(value);
    const favorites = normalizedValue.favorites;
    const folderNames = Array.from(
      new Set([
        ...normalizedValue.folders,
        ...favorites
          .map((favorite) => normalizeFolderName(favorite.folder))
          .filter(Boolean),
      ]),
    );

    const { error: deleteFavoritesError } = await client
      .from(TableNames.Favourite)
      .delete()
      .eq("user_id", userId);

    if (deleteFavoritesError) {
      throw deleteFavoritesError;
    }

    const { error: deleteFoldersError } = await client
      .from(TableNames.FavouriteFolder)
      .delete()
      .eq("user_id", userId);

    if (deleteFoldersError) {
      throw deleteFoldersError;
    }

    const folderRows =
      folderNames.length > 0
        ? await client
            .from(TableNames.FavouriteFolder)
            .upsert(
              folderNames.map((name) => ({ user_id: userId, name })),
              { onConflict: "user_id,name" },
            )
            .select("id,name")
        : { data: [] as Array<{ id: string; name: string }>, error: null };

    if (folderRows.error) {
      throw folderRows.error;
    }

    const folderLookup = new Map(
      (folderRows.data ?? []).map((row) => [row.name, row.id]),
    );

    if (favorites.length > 0) {
      const { error: insertError } = await client
        .from(TableNames.Favourite)
        .insert(
          favorites.map((favorite) => {
            const normalizedFolder = normalizeFolderName(favorite.folder);

            return {
              user_id: userId,
              path: favorite.path,
              label: favorite.label,
              folder: normalizedFolder || null,
              folder_id: normalizedFolder
                ? (folderLookup.get(normalizedFolder) ?? null)
                : null,
            };
          }),
        );

      if (insertError) {
        throw insertError;
      }
    }

    return;
  }

  const json = JSON.stringify(value);

  const { error } = await client
    .from(getSupabaseTableName(key))
    .upsert(
      { user_id: userId, key, value: json },
      { onConflict: "user_id,key" },
    );

  if (error) {
    throw error;
  }
}

export async function removeSupabaseJsonRecord(key: string) {
  logger.info("[Supabase] Removing remote record", { key });
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return;
  }

  if (isFavoritesKey(key)) {
    const { error: favoritesError } = await client
      .from(TableNames.Favourite)
      .delete()
      .eq("user_id", userId);

    if (favoritesError) {
      throw favoritesError;
    }

    const { error: foldersError } = await client
      .from(TableNames.FavouriteFolder)
      .delete()
      .eq("user_id", userId);

    if (foldersError) {
      throw foldersError;
    }

    return;
  }

  const { error } = await client
    .from(getSupabaseTableName(key))
    .delete()
    .eq("key", key)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
