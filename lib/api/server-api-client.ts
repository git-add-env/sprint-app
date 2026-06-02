import { getServerSession } from "next-auth"

import { apiFetch } from "@/lib/api/api-fetch"
import { authOptions } from "@/lib/auth/options"

const API_BASE_URL = process.env.BACKEND_API_URL

type ServerApiClientOptions = RequestInit & {
  auth?: boolean
}

export async function serverApiClient<TResponse>(
  path: string,
  { auth = true, headers, ...init }: ServerApiClientOptions = {},
) {
  if (!API_BASE_URL) {
    throw new Error("BACKEND_API_URL is not configured")
  }

  const session = auth ? await getServerSession(authOptions) : null

  return apiFetch<TResponse>(path, {
    ...init,
    baseUrl: API_BASE_URL,
    token: session?.accessToken,
    headers,
    cache: "no-store",
  })
}
