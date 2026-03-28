import clsx from 'clsx'

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextInput({ label, error, className, ...props }: TextInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1.5">
        {label}
      </label>
      <input
        className={clsx(
          'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500',
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
