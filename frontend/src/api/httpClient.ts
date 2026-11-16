import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '/api')

export const httpClient = axios.create({
  baseURL,
  withCredentials: true,
})
