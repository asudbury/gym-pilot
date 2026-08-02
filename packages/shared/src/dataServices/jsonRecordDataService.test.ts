import { describe, expect, it } from "vitest";
import { normalizeFavoriteStorageValue } from "./jsonRecordDataService";
import {
  buildSessionBookingSessionPayload,
  normalizeSessionTypeForPersistence,
} from "./sessionDataService";

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
});
