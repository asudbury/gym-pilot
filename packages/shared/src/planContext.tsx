import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Assignment, Plan, PlanItem, User, UserRole, WeeklyDay } from '@gym-pilot/types'
import type { Exercise } from './exerciseSchema'
import { exercises } from './data'
import { DexiePersistence } from './storage'
import { ASSIGNMENTS_KEY } from '../../../apps/web/src/constants/storageKeys'

function createPlanItem(exercise: Exercise): PlanItem {
  return {
    ...exercise,
    note: '3 sets x 10 reps',
  }
}

type PlanContextValue = {
  plans: Plan[]
  assignments: Assignment[]
  users: User[]
  createPlan: (planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>, assignedUserIds?: string[]) => void
  createPlanForPeople: (personInput: string | string[] | undefined, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) => void
  updatePlan: (planId: string, planName: string, exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>, assignedUserIds?: string[]) => void
  assignUsersToPlan: (planId: string, assignedUserIds: string[]) => void
  updateAssignment: (assignmentId: string, planName: string, exerciseIds?: string[]) => void
  updatePlanExercise: (planId: string, exerciseId: string, value: string) => void
  deletePlan: (planId: string) => void
  deleteAssignment: (assignmentId: string) => void
  createUser: (name: string, role?: UserRole) => User | undefined
  deleteUser: (userId: string) => void
}

type PlanProviderProps = {
  children: ReactNode
  storageKey?: string
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined)
const persistence = new DexiePersistence()

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
    exercises: plan.exercises ?? [],
  }
}

function normalizeAssignment(assignment: Assignment): Assignment {
  return {
    ...assignment,
    completedExercises: assignment.completedExercises ?? {},
    exercises: assignment.exercises ?? [],
  }
}

async function getStoredPlans(storageKey: string): Promise<Plan[]> {
  const stored = await persistence.load<Plan[]>(storageKey, [])

  if (!Array.isArray(stored)) {
    return []
  }

  return stored.map((plan) => normalizePlan(plan))
}

async function getStoredAssignments(): Promise<Assignment[]> {
  const stored = await persistence.load<Assignment[]>(ASSIGNMENTS_KEY, [])

  if (!Array.isArray(stored)) {
    return []
  }

  return stored.map((assignment) => normalizeAssignment(assignment))
}

function buildUserSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'user'
}

function createAssignmentCopy(basePlan: Plan, user: User, plans: Plan[]): Assignment {
  const assignmentName = `${basePlan.planName || 'Untitled plan'} - ${user.name}`

  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    planId: basePlan.id,
    planName: assignmentName,
    planSlug: buildPlanSlug(assignmentName, plans),
    assignedUserId: user.id,
    assignedUserName: user.name,
    completedExercises: {},
    exercises: basePlan.exercises.map((exercise) => ({ ...exercise })),
  }
}

function buildPlanItems(exerciseIds?: string[], assignedDays?: Record<string, WeeklyDay>) {
  return (exerciseIds ?? [])
    .map((exerciseId) => exercises.find((exercise) => exercise.id === exerciseId))
    .filter((exercise): exercise is Exercise => Boolean(exercise))
    .map((exercise) => {
      const item = createPlanItem(exercise)
      return {
        ...item,
        assignedDay: assignedDays?.[exercise.id],
      }
    })
}

