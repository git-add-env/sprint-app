"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

import { useAuthStore } from "@/stores/auth-store"

export function useSyncAuthUser() {
  const { data: session } = useSession()
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setUser(session?.user ?? null)
  }, [session?.user, setUser])
}
