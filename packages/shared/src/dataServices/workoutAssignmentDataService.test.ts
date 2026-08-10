import { describe, expect, it } from "vitest";
import { buildWorkoutAssignmentCopyPayload } from "./workoutAssignmentDataService";

describe("buildWorkoutAssignmentCopyPayload", () => {
  it("creates structured assignment, session, and exercise rows without JSON payloads", () => {
    const payload = buildWorkoutAssignmentCopyPayload({
      plan: {
        id: "plan-1",
        plan_name: "Strength plan",
        plan_sessions: [
          {
            id: "session-1",
            name: "Day 1",
            position: 1,
            exercises: [
              {
                id: "exercise-1",
                exercise_id: "bench-press",
                exercise_name: "Bench press",
                position: 1,
                reps: "3x10",
                weight: "60kg",
                notes: "Focus on form",
                goal: "Build strength",
              },
            ],
          },
        ],
      },
      assignmentName: "Strength plan - Alex",
      creatorUserId: "trainer-1",
      assigneeUserId: "client-1",
      allocatedByUserId: "trainer-1",
      description: "Assigned from trainer",
      goal: "Increase strength",
      notes: "Keep a steady pace",
    });

    expect(payload.assignment.assignment_name).toBe("Strength plan - Alex");
    expect(payload.assignment.user_id).toBe("trainer-1");
    expect(payload.assignment.assigned_to_user_id).toBe("client-1");
    expect(payload.assignment.allocated_by_user_id).toBe("trainer-1");
    expect(payload.assignment.description).toBe("Assigned from trainer");
    expect(payload.assignment.goal).toBe("Increase strength");
    expect(payload.assignment.notes).toBe("Keep a steady pace");

    expect(payload.sessions).toHaveLength(1);
    expect(payload.sessions[0]).toMatchObject({
      name: "Day 1",
      position: 1,
      goal: "Increase strength",
    });

    expect(payload.exercises).toHaveLength(1);
    expect(payload.exercises[0]).toMatchObject({
      exercise_id: "bench-press",
      exercise_name: "Bench press",
      reps: "3x10",
      weight: "60kg",
      notes: "Focus on form",
      goal: "Build strength",
    });
  });
});
