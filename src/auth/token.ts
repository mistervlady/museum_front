// Token is kept only in memory to avoid clear-text persistence on disk.
let cachedToken: string | null = null

export const getStoredToken = (): string | null => cachedToken

export const setStoredToken = (token: string | null) => {
  cachedToken = token
}

export const clearStoredToken = () => {
  cachedToken = null
}
