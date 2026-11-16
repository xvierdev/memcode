import { Link } from 'react-router-dom'
import type {
  CodeSearchFilters,
  CodeSearchNavigationState,
  CodeSnippet,
} from '../../types/code'

type CodeResultsProps = {
  codes: CodeSnippet[]
  errorMessage: string | null
  filters: CodeSearchFilters
  isLoading: boolean
}

function getCodeExcerpt(code: string): string {
  const lines = code.split(/\r?\n/)
  const visibleLines = lines.slice(0, 5)
  if (lines.length > visibleLines.length) {
    visibleLines.push('...')
  }
  return visibleLines.join('\n')
}

export default function CodeResults({
  codes,
  errorMessage,
  filters,
  isLoading,
}: CodeResultsProps) {
  const navigationState: CodeSearchNavigationState = { filters }

  return (
    <section
      aria-labelledby="results-title"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2
          className="text-xl font-semibold text-slate-900"
          id="results-title"
        >
          Resultados
        </h2>
        {!isLoading && !errorMessage && (
          <span className="text-sm text-slate-500">
            {codes.length} {codes.length === 1 ? 'código' : 'códigos'}
          </span>
        )}
      </div>

      {isLoading && (
        <p className="py-10 text-center text-slate-600" role="status">
          Carregando códigos...
        </p>
      )}

      {!isLoading && errorMessage && (
        <p
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      {!isLoading && !errorMessage && codes.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
          <h3 className="font-semibold text-slate-800">
            Nenhum código encontrado
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Tente alterar ou remover alguns filtros para encontrar seus códigos.
          </p>
        </div>
      )}

      {!isLoading && !errorMessage && codes.length > 0 && (
        <ul className="space-y-3">
          {codes.map((code) => (
            <li key={code.id}>
              <Link
                className="block rounded-xl border border-slate-200 p-4 transition hover:border-amber-300 hover:bg-amber-50/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                state={navigationState}
                to={`/codes/${encodeURIComponent(code.id)}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{code.title}</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
                    {code.language}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {code.description || 'Sem descrição.'}
                </p>
                <pre className="mt-3 max-h-36 overflow-hidden rounded-lg bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
                  <code>{getCodeExcerpt(code.code)}</code>
                </pre>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
