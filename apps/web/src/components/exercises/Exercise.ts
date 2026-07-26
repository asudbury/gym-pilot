export interface Exercise {
  id: string
  name: string
  category: string
  body_part: string
  equipment: string
  instructions: { en: string }
  instruction_steps: { en: string[] }
  muscle_group: string
  secondary_muscles: string[]
  difficulty?: string
  type?: string
  force?: string
  mechanic?: string
  attributions?: string[]
  attribution: string
}
