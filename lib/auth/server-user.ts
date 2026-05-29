import { serverApiClient } from "@/lib/api/server-api-client"
import type { AppUser } from "@/lib/auth/backend"

const AUTH_USER_PATH = "/api/users/me"

type MeResponse = {
  user: AppUser
}

export function getServerAuthUser() {
  return serverApiClient<MeResponse>(AUTH_USER_PATH).then((data) => data.user)
}
