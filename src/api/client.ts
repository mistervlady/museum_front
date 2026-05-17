import axios, { AxiosHeaders } from 'axios'
import { clearStoredToken, getStoredToken } from '@/auth/token'

const api = axios.create({
  baseURL: '/api',
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders()
    }
    const headers = config.headers
    if (headers instanceof AxiosHeaders) {
      headers.set('Authorization', `Bearer ${token}`)
    } else {
      const headerRecord = headers as Record<string, string>
      headerRecord.Authorization = `Bearer ${token}`
    }
  }
  return config
})

const notifyUnauthorized = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

// Intercept errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (getStoredToken()) {
        clearStoredToken()
        notifyUnauthorized()
      }
    }
    if (err.response?.status === 502) {
      return Promise.reject(new Error('Похоже, пока гид не готов'))
    }
    const message: string =
      err.response?.data?.detail ?? err.message ?? 'Неизвестная ошибка'
    return Promise.reject(new Error(message))
  },
)

export default api
