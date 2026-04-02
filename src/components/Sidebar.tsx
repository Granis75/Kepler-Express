import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  MapPin,
  CreditCard,
  Settings,
  Gauge,
  LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuthState } from '../lib/auth'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Missions', href: '/missions', icon: <MapPin size={20} /> },
  { label: 'Clients', href: '/clients', icon: <Users size={20} /> },
  { label: 'Expenses', href: '/expenses', icon: <CreditCard size={20} /> },
  { label: 'Vehicles', href: '/vehicles', icon: <Truck size={20} /> },
  { label: 'Drivers', href: '/drivers', icon: <Package size={20} /> },
  { label: 'Invoices', href: '/invoices', icon: <Gauge size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { user, profile, organization, signOut } = useAuthState()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError(null)

    try {
      await signOut()
      onClose?.()
      navigate('/login', { replace: true })
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo Area */}
      <div className="px-6 py-8 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Gauge size={24} className="text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Kepler Ops</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">Logistics Operations</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )
            }
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 px-6 py-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Session</p>
          <p className="text-sm text-gray-900 mt-1 truncate">
            {profile?.name ?? user?.email ?? 'Signed in'}
          </p>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {organization?.name ?? user?.email ?? 'Workspace'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <LogOut size={16} />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </button>
        {signOutError && <p className="text-xs text-red-600">{signOutError}</p>}
        <p className="text-xs text-gray-500">Internal operations workspace</p>
      </div>
    </div>
  )
}
