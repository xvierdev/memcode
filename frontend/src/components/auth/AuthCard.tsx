import type { ReactNode } from 'react'
import Brand from '../Brand'

type AuthCardProps = {
  children: ReactNode
  footer: ReactNode
  successMessage?: string | null
  title: string
}

export default function AuthCard({
  children,
  footer,
  successMessage,
  title,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-amber-50/60 px-4 py-8">
      <section
        aria-labelledby="auth-title"
        className="w-full max-w-105 rounded-2xl border border-amber-100 bg-white p-7 shadow-xl shadow-amber-950/5 sm:p-10"
      >
        <div className="mb-9">
          <Brand />
        </div>

        <h1
          className="mb-8 text-3xl font-semibold tracking-tight text-slate-900"
          id="auth-title"
        >
          {title}
        </h1>

        {successMessage && (
          <p
            className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            {successMessage}
          </p>
        )}

        {children}

        <div className="mt-7 border-t border-amber-100 pt-5 text-center text-sm text-slate-500">
          {footer}
        </div>
      </section>
    </main>
  )
}
