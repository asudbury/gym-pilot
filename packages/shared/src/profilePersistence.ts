import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@gym-pilot/types";
import { getSupabaseClient } from "./supabase";
import { logger } from "./logging";
import { normalizeUserRoles } from "./utils";
import {
  saveJsonRecord as saveDexieJsonRecord,
  loadJsonRecord as loadDexieJsonRecord,
} from "./dexie";
import { getAuthenticatedUserId } from "./supabaseAuth";

export type SupabaseAccessTier = "free" | "bronze" | "silver" | "gold";

export type SupabaseProfileSnapshot = {
  friendlyName: string | null;
  applicationName: string | null;
  gymBrand: string | null;
  email: string | null;
  gymName: string | null;
  gymClubId: string | null;
  accountTier: SupabaseAccessTier;
  accessEndsAt: string | null;
  isFrozen: boolean;
  lastLoggedInAt: string | null;
  previousLastLoggedInAt: string | null;
  mustChangePassword: boolean;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  roles: UserRole[];
  trainerId: string | null;
};

export type SupabaseProfileUpdatePayload = Partial<{
  friendly_name: string | null;
  application_name: string | null;
  gym_brand: string | null;
  email: string | null;
  gym_name: string | null;
  gym_club_id: number | null;
  account_tier: SupabaseAccessTier | string;
  access_ends_at: string | null;
  is_frozen: boolean;
  must_change_password: boolean;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  trainer_id: string | null;
}>;

export type SupabaseProfile = {
  id: string;
  user_id: string;
  friendly_name: string | null;
  application_name: string | null;
  gym_brand: string | null;
  gym_name: string | null;
  account_tier: string | null;
  access_ends_at: string | null;
  is_frozen: boolean;
  roles: string[] | null;
  trainer_id: string | null;
  must_change_password: boolean;
  created_at?: string;
  updated_at?: string;
};

const profileSnapshotCache = new Map<
  string,
  Promise<SupabaseProfileSnapshot>
>();

function createEmptyProfileSnapshot(): SupabaseProfileSnapshot {
  return {
    friendlyName: null,
    applicationName: null,
    gymBrand: null,
    email: null,
    gymName: null,
    gymClubId: null,
    accountTier: "free",
    accessEndsAt: null,
    isFrozen: false,
    lastLoggedInAt: null,
    previousLastLoggedInAt: null,
    mustChangePassword: false,
    termsAccepted: false,
    termsAcceptedAt: null,
    roles: [],
    trainerId: null,
  };
}

export function getSupabaseProfileLocalStorageKey(userId: string) {
  return `profile:${userId}`;
}

export function buildSupabaseProfileLocalCacheEntry(
  userId: string,
  snapshot: SupabaseProfileSnapshot,
) {
  return {
    userId,
    snapshot,
    storedAt: new Date().toISOString(),
  };
}

async function persistSupabaseProfileSnapshotToLocalCache(
  userId: string,
  snapshot: SupabaseProfileSnapshot,
) {
  try {
    await saveDexieJsonRecord(
      getSupabaseProfileLocalStorageKey(userId),
      buildSupabaseProfileLocalCacheEntry(userId, snapshot),
    );
  } catch (error) {
    logger.warn(
      "[Supabase] Could not persist profile snapshot to local cache",
      error,
    );
  }
}

async function loadSupabaseProfileSnapshotFromLocalCache(
  userId: string,
): Promise<SupabaseProfileSnapshot | null> {
  try {
    const cachedEntry = await loadDexieJsonRecord<{
      userId: string;
      snapshot: SupabaseProfileSnapshot;
      storedAt: string;
    } | null>(getSupabaseProfileLocalStorageKey(userId), null);
    if (!cachedEntry?.snapshot) {
      return null;
    }

    return cachedEntry.snapshot;
  } catch (error) {
    logger.warn(
      "[Supabase] Could not load profile snapshot from local cache",
      error,
    );
    return null;
  }
}

