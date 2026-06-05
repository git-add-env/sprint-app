import { apiClient } from "@/lib/api/api-client"
import type { AppUser } from "@/lib/auth/backend"

const AUTH_USER_PATH = "/api/users/me"
const REFRESH_PATH = "/api/auth/refresh"
const LOGOUT_PATH = "/api/auth/logout"

type MeResponse = {
  user: AppUser
}

type RefreshResponse = {
  accessToken: string
}

export function getAuthUser() {
  return apiClient<MeResponse>(AUTH_USER_PATH).then((data) => data.user)
}

export function refreshAccessToken() {
  return apiClient<RefreshResponse>(REFRESH_PATH, {
    method: "POST",
    auth: false,
    credentials: "include",
  })
}

export function logoutBackend() {
  return apiClient<null>(LOGOUT_PATH, {
    method: "POST",
    auth: false,
    credentials: "include",
  })
}
