import { configureStore } from '@reduxjs/toolkit'
import sampleData from '../data/sample-data.json'
import { isAppData, isExpenseArray } from '../logic/data'
import expensesReducer from './expensesSlice'
import type { AppData, Member } from '../types'

const storageKey = 'trip-splitter-expenses'
const parsedSampleData: unknown = sampleData
const emptyData: AppData = { members: [], expenses: [] }
const defaultData = isAppData(parsedSampleData)
  ? parsedSampleData
  : emptyData

function loadExpenses() {
  const savedValue = localStorage.getItem(storageKey)

  if (savedValue === null) {
    return defaultData.expenses
  }

  try {
    const parsedValue: unknown = JSON.parse(savedValue)
    return isExpenseArray(parsedValue, defaultData.members) ? parsedValue : defaultData.expenses
  } catch {
    return defaultData.expenses
  }
}

export const store = configureStore({
  reducer: {
    members: (state: Member[] = defaultData.members) => state,
    expenses: expensesReducer,
  },
  preloadedState: {
    members: defaultData.members,
    expenses: { expenses: loadExpenses() },
  },
})

store.subscribe(() => {
  localStorage.setItem(storageKey, JSON.stringify(store.getState().expenses.expenses))
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
