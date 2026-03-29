import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import * as expensesService from '../data/expenses'
import type { CreateExpenseInput } from '../../types'
import { toast } from 'react-hot-toast'

// Queries
export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.list(),
    queryFn: () => expensesService.listExpenses(),
  })
}

// Mutations
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expensesService.createExpense(input),
    onSuccess: (newExpense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all() })
      toast.success('Expense recorded')
      return newExpense
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create expense'
      toast.error(message)
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: CreateExpenseInput
    }) => expensesService.updateExpense(id, input),
    onSuccess: (updatedExpense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all() })
      toast.success('Expense updated')
      return updatedExpense
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update expense'
      toast.error(message)
    },
  })
}
