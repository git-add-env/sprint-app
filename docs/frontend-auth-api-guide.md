# 프론트 API 요청 / 회원 조회 가이드

이 문서는 프론트 개발자가 백엔드 API를 호출하고, 현재 로그인한 회원 정보를 조회할 때 사용하는 공통 함수와 흐름을 정리합니다.

## 1. 공통 API 응답 처리

백엔드는 아래 공통 응답 형식을 사용합니다.

```json
{
  "status": "success",
  "data": {}
}
```

프론트에서는 `lib/api/api-fetch.ts`의 `apiFetch`가 이 래퍼를 자동으로 처리합니다.

```ts
const data = await apiFetch<ResponseData>("/api/users/me", {
  baseUrl: API_BASE_URL,
  token: accessToken,
})
```

`apiFetch`의 동작은 다음과 같습니다.

- `status: "success"`이면 `data`만 반환합니다.
- `status: "fail"` 또는 `status: "error"`이면 `ApiFetchError`를 던집니다.
- `token`을 넘기면 `Authorization: Bearer {token}` 헤더를 자동으로 붙입니다.
- JSON 요청이면 `Content-Type: application/json`을 자동으로 붙입니다.

즉, 호출하는 쪽에서는 백엔드 응답 전체가 아니라 `data` 내부 타입만 기대하면 됩니다.

```ts
type MeResponse = {
  user: AppUser
}

const data = await apiClient<MeResponse>("/api/users/me")
console.log(data.user)
```

## 2. 클라이언트 컴포넌트에서 API 요청하기

브라우저에서 API를 호출할 때는 `lib/api/api-client.ts`의 `apiClient`를 사용합니다.

```ts
import { apiClient } from "@/lib/api/api-client"

type MeetingResponse = {
  meetings: Meeting[]
}

const data = await apiClient<MeetingResponse>("/api/meetings")
```

기본값은 `auth: true`입니다. 따라서 NextAuth 세션의 `accessToken`을 읽어서 `Authorization` 헤더에 자동으로 넣습니다.

인증이 필요 없는 요청은 `auth: false`를 넘깁니다.

```ts
await apiClient("/api/public", {
  auth: false,
})
```

Access Token이 만료되어 API가 `401`을 반환하면 `apiClient`가 `/api/auth/refresh`를 호출한 뒤 같은 요청을 한 번 재시도합니다.

## 2-1. React Query로 API 요청하기

화면에서 서버 상태를 조회하거나 생성/수정/삭제 요청을 보낼 때는 `hooks/api/use-api-query.ts`의 공용 훅을 사용합니다.

단순 조회는 `useApiQuery`를 사용합니다.

```tsx
"use client"

import { useApiQuery } from "@/hooks/api/use-api-query"

type MeetingListResponse = {
  meetings: Meeting[]
}

export function MeetingList() {
  const { data, isLoading, error } = useApiQuery<MeetingListResponse>(
    ["meetings"],
    "/api/meetings",
  )

  if (isLoading) return <div>로딩 중</div>
  if (error) return <div>{error.message}</div>

  return <div>{data?.meetings.length}</div>
}
```

생성/수정/삭제 요청은 `useApiMutation`을 사용합니다.

```tsx
"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useApiMutation } from "@/hooks/api/use-api-query"

type CreateMeetingPayload = {
  title: string
}

type CreateMeetingResponse = {
  meetingId: number
}

export function CreateMeetingButton() {
  const queryClient = useQueryClient()
  const createMeeting = useApiMutation<CreateMeetingResponse, CreateMeetingPayload>(
    "/api/meetings",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["meetings"] })
      },
    },
  )

  return (
    <button
      onClick={() => {
        createMeeting.mutate({ title: "React 스터디" })
      }}
    >
      생성
    </button>
  )
}
```

인증이 필요 없는 API는 `request.auth: false`를 넘깁니다.

```ts
useApiQuery(["public-meetings"], "/api/public/meetings", {
  request: {
    auth: false,
  },
})
```

`useApiQuery`, `useApiMutation`은 내부에서 `apiClient`를 사용합니다. 따라서 `Authorization` 헤더, 공통 응답 래퍼 처리, 401 재시도 정책은 그대로 적용됩니다.

공용 훅과 개인/도메인 훅은 분리하는 것을 권장합니다.

