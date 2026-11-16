import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  addCodeComment,
  deleteCode,
  getCode,
} from '../api/codeService'
import CodeDeleteDialog from '../components/library/CodeDeleteDialog'
import CodeCommentItem from '../components/library/CodeCommentItem'
import CopyCodeButton from '../components/library/CopyCodeButton'
import type {
  CodeComment,
  CodeSearchNavigationState,
  CodeSnippet,
} from '../types/code'
import { getApiErrorMessage } from '../utils/getApiErrorMessage'
import { readCodeSearchNavigationState } from '../utils/codeSearchNavigation'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function CodeDetailsPage() {
  const { codeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [returnState] = useState<CodeSearchNavigationState | null>(() =>
    readCodeSearchNavigationState(location.state),
  )
  const [code, setCode] = useState<CodeSnippet | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(codeId))
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!codeId) {
      return
    }

    let isMounted = true
    getCode(codeId)
      .then((loadedCode) => {
        if (isMounted) {
          setCode(loadedCode)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            getApiErrorMessage(error, 'Não foi possível carregar o código.'),
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [codeId])

  async function handleAddComment(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const comment = newComment.trim()
    if (!codeId || !code || !comment) {
      return
    }

    setCommentError(null)
    setIsAddingComment(true)

    try {
      const addedComment = await addCodeComment(codeId, { text: comment })
      setCode((currentCode) =>
        currentCode
          ? {
              ...currentCode,
              comments: [addedComment, ...currentCode.comments],
            }
          : currentCode,
      )
      setNewComment('')
    } catch (error: unknown) {
      setCommentError(
        getApiErrorMessage(error, 'Não foi possível adicionar o comentário.'),
      )
    } finally {
      setIsAddingComment(false)
    }
  }

  function handleCommentUpdated(updatedComment: CodeComment) {
    setCode((currentCode) =>
      currentCode
        ? {
            ...currentCode,
            comments: currentCode.comments.map((comment) =>
              comment.id === updatedComment.id ? updatedComment : comment,
            ),
          }
        : currentCode,
    )
  }

  function handleCommentDeleted(commentId: string) {
    setCode((currentCode) =>
      currentCode
        ? {
            ...currentCode,
            comments: currentCode.comments.filter(
              (comment) => comment.id !== commentId,
            ),
          }
        : currentCode,
    )
  }

  async function handleDelete(password: string) {
    if (!codeId) {
      return
    }

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      await deleteCode(codeId, password)
      void navigate('/dashboard', {
        replace: true,
        state: returnState ?? undefined,
      })
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, 'Não foi possível excluir o código.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  function handleBack() {
    void navigate('/dashboard', { state: returnState ?? undefined })
  }

  function handleEdit() {
    if (!code) {
      return
    }

    void navigate(`/codes/${encodeURIComponent(code.id)}/edit`, {
      state: returnState ?? undefined,
    })
  }

  const loadErrorMessage = codeId ? errorMessage : 'Código não encontrado.'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-amber-700">Memcode</p>
            <h1 className="text-xl font-semibold">Detalhes do código</h1>
          </div>
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            onClick={handleBack}
            type="button"
          >
            Voltar aos resultados
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
        {isLoading && (
          <p className="py-10 text-center text-slate-600" role="status">
            Carregando código...
          </p>
        )}

        {!isLoading && loadErrorMessage && !code && (
          <p
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {loadErrorMessage}
          </p>
        )}

        {!isLoading && code && (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{code.title}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {code.description || 'Sem descrição.'}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
                {code.language}
              </span>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-semibold">Código</h3>
                <CopyCodeButton code={code.code} key={code.id} />
              </div>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-100">
                <code>{code.code}</code>
              </pre>
            </div>

            <section className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">Comentários</h3>
                <span className="text-sm text-slate-500">
                  Mais recentes primeiro
                </span>
              </div>

              <form
                className="mt-4 space-y-3 border-b border-slate-200 pb-4"
                onSubmit={handleAddComment}
              >
                <label
                  className="block text-sm font-medium text-slate-700"
                  htmlFor="new-code-comment"
                >
                  Novo comentário
                </label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  disabled={isAddingComment}
                  id="new-code-comment"
                  onChange={(event) => setNewComment(event.currentTarget.value)}
                  placeholder="Escreva uma observação sobre este código"
                  rows={3}
                  value={newComment}
                />
                {commentError && (
                  <p
                    className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {commentError}
                  </p>
                )}
                <button
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isAddingComment || !newComment.trim()}
                  type="submit"
                >
                  {isAddingComment ? 'Adicionando...' : 'Adicionar comentário'}
                </button>
              </form>

              {code.comments.length > 0 ? (
                <ul
                  aria-label="Comentários, mais recentes primeiro"
                  className="mt-2 space-y-2"
                >
                  {code.comments.map((comment) => (
                    <CodeCommentItem
                      codeId={code.id}
                      comment={comment}
                      key={comment.id}
                      onDelete={handleCommentDeleted}
                      onUpdate={handleCommentUpdated}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Nenhum comentário registrado.
                </p>
              )}
            </section>

            <p className="mt-6 text-xs text-slate-500">
              Atualizado em {dateFormatter.format(new Date(code.updated_at))}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                onClick={handleEdit}
                type="button"
              >
                Editar
              </button>
              <button
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                onClick={() => {
                  setErrorMessage(null)
                  setConfirmDelete(true)
                }}
                type="button"
              >
                Excluir
              </button>
            </div>
          </article>
        )}
        {!isLoading && code && confirmDelete && (
          <CodeDeleteDialog
            codeTitle={code.title}
            errorMessage={errorMessage}
            isDeleting={isDeleting}
            onCancel={() => {
              setConfirmDelete(false)
              setErrorMessage(null)
            }}
            onConfirm={(password) => void handleDelete(password)}
          />
        )}
      </main>
    </div>
  )
}
