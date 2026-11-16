import { useState } from 'react'
import type { SubmitEvent } from 'react'
import type { AuthCredentials } from '../../types/auth'
import AuthFeedback from './AuthFeedback'
import AuthField from './AuthField'

type RegisterFormProps = {
  errorMessage: string | null
  isSubmitting: boolean
  onSubmit: (credentials: AuthCredentials) => void
}

export default function RegisterForm({
  errorMessage,
  isSubmitting,
  onSubmit,
}: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError(null)

    if (password !== passwordConfirmation) {
      setValidationError('As senhas não correspondem.')
      return
    }

    onSubmit({ email, password })
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <AuthField
        autoComplete="email"
        id="email"
        label="E-mail"
        onChange={setEmail}
        placeholder="voce@empresa.com"
        type="email"
        value={email}
      />
      <AuthField
        autoComplete="new-password"
        id="password"
        label="Senha"
        maxLength={128}
        minLength={8}
        onChange={setPassword}
        placeholder="Mínimo de 8 caracteres"
        type="password"
        value={password}
      />
      <AuthField
        autoComplete="new-password"
        id="password-confirmation"
        label="Confirmar senha"
        maxLength={128}
        minLength={8}
        onChange={setPasswordConfirmation}
        placeholder="Digite sua senha novamente"
        type="password"
        value={passwordConfirmation}
      />

      {validationError && (
        <AuthFeedback message={validationError} type="error" />
      )}
      {errorMessage && <AuthFeedback message={errorMessage} type="error" />}

      <button
        className="h-12 w-full rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white transition hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 active:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  )
}
