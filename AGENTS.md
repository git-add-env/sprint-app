# AGENTS.md

이 문서는 이 프론트엔드 저장소에서 사람과 AI가 함께 작업할 때 반드시 따라야 하는 협업 규칙입니다.
새 기능을 만들거나 기존 코드를 수정하기 전에 이 파일을 먼저 확인합니다.

## 핵심 원칙

- 기존 구조를 먼저 확인하고, 이미 있는 helper, hook, store, provider를 우선 사용한다.
- 같은 역할의 코드를 화면마다 중복 구현하지 않는다.
- API 요청, 인증 토큰, toast, 전역 상태는 공통 모듈을 통해 처리한다.
- page 파일은 얇게 유지하고, 실제 UI는 도메인 컴포넌트로 분리한다.
- 변경 후 가능하면 `npm run typecheck`와 `npm run lint`를 실행한다.

## 코드 스타일

### 포맷

- TypeScript와 React를 기준으로 작성한다.
- 문자열은 쌍따옴표(`"`)를 사용한다.
- 세미콜론은 사용하지 않는다.
- 들여쓰기는 스페이스 2칸을 사용한다.
- 불필요한 주석은 남기지 않는다.
- 사용하지 않는 import, 변수, 함수, console은 제거한다.
- 파일 하나에 너무 많은 역할을 넣지 않는다.

```ts
const message = "저장되었습니다."
```

### Import 순서

import는 아래 순서로 정리한다.

1. React, Next.js, 외부 라이브러리
2. `@/` alias 내부 모듈
3. 상대 경로 모듈
4. type import는 가능하면 `import type`을 사용

```ts
import { useEffect } from "react"
import { useSession } from "next-auth/react"

import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

import type { AppUser } from "@/lib/auth/backend"
```

### 네이밍

- 컴포넌트 파일명은 `PascalCase.tsx`를 사용한다.
- hook, store, utility 파일명은 `kebab-case.ts`를 사용한다.
- React 컴포넌트는 named export를 사용한다.
- hook 이름은 `useSomething` 형태로 작성한다.
- Zustand store hook 이름은 `useSomethingStore` 형태로 작성한다.
- 이벤트 핸들러는 `handleSubmit`, `handleClose`, `handleClick`처럼 `handle` 접두사를 사용한다.
- boolean 상태는 `isOpen`, `isLoading`, `isSubmitting`, `hasError`, `canSubmit`처럼 의미가 드러나게 작성한다.

## 컴포넌트 작성 규칙

- props 타입은 컴포넌트 바로 위에 `type ComponentNameProps`로 선언한다.
- props가 3개 이상이면 구조 분해 할당을 사용한다.
- 복잡한 조건식은 JSX 안에 길게 쓰지 말고 위에서 변수로 분리한다.
- 조건부 렌더링은 읽기 쉬운 변수명을 사용한다.
- UI 조합이 길어지면 작은 컴포넌트로 분리한다.
- 여러 페이지에서 재사용되는 UI는 `components/common`으로 이동한다.

```tsx
type LoginDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  function handleClose() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button onClick={handleClose}>닫기</Button>
    </Dialog>
  )
}
```

## 클라이언트 / 서버 컴포넌트

- `useState`, `useEffect`, event handler, 브라우저 API가 필요한 파일에만 `"use client"`를 붙인다.
- 서버에서 처리 가능한 데이터 조회는 서버 컴포넌트 또는 서버 함수에서 처리한다.
- 클라이언트 컴포넌트에서 백엔드 API를 직접 `fetch`하지 않는다.
- 클라이언트 API 호출은 `apiClient` 또는 React Query hook을 사용한다.
- 서버 API 호출은 `serverApiClient`를 사용한다.

## 폴더 구조

```txt
app/                    # Next.js 라우팅, page, layout, route handler
components/
  common/               # 여러 화면에서 같이 쓰는 공용 컴포넌트
  dashboard/            # dashboard 화면 전용 컴포넌트
  meeting/              # meeting/meetings 화면 전용 컴포넌트
  providers/            # 전역 Provider
  ui/                   # shadcn/ui 기반 기본 UI
hooks/
  api/                  # React Query 공통 hook, query key
  auth/                 # 인증 관련 hook
lib/
  api/                  # apiClient, serverApiClient, fetch wrapper
  auth/                 # NextAuth와 백엔드 인증 연동
constants/              # 화면/도메인에서 쓰는 고정 옵션 데이터
stores/                 # Zustand 전역 클라이언트 상태
types/                  # 전역 타입 확장
docs/                   # 협업용 개발 문서
```

### 컴포넌트 위치 기준

- 공용 컴포넌트는 `components/common`에 둔다.
- dashboard에서만 쓰는 컴포넌트는 `components/dashboard`에 둔다.
- meeting 도메인에서만 쓰는 컴포넌트는 `components/meeting`에 둔다.
- Button, Dialog, Sonner처럼 도메인 의미가 없는 기본 UI는 `components/ui`에 둔다.
- 전역 Provider는 `components/providers`에 둔다.

