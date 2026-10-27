import type { Register } from 'claude-code'
import { formatCurrentTime, resolveDefaultTimeZone } from './time'

const TOOL_NAME = 'current_time'
const TOOL = `mcp__time__${TOOL_NAME}`

// .catch の next.error は Error 以外のオブジェクト（{ kind, message }）の場合があり、String() では中身が出ないため JSON で書き出す
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : JSON.stringify(error)
}

export const register: Register = (on, options) => {
  // 既定のタイムゾーンは、/config の「Current time tool: default time zone」（userConfig の timezone）が未設定ならマシンのタイムゾーンになる
  // 設定なしで各自の地域の時刻を返すため。マシンと異なるタイムゾーンに固定したいときだけ /config で指定する
  const defaultTimeZone = resolveDefaultTimeZone(options.timezone, Intl.DateTimeFormat().resolvedOptions().timeZone)

  on('session.start', async ($, e, next) => {
    // MCP サーバーなどの外部プロセスを起動せずに、mod の中で時刻を返す
    // 呼ぶたびに ToolSearch を経由しなくて済むよう、最初からツール一覧に載せる
    await $.tool.register({
      name: TOOL_NAME,
      description:
        'Returns the current date and time in a time zone (date, time, weekday, UTC offset and ISO 8601). ' +
        // 例は固定の値にする。既定のタイムゾーンを埋め込むと、America/New_York にしたときに同じ値が2回並ぶため
        'Pass the time zone as an IANA name (e.g. Asia/Tokyo, America/New_York).',
      inputSchema: {
        type: 'object',
        properties: {
          timezone: { type: 'string', description: `IANA time zone name (default: ${defaultTimeZone})` },
        },
      },
      isDeferred: false,
    })

    return next(e)
  })

  on('tool.call', { tool: TOOL }, async ($, e) => {
    // ツールの引数は e.input ではなく、tool などの予約キーと並んで e に直接入る
    const { timezone } = e as { timezone?: unknown }
    const timeZone = typeof timezone === 'string' && timezone.trim() !== '' ? timezone.trim() : defaultTimeZone

    try {
      return { result: formatCurrentTime(await $.clock.now(), timeZone) }
    } catch (error) {
      // 未知のタイムゾーン名は Intl が RangeError を投げるため、IANA の名前で指定し直すよう伝える
      return { deny: `Error: unknown time zone "${timeZone}" (${describeError(error)}). Pass an IANA time zone name.` }
    }
  })
    .catch(($, e, next) => ({ deny: `Error: could not get the current time (${describeError(next.error)})` }))
}
