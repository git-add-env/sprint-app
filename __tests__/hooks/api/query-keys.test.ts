import { describe, it, expect } from "vitest"

import { queryKeys } from "@/hooks/api/query-keys"

describe("queryKeys.meetings.detail", () => {
  it("returns a tuple with meetings, meetingId, and detail", () => {
    const key = queryKeys.meetings.detail(1)
    expect(key).toEqual(["meetings", 1, "detail"])
  })

  it("includes the given meetingId in the key", () => {
    const key = queryKeys.meetings.detail(42)
    expect(key[1]).toBe(42)
  })

  it("produces distinct keys for different meeting IDs", () => {
    const key1 = queryKeys.meetings.detail(1)
    const key2 = queryKeys.meetings.detail(2)
    expect(key1).not.toEqual(key2)
  })

  it("is a readonly tuple (const assertion)", () => {
    const key = queryKeys.meetings.detail(99)
    // Type-level check: the returned array should have exactly 3 elements
    expect(key).toHaveLength(3)
    expect(key[0]).toBe("meetings")
    expect(key[2]).toBe("detail")
  })

  it("handles large meeting IDs", () => {
    const key = queryKeys.meetings.detail(Number.MAX_SAFE_INTEGER)
    expect(key).toEqual(["meetings", Number.MAX_SAFE_INTEGER, "detail"])
  })
})

describe("queryKeys.meetings.members (pre-existing, used in PR)", () => {
  it("returns a tuple with meetings, meetingId, and members", () => {
    const key = queryKeys.meetings.members(1)
    expect(key).toEqual(["meetings", 1, "members"])
  })

  it("includes the given meetingId in the key", () => {
    const key = queryKeys.meetings.members(7)
    expect(key[1]).toBe(7)
  })

  it("produces distinct keys for different meeting IDs", () => {
    const key1 = queryKeys.meetings.members(10)
    const key2 = queryKeys.meetings.members(20)
    expect(key1).not.toEqual(key2)
  })
})

describe("queryKeys.meetings.detail and members key shapes are distinct", () => {
  it("detail and members keys for same meeting ID are different", () => {
    const detailKey = queryKeys.meetings.detail(5)
    const membersKey = queryKeys.meetings.members(5)
    expect(detailKey).not.toEqual(membersKey)
    expect(detailKey[2]).toBe("detail")
    expect(membersKey[2]).toBe("members")
  })
})