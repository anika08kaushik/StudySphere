import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { sanitizeEventInput } from '../src/controllers/calendarEventController.js'

test('calendar sanitizer: rejects creation when title is missing or empty', () => {
  const result1 = sanitizeEventInput({ date: '2026-10-28' })
  assert.ok(result1.errors.includes('Title is required'))

  const result2 = sanitizeEventInput({ title: '   ', date: '2026-10-28' })
  assert.ok(result2.errors.includes('Title is required'))
})

test('calendar sanitizer: rejects invalid date formats on creation', () => {
  const badDates = ['2026/10/28', '28-10-2026', '2026-1-1', 'invalid', '']
  for (const date of badDates) {
    const res = sanitizeEventInput({ title: 'Study Session', date })
    assert.ok(res.errors.includes('Date must be in YYYY-MM-DD format'), `Expected failure for date: ${date}`)
  }
})

test('calendar sanitizer: accepts valid payload and trims string fields', () => {
  const input = {
    title: '  Algorithms Revision  ',
    description: '  Review graph traversal  ',
    date: '2026-10-28',
    startTime: ' 14:00 ',
    endTime: ' 16:00 ',
    category: 'study',
    emoji: '🧠',
    reminderMinutes: 15,
  }

  const { errors, out } = sanitizeEventInput(input)
  assert.equal(errors.length, 0)
  assert.equal(out.title, 'Algorithms Revision')
  assert.equal(out.description, 'Review graph traversal')
  assert.equal(out.date, '2026-10-28')
  assert.equal(out.startTime, '14:00')
  assert.equal(out.endTime, '16:00')
  assert.equal(out.category, 'study')
  assert.equal(out.emoji, '🧠')
  assert.equal(out.reminderMinutes, 15)
})

test('calendar sanitizer: truncates fields exceeding maximum lengths', () => {
  const longTitle = 'A'.repeat(200)
  const longDesc = 'B'.repeat(1500)
  const { errors, out } = sanitizeEventInput({
    title: longTitle,
    description: longDesc,
    date: '2026-10-28',
  })

  assert.equal(errors.length, 0)
  assert.equal(out.title.length, 120)
  assert.equal(out.description.length, 1000)
})

test('calendar sanitizer: validates category enum values', () => {
  const valid = ['study', 'deadline', 'meeting', 'personal', 'other']
  for (const cat of valid) {
    const res = sanitizeEventInput({ title: 'Event', date: '2026-10-28', category: cat })
    assert.equal(res.errors.length, 0)
    assert.equal(res.out.category, cat)
  }

  const invalid = sanitizeEventInput({ title: 'Event', date: '2026-10-28', category: 'unknown-category' })
  assert.ok(invalid.errors.includes('Invalid category'))
})

test('calendar sanitizer: validates reminderMinutes boundary', () => {
  const valid = sanitizeEventInput({ title: 'Event', date: '2026-10-28', reminderMinutes: 60 })
  assert.equal(valid.out.reminderMinutes, 60)

  const negative = sanitizeEventInput({ title: 'Event', date: '2026-10-28', reminderMinutes: -5 })
  assert.ok(negative.errors.includes('reminderMinutes must be between 0 and 10080'))

  const tooLarge = sanitizeEventInput({ title: 'Event', date: '2026-10-28', reminderMinutes: 20000 })
  assert.ok(tooLarge.errors.includes('reminderMinutes must be between 0 and 10080'))
})

test('calendar sanitizer: handles groupId resolution and validation', () => {
  const validId = new mongoose.Types.ObjectId().toString()
  const res1 = sanitizeEventInput({ title: 'Event', date: '2026-10-28', groupId: validId })
  assert.equal(res1.out.groupId, validId)

  const res2 = sanitizeEventInput({ title: 'Event', date: '2026-10-28', groupId: '' })
  assert.equal(res2.out.groupId, null)

  const res3 = sanitizeEventInput({ title: 'Event', date: '2026-10-28', groupId: 'bad-id' })
  assert.ok(res3.errors.includes('Invalid groupId'))
})

test('calendar sanitizer: partial mode allows omitting title and date', () => {
  const partial = sanitizeEventInput({ category: 'deadline' }, true)
  assert.equal(partial.errors.length, 0)
  assert.equal(partial.out.category, 'deadline')
  assert.equal(partial.out.title, undefined)
  assert.equal(partial.out.date, undefined)
})
