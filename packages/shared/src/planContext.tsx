import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Assignment, PlanItem, WeeklyDay } from '@gym-pilot/types'
import type { Exercise } from './exerciseSchema'
import { exercises } from './data'
import { LocalStoragePersistence } from './storage'

function createPlanItem(exercise: Exercise): PlanItem {
  return {
    ...exercise,
    note: '3 sets x 10 reps',
  }
}

type PlanContextValue = {
  assignments: Assignment[]
  assignPlan: (personName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => void
  updateAssignmentExercise: (assignmentId: string, exerciseId: string, value: string) => void
  updateAssignmentExerciseDay: (assignmentId: string, exerciseId: string, day: WeeklyDay | '') => void
  deleteAssignment: (assignmentId: string) => void
}

type PlanProviderProps = {
  children: ReactNode
  storageKey?: string
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined)
const persistence = new LocalStoragePersistence()

function buildAssignmentSlug(personName: string, assignments: Assignment[]) {
  const slugParts = [personName]
    .map((value) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    )
    .filter(Boolean)

  const baseSlug = slugParts.join('-') || 'assignment'
  const duplicateCount = assignments.filter(
    (assignment) => assignment.assignmentSlug === baseSlug || assignment.assignmentSlug.startsWith(`${baseSlug}-`),
  ).length

  return duplicateCount > 0 ? `${baseSlug}-${duplicateCount + 1}` : baseSlug
}

function normalizeAssignment(assignment: Assignment): Assignment {
  return {
    ...assignment,
    personSlug:
      assignment.personSlug ||
      assignment.personName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    assignmentSlug: assignment.assignmentSlug || buildAssignmentSlug(assignment.personName, []),
    exercises: assignment.exercises ?? [],
  }
}

function getStoredAssignments(storageKey: string): Assignment[] {
  const stored = persistence.load<Assignment[]>(storageKey, [])
  if (!Array.isArray(stored)) {
    return []
  }

  return stored.map((assignment) => normalizeAssignment(assignment))
}

export function PlanProvider({ children, storageKey = 'gym-pilot-assignments' }: PlanProviderProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(() => getStoredAssignments(storageKey))

  useEffect(() => {
    persistence.save(storageKey, assignments)
  }, [assignments, storageKey])

  const assignPlan = (personName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => {
    const trimmedName = personName.trim()

    if (!trimmedName) {
      return
    }

    const selectedExercises = (exerciseIds ?? [])
      .map((exerciseId) => exercises.find((exercise) => exercise.id === exerciseId))
      .filter((exercise): exercise is Exercise => Boolean(exercise))
      .map((exercise) => {
        const item = createPlanItem(exercise)
        return {
          ...item,
          assignedDay: assignedDays?.[exercise.id],
        }
      })

    if (selectedExercises.length === 0) {
      return
    }

    const personSlug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const assignmentSlug = buildAssignmentSlug(trimmedName, assignments)

    const newAssignment: Assignment = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      personName: trimmedName,
      personSlug,
      assignmentSlug,
      planId: '',
      planName: 'Exercise-based assignment',
      exercises: selectedExercises,
      completedExercises: {},
    }

    setAssignments((current) => [...current, newAssignment])
  }

  const updateAssignmentExercise = (assignmentId: string, exerciseId: string, value: string) => {
    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.id !== assignmentId) {
          return assignment
        }

        return {
          ...assignment,
          completedExercises: { ...assignment.completedExercises, [exerciseId]: value },
        }
      }),
    )
  }

  const updateAssignmentExerciseDay = (assignmentId: string, exerciseId: string, day: WeeklyDay | '') => {
    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.id !== assignmentId) {
          return assignment
        }

        return {
          ...assignment,
          exercises: assignment.exercises.map((item) =>
            item.id === exerciseId ? { ...item, assignedDay: day || undefined } : item,
          ),
        }
      }),
    )
  }

  const deleteAssignment = (assignmentId: string) => {
    setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId))
  }

  const value = useMemo<PlanContextValue>(
    () => ({
      assignments,
      assignPlan,
      updateAssignmentExercise,
      updateAssignmentExerciseDay,
      deleteAssignment,
    }),
    [assignments],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const context = useContext(PlanContext)

  if (!context) {
    throw new Error('usePlan must be used within a PlanProvider')
  }

  return context
}
