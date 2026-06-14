import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

// Mock the apiClient before importing meetings functions
vi.mock("@/lib/api/api-client", () => ({
  apiClient: vi.fn(),
}))

// Import after mock is set up
import { apiClient } from "@/lib/api/api-client"
import {
  fetchMeetingDetail,
  fetchMeetingMembers,
  type MeetingDetail,
  type MeetingMember,
  type MeetingSummary,
} from "@/lib/api/meetings"

const mockApiClient = apiClient as Mock

// Minimal valid MeetingDetail object
function makeMeetingDetail(overrides: Partial<MeetingDetail> = {}): MeetingDetail {
  return {
    meetingId: 1,
    thumbnailUrl: null,
    category: "PROJECT",
    title: "Test Meeting",
    techStacks: [],
    isBookmarked: false,
    isDeadlineToday: false,
    deadline: "2025-12-31",
    recruitSummary: { currentCount: 1, totalCount: 5 },
    positions: [],
    ...overrides,
  }
}

function makeMeetingMember(overrides: Partial<MeetingMember> = {}): MeetingMember {
  return {
    id: 1,
    profileImage: null,
    nickname: "Alice",
    job: "Frontend",
    positionName: "Frontend Developer",
    isLeader: false,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────────────────────
// fetchMeetingDetail
// ──────────────────────────────────────────────────────────────

describe("fetchMeetingDetail", () => {
  describe("direct MeetingDetail response (no wrapper)", () => {
    it("returns the meeting data directly when the response is unwrapped", async () => {
      const detail = makeMeetingDetail({ title: "Direct Response" })
      mockApiClient.mockResolvedValueOnce(detail)

      const result = await fetchMeetingDetail(1)

      expect(result).toEqual(detail)
    })
  })

  describe("wrapped response shapes (unwrapMeetingDetail)", () => {
    it('unwraps { meeting: ... } response shape', async () => {
      const detail = makeMeetingDetail({ title: "Wrapped in meeting" })
      mockApiClient.mockResolvedValueOnce({ meeting: detail })

      const result = await fetchMeetingDetail(1)

      expect(result).toEqual(detail)
    })

    it('unwraps { meetingDetail: ... } response shape', async () => {
      const detail = makeMeetingDetail({ title: "Wrapped in meetingDetail" })
      mockApiClient.mockResolvedValueOnce({ meetingDetail: detail })

      const result = await fetchMeetingDetail(1)

      expect(result).toEqual(detail)
    })

    it('unwraps { detail: ... } response shape', async () => {
      const detail = makeMeetingDetail({ title: "Wrapped in detail" })
      mockApiClient.mockResolvedValueOnce({ detail })

      const result = await fetchMeetingDetail(1)

      expect(result).toEqual(detail)
    })
  })

  describe("calls apiClient with the correct arguments", () => {
    it("calls /api/meetings/{id} without auth", async () => {
      const detail = makeMeetingDetail()
      mockApiClient.mockResolvedValueOnce(detail)

      await fetchMeetingDetail(7)

      expect(mockApiClient).toHaveBeenCalledWith("/api/meetings/7", { auth: false })
    })
  })

  describe("fallback to fetchMeetingSummaryById on error", () => {
    it("returns matching summary from list when primary call fails", async () => {
      const error = new Error("Not Found")
      const summary: MeetingSummary = makeMeetingDetail({
        meetingId: 3,
        title: "Summary Fallback",
      })

      // First call (fetchMeetingDetail /api/meetings/3) throws
      // Second call (fetchMeetings via /api/meetings?...) returns list with our summary
      mockApiClient
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ meetings: [summary], nextCursor: null, hasNext: false })

      const result = await fetchMeetingDetail(3)

      expect(result).toEqual(summary)
    })

    it("re-throws when primary call fails and fallback also finds nothing", async () => {
      const error = new Error("Not Found")

      mockApiClient
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ meetings: [], nextCursor: null, hasNext: false })

      await expect(fetchMeetingDetail(999)).rejects.toThrow("Not Found")
    })

    it("re-throws when primary call fails and the meeting is not in the list", async () => {
      const error = new Error("Server Error")
      const otherSummary: MeetingSummary = makeMeetingDetail({ meetingId: 55 })

      mockApiClient
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          meetings: [otherSummary],
          nextCursor: null,
          hasNext: false,
        })

      await expect(fetchMeetingDetail(99)).rejects.toThrow("Server Error")
    })

    it("calls fetchMeetings with size 100 when falling back", async () => {
      const error = new Error("Fail")
      mockApiClient
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ meetings: [], nextCursor: null, hasNext: false })

      await expect(fetchMeetingDetail(1)).rejects.toThrow()

      // Second call should use size=100 in the URL
      const secondCallPath = mockApiClient.mock.calls[1][0] as string
      expect(secondCallPath).toMatch(/size=100/)
    })
  })
})

// ──────────────────────────────────────────────────────────────
// fetchMeetingMembers
// ──────────────────────────────────────────────────────────────

describe("fetchMeetingMembers", () => {
  it("calls the correct endpoint", async () => {
    const members = [makeMeetingMember()]
    mockApiClient.mockResolvedValueOnce({ members })

    await fetchMeetingMembers(4)

    expect(mockApiClient).toHaveBeenCalledWith("/api/meetings/4/members", undefined)
  })

  it("passes ApiClientOptions through to apiClient", async () => {
    const members = [makeMeetingMember()]
    mockApiClient.mockResolvedValueOnce({ members })

    await fetchMeetingMembers(4, { auth: false })

    expect(mockApiClient).toHaveBeenCalledWith("/api/meetings/4/members", { auth: false })
  })

  it("returns the members array from the response", async () => {
    const member = makeMeetingMember({ nickname: "Bob", isLeader: true })
    mockApiClient.mockResolvedValueOnce({ members: [member] })

    const result = await fetchMeetingMembers(4)

    expect(result).toEqual({ members: [member] })
  })

  it("accepts auth: true option (authenticated request)", async () => {
    mockApiClient.mockResolvedValueOnce({ members: [] })

    await fetchMeetingMembers(10, { auth: true })

    expect(mockApiClient).toHaveBeenCalledWith("/api/meetings/10/members", { auth: true })
  })

  it("handles empty members list", async () => {
    mockApiClient.mockResolvedValueOnce({ members: [] })

    const result = await fetchMeetingMembers(5)

    expect(result).toEqual({ members: [] })
  })

  it("propagates errors from apiClient", async () => {
    mockApiClient.mockRejectedValueOnce(new Error("Unauthorized"))

    await expect(fetchMeetingMembers(1, { auth: true })).rejects.toThrow("Unauthorized")
  })
})