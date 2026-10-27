// Used when the machine's time zone is unavailable
const FALLBACK_TIME_ZONE = 'UTC'

// Decides the time zone used when the tool's argument is omitted
// The /config value wins; when it is empty, the machine's time zone is used
// machine is the machine's time zone, read by the caller and passed in so tests can fix it
export function resolveDefaultTimeZone(configured: unknown, machine: string | undefined): string {
  if (typeof configured === 'string' && configured.trim() !== '') {
    return configured.trim()
  }
  return machine !== undefined && machine !== '' ? machine : FALLBACK_TIME_ZONE
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

// Formats the current date and time in a time zone for display
// Intl.DateTimeFormat throws a RangeError for an unknown time zone; the caller handles it as an error
export function formatCurrentTime(epochMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'long',
  }).formatToParts(new Date(epochMs))
  const get = (type: string): string => parts.find(part => part.type === type)?.value ?? ''
  const year = Number(get('year'))
  const month = Number(get('month'))
  const day = Number(get('day'))
  const hour = Number(get('hour'))
  const minute = Number(get('minute'))
  const second = Number(get('second'))

  // The UTC offset is the difference between the local date and time read as UTC and the actual time
  // timeZoneName 'longOffset' is not used, as its wording can differ between ICU builds
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  const offsetMinutes = Math.round((localAsUtc - Math.floor(epochMs / 1000) * 1000) / 60000)
  const sign = offsetMinutes < 0 ? '-' : '+'
  const offset = `${sign}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`

  const date = `${year}-${pad(month)}-${pad(day)}`
  const time = `${pad(hour)}:${pad(minute)}:${pad(second)}`
  // The weekday is the en-US name (Tuesday, ...); the model renders it in the user's language
  const weekday = get('weekday')

  return [
    `${date} ${time} (${weekday})`,
    `Time zone: ${timeZone} (UTC${offset})`,
    `ISO 8601: ${date}T${time}${offset}`,
  ].join('\n')
}
