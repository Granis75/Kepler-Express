export const appRoutes = {
  home: '/app',
  dashboard: '/app/dashboard',
  clients: '/app/clients',
  missions: '/app/missions',
  expenses: '/app/expenses',
  invoices: '/app/invoices',
  settings: '/app/settings',
} as const

export const publicRoutes = {
  landing: '/',
  login: '/login',
  signup: '/signup',
} as const

export function isAppRoute(pathname: string) {
  return pathname === '/app' || pathname.startsWith('/app/')
}
