"use client"

import { format } from "date-fns"
import {
  Calendar,
  ChevronRight,
  Clock,
  Crown,
  Megaphone,
  SquarePen,
  Trash2,
  Video,
} from "lucide-react"
import { useEffect, useState } from "react"

import { Calendars } from "@/components/common/Calendars"
import { MemberProfileDialog } from "@/components/common/MemberProfileDialog"
import { TimePicker } from "@/components/common/TimePicker"
import { VideoConference } from "@/components/dashboard/VideoConference"
import { Badge, CategoryBadge, HostBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CATEGORY_LABEL } from "@/constants/category"
import { ApiFetchError } from "@/lib/api/api-fetch"
import {
  createNotice,
  createResource,
  createSchedule,
  deleteNotice,
  deleteResource,
  deleteSchedule,
  fetchNotices,
  fetchResources,
  fetchSchedules,
  joinMeeting,
  startMeeting,
  type Notice,
  type Resource,
  type Schedule,
} from "@/lib/api/dashboard"
import {
  fetchGatheringMembers,
  type GatheringMember,
} from "@/lib/api/gatherings"
import { fetchMyMeetings, type Meeting } from "@/lib/api/mypage"
import { cn } from "@/lib/utils"

type TabKey = "overview" | "schedules" | "members"

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "개요" },
  { key: "schedules", label: "일정" },
  { key: "members", label: "멤버" },
]

