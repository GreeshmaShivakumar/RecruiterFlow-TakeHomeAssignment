import { describe, expect, it } from 'vitest'
import sampleData from '../data/sample-data.json'
import { calculateBalances } from './balances'
import { isAppData } from './data'
import { getPaymentAmount, getTotalOwed, suggestConsolidatedPayments, suggestSettlements } from './settlements'
import type { Expense } from '../types'

describe('settlement suggestions', () => {
  it('settles the real sample balances exactly', () => {
    const parsedSampleData: unknown = sampleData
    if (!isAppData(parsedSampleData)) {
      throw new Error('Sample data is invalid')
    }

    const balances = calculateBalances(parsedSampleData.members, parsedSampleData.expenses)
    const transfers = suggestSettlements(balances)
    const settledBalances = { ...balances }

    for (const transfer of transfers) {
      settledBalances[transfer.from] += transfer.amount
      settledBalances[transfer.to] -= transfer.amount
    }

    expect(Object.values(settledBalances).every((balance) => balance === 0)).toBe(true)
  })

  it('returns no transfers for all-zero balances', () => {
    expect(suggestSettlements({ m1: 0, m2: 0 })).toEqual([])
  })

  it('creates one exact transfer for two people', () => {
    expect(suggestSettlements({ m1: -1250, m2: 1250 }))
      .toEqual([{ from: 'm1', to: 'm2', amount: 1250 }])
  })

  it('uses at most one fewer transfer than non-zero balances', () => {
    const balances = { m1: -700, m2: -300, m3: 400, m4: 600 }
    const transfers = suggestSettlements(balances)
    const nonZeroBalanceCount = Object.values(balances).filter((balance) => balance !== 0).length

    expect(transfers.length).toBeLessThanOrEqual(nonZeroBalanceCount - 1)
  })

  it('returns positive integer amounts', () => {
    const transfers = suggestSettlements({ m1: -700, m2: -300, m3: 400, m4: 600 })

    expect(transfers.every((transfer) =>
      transfer.amount > 0 && Number.isInteger(transfer.amount))).toBe(true)
  })

  it('is deterministic when balances tie', () => {
    const balances = { zed: -100, amy: -100, beta: 100, alpha: 100 }

    expect(suggestSettlements(balances)).toEqual(suggestSettlements(balances))
    expect(suggestSettlements(balances)).toEqual([
      { from: 'amy', to: 'alpha', amount: 100 },
      { from: 'zed', to: 'beta', amount: 100 },
    ])
  })

  it('does not mutate the input balances', () => {
    const balances = { m1: -700, m2: 700 }
    const originalBalances = { ...balances }

    suggestSettlements(balances)

    expect(balances).toEqual(originalBalances)
  })

  it('consolidates each member-to-payer obligation across expenses', () => {
    const expenses: Expense[] = [
      {
        id: 'one',
        description: 'Dinner',
        amount: 10000,
        paidBy: 'm1',
        date: '2026-03-15',
        category: 'Food',
        split: { type: 'exact', shares: { m1: 2000, m2: 8000 } },
      },
      {
        id: 'two',
        description: 'Cab',
        amount: 5000,
        paidBy: 'm1',
        date: '2026-03-16',
        category: 'Travel',
        split: { type: 'exact', shares: { m1: 1000, m2: 4000 } },
      },
    ]

    expect(suggestConsolidatedPayments(expenses)).toEqual([
      { from: 'm2', to: 'm1', amount: 12000 },
    ])
  })

  it('gets a payment amount for a matrix cell', () => {
    const transfers = [{ from: 'm2', to: 'm1', amount: 12000 }]

    expect(getPaymentAmount(transfers, 'm2', 'm1')).toBe(12000)
    expect(getPaymentAmount(transfers, 'm1', 'm2')).toBe(0)
    expect(getTotalOwed(transfers, 'm2')).toBe(12000)
    expect(getTotalOwed(transfers, 'm1')).toBe(0)
  })

  it('nets opposite obligations between the same pair', () => {
    const expenses: Expense[] = [
      {
        id: 'one',
        description: 'Dinner',
        amount: 6000,
        paidBy: 'm1',
        date: '2026-03-15',
        category: 'Food',
        split: { type: 'exact', shares: { m1: 2000, m2: 4000 } },
      },
      {
        id: 'two',
        description: 'Cab',
        amount: 4000,
        paidBy: 'm2',
        date: '2026-03-16',
        category: 'Travel',
        split: { type: 'exact', shares: { m1: 2000, m2: 2000 } },
      },
    ]

    expect(suggestConsolidatedPayments(expenses)).toEqual([
      { from: 'm2', to: 'm1', amount: 2000 },
    ])
  })
})
