import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { calculateBalances } from '../logic/balances'
import { formatPaise } from '../logic/money'
import { calculateShares } from '../logic/splits'
import { getPaymentAmount, getTotalOwed, suggestConsolidatedPayments } from '../logic/settlements'
import { deleteExpense } from '../store/expensesSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Category, Expense } from '../types'

const categories: Category[] = ['Food', 'Travel', 'Stay', 'Activities', 'Other']
type ExpenseSort = 'newest' | 'oldest' | 'highest' | 'lowest'

function isCategoryFilter(value: string): value is Category | 'All' {
  return value === 'All' ||
    value === 'Food' ||
    value === 'Travel' ||
    value === 'Stay' ||
    value === 'Activities' ||
    value === 'Other'
}

function isExpenseSort(value: string): value is ExpenseSort {
  return value === 'newest' || value === 'oldest' || value === 'highest' || value === 'lowest'
}

function splitMemberIds(expense: Expense): string[] {
  if (expense.split.type === 'equal') {
    return expense.split.memberIds
  }

  return Object.keys(expense.split.shares)
}

function splitLabel(expense: Expense): string {
  if (expense.split.type === 'equal') {
    return `Equally, ${expense.split.memberIds.length} people`
  }

  const people = Object.keys(expense.split.shares).length
  return expense.split.type === 'exact'
    ? `Exact, ${people} people`
    : `Percent, ${people} people`
}

