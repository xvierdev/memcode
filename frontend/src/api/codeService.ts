import { httpClient } from './httpClient'
import type {
  CodeComment,
  CodeCommentPayload,
  CodeSearchFilters,
  CodeSnippet,
  CodeSnippetPayload,
  CodeUpdatePayload,
} from '../types/code'

export async function getAllCodes(): Promise<CodeSnippet[]> {
  const { data } = await httpClient.get<CodeSnippet[]>('/codes')
  return data
}

export async function searchCodes(
  filters: CodeSearchFilters,
): Promise<CodeSnippet[]> {
  const params = Object.fromEntries(
    Object.entries(filters)
      .map(([field, value]) => [field, value.trim()])
      .filter(([, value]) => value.length > 0),
  )
  const { data } = await httpClient.get<CodeSnippet[]>('/codes/search', {
    params,
  })
  return data
}

export async function getCode(codeId: string): Promise<CodeSnippet> {
  const { data } = await httpClient.get<CodeSnippet>(
    `/codes/${encodeURIComponent(codeId)}`,
  )
  return data
}

export async function createCode(
  payload: CodeSnippetPayload,
): Promise<CodeSnippet> {
  const { data } = await httpClient.post<CodeSnippet>('/codes', payload)
  return data
}

export async function updateCode(
  codeId: string,
  payload: CodeUpdatePayload,
): Promise<CodeSnippet> {
  const { data } = await httpClient.put<CodeSnippet>(
    `/codes/${encodeURIComponent(codeId)}`,
    payload,
  )
  return data
}

export async function addCodeComment(
  codeId: string,
  payload: CodeCommentPayload,
): Promise<CodeComment> {
  const { data } = await httpClient.post<CodeComment>(
    `/codes/${encodeURIComponent(codeId)}/comments`,
    payload,
  )
  return data
}

export async function updateCodeComment(
  codeId: string,
  commentId: string,
  payload: CodeCommentPayload,
): Promise<CodeComment> {
  const { data } = await httpClient.patch<CodeComment>(
    `/codes/${encodeURIComponent(codeId)}/comments/${encodeURIComponent(commentId)}`,
    payload,
  )
  return data
}

export async function deleteCodeComment(
  codeId: string,
  commentId: string,
): Promise<void> {
  await httpClient.delete(
    `/codes/${encodeURIComponent(codeId)}/comments/${encodeURIComponent(commentId)}`,
  )
}

export async function deleteCode(
  codeId: string,
  password: string,
): Promise<void> {
  await httpClient.delete(`/codes/${encodeURIComponent(codeId)}`, {
    data: { password },
  })
}
