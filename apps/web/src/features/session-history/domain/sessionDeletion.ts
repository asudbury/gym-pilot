/**
 * Returns the next pending delete ID after a delete button click.
 *
 * The first click on an entry sets it as "pending" (requesting confirmation).
 * A second click on the same entry signals confirmation and returns the same
 * ID so the caller knows deletion should proceed.
 *
 * @param currentPendingId - The currently pending entry ID, or null if none.
 * @param targetId - The entry ID that was clicked.
 * @returns The next pending delete ID.
 */
export function handleDeletionClick(
  currentPendingId: string | null,
  targetId: string,
): string | null {
  if (currentPendingId === targetId) {
    // Second click on the same entry — caller should proceed with deletion.
    return targetId
  }

  // First click — set as pending (awaiting confirmation click).
  return targetId
}

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
