export type Member = {
  id: string
  name: string
}

export type Category = 'Food' | 'Travel' | 'Stay' | 'Activities' | 'Other'

export type Split =
  | { type: 'equal'; memberIds: string[] }
  | { type: 'exact'; shares: Record<string, number> }
  | { type: 'percent'; shares: Record<string, number> }

export type Expense = {
  id: string
  description: string
  amount: number
  paidBy: string
  date: string
  category: Category
  split: Split
}

export type AppData = {
  members: Member[]
  expenses: Expense[]
}
