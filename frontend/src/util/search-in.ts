// Splits a string into words and the compares them to the search query
export function searchInStr(match: string | string[], search?: string | null) {
  if (!search)
    return true

  if (!match)
    return false

  const joint: string = Array.isArray(match) ? match.join(' ') : match
  const split = search.trim().split(/\s+/)

  return split.every(s => joint.toLowerCase().includes(s.toLowerCase()))
}
