import { useEffect, useRef, useState } from 'react'
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore'
import { auth, db, syncEnabled } from './firebase'
import { mergeCollection, sig } from './syncMerge'
import type { Known } from './syncMerge'

export type SyncStatus = 'off' | 'signed-out' | 'syncing' | 'synced' | 'error'
const KNOWN = 'videotak-known-'
const clean = <T,>(x: T): T => JSON.parse(JSON.stringify(x))
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function useSync<V extends { id: string }, C extends { id: string }>(
  videos: V[], categories: C[], setVideos: (v: V[]) => void, setCategories: (c: C[]) => void,
) {
  const [user, setUser] = useState<User | null>(null)
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error'>('syncing')
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const latest = useRef({ videos, categories })
  const known = useRef<Known>({})
  const uid = user?.uid

  useEffect(() => { latest.current = { videos, categories } })

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, u => { setUser(u); if (!u) { setReady(false); setSyncState('syncing') } })
  }, [])

  // Listen to the server (live updates from your other device)
  useEffect(() => {
    if (!db || !uid) return
    try { known.current = JSON.parse(localStorage.getItem(KNOWN + uid) || '{}') } catch { known.current = {} }
    let gotV = false, gotC = false
    const done = () => { if (gotV && gotC) { setReady(true); setSyncState('synced'); setMessage('') } }
    const fail = (e: Error) => { setSyncState('error'); setMessage(e.message) }
    const handle = <T extends { id: string }>(prefix: 'v' | 'c', remote: T[], local: T[], set: (x: T[]) => void) => {
      const res = mergeCollection(prefix, local, remote, known.current)
      known.current = res.known; localStorage.setItem(KNOWN + uid, JSON.stringify(res.known))
      if (sig(res.out) !== sig(local)) set(res.out)
    }
    const unsubV = onSnapshot(collection(db, 'users', uid, 'videos'), snap => {
      if (snap.metadata.hasPendingWrites) return
      handle('v', snap.docs.map(d => d.data() as unknown as V), latest.current.videos, setVideos); gotV = true; done()
    }, fail)
    const unsubC = onSnapshot(collection(db, 'users', uid, 'categories'), snap => {
      if (snap.metadata.hasPendingWrites) return
      handle('c', snap.docs.map(d => d.data() as unknown as C), latest.current.categories, setCategories); gotC = true; done()
    }, fail)
    return () => { unsubV(); unsubC() }
  }, [uid, setVideos, setCategories])

  // Upload only what changed (debounced, so typing a note doesn't spam writes)
  useEffect(() => {
    const database = db
    if (!database || !uid || !ready) return
    const timer = window.setTimeout(async () => {
      const k = known.current
      type Op = { key: string; kind: 'v' | 'c'; id: string; data?: unknown; sig?: string }
      const ops: Op[] = []
      for (const v of videos) { const s = sig(v); if (k[`v:${v.id}`] !== s) ops.push({ key: `v:${v.id}`, kind: 'v', id: v.id, data: clean(v), sig: s }) }
      for (const c of categories) { const s = sig(c); if (k[`c:${c.id}`] !== s) ops.push({ key: `c:${c.id}`, kind: 'c', id: c.id, data: clean(c), sig: s }) }
      const vIds = new Set(videos.map(v => v.id)); const cIds = new Set(categories.map(c => c.id))
      for (const key of Object.keys(k)) {
        const kind = key[0] as 'v' | 'c'; const id = key.slice(2)
        if ((kind === 'v' && !vIds.has(id)) || (kind === 'c' && !cIds.has(id))) ops.push({ key, kind, id })
      }
      if (!ops.length) return
      setSyncState('syncing')
      try {
        for (let i = 0; i < ops.length; i += 400) {
          const batch = writeBatch(database); const chunk = ops.slice(i, i + 400)
          for (const op of chunk) {
            const ref = doc(database, 'users', uid, op.kind === 'v' ? 'videos' : 'categories', op.id)
            if (op.data) batch.set(ref, op.data as Record<string, unknown>); else batch.delete(ref)
          }
          await batch.commit()
          const next = { ...known.current }
          for (const op of chunk) { if (op.sig) next[op.key] = op.sig; else delete next[op.key] }
          known.current = next; localStorage.setItem(KNOWN + uid, JSON.stringify(next))
        }
        setSyncState('synced'); setMessage('')
      } catch (e) { setSyncState('error'); setMessage(errText(e)) }
    }, 1000)
    return () => clearTimeout(timer)
  }, [videos, categories, uid, ready])

  const run = async (fn: () => Promise<unknown>) => { try { await fn(); return '' } catch (e) { return errText(e) } }
  const status: SyncStatus = !syncEnabled ? 'off' : !user ? 'signed-out' : syncState
  return {
    enabled: syncEnabled, email: user?.email ?? '', signedIn: !!user, status, message,
    signInGoogle: () => run(() => signInWithPopup(auth!, new GoogleAuthProvider())),
    signIn: (email: string, password: string) => run(() => signInWithEmailAndPassword(auth!, email, password)),
    signUp: (email: string, password: string) => run(() => createUserWithEmailAndPassword(auth!, email, password)),
    signOut: () => fbSignOut(auth!),
  }
}
