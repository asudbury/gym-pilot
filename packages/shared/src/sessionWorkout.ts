import type { UserSessionWorkoutItem } from "./dataServices/types";

export type SessionWorkoutCategory =
  "exercise" | "warm_up" | "stretch" | "cool_down" | "run" | "spin";

export type SessionWorkoutMetadata = {
  workoutItems: UserSessionWorkoutItem[];
  endedAt?: string | null;
  activeKwh?: string | null;
  selectedPlanId?: string | null;
  selectedPlanName?: string | null;
};

export function normalizeSessionWorkoutCategory(
  value: string | null | undefined,
): SessionWorkoutCategory {
  const normalizedValue = value?.trim().toLowerCase();

  switch (normalizedValue) {
    case "warm_up":
    case "warmup":
      return "warm_up";
    case "stretch":
      return "stretch";
    case "cool_down":
    case "cooldown":
      return "cool_down";
    case "run":
      return "run";
    case "spin":
      return "spin";
    default:
      return "exercise";
  }
}
