import { httpClient } from './httpClient'
import type {
  CodeSearchFilters,
  CodeSnippet,
  CodeSnippetPayload,
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

export async function updateCode(
  codeId: string,
  payload: CodeSnippetPayload,
): Promise<CodeSnippet> {
  const { data } = await httpClient.put<CodeSnippet>(
    `/codes/${encodeURIComponent(codeId)}`,
    payload,
  )
  return data
}

export async function deleteCode(codeId: string): Promise<void> {
  await httpClient.delete(`/codes/${encodeURIComponent(codeId)}`)
}
