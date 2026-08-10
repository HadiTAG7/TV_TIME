// AniList — free, key-less community discussion for anime.
// Its GraphQL endpoint sends `access-control-allow-origin: *`, so the browser
// calls it directly (no proxy, no registration, works on static hosts too).
// AniList auto-creates an "Episode N Discussion" thread per episode for shows
// with an active community, which is the closest free equivalent to TV Time's
// episode comments.
const API = 'https://graphql.anilist.co'

async function gql(query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`AniList ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message || 'AniList error')
  return json.data
}

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')

// Resolve a show name to an AniList media id, but only when the match is
// convincing — an animated non-anime show must not borrow another title's
// discussions.
export async function mediaIdForName(name) {
  const data = await gql(
    `query($s:String){Media(search:$s,type:ANIME){id title{romaji english native}}}`,
    { s: name }
  )
  const m = data?.Media
  if (!m) return null
  const want = norm(name)
  const candidates = [m.title?.english, m.title?.romaji, m.title?.native].filter(Boolean).map(norm)
  const close = candidates.some((c) => c === want || c.includes(want) || want.includes(c))
  return close ? m.id : null
}

// The discussion thread for one episode, if the community made one.
export async function episodeThreadId(mediaId, epNum) {
  const data = await gql(
    `query($id:Int){Page(perPage:50){threads(mediaCategoryId:$id,sort:REPLY_COUNT_DESC){id title replyCount}}}`,
    { id: mediaId }
  )
  const threads = data?.Page?.threads || []
  // Titles look like "[Spoilers] Show Name - Episode 12 Discussion".
  const exact = threads.find((th) => {
    const m = /episode\s*0*(\d+)\s*(discussion)?/i.exec(th.title || '')
    return m && Number(m[1]) === Number(epNum)
  })
  return exact?.id || null
}

// AniList renders comment markdown to HTML; spoilers become a
// `markdown_spoiler` span, which is how we flag them for blurring.
function toComment(c) {
  const html = c.comment || ''
  const spoiler = /markdown_spoiler|~!/.test(html)
  const el = document.createElement('div')
  el.innerHTML = html
  const text = (el.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
  return {
    id: `al-${c.id}`,
    user: c.user?.name || 'anilist user',
    text,
    spoiler,
    likes: c.likeCount || 0,
    replies: 0,
    rating: 0,
    createdAt: c.createdAt ? new Date(c.createdAt * 1000).toISOString() : '',
  }
}

// Moderated-away comments come back as a literal "[Removed]"/"[Deleted]"
// placeholder — not worth a row.
const isTombstone = (text) => /^\[(removed|deleted)\]$/i.test(text.trim())

export async function threadComments(threadId, limit = 30) {
  const data = await gql(
    `query($t:Int,$n:Int){Page(perPage:$n){threadComments(threadId:$t){id comment likeCount createdAt user{name}}}}`,
    { t: threadId, n: limit }
  )
  return (data?.Page?.threadComments || [])
    .map(toComment)
    .filter((c) => c.text && !isTombstone(c.text))
}

// Full path: show name + episode number -> real community comments.
export async function animeEpisodeComments(name, epNum) {
  const mediaId = await mediaIdForName(name)
  if (!mediaId) return []
  const threadId = await episodeThreadId(mediaId, epNum)
  if (!threadId) return []
  return threadComments(threadId)
}
