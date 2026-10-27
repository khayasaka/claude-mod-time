import type { Register } from 'claude-code'
import { formatCurrentTime, resolveDefaultTimeZone } from './time'

const TOOL_NAME = 'current_time'
const TOOL = `mcp__time__${TOOL_NAME}`

// next.error in .catch can be a plain object ({ kind, message }) rather than an Error, and String() would hide its contents, so write it as JSON
function describeError(error: unknown): string {
  return error instanceof Error ? error.message : JSON.stringify(error)
}

export const register: Register = (on, options) => {
  // The default time zone is the /config entry "Current time tool: default time zone" (userConfig timezone), or the machine's when it is empty
  // This returns local time with no setup; /config is only needed to pin a zone other than the machine's
  const defaultTimeZone = resolveDefaultTimeZone(options.timezone, Intl.DateTimeFormat().resolvedOptions().timeZone)

  on('session.start', async ($, e, next) => {
    // Return the time from inside the mod, without starting an MCP server or any other process
    // Not deferred, so the tool is in the tool list from the start and needs no ToolSearch before each call
    await $.tool.register({
      name: TOOL_NAME,
      description:
        'Returns the current date and time in a time zone (date, time, weekday, UTC offset and ISO 8601). ' +
        // Fixed examples: embedding the default zone would list the same name twice when it is America/New_York
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
    // Tool arguments are not under e.input; they sit directly on e, beside reserved keys such as tool
    const { timezone } = e as { timezone?: unknown }
    const timeZone = typeof timezone === 'string' && timezone.trim() !== '' ? timezone.trim() : defaultTimeZone

    try {
      return { result: formatCurrentTime(await $.clock.now(), timeZone) }
    } catch (error) {
      // Intl throws a RangeError for an unknown time zone name, so ask for an IANA name instead
      return { deny: `Error: unknown time zone "${timeZone}" (${describeError(error)}). Pass an IANA time zone name.` }
    }
  })
    .catch(($, e, next) => ({ deny: `Error: could not get the current time (${describeError(next.error)})` }))
}
