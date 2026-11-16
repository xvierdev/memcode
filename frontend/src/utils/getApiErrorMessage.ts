import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<{ detail?: unknown }>(error)) {
    return fallback
  }

  if (error.response === undefined) {
    return 'Não foi possível conectar à API. Verifique se ela está em execução.'
  }

  switch (error.response.status) {
    case 401:
      return 'Sua sessão expirou. Faça login novamente.'
    case 404:
      return 'O código solicitado não foi encontrado.'
    case 422:
      return 'Verifique os campos obrigatórios e tente novamente.'
    default: {
      const { detail } = error.response.data
      return typeof detail === 'string' ? detail : fallback
    }
  }
}
