import { getSession } from "next-auth/react"

import { ApiFetchError, apiFetch } from "@/lib/api/api-fetch"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
const REFRESH_PATH = "/api/auth/refresh"

type ApiClientOptions = RequestInit & {
  auth?: boolean
}

type RefreshResponse = {
  accessToken: string
}

export async function apiClient<TResponse>(
  path: string,
  { auth = true, headers, ...init }: ApiClientOptions = {},
) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is not configured")
  }

  const session = auth ? await getSession() : null

  try {
    return await apiFetch<TResponse>(path, {
      ...init,
      baseUrl: API_BASE_URL,
      token: session?.accessToken,
      headers,
    })
  } catch (error) {
    if (!(error instanceof ApiFetchError) || error.status !== 401 || !auth || path === REFRESH_PATH) {
      throw error
    }

    const refreshed = await apiFetch<RefreshResponse>(REFRESH_PATH, {
      method: "POST",
      baseUrl: API_BASE_URL,
      credentials: "include",
    })

    return apiFetch<TResponse>(path, {
      ...init,
      baseUrl: API_BASE_URL,
      token: refreshed.accessToken,
      headers,
    })
  }
}
