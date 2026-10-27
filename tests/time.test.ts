import { expect, test } from 'claude-code/testing'
import { formatCurrentTime, resolveDefaultTimeZone } from '../hooks/time'

// 2026-10-27T02:16:29Z (11:16:29 on Tuesday in Tokyo)
const NOW = Date.UTC(2026, 9, 27, 2, 16, 29)

test('returns the date, time, weekday and offset in Tokyo', () => {
  expect(formatCurrentTime(NOW, 'Asia/Tokyo')).toBe(
    ['2026-10-27 11:16:29 (Tuesday)', 'Time zone: Asia/Tokyo (UTC+09:00)', 'ISO 8601: 2026-10-27T11:16:29+09:00'].join('\n'),
  )
})

test('a zone behind UTC gives the previous date and a negative offset', () => {
  // New York is on daylight saving time (UTC-04:00) on 2026-10-27
  expect(formatCurrentTime(NOW, 'America/New_York').split('\n')).toEqual([
    '2026-10-26 22:16:29 (Monday)',
    'Time zone: America/New_York (UTC-04:00)',
    'ISO 8601: 2026-10-26T22:16:29-04:00',
  ])
})

test('handles offsets with minutes', () => {
  expect(formatCurrentTime(NOW, 'Asia/Kolkata').split('\n')[2]).toBe('ISO 8601: 2026-10-27T07:46:29+05:30')
})

test('throws on an unknown time zone', () => {
  expect(() => formatCurrentTime(NOW, 'Mars/Olympus')).toThrow()
})

test('the default time zone prefers the /config value, then the machine time zone', () => {
  expect(resolveDefaultTimeZone('America/New_York', 'Asia/Tokyo')).toBe('America/New_York')
  expect(resolveDefaultTimeZone('', 'Europe/London')).toBe('Europe/London')
  expect(resolveDefaultTimeZone(undefined, 'Europe/London')).toBe('Europe/London')
})

test('falls back to UTC when the machine time zone is unavailable', () => {
  expect(resolveDefaultTimeZone('', undefined)).toBe('UTC')
  expect(resolveDefaultTimeZone('  ', '')).toBe('UTC')
})

// The tool name is not in the types before it is registered, so pass it to $.tool.call as a template literal type
const TOOL: `mcp__time__${string}` = 'mcp__time__current_time'

test('with no setting and no argument, returns the time in the machine time zone', async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  const result = await $.tool.call({ tool: TOOL })
  // Build the expected value in the time zone of the machine running the test
  expect(result.result).toBe(formatCurrentTime(NOW, Intl.DateTimeFormat().resolvedOptions().timeZone))
})

test('the /config default time zone is used when the argument is omitted', { options: { timezone: 'America/New_York' } }, async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  const result = await $.tool.call({ tool: TOOL })
  expect(result.result).toContain('Time zone: America/New_York (UTC-04:00)')
})

test('the timezone argument takes precedence over the default', { options: { timezone: 'America/New_York' } }, async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  const result = await $.tool.call({ tool: TOOL, timezone: 'Asia/Tokyo' })
  expect(result.result).toContain('Time zone: Asia/Tokyo (UTC+09:00)')
})

test('an unknown time zone is returned as deny', async ($, on) => {
  on('clock.now', () => ({ value: NOW }))
  const result = await $.tool.call({ tool: TOOL, timezone: 'Mars/Olympus' })
  expect(result.deny).toContain('Mars/Olympus')
})
