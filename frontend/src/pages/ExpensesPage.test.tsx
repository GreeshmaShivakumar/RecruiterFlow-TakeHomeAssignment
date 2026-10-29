import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { within } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import ExpensesPage from './ExpensesPage'
import { setExpenses } from '../store/expensesSlice'
import { store } from '../store/store'
import type { Expense } from '../types'

const expenses: Expense[] = [
  {
    id: 'food',
    description: 'Dinner',
    amount: 10000,
    paidBy: 'm1',
    date: '2026-03-14',
    category: 'Food',
    split: { type: 'equal', memberIds: ['m1', 'm2'] },
  },
  {
    id: 'travel',
    description: 'Cab',
    amount: 5000,
    paidBy: 'm2',
    date: '2026-03-15',
    category: 'Travel',
    split: { type: 'equal', memberIds: ['m1', 'm2'] },
  },
]

function renderPage(): void {
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ExpensesPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('ExpensesPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    store.dispatch(setExpenses(expenses))
  })

  it('filters expenses and updates the shown total', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.selectOptions(screen.getByLabelText('Category'), 'Food')

    expect(screen.getByText('Dinner')).toBeTruthy()
    expect(screen.queryByText('Cab')).toBeNull()
    const total = screen.getByText('Total shown:').parentElement
    expect(total).not.toBeNull()
    expect(total?.textContent).toContain('₹100.00')
  })

  it('shows each member share in the split details', async () => {
    const user = userEvent.setup()
    renderPage()

    const dinnerRow = screen.getByText('Dinner').closest('tr')
    expect(dinnerRow).not.toBeNull()
    if (dinnerRow === null) {
      throw new Error('Dinner row was not rendered')
    }

    await user.click(within(dinnerRow).getByRole('button', { name: 'View split for Dinner' }))

    const splitMenu = within(dinnerRow).getByRole('menu')
    expect(within(splitMenu).getByText('Aarav')).toBeTruthy()
    expect(within(splitMenu).getByText('Diya')).toBeTruthy()
    expect(within(splitMenu).getAllByText('₹50.00')).toHaveLength(2)
  })

  it('sorts expenses by amount when selected', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.selectOptions(screen.getByLabelText('Sort'), 'highest')

    const rows = screen.getAllByRole('row')
    expect(rows[1]?.textContent).toContain('Dinner')
  })

  it('confirms deletion and updates balances immediately', async () => {
    const user = userEvent.setup()
    renderPage()

    const dinnerRow = screen.getByText('Dinner').closest('tr')
    expect(dinnerRow).not.toBeNull()
    if (dinnerRow === null) {
      throw new Error('Dinner row was not rendered')
    }
    const deleteButton = within(dinnerRow).getByRole('button', { name: 'Delete' })

    await user.click(deleteButton)
    await user.click(screen.getByRole('button', { name: 'Yes' }))

    expect(screen.queryByText('Dinner')).toBeNull()
    expect(store.getState().expenses.expenses).toHaveLength(1)
    expect(screen.getByText('₹25.00')).toBeTruthy()
  })

  it('shows the settled empty state after the last expense is deleted', async () => {
    const user = userEvent.setup()
    store.dispatch(setExpenses([{
      ...expenses[0],
      split: { type: 'equal', memberIds: ['m1'] },
    }]))
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Yes' }))

    expect(screen.getByText('Everyone is settled up')).toBeTruthy()
  })
})
