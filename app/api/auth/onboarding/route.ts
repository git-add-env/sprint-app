import { getToken } from "next-auth/jwt"
import { type NextRequest, NextResponse } from "next/server"

import { ApiFetchError } from "@/lib/api/api-fetch"
import { completeSocialOnboardingWithMeta } from "@/lib/auth/backend"

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.tempToken) {
    return NextResponse.json({ message: "온보딩 세션이 없습니다." }, { status: 401 })
  }

  const body = (await request.json()) as {
    nickname?: string
    job?: string
    career?: string
    techStacks?: string[]
    introduction?: string | null
  }

  if (!body.nickname || !body.job || !body.career || !body.techStacks?.length) {
    return NextResponse.json(
      {
        message: "필수 정보를 입력해주세요.",
        fields: {
          ...(!body.nickname ? { nickname: "닉네임은 필수입니다." } : {}),
          ...(!body.job ? { job: "직종을 선택해주세요." } : {}),
          ...(!body.career ? { career: "경력을 선택해주세요." } : {}),
          ...(!body.techStacks?.length ? { techStacks: "기술 스택을 1개 이상 선택해주세요." } : {}),
        },
      },
      { status: 400 },
    )
  }

  try {
    const result = await completeSocialOnboardingWithMeta(token.tempToken, {
      nickname: body.nickname,
      job: body.job,
      career: body.career,
      techStacks: body.techStacks,
      introduction: body.introduction ?? null,
    })
    const nextResponse = NextResponse.json(result.data)
    const setCookie = result.response.headers.get("set-cookie")

    if (setCookie) {
      nextResponse.headers.set("set-cookie", setCookie)
    }

    return nextResponse
  } catch (error) {
    if (error instanceof ApiFetchError) {
      return NextResponse.json(error.data ?? { message: error.message }, { status: error.status })
    }

    return NextResponse.json({ message: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