- 공용 훅: `useApiQuery`, `useApiMutation`처럼 모든 API에 재사용되는 얇은 래퍼
- 도메인 훅: `useAuthUserQuery`, `useMeetingsQuery`, `useCreateMeetingMutation`처럼 특정 API의 path, queryKey, 타입을 감싼 훅

여러 화면에서 같은 API를 반복해서 쓴다면 도메인 훅을 만들어두는 편이 좋습니다.

```ts
import { useApiQuery } from "@/hooks/api/use-api-query"

type MeetingListResponse = {
  meetings: Meeting[]
}

export function useMeetingsQuery() {
  return useApiQuery<MeetingListResponse>(["meetings"], "/api/meetings")
}
```

## 3. 서버 컴포넌트 / 서버 함수에서 API 요청하기

서버에서 백엔드 API를 호출할 때는 `lib/api/server-api-client.ts`의 `serverApiClient`를 사용합니다.

```ts
import { serverApiClient } from "@/lib/api/server-api-client"

const data = await serverApiClient<MeResponse>("/api/users/me")
```

`serverApiClient`는 `getServerSession(authOptions)`로 세션을 읽고, 세션의 `accessToken`을 백엔드 요청에 붙입니다.

## 4. 현재 로그인한 회원 조회

클라이언트에서 현재 회원 정보가 필요하면 `hooks/useAuthUser.ts`의 `useAuthUser`를 사용합니다.

```tsx
"use client"

import { useAuthUser } from "@/hooks/useAuthUser"

export function Profile() {
  const { user, isAuthenticated, isLoading, refetchUser } = useAuthUser()

  if (isLoading) return null
  if (!isAuthenticated) return <button>로그인</button>

  return (
    <div>
      <p>{user?.nickname}</p>
      <button onClick={() => refetchUser()}>내 정보 새로고침</button>
    </div>
  )
}
```

`useAuthUser`가 제공하는 주요 값은 다음과 같습니다.

- `user`: 현재 로그인한 회원 정보
- `accessToken`: 현재 세션의 Access Token
- `isAuthenticated`: 로그인 및 회원 정보 존재 여부
- `isLoading`: 세션 로딩 또는 회원 정보 조회 중 여부
- `onboardingRequired`: 신규 회원 온보딩 필요 여부
- `refetchUser()`: `/api/users/me`를 다시 호출해서 회원 정보를 갱신
- `refreshAccessToken()`: `/api/auth/refresh`로 Access Token을 재발급하고 세션 갱신

내부적으로 회원 조회는 `lib/auth/user.ts`의 `getAuthUser()`를 통해 처리합니다.

```ts
export function getAuthUser() {
  return apiClient<MeResponse>("/api/users/me").then((data) => data.user)
}
```

백엔드의 `/api/users/me` 응답은 `{ user }` 형태이므로, `getAuthUser()`는 `data.user`만 반환합니다.

React Query의 원본 쿼리 상태가 필요하면 `hooks/auth/use-auth-user-query.ts`의 `useAuthUserQuery`를 직접 사용할 수 있습니다.

```tsx
import { useAuthUserQuery } from "@/hooks/auth/use-auth-user-query"

const userQuery = useAuthUserQuery()

console.log(userQuery.data)
console.log(userQuery.isFetching)
```

대부분의 화면에서는 `useAuthUser()`를 우선 사용하고, 쿼리 캐시 상태를 세밀하게 다뤄야 할 때만 `useAuthUserQuery()`를 직접 사용하면 됩니다.

## 5. 소셜 로그인과 온보딩 흐름

소셜 로그인은 NextAuth가 담당하고, NextAuth 콜백에서 백엔드 `/api/auth/social-login`으로 소셜 유저 정보를 전달합니다.

전달하는 값은 다음 형식입니다.

```ts
{
  provider: "google",
  providerId: "1234567890",
  email: "user@example.com",
  name: "홍길동",
  image: "https://example.com/profile.png"
}
```

기존 회원이면 백엔드가 `authStatus: "LOGIN_SUCCESS"`와 `accessToken`, `user`를 반환합니다. 이 값은 NextAuth JWT 세션에 저장됩니다.

신규 회원이면 백엔드가 `authStatus: "ONBOARDING_REQUIRED"`와 `accessToken`, `user`를 반환합니다. 이때 프론트는 Access Token을 NextAuth JWT 세션에 저장하고, 온보딩 모달을 띄운 뒤 완료 시 내부 라우트 `/api/auth/onboarding`으로 온보딩 값을 보냅니다.

