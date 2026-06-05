# Toast Guide

전역 알림은 shadcn sonner 래퍼와 `notify` 헬퍼를 기준으로 설정되어 있습니다.

## 사용법

클라이언트 컴포넌트나 클라이언트 훅에서는 `sonner`를 직접 import하지 말고 `notify`를 import해서 사용합니다.

```tsx
"use client"

import { notify } from "@/lib/notify"

export function SaveButton() {
  async function handleSave() {
    notify.success("저장되었습니다.")
  }

  return <button onClick={handleSave}>저장</button>
}
```

사용 가능한 기본 메서드는 다음과 같습니다.

```ts
notify.success("성공 메시지")
notify.error("실패 메시지")
notify.info("안내 메시지")
notify.warning("주의 메시지")
notify.loading("처리 중...")
notify.dismiss()
```

비동기 작업은 `notify.promise`로 감싸면 로딩, 성공, 실패 알림을 한 번에 처리할 수 있습니다.

```ts
notify.promise(createMeeting(payload), {
  loading: "모임을 만드는 중입니다.",
  success: "모임이 생성되었습니다.",
  error: "모임 생성에 실패했습니다.",
})
```

## 전역 Toaster

전역 Toaster는 `components/providers/toast-provider.tsx`에서 렌더링합니다.
`ToastProvider`는 `sonner` 패키지를 직접 import하지 않고 `@/components/ui/sonner`의 shadcn 래퍼를 사용합니다.

shadcn sonner 래퍼는 `components/ui/sonner.tsx`에 있으며 `next-themes`의 현재 테마와 전역 CSS 변수를 sonner에 연결합니다.

## 현재 적용된 인증 알림

- 소셜 로그인 성공
- 소셜 로그인 실패
- 신규 회원 온보딩 필요
- 온보딩 완료
- 온보딩 실패
- 로그아웃 처리