function normalizeProfileAccessTier(value: unknown): SupabaseAccessTier {
  if (value === "bronze" || value === "silver" || value === "gold") {
    return value;
  }

  return "free";
}

function normalizeProfileRoles(roles: unknown): UserRole[] {
  if (Array.isArray(roles)) {
    return roles.filter(
      (role): role is UserRole => typeof role === "string" && role.length > 0,
    ) as UserRole[];
  }

  return [];
}

function normalizeProfileSnapshotRow(
  profile: Record<string, unknown>,
  roleOverride?: UserRole[],
): SupabaseProfileSnapshot {
  return {
    friendlyName:
      typeof profile.friendly_name === "string" ? profile.friendly_name : null,
    applicationName:
      typeof profile.application_name === "string"
        ? profile.application_name
        : null,
    gymBrand: typeof profile.gym_brand === "string" ? profile.gym_brand : null,
    gymName: typeof profile.gym_name === "string" ? profile.gym_name : null,
    gymClubId:
      typeof profile.gym_club_id === "string" ? profile.gym_club_id : null,
    accountTier: normalizeProfileAccessTier(profile.account_tier),
    accessEndsAt:
      typeof profile.access_ends_at === "string"
        ? profile.access_ends_at
        : null,
    isFrozen: Boolean(profile.is_frozen),
    lastLoggedInAt:
      typeof profile.last_logged_in_at === "string"
        ? profile.last_logged_in_at
        : null,
    previousLastLoggedInAt:
      typeof profile.previous_last_logged_in_at === "string"
        ? profile.previous_last_logged_in_at
        : null,
    mustChangePassword: Boolean(profile.must_change_password),
    termsAccepted: Boolean(profile.terms_accepted),
    termsAcceptedAt:
      typeof profile.terms_accepted_at === "string"
        ? profile.terms_accepted_at
        : null,
    roles: roleOverride ?? normalizeProfileRoles(profile.roles),
    trainerId:
      typeof profile.trainer_id === "string" ? profile.trainer_id : null,
    email: typeof profile.email === "string" ? profile.email : null,
  };
}

export async function invalidateSupabaseProfileCache(userId?: string) {
  if (!userId) {
    profileSnapshotCache.clear();
    return;
  }

  profileSnapshotCache.delete(`profile:${userId}`);

  try {
    await saveDexieJsonRecord(getSupabaseProfileLocalStorageKey(userId), null);
  } catch (error) {
    logger.warn(
      "[Supabase] Could not clear local profile snapshot cache",
      error,
    );
  }
}

export async function loadSupabaseProfileSnapshot(
  userId?: string,
): Promise<SupabaseProfileSnapshot> {
  const client = getSupabaseClient();
  if (!client) {
    return createEmptyProfileSnapshot();
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return createEmptyProfileSnapshot();
  }

  const cacheKey = `profile:${resolvedUserId}`;
  const cachedPromise = profileSnapshotCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const snapshotPromise = (async () => {
    const localCachedSnapshot =
      await loadSupabaseProfileSnapshotFromLocalCache(resolvedUserId);
    if (localCachedSnapshot) {
      return localCachedSnapshot;
    }

    const { data, error } = await client
      .from("gym_pilot_profile")
      .select("*")
      .eq("user_id", resolvedUserId)
      .maybeSingle();
    if (error) {
      logger.warn("[Supabase] Could not load profile snapshot", error);
      return createEmptyProfileSnapshot();
    }

    const baseSnapshot = data
      ? normalizeProfileSnapshotRow(data as Record<string, unknown>)
      : createEmptyProfileSnapshot();

    await persistSupabaseProfileSnapshotToLocalCache(
      resolvedUserId,
      baseSnapshot,
    );
    return baseSnapshot;
  })();

  profileSnapshotCache.set(cacheKey, snapshotPromise);
  return snapshotPromise;
}

export async function loadSupabaseProfileName(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot();
  return snapshot.friendlyName;
}

