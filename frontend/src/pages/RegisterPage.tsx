import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createAccount } from '../api/authService'
import AuthCard from '../components/auth/AuthCard'
import RegisterForm from '../components/auth/RegisterForm'
import type { AuthCredentials } from '../types/auth'
import { getAuthErrorMessage } from '../utils/getAuthErrorMessage'

export default function RegisterPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleRegister(credentials: AuthCredentials) {
    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      await createAccount(credentials)
      setSuccessMessage('Conta criada. Agora você pode entrar.')
    } catch (error: unknown) {
      setErrorMessage(
        getAuthErrorMessage(error, 'Não foi possível criar sua conta.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      footer={
        <p>
          Já tem uma conta?{' '}
          <Link
            className="font-semibold text-amber-700 hover:text-amber-800"
            to="/login"
          >
            Entrar
          </Link>
        </p>
      }
      successMessage={successMessage}
      title="Criar conta"
    >
      <RegisterForm
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={(credentials) => void handleRegister(credentials)}
      />
    </AuthCard>
  )
}
