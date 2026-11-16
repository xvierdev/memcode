import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { createCode, getCode, updateCode } from '../api/codeService'
import CodeEditorForm from '../components/library/CodeEditorForm'
import type {
  CodeSearchNavigationState,
  CodeSnippet,
  CodeSnippetPayload,
} from '../types/code'
import { getApiErrorMessage } from '../utils/getApiErrorMessage'
import { readCodeSearchNavigationState } from '../utils/codeSearchNavigation'

export default function CodeEditorPage() {
  const { codeId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [returnState] = useState<CodeSearchNavigationState | null>(() =>
    readCodeSearchNavigationState(location.state),
  )
  const [loadedCode, setLoadedCode] = useState<{
    id: string
    code: CodeSnippet
  } | null>(null)
  const [loadError, setLoadError] = useState<{
    id: string
    message: string
  } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!codeId) {
      return
    }

    let isMounted = true
    getCode(codeId)
      .then((loadedCode) => {
        if (isMounted) {
          setLoadedCode({ id: codeId, code: loadedCode })
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setLoadError({
            id: codeId,
            message: getApiErrorMessage(
              error,
              'Não foi possível carregar o código.',
            ),
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [codeId])

  const code =
    loadedCode && loadedCode.id === codeId ? loadedCode.code : null
  const loadErrorMessage =
    loadError && loadError.id === codeId ? loadError.message : null
  const isLoading = Boolean(codeId) && !code && !loadErrorMessage

  function handleCancel() {
    if (codeId) {
      void navigate(`/codes/${encodeURIComponent(codeId)}`, {
        state: returnState ?? undefined,
      })
      return
    }

    void navigate('/dashboard', { state: returnState ?? undefined })
  }

  async function handleSave(payload: CodeSnippetPayload) {
    if (codeId && !code) {
      return
    }

    setSaveError(null)
    setIsSaving(true)

    try {
      const savedCode = codeId
        ? await updateCode(codeId, {
            ...payload,
            comments: code?.comments ?? [],
          })
        : await createCode(payload)
      void navigate(`/codes/${encodeURIComponent(savedCode.id)}`, {
        replace: true,
        state: returnState ?? undefined,
      })
    } catch (error: unknown) {
      setSaveError(
        getApiErrorMessage(
          error,
          codeId
            ? 'Não foi possível salvar as alterações.'
            : 'Não foi possível adicionar o código.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const isEditing = Boolean(codeId)
  const pageTitle = isEditing ? 'Editar código' : 'Adicionar código'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-amber-700">Memcode</p>
            <h1 className="text-xl font-semibold">{pageTitle}</h1>
          </div>
          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            disabled={isSaving}
            onClick={handleCancel}
            type="button"
          >
            Voltar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
        {isLoading && (
          <p className="py-10 text-center text-slate-600" role="status">
            Carregando código...
          </p>
        )}

        {!isLoading && loadErrorMessage && (
          <p
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {loadErrorMessage}
          </p>
        )}

        {!isLoading && !loadErrorMessage && (
          <section aria-labelledby="editor-heading" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold" id="editor-heading">
                {pageTitle}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Preencha os dados do trecho de código.
              </p>
            </div>
            <CodeEditorForm
              code={code}
              errorMessage={saveError}
              isSaving={isSaving}
              key={code?.id ?? 'new'}
              onCancel={handleCancel}
              onSubmit={(payload) => void handleSave(payload)}
              submitLabel={isEditing ? 'Salvar alterações' : 'Adicionar código'}
            />
          </section>
        )}
      </main>
    </div>
  )
}
