// Cloud sync backend: a private GitHub Gist holding the library as JSON.
// Uses a personal access token with only the "gist" scope.
const GH = 'https://api.github.com'
export const SYNC_FILE = 'cinetrack-sync.json'

async function gh(token, path, opts = {}) {
  const res = await fetch(GH + path, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
  if (!res.ok) {
    const err = new Error(`GitHub ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

// Returns the GitHub username, throwing on a bad token.
export async function validateToken(token) {
  const user = await gh(token, '/user')
  return user.login
}

// Locate this account's sync gist, creating a private one if none exists.
export async function findOrCreateGist(token) {
  const gists = await gh(token, '/gists?per_page=100')
  const hit = gists.find((g) => g.files && g.files[SYNC_FILE])
  if (hit) return hit.id
  const created = await gh(token, '/gists', {
    method: 'POST',
    body: JSON.stringify({
      description: 'CineTrack cloud sync — library backup (do not delete)',
      public: false,
      files: { [SYNC_FILE]: { content: '{}' } },
    }),
  })
  return created.id
}

export async function pullGist(token, id) {
  const gist = await gh(token, `/gists/${id}`)
  const file = gist.files?.[SYNC_FILE]
  if (!file) return ''
  if (file.truncated && file.raw_url) {
    const res = await fetch(file.raw_url)
    return res.text()
  }
  return file.content || ''
}

export async function pushGist(token, id, content) {
  await gh(token, `/gists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [SYNC_FILE]: { content } } }),
  })
}
