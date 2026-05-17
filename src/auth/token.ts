let cachedToken: string | null = null

export const getStoredToken = (): string | null => cachedToken

export const setStoredToken = (token: string | null) => {
  cachedToken = token
}

export const clearStoredToken = () => {
  cachedToken = null
}
