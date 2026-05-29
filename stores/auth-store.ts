import { create } from "zustand"

import type { AppUser } from "@/lib/auth/backend"

type AuthState = {
  user: AppUser | null
  setUser: (user: AppUser | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
