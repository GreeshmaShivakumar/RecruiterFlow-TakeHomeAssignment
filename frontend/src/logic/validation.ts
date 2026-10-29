import type { Category, Member, Split } from '../types'
import { formatPaise, parseMoneyToPaise } from './money'

export type ExpenseFormValues = {
  description: string
  amount: string
  paidBy: string
  date: string
  category: string
  split: Split
}

export type ValidationErrors = Record<string, string>

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const percentPattern = /^\d+(?:\.\d{1,2})?$/
const maximumAmount = 100000000

function isValidDate(value: string): boolean {
  if (!datePattern.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
}

function isCategory(value: string): value is Category {
  return value === 'Food' || value === 'Travel' || value === 'Stay' ||
    value === 'Activities' || value === 'Other'
}

function addError(errors: ValidationErrors, field: string, message: string): void {
  errors[field] = message
}

export function validateExpense(
  values: ExpenseFormValues,
  members: Member[] = [],
  today: string = new Date().toISOString().slice(0, 10),
): ValidationErrors {
  const errors: ValidationErrors = {}
  const description = values.description.trim()
  const amount = parseMoneyToPaise(values.amount)

  if (description.length === 0) {
    addError(errors, 'description', 'Description is required')
  } else if (description.length > 60) {
    addError(errors, 'description', 'Description must be 60 characters or fewer')
  }

  if (values.amount.trim().startsWith('-')) {
    addError(errors, 'amount', 'Amount must be more than ₹0')
  } else if (amount === null) {
    addError(errors, 'amount', 'Enter a valid amount with up to 2 decimals')
  } else if (amount === 0) {
    addError(errors, 'amount', 'Amount must be more than ₹0')
  } else if (amount > maximumAmount) {
    addError(errors, 'amount', 'Amount must be ₹10,00,000 or less')
  }

  if (values.paidBy.trim().length === 0) {
    addError(errors, 'paidBy', 'Paid by is required')
  } else if (!members.some((member) => member.id === values.paidBy)) {
    addError(errors, 'paidBy', 'Select a valid member')
  }

  if (values.date.trim().length === 0) {
    addError(errors, 'date', 'Date is required')
  } else if (!isValidDate(values.date) || values.date > today) {
    addError(errors, 'date', 'Date cannot be in the future')
  }

  if (!isCategory(values.category)) {
    addError(errors, 'category', 'Category is required')
  }

  if (values.split.type === 'equal') {
    if (values.split.memberIds.length === 0) {
      addError(errors, 'members', 'Select at least one member')
    }
  } else if (amount !== null) {
    const memberIds = Object.keys(values.split.shares)

    if (memberIds.length === 0) {
      addError(errors, 'members', 'Select at least one member')
    }

    for (const memberId of memberIds) {
      const share = values.split.shares[memberId]
      if (values.split.type === 'exact' && !Number.isFinite(share)) {
        addError(errors, `share-${memberId}`, 'Enter a valid share')
      } else if (values.split.type === 'exact' && share < 0) {
        addError(errors, `share-${memberId}`, 'Share cannot be negative')
      }
      if (values.split.type === 'percent' &&
        (!Number.isFinite(share) || !percentPattern.test(String(share)) || share < 0 || share > 100)) {
        addError(errors, `share-${memberId}`, 'Percent must be between 0 and 100')
      }
    }

    if (values.split.type === 'exact') {
      const shareValues = Object.values(values.split.shares)
      if (shareValues.every((share) => Number.isFinite(share))) {
        const assigned = shareValues.reduce((total, share) => total + share, 0)
        const difference = amount - assigned
        if (difference !== 0) {
          const label = formatPaise(Math.abs(difference))
          addError(errors, 'shares', difference > 0 ? `${label} left to assign` : `${label} over`)
        }
      }
    } else {
      const shareValues = Object.values(values.split.shares)
      if (shareValues.every((share) => Number.isFinite(share))) {
        const totalPercent = shareValues.reduce((total, share) => total + share, 0)
        if (totalPercent !== 100) {
          addError(errors, 'shares', 'Percentages must total exactly 100')
        }
      }
    }
  }

  return errors
}