export default function DashboardPage() {
  const [groups, setGroups] = useState<Meeting[] | null>(null)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  useEffect(() => {
    fetchMyMeetings()
      .then((res) => {
        setGroups(res.meetings)
        if (res.meetings.length > 0) {
          setSelectedGroupId(res.meetings[0].meetingId)
        }
      })
      .catch(() => setGroupsError("참여중인 모임을 불러오지 못했습니다."))
  }, [])

  const selectedGroup = groups?.find((g) => g.meetingId === selectedGroupId) ?? null
  // TODO: 백엔드 MeetingSummary에 isLeader 추가되면 selectedGroup?.isLeader로 교체. 현재 임시로 모임장 취급.
  const isOwner = true

  return (
    <div className="dashboard-borders mx-auto flex w-full max-w-[1280px] gap-6 px-6 py-8">
      <aside className="w-60 shrink-0">
        <div className="sticky top-20 flex flex-col gap-1 rounded-lg border border-border p-2">
          <p className="mb-1 border-b border-border px-3 pt-2 pb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            참여 모임
            {groups && (
              <span className="ml-1 text-foreground">{groups.length}</span>
            )}
          </p>

          {groupsError && (
            <p className="px-3 text-xs text-destructive">{groupsError}</p>
          )}
          {!groups && !groupsError && (
            <p className="px-3 text-xs text-muted-foreground">불러오는 중...</p>
          )}
          {groups && groups.length === 0 && (
            <p className="px-3 text-xs text-muted-foreground">
              참여중인 모임이 없습니다.
            </p>
          )}

          {groups?.map((group) => {
            const isActive = group.meetingId === selectedGroupId
            return (
              <button
                key={group.meetingId}
                type="button"
                onClick={() => setSelectedGroupId(group.meetingId)}
                title={group.title}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-transparent px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "border-muted-foreground font-medium text-foreground",
                )}
              >
                {/* TODO: 백엔드 isLeader 추가 시 group.isLeader && 로 교체. 현재 목록 응답에 없어 임시로 항상 표시. */}
                <Crown className="size-3.5 shrink-0 text-yellow-500" />
                {/* 긴 이름은 한 줄 말줄임(…), 전체 이름은 버튼 title 속성으로 호버 시 노출 */}
                <span className="min-w-0 flex-1 truncate">{group.title}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex flex-1 flex-col gap-4">
        <div>
          {selectedGroup && (
            <div className="mb-2 flex items-center gap-2">
              <CategoryBadge
                category={CATEGORY_LABEL[selectedGroup.category] ?? selectedGroup.category}
              />
              {/* 상태 배지: 모집중(파랑) / 활동중(초록). 완료는 표시 없음 */}
              {selectedGroup.status === "RECRUITING" && (
                <Badge variant="recruiting" className="rounded-full">
                  모집중
                </Badge>
              )}
              {selectedGroup.status === "ACTIVE" && (
                <Badge variant="active" className="rounded-full">
                  활동중
                </Badge>
              )}
              {isOwner && <HostBadge />}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-normal">
            {selectedGroup?.title ?? "모임을 선택해주세요"}
          </h1>
        </div>

        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "border-b-2 border-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "border-foreground font-medium text-foreground",
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {selectedGroupId === null ? (
          <p className="text-sm text-muted-foreground">먼저 모임을 선택해주세요.</p>
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewTab
                key={selectedGroupId}
                gatheringId={selectedGroupId}
                isOwner={isOwner}
                status={selectedGroup?.status ?? ""}
              />
            )}
            {activeTab === "schedules" && (
              <SchedulesTab
                key={selectedGroupId}
                gatheringId={selectedGroupId}
                isOwner={isOwner}
              />
            )}
            {activeTab === "members" && (
              <MembersTab key={selectedGroupId} gatheringId={selectedGroupId} />
            )}
          </>
        )}
      </section>
    </div>
  )
}

// ---------------- 개요 탭 ----------------

function OverviewTab({
  gatheringId,
  isOwner,
  status,
}: {
  gatheringId: number
  isOwner: boolean
  status: string
}) {
  const [meetingBusy, setMeetingBusy] = useState(false)
  const [meetingError, setMeetingError] = useState<string | null>(null)

  async function onMeeting() {
    setMeetingBusy(true)
    setMeetingError(null)
    try {
      if (isOwner) {
        await startMeeting(gatheringId)
      } else {
        await joinMeeting(gatheringId)
      }
    } catch (e) {
      if (e instanceof ApiFetchError && e.status === 404) {
        setMeetingError("진행 중인 회의가 없습니다.")
      } else if (e instanceof ApiFetchError && e.status === 409) {
        setMeetingError("이미 진행 중인 회의가 있습니다.")
      } else {
        setMeetingError("회의 연결에 실패했습니다.")
      }
    } finally {
      setMeetingBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent">
              <Video className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">화상 회의</p>
              <p className="text-base font-semibold">
                {isOwner ? "지금 회의를 시작해보세요" : "진행 중인 회의에 참여하세요"}
              </p>
            </div>
          </div>
          <VideoConference
            status={status}
            isOwner={isOwner}
            busy={meetingBusy}
            onClick={onMeeting}
          />
        </div>
        {meetingError && (
          <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            {meetingError}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <NoticeCard gatheringId={gatheringId} isOwner={isOwner} />
        </div>
        <div className="md:col-span-2">
          <NextMeetingCard gatheringId={gatheringId} />
        </div>
      </div>

      <ResourceCard gatheringId={gatheringId} isOwner={isOwner} />
    </div>
  )
}

function NoticeCard({
  gatheringId,
  isOwner,
}: {
  gatheringId: number
  isOwner: boolean
}) {
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [viewAll, setViewAll] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotices(gatheringId)
      .then((res) => setNotices(res.notices))
      .catch(() => setError("공지를 불러오지 못했습니다."))
  }, [gatheringId])

  async function add() {
    setError(null)
    try {
      const created = await createNotice(gatheringId, { title, content })
      setNotices((prev) => [created, ...(prev ?? [])])
      setTitle("")
      setContent("")
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "공지 작성에 실패했습니다.")
    }
  }

  async function remove(noticeId: number) {
    try {
      await deleteNotice(gatheringId, noticeId)
      setNotices((prev) => prev?.filter((n) => n.id !== noticeId) ?? null)
    } catch {
      setError("공지 삭제에 실패했습니다.")
    }
  }

  return (
    <div className="h-full rounded-2xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">공지사항</h2>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="ghost" onClick={() => setViewAll(true)}>
            더보기 <ChevronRight />
          </Button>
          {isOwner && (
            <Button size="xs" variant="ghost" onClick={() => setAdding(true)}>
              <SquarePen /> 작성
            </Button>
          )}
        </div>
      </div>

      {isOwner && (
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>작성</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <input
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목 (최대 50자)"
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <textarea
                value={content}
                maxLength={500}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용 (최대 500자)"
                rows={4}
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                  취소
                </Button>
                <Button size="sm" onClick={add}>
                  등록
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {error && !adding && (
        <p className="mb-2 text-xs text-destructive">{error}</p>
      )}

      {/* 공지 2개 이하여도 3개일 때 높이를 유지하도록 최소 높이 확보 (공지 1개 ≈ 66px, gap 포함 3개 ≈ 14rem) */}
      <div className="min-h-[14rem]">
        {!notices ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 공지사항이 없습니다.</p>
        ) : (
          <ul className="flex min-h-[14rem] flex-col gap-3">
            {notices.slice(0, 3).map((notice) => (
              <li key={notice.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{notice.title}</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => remove(notice.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="삭제"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                  {notice.content}
                </p>
              </li>
            ))}
            {/* 공지가 3개 미만이면 남는 자리를 빈 칸으로 채워 항상 3칸 높이를 유지 */}
            {Array.from({ length: Math.max(0, 3 - notices.length) }).map((_, i) => (
              <li
                key={`placeholder-${i}`}
                aria-hidden
                className="flex min-h-[3.25rem] flex-1 items-center justify-center rounded-lg border border-dashed border-border/60"
              >
                <Megaphone className="size-5 text-muted-foreground/30" />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 더보기: 공지사항 전체 보기 모달 */}
      <Dialog open={viewAll} onOpenChange={setViewAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 전체</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {!notices || notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                등록된 공지사항이 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notices.map((notice) => (
                  <li
                    key={notice.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notice.title}</p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => remove(notice.id)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="삭제"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                      {notice.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NextMeetingCard({ gatheringId }: { gatheringId: number }) {
  const [schedules, setSchedules] = useState<Schedule[] | null>(null)

  useEffect(() => {
    fetchSchedules(gatheringId)
      .then((res) => setSchedules(res.schedules))
      .catch(() => setSchedules([]))
  }, [gatheringId])

  const next = schedules ? findNextMeeting(schedules) : null

  return (
    <div className="h-full rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Calendar className="size-4" />
        다음 회의 일정
      </h2>
      {!schedules ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : next ? (
        <div className="flex flex-col gap-4">
          <p className="text-base font-semibold">{next.title}</p>
          <div className="flex flex-col gap-5">
            <MeetingDetailRow
              icon={<Calendar className="size-4" />}
              label="날짜"
              value={formatMeetingDate(next.date)}
            />
            <MeetingDetailRow
              icon={<Clock className="size-4" />}
              label="시간"
              value={next.time}
            />
            <MeetingDetailRow
              icon={<Video className="size-4" />}
              label="방식"
              value={next.isMeeting ? "비대면 화상" : "대면"}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">예정된 회의가 없습니다.</p>
      )}
    </div>
  )
}

function ResourceCard({
  gatheringId,
  isOwner,
}: {
  gatheringId: number
  isOwner: boolean
}) {
  const [resources, setResources] = useState<Resource[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResources(gatheringId)
      .then((res) => setResources(res.resources))
      .catch(() => setError("자료를 불러오지 못했습니다."))
  }, [gatheringId])

  async function add() {
    setError(null)
    try {
      const created = await createResource(gatheringId, { title, url })
      setResources((prev) => [...(prev ?? []), created])
      setTitle("")
      setUrl("")
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "자료 추가에 실패했습니다.")
    }
  }

  async function remove(resourceId: number) {
    try {
      await deleteResource(gatheringId, resourceId)
      setResources((prev) => prev?.filter((r) => r.id !== resourceId) ?? null)
    } catch {
      setError("자료 삭제에 실패했습니다.")
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">자료실</h2>
        {isOwner && (
          <Button size="xs" variant="outline" onClick={() => setAdding((v) => !v)}>
            {adding ? "취소" : "링크 추가"}
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" onClick={add}>
            추가
          </Button>
        </div>
      )}

      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      {!resources ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 자료가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
            >
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {resource.title}
              </a>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => remove(resource.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="삭제"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------- 일정 탭 ----------------

function SchedulesTab({
  gatheringId,
  isOwner,
}: {
  gatheringId: number
  isOwner: boolean
}) {
  const [schedules, setSchedules] = useState<Schedule[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 입력 폼.
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [description, setDescription] = useState("")
  const [isMeeting, setIsMeeting] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  function load() {
    fetchSchedules(gatheringId)
      .then((res) => setSchedules(res.schedules))
      .catch(() => setError("일정을 불러오지 못했습니다."))
  }

  useEffect(() => {
    fetchSchedules(gatheringId)
      .then((res) => setSchedules(res.schedules))
      .catch(() => setError("일정을 불러오지 못했습니다."))
  }, [gatheringId])

  async function add() {
    setError(null)
    try {
      const created = await createSchedule(gatheringId, {
        title,
        date,
        time,
        description: description || null,
        isMeeting,
      })
      setSchedules((prev) =>
        [...(prev ?? []), created].sort((a, b) =>
          `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
        ),
      )
      setTitle("")
      setDate("")
      setTime("")
      setDescription("")
      setIsMeeting(false)
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "일정 추가에 실패했습니다.")
    }
  }

  async function remove(scheduleId: number) {
    try {
      await deleteSchedule(gatheringId, scheduleId)
      setSchedules((prev) => prev?.filter((s) => s.id !== scheduleId) ?? null)
    } catch {
      setError("일정 삭제에 실패했습니다.")
      load()
    }
  }

  const next = schedules ? findNextMeeting(schedules) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">다음 회의 일정</p>
        {next ? (
          <p className="mt-1 text-lg font-semibold">
            {next.title} · {next.date} {next.time}
          </p>
        ) : (
          <p className="mt-1 text-lg font-semibold">예정된 회의가 없습니다.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">예정 일정</h2>
          {isOwner && (
            <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
              {adding ? "취소" : "+ 일정 추가"}
            </Button>
          )}
        </div>

        {adding && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border p-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 flex-1 items-center gap-2 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Calendar className="size-4 shrink-0 text-muted-foreground" />
                    <span className={cn(!date && "text-muted-foreground")}>
                      {date || "날짜 선택"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start">
                  <Calendars
                    selected={date ? new Date(`${date}T00:00:00`) : undefined}
                    onSelect={(d) => {
                      if (d) setDate(format(d, "yyyy-MM-dd"))
                      setDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
              <TimePicker value={time} onChange={setTime} className="flex-1" />
            </div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 (선택)"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isMeeting}
                onChange={(e) => setIsMeeting(e.target.checked)}
              />
              화상 회의 일정
            </label>
            <div className="flex justify-end">
              <Button size="sm" onClick={add}>
                등록
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

        {!schedules ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 일정이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {schedules.map((schedule) => (
              <li
                key={schedule.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{schedule.title}</p>
                    {schedule.isMeeting && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs">
                        화상 회의
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {schedule.date} {schedule.time}
                    {schedule.description ? ` · ${schedule.description}` : ""}
                  </p>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => remove(schedule.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="삭제"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---------------- 멤버 탭 ----------------

function MembersTab({ gatheringId }: { gatheringId: number }) {
  const [members, setMembers] = useState<GatheringMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  useEffect(() => {
    fetchGatheringMembers(gatheringId)
      .then((res) => setMembers(res.members))
      .catch(() => setError("멤버 목록을 불러오지 못했습니다."))
  }, [gatheringId])

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!members) return <p className="text-sm text-muted-foreground">불러오는 중...</p>

  const leader = members.find((m) => m.isOwner)
  const others = members.filter((m) => !m.isOwner)

  return (
    <div className="flex flex-col gap-4">
      {leader && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-sm text-muted-foreground">모임장</p>
          <MemberItem
            name={leader.nickname}
            role={leader.job ?? "직군 미설정"}
            isLeader
            onClick={() => setProfileUserId(leader.id)}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="mb-3 text-sm text-muted-foreground">
          참여 멤버 ({others.length})
        </p>
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">참여 멤버가 없습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((member) => (
              <MemberItem
                key={member.id}
                name={member.nickname}
                role={member.job ?? "직군 미설정"}
                onClick={() => setProfileUserId(member.id)}
              />
            ))}
          </div>
        )}
      </div>

      <MemberProfileDialog
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </div>
  )
}

function MemberItem({
  name,
  role,
  isLeader,
  onClick,
}: {
  name: string
  role: string
  isLeader?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-accent"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-medium">
        {name.charAt(0)}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{name}</p>
          {isLeader && (
            <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
              모임장
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </button>
  )
}

// ---------------- 공통 유틸 ----------------

// 화상 회의(isMeeting) 일정 중 가장 가까운 미래 일정.
// 다음 회의 카드: 날짜/시간/방식을 아이콘 + 라벨 + 값 한 행으로 표시.
function MeetingDetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

// 일정 날짜를 "2026.05.28 (수)" 형태로 변환.
function formatMeetingDate(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  const week = ["일", "월", "화", "수", "목", "금", "토"]
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}.${m}.${day} (${week[d.getDay()]})`
}

function findNextMeeting(schedules: Schedule[]): Schedule | null {
  const now = Date.now()
  const upcoming = schedules
    .filter((s) => s.isMeeting)
    .map((s) => ({ s, at: new Date(`${s.date}T${s.time}:00`).getTime() }))
    .filter(({ at }) => Number.isFinite(at) && at >= now)
    .sort((a, b) => a.at - b.at)
  return upcoming[0]?.s ?? null
}

function errorMessage(e: ApiFetchError): string {
  // v8 실패 봉투의 data: 권한/비즈니스는 { message }, 유효성은 { 필드명: 메시지 }.
  if (e.data && typeof e.data === "object") {
    const data = e.data as Record<string, unknown>
    if (typeof data.message === "string") return data.message
    const firstField = Object.values(data).find((v) => typeof v === "string")
    if (typeof firstField === "string") return firstField
  }
  return "요청에 실패했습니다."
}
