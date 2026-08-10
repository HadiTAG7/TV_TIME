// Run: node --test api/trakt.test.js
// The handler is a pure function of req.query + process.env + fetch, so it
// tests with fake req/res objects and a stubbed global fetch — no runner deps.
import test from 'node:test'
import assert from 'node:assert/strict'
import handler from './trakt.js'

function mockRes() {
  const res = { statusCode: 0, headers: {}, body: undefined }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (o) => { res.body = o; return res }
  res.send = (b) => { res.body = b; return res }
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v }
  return res
}

function stubFetch(impl) {
  const calls = []
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), opts })
    return impl ? impl(url, opts) : {
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      text: async () => '[]',
    }
  }
  // `new Map()` lacks .get semantics for missing keys returning null, which
  // matches Headers closely enough for these assertions.
  return calls
}

test('500 when the client id is not configured', async () => {
  delete process.env.TRAKT_CLIENT_ID
  const res = mockRes()
  await handler({ query: { p: '/shows/x/comments/likes' } }, res)
  assert.equal(res.statusCode, 500)
  assert.match(res.body.error, /TRAKT_CLIENT_ID/)
})

test('400 on a malformed path', async () => {
  process.env.TRAKT_CLIENT_ID = 'k'
  for (const p of ['', 'no-leading-slash', '/bad path', '/has?query']) {
    const res = mockRes()
    await handler({ query: { p } }, res)
    assert.equal(res.statusCode, 400, `expected 400 for ${JSON.stringify(p)}`)
  }
})

test('400 on path traversal', async () => {
  process.env.TRAKT_CLIENT_ID = 'k'
  const res = mockRes()
  await handler({ query: { p: '/shows/../../etc' } }, res)
  assert.equal(res.statusCode, 400)
})

test('sends the Trakt auth headers and a User-Agent (Cloudflare needs one)', async () => {
  process.env.TRAKT_CLIENT_ID = 'secret-id'
  const calls = stubFetch()
  const res = mockRes()
  await handler({ query: { p: '/shows/the-wire/comments/likes', limit: '25' } }, res)

  assert.equal(calls.length, 1)
  const { url, opts } = calls[0]
  assert.equal(url, 'https://api.trakt.tv/shows/the-wire/comments/likes?limit=25')
  assert.equal(opts.headers['trakt-api-key'], 'secret-id')
  assert.equal(opts.headers['trakt-api-version'], '2')
  assert.ok(opts.headers['User-Agent'], 'a User-Agent must be sent')
  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['cache-control'], 's-maxage=1800, stale-while-revalidate=86400')
})

test('mirrors upstream status and body', async () => {
  process.env.TRAKT_CLIENT_ID = 'k'
  stubFetch(async () => ({
    status: 404,
    headers: new Map([['content-type', 'application/json']]),
    text: async () => '{"error":"not found"}',
  }))
  const res = mockRes()
  await handler({ query: { p: '/shows/nope/comments/likes' } }, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body, '{"error":"not found"}')
})

test('502 when Trakt is unreachable', async () => {
  process.env.TRAKT_CLIENT_ID = 'k'
  stubFetch(async () => { throw new Error('ECONNREFUSED') })
  const res = mockRes()
  await handler({ query: { p: '/shows/x/comments/likes' } }, res)
  assert.equal(res.statusCode, 502)
})
