import type {
  CodeSearchFilters,
  CodeSearchNavigationState,
} from '../types/code'

function isCodeSearchFilters(value: unknown): value is CodeSearchFilters {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const filters = value as Record<string, unknown>
  return (
    typeof filters.title === 'string' &&
    typeof filters.description === 'string' &&
    typeof filters.language === 'string' &&
    typeof filters.code === 'string'
  )
}

export function readCodeSearchNavigationState(
  value: unknown,
): CodeSearchNavigationState | null {
  if (typeof value !== 'object' || value === null || !('filters' in value)) {
    return null
  }

  return isCodeSearchFilters(value.filters) ? { filters: value.filters } : null
}
