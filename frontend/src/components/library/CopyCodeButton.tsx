import { useState } from 'react'

type CopyCodeButtonProps = {
  code: string
}

type CopyStatus = 'idle' | 'copied' | 'error'

export default function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  async function handleCopy() {
    if (!navigator.clipboard?.writeText) {
      setCopyStatus('error')
      return
    }

    try {
      await navigator.clipboard.writeText(code)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={copyStatus === 'copied' ? 'Código copiado' : 'Copiar código'}
        className="grid size-8 place-items-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
        onClick={() => void handleCopy()}
        title={copyStatus === 'copied' ? 'Copiado' : 'Copiar código'}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <rect
            height="13"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.75"
            width="13"
            x="8"
            y="8"
          />
          <path
            d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </button>
      {copyStatus === 'copied' && (
        <span className="text-xs text-emerald-700" role="status">
          Copiado
        </span>
      )}
      {copyStatus === 'error' && (
        <span className="text-xs text-red-700" role="alert">
          Não foi possível copiar o código.
        </span>
      )}
    </div>
  )
}
