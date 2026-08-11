// Run: node --test api/netflix-top10.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseRows } from './netflix-top10.js'

const row = (iso, week, cat, rank, title, season = 'N/A') =>
  ['Country', iso, week, cat, String(rank), title, season, '3'].join('\t')

test('keeps only the requested country', () => {
  const out = parseRows([
    row('AE', '2026-08-02', 'TV', 1, 'Emirati Show'),
    row('SA', '2026-08-02', 'TV', 1, 'Saudi Show'),
  ], 'SA')
  assert.equal(out.length, 1)
  assert.equal(out[0].title, 'Saudi Show')
})

test('keeps only the newest week', () => {
  const out = parseRows([
    row('SA', '2026-07-26', 'TV', 1, 'Old Week'),
    row('SA', '2026-08-02', 'TV', 1, 'New Week'),
    row('SA', '2026-07-19', 'TV', 2, 'Older Week'),
  ], 'SA')
  assert.equal(out.length, 1)
  assert.equal(out[0].title, 'New Week')
  assert.equal(out[0].week, '2026-08-02')
})

test('sorts by rank ascending', () => {
  const out = parseRows([
    row('SA', '2026-08-02', 'TV', 3, 'Third'),
    row('SA', '2026-08-02', 'TV', 1, 'First'),
    row('SA', '2026-08-02', 'TV', 2, 'Second'),
  ], 'SA')
  assert.deepEqual(out.map((r) => r.title), ['First', 'Second', 'Third'])
})

test('normalises category and keeps films separate from tv', () => {
  const out = parseRows([
    row('SA', '2026-08-02', 'TV (Arabic)', 1, 'Arabic Series'),
    row('SA', '2026-08-02', 'Films', 1, 'Some Film'),
  ], 'SA')
  assert.equal(out.find((r) => r.title === 'Arabic Series').category, 'TV')
  assert.equal(out.find((r) => r.title === 'Some Film').category, 'Films')
})

test('drops malformed and non-numeric-rank lines', () => {
  const out = parseRows([
    'too\tshort',
    row('SA', '2026-08-02', 'TV', 'N/A', 'Bad Rank'),
    row('SA', '2026-08-02', 'TV', 1, 'Good'),
    '',
  ], 'SA')
  assert.equal(out.length, 1)
  assert.equal(out[0].title, 'Good')
})

test('carries season title through, blanking N/A', () => {
  const out = parseRows([
    row('SA', '2026-08-02', 'TV', 1, 'Show', 'Show: Season 2'),
    row('SA', '2026-08-02', 'TV', 2, 'Other', 'N/A'),
  ], 'SA')
  assert.equal(out[0].season, 'Show: Season 2')
  assert.equal(out[1].season, '')
})

test('returns an empty list when the country is absent', () => {
  assert.deepEqual(parseRows([row('AE', '2026-08-02', 'TV', 1, 'X')], 'SA'), [])
})
