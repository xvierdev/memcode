import { useState } from 'react'
import type { SubmitEvent } from 'react'
import type { CodeSnippet, CodeSnippetPayload } from '../../types/code'

type CodeEditorFormProps = {
  code: CodeSnippet | null
  errorMessage: string | null
  isSaving: boolean
  submitLabel: string
  onCancel: () => void
  onSubmit: (payload: CodeSnippetPayload) => void
}

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

export default function CodeEditorForm({
  code,
  errorMessage,
  isSaving,
  submitLabel,
  onCancel,
  onSubmit,
}: CodeEditorFormProps) {
  const [title, setTitle] = useState(code?.title ?? '')
  const [description, setDescription] = useState(code?.description ?? '')
  const [language, setLanguage] = useState(code?.language ?? '')
  const [content, setContent] = useState(code?.code ?? '')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      language: language.trim(),
      code: content,
    })
  }

  return (
    <form
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-1.5">
        <label className="block text-sm font-medium" htmlFor="code-title">
          Título
        </label>
        <input
          className={inputClassName}
          id="code-title"
          maxLength={160}
          minLength={1}
          onChange={(event) => setTitle(event.currentTarget.value)}
          required
          value={title}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium" htmlFor="code-description">
          Descrição
        </label>
        <textarea
          className={inputClassName}
          id="code-description"
          maxLength={2000}
          onChange={(event) => setDescription(event.currentTarget.value)}
          rows={3}
          value={description}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium" htmlFor="code-language">
          Linguagem
        </label>
        <input
          className={inputClassName}
          id="code-language"
          maxLength={80}
          minLength={1}
          onChange={(event) => setLanguage(event.currentTarget.value)}
          required
          value={language}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium" htmlFor="code-source">
          Código
        </label>
        <textarea
          className={`${inputClassName} font-mono`}
          id="code-source"
          onChange={(event) => setContent(event.currentTarget.value)}
          required
          rows={14}
          value={content}
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

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? 'Salvando...' : submitLabel}
        </button>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          disabled={isSaving}
          onClick={onCancel}
          type="button"
        >
          Voltar
        </button>
      </div>
    </form>
  )
}
