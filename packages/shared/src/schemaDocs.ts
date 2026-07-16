export const dataSchemaDocs = {
  exercises: {
    description: 'Browsable exercise catalogue entries',
    type: 'Exercise',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'category', type: 'string', required: true },
      { name: 'body_part', type: 'string', required: true },
      { name: 'equipment', type: 'string', required: true },
      { name: 'instructions', type: '{ en: string }', required: true },
      { name: 'instruction_steps', type: '{ en: string[] }', required: true },
      { name: 'muscle_group', type: 'string', required: true },
      { name: 'secondary_muscles', type: 'string[]', required: true },
      { name: 'target', type: 'string', required: true },
      { name: 'image', type: 'string', required: true },
      { name: 'gif_url', type: 'string', required: true },
      { name: 'media_id', type: 'string', required: true },
      { name: 'created_at', type: 'string', required: true },
      { name: 'attribution', type: 'string', required: true },
    ],
  },
  plans: {
    description: 'Base training plans used as templates',
    type: 'Plan',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'planName', type: 'string', required: true },
      { name: 'planSlug', type: 'string', required: true },
      { name: 'exercises', type: 'PlanItem[]', required: true },
    ],
  },
  assignments: {
    description: 'User-specific assignment copies that reference a plan and own completion state',
    type: 'Assignment',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'planId', type: 'string', required: true },
      { name: 'planName', type: 'string', required: true },
      { name: 'planSlug', type: 'string', required: true },
      { name: 'assignedUserId', type: 'string | undefined', required: false },
      { name: 'assignedUserName', type: 'string | undefined', required: false },
      { name: 'completedExercises', type: 'Record<string, string>', required: false },
      { name: 'exercises', type: 'PlanItem[]', required: true },
    ],
  },
  users: {
    description: 'People who can own or be assigned to plans',
    type: 'User',
    fields: [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'slug', type: 'string', required: true },
      { name: 'role', type: 'admin | trainer | client | guest', required: true },
    ],
  },
} as const

export const dataSchemaSummary = [
  {
    entity: 'Exercise',
    purpose: 'Stores the public exercise catalogue used by the home and exercise detail views.',
  },
  {
    entity: 'Plan',
    purpose: 'Stores trainer-created base plans used as templates.',
  },
  {
    entity: 'Assignment',
    purpose: 'Stores user-specific assignment copies that reference a plan and own completion state.',
  },
  {
    entity: 'User roles',
    purpose: 'Stores people who can be assigned to plans and given roles.',
  },
] as const