function ExpensesPage() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const members = useAppSelector((state) => state.members)
  const expenses = useAppSelector((state) => state.expenses.expenses)
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All')
  const [expenseSort, setExpenseSort] = useState<ExpenseSort>('newest')
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null)
  const [openSplitMembersId, setOpenSplitMembersId] = useState<string | null>(null)
  const successMessage = location.state?.message

  const balances = useMemo(() => calculateBalances(members, expenses), [members, expenses])
  const settlements = useMemo(() => suggestConsolidatedPayments(expenses), [expenses])
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0)
  const visibleExpenses = [...expenses]
    .filter((expense) => categoryFilter === 'All' || expense.category === categoryFilter)
    .sort((first, second) => {
      if (expenseSort === 'highest') {
        return second.amount - first.amount
      }
      if (expenseSort === 'lowest') {
        return first.amount - second.amount
      }
      const dateOrder = second.date.localeCompare(first.date)
      return expenseSort === 'newest' ? dateOrder : -dateOrder
    })
  const visibleTotal = visibleExpenses.reduce((total, expense) => total + expense.amount, 0)

  function getMemberName(memberId: string): string {
    return members.find((member) => member.id === memberId)?.name ?? 'Unknown member'
  }

  function confirmDelete(expenseId: string): void {
    dispatch(deleteExpense(expenseId))
    setExpenseToDelete(null)
  }

  useEffect(() => {
    function closeSplitDetails(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpenSplitMembersId(null)
      }
    }

    window.addEventListener('keydown', closeSplitDetails)
    return () => window.removeEventListener('keydown', closeSplitDetails)
  }, [])

  return (
    <main>
      {successMessage === 'Expense added' && <p className="success-message" role="status">{successMessage}</p>}
      <div className="page-heading">
        <div>
          <h1>Expenses</h1>
          <p>Track who paid and who owes.</p>
        </div>
        <Link className="button" to="/expenses/new">Add expense</Link>
      </div>

      <section aria-labelledby="balances-heading">
        <h2 id="balances-heading">Balances</h2>
        <div className="balance-grid">
          {members.map((member) => {
            const balance = balances[member.id] ?? 0
            const label = balance > 0
              ? `gets back ${formatPaise(balance)}`
              : balance < 0
                ? `owes ${formatPaise(Math.abs(balance))}`
                : 'settled up'
            const balanceClass = balance > 0
              ? 'balance-positive'
              : balance < 0
                ? 'balance-negative'
                : 'balance-neutral'

            return (
              <article className="balance-card" key={member.id}>
                <strong>{member.name}</strong>
                <span className={balanceClass}>{label}</span>
              </article>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading">Trip summary</h2>
        <div className="summary-grid">
          <article className="summary-card">
            <span>Total expenses</span>
            <strong>{formatPaise(totalExpenses)}</strong>
          </article>
          <article className="summary-card">
            <span>Expenses recorded</span>
            <strong>{expenses.length}</strong>
          </article>
          <article className="summary-card">
            <span>Trip members</span>
            <strong>{members.length}</strong>
          </article>
        </div>
      </section>

      <section aria-labelledby="settlements-heading">
        <h2 id="settlements-heading">What each person owes</h2>
        <p className="settlements-help">
          Each column shows how much that person owes to every other member.
          Opposite amounts between two people are already netted.
        </p>
        {settlements.length === 0 ? (
          <p className="settlements-empty">Everyone is settled up</p>
        ) : (
          <div className="settlements-columns">
            {members.map((payer) => (
              <article className="settlement-column" key={payer.id}>
                <h3>{payer.name} owes</h3>
                <p className="settlement-total">
                  Total: {formatPaise(getTotalOwed(settlements, payer.id))}
                </p>
                <ul>
                  {members
                    .filter((recipient) => recipient.id !== payer.id)
                    .map((recipient) => (
                      <li key={recipient.id}>
                        <span>{recipient.name}</span>
                        <strong>{formatPaise(getPaymentAmount(settlements, payer.id, recipient.id))}</strong>
                      </li>
                    ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="expense-list-heading">
        <div className="section-heading">
          <h2 id="expense-list-heading">Expense list</h2>
          <div className="list-controls">
            <label>
              Category
              <select
                value={categoryFilter}
                onChange={(event) => {
                  if (isCategoryFilter(event.target.value)) {
                    setCategoryFilter(event.target.value)
                  }
                }}
              >
                <option value="All">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label>
              Sort
              <select
                value={expenseSort}
                onChange={(event) => {
                  if (isExpenseSort(event.target.value)) {
                    setExpenseSort(event.target.value)
                  }
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </select>
            </label>
          </div>
        </div>

        {visibleExpenses.length === 0 ? (
          <div className="empty-state">
            <p>{expenses.length === 0 ? 'No expenses yet.' : 'No expenses in this category.'}</p>
            <Link to="/expenses/new">Add your first expense</Link>
          </div>
        ) : (
          <>
            <p className="total">Total shown: <strong>{formatPaise(visibleTotal)}</strong></p>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Description</th>
                    <th scope="col">Category</th>
                    <th scope="col">Paid by</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Split</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.date}</td>
                      <td>{expense.description}</td>
                      <td>{expense.category}</td>
                      <td>{getMemberName(expense.paidBy)}</td>
                      <td>{formatPaise(expense.amount)}</td>
                      <td>
                        <div className="split-dropdown">
                          <button
                            aria-controls={`split-details-${expense.id}`}
                            aria-expanded={openSplitMembersId === expense.id}
                            aria-label={`View split for ${expense.description}`}
                            className="split-trigger"
                            onClick={() => setOpenSplitMembersId((currentId) => currentId === expense.id ? null : expense.id)}
                            title="Click to view each member's share"
                            type="button"
                          >
                            {splitMemberIds(expense).map((memberId) => getMemberName(memberId)).join(', ')}
                          </button>
                          {openSplitMembersId === expense.id && (
                            <div className="split-dropdown-menu" id={`split-details-${expense.id}`} role="menu">
                              {splitMemberIds(expense).map((memberId) => {
                                const shares = calculateShares(expense.amount, expense.split)
                                const share = shares[memberId] ?? 0

                                return (
                                  <span className="split-member" key={`${expense.id}-${memberId}`} role="menuitem">
                                    <span>{getMemberName(memberId)}</span>
                                    <strong>{formatPaise(share)}</strong>
                                  </span>
                                )
                              })}
                            </div>
                          )}
                          <div className="split-action-hint">Click to view shares</div>
                          <div className="split-label">{splitLabel(expense)}</div>
                        </div>
                      </td>
                      <td>
                        {expenseToDelete === expense.id ? (
                          <span className="delete-confirmation">
                            <span>Delete?</span>
                            <button type="button" onClick={() => confirmDelete(expense.id)}>Yes</button>
                            <button type="button" onClick={() => setExpenseToDelete(null)}>No</button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => setExpenseToDelete(expense.id)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default ExpensesPage
