"use client"

import * as React from "react"
import { ko } from "date-fns/locale"

import { Calendar } from "@/components/ui/calendar"

type CalendarsProps = {
    // 선택한 날짜와 변경 핸들러를 부모에서 받음 (제어 컴포넌트)
    selected?: Date
    onSelect?: (date: Date | undefined) => void
}

export function Calendars({ selected, onSelect }: CalendarsProps) {
    // 서버(UTC)/브라우저(로컬) 시각 차이로 인한 하이드레이션 불일치 방지:
    // 서버에서는 렌더하지 않고, 브라우저에서만 달력을 그린다.
    const mounted = React.useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    )

    if (!mounted) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentYear = today.getFullYear()

    return (
        <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            locale={ko}
            captionLayout="dropdown"
            disabled={{ before: today }}
            startMonth={today}
            endMonth={new Date(currentYear + 5, 11)}
            className="rounded-lg border"
        />
    )
}
