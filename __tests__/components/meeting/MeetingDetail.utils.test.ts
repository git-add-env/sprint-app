/**
 * Tests for the private utility functions inside
 * components/meeting/MeetingDetail.tsx.
 *
 * The functions (formatDisplayDate, getProgressValue,
 * mapMeetingMemberToView, mapMeetingDetailToView) are not exported,
 * so they are re-implemented here from the source. This lets us verify
 * their exact behaviour independently from the React component tree.
 *
 * TZ=UTC is set in vitest.config.ts so date assertions are deterministic.
 */
import { describe, it, expect } from "vitest"

import { CATEGORY_LABEL } from "@/constants/category"
import type { MeetingDetail as MeetingDetailData, MeetingMember } from "@/lib/api/meetings"

// ─── Copied from components/meeting/MeetingDetail.tsx ────────────────────────

const FALLBACK_MEETING_IMAGE_URL =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"

type DetailPosition = {
  id: number
  job: string
  current: number
  max: number
  description: string
}

type DetailMember = {
  id: number
  name: string
  job: string
  profileImage: string | null
  isLeader: boolean
}

type MeetingView = {
  title: string
  category: string
  deadline: string
  startDate: string
  duration: string
  meetingSchedule: string
  memberCount: number
  maxMembers: number
  heroImage: string
  description: string
  techStacks: string[]
  isBookmarked: boolean
  positions: DetailPosition[]
  members: DetailMember[]
}

