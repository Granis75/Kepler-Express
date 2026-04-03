export const appRoutes = {
  home: '/app',
  dashboard: '/app/dashboard',
  clients: '/app/clients',
  clientDetail: '/app/clients/:id',
  missions: '/app/missions',
  missionDetail: '/app/missions/:id',
  expenses: '/app/expenses',
  invoices: '/app/invoices',
  invoiceDetail: '/app/invoices/:id',
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

export function getClientDetailRoute(clientId: string) {
  return `${appRoutes.clients}/${clientId}`
}

export function getMissionDetailRoute(missionId: string) {
  return `${appRoutes.missions}/${missionId}`
}

export function getInvoiceDetailRoute(invoiceId: string) {
  return `${appRoutes.invoices}/${invoiceId}`
}
