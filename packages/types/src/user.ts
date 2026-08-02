export type UserRole = "admin" | "trainer" | "client" | "guest";
export type AccountTier = "free" | "bronze" | "silver" | "gold";

export type User = {
  id: string;
  name: string;
  slug: string;
  role?: UserRole;
  roles: UserRole[];
  trainerId?: string | null;
  applicationName?: string | null;
  gymBrand?: string | null;
  gymName?: string | null;
  accountTier?: AccountTier | null;
  accessEndsAt?: string | null;
  isFrozen?: boolean;
  last_sign_in_at?: string | null; // Add last_sign_in_at from Supabase User
};
