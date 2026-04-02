import clsx from 'clsx'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextInput({ label, error, className, ...props }: TextInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium tracking-tight text-stone-900">
        {label}
      </label>
      <input
        className={clsx(
          'input-shell',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
            : '',
          className
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-rose-700">{error}</p> : null}
    </div>
  )
}
