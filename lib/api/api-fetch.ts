type ApiFetchOptions = RequestInit & {
  baseUrl: string
  token?: string
}

export type ApiResponse<TData> =
  | {
      status: "success"
      data: TData
    }
  | {
      status: "fail" | "error"
      data: Record<string, unknown> | null
    }

export class ApiFetchError extends Error {
  status: number
  body: unknown
  apiStatus?: "fail" | "error"
  data: unknown

  constructor(message: string, status: number, body: unknown, apiStatus?: "fail" | "error") {
    super(message)
    this.name = "ApiFetchError"
    this.status = status
    this.body = body
    this.apiStatus = apiStatus
    this.data = isApiResponse(body) ? body.data : body
  }
}

async function parseResponseBody(response: Response) {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get("content-type")

  if (contentType?.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return text || undefined
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value.status === "success" || value.status === "fail" || value.status === "error") &&
    "data" in value
  )
}

function getErrorMessage(body: unknown, fallback: string) {
  if (!isApiResponse(body)) {
    return fallback
  }

  const data = body.data

  if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
    return data.message
  }

  return fallback
}

export async function apiFetch<TResponse>(
  path: string,
  { baseUrl, token, headers, body, ...init }: ApiFetchOptions,
) {
  const { data } = await apiFetchWithMeta<TResponse>(path, {
    ...init,
    baseUrl,
    token,
    headers,
    body,
  })

  return data
}

export async function apiFetchWithMeta<TResponse>(
  path: string,
  { baseUrl, token, headers, body, ...init }: ApiFetchOptions,
) {
  const requestHeaders = new Headers(headers)
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData

  if (!requestHeaders.has("Content-Type") && !isFormData) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    body,
    headers: requestHeaders,
  })

  const parsedBody = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiFetchError(
      getErrorMessage(parsedBody, `API request failed: ${response.status}`),
      response.status,
      parsedBody,
      isApiResponse(parsedBody) && parsedBody.status !== "success" ? parsedBody.status : undefined,
    )
  }

  if (isApiResponse(parsedBody)) {
    if (parsedBody.status !== "success") {
      throw new ApiFetchError(
        getErrorMessage(parsedBody, "API request failed"),
        response.status,
        parsedBody,
        parsedBody.status,
      )
    }

    return {
      data: parsedBody.data as TResponse,
      response,
    }
  }

  return {
    data: parsedBody as TResponse,
    response,
  }
}
