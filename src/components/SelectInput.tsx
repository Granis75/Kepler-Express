import clsx from 'clsx'

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
  error?: string
}

export function SelectInput({ label, options, error, className, ...props }: SelectInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1.5">
        {label}
      </label>
      <select
        className={clsx(
          'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-blue-500 appearance-none bg-white',
          error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500',
          className
        )}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