export async function loadSupabaseProfileLoginHistory(): Promise<{
  lastLoggedInAt: string | null;
  previousLastLoggedInAt: string | null;
}> {
  const snapshot = await loadSupabaseProfileSnapshot();
  return {
    lastLoggedInAt: snapshot.lastLoggedInAt,
    previousLastLoggedInAt: snapshot.previousLastLoggedInAt,
  };
}

export async function loadSupabaseProfileAccessState(userId?: string): Promise<{
  accountTier: SupabaseAccessTier;
  accessEndsAt: string | null;
  isFrozen: boolean;
  isBlocked: boolean;
  blockReason: "frozen" | "expired" | null;
}> {
  const snapshot = await loadSupabaseProfileSnapshot(userId);
  return {
    accountTier: snapshot.accountTier,
    accessEndsAt: snapshot.accessEndsAt,
    isFrozen: snapshot.isFrozen,
    isBlocked:
      snapshot.isFrozen ||
      Boolean(
        snapshot.accessEndsAt &&
        new Date(snapshot.accessEndsAt).getTime() < Date.now(),
      ),
    blockReason: snapshot.isFrozen
      ? "frozen"
      : snapshot.accessEndsAt &&
          new Date(snapshot.accessEndsAt).getTime() < Date.now()
        ? "expired"
        : null,
  };
}

export async function loadSupabaseApplicationName(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot();
  return snapshot.applicationName;
}

export const loadSupabaseProfileApplicationName = loadSupabaseApplicationName;

export async function loadSupabaseProfileEmail(
  userId?: string,
): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot(userId);
  return snapshot.email;
}

export async function loadSupabaseGymBrand(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot();
  return snapshot.gymBrand;
}

export async function loadSupabaseGymName(): Promise<string | null> {
  const snapshot = await loadSupabaseProfileSnapshot();
  return snapshot.gymName;
}

export async function loadSupabaseProfileFlag(
  flag: "must_change_password",
  userId?: string,
): Promise<boolean> {
  if (flag !== "must_change_password") {
    return false;
  }

  const snapshot = await loadSupabaseProfileSnapshot(userId);
  return snapshot.mustChangePassword;
}

export async function loadSupabaseProfileTermsAcceptance(
  userId?: string,
): Promise<boolean> {
  const snapshot = await loadSupabaseProfileSnapshot(userId);
  return snapshot.termsAccepted;
}

export async function loadSupabaseProfileRoles(
  userId: string,
): Promise<UserRole[]> {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("gym_pilot_user_role")
    .select("user_id, role")
    .eq("user_id", userId);

  if (error) {
    logger.warn("[Supabase] Could not load user roles", error);
    return [];
  }

  return (Array.isArray(data) ? data : [])
    .map((row) =>
      row && typeof row === "object"
        ? (row as Record<string, unknown>).role
        : undefined,
    )
    .filter(
      (role): role is UserRole =>
        typeof role === "string" && normalizeUserRoles([role]).length > 0,
    );
}

export function buildSupabaseProfileTermsAcceptancePayload(
  userId: string,
  accepted: boolean,
  acceptedAt?: string | null,
) {
  return {
    user_id: userId,
    terms_accepted: Boolean(accepted),
    terms_accepted_at: accepted
      ? (acceptedAt ?? new Date().toISOString())
      : null,
  };
}

