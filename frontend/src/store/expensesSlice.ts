import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Expense } from '../types'

type ExpensesState = {
  expenses: Expense[]
}

const initialState: ExpensesState = {
  expenses: [],
}

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.expenses = action.payload
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.expenses.push(action.payload)
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.expenses = state.expenses.filter((expense) => expense.id !== action.payload)
    },
  },
})

export const { addExpense, deleteExpense, setExpenses } = expensesSlice.actions
export default expensesSlice.reducer
