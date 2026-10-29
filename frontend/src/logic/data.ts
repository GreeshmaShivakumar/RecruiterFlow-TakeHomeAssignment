import type { AppData, Category, Expense, Member, Split } from '../types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCategory(value: unknown): value is Category {
  return value === 'Food' || value === 'Travel' || value === 'Stay' ||
    value === 'Activities' || value === 'Other'
}

function isStringRecord(value: unknown): value is Record<string, number> {
  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item))
}

function isSplit(value: unknown): value is Split {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }

  if (value.type === 'equal') {
    return Array.isArray(value.memberIds) &&
      value.memberIds.every((memberId) => typeof memberId === 'string')
  }

  return (value.type === 'exact' || value.type === 'percent') && isStringRecord(value.shares)
}

function isMember(value: unknown): value is Member {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
}

function isMemberArray(value: unknown): value is Member[] {
  return Array.isArray(value) && value.every(isMember)
}

function hasKnownMemberIds(memberIds: string[], members: Member[]): boolean {
  const knownIds = new Set(members.map((member) => member.id))
  return memberIds.length > 0 &&
    new Set(memberIds).size === memberIds.length &&
    memberIds.every((memberId) => knownIds.has(memberId))
}

function isExpense(value: unknown, members: Member[]): value is Expense {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.description === 'string' &&
    typeof value.amount === 'number' &&
    Number.isInteger(value.amount) &&
    value.amount >= 0 &&
    typeof value.paidBy === 'string' &&
    typeof value.date === 'string' &&
    isCategory(value.category) &&
    members.some((member) => member.id === value.paidBy) &&
    isSplit(value.split) &&
    (value.split.type === 'equal'
      ? hasKnownMemberIds(value.split.memberIds, members)
      : hasKnownMemberIds(Object.keys(value.split.shares), members) &&
        Object.values(value.split.shares).every((share) => share >= 0) &&
        (value.split.type === 'exact'
          ? Object.values(value.split.shares).every(Number.isInteger) &&
            Object.values(value.split.shares).reduce((total, share) => total + share, 0) === value.amount
          : Object.values(value.split.shares).every((share) => share <= 100) &&
            Object.values(value.split.shares).reduce((total, share) => total + share, 0) === 100))
}

export function isExpenseArray(value: unknown, members: Member[] = []): value is Expense[] {
  return Array.isArray(value) && value.every((expense) => isExpense(expense, members))
}

export function isAppData(value: unknown): value is AppData {
  if (!isRecord(value) || !isMemberArray(value.members) || !Array.isArray(value.expenses)) {
    return false
  }

  const members = value.members
  return value.expenses.every((expense) => isExpense(expense, members))
}
