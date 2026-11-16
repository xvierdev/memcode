import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { deleteCodeComment, updateCodeComment } from '../../api/codeService'
import type { CodeComment } from '../../types/code'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'

type CodeCommentItemProps = {
  codeId: string
  comment: CodeComment
  onDelete: (commentId: string) => void
  onUpdate: (comment: CodeComment) => void
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

export default function CodeCommentItem({
  codeId,
  comment,
  onDelete,
  onUpdate,
}: CodeCommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const edited = comment.updated_at !== comment.created_at
  const timestamp = edited ? comment.updated_at : comment.created_at

  async function handleSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) {
      return
    }

    setErrorMessage(null)
    setIsSaving(true)

    try {
      const updatedComment = await updateCodeComment(codeId, comment.id, {
        text,
      })
      onUpdate(updatedComment)
      setDraft(updatedComment.text)
      setIsEditing(false)
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, 'Não foi possível editar o comentário.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setErrorMessage(null)
    setIsDeleting(true)

    try {
      await deleteCodeComment(codeId, comment.id)
      onDelete(comment.id)
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, 'Não foi possível remover o comentário.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  function cancelEdit() {
    setDraft(comment.text)
    setErrorMessage(null)
    setIsEditing(false)
  }

  return (
    <li className="rounded-lg bg-slate-50 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form className="space-y-2" onSubmit={handleSave}>
              <label className="sr-only" htmlFor={`comment-${comment.id}`}>
                Editar comentário
              </label>
              <textarea
                className={inputClassName}
                disabled={isSaving}
                id={`comment-${comment.id}`}
                onChange={(event) => setDraft(event.currentTarget.value)}
                rows={3}
                value={draft}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
                  disabled={isSaving || !draft.trim()}
                  type="submit"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-60"
                  disabled={isSaving}
                  onClick={cancelEdit}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {comment.text}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-1 sm:ml-auto">
          <time
            className="mr-2 whitespace-nowrap text-xs text-slate-500"
            dateTime={timestamp}
          >
            {edited ? 'Editado' : 'Criado'} {dateFormatter.format(new Date(timestamp))}
          </time>
          {!isEditing && (
            <>
              <button
                aria-label="Editar comentário"
                className="grid size-8 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => {
                  setErrorMessage(null)
                  setIsEditing(true)
                }}
                title="Editar comentário"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="m14 5 5 5M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                  />
                </svg>
              </button>
              <button
                aria-label="Excluir comentário"
                className="grid size-8 place-items-center rounded-lg text-slate-600 hover:bg-white hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
                title="Excluir comentário"
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      {errorMessage && (
        <p
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </li>
  )
}
