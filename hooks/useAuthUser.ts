"use client"

import { useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import { useAuthUserQuery } from "@/hooks/auth/use-auth-user-query"
import type { AppUser } from "@/lib/auth/backend"
import { refreshAccessToken } from "@/lib/auth/user"
import { useAuthStore } from "@/stores/auth-store"

export function useAuthUser() {
  const { data: session, status, update } = useSession()
  const queryClient = useQueryClient()
  const storeUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)
  const userQuery = useAuthUserQuery()
  const user = (userQuery.data ?? storeUser ?? session?.user ?? null) as AppUser | null
  const onboardingRequired = session?.onboardingRequired ?? false

  const refetchUser = useCallback(async () => {
    if (status !== "authenticated" || onboardingRequired || !session?.accessToken) {
      return null
    }

    const result = await userQuery.refetch()
    return result.data ?? null
  }, [onboardingRequired, session?.accessToken, status, userQuery])

  const refreshSessionAccessToken = useCallback(async () => {
    const refreshed = await refreshAccessToken()
    await update({ accessToken: refreshed.accessToken, user: user ?? undefined })
    return refreshed.accessToken
  }, [update, user])

  useEffect(() => {
    if (status === "unauthenticated") {
      clearUser()
      queryClient.removeQueries({ queryKey: queryKeys.auth.me })
      return
    }

    if (userQuery.data) {
      setUser(userQuery.data)
    }
  }, [clearUser, queryClient, setUser, status, userQuery.data])

  return {
    user,
    accessToken: session?.accessToken,
    status,
    isLoading: status === "loading" || userQuery.isLoading,
    isFetchingUser: userQuery.isFetching,
    isAuthenticated: status === "authenticated" && !!user,
    onboardingRequired,
    authError: session?.authError,
    userError: userQuery.error,
    refetchUser,
    refreshAccessToken: refreshSessionAccessToken,
    updateSession: update,
    userQuery,
  }
}
