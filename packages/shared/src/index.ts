export * from "./exerciseSchema";
export * from "./planContext";
export * from "./data";
export * from "./storage";
export * from "./schemaDocs";
export * from "./logging";
export {
  shouldPersistErrorLogs,
  shouldPersistAuditLogs,
  persistErrorLog,
  persistAuditLog,
} from "./logging";
export {
  ensureAuthenticatedSupabaseSession,
  getSupabaseClient,
  signInWithPassword,
  signUpWithPassword,
  listSupabaseAuthUsers,
  resetSupabasePassword,
  changeSupabasePassword,
  signOutFromSupabase,
} from "./supabase";
export { getSupabaseAdminClient } from "./supabase";
export {
  loadSupabaseProfileSnapshot,
  loadSupabaseProfileName,
  loadSupabaseProfileAccessState,
  loadSupabaseApplicationName,
  loadSupabaseGymBrand,
  loadSupabaseGymName,
  loadSupabaseProfileLoginHistory,
  listSupabaseProfiles,
  loadSupabaseProfileFlag,
  loadSupabaseProfileRoles,
  loadSupabaseProfileTermsAcceptance,
  saveSupabaseProfile,
  saveSupabaseProfileName,
  saveSupabaseProfileEmail,
  saveSupabaseApplicationName,
  saveSupabaseGymBrand,
  saveSupabaseGymName,
  saveSupabaseProfileAccessSettings,
  saveSupabaseProfileFlag,
  saveSupabaseProfileRoles,
  saveSupabaseProfileTermsAcceptance,
  saveSupabaseProfileLastLoggedIn,
  loadSupabaseJsonRecord,
  saveSupabaseJsonRecord,
  removeSupabaseJsonRecord,
  recordSupabaseUserActivity,
  saveTimetableAttendance,
  loadSessionHistoryEntries,
  loadWorkoutItemsForSession,
  saveWorkoutItemsForSession,
  mapSessionHistoryEntryFromSupabase,
  formatSessionHistoryError,
  getSessionHistoryTableName,
  saveSessionHistoryEntry,
  deleteSessionHistoryEntry,
  buildSessionHistoryDeleteError,
  upsertSessionHistoryEntry,
  removeSessionHistoryEntry,
  type SessionHistoryEntry,
  getSessionTableName,
  getSessionBookingTableName,
  createSession,
  bookSession,
  recordSession,
  cancelBooking,
  listSessions,
  listBookings,
} from "./gymPilotSupabase";
export * from "./utils";
export * from "./repositories";
export * from "./appSettings";
export * from "./appSettingsService";
export * from "./userActivity";
export * from "./sessionHistory";
export * from "./sessionWorkout";
export * from "./sessionWorkoutPersistence";
export * from "./profilePersistence";
export type { SupabaseProfileUpdatePayload } from "./profilePersistence";
