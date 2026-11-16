import axios from 'axios'

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  if (error.response === undefined) {
    return 'Não foi possível conectar à API. Verifique se ela está em execução.'
  }

  switch (error.response.status) {
    case 401:
      return 'E-mail ou senha inválidos.'
    case 409:
      return 'Já existe uma conta cadastrada com este e-mail.'
    case 422:
      return 'Confira o formato do e-mail e os requisitos da senha.'
    default:
      return fallback
  }
}
