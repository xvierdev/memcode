import { useState } from 'react'
import type { SubmitEvent } from 'react'
import type { AuthCredentials } from '../../types/auth'
import AuthFeedback from './AuthFeedback'
import AuthField from './AuthField'

type LoginFormProps = {
  errorMessage: string | null
  isSubmitting: boolean
  onSubmit: (credentials: AuthCredentials) => void
}

export default function LoginForm({
  errorMessage,
  isSubmitting,
  onSubmit,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
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
        autoComplete="current-password"
        id="password"
        label="Senha"
        onChange={setPassword}
        placeholder="Digite sua senha"
        type="password"
        value={password}
      />

      {errorMessage && <AuthFeedback message={errorMessage} type="error" />}

      <button
        className="h-12 w-full rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white transition hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 active:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
