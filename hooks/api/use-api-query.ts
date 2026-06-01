"use client"

import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query"

import type { ApiFetchError } from "@/lib/api/api-fetch"
import { apiClient, type ApiClientOptions } from "@/lib/api/api-client"

type ApiQueryOptions<TData, TSelect = TData> = Omit<
  UseQueryOptions<TData, ApiFetchError, TSelect, QueryKey>,
  "queryKey" | "queryFn"
> & {
  request?: ApiClientOptions
}

type ApiMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, ApiFetchError, TVariables>,
  "mutationFn"
> & {
  method?: string
  request?: Omit<ApiClientOptions, "body" | "method">
  body?: (variables: TVariables) => BodyInit | null | undefined
}

function getMutationBody<TVariables>(variables: TVariables) {
  if (variables === undefined || variables === null) {
    return undefined
  }

  if (typeof FormData !== "undefined" && variables instanceof FormData) {
    return variables
  }

  return JSON.stringify(variables)
}

export function useApiQuery<TData, TSelect = TData>(
  queryKey: QueryKey,
  path: string,
  { request, ...options }: ApiQueryOptions<TData, TSelect> = {},
) {
  return useQuery<TData, ApiFetchError, TSelect, QueryKey>({
    queryKey,
    queryFn: () => apiClient<TData>(path, request),
    ...options,
  })
}

export function useApiMutation<TData, TVariables = void>(
  path: string | ((variables: TVariables) => string),
  { method = "POST", request, body, ...options }: ApiMutationOptions<TData, TVariables> = {},
) {
  return useMutation<TData, ApiFetchError, TVariables>({
    mutationFn: (variables) =>
      apiClient<TData>(typeof path === "function" ? path(variables) : path, {
        ...request,
        method,
        body: body ? body(variables) : getMutationBody(variables),
      }),
    ...options,
  })
}
