import type { TimetableAttendanceAction, TimetableSession } from './timetableView'

/** Attendance form state used in the TimetablePage attendance modal. */
export type AttendanceFormState = {
  pendingSession: TimetableSession | null
  notes: string
  rating: number | null
  saving: boolean
  message: string | null
  selection: 'attended' | 'taught' | null
}

/**
 * Returns the default/reset attendance form state.
 * Use as the initial useState value or to reset after a submission.
 */
export function createAttendanceFormState(): AttendanceFormState {
  return {
    pendingSession: null,
    notes: '',
    rating: null,
    saving: false,
    message: null,
    selection: 'attended',
  }
}

/**
 * Returns a new attendance form state pre-populated for the given session,
 * resetting notes, rating, message, and setting the initial selection based
 * on the available options from the resolved attendance action.
 *
 * @param session - The timetable session the user wants to record attendance for.
 * @param action - The resolved attendance action for the current user's role.
 * @returns A fresh AttendanceFormState ready for the attendance modal.
 */
export function openAttendanceForm(
  session: TimetableSession,
  action: TimetableAttendanceAction,
): AttendanceFormState {
  return {
    pendingSession: session,
    notes: '',
    rating: null,
    saving: false,
    message: null,
    selection:
      action.options.length > 1 ? 'attended' : action.kind,
  }
}

/**
 * Returns the attendance form state after a successful save, clearing the
 * pending session and resetting transient fields.
 */
export function resetAttendanceFormAfterSave(): AttendanceFormState {
  return {
    ...createAttendanceFormState(),
    message: 'Session saved.',
  }
}
