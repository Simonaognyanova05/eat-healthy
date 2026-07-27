import { describe, expect, it } from "vitest";
import {
  MONTHLY_IMAGE_LIMITS,
  effectivePlan,
  recognitionPeriod,
  usageSnapshot
} from "../src/services/entitlementService.js";

describe("recognition entitlement policy", () => {
  const now = new Date("2026-07-25T21:30:00.000Z");

  it("uses a stable UTC monthly period", () => {
    const period = recognitionPeriod(now);
    expect(period.periodStart.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(period.periodEnd.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("limits free users to fifty images", () => {
    const snapshot = usageSnapshot({ plan: "free" }, MONTHLY_IMAGE_LIMITS.free, now);
    expect(snapshot).toMatchObject({ plan: "free", limit: 50, used: 50, remaining: 0 });
  });

  it("fails closed when a Pro subscription is expired", () => {
    expect(effectivePlan({ plan: "pro", planStatus: "active", planExpiresAt: "2026-07-25T20:00:00.000Z" }, now)).toBe("free");
  });

  it("applies the published Pro monthly quota", () => {
    const snapshot = usageSnapshot({ plan: "pro", planStatus: "active", planExpiresAt: "2026-08-25T00:00:00.000Z" }, 12, now);
    expect(snapshot).toMatchObject({ plan: "pro", limit: 1000, remaining: 988, used: 12 });
  });

  it("supports the Starter tier", () => {
    const snapshot = usageSnapshot({ plan: "starter", planStatus: "active", planExpiresAt: "2026-08-25T00:00:00.000Z" }, 20, now);
    expect(snapshot).toMatchObject({ plan: "starter", limit: 200, remaining: 180 });
  });
});
