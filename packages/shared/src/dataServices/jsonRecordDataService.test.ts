import { describe, expect, it, vi } from "vitest";
import { getSupabaseClient } from "../supabase";
import {
  buildPlanSessionsWithExercises,
  normalizeFavoriteStorageValue,
} from "./jsonRecordDataService";
import {
  buildSessionBookingSessionPayload,
  listSessions,
  normalizeSessionTypeForPersistence,
} from "./sessionDataService";

vi.mock("../supabase", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("json record data helpers", () => {
  it("normalizes favorites payload into favorites and folders", () => {
    const normalized = normalizeFavoriteStorageValue({
      favorites: [{ path: "/foo", label: "Foo", folder: "  Strength  " }],
      folders: ["  A ", "A", "B"],
    });

    expect(normalized.favorites).toEqual([
      { path: "/foo", label: "Foo", folder: "Strength" },
    ]);
    expect(normalized.folders).toEqual(["A", "B"]);
  });

  it("attaches plan exercises to the first session when the schema no longer exposes session ids", () => {
    const sessions = [
      {
        id: "session-1",
        name: "Day 1",
        plan_id: "plan-1",
        position: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        planItems: [],
      },
    ];

    const exercises = [
      {
        id: "exercise-1",
        plan_id: "plan-1",
        exercise_id: "bench-press",
        exercise_name: "Bench Press",
        position: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const result = buildPlanSessionsWithExercises(
      sessions as any,
      exercises as any,
    );

    expect(result[0].planItems).toEqual(exercises);
  });
});

describe("session data helpers", () => {
  it("normalizes unsupported session types to solo", () => {
    expect(normalizeSessionTypeForPersistence("workshop")).toBe("solo");
  });

  it("builds a session booking payload with a default trainer role", () => {
    const payload = buildSessionBookingSessionPayload({
      userId: "user-1",
      sessionId: "session-1",
      attendanceType: "attended",
      status: "booked",
    });

    expect(payload.session_id).toBe("session-1");
    expect(payload.role).toBe("client");
    expect(payload.session_type).toBe("solo");
  });

  it("normalizes day filters to the start and end of the day", async () => {
    const from = "2026-08-02";
    const to = "2026-08-02";
    const gte = vi.fn().mockImplementation(function (this: unknown) {
      return this;
    });
    const lte = vi.fn().mockImplementation(function (this: unknown) {
      return this;
    });
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const select = vi.fn().mockImplementation(function (this: unknown) {
      return this;
    });

    const query = {
      eq: vi.fn().mockImplementation(function (this: unknown) {
        return this;
      }),
      gte,
      lte,
      order,
      select,
    };

    const client = {
      from: vi.fn().mockReturnValue(query),
    };

    vi.mocked(getSupabaseClient).mockReturnValue(client as never);

    await listSessions({ from, to });

    expect(gte).toHaveBeenCalledWith("start_at", "2026-08-02");
    expect(lte).toHaveBeenCalledWith("start_at", "2026-08-03");
  });
});
