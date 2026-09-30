/**
 * Returns true when the given entry is ready to be permanently deleted.
 * An entry is ready when it is the currently pending entry (second click
 * on the same entry in the double-click confirmation pattern).
 *
 * @param pendingId - The currently pending delete entry ID.
 * @param targetId - The entry ID to check.
 * @returns True if deletion should proceed for this entry.
 */
export function isReadyToDelete(
  pendingId: string | null,
  targetId: string,
): boolean {
  return pendingId === targetId
}

/**
 * Returns null, representing a cleared/reset pending delete state.
 * Use after a deletion has completed or been cancelled.
 */
export function resetDeletionState(): null {
  return null
}
