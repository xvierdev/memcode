import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAllCodes, searchCodes } from '../api/codeService'
import { logout } from '../api/authService'
import CodeResults from '../components/library/CodeResults'
import CodeSearchSidebar from '../components/library/CodeSearchSidebar'
import type {
  CodeSearchFilters,
  CodeSnippet,
} from '../types/code'
import { getApiErrorMessage } from '../utils/getApiErrorMessage'
import { readCodeSearchNavigationState } from '../utils/codeSearchNavigation'

const emptyFilters: CodeSearchFilters = {
  title: '',
  description: '',
  language: '',
  code: '',
}

function normalizeFilters(filters: CodeSearchFilters): CodeSearchFilters {
  return {
    title: filters.title.trim(),
    description: filters.description.trim(),
    language: filters.language.trim(),
    code: filters.code.trim(),
  }
}

async function loadCodes(filters: CodeSearchFilters): Promise<CodeSnippet[]> {
  const hasFilters = Object.values(filters).some((value) => value.length > 0)
  return hasFilters ? searchCodes(filters) : getAllCodes()
}

export default function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [navigationState] = useState(() =>
    readCodeSearchNavigationState(location.state),
  )
  const initialFilters = navigationState?.filters ?? emptyFilters
  const [filters, setFilters] = useState(initialFilters)
  const [activeFilters, setActiveFilters] = useState(initialFilters)
  const [codes, setCodes] = useState<CodeSnippet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    loadCodes(initialFilters)
      .then((loadedCodes) => {
        if (isMounted) {
          setCodes(loadedCodes)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            getApiErrorMessage(error, 'Não foi possível carregar os códigos.'),
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
  }, [initialFilters])

  function handleFilterChange(field: keyof CodeSearchFilters, value: string) {
    setFilters((currentFilters) => ({ ...currentFilters, [field]: value }))
  }

  async function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const submittedFilters = normalizeFilters(filters)

    setFilters(submittedFilters)
    setActiveFilters(submittedFilters)
    setErrorMessage(null)
    setCodes([])
    setIsLoading(true)
    setIsSearching(true)

    try {
      setCodes(await loadCodes(submittedFilters))
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(error, 'Não foi possível pesquisar os códigos.'),
      )
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  function clearFilters() {
    setFilters({ ...emptyFilters })
    setErrorMessage(null)
  }

  function handleCodeDeleted(codeId: string) {
    setCodes((currentCodes) =>
      currentCodes.filter((code) => code.id !== codeId),
    )
  }

  async function handleLogout() {
    setLogoutError(null)
    setIsLoggingOut(true)

    try {
      await logout()
      void navigate('/login', { replace: true })
    } catch (error: unknown) {
      setLogoutError(
        getApiErrorMessage(error, 'Não foi possível encerrar a sessão.'),
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-amber-700">Memcode</p>
            <h1 className="text-xl font-semibold">Biblioteca de códigos</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              onClick={() =>
                void navigate('/codes/new', {
                  state: { filters: activeFilters },
                })
              }
              type="button"
            >
              Adicionar código
            </button>
            <button
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              type="button"
            >
              {isLoggingOut ? 'Saindo...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="order-2 min-w-0 flex-1 px-4 py-4 sm:px-6 lg:order-1 lg:py-6">
          <div className="mx-auto w-full max-w-screen-2xl">
            {logoutError && (
              <p
                className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {logoutError}
              </p>
            )}
            <CodeResults
              codes={codes}
              errorMessage={errorMessage}
              filters={activeFilters}
              isLoading={isLoading}
              onCodeDeleted={handleCodeDeleted}
            />
          </div>
        </div>
        <CodeSearchSidebar
          filters={filters}
          isExpanded={isFiltersOpen}
          isSearching={isSearching || isLoading}
          onChange={handleFilterChange}
          onClear={clearFilters}
          onSubmit={(event) => void handleSearch(event)}
          onToggle={() => setIsFiltersOpen((isOpen) => !isOpen)}
        />
      </main>
    </div>
  )
}
