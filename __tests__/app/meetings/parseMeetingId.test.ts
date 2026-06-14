/**
 * Tests for the parseMeetingId helper function logic.
 *
 * The function appears in two page files with slightly different signatures:
 *
 *  1. app/meetings/[meetingId]/page.tsx  — accepts `string` (route param)
 *  2. app/meetings/detail/page.tsx       — accepts `string | undefined` (query param)
 *
 * Both are private (unexported) helpers; their logic is validated here
 * by re-implementing the identical code under test.
 */
import { describe, it, expect } from "vitest"

// ── Implementation from app/meetings/[meetingId]/page.tsx ────────────────────
// function parseMeetingId(value: string) {
//   const meetingId = Number(value)
//   return Number.isFinite(meetingId) ? meetingId : undefined
// }
function parseMeetingIdFromRoute(value: string): number | undefined {
  const meetingId = Number(value)
  return Number.isFinite(meetingId) ? meetingId : undefined
}

// ── Implementation from app/meetings/detail/page.tsx ────────────────────────
// function parseMeetingId(value: string | undefined) {
//   if (!value) { return undefined }
//   const meetingId = Number(value)
//   return Number.isFinite(meetingId) ? meetingId : undefined
// }
function parseMeetingIdFromQuery(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const meetingId = Number(value)
  return Number.isFinite(meetingId) ? meetingId : undefined
}

// ──────────────────────────────────────────────────────────────────────────────

describe("parseMeetingId (route param – app/meetings/[meetingId]/page.tsx)", () => {
  it("returns a number for a valid integer string", () => {
    expect(parseMeetingIdFromRoute("42")).toBe(42)
  })

  it("returns a number for a string '1'", () => {
    expect(parseMeetingIdFromRoute("1")).toBe(1)
  })

  it("returns a number for a large integer string", () => {
    expect(parseMeetingIdFromRoute("99999")).toBe(99999)
  })

  it("returns a number for a float string", () => {
    // Number("1.5") = 1.5, which IS finite
    expect(parseMeetingIdFromRoute("1.5")).toBe(1.5)
  })

  it("returns a number for a negative string", () => {
    expect(parseMeetingIdFromRoute("-5")).toBe(-5)
  })

  it("returns 0 for an empty string (Number('') === 0)", () => {
    // This is a subtle edge: route params won't be empty, but the function
    // does NOT guard against it — Number("") === 0, which is finite.
    expect(parseMeetingIdFromRoute("")).toBe(0)
  })

  it("returns undefined for a non-numeric string", () => {
    expect(parseMeetingIdFromRoute("abc")).toBeUndefined()
  })

  it("returns undefined for 'NaN' string", () => {
    expect(parseMeetingIdFromRoute("NaN")).toBeUndefined()
  })

  it("returns undefined for 'Infinity' string", () => {
    // Number("Infinity") = Infinity, which is NOT finite
    expect(parseMeetingIdFromRoute("Infinity")).toBeUndefined()
  })

  it("returns undefined for '-Infinity' string", () => {
    expect(parseMeetingIdFromRoute("-Infinity")).toBeUndefined()
  })

  it("returns undefined for an alphanumeric string", () => {
    expect(parseMeetingIdFromRoute("12abc")).toBeUndefined()
  })
})

describe("parseMeetingId (query param – app/meetings/detail/page.tsx)", () => {
  it("returns a number for a valid integer string", () => {
    expect(parseMeetingIdFromQuery("42")).toBe(42)
  })

  it("returns a number for a string '1'", () => {
    expect(parseMeetingIdFromQuery("1")).toBe(1)
  })

  it("returns a number for a large integer string", () => {
    expect(parseMeetingIdFromQuery("99999")).toBe(99999)
  })

  it("returns a number for a negative string", () => {
    expect(parseMeetingIdFromQuery("-5")).toBe(-5)
  })

  it("returns undefined for undefined input", () => {
    expect(parseMeetingIdFromQuery(undefined)).toBeUndefined()
  })

  it("returns undefined for an empty string (falsy guard fires first)", () => {
    // Unlike the route variant, the query variant returns undefined for ""
    expect(parseMeetingIdFromQuery("")).toBeUndefined()
  })

  it("returns undefined for a non-numeric string", () => {
    expect(parseMeetingIdFromQuery("abc")).toBeUndefined()
  })

  it("returns undefined for 'NaN' string", () => {
    expect(parseMeetingIdFromQuery("NaN")).toBeUndefined()
  })

  it("returns undefined for 'Infinity' string", () => {
    expect(parseMeetingIdFromQuery("Infinity")).toBeUndefined()
  })

  it("returns undefined for '-Infinity' string", () => {
    expect(parseMeetingIdFromQuery("-Infinity")).toBeUndefined()
  })

  it("returns undefined for an alphanumeric string", () => {
    expect(parseMeetingIdFromQuery("12abc")).toBeUndefined()
  })
})

describe("behavioral difference between route and query variants", () => {
  it("empty string: route variant returns 0, query variant returns undefined", () => {
    expect(parseMeetingIdFromRoute("")).toBe(0)
    expect(parseMeetingIdFromQuery("")).toBeUndefined()
  })

  it("both return undefined for non-numeric strings", () => {
    expect(parseMeetingIdFromRoute("xyz")).toBeUndefined()
    expect(parseMeetingIdFromQuery("xyz")).toBeUndefined()
  })

  it("both return the same number for valid integer strings", () => {
    expect(parseMeetingIdFromRoute("7")).toBe(parseMeetingIdFromQuery("7"))
  })
})