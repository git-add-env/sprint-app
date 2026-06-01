"use client"

import { toast, type ExternalToast } from "sonner"

type ToastMessage = string

export const notify = {
  success(message: ToastMessage, options?: ExternalToast) {
    return toast.success(message, options)
  },
  error(message: ToastMessage, options?: ExternalToast) {
    return toast.error(message, options)
  },
  info(message: ToastMessage, options?: ExternalToast) {
    return toast.info(message, options)
  },
  warning(message: ToastMessage, options?: ExternalToast) {
    return toast.warning(message, options)
  },
  loading(message: ToastMessage, options?: ExternalToast) {
    return toast.loading(message, options)
  },
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: ToastMessage
      success: ToastMessage | ((data: T) => ToastMessage)
      error: ToastMessage | ((error: unknown) => ToastMessage)
    },
  ) {
    return toast.promise(promise, messages)
  },
  dismiss(id?: string | number) {
    toast.dismiss(id)
  },
}
