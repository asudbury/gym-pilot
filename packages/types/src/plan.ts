import type { Tables } from "../../shared/src/dataServices/databaseTypes";

export type PlanItem = Partial<
  Omit<Tables<"workout_plan_exercise">, "created_at" | "updated_at">
> & {
  id: string;
  exercise_id: string;
  exercise_name?: string;
  name?: string;
  reps?: string;
  workingSets?: string;
  notes?: string;
  weight?: string;
  goal?: string;
  link_label?: string;
  link_url?: string;
};

export type PlanSession = Partial<
  Omit<Tables<"workout_plan_session">, "created_at" | "updated_at">
> & {
  id: string;
  title?: string;
  name?: string;
  planItems: PlanItem[];
  goal?: string;
  notes?: string;
};

export type Plan = Partial<
  Omit<Tables<"workout_plan">, "created_at" | "updated_at">
> & {
  id: string;
  planName: string;
  planSessions: PlanSession[];
  createdByUserId?: string;
};
