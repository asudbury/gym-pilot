import type { UserRole } from "@gym-pilot/types";

export function createUUID() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function isValidUuid(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
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
