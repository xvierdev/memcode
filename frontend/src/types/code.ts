export type CodeCommentPayload = {
  text: string
}

export type CodeComment = CodeCommentPayload & {
  id: string
  created_at: string
  updated_at: string
}

export type CodeSnippetPayload = {
  title: string
  description: string
  language: string
  code: string
}

export type CodeUpdatePayload = CodeSnippetPayload & {
  comments: CodeComment[]
}

export type CodeSnippet = CodeUpdatePayload & {
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
