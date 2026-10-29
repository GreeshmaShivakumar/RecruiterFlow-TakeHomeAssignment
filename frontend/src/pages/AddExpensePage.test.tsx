import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import AddExpensePage from './AddExpensePage'
import ExpensesPage from './ExpensesPage'
import { setExpenses } from '../store/expensesSlice'
import { store } from '../store/store'

function renderForm(): void {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/expenses/new']}>
        <Routes>
          <Route element={<AddExpensePage />} path="/expenses/new" />
          <Route element={<ExpensesPage />} path="/" />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe('AddExpensePage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    store.dispatch(setExpenses([]))
  })

  it('shows errors and saves nothing for an invalid form', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    expect(screen.getByText('Description is required')).toBeTruthy()
    expect(screen.getByText('Enter a valid amount with up to 2 decimals')).toBeTruthy()
    expect(screen.getByText('Paid by is required')).toBeTruthy()
    expect(screen.getByText('Date is required')).toBeTruthy()
    expect(screen.getByText('Category is required')).toBeTruthy()
    expect(screen.getByText('Select at least one member')).toBeTruthy()
    expect(store.getState().expenses.expenses).toHaveLength(0)
  })

  it('saves a valid equal expense and shows the success message', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Description'), 'Team lunch')
    await user.type(screen.getByLabelText('Amount (₹)'), '100')
    await user.selectOptions(screen.getByLabelText('Paid by'), 'm1')
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-01' } })
    await user.selectOptions(screen.getByLabelText('Category'), 'Food')
    await user.click(screen.getAllByLabelText('Aarav')[0])
    await user.click(screen.getByRole('button', { name: 'Save expense' }))

    expect((await screen.findByRole('status')).textContent).toContain('Expense added')
    expect(store.getState().expenses.expenses).toHaveLength(1)
    expect(store.getState().expenses.expenses[0].amount).toBe(10000)
  })
})
