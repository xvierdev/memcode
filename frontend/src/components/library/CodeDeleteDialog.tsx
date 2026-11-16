import { useState } from 'react'
import type { SubmitEvent } from 'react'

type CodeDeleteDialogProps = {
  codeTitle: string
  errorMessage: string | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: (password: string) => void
}

export default function CodeDeleteDialog({
  codeTitle,
  errorMessage,
  isDeleting,
  onCancel,
  onConfirm,
}: CodeDeleteDialogProps) {
  const [password, setPassword] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onConfirm(password)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <section
        aria-labelledby="delete-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        role="dialog"
      >
        <h2
          className="text-lg font-semibold text-slate-900"
          id="delete-dialog-title"
        >
          Confirmar exclusão
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Para excluir <span className="font-medium">{codeTitle}</span>, informe
          sua senha atual.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor="delete-password"
            >
              Senha atual
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              disabled={isDeleting}
              id="delete-password"
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {errorMessage && (
            <p
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {errorMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={isDeleting}
              onClick={onCancel}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting || password.length === 0}
              type="submit"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir código'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
