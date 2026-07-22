import type { UserRole } from "@gym-pilot/types";

export function createUUID() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function normalizeUserRoles(
  roles?: Array<UserRole | string> | null,
  fallbackRole?: UserRole,
): UserRole[] {
  const normalizedRoles = (
    Array.isArray(roles) ? roles : fallbackRole ? [fallbackRole] : []
  ).filter((role): role is UserRole =>
    ["admin", "trainer", "client", "guest"].includes(String(role) as UserRole),
  );

  return normalizedRoles.length > 0
    ? normalizedRoles
    : fallbackRole
      ? [fallbackRole]
      : ["client"];
}

export function classNames(
  ...classes: Array<string | boolean | null | undefined>
): string {
  return classes
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    )
    .join(" ");
}