export async function saveSupabaseProfileName(
  friendlyName: string | null,
  userId?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client
    .from("gym_pilot_profile")
    .upsert(
      { user_id: resolvedUserId, friendly_name: friendlyName },
      { onConflict: "user_id" },
    );
  if (error) {
    logger.error("[Supabase] Could not save profile name", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseProfileEmail(
  email: string | null,
  userId?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client
    .from("gym_pilot_profile")
    .upsert({ user_id: resolvedUserId, email }, { onConflict: "user_id" });
  if (error) {
    logger.error("[Supabase] Could not save profile email", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseApplicationName(
  applicationName: string | null,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = await getAuthenticatedUserId(client);
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client
    .from("gym_pilot_profile")
    .upsert(
      { user_id: resolvedUserId, application_name: applicationName },
      { onConflict: "user_id" },
    );
  if (error) {
    logger.error("[Supabase] Could not save application name", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseGymBrand(gymBrand: string | null) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = await getAuthenticatedUserId(client);
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client
    .from("gym_pilot_profile")
    .upsert(
      { user_id: resolvedUserId, gym_brand: gymBrand },
      { onConflict: "user_id" },
    );
  if (error) {
    logger.error("[Supabase] Could not save gym brand", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseGymName(
  gymName: string | null,
  gymBrand?: string | null,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = await getAuthenticatedUserId(client);
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client.from("gym_pilot_profile").upsert(
    {
      user_id: resolvedUserId,
      gym_name: gymName,
      gym_brand: gymBrand ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    logger.error("[Supabase] Could not save gym name", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseProfile(
  payload: SupabaseProfileUpdatePayload,
  userId?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client
    .from("gym_pilot_profile")
    .upsert({ user_id: resolvedUserId, ...payload }, { onConflict: "user_id" });

  if (error) {
    logger.error("[Supabase] Could not save profile", error);
    throw error;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseProfileAccessSettings(
  accountTier: string | null,
  accessEndsAt: string | null,
  isFrozen: boolean,
  userId?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client.from("gym_pilot_profile").upsert(
    {
      user_id: resolvedUserId,
      account_tier: accountTier,
      access_ends_at: accessEndsAt,
      is_frozen: isFrozen,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    logger.error("[Supabase] Could not save profile access settings", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseProfileFlag(
  _flag: "must_change_password",
  value: boolean,
  userId?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client
    .from("gym_pilot_profile")
    .upsert(
      { user_id: resolvedUserId, must_change_password: value },
      { onConflict: "user_id" },
    );
  if (error) {
    logger.error("[Supabase] Could not save profile flag", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

function haveRolesChanged(
  currentRoles: UserRole[],
  nextRoles: UserRole[],
): boolean {
  if (currentRoles.length !== nextRoles.length) {
    return true;
  }

  const currentSet = new Set(currentRoles);

  return !nextRoles.every((role) => currentSet.has(role));
}

export async function saveSupabaseProfileRoles(
  roles: Array<UserRole | string> | UserRole | null | undefined,
  userId?: string,
  clientOverride?: SupabaseClient,
) {
  const client = clientOverride ?? getSupabaseClient();

  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return;
  }

  const normalizedRoles = normalizeUserRoles(
    Array.isArray(roles) ? roles : roles ? [roles] : [],
  );
  const roleRows = normalizedRoles.map((role) => ({
    user_id: resolvedUserId,
    role,
  }));

  const currentRoles = await loadSupabaseProfileRoles(resolvedUserId);
  if (!haveRolesChanged(currentRoles, normalizedRoles)) {
    // No changes to persist.
    return;
  }

  const { error: deleteError } = await client
    .from("gym_pilot_user_role")
    .delete()
    .eq("user_id", resolvedUserId);

  if (deleteError) {
    logger.error("[Supabase] Could not clear existing user roles", deleteError);
    return;
  }

  if (roleRows.length === 0) {
    await invalidateSupabaseProfileCache(resolvedUserId);
    return;
  }

  const { error: insertError } = await client
    .from("gym_pilot_user_role")
    .insert(roleRows);

  if (insertError) {
    logger.error("[Supabase] Could not save user roles", insertError);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}

export async function saveSupabaseProfileTermsAcceptance(
  accepted: boolean,
  userId?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return;
  }

  const { error } = await client.from("gym_pilot_profile").upsert(
    {
      user_id: resolvedUserId,
      terms_accepted: accepted,
      terms_accepted_at: accepted ? new Date().toISOString() : null,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    logger.error("[Supabase] Could not save profile terms acceptance", error);
    return;
  }

  await invalidateSupabaseProfileCache(resolvedUserId);
}
