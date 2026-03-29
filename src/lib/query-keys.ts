// Centralized query key factory for type-safe query invalidation

export const queryKeys = {
  all: ['app'],

  // Clients
  clients: {
    all: () => [...queryKeys.all, 'clients'],
    list: () => [...queryKeys.clients.all(), 'list'],
    detail: (id: string) => [...queryKeys.clients.all(), 'detail', id],
  },

  // Missions
  missions: {
    all: () => [...queryKeys.all, 'missions'],
    list: () => [...queryKeys.missions.all(), 'list'],
    detail: (id: string) => [...queryKeys.missions.all(), 'detail', id],
    byClient: (clientId: string) => [...queryKeys.missions.all(), 'client', clientId],
  },

  // Expenses
  expenses: {
    all: () => [...queryKeys.all, 'expenses'],
    list: () => [...queryKeys.expenses.all(), 'list'],
    detail: (id: string) => [...queryKeys.expenses.all(), 'detail', id],
    byMission: (missionId: string) => [...queryKeys.expenses.all(), 'mission', missionId],
    byDriver: (driverId: string) => [...queryKeys.expenses.all(), 'driver', driverId],
  },

  // Invoices
  invoices: {
    all: () => [...queryKeys.all, 'invoices'],
    list: () => [...queryKeys.invoices.all(), 'list'],
    detail: (id: string) => [...queryKeys.invoices.all(), 'detail', id],
    byClient: (clientId: string) => [...queryKeys.invoices.all(), 'client', clientId],
  },

  // Payments
  payments: {
    all: () => [...queryKeys.all, 'payments'],
    list: () => [...queryKeys.payments.all(), 'list'],
    detail: (id: string) => [...queryKeys.payments.all(), 'detail', id],
    byInvoice: (invoiceId: string) => [...queryKeys.payments.all(), 'invoice', invoiceId],
  },

  // Session
  session: {
    current: () => [...queryKeys.all, 'session', 'current'],
  },
}
