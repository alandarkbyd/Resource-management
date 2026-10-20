import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyA-ejPj2n_MGykYFmcf00BuEFSBWHcbd7U",
  authDomain: "resource-management-103fe.firebaseapp.com",
  projectId: "resource-management-103fe",
  storageBucket: "resource-management-103fe.firebasestorage.app",
  messagingSenderId: "55328462524",
  appId: "1:55328462524:web:23c77c54683a103dc822b9"
}

export const syncEnabled = !firebaseConfig.apiKey.startsWith('PASTE')
const app = syncEnabled ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null
// Offline cache: the app works without internet and syncs when it comes back.
export const db = app ? initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }) : null
