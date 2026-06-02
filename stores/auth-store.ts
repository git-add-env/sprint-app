import type { AppUser } from "@/lib/auth/backend"
import { createAppStore } from "@/stores/create-store"

type AuthState = {
  user: AppUser | null
  setUser: (user: AppUser | null) => void
  clearUser: () => void
}

export const useAuthStore = createAppStore<AuthState>("auth-store", (set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
