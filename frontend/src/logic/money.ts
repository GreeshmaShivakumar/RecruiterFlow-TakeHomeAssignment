const paisePattern = /^\d+(?:\.\d{1,2})?$/

export function parseMoneyToPaise(value: string): number | null {
  const trimmedValue = value.trim()

  if (!paisePattern.test(trimmedValue)) {
    return null
  }

  const [rupees, paise = ''] = trimmedValue.split('.')
  const paisePart = paise.padEnd(2, '0')
  return Number(rupees) * 100 + Number(paisePart)
}

export function parseSignedMoneyToPaise(value: string): number | null {
  const trimmedValue = value.trim()
  const isNegative = trimmedValue.startsWith('-')
  const unsignedValue = isNegative ? trimmedValue.slice(1) : trimmedValue
  const paise = parseMoneyToPaise(unsignedValue)

  return paise === null ? null : isNegative ? -paise : paise
}

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paise / 100)
}