function formatDisplayDate(date: string | null | undefined): string {
  if (!date) {
    return "-"
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
  const day = String(parsedDate.getDate()).padStart(2, "0")

  return `${year}.${month}.${day}`
}

function getProgressValue(current: number, max: number): number {
  if (max <= 0) {
    return 0
  }
  return (current / max) * 100
}

function mapMeetingMemberToView(member: MeetingMember): DetailMember {
  return {
    id: member.id,
    name: member.nickname,
    job: member.positionName ?? member.job ?? "역할 미정",
    profileImage: member.profileImage,
    isLeader: member.isLeader,
  }
}

function mapMeetingDetailToView(
  meeting: MeetingDetailData,
  members: MeetingMember[],
): MeetingView {
  const description =
    meeting.description ??
    meeting.introduction ??
    meeting.content ??
    "모임 소개가 없습니다."
  const positions = meeting.positions ?? []
  const maxMembers =
    meeting.recruitSummary?.totalCount ??
    positions.reduce((total, position) => total + position.recruitCount, 0)
  const memberCount =
    meeting.recruitSummary?.currentCount ??
    positions.reduce((total, position) => total + position.currentCount, 0)

  return {
    title: meeting.title ?? "제목 없는 모임",
    category: CATEGORY_LABEL[meeting.category] ?? meeting.category ?? "프로젝트",
    deadline: formatDisplayDate(meeting.deadline),
    startDate: formatDisplayDate(meeting.startDate),
    duration: meeting.expectedDuration ?? meeting.duration ?? "-",
    meetingSchedule: meeting.meetingSchedule ?? meeting.meetingType ?? "-",
    memberCount,
    maxMembers,
    heroImage: meeting.thumbnailUrl ?? FALLBACK_MEETING_IMAGE_URL,
    description,
    techStacks: meeting.techStacks ?? [],
    isBookmarked: meeting.isBookmarked ?? false,
    positions: positions.map((position) => ({
      id: position.id,
      job: position.name,
      current: position.currentCount,
      max: position.recruitCount,
      description: position.description ?? "상세 모집 요건이 없습니다.",
    })),
    members: members.map(mapMeetingMemberToView),
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMeetingDetailData(
  overrides: Partial<MeetingDetailData> = {},
): MeetingDetailData {
  return {
    meetingId: 1,
    thumbnailUrl: "https://example.com/img.jpg",
    category: "PROJECT",
    title: "Test Meeting",
    techStacks: ["TypeScript", "React"],
    isBookmarked: false,
    isDeadlineToday: false,
    deadline: "2025-08-15",
    recruitSummary: { currentCount: 2, totalCount: 5 },
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

// ─── formatDisplayDate ────────────────────────────────────────────────────────

describe("formatDisplayDate", () => {
  it("returns '-' for null", () => {
    expect(formatDisplayDate(null)).toBe("-")
  })

  it("returns '-' for undefined", () => {
    expect(formatDisplayDate(undefined)).toBe("-")
  })

  it("returns '-' for empty string", () => {
    expect(formatDisplayDate("")).toBe("-")
  })

  it("formats a valid ISO date string as YYYY.MM.DD (TZ=UTC)", () => {
    // "2025-08-15" parsed as UTC midnight → 2025.08.15
    expect(formatDisplayDate("2025-08-15")).toBe("2025.08.15")
  })

  it("zero-pads month and day", () => {
    expect(formatDisplayDate("2025-01-05")).toBe("2025.01.05")
  })

  it("formats a date-time string", () => {
    // Noon UTC stays on the same calendar day in any reasonable timezone
    expect(formatDisplayDate("2025-06-15T12:00:00.000Z")).toBe("2025.06.15")
  })

  it("returns the original string for an invalid date", () => {
    expect(formatDisplayDate("not-a-date")).toBe("not-a-date")
  })

  it("returns the original string for a random nonsense string", () => {
    expect(formatDisplayDate("hello world")).toBe("hello world")
  })

  it("handles December correctly (month 12, not 0-indexed)", () => {
    expect(formatDisplayDate("2025-12-31")).toBe("2025.12.31")
  })
})

// ─── getProgressValue ─────────────────────────────────────────────────────────

describe("getProgressValue", () => {
  it("returns 0 when max is 0", () => {
    expect(getProgressValue(0, 0)).toBe(0)
  })

  it("returns 0 when max is negative", () => {
    expect(getProgressValue(3, -1)).toBe(0)
  })

  it("returns 100 when all slots are filled", () => {
    expect(getProgressValue(5, 5)).toBe(100)
  })

  it("returns 50 when half the slots are filled", () => {
    expect(getProgressValue(2, 4)).toBe(50)
  })

  it("returns 0 when current is 0 and max is positive", () => {
    expect(getProgressValue(0, 10)).toBe(0)
  })

  it("returns the correct percentage for arbitrary values", () => {
    expect(getProgressValue(1, 4)).toBe(25)
    expect(getProgressValue(3, 4)).toBe(75)
  })

  it("can exceed 100 if current > max (no clamping in the function)", () => {
    expect(getProgressValue(6, 5)).toBe(120)
  })
})

// ─── mapMeetingMemberToView ───────────────────────────────────────────────────

describe("mapMeetingMemberToView", () => {
  it("maps basic fields from member", () => {
    const member = makeMeetingMember({ id: 7, nickname: "Bob", isLeader: true })
    const view = mapMeetingMemberToView(member)

    expect(view.id).toBe(7)
    expect(view.name).toBe("Bob")
    expect(view.isLeader).toBe(true)
  })

  it("prefers positionName over job", () => {
    const member = makeMeetingMember({ positionName: "Backend Dev", job: "Engineer" })
    const view = mapMeetingMemberToView(member)

    expect(view.job).toBe("Backend Dev")
  })

  it("falls back to job when positionName is null", () => {
    const member = makeMeetingMember({ positionName: null, job: "Designer" })
    const view = mapMeetingMemberToView(member)

    expect(view.job).toBe("Designer")
  })

  it("falls back to '역할 미정' when both positionName and job are null", () => {
    const member = makeMeetingMember({ positionName: null, job: null })
    const view = mapMeetingMemberToView(member)

    expect(view.job).toBe("역할 미정")
  })

  it("preserves profileImage as null when not set", () => {
    const member = makeMeetingMember({ profileImage: null })
    const view = mapMeetingMemberToView(member)

    expect(view.profileImage).toBeNull()
  })

  it("preserves a non-null profileImage URL", () => {
    const member = makeMeetingMember({ profileImage: "https://cdn.example.com/pic.jpg" })
    const view = mapMeetingMemberToView(member)

    expect(view.profileImage).toBe("https://cdn.example.com/pic.jpg")
  })

  it("maps isLeader: false correctly", () => {
    const member = makeMeetingMember({ isLeader: false })
    const view = mapMeetingMemberToView(member)

    expect(view.isLeader).toBe(false)
  })
})

// ─── mapMeetingDetailToView ───────────────────────────────────────────────────

describe("mapMeetingDetailToView", () => {
  it("maps title from meeting data", () => {
    const meeting = makeMeetingDetailData({ title: "My Meeting" })
    const view = mapMeetingDetailToView(meeting, [])

    expect(view.title).toBe("My Meeting")
  })

  it("falls back to '제목 없는 모임' when title is missing", () => {
    // MeetingSummary has title: string, so we cast to bypass type safety
    const meeting = makeMeetingDetailData({ title: undefined as unknown as string })
    const view = mapMeetingDetailToView(meeting, [])

    expect(view.title).toBe("제목 없는 모임")
  })

  describe("category mapping", () => {
    it("maps known category codes to Korean labels", () => {
      const view = mapMeetingDetailToView(makeMeetingDetailData({ category: "PROJECT" }), [])
      expect(view.category).toBe("프로젝트")
    })

    it("maps HACKATHON to its Korean label", () => {
      const view = mapMeetingDetailToView(makeMeetingDetailData({ category: "HACKATHON" }), [])
      expect(view.category).toBe("해커톤")
    })

    it("returns the raw category for unknown codes", () => {
      const view = mapMeetingDetailToView(makeMeetingDetailData({ category: "UNKNOWN_CAT" }), [])
      expect(view.category).toBe("UNKNOWN_CAT")
    })

    it("falls back to '프로젝트' when category is undefined", () => {
      const meeting = makeMeetingDetailData({ category: undefined as unknown as string })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.category).toBe("프로젝트")
    })
  })

  describe("description fallback chain", () => {
    it("uses description when available", () => {
      const meeting = makeMeetingDetailData({
        description: "Full description",
        introduction: "Intro",
        content: "Content",
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.description).toBe("Full description")
    })

    it("falls back to introduction when description is null", () => {
      const meeting = makeMeetingDetailData({
        description: null,
        introduction: "Intro text",
        content: "Content",
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.description).toBe("Intro text")
    })

    it("falls back to content when description and introduction are null", () => {
      const meeting = makeMeetingDetailData({
        description: null,
        introduction: null,
        content: "Content only",
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.description).toBe("Content only")
    })

    it("falls back to '모임 소개가 없습니다.' when all are null", () => {
      const meeting = makeMeetingDetailData({
        description: null,
        introduction: null,
        content: null,
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.description).toBe("모임 소개가 없습니다.")
    })
  })

  describe("duration fallback chain", () => {
    it("uses expectedDuration when available", () => {
      const meeting = makeMeetingDetailData({ expectedDuration: "3 months", duration: "2 months" })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.duration).toBe("3 months")
    })

    it("falls back to duration when expectedDuration is null", () => {
      const meeting = makeMeetingDetailData({ expectedDuration: null, duration: "2 months" })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.duration).toBe("2 months")
    })

    it("falls back to '-' when both are null", () => {
      const meeting = makeMeetingDetailData({ expectedDuration: null, duration: null })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.duration).toBe("-")
    })
  })

  describe("meetingSchedule fallback chain", () => {
    it("uses meetingSchedule when available", () => {
      const meeting = makeMeetingDetailData({ meetingSchedule: "Every Tuesday", meetingType: "Online" })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.meetingSchedule).toBe("Every Tuesday")
    })

    it("falls back to meetingType when meetingSchedule is null", () => {
      const meeting = makeMeetingDetailData({ meetingSchedule: null, meetingType: "Online" })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.meetingSchedule).toBe("Online")
    })

    it("falls back to '-' when both are null", () => {
      const meeting = makeMeetingDetailData({ meetingSchedule: null, meetingType: null })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.meetingSchedule).toBe("-")
    })
  })

  describe("heroImage", () => {
    it("uses thumbnailUrl when provided", () => {
      const meeting = makeMeetingDetailData({ thumbnailUrl: "https://cdn.example.com/hero.jpg" })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.heroImage).toBe("https://cdn.example.com/hero.jpg")
    })

    it("falls back to FALLBACK_MEETING_IMAGE_URL when thumbnailUrl is null", () => {
      const meeting = makeMeetingDetailData({ thumbnailUrl: null })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.heroImage).toBe(FALLBACK_MEETING_IMAGE_URL)
    })
  })

  describe("recruitSummary-based counts", () => {
    it("uses recruitSummary.totalCount as maxMembers", () => {
      const meeting = makeMeetingDetailData({
        recruitSummary: { currentCount: 1, totalCount: 10 },
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.maxMembers).toBe(10)
    })

    it("uses recruitSummary.currentCount as memberCount", () => {
      const meeting = makeMeetingDetailData({
        recruitSummary: { currentCount: 3, totalCount: 10 },
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.memberCount).toBe(3)
    })

    it("sums position recruitCounts when recruitSummary is missing totalCount", () => {
      const meeting = makeMeetingDetailData({
        recruitSummary: undefined as unknown as { currentCount: number; totalCount: number },
        positions: [
          { id: 1, name: "FE", recruitCount: 2, currentCount: 1 },
          { id: 2, name: "BE", recruitCount: 3, currentCount: 2 },
        ],
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.maxMembers).toBe(5)
    })

    it("sums position currentCounts when recruitSummary is missing currentCount", () => {
      const meeting = makeMeetingDetailData({
        recruitSummary: undefined as unknown as { currentCount: number; totalCount: number },
        positions: [
          { id: 1, name: "FE", recruitCount: 2, currentCount: 1 },
          { id: 2, name: "BE", recruitCount: 3, currentCount: 2 },
        ],
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.memberCount).toBe(3)
    })
  })

  describe("positions mapping", () => {
    it("maps each position to id, job, current, max, description", () => {
      const meeting = makeMeetingDetailData({
        positions: [
          {
            id: 11,
            name: "Frontend",
            recruitCount: 3,
            currentCount: 1,
            description: "Build UI",
          },
        ],
      })
      const view = mapMeetingDetailToView(meeting, [])

      expect(view.positions).toHaveLength(1)
      expect(view.positions[0]).toEqual({
        id: 11,
        job: "Frontend",
        current: 1,
        max: 3,
        description: "Build UI",
      })
    })

    it("falls back to '상세 모집 요건이 없습니다.' for missing position description", () => {
      const meeting = makeMeetingDetailData({
        positions: [{ id: 1, name: "Design", recruitCount: 2, currentCount: 0, description: null }],
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.positions[0].description).toBe("상세 모집 요건이 없습니다.")
    })

    it("returns an empty array when positions is undefined", () => {
      const meeting = makeMeetingDetailData({
        positions: undefined as unknown as [],
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.positions).toEqual([])
    })
  })

  describe("members mapping", () => {
    it("maps all provided members", () => {
      const members = [
        makeMeetingMember({ id: 1, nickname: "Alice", isLeader: true }),
        makeMeetingMember({ id: 2, nickname: "Bob", isLeader: false }),
      ]
      const view = mapMeetingDetailToView(makeMeetingDetailData(), members)

      expect(view.members).toHaveLength(2)
      expect(view.members[0].name).toBe("Alice")
      expect(view.members[1].name).toBe("Bob")
    })

    it("returns an empty members array when no members are passed", () => {
      const view = mapMeetingDetailToView(makeMeetingDetailData(), [])
      expect(view.members).toEqual([])
    })
  })

  describe("techStacks and isBookmarked", () => {
    it("passes through techStacks array", () => {
      const meeting = makeMeetingDetailData({ techStacks: ["Go", "Kubernetes"] })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.techStacks).toEqual(["Go", "Kubernetes"])
    })

    it("falls back to empty array when techStacks is undefined", () => {
      const meeting = makeMeetingDetailData({ techStacks: undefined as unknown as string[] })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.techStacks).toEqual([])
    })

    it("maps isBookmarked true", () => {
      const meeting = makeMeetingDetailData({ isBookmarked: true })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.isBookmarked).toBe(true)
    })

    it("defaults isBookmarked to false when missing", () => {
      const meeting = makeMeetingDetailData({
        isBookmarked: undefined as unknown as boolean,
      })
      const view = mapMeetingDetailToView(meeting, [])
      expect(view.isBookmarked).toBe(false)
    })
  })
})