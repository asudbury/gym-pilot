import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assignment, Plan, UserRole } from "@gym-pilot/types";
import {
  getSupabaseClient,
  isSupabasePersistenceEnabled as isSupabasePersistenceEnabledBase,
} from "./supabase";
import { logger } from "./logging";
import { normalizeUserRoles } from "./utils";
import { getAuthenticatedUserId } from "./supabaseAuth";
import { recordSupabaseUserActivity } from "./userActivity";
import { saveWorkoutItemsForSession } from "./sessionWorkoutPersistence";
import {
  invalidateSupabaseProfileCache as invalidateSupabaseProfileCacheFromProfilePersistence,
  loadSupabaseProfileAccessState as loadSupabaseProfileAccessStateFromProfilePersistence,
  loadSupabaseProfileApplicationName as loadSupabaseProfileApplicationNameFromProfilePersistence,
  loadSupabaseProfileFlag as loadSupabaseProfileFlagFromProfilePersistence,
  loadSupabaseProfileLoginHistory as loadSupabaseProfileLoginHistoryFromProfilePersistence,
  loadSupabaseProfileName as loadSupabaseProfileNameFromProfilePersistence,
  loadSupabaseProfileRoles as loadSupabaseProfileRolesFromProfilePersistence,
  loadSupabaseProfileSnapshot as loadSupabaseProfileSnapshotFromProfilePersistence,
  loadSupabaseProfileTermsAcceptance as loadSupabaseProfileTermsAcceptanceFromProfilePersistence,
  loadSupabaseGymBrand as loadSupabaseGymBrandFromProfilePersistence,
  loadSupabaseGymName as loadSupabaseGymNameFromProfilePersistence,
  saveSupabaseProfile as saveSupabaseProfileFromProfilePersistence,
  saveSupabaseApplicationName as saveSupabaseApplicationNameFromProfilePersistence,
  saveSupabaseGymBrand as saveSupabaseGymBrandFromProfilePersistence,
  saveSupabaseGymName as saveSupabaseGymNameFromProfilePersistence,
  saveSupabaseProfileAccessSettings as saveSupabaseProfileAccessSettingsFromProfilePersistence,
  saveSupabaseProfileEmail as saveSupabaseProfileEmailFromProfilePersistence,
  saveSupabaseProfileFlag as saveSupabaseProfileFlagFromProfilePersistence,
  saveSupabaseProfileName as saveSupabaseProfileNameFromProfilePersistence,
  saveSupabaseProfileRoles as saveSupabaseProfileRolesFromProfilePersistence,
  saveSupabaseProfileTermsAcceptance as saveSupabaseProfileTermsAcceptanceFromProfilePersistence,
  buildSupabaseProfileTermsAcceptancePayload as buildSupabaseProfileTermsAcceptancePayloadFromProfilePersistence,
  type SupabaseProfile,
  type SupabaseProfileSnapshot,
  type SupabaseProfileUpdatePayload,
  type SupabaseAccessTier,
} from "./profilePersistence";
import { type SessionWorkoutItem } from "./sessionWorkout";

const DEFAULT_SUPABASE_TABLE = "gym_pilot_app_state";

// The app persists arbitrary JSON payloads as { user_id, key, value } rows.
// These records are stored in the shared app_state table rather than the
// domain-specific tables created for relational data.
const SUPABASE_TABLE_BY_KEY: Record<string, string> = {
  "gym-pilot-plans": "gym_pilot_plan",
  "gym-pilot-assignments": "gym_pilot_assignment",
};

/**
 * Returns whether remote Supabase persistence is enabled for the current app environment.
 */
export function isSupabasePersistenceEnabled() {
  return isSupabasePersistenceEnabledBase();
}

type SupabaseRecordResponse<T> = {
  found: boolean;
  value: T | null;
};

type FavoriteLink = {
  id?: string;
  label: string;
  path: string;
  folder?: string;
};

type FavoriteStorageValue = {
  favorites: FavoriteLink[];
  folders: string[];
};

function normalizeFolderName(value?: string) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isFavoritesKey(key: string) {
  return key === "gym-pilot.favorites";
}

