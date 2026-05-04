import clsx from 'clsx'

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  error?: string
}

export function SelectInput({ label, options, error, className, ...props }: SelectInputProps) {
  const hasEmptyOption = options.some((option) => option.value === '')

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-950">
        {label}
      </label>
      <select
        className={clsx(
          'w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:ring-4',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
            : 'border-slate-300 focus:border-teal-700 focus:ring-teal-100',
          className
        )}
        {...props}
      >
        {!hasEmptyOption && <option value="">Select an option</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </div>
  )
}
