export * from './exerciseSchema'
export * from './planContext'
export * from './data'
export * from './storage'
export * from './schemaDocs'
export * from './logging'
export { shouldPersistErrorLogs, shouldPersistAuditLogs, persistErrorLog, persistAuditLog } from './logging'
export {
  ensureAuthenticatedSupabaseSession,
  getSupabaseClient,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  listSupabaseAuthUsers,
  resetSupabasePassword,
  changeSupabasePassword,
  signOutFromSupabase,
} from './supabase'
export { getSupabaseAdminClient } from './supabase'
export {
  isSupabasePersistenceEnabled,
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
  loadAppSettings,
  loadAppSetting,
  saveAppSetting,
  saveAppSettings,
  saveTimetableAttendance,
  loadSessionHistoryEntries,
  mapSessionHistoryEntryFromSupabase,
  formatSessionHistoryError,
  getSessionHistoryTableName,
  saveSessionHistoryEntry,
  deleteSessionHistoryEntry,
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
} from './gymPilotSupabase'
export * from './utils'
export * from './repositories'
export * from './appSettings'
