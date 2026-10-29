import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parseMoneyToPaise, parseSignedMoneyToPaise } from '../logic/money'
import { validateExpense, type ExpenseFormValues, type ValidationErrors } from '../logic/validation'
import { addExpense } from '../store/expensesSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import type { Category, Split } from '../types'

const categories: Category[] = ['Food', 'Travel', 'Stay', 'Activities', 'Other']
const splitTypes: Split['type'][] = ['equal', 'exact', 'percent']

function isCategory(value: string): value is Category {
  return value === 'Food' || value === 'Travel' || value === 'Stay' ||
    value === 'Activities' || value === 'Other'
}

function AddExpensePage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const members = useAppSelector((state) => state.members)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('')
  const [splitType, setSplitType] = useState<Split['type']>('equal')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [shareInputs, setShareInputs] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<ValidationErrors>({})

  function toggleMember(memberId: string): void {
    setSelectedMemberIds((currentIds) => currentIds.includes(memberId)
      ? currentIds.filter((currentId) => currentId !== memberId)
      : [...currentIds, memberId])
  }

  function updateShare(memberId: string, value: string): void {
    setShareInputs((currentShares) => ({ ...currentShares, [memberId]: value }))
  }

  function changeSplitType(value: Split['type']): void {
    setSplitType(value)
    setSelectedMemberIds([])
    setShareInputs({})
  }

  function buildSplit(): Split {
    if (splitType === 'equal') {
      return { type: 'equal', memberIds: selectedMemberIds }
    }

    const shares: Record<string, number> = {}
    for (const memberId of selectedMemberIds) {
      const input = shareInputs[memberId] ?? ''
      const parsed = splitType === 'exact'
        ? parseSignedMoneyToPaise(input)
        : Number(input)
      shares[memberId] = parsed ?? Number.NaN
    }
    return { type: splitType, shares }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const split = buildSplit()
    const values: ExpenseFormValues = { description, amount, paidBy, date, category, split }
    const nextErrors = validateExpense(values, members)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const parsedAmount = parseMoneyToPaise(amount)
    if (parsedAmount === null || !isCategory(category)) {
      return
    }

    dispatch(addExpense({
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      date,
      category,
      split,
    }))
    navigate('/', { state: { message: 'Expense added' } })
  }

  return (
    <main>
      <h1>Add expense</h1>
      <form className="expense-form" onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="description">Description</label>
          <input aria-describedby={errors.description ? 'description-error' : undefined} aria-invalid={Boolean(errors.description)} id="description" maxLength={60} value={description} onChange={(event) => setDescription(event.target.value)} />
          {errors.description && <span className="field-error" id="description-error" role="alert">{errors.description}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="amount">Amount (₹)</label>
          <input aria-describedby={errors.amount ? 'amount-error' : undefined} aria-invalid={Boolean(errors.amount)} id="amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          {errors.amount && <span className="field-error" id="amount-error" role="alert">{errors.amount}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="paidBy">Paid by</label>
          <select aria-describedby={errors.paidBy ? 'paidBy-error' : undefined} aria-invalid={Boolean(errors.paidBy)} id="paidBy" value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
            <option value="">Select a member</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          {errors.paidBy && <span className="field-error" id="paidBy-error" role="alert">{errors.paidBy}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="date">Date</label>
          <input aria-describedby={errors.date ? 'date-error' : undefined} aria-invalid={Boolean(errors.date)} id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          {errors.date && <span className="field-error" id="date-error" role="alert">{errors.date}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select aria-describedby={errors.category ? 'category-error' : undefined} aria-invalid={Boolean(errors.category)} id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Select a category</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {errors.category && <span className="field-error" id="category-error" role="alert">{errors.category}</span>}
        </div>
        <fieldset>
          <legend>Split type</legend>
          {splitTypes.map((type) => (
            <label key={type}>
              <input checked={splitType === type} name="splitType" onChange={() => changeSplitType(type)} type="radio" />
              {type === 'equal' ? 'Equal' : type === 'exact' ? 'Exact' : 'Percent'}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{splitType === 'equal' ? 'Members included' : 'Member shares'}</legend>
          {splitType === 'equal' && (
            <p className="field-help">
              Equal splits divide paise evenly; any remainder paise go to members in selection order.
            </p>
          )}
          {members.map((member) => (
            <div className="member-share" key={member.id}>
              <label>
                <input checked={selectedMemberIds.includes(member.id)} onChange={() => toggleMember(member.id)} type="checkbox" />
                {member.name}
              </label>
              {splitType !== 'equal' && selectedMemberIds.includes(member.id) && (
                <label>
                  {splitType === 'exact' ? 'Share (₹)' : 'Percent (%)'}
                  <input inputMode="decimal" value={shareInputs[member.id] ?? ''} onChange={(event) => updateShare(member.id, event.target.value)} />
                  {errors[`share-${member.id}`] && <span className="field-error">{errors[`share-${member.id}`]}</span>}
                </label>
              )}
            </div>
          ))}
          {errors.members && <span className="field-error" id="members-error" role="alert">{errors.members}</span>}
          {errors.shares && <span className="field-error" id="shares-error" role="alert">{errors.shares}</span>}
        </fieldset>
        <div className="form-actions">
          <button className="button" type="submit">Save expense</button>
          <Link to="/">Cancel</Link>
        </div>
      </form>
    </main>
  )
}

export default AddExpensePage
