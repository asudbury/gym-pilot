import { describe, expect, it } from "vitest";
import { buildWorkoutItemsPersistencePayloads } from "./sessionWorkoutPersistence";

describe("session workout persistence payloads", () => {
  it("assigns unique item positions for each workout item payload", () => {
    const payloads = buildWorkoutItemsPersistencePayloads({
      sessionId: "session-1",
      userId: "user-1",
      workoutItems: [
        { id: "item-1", category: "exercise", exerciseName: "Squat" } as any,
        { id: "item-2", category: "exercise", exerciseName: "Run" } as any,
      ],
    });

    expect(payloads.map((payload) => payload.item_index)).toEqual([
      1000000, 1000001,
    ]);
    expect(new Set(payloads.map((payload) => payload.id)).size).toBe(2);
  });

  it("persists workout items in the order defined by their sort order values", () => {
    const payloads = buildWorkoutItemsPersistencePayloads({
      sessionId: "session-1",
      userId: "user-1",
      workoutItems: [
        {
          id: "item-2",
          category: "exercise",
          exerciseName: "Run",
          sortOrder: 2,
        } as any,
        {
          id: "item-1",
          category: "exercise",
          exerciseName: "Squat",
          sortOrder: 0,
        } as any,
        {
          id: "item-3",
          category: "exercise",
          exerciseName: "Plank",
          sortOrder: 1,
        } as any,
      ],
    });

    expect(payloads.map((payload) => payload.exercise_name)).toEqual([
      "Squat",
      "Plank",
      "Run",
    ]);
    expect(payloads.map((payload) => payload.sort_order)).toEqual([0, 1, 2]);
  });

  it("includes the parent session row id on workout item payloads for cascade deletion", () => {
    const payloads = buildWorkoutItemsPersistencePayloads({
      sessionId: "session-1",
      userId: "user-1",
      parentSessionRowId: "11111111-1111-1111-1111-111111111111",
      workoutItems: [
        { id: "item-1", category: "exercise", exerciseName: "Squat" } as any,
      ],
    });

    expect(payloads[0]).toMatchObject({
      session_row_id: "11111111-1111-1111-1111-111111111111",
    });
  });
});
