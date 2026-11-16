import type { SubmitEvent } from 'react'
import type { CodeSearchFilters } from '../../types/code'

type FilterField = {
  key: keyof CodeSearchFilters
  label: string
  placeholder: string
}

type CodeSearchSidebarProps = {
  filters: CodeSearchFilters
  isExpanded: boolean
  isSearching: boolean
  onChange: (field: keyof CodeSearchFilters, value: string) => void
  onClear: () => void
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void
  onToggle: () => void
}

const fields: FilterField[] = [
  { key: 'title', label: 'Título', placeholder: 'Ex.: Busca binária' },
  {
    key: 'description',
    label: 'Descrição',
    placeholder: 'Parte da descrição',
  },
  { key: 'language', label: 'Linguagem', placeholder: 'Ex.: TypeScript' },
]

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'

export default function CodeSearchSidebar({
  filters,
  isExpanded,
  isSearching,
  onChange,
  onClear,
  onSubmit,
  onToggle,
}: CodeSearchSidebarProps) {
  return (
    <aside
      aria-label="Filtros de pesquisa"
      className={`order-1 flex w-full shrink-0 flex-col border-b border-slate-200 bg-white transition-[width] duration-200 lg:order-2 lg:border-b-0 lg:border-l ${isExpanded ? 'lg:w-80' : 'lg:w-16'}`}
    >
      <div
        className={`flex min-h-14 items-center border-b border-slate-100 px-4 py-3 ${isExpanded ? 'justify-between' : 'justify-end lg:justify-center'}`}
      >
        {isExpanded && (
          <h2 className="text-lg font-semibold text-slate-900">
            Filtros de pesquisa
          </h2>
        )}
        <button
          aria-controls="code-search-filters"
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? 'Recolher painel de filtros' : 'Expandir painel de filtros'
          }
          className="grid size-9 place-items-center text-black hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          onClick={onToggle}
          title={isExpanded ? 'Recolher filtros' : 'Expandir filtros'}
          type="button"
        >
          {/* Heroicons arrow-left, MIT licensed: https://github.com/tailwindlabs/heroicons/blob/master/LICENSE */}
          <svg
            aria-hidden="true"
            className={`size-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </button>
      </div>

      <form
        className="space-y-4 p-4 lg:p-5"
        hidden={!isExpanded}
        id="code-search-filters"
        onSubmit={onSubmit}
      >
        {fields.map(({ key, label, placeholder }) => (
          <div className="space-y-1.5" key={key}>
            <label
              className="block text-sm font-medium text-slate-700"
              htmlFor={`filter-${key}`}
            >
              {label}
            </label>
            <input
              className={inputClassName}
              id={`filter-${key}`}
              onChange={(event) => onChange(key, event.currentTarget.value)}
              placeholder={placeholder}
              type="search"
              value={filters[key]}
            />
          </div>
        ))}

        <div className="space-y-1.5">
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="filter-code"
          >
            Trecho do código
          </label>
          <textarea
            className={inputClassName}
            id="filter-code"
            onChange={(event) => onChange('code', event.currentTarget.value)}
            placeholder="Parte do código"
            rows={5}
            value={filters.code}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSearching}
            type="submit"
          >
            {isSearching ? 'Pesquisando...' : 'Pesquisar'}
          </button>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            disabled={isSearching}
            onClick={onClear}
            type="button"
          >
            Limpar
          </button>
        </div>
      </form>
    </aside>
  )
}
