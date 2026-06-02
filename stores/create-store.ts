import { create, type StateCreator } from "zustand"
import { devtools } from "zustand/middleware"

export function createAppStore<T extends object>(
  name: string,
  initializer: StateCreator<T, [["zustand/devtools", never]], []>,
) {
  return create<T>()(
    devtools(initializer, {
      name,
      enabled: process.env.NODE_ENV === "development",
    }),
  )
}
