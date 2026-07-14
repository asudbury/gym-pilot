import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Plan, PlanItem, WeeklyDay } from '@gym-pilot/types'
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
  plans: Plan[]
  createPlan: (planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => void
  createPlanForPeople: (personInput: string | string[] | undefined, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => void
  updatePlanExercise: (planId: string, exerciseId: string, value: string) => void
  deletePlan: (planId: string) => void
}

type PlanProviderProps = {
  children: ReactNode
  storageKey?: string
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined)
const persistence = new LocalStoragePersistence()

function buildPlanSlug(name: string, plans: Plan[]) {
  const slugParts = [name]
    .map((value) =>
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    )
    .filter(Boolean)

  const baseSlug = slugParts.join('-') || 'plan'
  const duplicateCount = plans.filter(
    (plan) => (plan.planSlug ?? '').toLowerCase() === baseSlug || (plan.planSlug ?? '').startsWith(`${baseSlug}-`),
  ).length

  return duplicateCount > 0 ? `${baseSlug}-${duplicateCount + 1}` : baseSlug
}

function normalizePlan(plan: Plan): Plan {
  const assignedPeople = (plan.assignedPeople ?? []).filter(Boolean)
  const fallbackName = plan.planName || plan.personName || assignedPeople.join(', ') || 'Untitled plan'
  const fallbackSlugSource = plan.planName || assignedPeople[0] || fallbackName

  return {
    ...plan,
    planName: fallbackName,
    planSlug: plan.planSlug || buildPlanSlug(fallbackName, []),
    personName: plan.personName || (assignedPeople.length > 0 ? assignedPeople.join(', ') : undefined),
    personSlug:
      plan.personSlug ||
      fallbackSlugSource
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    assignedPeople: assignedPeople.length > 0 ? assignedPeople : undefined,
    exercises: plan.exercises ?? [],
  }
}

function getStoredPlans(storageKey: string): Plan[] {
  const stored = persistence.load<Plan[]>(storageKey, [])
  if (!Array.isArray(stored)) {
    return []
  }

  return stored.map((plan) => normalizePlan(plan))
}

export function PlanProvider({ children, storageKey = 'gym-pilot-plans' }: PlanProviderProps) {
  const [plans, setPlans] = useState<Plan[]>(() => getStoredPlans(storageKey))

  useEffect(() => {
    persistence.save(storageKey, plans)
  }, [plans, storageKey])

  const createPlan = (planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => {
    const trimmedName = planName.trim()

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

    const newPlan: Plan = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      planName: trimmedName,
      planSlug: buildPlanSlug(trimmedName, plans),
      personName: undefined,
      personSlug: undefined,
      completedExercises: {},
      exercises: selectedExercises,
    }

    setPlans((current) => [...current, newPlan])
  }

  const createPlanForPeople = (personInput: string | string[] | undefined, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => {
    const assignedPeople = (Array.isArray(personInput) ? personInput : [personInput ?? ''])
      .map((value) => value.trim())
      .filter(Boolean)

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

    const fallbackName = assignedPeople.length > 0 ? assignedPeople.join(', ') : 'Untitled plan'
    const personSlug = assignedPeople.length > 0
      ? assignedPeople[0]
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      : undefined
    const newPlanItem: Plan = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      personName: assignedPeople.length > 0 ? fallbackName : undefined,
      personSlug,
      assignedPeople: assignedPeople.length > 0 ? assignedPeople : undefined,
      planName: fallbackName,
      planSlug: buildPlanSlug(fallbackName, plans),
      exercises: selectedExercises,
      completedExercises: {},
    }

    setPlans((current) => [...current, newPlanItem])
  }

  const updatePlanExercise = (planId: string, exerciseId: string, value: string) => {
    setPlans((current) =>
      current.map((plan) => {
        if (plan.id !== planId) {
          return plan
        }

        return {
          ...plan,
          completedExercises: { ...plan.completedExercises, [exerciseId]: value },
        }
      }),
    )
  }

  const deletePlan = (planId: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId))
  }

  const value = useMemo<PlanContextValue>(
    () => ({
      plans,
      createPlan,
      createPlanForPeople,
      updatePlanExercise,
      deletePlan,
    }),
    [plans],
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
