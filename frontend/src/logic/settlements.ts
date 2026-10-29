import { calculateShares } from './splits'
import type { Expense } from '../types'

export interface Transfer {
  from: string
  to: string
  amount: number
}

export function getPaymentAmount(
  transfers: Transfer[],
  from: string,
  to: string,
): number {
  return transfers.find((transfer) => transfer.from === from && transfer.to === to)?.amount ?? 0
}

export function getTotalOwed(transfers: Transfer[], memberId: string): number {
  return transfers
    .filter((transfer) => transfer.from === memberId)
    .reduce((total, transfer) => total + transfer.amount, 0)
}

type Balance = Record<string, number>

type Creditor = {
  memberId: string
  remaining: number
}

type Debtor = {
  memberId: string
  remaining: number
}

export function suggestSettlements(balances: Balance): Transfer[] {
  const creditors: Creditor[] = []
  const debtors: Debtor[] = []

  for (const [memberId, balance] of Object.entries(balances)) {
    if (balance > 0) {
      creditors.push({ memberId, remaining: balance })
    } else if (balance < 0) {
      debtors.push({ memberId, remaining: Math.abs(balance) })
    }
  }

  creditors.sort((first, second) =>
    second.remaining - first.remaining || first.memberId.localeCompare(second.memberId))
  debtors.sort((first, second) =>
    second.remaining - first.remaining || first.memberId.localeCompare(second.memberId))

  const transfers: Transfer[] = []
  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    if (creditor === undefined || debtor === undefined) {
      break
    }

    const amount = Math.min(creditor.remaining, debtor.remaining)
    transfers.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount,
    })

    creditor.remaining -= amount
    debtor.remaining -= amount

    if (creditor.remaining === 0) {
      creditorIndex += 1
    }
    if (debtor.remaining === 0) {
      debtorIndex += 1
    }
  }

  return transfers
}

export function suggestConsolidatedPayments(expenses: Expense[]): Transfer[] {
  const amountsByPair = new Map<string, number>()

  for (const expense of expenses) {
    const shares = calculateShares(expense.amount, expense.split)

    for (const [memberId, share] of Object.entries(shares)) {
      if (memberId === expense.paidBy || share === 0) {
        continue
      }

      const pairKey = `${memberId}\u0000${expense.paidBy}`
      amountsByPair.set(pairKey, (amountsByPair.get(pairKey) ?? 0) + share)
    }
  }

  const netAmountsByPair = new Map<string, number>()
  for (const [pairKey, amount] of amountsByPair.entries()) {
    const separatorIndex = pairKey.indexOf('\u0000')
    const from = pairKey.slice(0, separatorIndex)
    const to = pairKey.slice(separatorIndex + 1)
    const reverseKey = `${to}\u0000${from}`

    if (netAmountsByPair.has(reverseKey)) {
      const reverseAmount = netAmountsByPair.get(reverseKey) ?? 0
      if (reverseAmount > amount) {
        netAmountsByPair.set(reverseKey, reverseAmount - amount)
      } else {
        netAmountsByPair.delete(reverseKey)
        if (amount > reverseAmount) {
          netAmountsByPair.set(pairKey, amount - reverseAmount)
        }
      }
    } else {
      netAmountsByPair.set(pairKey, amount)
    }
  }

  return Array.from(netAmountsByPair.entries())
    .filter(([, amount]) => amount > 0)
    .map(([pairKey, amount]) => {
      const separatorIndex = pairKey.indexOf('\u0000')
      return {
        from: pairKey.slice(0, separatorIndex),
        to: pairKey.slice(separatorIndex + 1),
        amount,
      }
    })
    .sort((first, second) =>
      first.from.localeCompare(second.from) ||
      first.to.localeCompare(second.to))
}
