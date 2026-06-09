"use client"

import { useState, type ChangeEvent } from "react"
import { ChevronDown, LoaderCircle, Search } from "lucide-react"

import MeetingCard, { type Meeting } from "@/components/common/MeetingCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MEETINGS: Meeting[] = [
  {
    id: "1",
    title: "AI 기반 개인 맞춤형 일정 관리 서비스",
    date: "2026.07.01",
    deadline: "2026.07.30",
    status: "모집중",
    category: "프로젝트",
    memberCount: 2,
    maxMembers: 6,
    techStacks: ["React", "TypeScript", "Node.js"],
    jobs: [
      { job: "프론트엔드", current: 1, max: 2 },
      { job: "백엔드", current: 0, max: 2 },
      { job: "PM", current: 1, max: 1 },
      { job: "디자이너", current: 0, max: 1 },
    ],
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
  },
  {
    id: "2",
    title: "2026 글로벌 핀테크 챌린지 팀 빌딩",
    date: "2026.06.20",
    deadline: "2026.06.05",
    status: "마감",
    category: "해커톤",
    memberCount: 3,
    maxMembers: 7,
    techStacks: ["Next.js", "Spring Boot", "AWS"],
    jobs: [
      { job: "프론트엔드", current: 2, max: 3 },
      { job: "백엔드", current: 1, max: 3 },
      { job: "PM", current: 0, max: 1 },
    ],
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
    isClosingToday: true,
  },
  {
    id: "3",
    title: "공공 데이터 활용 창업 경진대회",
    date: "2026.06.21",
    deadline: "2026.06.12",
    status: "모집중",
    category: "공모전",
    memberCount: 2,
    maxMembers: 4,
    techStacks: ["Figma", "React", "Spring"],
    jobs: [
      { job: "프론트엔드", current: 0, max: 1 },
      { job: "백엔드", current: 1, max: 2 },
      { job: "데이터 엔지니어", current: 1, max: 1 },
    ],
    imageUrl: "https://images.unsplash.com/photo-1518005020951-eccb494ad742",
  },
]

export default function MeetingsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [sortOrder, setSortOrder] = useState("최신순")
  const [bookmarkedMeetingIds, setBookmarkedMeetingIds] = useState<Set<string>>(
    () => new Set(MEETINGS.filter((meeting) => meeting.isBookmarked).map((meeting) => meeting.id)),
  )

  const categories = ["전체", "프로젝트", "해커톤", "공모전"]

  const filteredMeetings = MEETINGS.filter((meeting) => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const searchableText = [
      meeting.title,
      meeting.category,
      ...(meeting.techStacks ?? []),
    ].join(" ")
    const searchMatch = normalizedQuery
      ? searchableText.toLowerCase().includes(normalizedQuery)
      : true
    const categoryMatch = selectedCategory === "전체"
      ? true
      : meeting.category === selectedCategory

    return searchMatch && categoryMatch
  })

  function handleBookmarkToggle(meetingId: string, bookmarked: boolean) {
    setBookmarkedMeetingIds((prev) => {
      const next = new Set(prev)

      if (bookmarked) {
        next.add(meetingId)
      } else {
        next.delete(meetingId)
      }

      return next
    })
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto flex max-w-[1184px] flex-col gap-8">
        <section className="flex flex-col gap-6">
          {/* <div>
            <h1 className="text-[32px] font-medium leading-10 tracking-normal text-[#191c1e]">
              함께 성장할 팀원을 찾아보세요
            </h1>
            <p className="mt-1 text-lg leading-7 text-[#434655]">
              당신의 열정을 함께 나눌 프로젝트와 동료들이 기다리고 있습니다.
            </p>
          </div> */}

          <div className="flex flex-col gap-6 rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#737686]"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="기술 스택, 프로젝트명 등으로 검색"
                  value={searchQuery}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(event.target.value)
                  }
                  className="h-12 rounded-lg border-[#c3c6d7] bg-[#f7f9fb] pl-11 text-base text-[#191c1e] placeholder:text-[#6b7280]"
                />
              </div>
              <Button
                type="button"
                className="h-12 rounded-lg bg-blue-400 px-8 text-base font-medium text-white hover:bg-blue-500 sm:w-32"
              >
                검색
              </Button>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isActive = selectedCategory === category

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={
                        isActive
                          ? "rounded-full bg-blue-400 px-6 py-2 text-sm font-medium tracking-normal text-white shadow-sm"
                          : "rounded-full bg-[#e6e8ea] px-6 py-2 text-sm font-medium tracking-normal text-[#434655] transition hover:bg-[#d9dcdf]"
                      }
                    >
                      {category}
                    </button>
                  )
                })}
              </div>

              <label className="relative w-fit">
                <span className="sr-only">정렬</span>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="h-10 appearance-none rounded-lg border border-[#c3c6d7] bg-[#f2f4f6] py-2 pl-4 pr-9 text-base text-[#434655] outline-none transition focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20"
                >
                  <option>최신순</option>
                  <option>인기순</option>
                  <option>마감순</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#434655]"
                  aria-hidden="true"
                />
              </label>
            </div>
          </div>
        </section>

        <section>
          {filteredMeetings.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredMeetings.map((meeting) => {
                const isBookmarked = bookmarkedMeetingIds.has(meeting.id)

                return (
                  <MeetingCard
                    key={meeting.id}
                    meeting={{ ...meeting, isBookmarked }}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#c3c6d7] bg-white p-12 text-center text-[#565e74]">
              검색 결과가 없습니다. 다른 키워드로 검색해보세요.
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-2 py-10 text-[#565e74]">
            <LoaderCircle
              className="size-5 animate-spin text-[#004ac6]"
              aria-hidden="true"
            />
            <span className="text-base font-medium">불러오는 중...</span>
          </div>
        </section>
      </div>
    </main>
  )
}
