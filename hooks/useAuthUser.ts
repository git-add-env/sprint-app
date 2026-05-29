"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

import type { AppUser } from "@/lib/auth/backend"
import { getAuthUser, refreshAccessToken } from "@/lib/auth/user"
import { useAuthStore } from "@/stores/auth-store"

export function useAuthUser() {
  const { data: session, status, update } = useSession()
  const storeUser = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)
  const [isFetchingUser, setIsFetchingUser] = useState(false)
  const [userError, setUserError] = useState<unknown>(null)
  const user = (storeUser ?? session?.user ?? null) as AppUser | null
  const onboardingRequired = session?.onboardingRequired ?? false

  const refetchUser = useCallback(async () => {
    if (status !== "authenticated" || onboardingRequired || !session?.accessToken) {
      return null
    }

    setIsFetchingUser(true)
    setUserError(null)

    try {
      const nextUser = await getAuthUser()
      setUser(nextUser)
      return nextUser
    } catch (error) {
      setUserError(error)
      return null
    } finally {
      setIsFetchingUser(false)
    }
  }, [onboardingRequired, session?.accessToken, setUser, status])

  const refreshSessionAccessToken = useCallback(async () => {
    const refreshed = await refreshAccessToken()
    await update({ accessToken: refreshed.accessToken, user: user ?? undefined })
    return refreshed.accessToken
  }, [update, user])

  useEffect(() => {
    if (status === "unauthenticated") {
      clearUser()
      return
    }

    void Promise.resolve().then(refetchUser)
  }, [clearUser, refetchUser, status])

  return {
    user,
    accessToken: session?.accessToken,
    status,
    isLoading: status === "loading" || isFetchingUser,
    isFetchingUser,
    isAuthenticated: status === "authenticated" && !!user,
    onboardingRequired,
    authError: session?.authError,
    userError,
    refetchUser,
    refreshAccessToken: refreshSessionAccessToken,
    updateSession: update,
  }
}