function normalizeFavoriteStorageValue(value: unknown): FavoriteStorageValue {
  if (Array.isArray(value)) {
    return {
      favorites: value.filter((item): item is FavoriteLink =>
        Boolean(
          item &&
          typeof item === "object" &&
          typeof (item as FavoriteLink).path === "string" &&
          typeof (item as FavoriteLink).label === "string",
        ),
      ),
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
      ? candidate.favorites.filter((item): item is FavoriteLink =>
          Boolean(
            item &&
            typeof item === "object" &&
            typeof (item as FavoriteLink).path === "string" &&
            typeof (item as FavoriteLink).label === "string",
          ),
        )
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

/**
 * Resolves the Supabase table used for a given persistence key.
 */
export function getSupabaseTableName(key: string) {
  if (isFavoritesKey(key)) {
    return "gym_pilot_favourite";
  }

  return SUPABASE_TABLE_BY_KEY[key] ?? DEFAULT_SUPABASE_TABLE;
}

function normalizeProfileRoles(roles: unknown): UserRole[] {
  return normalizeUserRoles(Array.isArray(roles) ? roles : undefined);
}

export function normalizeSupabaseUserRoleRows(
  rows: Array<{ user_id?: unknown; role?: unknown }> | null | undefined,
): UserRole[] {
  const normalizedRoles = (Array.isArray(rows) ? rows : [])
    .map((row) =>
      row && typeof row === "object"
        ? (row as Record<string, unknown>).role
        : undefined,
    )
    .filter(
      (role): role is UserRole =>
        typeof role === "string" && normalizeUserRoles([role]).length > 0,
    );

  return normalizeUserRoles(normalizedRoles);
}

export function buildSupabaseUserRoleRows(
  userId: string,
  roles: Array<UserRole | string> | UserRole | null | undefined,
): Array<{ user_id: string; role: UserRole }> {
  const normalizedRoles = normalizeUserRoles(
    Array.isArray(roles) ? roles : roles ? [roles] : [],
  );

  return normalizedRoles.map((role) => ({ user_id: userId, role }));
}

async function loadSupabaseUserRolesByUserIds(
  client: ReturnType<typeof getSupabaseClient>,
  userIds: string[],
): Promise<Map<string, UserRole[]>> {
  const roleLookup = new Map<string, UserRole[]>();

  if (!client || userIds.length === 0) {
    return roleLookup;
  }

  const { data, error } = await client
    .from("gym_pilot_user_role")
    .select("user_id, role")
    .in("user_id", userIds);

  if (error) {
    if (isMissingProfileColumnError(error, ["role"])) {
      return roleLookup;
    }

    logger.warn("[Supabase] Could not load user roles for user list", error);
    return roleLookup;
  }

  const rows = Array.isArray(data) ? data : [];
  const groupedRows = new Map<
    string,
    Array<{ user_id?: unknown; role?: unknown }>
  >();

  rows.forEach((row) => {
    if (!row || typeof row !== "object") {
      return;
    }

    const candidate = row as Record<string, unknown>;
    const candidateUserId =
      typeof candidate.user_id === "string" ? candidate.user_id : null;

    if (!candidateUserId) {
      return;
    }

    const existingRows = groupedRows.get(candidateUserId) ?? [];
    existingRows.push(candidate);
    groupedRows.set(candidateUserId, existingRows);
  });

  groupedRows.forEach((roleRows, candidateUserId) => {
    roleLookup.set(candidateUserId, normalizeSupabaseUserRoleRows(roleRows));
  });

  return roleLookup;
}

function normalizeProfileAccessTier(value: unknown): SupabaseAccessTier {
  const normalizedValue =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  switch (normalizedValue) {
    case "bronze":
      return "bronze";
    case "silver":
      return "silver";
    case "gold":
      return "gold";
    default:
      return "free";
  }
}

function isMissingProfileColumnError(
  error: { message?: string } | null | undefined,
  columns: string[],
) {
  const message = error?.message ?? "";

  if (!message) {
    return false;
  }

  if (/does not exist|column .* does not exist/i.test(message)) {
    return true;
  }

  return columns.some((column) =>
    new RegExp(`\\b${column}\\b`, "i").test(message),
  );
}

function mapSupabaseProfile(
  profile: {
    id: string;
    user_id: string;
    friendly_name: string | null;
    application_name?: string | null;
    gym_brand?: string | null;
    gym_name?: string | null;
    gym_club_id?: number | null;
    account_tier?: string | null;
    access_ends_at?: string | null;
    is_frozen?: boolean | null;
    roles?: unknown;
    trainer_id?: string | null;
    must_change_password: boolean;
    created_at?: string;
    updated_at?: string;
  },
  roleOverride?: UserRole[],
): SupabaseProfile {
  return {
    id: profile.id,
    user_id: profile.user_id,
    friendly_name:
      typeof profile.friendly_name === "string" ? profile.friendly_name : null,
    application_name:
      typeof profile.application_name === "string"
        ? profile.application_name
        : null,
    gym_brand: typeof profile.gym_brand === "string" ? profile.gym_brand : null,
    gym_name: typeof profile.gym_name === "string" ? profile.gym_name : null,
    account_tier: normalizeProfileAccessTier(profile.account_tier),
    access_ends_at:
      typeof profile.access_ends_at === "string"
        ? profile.access_ends_at
        : null,
    is_frozen: Boolean(profile.is_frozen),
    roles: roleOverride ?? normalizeProfileRoles(profile.roles),
    trainer_id:
      typeof profile.trainer_id === "string" ? profile.trainer_id : null,
    must_change_password: Boolean(profile.must_change_password),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export type {
  SupabaseProfile,
  SupabaseProfileSnapshot,
  SupabaseProfileUpdatePayload,
  SupabaseAccessTier,
} from "./profilePersistence";

export async function loadSupabaseProfileSnapshot(
  userId?: string,
): Promise<SupabaseProfileSnapshot> {
  return loadSupabaseProfileSnapshotFromProfilePersistence(userId);
}

export async function loadSupabaseProfileName(): Promise<string | null> {
  return loadSupabaseProfileNameFromProfilePersistence();
}

export async function loadSupabaseProfileAccessState(userId?: string): Promise<{
  accountTier: SupabaseAccessTier;
  accessEndsAt: string | null;
  isFrozen: boolean;
  isBlocked: boolean;
  blockReason: "frozen" | "expired" | null;
}> {
  return loadSupabaseProfileAccessStateFromProfilePersistence(userId);
}

export async function loadSupabaseApplicationName(): Promise<string | null> {
  return loadSupabaseProfileApplicationNameFromProfilePersistence();
}

export async function loadSupabaseGymBrand(): Promise<string | null> {
  return loadSupabaseGymBrandFromProfilePersistence();
}

export async function loadSupabaseGymName(): Promise<string | null> {
  return loadSupabaseGymNameFromProfilePersistence();
}

export async function loadSupabaseProfileLoginHistory(): Promise<{
  lastLoggedInAt: string | null;
  previousLastLoggedInAt: string | null;
}> {
  return loadSupabaseProfileLoginHistoryFromProfilePersistence();
}

export async function listSupabaseProfiles(): Promise<SupabaseProfile[]> {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return [];
  }

  const { data, error } = await client
    .from("gym_pilot_profile")
    .select(
      "id, user_id, friendly_name, application_name, gym_brand, gym_name, account_tier, access_ends_at, is_frozen, trainer_id, must_change_password, created_at, updated_at",
    );

  if (
    error &&
    isMissingProfileColumnError(error, ["trainer_id", "gym_brand"])
  ) {
    const fallback = await client
      .from("gym_pilot_profile")
      .select(
        "id, user_id, friendly_name, application_name, gym_name, account_tier, access_ends_at, is_frozen, must_change_password, created_at, updated_at",
      );

    if (fallback.error) {
      logger.error("[Supabase] Could not load profiles", fallback.error);
      return [];
    }

    const fallbackProfiles = (
      (fallback.data ?? []) as Array<{
        id: string;
        user_id: string;
        friendly_name: string | null;
        must_change_password: boolean;
        created_at?: string;
        updated_at?: string;
      }>
    ).filter((profile) => typeof profile.user_id === "string");

    return fallbackProfiles.map((profile) =>
      mapSupabaseProfile({
        id: profile.id,
        user_id: profile.user_id,
        friendly_name:
          typeof profile.friendly_name === "string"
            ? profile.friendly_name
            : null,
        application_name: null,
        gym_brand: null,
        gym_name: null,
        trainer_id: null,
        must_change_password: Boolean(profile.must_change_password),
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }),
    );
  }

  if (error) {
    logger.error("[Supabase] Could not load profiles", error);
    return [];
  }

  const profileRows = (
    (data ?? []) as Array<{
      id: string;
      user_id: string;
      friendly_name: string | null;
      must_change_password: boolean;
      created_at?: string;
      updated_at?: string;
    }>
  ).filter((profile) => typeof profile.user_id === "string");

  const profiles: SupabaseProfile[] = [];
  const roleLookup = await loadSupabaseUserRolesByUserIds(
    client,
    profileRows.map((profile) => profile.user_id),
  );

  for (const profile of profileRows) {
    profiles.push(
      mapSupabaseProfile(
        {
          id: profile.id,
          user_id: profile.user_id,
          friendly_name:
            typeof profile.friendly_name === "string"
              ? profile.friendly_name
              : null,
          application_name: null,
          gym_brand: null,
          gym_name: null,
          trainer_id: null,
          must_change_password: Boolean(profile.must_change_password),
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        roleLookup.get(profile.user_id) ?? [],
      ),
    );
  }

  if (!profiles.some((profile) => profile.user_id === userId)) {
    const { error: upsertError } = await client
      .from("gym_pilot_profile")
      .upsert(
        {
          user_id: userId,
          friendly_name: null,
          application_name: null,
          gym_brand: null,
          trainer_id: null,
          account_tier: "free",
          access_ends_at: null,
          is_frozen: false,
          must_change_password: false,
        },
        { onConflict: "user_id" },
      );

    if (
      upsertError &&
      isMissingProfileColumnError(upsertError, ["trainer_id", "gym_brand"])
    ) {
      const fallback = await client.from("gym_pilot_profile").upsert(
        {
          user_id: userId,
          friendly_name: null,
          application_name: null,
          must_change_password: false,
        },
        { onConflict: "user_id" },
      );

      if (fallback.error) {
        logger.error(
          "[Supabase] Could not create profile row for current user",
          fallback.error,
        );
        return profiles;
      }
    } else if (upsertError) {
      logger.error(
        "[Supabase] Could not create profile row for current user",
        upsertError,
      );
      return profiles;
    }

    const { data: refreshedData, error: refreshError } = await client
      .from("gym_pilot_profile")
      .select("*");

    if (refreshError) {
      logger.error(
        "[Supabase] Could not reload profiles after creating the current user row",
        refreshError,
      );
      return profiles;
    }

    const refreshedRows = (
      (refreshedData ?? []) as Array<{
        id: string;
        user_id: string;
        friendly_name: string | null;
        must_change_password: boolean;
        created_at?: string;
        updated_at?: string;
      }>
    ).filter((profile) => typeof profile.user_id === "string");
    const refreshedRoleLookup = await loadSupabaseUserRolesByUserIds(
      client,
      refreshedRows.map((profile) => profile.user_id),
    );

    return refreshedRows.map((profile) =>
      mapSupabaseProfile(
        {
          id: profile.id,
          user_id: profile.user_id,
          friendly_name:
            typeof profile.friendly_name === "string"
              ? profile.friendly_name
              : null,
          application_name: null,
          gym_brand: null,
          gym_name: null,
          trainer_id: null,
          must_change_password: Boolean(profile.must_change_password),
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        refreshedRoleLookup.get(profile.user_id) ?? [],
      ),
    );
  }

  return profiles;
}

export async function loadSupabaseProfileRoles(
  userId: string,
): Promise<UserRole[]> {
  return loadSupabaseProfileRolesFromProfilePersistence(userId);
}

export async function saveSupabaseProfileRoles(
  roles: Array<UserRole | string> | UserRole | null | undefined,
  userId?: string,
  clientOverride?: SupabaseClient,
) {
  return saveSupabaseProfileRolesFromProfilePersistence(
    roles,
    userId,
    clientOverride,
  );
}

export async function loadSupabaseProfileFlag(
  flag: "must_change_password",
  userId?: string,
): Promise<boolean> {
  return loadSupabaseProfileFlagFromProfilePersistence(flag, userId);
}

export async function loadSupabaseProfileTermsAcceptance(
  userId?: string,
): Promise<boolean> {
  return loadSupabaseProfileTermsAcceptanceFromProfilePersistence(userId);
}

export function buildSupabaseProfileTermsAcceptancePayload(
  userId: string,
  accepted: boolean,
  acceptedAt?: string | null,
) {
  return buildSupabaseProfileTermsAcceptancePayloadFromProfilePersistence(
    userId,
    accepted,
    acceptedAt,
  );
}

export async function invalidateSupabaseProfileCache(userId?: string) {
  return invalidateSupabaseProfileCacheFromProfilePersistence(userId);
}

export async function saveSupabaseProfileName(
  friendlyName: string | null,
  userId?: string,
) {
  return saveSupabaseProfileNameFromProfilePersistence(friendlyName, userId);
}

export async function saveSupabaseProfile(
  payload: SupabaseProfileUpdatePayload,
  userId?: string,
) {
  return saveSupabaseProfileFromProfilePersistence(payload, userId);
}

export async function saveSupabaseProfileEmail(
  email: string | null,
  userId?: string,
) {
  return saveSupabaseProfileEmailFromProfilePersistence(email, userId);
}

export async function saveSupabaseApplicationName(
  applicationName: string | null,
) {
  return saveSupabaseApplicationNameFromProfilePersistence(applicationName);
}

export async function saveSupabaseGymBrand(gymBrand: string | null) {
  return saveSupabaseGymBrandFromProfilePersistence(gymBrand);
}

export async function saveSupabaseGymName(
  gymName: string | null,
  gymBrand?: string | null,
) {
  return saveSupabaseGymNameFromProfilePersistence(gymName, gymBrand);
}

export async function saveSupabaseProfileAccessSettings(
  accountTier: string | null,
  accessEndsAt: string | null,
  isFrozen: boolean,
  userId?: string,
) {
  return saveSupabaseProfileAccessSettingsFromProfilePersistence(
    accountTier,
    accessEndsAt,
    isFrozen,
    userId,
  );
}

export async function saveSupabaseProfileFlag(
  flag: "must_change_password",
  value: boolean,
  userId?: string,
) {
  return saveSupabaseProfileFlagFromProfilePersistence(flag, value, userId);
}

export async function saveSupabaseProfileTermsAcceptance(
  accepted: boolean,
  userId?: string,
) {
  return saveSupabaseProfileTermsAcceptanceFromProfilePersistence(
    accepted,
    userId,
  );
}

/**
 * Loads a remote JSON payload from Supabase for the current user.
 * Supports app-state rows plus the domain-specific plan, assignment, and favorites tables.
 */
export async function loadSupabaseJsonRecord<T>(
  key: string,
): Promise<SupabaseRecordResponse<T>> {
  logger.info("[Supabase] Loading remote record", { key });
  const client = getSupabaseClient();

  if (!client) {
    return { found: false, value: null };
  }

  const userId = await getAuthenticatedUserId(client);

  if (!userId) {
    return { found: false, value: null };
  }

  if (key === "gym-pilot-plans") {
    const { data, error } = await client
      .from("gym_pilot_plan")
      .select("id, plan_name, plan_slug, plan_sessions, created_at, updated_at")
      .eq("user_id", userId);

    if (error) {
      logger.error("[Supabase] Remote plans load failed", { key, error });
      throw error;
    }

    const plans = (data ?? []).map((row) => ({
      id: row.id,
      planName: row.plan_name,
      planSlug: row.plan_slug,
      planSessions: Array.isArray(row.plan_sessions) ? row.plan_sessions : [],
      createdByUserId: userId,
    }));

    return { found: true, value: plans as T };
  }

  if (key === "gym-pilot-assignments") {
    const { data, error } = await client
      .from("gym_pilot_assignment")
      .select(
        "id, assignment_name, plan_id, plan_items, assigned_user_id, assigned_user_name, completed_exercises",
      )
      .eq("user_id", userId);

    if (error) {
      logger.error("[Supabase] Remote assignments load failed", { key, error });
      throw error;
    }

    const assignments = (data ?? []).map((row) => ({
      id: row.id,
      assignmentName: row.assignment_name,
      planId: row.plan_id,
      planName: undefined,
      planSlug: undefined,
      planSessions: Array.isArray(row.plan_items) ? row.plan_items : [],
      assignedUserId: row.assigned_user_id ?? undefined,
      assignedUserName: row.assigned_user_name ?? undefined,
      completedExercises: row.completed_exercises ?? {},
    }));

    return { found: true, value: assignments as T };
  }

  if (isFavoritesKey(key)) {
    const { data: folderRows, error: folderError } = await client
      .from("gym_pilot_favourite_folder")
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
      .from("gym_pilot_favourite")
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

    logger.info("[Supabase] Remote favorites loaded", {
      key,
      favorites,
      folders,
    });
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

  logger.info("[Supabase] Remote record loaded", { key, value: data.value });
  return {
    found: true,
    value: JSON.parse(data.value) as T,
  };
}

/**
 * Persists a JSON payload to Supabase for the current user.
 * The write route depends on the storage key and may target app-state rows or a
 * domain-specific table such as plans, assignments, or favorites.
 */
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
    const plans = Array.isArray(value) ? (value as Plan[]) : [];

    const { error: deleteError } = await client
      .from("gym_pilot_plan")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    if (plans.length > 0) {
      const { error: insertError } = await client.from("gym_pilot_plan").insert(
        plans.map((plan) => ({
          id: plan.id,
          user_id: userId,
          plan_name: plan.planName,
          plan_slug: plan.planSlug,
          plan_sessions: plan.planSessions ?? [],
        })),
      );

      if (insertError) {
        throw insertError;
      }
    }

    return;
  }

  if (key === "gym-pilot-assignments") {
    const assignments = Array.isArray(value) ? (value as Assignment[]) : [];

    const { error: deleteError } = await client
      .from("gym_pilot_assignment")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    if (assignments.length > 0) {
      const { error: insertError } = await client
        .from("gym_pilot_assignment")
        .insert(
          assignments.map((assignment) => ({
            id: assignment.id,
            user_id: userId,
            plan_id: assignment.planId,
            assignment_name: assignment.assignmentName,
            assigned_user_id: assignment.assignedUserId ?? null,
            assigned_user_name: assignment.assignedUserName ?? null,
            completed_exercises: assignment.completedExercises ?? {},
            plan_items: assignment.planSessions ?? [],
          })),
        );

      if (insertError) {
        throw insertError;
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
      .from("gym_pilot_favourite")
      .delete()
      .eq("user_id", userId);

    if (deleteFavoritesError) {
      throw deleteFavoritesError;
    }

    const { error: deleteFoldersError } = await client
      .from("gym_pilot_favourite_folder")
      .delete()
      .eq("user_id", userId);

    if (deleteFoldersError) {
      throw deleteFoldersError;
    }

    const folderRows =
      folderNames.length > 0
        ? await client
            .from("gym_pilot_favourite_folder")
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
        .from("gym_pilot_favourite")
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

/**
 * Removes a remote JSON payload from Supabase for the current user.
 */
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
      .from("gym_pilot_favourite")
      .delete()
      .eq("user_id", userId);

    if (favoritesError) {
      throw favoritesError;
    }

    const { error: foldersError } = await client
      .from("gym_pilot_favourite_folder")
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

export function isLocalhostHost(hostname?: string) {
  if (!hostname) {
    return false;
  }

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".localhost")
  );
}

export {
  buildSupabaseUserActivityEventData,
  recordSupabaseUserActivity,
  saveSupabaseProfileLastLoggedIn,
  shouldRecordLoginActivity,
  shouldRecordSupabaseUserActivity,
} from "./userActivity";

function normalizeSessionRating(value: number | string | null | undefined) {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 5
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed;
    }
  }

  return null;
}

export {
  buildWorkoutItemsPersistencePayloads,
  getWorkoutItemsTableName,
  loadWorkoutItemsForSession,
  saveWorkoutItemsForSession,
} from "./sessionWorkoutPersistence";

export function buildSessionBookingSessionPayload(input: {
  userId: string;
  sessionId?: string | number | null;
  classId?: string | number | null;
  className?: string | null;
  instructorName?: string | null;
  startedAt?: string | null;
  attendanceType: "attended" | "taught";
  notes?: string | null;
  rating?: number | null;
  durationMinutes?: number | null;
  metadata?: unknown | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  role?: "client" | "trainer" | null;
  status?: "booked" | "cancelled" | "attended" | "no_show" | "declined" | null;
  sessionType?: "class" | "personal_training" | "solo" | null;
}) {
  const resolvedSessionType = normalizeSessionTypeForPersistence(
    input.sessionType ??
      (input.classId || input.className
        ? "class"
        : input.instructorName
          ? "personal_training"
          : "solo"),
  );

  return {
    user_id: input.userId,
    session_id: input.sessionId != null ? String(input.sessionId) : null,
    class_id: input.classId != null ? String(input.classId) : null,
    class_name: input.className ?? null,
    trainer_name: input.instructorName?.trim()
      ? input.instructorName.trim()
      : null,
    start_at: input.startedAt ?? null,
    attendance_type: input.attendanceType,
    notes: input.notes?.trim() ? input.notes.trim() : null,
    rating: normalizeSessionRating(input.rating),
    duration_minutes: input.durationMinutes ?? null,
    metadata: input.metadata ?? null,
    created_at: input.createdAt ?? new Date().toISOString(),
    updated_at: input.updatedAt ?? new Date().toISOString(),
    role:
      input.role ?? (input.attendanceType === "taught" ? "trainer" : "client"),
    status: input.status ?? "attended",
    session_type: resolvedSessionType,
  };
}

export function buildSessionBookingAttendancePayload(input: {
  userId: string;
  sessionId?: string | number | null;
  classId?: string | number | null;
  className?: string | null;
  instructorName?: string | null;
  startedAt?: string | null;
  attendanceType: "attended" | "taught";
  notes?: string | null;
  rating?: number | null;
  durationMinutes?: number | null;
  metadata?: unknown | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  role?: "client" | "trainer" | null;
  status?: "booked" | "cancelled" | "attended" | "no_show" | "declined" | null;
}) {
  return buildSessionBookingSessionPayload(input);
}

export function getSessionHistoryTableName() {
  return getSessionTableName();
}

export function getSessionHistorySelectColumns() {
  return [
    "id",
    "user_id",
    "session_id",
    "class_id",
    "class_name",
    "trainer_name",
    "session_type",
    "start_at",
    "attendance_type",
    "notes",
    "rating",
    "metadata",
    "created_at",
    "updated_at",
    "role",
    "status",
    "session:session_id",
  ];
}

export { mapSessionHistoryEntryFromSupabase } from "./sessionHistory";

export {
  upsertSessionHistoryEntry,
  removeSessionHistoryEntry,
  formatSessionHistoryError,
  type SessionHistoryEntry,
} from "./sessionHistory";

export {
  buildSessionHistoryDeleteError,
  deleteSessionHistoryEntry,
  loadSessionHistoryEntries,
  saveSessionHistoryEntry,
} from "./sessionHistory";

export async function saveTimetableAttendance(input: {
  userId?: string;
  sessionId?: string | number | null;
  classId?: string | number | null;
  className?: string | null;
  instructorName?: string | null;
  startedAt?: string | null;
  attendanceType: "attended" | "taught";
  notes?: string | null;
  rating?: number | null;
  durationMinutes?: number | null;
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return {
      success: false as const,
      error: new Error("Unable to resolve the current user"),
    };
  }

  let existingId: string | null = null;
  let tableExists = true;

  if (
    input.sessionId != null ||
    (input.classId != null && input.startedAt != null)
  ) {
    let query = client
      .from(getSessionHistoryTableName())
      .select("id")
      .eq("user_id", resolvedUserId);

    if (input.sessionId != null) {
      query = query.eq("session_id", String(input.sessionId));
    } else {
      query = query
        .eq("class_id", String(input.classId))
        .eq("start_at", input.startedAt);
    }

    const { data: existingData, error: selectError } = await query.limit(1);
    if (selectError) {
      const isMissingTable =
        selectError.message?.includes("Could not find the table") ||
        selectError.message?.includes("does not exist");
      if (isMissingTable) {
        tableExists = false;
      }
    } else if (existingData && existingData.length > 0) {
      existingId = existingData[0].id;
    }
  }

  let dbResult: { data: any[] | null; error: any } = {
    data: null,
    error: null,
  };

  if (!tableExists) {
    dbResult.error = {
      message: `Could not find the table ${getSessionHistoryTableName()}`,
    };
  } else if (existingId) {
    dbResult = await client
      .from(getSessionHistoryTableName())
      .update(
        buildSessionBookingSessionPayload({
          userId: resolvedUserId,
          sessionId: input.sessionId,
          classId: input.classId,
          className: input.className,
          instructorName: input.instructorName,
          startedAt: input.startedAt,
          attendanceType: input.attendanceType,
          notes: input.notes,
          rating: input.rating,
          durationMinutes: input.durationMinutes,
        }),
      )
      .eq("id", existingId)
      .select();
  } else {
    dbResult = await client
      .from(getSessionHistoryTableName())
      .insert(
        buildSessionBookingSessionPayload({
          userId: resolvedUserId,
          sessionId: input.sessionId,
          classId: input.classId,
          className: input.className,
          instructorName: input.instructorName,
          startedAt: input.startedAt,
          attendanceType: input.attendanceType,
          notes: input.notes,
          rating: input.rating,
          durationMinutes: input.durationMinutes,
        }),
      )
      .select();
  }

  const { error } = dbResult;

  if (error) {
    const isMissingTableError =
      error.message?.includes("Could not find the table") ||
      error.message?.includes("does not exist");

    if (isMissingTableError) {
      logger.warn(
        "[Supabase] gym_pilot_class_attendance table is not available yet; recording attendance as a user activity fallback",
        error,
      );
      await recordSupabaseUserActivity(
        "timetable_attendance",
        {
          sessionId: input.sessionId != null ? String(input.sessionId) : null,
          classId: input.classId != null ? String(input.classId) : null,
          className: input.className ?? null,
          instructorName: input.instructorName?.trim()
            ? input.instructorName.trim()
            : null,
          startedAt: input.startedAt ?? null,
          attendanceType: input.attendanceType,
          notes: input.notes?.trim() ? input.notes.trim() : null,
          rating: input.rating ?? null,
        },
        resolvedUserId,
      );

      return { success: true as const, fallback: true as const };
    }

    logger.error("[Supabase] Could not save timetable attendance", error);
    return { success: false as const, error };
  }

  return { success: true as const };
}

export function getSessionTableName() {
  return "gym_pilot_user_session";
}

export function getSessionBookingTableName() {
  return getSessionTableName();
}

export function normalizeSessionTypeForPersistence(
  sessionType: string | null | undefined,
) {
  if (
    sessionType === "class" ||
    sessionType === "personal_training" ||
    sessionType === "solo"
  ) {
    return sessionType;
  }

  return "solo";
}

export function buildSessionRecordPayload(input: {
  userId?: string | null;
  gymClubId?: number | null;
  sessionType: "class" | "personal_training" | "solo";
  classId?: string | null;
  className?: string | null;
  trainerId?: string | null;
  trainerName?: string | null;
  startAt: string;
  durationMinutes?: number | null;
  location?: string | null;
  capacity?: number | null;
  price?: number | null;
  metadata?: any | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}) {
  return {
    gym_club_id: input.gymClubId ?? null,
    session_type: normalizeSessionTypeForPersistence(input.sessionType),
    class_id: input.classId ?? null,
    class_name: input.className ?? null,
    trainer_id: input.trainerId ?? null,
    trainer_name: input.trainerName ?? null,
    start_at: input.startAt,
    duration_minutes: input.durationMinutes ?? null,
    location: input.location ?? null,
    capacity: input.capacity ?? null,
    price: input.price ?? null,
    metadata: input.metadata ?? null,
    user_id: input.userId ?? null,
    session_id: null,
    role: null,
    status: "attended",
    notes: null,
    rating: null,
    attendance_type: null,
    created_at: input.createdAt ?? new Date().toISOString(),
    updated_at: input.updatedAt ?? new Date().toISOString(),
  };
}

export async function createSession(input: {
  gymClubId?: number | null;
  sessionType: "class" | "personal_training" | "solo";
  classId?: string | null;
  className?: string | null;
  trainerId?: string | null;
  trainerName?: string | null;
  startAt: string;
  durationMinutes?: number | null;
  location?: string | null;
  capacity?: number | null;
  price?: number | null;
  metadata?: any | null;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = await getAuthenticatedUserId(client);
  const payload = buildSessionRecordPayload({
    userId: resolvedUserId,
    gymClubId: input.gymClubId,
    sessionType: input.sessionType,
    classId: input.classId,
    className: input.className,
    trainerId: input.trainerId,
    trainerName: input.trainerName,
    startAt: input.startAt,
    durationMinutes: input.durationMinutes,
    location: input.location,
    capacity: input.capacity,
    price: input.price,
    metadata: input.metadata,
  });

  const { data, error } = await client
    .from(getSessionTableName())
    .insert(payload)
    .select();

  if (error) {
    logger.error("[Supabase] Could not create session", error);
    return { success: false as const, error };
  }

  const createdSession = data && data[0];

  if (createdSession && resolvedUserId) {
    const profileSnapshot = await loadSupabaseProfileSnapshot(resolvedUserId);
    await recordSupabaseUserActivity(
      "session_created",
      {
        sessionId: createdSession.id ?? null,
        sessionType: input.sessionType,
        startAt: input.startAt,
        durationMinutes: input.durationMinutes ?? null,
        trainerName: input.trainerName?.trim()
          ? input.trainerName.trim()
          : null,
      },
      resolvedUserId,
      profileSnapshot.friendlyName,
    );
  }

  return { success: true as const, session: createdSession };
}

export async function bookSession(input: {
  sessionId: string;
  userId?: string;
  role: "client" | "trainer";
  notes?: string | null;
  rating?: number | null;
  workoutMetadata?: unknown | null;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return {
      success: false as const,
      error: new Error("Unable to resolve the current user"),
    };
  }

  const payload = {
    user_id: resolvedUserId,
    session_id: input.sessionId,
    role: input.role,
    status: "attended",
    notes: input.notes ?? null,
    rating: normalizeSessionRating(input.rating),
    metadata: input.workoutMetadata ?? null,
    attendance_type: input.role === "trainer" ? "taught" : "attended",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from(getSessionTableName())
    .update(payload)
    .eq("id", input.sessionId)
    .select();

  if (error) {
    logger.error("[Supabase] Could not book session", error);
    return { success: false as const, error };
  }

  return { success: true as const, booking: data && data[0] };
}

export async function recordSession(input: {
  sessionId: string;
  userId?: string;
  role: "client" | "trainer";
  notes?: string | null;
  rating?: number | null;
  workoutMetadata?: unknown | null;
  workoutItems?: SessionWorkoutItem[];
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const bookingResult = await bookSession(input);
  if (!bookingResult.success) {
    logger.error(
      "[Supabase] Session booking failed before workout persistence",
      bookingResult.error,
    );
    return bookingResult;
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId || !input.workoutItems?.length) {
    const fallbackError = resolvedUserId
      ? bookingResult.error
      : new Error("No authenticated user available to persist workout rows");

    logger.error(
      "[Supabase] Workout rows were not persisted because no authenticated user was available",
      fallbackError,
    );

    return {
      ...bookingResult,
      error: fallbackError,
    };
  }

  const saveResult = await saveWorkoutItemsForSession(
    input.sessionId,
    input.workoutItems,
    resolvedUserId,
  );

  if (!saveResult.success) {
    const workoutPersistenceError =
      saveResult.error instanceof Error
        ? saveResult.error
        : new Error("Could not persist workout rows for recorded session");

    logger.error(
      "[Supabase] Could not persist workout rows for recorded session",
      workoutPersistenceError,
    );
    return {
      ...bookingResult,
      success: false,
      error: workoutPersistenceError,
    };
  }

  return bookingResult;
}

export async function cancelBooking(input: {
  bookingId?: string;
  sessionId?: string;
  userId?: string;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return {
      success: false as const,
      error: new Error("Unable to resolve the current user"),
    };
  }

  let query = client
    .from(getSessionTableName())
    .update({ status: "cancelled", updated_at: new Date().toISOString() });

  if (input.bookingId) {
    query = query.eq("id", input.bookingId).eq("user_id", resolvedUserId);
  } else if (input.sessionId) {
    query = query.eq("id", input.sessionId).eq("user_id", resolvedUserId);
  } else {
    return {
      success: false as const,
      error: new Error("bookingId or sessionId required"),
    };
  }

  const { data, error } = await query.select();

  if (error) {
    logger.error("[Supabase] Could not cancel booking", error);
    return { success: false as const, error };
  }

  return { success: true as const, bookings: data };
}

export async function listSessions(filters?: {
  userId?: string;
  trainerId?: string;
  from?: string;
  to?: string;
  status?: string;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return [] as any[];
  }

  let query = client.from(getSessionTableName()).select("*");

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.trainerId) {
    query = query.eq("trainer_id", filters.trainerId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    logger.warn("[Supabase] Could not list bookings", error);
    return [];
  }

  let results = Array.isArray(data) ? data : [];

  results = results.map((row: any) => ({
    ...row,
    session: {
      class_name: row.class_name ?? null,
      session_type: row.session_type ?? null,
      start_at: row.start_at ?? null,
      trainer_name: row.trainer_name ?? null,
    },
  }));

  if (filters?.from || filters?.to) {
    results = results.filter((r: any) => {
      const start = r.start_at ? new Date(r.start_at) : null;
      if (!start) return false;
      if (filters?.from && start < new Date(filters.from)) return false;
      if (filters?.to && start > new Date(filters.to)) return false;
      return true;
    });
  }

  return results;
}

export async function listBookings(filters?: {
  userId?: string;
  trainerId?: string;
  from?: string;
  to?: string;
  status?: string;
}) {
  return listSessions(filters);
}
