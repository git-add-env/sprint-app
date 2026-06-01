import { getToken } from "next-auth/jwt"
import { type NextRequest, NextResponse } from "next/server"

import { ApiFetchError } from "@/lib/api/api-fetch"
import { completeSocialOnboardingWithMeta } from "@/lib/auth/backend"

const NICKNAME_MIN_LENGTH = 2
const NICKNAME_MAX_LENGTH = 10
const INTRODUCTION_MAX_LENGTH = 50

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.accessToken) {
    return NextResponse.json({ message: "온보딩 세션이 없습니다." }, { status: 401 })
  }

  const body = (await request.json()) as {
    nickname?: string
    job?: string
    career?: string
    techStacks?: string[]
    introduction?: string | null
  }

  const nickname = body.nickname?.trim() ?? ""
  const introduction = body.introduction?.trim() || null
  const job = body.job ?? ""
  const career = body.career ?? ""
  const techStacks = Array.isArray(body.techStacks) ? body.techStacks : []
  const fields = {
    ...(!nickname ? { nickname: "닉네임은 필수입니다." } : {}),
    ...(
      nickname && (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH)
        ? { nickname: "닉네임은 2자 이상 10자 이하로 입력해주세요." }
        : {}
    ),
    ...(!job ? { job: "직종을 선택해주세요." } : {}),
    ...(!career ? { career: "경력을 선택해주세요." } : {}),
    ...(!techStacks.length ? { techStacks: "기술 스택을 1개 이상 선택해주세요." } : {}),
    ...(
      introduction && introduction.length > INTRODUCTION_MAX_LENGTH
        ? { introduction: "자기소개는 50자 이하로 입력해주세요." }
        : {}
    ),
  }

  if (Object.keys(fields).length > 0) {
    return NextResponse.json(
      {
        message: "필수 정보를 입력해주세요.",
        fields,
      },
      { status: 400 },
    )
  }

  try {
    const result = await completeSocialOnboardingWithMeta(token.accessToken, {
      nickname,
      job,
      career,
      techStacks,
      introduction,
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
