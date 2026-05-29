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

신규 회원이면 백엔드가 `authStatus: "ONBOARDING_REQUIRED"`와 `tempToken`을 반환합니다. 이때 프론트는 온보딩 모달을 띄우고, 완료 시 내부 라우트 `/api/auth/onboarding`으로 온보딩 값을 보냅니다.

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

내부 라우트는 NextAuth JWT에 저장된 `tempToken`을 읽어서 백엔드 `/api/auth/onboarding`에 명세대로 전달합니다.

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