```ts
await fetch("/api/auth/onboarding", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nickname,
    job,
    career,
    techStacks,
    introduction,
  }),
})
```

내부 라우트는 NextAuth JWT에 저장된 `accessToken`을 읽어서 백엔드 `/api/auth/onboarding`에 `Authorization: Bearer {accessToken}` 헤더로 전달합니다.

### 5-1. 온보딩 유효성 검사

온보딩 입력 검증은 프론트 모달에서 1차로 진행하고, 내부 API 라우트에서 동일한 필수값과 길이 제한을 한 번 더 확인합니다.

요청 바디 예시는 다음과 같습니다.

```json
{
  "nickname": "길동",
  "job": "프론트엔드 개발자",
  "career": "신입",
  "techStacks": ["React", "TypeScript", "Next.js"],
  "introduction": "프론트엔드 개발자로 성장 중입니다."
}
```

요청 필드 유효성은 다음과 같습니다.

| 필드 | 타입 | 필수 여부 | 유효성 |
| --- | --- | --- | --- |
| `nickname` | `string` | 필수 | 앞뒤 공백 제거 후 2자 이상 10자 이하 |
| `job` | `string` | 필수 | 직종 선택값 |
| `career` | `string` | 필수 | 경력 선택값 |
| `techStacks` | `string[]` | 필수 | 1개 이상 선택 |
| `introduction` | `string \| null` | 선택 | 값이 있으면 앞뒤 공백 제거 후 50자 이하, 비어 있으면 `null` |

프론트 검증은 `components/common/OnboardingDialog.tsx`에서 단계별 버튼 비활성화와 입력 제한으로 처리합니다.

- 닉네임: `input`에 `maxLength={10}`을 걸어 10자 초과 입력을 막고, `nickname.trim().length < 2`이면 다음 단계 버튼을 비활성화합니다. 화면에는 `2-10자 이내`로 안내합니다.
- 직종/경력: `job`, `career`가 모두 선택되어야 다음 단계로 넘어갈 수 있습니다.
- 기술 스택: `selectedSkills.length === 0`이면 다음 단계 버튼을 비활성화해서 1개 이상 선택하도록 합니다.
- 자기소개: 선택값입니다. `onChange`에서 `event.target.value.slice(0, 50)`으로 50자까지만 상태에 저장하고, 화면에 `{introduction.length}/50` 카운터를 보여줍니다.
- 제출 시 값 정리: 완료 요청을 보낼 때 `nickname.trim()`을 사용하고, 자기소개는 `introduction.trim() || null`로 비어 있으면 `null`을 보냅니다.

내부 라우트 검증은 `app/api/auth/onboarding/route.ts`에서 처리합니다.

- `accessToken`이 없으면 `401`과 `온보딩 세션이 없습니다.`를 반환합니다.
- `nickname`, `job`, `career`, `techStacks` 중 필수값이 비어 있으면 `400`과 `fields` 객체를 반환합니다.
- `nickname`이 2자 미만 또는 10자 초과이면 `400`과 `fields.nickname`을 반환합니다.
- `introduction`이 50자를 초과하면 `400`과 `fields.introduction`을 반환합니다.

## 6. 로그아웃

로그아웃 버튼에서는 먼저 백엔드 `/api/auth/logout`을 호출해 Refresh Token 쿠키 제거를 요청하고, 이후 NextAuth `signOut()`을 호출합니다.

```ts
import { signOut } from "next-auth/react"
import { logoutBackend } from "@/lib/auth/user"

async function handleLogout() {
  try {
    await logoutBackend()
  } finally {
    await signOut()
  }
}
```

## 7. 자주 쓰는 파일

- `lib/api/api-fetch.ts`: 공통 fetch, 공통 응답 래퍼 처리, 에러 처리
- `lib/api/api-client.ts`: 클라이언트용 API 요청 함수
- `lib/api/server-api-client.ts`: 서버용 API 요청 함수
- `lib/auth/backend.ts`: 소셜 로그인 / 온보딩 백엔드 연동 함수와 타입
- `lib/auth/user.ts`: 내 정보 조회, 토큰 재발급, 로그아웃 함수
- `hooks/useAuthUser.ts`: 클라이언트에서 현재 회원 정보를 쓰는 공통 훅
- `lib/auth/options.ts`: NextAuth 콜백에서 백엔드 소셜 로그인 연동
