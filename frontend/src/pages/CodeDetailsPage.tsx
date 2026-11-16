import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteCode,
  getCode,
  updateCode,
} from '../api/codeService'
import CodeEditorForm from '../components/library/CodeEditorForm'
import type {
  CodeSearchNavigationState,
  CodeSnippet,
  CodeSnippetPayload,
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(codeId))
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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

  async function handleSave(payload: CodeSnippetPayload) {
    if (!codeId) {
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      setCode(await updateCode(codeId, payload))
      setIsEditing(false)
      setSuccessMessage('Alterações salvas.')
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, 'Não foi possível salvar as alterações.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!codeId) {
      return
    }

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      await deleteCode(codeId)
      void navigate('/dashboard', {
        replace: true,
        state: returnState ?? undefined,
      })
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, 'Não foi possível excluir o código.'),
      )
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  function handleBack() {
    void navigate('/dashboard', { state: returnState ?? undefined })
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
          <>
            {isEditing ? (
              <CodeEditorForm
                code={code}
                errorMessage={errorMessage}
                isSaving={isSaving}
                onCancel={() => {
                  setIsEditing(false)
                  setErrorMessage(null)
                }}
                onSubmit={(payload) => void handleSave(payload)}
              />
            ) : (
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
                  <h3 className="mb-2 font-semibold">Código</h3>
                  <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-100">
                    <code>{code.code}</code>
                  </pre>
                </div>

                <section className="mt-6">
                  <h3 className="font-semibold">Comentários</h3>
                  {code.comments.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                      {code.comments.map((comment, index) => (
                        <li key={`${index}-${comment}`}>{comment}</li>
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

                {successMessage && (
                  <p
                    className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    role="status"
                  >
                    {successMessage}
                  </p>
                )}
                {errorMessage && (
                  <p
                    className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                    role="alert"
                  >
                    {errorMessage}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    onClick={() => setIsEditing(true)}
                    type="button"
                  >
                    Editar
                  </button>
                  <button
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    onClick={() => setConfirmDelete(true)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>

                {confirmDelete && (
                  <div
                    aria-labelledby="delete-confirmation-title"
                    className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"
                    role="alertdialog"
                  >
                    <h3
                      className="font-semibold text-red-900"
                      id="delete-confirmation-title"
                    >
                      Excluir este código?
                    </h3>
                    <p className="mt-1 text-sm text-red-800">
                      Esta ação não pode ser desfeita.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-800 hover:bg-white disabled:opacity-60"
                        disabled={isDeleting}
                        onClick={() => setConfirmDelete(false)}
                        type="button"
                      >
                        Cancelar
                      </button>
                      <button
                        className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                        disabled={isDeleting}
                        onClick={() => void handleDelete()}
                        type="button"
                      >
                        {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )}
          </>
        )}
      </main>
    </div>
  )
}
