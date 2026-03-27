import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
  sidebarOpen?: boolean
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 gap-4">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Toggle menu"
      >
        <Menu size={20} className="text-gray-700" />
      </button>
      <div className="flex-1" />
    </header>
  )
}
