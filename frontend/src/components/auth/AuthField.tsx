type AuthFieldProps = {
  autoComplete: string
  id: string
  label: string
  maxLength?: number
  minLength?: number
  onChange: (value: string) => void
  placeholder: string
  type: 'email' | 'password'
  value: string
}

export default function AuthField({
  autoComplete,
  id,
  label,
  maxLength,
  minLength,
  onChange,
  placeholder,
  type,
  value,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label
        className="block text-sm font-medium text-slate-700"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
        id={id}
        maxLength={maxLength}
        minLength={minLength}
        name={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </div>
  )
}
