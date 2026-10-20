// Pure helpers for syncing (no Firebase here, so they are easy to test).
const canon = (v: unknown): string => JSON.stringify(v, (_k, val) => val && typeof val === 'object' && !Array.isArray(val) ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : val)

function hash(s: string) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677) }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

export const sig = (x: unknown) => hash(canon(x))
export type Known = Record<string, string> // "v:<id>" / "c:<id>" -> signature at last sync

// Three-way merge of one collection:
//  local  = what this device has now
//  remote = what the server has now
//  known  = signatures from the last time this device was in sync
export function mergeCollection<T extends { id: string }>(prefix: 'v' | 'c', local: T[], remote: T[], known: Known): { out: T[]; known: Known } {
  const localMap = new Map(local.map(l => [l.id, l]))
  const remoteIds = new Set(remote.map(r => r.id))
  const out: T[] = []
  for (const r of remote) {
    const l = localMap.get(r.id); const rs = sig(r); const k = known[`${prefix}:${r.id}`]
    if (!l) { if (k === undefined || rs !== k) out.push(r) } // deleted here and unchanged on server -> stays deleted
    else if (sig(l) === rs) out.push(l)
    else if (k === undefined || sig(l) !== k) out.push(l) // edited here (unsent) -> local wins
    else out.push(r) // unchanged here, changed elsewhere -> take server
  }
  for (const l of local) {
    if (remoteIds.has(l.id)) continue
    const k = known[`${prefix}:${l.id}`]
    if (k === undefined || sig(l) !== k) out.push(l) // new here, or edited after being deleted elsewhere
    // else: deleted on another device -> drop
  }
  const order = new Map(local.map((l, i) => [l.id, i]))
  out.sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9))
  const next: Known = {}
  for (const [key, val] of Object.entries(known)) if (!key.startsWith(`${prefix}:`)) next[key] = val
  for (const r of remote) next[`${prefix}:${r.id}`] = sig(r)
  return { out, known: next }
}
