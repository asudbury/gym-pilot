import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Plan, PlanItem, User, WeeklyDay } from '@gym-pilot/types'
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
  users: User[]
  createPlan: (planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>, assignedUserIds?: string[]) => void
  createPlanForPeople: (personInput: string | string[] | undefined, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => void
  updatePlan: (planId: string, planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>, assignedUserIds?: string[]) => void
  assignUsersToPlan: (planId: string, assignedUserIds: string[]) => void
  updatePlanExercise: (planId: string, exerciseId: string, value: string) => void
  deletePlan: (planId: string) => void
  createUser: (name: string) => User | undefined
  deleteUser: (userId: string) => void
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
    assignedUserIds: plan.assignedUserIds ?? (plan.assignedUserId ? [plan.assignedUserId] : undefined),
    assignedUserId: plan.assignedUserId,
    completedExercises: plan.completedExercises ?? {},
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

function buildUserSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'user'
}

export function PlanProvider({ children, storageKey = 'gym-pilot-plans' }: PlanProviderProps) {
  const [plans, setPlans] = useState<Plan[]>(() => getStoredPlans(storageKey))
  const [users, setUsers] = useState<User[]>(() => {
    const storedUsers = persistence.load<User[]>('gym-pilot-users', [])
    return Array.isArray(storedUsers) ? storedUsers : []
  })

  useEffect(() => {
    persistence.save(storageKey, plans)
  }, [plans, storageKey])

  useEffect(() => {
    persistence.save('gym-pilot-users', users)
  }, [users])

  const createPlan = (planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>, assignedUserIds?: string[]) => {
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

    const resolvedAssignedUserIds = (assignedUserIds ?? []).filter((value) => typeof value === 'string' && value.trim() !== '')
    const assignedUsers = users.filter((user) => resolvedAssignedUserIds.includes(user.id))

    const newPlan: Plan = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      planName: trimmedName,
      planSlug: buildPlanSlug(trimmedName, plans),
      personName: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name).join(', ') : undefined,
      personSlug: assignedUsers[0]?.slug,
      assignedPeople: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name) : undefined,
      assignedUserIds: assignedUsers.length > 0 ? assignedUsers.map((user) => user.id) : undefined,
      assignedUserId: assignedUsers[0]?.id,
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

  const updatePlan = (planId: string, planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>, assignedUserIds?: string[]) => {
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

    const resolvedAssignedUserIds = (assignedUserIds ?? []).filter((value) => typeof value === 'string' && value.trim() !== '')
    const assignedUsers = users.filter((user) => resolvedAssignedUserIds.includes(user.id))

    setPlans((current) =>
      current.map((plan) => {
        if (plan.id !== planId) {
          return plan
        }

        const nextSlug = buildPlanSlug(trimmedName, current.filter((item) => item.id !== planId))

        return {
          ...plan,
          planName: trimmedName,
          planSlug: nextSlug,
          personName: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name).join(', ') : plan.personName,
          personSlug: assignedUsers[0]?.slug ?? plan.personSlug,
          assignedPeople: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name) : undefined,
          assignedUserIds: assignedUsers.length > 0 ? assignedUsers.map((user) => user.id) : undefined,
          assignedUserId: assignedUsers[0]?.id ?? plan.assignedUserId,
          exercises: selectedExercises,
        }
      }),
    )
  }

  const assignUsersToPlan = (planId: string, assignedUserIds: string[]) => {
    const resolvedAssignedUserIds = (assignedUserIds ?? [])
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '')

    const assignedUsers = users.filter((user) => resolvedAssignedUserIds.includes(user.id))

    setPlans((current) =>
      current.map((plan) => {
        if (plan.id !== planId) {
          return plan
        }

        return {
          ...plan,
          personName: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name).join(', ') : undefined,
          personSlug: assignedUsers[0]?.slug ?? plan.personSlug,
          assignedPeople: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name) : undefined,
          assignedUserIds: assignedUsers.length > 0 ? assignedUsers.map((user) => user.id) : undefined,
          assignedUserId: assignedUsers[0]?.id ?? plan.assignedUserId,
        }
      }),
    )
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

  const createUser = (name: string) => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      return undefined
    }

    const duplicate = users.find((user) => user.name.toLowerCase() === trimmedName.toLowerCase())

    if (duplicate) {
      return duplicate
    }

    const nextUser: User = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: trimmedName,
      slug: buildUserSlug(trimmedName),
    }

    setUsers((current) => [...current, nextUser])
    return nextUser
  }

  const deleteUser = (userId: string) => {
    const trimmedUserId = userId.trim()

    if (!trimmedUserId) {
      return
    }

    const nextUsers = users.filter((user) => user.id !== trimmedUserId)

    setUsers(nextUsers)
    setPlans((current) =>
      current.map((plan) => {
        const nextAssignedUserIds = (plan.assignedUserIds ?? []).filter((id) => id !== trimmedUserId)
        const assignedUsers = nextUsers.filter((user) => nextAssignedUserIds.includes(user.id))

        return {
          ...plan,
          personName: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name).join(', ') : undefined,
          personSlug: assignedUsers[0]?.slug ?? plan.personSlug,
          assignedPeople: assignedUsers.length > 0 ? assignedUsers.map((user) => user.name) : undefined,
          assignedUserIds: assignedUsers.length > 0 ? assignedUsers.map((user) => user.id) : undefined,
          assignedUserId: assignedUsers[0]?.id ?? plan.assignedUserId,
        }
      }),
    )
  }

  const value = useMemo<PlanContextValue>(
    () => ({
      plans,
      users,
      createPlan,
      createPlanForPeople,
      updatePlan,
      assignUsersToPlan,
      updatePlanExercise,
      deletePlan,
      createUser,
      deleteUser,
    }),
    [plans, users],
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
