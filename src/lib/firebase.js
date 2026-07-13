// Firebase backend: Google sign-in + per-user library document in Firestore.
// Enabled only when the VITE_FIREBASE_* env vars are present at build time
// (set in Vercel project settings). The SDK is loaded lazily so builds
// without Firebase (e.g. GitHub Pages) never download it.
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = !!(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)

let ready = null
function init() {
  if (!ready) {
    ready = (async () => {
      const [{ initializeApp }, authMod, fsMod] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ])
      const app = initializeApp(cfg)
      return { auth: authMod.getAuth(app), authMod, db: fsMod.getFirestore(app), fsMod }
    })()
  }
  return ready
}

// cb receives the Firebase user (or null). Returns an unsubscribe promise.
export async function watchAuth(cb) {
  if (!firebaseEnabled) {
    cb(null)
    return () => {}
  }
  const { auth, authMod } = await init()
  return authMod.onAuthStateChanged(auth, cb)
}

export async function signInGoogle() {
  const { auth, authMod } = await init()
  const provider = new authMod.GoogleAuthProvider()
  try {
    await authMod.signInWithPopup(auth, provider)
  } catch (e) {
    // Standalone PWAs / strict mobile browsers may block popups.
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      await authMod.signInWithRedirect(auth, provider)
    } else {
      throw e
    }
  }
}

export async function signOutGoogle() {
  const { auth, authMod } = await init()
  await authMod.signOut(auth)
}

// The whole library is stored as one JSON string per user
// (libraries/{uid}) — same canonical payload the Gist sync uses, which
// keeps mergeStates() as the single conflict-resolution path.
export async function pullCloud(uid) {
  const { db, fsMod } = await init()
  const snap = await fsMod.getDoc(fsMod.doc(db, 'libraries', uid))
  return snap.exists() ? snap.data().data || '' : ''
}

export async function pushCloud(uid, json) {
  const { db, fsMod } = await init()
  await fsMod.setDoc(fsMod.doc(db, 'libraries', uid), {
    data: json,
    updatedAt: fsMod.serverTimestamp(),
  })
}
