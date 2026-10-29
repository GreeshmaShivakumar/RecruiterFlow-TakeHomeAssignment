import type { Split } from '../types'

function addLeftoverPaise(
  shares: Record<string, number>,
  memberIds: string[],
  leftover: number,
): Record<string, number> {
  const completedShares = { ...shares }

  for (let index = 0; index < leftover; index += 1) {
    const memberId = memberIds[index % memberIds.length]
    completedShares[memberId] += 1
  }

  return completedShares
}

export function calculateShares(amount: number, split: Split): Record<string, number> {
  if (split.type === 'equal') {
    if (split.memberIds.length === 0) {
      return {}
    }

    const baseShare = Math.floor(amount / split.memberIds.length)
    const shares = Object.fromEntries(
      split.memberIds.map((memberId) => [memberId, baseShare]),
    )
    const leftover = amount - baseShare * split.memberIds.length
    return addLeftoverPaise(shares, split.memberIds, leftover)
  }

  const memberIds = Object.keys(split.shares)

  if (split.type === 'exact') {
    return { ...split.shares }
  }

  const shares = Object.fromEntries(
    memberIds.map((memberId) => {
      const percentInHundredths = Math.round(split.shares[memberId] * 100)
      return [memberId, Math.floor((amount * percentInHundredths) / 10000)]
    }),
  )
  const assigned = Object.values(shares).reduce((total, share) => total + share, 0)
  return addLeftoverPaise(shares, memberIds, amount - assigned)
}
