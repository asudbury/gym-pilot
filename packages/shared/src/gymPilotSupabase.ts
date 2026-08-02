import type { UserRole } from "@gym-pilot/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logging";
import {
  buildSupabaseProfileTermsAcceptancePayload as buildSupabaseProfileTermsAcceptancePayloadFromProfilePersistence,
  invalidateSupabaseProfileCache as invalidateSupabaseProfileCacheFromProfilePersistence,
  loadSupabaseGymBrand as loadSupabaseGymBrandFromProfilePersistence,
  loadSupabaseGymName as loadSupabaseGymNameFromProfilePersistence,
  loadSupabaseProfileAccessState as loadSupabaseProfileAccessStateFromProfilePersistence,
  loadSupabaseProfileApplicationName as loadSupabaseProfileApplicationNameFromProfilePersistence,
  loadSupabaseProfileFlag as loadSupabaseProfileFlagFromProfilePersistence,
  loadSupabaseProfileLoginHistory as loadSupabaseProfileLoginHistoryFromProfilePersistence,
  loadSupabaseProfileName as loadSupabaseProfileNameFromProfilePersistence,
  loadSupabaseProfileRoles as loadSupabaseProfileRolesFromProfilePersistence,
  loadSupabaseProfileSnapshot as loadSupabaseProfileSnapshotFromProfilePersistence,
  loadSupabaseProfileTermsAcceptance as loadSupabaseProfileTermsAcceptanceFromProfilePersistence,
  saveSupabaseApplicationName as saveSupabaseApplicationNameFromProfilePersistence,
  saveSupabaseGymBrand as saveSupabaseGymBrandFromProfilePersistence,
  saveSupabaseGymName as saveSupabaseGymNameFromProfilePersistence,
  saveSupabaseProfileAccessSettings as saveSupabaseProfileAccessSettingsFromProfilePersistence,
  saveSupabaseProfileEmail as saveSupabaseProfileEmailFromProfilePersistence,
  saveSupabaseProfileFlag as saveSupabaseProfileFlagFromProfilePersistence,
  saveSupabaseProfile as saveSupabaseProfileFromProfilePersistence,
  saveSupabaseProfileName as saveSupabaseProfileNameFromProfilePersistence,
  saveSupabaseProfileRoles as saveSupabaseProfileRolesFromProfilePersistence,
  saveSupabaseProfileTermsAcceptance as saveSupabaseProfileTermsAcceptanceFromProfilePersistence,
  type SupabaseAccessTier,
  type SupabaseProfile,
  type SupabaseProfileSnapshot,
  type SupabaseProfileUpdatePayload,
} from "./profilePersistence";
import { getSupabaseClient } from "./supabase";
import { getAuthenticatedUserId } from "./supabaseAuth";
import { normalizeUserRoles } from "./utils";

// Shared persistence helpers are now provided by the data service modules.
export {
  getSupabaseTableName,
  isFavoritesKey,
  normalizeFavoriteStorageValue,
  normalizeFolderName,
  type FavoriteLink,
  type FavoriteStorageValue,
  type SupabaseRecordResponse,
} from "./dataServices/jsonRecordDataService";

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

function mapSupabaseProfile(
  profile: {
    id: string;
    user_id: string; // Always present
    friendly_name: string | null; // Always present
    application_name: string | null; // Always present, can be null
    gym_brand: string | null; // Always present, can be null
    gym_name: string | null; // Always present, can be null
    gym_club_id: number | null; // Always present, can be null
    account_tier: string | null; // Always present, can be null
    access_ends_at: string | null; // Always present, can be null
    is_frozen: boolean | null; // Always present, can be null
    roles?: unknown;
    trainer_id: string | null; // Always present, can be null
    must_change_password: boolean; // Always present
    created_at: string; // Always present
    updated_at: string; // Always present
  },
  roleOverride?: UserRole[],
): SupabaseProfile {
  return {
    id: profile.id,
    user_id: profile.user_id,
    friendly_name:
      typeof profile.friendly_name === "string" ? profile.friendly_name : null,
    application_name: profile.application_name ?? null,
    gym_brand: profile.gym_brand ?? null,
    gym_name: profile.gym_name ?? null,
    account_tier: normalizeProfileAccessTier(profile.account_tier),
    access_ends_at: profile.access_ends_at ?? null,
    is_frozen: Boolean(profile.is_frozen), // Coerce to boolean, default false
    roles: roleOverride ?? normalizeProfileRoles(profile.roles),
    trainer_id: profile.trainer_id ?? null,
    must_change_password: Boolean(profile.must_change_password),
    created_at: profile.created_at, // Assuming always present from DB
    updated_at: profile.updated_at, // Assuming always present from DB
  };
}

export type {
  SupabaseAccessTier,
  SupabaseProfile,
  SupabaseProfileSnapshot,
  SupabaseProfileUpdatePayload,
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

  const { data, error } = await client.from("gym_pilot_profile").select("*");

  if (error) {
    logger.error("[Supabase] Could not load profiles", error);
    return [];
  }

  const profileRows = (
    (data ?? []) as Array<{
      id: string;
      user_id: string;
      friendly_name: string | null;
      application_name: string | null;
      gym_brand: string | null;
      gym_name: string | null;
      gym_club_id: number | null;
      account_tier: string | null;
      access_ends_at: string | null;
      is_frozen: boolean | null;
      trainer_id: string | null;
      must_change_password: boolean;
      created_at: string;
      updated_at: string;
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
          application_name: profile.application_name,
          gym_brand: profile.gym_brand,
          gym_name: profile.gym_name,
          gym_club_id: profile.gym_club_id,
          account_tier: profile.account_tier,
          access_ends_at: profile.access_ends_at,
          is_frozen: profile.is_frozen,
          trainer_id: profile.trainer_id,
          must_change_password: Boolean(profile.must_change_password),
          created_at: profile.created_at, // Assuming always present from DB
          updated_at: profile.updated_at, // Assuming always present from DB
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

    if (upsertError) {
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
        application_name: string | null;
        gym_brand: string | null;
        gym_name: string | null;
        gym_club_id: number | null;
        account_tier: string | null;
        access_ends_at: string | null;
        is_frozen: boolean | null;
        trainer_id: string | null;
        must_change_password: boolean;
        created_at: string;
        updated_at: string;
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
          application_name: profile.application_name,
          gym_brand: profile.gym_brand,
          gym_name: profile.gym_name,
          gym_club_id: profile.gym_club_id,
          account_tier: profile.account_tier,
          access_ends_at: profile.access_ends_at,
          is_frozen: profile.is_frozen,
          trainer_id: profile.trainer_id,
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
export {
  loadSupabaseJsonRecord,
  removeSupabaseJsonRecord,
  saveSupabaseJsonRecord,
} from "./dataServices/jsonRecordDataService";

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
  shouldRecordLoginActivity,
  shouldRecordSupabaseUserActivity,
} from "./userActivity";

export {
  getWorkoutItemsTableName,
  loadWorkoutItemsForSession,
  saveWorkoutItemsForSession,
} from "./sessionWorkoutPersistence";

export {
  bookSession,
  buildSessionBookingAttendancePayload,
  buildSessionBookingSessionPayload,
  buildSessionRecordPayload,
  cancelBooking,
  createSession,
  getSessionBookingTableName,
  getSessionHistorySelectColumns,
  getSessionHistoryTableName,
  getSessionTableName,
  listBookings,
  listSessions,
  normalizeSessionTypeForPersistence,
  recordSession,
  saveTimetableAttendance,
} from "./dataServices/sessionDataService";
