// マシンのタイムゾーンを取得できなかったときに使う
const FALLBACK_TIME_ZONE = 'UTC'

// ツールの引数を省略したときのタイムゾーンを決める
// /config で設定された値を優先し、未設定（空）ならマシンのタイムゾーンを使う
// machine はマシンのタイムゾーン。テストで値を固定できるよう、呼び出し側で取得して渡す
export function resolveDefaultTimeZone(configured: unknown, machine: string | undefined): string {
  if (typeof configured === 'string' && configured.trim() !== '') {
    return configured.trim()
  }
  return machine !== undefined && machine !== '' ? machine : FALLBACK_TIME_ZONE
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

// 指定したタイムゾーンでの現在日時を、表示用の文字列にする
// 未知のタイムゾーンは Intl.DateTimeFormat が RangeError を投げるので、呼び出し側でエラーとして扱う
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

  // UTC からの時差は、現地の日時を UTC とみなした値と実際の時刻の差から求める
  // timeZoneName の 'longOffset' は実行環境の ICU によって表記が異なりうるため使わない
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  const offsetMinutes = Math.round((localAsUtc - Math.floor(epochMs / 1000) * 1000) / 60000)
  const sign = offsetMinutes < 0 ? '-' : '+'
  const offset = `${sign}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`

  const date = `${year}-${pad(month)}-${pad(day)}`
  const time = `${pad(hour)}:${pad(minute)}:${pad(second)}`
  // 曜日はロケール en-US の英語名（Tuesday など）をそのまま使う。ユーザーの言語への読み替えはモデルに任せる
  const weekday = get('weekday')

  return [
    `${date} ${time} (${weekday})`,
    `Time zone: ${timeZone} (UTC${offset})`,
    `ISO 8601: ${date}T${time}${offset}`,
  ].join('\n')
}
