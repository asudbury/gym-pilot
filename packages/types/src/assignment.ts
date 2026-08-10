import type { Tables } from "../../shared/src/dataServices/databaseTypes";
import type { PlanSession } from "./plan";

export type Assignment = Partial<
  Omit<Tables<"workout_assignment">, "created_at" | "updated_at">
> & {
  id: string;
  assignmentName: string;
  planId: string;
  planName?: string;
  planSessions?: PlanSession[];
  assignedUserId?: string;
  allocatedByUserId?: string;
  assignedUserName?: string;
  description?: string;
  goal?: string;
  notes?: string;
  completedExercises?: Record<string, string>;
};
