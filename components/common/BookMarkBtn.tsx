"use client"

import { useState } from "react"
import { Bookmark } from "lucide-react"

import { cn } from "@/lib/utils"

type BookMarkBtnProps = {
  initialBookmarked?: boolean
  className?: string
  iconClassName?: string
  activeIconClassName?: string
}

export function BookMarkBtn({
  initialBookmarked = false,
  className,
  iconClassName,
  activeIconClassName,
}: BookMarkBtnProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)

  return (
    <button
      type="button"
      onClick={() => setBookmarked((prev) => !prev)}
      aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
      aria-pressed={bookmarked}
      className={cn(
        "flex size-12 items-center justify-center rounded-full border bg-white p-2 transition-transform duration-200 hover:scale-110 hover:shadow-md active:scale-95",
        className,
      )}
    >
      <Bookmark
        className={cn(
          "text-blue-400 transition-colors",
          iconClassName,
          bookmarked && cn("fill-blue-400", activeIconClassName),
        )}
      />
    </button>
  )
}
