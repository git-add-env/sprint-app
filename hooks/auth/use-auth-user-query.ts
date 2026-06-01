"use client"

import { useSession } from "next-auth/react"

import { queryKeys } from "@/hooks/api/query-keys"
import { useApiQuery } from "@/hooks/api/use-api-query"
import type { AppUser } from "@/lib/auth/backend"

type MeResponse = {
  user: AppUser
}

export function useAuthUserQuery() {
  const { data: session, status } = useSession()
  const onboardingRequired = session?.onboardingRequired ?? false

  return useApiQuery<MeResponse, AppUser>(queryKeys.auth.me, "/api/users/me", {
    enabled: status === "authenticated" && !!session?.accessToken && !onboardingRequired,
    select: (data) => data.user,
  })
}
