type AuthFeedbackProps = {
  message: string
  type: 'error' | 'success'
}

export default function AuthFeedback({ message, type }: AuthFeedbackProps) {
  const styles =
    type === 'error'
      ? 'bg-red-50 text-red-700'
      : 'bg-amber-50 text-amber-900'

  return (
    <p
      className={`rounded-lg px-4 py-3 text-sm ${styles}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      {message}
    </p>
  )
}
