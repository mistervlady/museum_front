const TOKEN_KEY = 'museum_staff_token'

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

export const getStoredToken = (): string | null => {
  if (!canUseStorage()) return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export const setStoredToken = (token: string | null) => {
  if (!canUseStorage()) return
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export const clearStoredToken = () => setStoredToken(null)

export { TOKEN_KEY }
