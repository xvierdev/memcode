export default function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid size-10 place-items-center rounded-xl bg-amber-500 font-mono text-sm font-bold tracking-tight text-white"
      >
        {'</>'}
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        Memcode
      </span>
    </div>
  )
}
