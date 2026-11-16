import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/auth/AuthCard'
import LoginForm from '../components/auth/LoginForm'
import { login } from '../api/authService'
import type { AuthCredentials } from '../types/auth'
import { getAuthErrorMessage } from '../utils/getAuthErrorMessage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogin(credentials: AuthCredentials) {
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await login(credentials)
      void navigate('/dashboard', { replace: true })
    } catch (error: unknown) {
      setErrorMessage(
        getAuthErrorMessage(error, 'Não foi possível fazer login.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      footer={
        <p>
          Ainda não tem uma conta?{' '}
          <Link
            className="font-semibold text-amber-700 hover:text-amber-800"
            to="/register"
          >
            Criar conta
          </Link>
        </p>
      }
      title="Acesse sua conta"
    >
      <LoginForm
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={(credentials) => void handleLogin(credentials)}
      />
    </AuthCard>
  )
}
