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
  // Assuming these are the '... 5 more ...' properties, adjust as per your actual data structure
  difficulty?: string // Example additional property
  type?: string // Example additional property
  force?: string // Example additional property
  mechanic?: string // Example additional property
  attributions?: string[] // Example additional property, assuming it might be an array
  attribution: string
}
