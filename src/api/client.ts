import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercept errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 502) {
      return Promise.reject(new Error('Похоже, пока гид не готов'))
    }
    const message: string =
      err.response?.data?.detail ?? err.message ?? 'Неизвестная ошибка'
    return Promise.reject(new Error(message))
  },
)

export default api
