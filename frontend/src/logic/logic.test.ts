import { describe, expect, it } from 'vitest'
import sampleData from '../data/sample-data.json'
import type { Expense, Member } from '../types'
import { calculateBalances } from './balances'
import { formatPaise, parseMoneyToPaise } from './money'
import { calculateShares } from './splits'
import { validateExpense, type ExpenseFormValues } from './validation'

const members: Member[] = [
  { id: 'm1', name: 'Aarav' },
  { id: 'm2', name: 'Diya' },
]

describe('money helpers', () => {
  it('parses rupees into integer paise', () => {
    expect(parseMoneyToPaise('1,250.50')).toBeNull()
    expect(parseMoneyToPaise('1250.5')).toBe(125050)
    expect(parseMoneyToPaise('1250.50')).toBe(125050)
  })

  it('formats paise in Indian currency format', () => {
    expect(formatPaise(10000000)).toBe('₹1,00,000.00')
  })
})

describe('split calculations', () => {
  it('gives the first member the extra paisa', () => {
    expect(calculateShares(10000, { type: 'equal', memberIds: ['m1', 'm2', 'm3'] }))
      .toEqual({ m1: 3334, m2: 3333, m3: 3333 })
  })

  it('floors percent shares and distributes the leftover in order', () => {
    expect(calculateShares(149999, {
      type: 'percent',
      shares: { m1: 33.33, m2: 33.33, m3: 33.34 },
    })).toEqual({ m1: 49995, m2: 49995, m3: 50009 })
  })

  it('returns exact shares without changing integer paise', () => {
    expect(calculateShares(10000, {
    type: 'exact',
    shares: { m1: 2500, m2: 7500 },
    })).toEqual({ m1: 2500, m2: 7500 })
  })
})

describe('balances', () => {
  it('keeps sample balances equal to zero in total', () => {
    const members: Member[] = sampleData.members
    const expenses: Expense[] = [
      {
        id: 'sample',
        description: 'Sample expense',
        amount: 10000,
        paidBy: 'm1',
        date: '2026-03-15',
        category: 'Food',
        split: { type: 'equal', memberIds: ['m1', 'm2', 'm3'] },
      },
    ]
    const balances = calculateBalances(members, expenses)
    const total = Object.values(balances).reduce((sum, balance) => sum + balance, 0)

    expect(total).toBe(0)
    expect(sampleData.expenses).toHaveLength(6)
  })
})

describe('expense validation', () => {
  const validValues: ExpenseFormValues = {
    description: 'Dinner',
    amount: '100',
    paidBy: 'm1',
    date: '2026-03-15',
    category: 'Food',
    split: { type: 'equal', memberIds: ['m1', 'm2'] },
  }

  it('accepts a valid expense', () => {
    expect(validateExpense(validValues, members, '2026-03-15')).toEqual({})
  })

  it('reports the negative amount message exactly', () => {
    expect(validateExpense({ ...validValues, amount: '-1' }, members, '2026-03-15').amount)
      .toBe('Amount must be more than ₹0')
  })

  it('rejects a paid-by value that is not a trip member', () => {
    expect(validateExpense({ ...validValues, paidBy: 'unknown' }, members, '2026-03-15').paidBy)
      .toBe('Select a valid member')
  })

  it('rejects dates that are not real calendar dates', () => {
    expect(validateExpense({ ...validValues, date: '2026-02-30' }, members, '2026-03-15').date)
      .toBe('Date cannot be in the future')
  })

  it('reports exact shares left to assign', () => {
    const values: ExpenseFormValues = {
      ...validValues,
      split: { type: 'exact', shares: { m1: 5000, m2: 2500 } },
    }

    expect(validateExpense(values, members, '2026-03-15').shares).toBe('₹25.00 left to assign')
  })

  it('requires percent shares to total exactly 100', () => {
    const values: ExpenseFormValues = {
      ...validValues,
      split: { type: 'percent', shares: { m1: 50, m2: 49 } },
    }

    expect(validateExpense(values, members, '2026-03-15').shares)
      .toBe('Percentages must total exactly 100')
  })

  it('rejects amounts above the maximum', () => {
    expect(validateExpense({ ...validValues, amount: '1000000.01' }, members, '2026-03-15').amount)
      .toBe('Amount must be ₹10,00,000 or less')
  })

  it('rejects exact shares that go over the expense amount', () => {
    const values: ExpenseFormValues = {
      ...validValues,
      split: { type: 'exact', shares: { m1: 7500, m2: 3000 } },
    }

    expect(validateExpense(values, members, '2026-03-15').shares).toBe('₹5.00 over')
  })
})
