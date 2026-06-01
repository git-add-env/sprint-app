import type { Account, NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

import { exchangeSocialLogin, type AppUser, type SocialProvider } from "@/lib/auth/backend"

function getProviderAccountId(account: Account) {
  return account.providerAccountId ?? account.provider
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      if (trigger === "update" && session?.accessToken) {
        token.accessToken = session.accessToken
        token.onboardingRequired = false
        token.appUser = session.user as AppUser
      }

      if (!account || !profile) {
        return token
      }

      const email = profile.email

      if (!email) {
        token.authError = "SOCIAL_EMAIL_NOT_FOUND"
        return token
      }

      try {
        const result = await exchangeSocialLogin({
          provider: account.provider as SocialProvider,
          providerId: getProviderAccountId(account),
          email,
          name: profile.name,
          image: "picture" in profile ? String(profile.picture ?? "") : token.picture,
        })

        if (result.authStatus === "LOGIN_SUCCESS") {
          token.accessToken = result.accessToken
          token.appUser = result.user
          token.onboardingRequired = false
          return token
        }

        token.onboardingRequired = true
        token.accessToken = result.accessToken
        token.appUser = result.user
        token.email = result.user.email
        return token
      } catch (error) {
        console.error("[auth] backend social login failed", error)
        token.authError = "BACKEND_SOCIAL_LOGIN_FAILED"
        return token
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.onboardingRequired = token.onboardingRequired
      session.authError = token.authError

      if (token.appUser) {
        session.user = token.appUser
      }

      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
