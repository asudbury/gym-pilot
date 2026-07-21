import { z } from "zod";

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.string().min(1),
  body_part: z.string().min(1),
  equipment: z.string().min(1),
  instructions: z.object({
    en: z.string().min(1),
  }),
  instruction_steps: z.object({
    en: z.array(z.string().min(1)),
  }),
  muscle_group: z.string().min(1),
  secondary_muscles: z.array(z.string().min(1)),
  target: z.string().min(1),
  image: z.string().min(1),
  gif_url: z.string().min(1),
  media_id: z.string().min(1),
  created_at: z.string().datetime({ offset: true }).or(z.string()),
  attribution: z.string().min(1),
});

export const exercisesSchema = z.array(exerciseSchema);

export type Exercise = z.infer<typeof exerciseSchema>;
