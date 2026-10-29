import type { Expense, Member } from '../types'
import { calculateShares } from './splits'

export function calculateBalances(
  members: Member[],
  expenses: Expense[],
): Record<string, number> {
  const balances = Object.fromEntries(members.map((member) => [member.id, 0]))

  for (const expense of expenses) {
    if (expense.paidBy in balances) {
      balances[expense.paidBy] += expense.amount
    }

    const shares = calculateShares(expense.amount, expense.split)
    for (const [memberId, share] of Object.entries(shares)) {
      if (memberId in balances) {
        balances[memberId] -= share
      }
    }
  }

  return balances
}
