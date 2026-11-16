import { httpClient } from './httpClient'
import type { AuthCredentials } from '../types/auth'

export async function login(credentials: AuthCredentials): Promise<void> {
  await httpClient.post('/auth/login', credentials)
}

export async function createAccount(
  credentials: AuthCredentials,
): Promise<void> {
  await httpClient.post('/auth/register', credentials)
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout')
}