export function PlanProvider({ children, storageKey = 'gym-pilot-plans' }: PlanProviderProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    let isActive = true

    void getStoredPlans(storageKey).then((storedPlans) => {
      if (isActive) {
        setPlans(storedPlans)
      }
    })

    return () => {
      isActive = false
    }
  }, [storageKey])

  useEffect(() => {
    let isActive = true

    void getStoredAssignments().then((storedAssignments) => {
      if (isActive) {
        setAssignments(storedAssignments)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    void persistence.load<User[]>('gym-pilot-users', []).then((storedUsers) => {
      if (isActive) {
        setUsers(Array.isArray(storedUsers) ? storedUsers : [])
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    void persistence.save(storageKey, plans)
  }, [plans, storageKey])

  useEffect(() => {
    void persistence.save('gym-pilot-assignments', assignments)
  }, [assignments])

  useEffect(() => {
    void persistence.save('gym-pilot-users', users)
  }, [users])

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
      assignedPeople: undefined,
      assignedUserIds: undefined,
      assignedUserId: undefined,
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
        const nextPersonName = assignedUsers.length > 0 ? assignedUsers.map((user) => user.name).join(', ') : plan.personName
        const nextPersonSlug = assignedUsers[0]?.slug ?? plan.personSlug
        const nextAssignedPeople = assignedUsers.length > 0 ? assignedUsers.map((user) => user.name) : plan.assignedPeople
        const nextAssignedUserIds = assignedUsers.length > 0 ? assignedUsers.map((user) => user.id) : plan.assignedUserIds
        const nextAssignedUserId = assignedUsers[0]?.id ?? plan.assignedUserId

        return {
          ...plan,
          planName: trimmedName,
          planSlug: nextSlug,
          personName: nextPersonName,
          personSlug: nextPersonSlug,
          assignedPeople: nextAssignedPeople,
          assignedUserIds: nextAssignedUserIds,
          assignedUserId: nextAssignedUserId,
          exercises: selectedExercises,
        }
      }),
    )
  }

  const assignUsersToPlan = (planId: string, assignedUserIds: string[]) => {
    const resolvedAssignedUserIds = (assignedUserIds ?? [])
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '')

    const assignedUsers = users.filter((user) => resolvedAssignedUserIds.includes(user.id))

    setAssignments((current) => {
      const basePlan = plans.find((plan) => plan.id === planId)

      if (!basePlan) {
        return current
      }

      const existingAssignments = current.filter((assignment) => assignment.planId === planId)
      const nextAssignments: Assignment[] = []

      assignedUsers.forEach((user) => {
        const existingAssignment = existingAssignments.find((assignment) => assignment.assignedUserId === user.id)

        if (existingAssignment) {
          nextAssignments.push({
            ...existingAssignment,
            planName: `${basePlan.planName || 'Untitled plan'} - ${user.name}`,
            planSlug: buildPlanSlug(`${basePlan.planName || 'Untitled plan'} - ${user.name}`, plans),
            assignedUserName: user.name,
            completedExercises: existingAssignment.completedExercises ?? {},
            exercises: existingAssignment.exercises.length > 0 ? existingAssignment.exercises.map((exercise) => ({ ...exercise })) : basePlan.exercises.map((exercise) => ({ ...exercise })),
          })
          return
        }

        nextAssignments.push(createAssignmentCopy(basePlan, user, plans))
      })

      return [...current.filter((assignment) => assignment.planId !== planId), ...nextAssignments]
    })
  }

  const updateAssignment = (assignmentId: string, planName: string, exerciseIds?: string[]) => {
    const trimmedName = planName.trim()

    if (!trimmedName) {
      return
    }

    const selectedExercises = buildPlanItems(exerciseIds)

    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.id !== assignmentId) {
          return assignment
        }

        return {
          ...assignment,
          planName: trimmedName,
          planSlug: buildPlanSlug(trimmedName, plans),
          exercises: selectedExercises,
        }
      }),
    )
  }

  const updatePlanExercise = (planId: string, exerciseId: string, value: string) => {
    setAssignments((current) =>
      current.map((assignment) => {
        if (assignment.planId !== planId) {
          return assignment
        }

        return {
          ...assignment,
          completedExercises: { ...(assignment.completedExercises ?? {}), [exerciseId]: value },
        }
      }),
    )
  }

  const deletePlan = (planId: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId))
    setAssignments((current) => current.filter((assignment) => assignment.planId !== planId))
  }

  const deleteAssignment = (assignmentId: string) => {
    setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId))
  }

  const createUser = (name: string, role: UserRole = 'client') => {
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
      role,
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
    setAssignments((current) => current.filter((assignment) => assignment.assignedUserId !== trimmedUserId))
  }

  const value = useMemo<PlanContextValue>(
    () => ({
      plans,
      assignments,
      users,
      createPlan,
      createPlanForPeople,
      updatePlan,
      assignUsersToPlan,
      updateAssignment,
      updatePlanExercise,
      deletePlan,
      deleteAssignment,
      createUser,
      deleteUser,
    }),
    [plans, assignments, users],
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
