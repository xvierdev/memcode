export type CodeSnippetPayload = {
  title: string
  description: string
  language: string
  code: string
  comments: string[]
}

export type CodeSnippet = CodeSnippetPayload & {
  id: string
  created_at: string
  updated_at: string
}

export type CodeSearchFilters = {
  title: string
  description: string
  language: string
  code: string
}

export type CodeSearchNavigationState = {
  filters: CodeSearchFilters
}
