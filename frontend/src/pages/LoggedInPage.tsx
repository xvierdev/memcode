import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/authService'
import { getAuthErrorMessage } from '../utils/getAuthErrorMessage'

export default function LoggedInPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setErrorMessage(null)
    setIsLoggingOut(true)

    try {
      await logout()
      void navigate('/login', { replace: true })
    } catch (error: unknown) {
      setErrorMessage(
        getAuthErrorMessage(error, 'Não foi possível fazer logout.'),
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <main>
      <h1>Login realizado com sucesso</h1>
      <p>Você está logado.</p>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      <button
        disabled={isLoggingOut}
        onClick={() => void handleLogout()}
        type="button"
      >
        {isLoggingOut ? 'Saindo...' : 'Logout'}
      </button>
    </main>
  )
}
