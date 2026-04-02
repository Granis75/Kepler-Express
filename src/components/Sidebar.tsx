import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, FileText, LogOut, Receipt, Settings, Truck, Users } from 'lucide-react'
import clsx from 'clsx'
import { toast } from 'react-hot-toast'
import { useAuthState } from '../lib/auth'
import { appRoutes, publicRoutes } from '../lib/routes'
import { useWorkspaceState } from '../lib/workspace'

interface SidebarProps {
  onClose?: () => void
}

const navItems = [
  { label: 'Dashboard', href: appRoutes.dashboard, icon: BarChart3 },
  { label: 'Clients', href: appRoutes.clients, icon: Users },
  { label: 'Missions', href: appRoutes.missions, icon: Truck },
  { label: 'Expenses', href: appRoutes.expenses, icon: Receipt },
  { label: 'Invoices', href: appRoutes.invoices, icon: FileText },
  { label: 'Settings', href: appRoutes.settings, icon: Settings },
]

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate()
  const { signOut, user } = useAuthState()
  const { organization, profile } = useWorkspaceState()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError(null)

    try {
      await signOut()
      onClose?.()
      toast.success('Signed out.')
      navigate(publicRoutes.login, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign out.'
      setSignOutError(message)
      toast.error(message)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-stone-300/90 bg-white/90 shadow-sm">
            <BarChart3 className="h-5 w-5 text-teal-700" />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold tracking-tight text-stone-950">
              Kepler Express
            </p>
            <p className="truncate text-[11px] uppercase tracking-[0.24em] text-stone-500">
              {organization?.name ?? 'Internal workspace'}
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-stone-200 px-6 py-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Active workspace</p>
        <p className="mt-3 text-sm font-semibold text-stone-900">
          {profile?.name ?? user?.email ?? 'Signed in'}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-stone-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="capitalize">{profile?.role ?? 'workspace member'}</span>
        </div>
      </div>

      <div className="px-6 pt-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-stone-500">Navigation</p>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-4">
        {navItems.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'group flex items-center gap-3 rounded-[1.35rem] px-3 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-stone-950 text-white shadow-[0_14px_30px_rgba(28,25,23,0.18)]'
                  : 'text-stone-600 hover:bg-white/88 hover:text-stone-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-[1rem] transition',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'bg-stone-100 text-stone-600 group-hover:bg-stone-900 group-hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-stone-200 px-4 py-5">
        <button
          type="button"
          onClick={() => {
            void handleSignOut()
          }}
          disabled={isSigningOut}
          className="btn-secondary flex w-full"
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </button>
        {signOutError ? (
          <p className="mt-3 text-xs text-rose-700">{signOutError}</p>
        ) : (
          <p className="mt-3 px-1 text-xs leading-5 text-stone-500">
            Only live modules connected to the stable Supabase schema are exposed here.
          </p>
        )}
      </div>
    </div>
  )
}