## Constants / 옵션 데이터

화면에서 사용하는 고정 옵션 pool은 컴포넌트 안에 직접 선언하지 않고 `constants/`에 둔다.

- 온보딩 직종, 경력, 기술 스택 옵션은 `constants/onboarding.ts`에서 관리한다.
- 옵션을 추가하거나 삭제할 때는 `ONBOARDING_*_OPTIONS` 배열만 수정한다.
- 컴포넌트에서는 constants를 import해서 사용한다.
- 옵션 배열은 `as const`로 고정하고, 필요한 경우 union type을 함께 export한다.
- API payload나 validation에서 같은 옵션이 필요하면 같은 constants 파일을 재사용한다.

```ts
import {
  ONBOARDING_JOB_OPTIONS,
  ONBOARDING_TECH_STACK_OPTIONS,
} from "@/constants/onboarding"
```

온보딩 옵션 확장 예시:

```ts
export const ONBOARDING_JOB_OPTIONS = [
  "프론트엔드 개발자",
  "백엔드 개발자",
  "새 직종",
] as const

export type OnboardingJob = (typeof ONBOARDING_JOB_OPTIONS)[number]
```

## Zustand 상태 관리

Zustand는 클라이언트 전역 상태에만 사용한다.
서버에서 받아오는 데이터는 Zustand에 넣지 말고 TanStack Query로 관리한다.

- store 파일은 `stores/*-store.ts`로 만든다.
- store 생성은 `stores/create-store.ts`의 `createAppStore`를 사용한다.
- 새 store를 만들면 `stores/index.ts`에서 export한다.
- store 이름은 devtools에서 구분되도록 명확히 작성한다.
- persist는 꼭 새로고침 후에도 유지되어야 하는 값에만 사용한다.
- store action 이름은 동사로 시작한다. 예: `setUser`, `clearUser`, `open`, `close`, `reset`

```ts
import { createAppStore } from "@/stores/create-store"

type ExampleState = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export const useExampleStore = createAppStore<ExampleState>("example-store", (set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))
```

현재 기본 store:

- `stores/create-store.ts`: Zustand store 생성 공통 helper
- `stores/auth-store.ts`: 인증 사용자 클라이언트 상태
- `stores/index.ts`: store export 모음

## API 요청 규칙

백엔드 API는 공통 응답 형식을 사용한다.

```json
{
  "status": "success",
  "data": {}
}
```

`lib/api/api-fetch.ts`가 이 wrapper를 처리한다.

- `status: "success"`이면 `data`만 반환한다.
- `status: "fail"` 또는 `status: "error"`이면 `ApiFetchError`를 던진다.
- token이 있으면 `Authorization: Bearer {token}` header를 자동으로 붙인다.
- JSON 요청은 기본적으로 `Content-Type: application/json`을 붙인다.
- `FormData` 요청에는 `Content-Type`을 직접 설정하지 않는다.

### 클라이언트 API

브라우저/클라이언트 컴포넌트에서는 `apiClient` 또는 React Query hook을 사용한다.

```ts
import { apiClient } from "@/lib/api/api-client"

const data = await apiClient<ResponseData>("/api/users/me")
```

- 기본값은 `auth: true`이다.
- NextAuth 세션의 `accessToken`을 자동으로 읽어 Authorization header에 넣는다.
- 401이면 `/api/auth/refresh`를 호출한 뒤 같은 요청을 한 번 재시도한다.
- 인증이 필요 없는 요청에는 `{ auth: false }`를 넘긴다.

### 서버 API

서버에서 백엔드 API를 호출할 때는 `serverApiClient`를 사용한다.

```ts
import { serverApiClient } from "@/lib/api/server-api-client"

const data = await serverApiClient<ResponseData>("/api/users/me")
```

- `BACKEND_API_URL`을 사용한다.
- `getServerSession(authOptions)`에서 `accessToken`을 읽는다.
- 기본적으로 `cache: "no-store"`가 적용된다.

## React Query 규칙

- 서버 상태는 TanStack Query로 관리한다.
- 반복되는 API 요청은 `hooks/api/use-api-query.ts`의 공용 hook을 사용한다.
- 도메인별 API는 별도 hook으로 감싼다.
- query key는 `hooks/api/query-keys.ts`에 추가해서 재사용한다.
- mutation 성공 후에는 관련 query를 invalidate한다.
- 로딩, 에러, 빈 상태 UI를 가능한 범위에서 함께 처리한다.

```ts
import { useApiMutation, useApiQuery } from "@/hooks/api/use-api-query"

const query = useApiQuery<ResponseData>(["resource"], "/api/resource")

const mutation = useApiMutation<CreateResponse, CreatePayload>("/api/resource", {
  onSuccess: () => {
    // queryClient.invalidateQueries(...)
  },
})
```

## Toast / 알림 규칙

