# time

A Claude Code mod that gives the model a tool, `mcp__time__current_time`, to look up the current date and time.

Claude has no clock of its own: without a tool, all it knows is the date the system passes it.
This mod answers inside Claude Code itself, with no MCP server, Python or `uvx`, and no shell command.

- **No process to start**: the time comes from the engine's clock within the turn.
- **One format everywhere**: no differences between GNU `date`, BSD `date` and PowerShell `Get-Date`.
- **Fewer permission prompts**: it is a tool of its own, not a shell command.
- **Always loaded**: the tool is in the tool list from the start, so the model does not need ToolSearch to find it.

## Output

```
2026-10-27 11:16:29 (Tuesday)
Time zone: Asia/Tokyo (UTC+09:00)
ISO 8601: 2026-10-27T11:16:29+09:00
```

The tool takes one optional argument, `timezone`, an IANA time zone name such as `Asia/Tokyo` or `America/New_York`.
An unknown name is refused with a message asking for an IANA name.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install time --marketplace khayasaka/claude-mod-time
```

Answer `y` to add the marketplace, then choose a scope (the user scope is first).

From a shell:

```
claude plugin install time --marketplace khayasaka/claude-mod-time
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `khayasaka/claude-mod-time`, then Add plugin.

Mods are an early-access feature of Claude Code, and their API can change between releases.
This mod was tested on Claude Code 2.1.311.

## Settings

| `/config` entry | Default | Meaning |
|---|---|---|
| Current time tool: default time zone | empty | IANA time zone used when the `timezone` argument is omitted |

When the entry is empty, the mod uses the machine's time zone, and `UTC` if that is not available.
Set it only to pin a zone other than the machine's, for example on a WSL machine whose time zone is still UTC.
A change takes effect in the same session.

## Update

```
claude plugin marketplace update claude-mod-time
claude plugin update time@claude-mod-time
```

Then restart Claude Code.
The mod does not update itself.

## Development

```
claude plugin test .
claude plugin validate .
```

`hooks/time.ts` formats the time with `Intl.DateTimeFormat`.
The UTC offset is computed from the difference between the local date and time read as UTC and the actual time, because the `longOffset` time zone name can be written differently depending on the ICU build.

## License

MIT