토스트 호출은 `sonner`를 직접 import하지 말고 `@/lib/notify`의 `notify` helper를 사용한다.
전역 Toaster는 `@/components/ui/sonner`의 shadcn wrapper를 사용한다.

```ts
import { notify } from "@/lib/notify"

notify.success("저장되었습니다.")
notify.error("저장에 실패했습니다.")
notify.info("안내 메시지")
notify.warning("확인이 필요합니다.")
```

로딩 토스트를 갱신할 때는 반환된 id를 재사용한다.

```ts
const toastId = notify.loading("처리 중입니다.")

try {
  await action()
  notify.success("완료되었습니다.", { id: toastId })
} catch {
  notify.error("실패했습니다.", { id: toastId })
}
```

Promise 기반 작업은 `notify.promise`를 사용할 수 있다.

```ts
notify.promise(createMeeting(payload), {
  loading: "모임을 만드는 중입니다.",
  success: "모임이 생성되었습니다.",
  error: "모임 생성에 실패했습니다.",
})
```

OAuth처럼 redirect가 있는 로그인 흐름은 버튼 클릭 지점에서 성공 알림을 띄우지 않는다.
`rememberLoginProvider()`로 provider를 저장하고, `ToastProvider`의 세션 감지 로직이 복귀 후 알림을 띄우게 한다.

## 에러 처리

- catch 블록을 비워두지 않는다.
- 사용자에게 보여줄 메시지는 사람이 이해할 수 있는 문장으로 변환한다.
- 에러 객체를 그대로 화면에 노출하지 않는다.
- 예상 가능한 에러는 분기 처리한다.
- 사용자 액션 실패는 가능하면 toast로 알려준다.

## 타입 작성

- `any`는 사용하지 않는다.
- 불가피하게 타입을 바로 알 수 없으면 `unknown`을 사용하고 좁혀서 처리한다.
- API 응답 타입과 요청 payload 타입은 분리한다.
- 컴포넌트 props, hook 반환 타입, API payload에는 타입 이름을 붙인다.
- 백엔드 enum성 문자열은 가능하면 union type으로 관리한다.

```ts
type AuthStatus = "LOGIN_SUCCESS" | "ONBOARDING_REQUIRED"
```

## UI 스타일

- 기존 shadcn/ui 컴포넌트와 `components/ui`를 우선 사용한다.
- className 조합은 `cn()`을 사용한다.
- 공통 UI 패턴은 화면마다 복붙하지 말고 `components/common` 또는 `components/ui`로 분리한다.
- 모바일과 데스크톱 레이아웃을 함께 고려한다.
- 버튼, 입력, 다이얼로그에는 적절한 label, title, aria 속성을 사용한다.

```tsx
<Button className={cn("w-full", isActive && "bg-primary")}>
  저장
</Button>
```

## 전역 Provider 구조

전역 provider는 `app/layout.tsx`에서 연결한다.

- `AuthProvider`: NextAuth 세션 제공
- `QueryProvider`: TanStack Query 제공
- `ThemeProvider`: 테마 제공
- `ToastProvider`: shadcn sonner 전역 Toaster 및 인증 알림 이벤트 제공

새 전역 기능을 추가할 때는 provider 순서와 클라이언트/서버 컴포넌트 경계를 확인한다.

## 인증 / 소셜 로그인 명세

소셜 인증은 NextAuth가 담당하고, NextAuth callback에서 백엔드 `/api/auth/social-login`을 호출한다.

현재 백엔드 명세 기준:

- 기존 회원: `authStatus: "LOGIN_SUCCESS"`, `accessToken`, `user`
- 신규 회원: `authStatus: "ONBOARDING_REQUIRED"`, `accessToken`, `user`
- 신규 회원도 `tempToken`을 사용하지 않는다.
- 온보딩 완료 API는 `Authorization: Bearer {accessToken}`으로 인증한다.
- 온보딩 요청 body에는 `nickname`, `job`, `career`, `techStacks`, `introduction`만 보낸다.

관련 파일:

- `lib/auth/options.ts`: NextAuth callback과 세션 저장
- `lib/auth/backend.ts`: 백엔드 소셜 로그인/온보딩 요청 타입과 함수
- `app/api/auth/onboarding/route.ts`: 프론트 내부 온보딩 route
- `hooks/useAuthUser.ts`: 화면에서 쓰는 현재 유저 hook
- `hooks/auth/use-auth-user-query.ts`: `/api/users/me` 조회 hook

## 온보딩 유효성

온보딩 입력은 프론트 UI와 내부 route에서 모두 검증한다.

- `nickname`: trim 후 2자 이상 10자 이하
- `job`: 필수
- `career`: 필수
- `techStacks`: 1개 이상
- `introduction`: 선택, trim 후 50자 이하, 비어 있으면 `null`

## 문서

관련 문서:

- `docs/frontend-auth-api-guide.md`: 인증/API 요청 가이드
- `docs/toast-guide.md`: toast 사용 가이드

새 공통 패턴을 추가하면 문서와 이 파일을 함께 업데이트한다.
