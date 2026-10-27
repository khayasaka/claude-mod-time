# time

[English](README.md) | 日本語

モデルが現在の日時を調べるためのツール `mcp__time__current_time` を追加する、Claude Code の mod です。

Claude は自分の時計を持っていません。
ツールが無ければ、分かるのはシステムから渡される日付だけです。
この mod は Claude Code の中で時刻を返します。
MCP サーバー・Python・`uvx` も、シェルのコマンドも使いません。

- **プロセスを起動しない**：時刻は、ターンの中でエンジンの時計から取ります。
- **どこでも同じ形式**：GNU の `date`・BSD の `date`・PowerShell の `Get-Date` の違いを気にしなくて済みます。
- **許可の確認が出にくい**：シェルのコマンドではなく、独立したツールです。
- **最初から読み込まれる**：ツールが最初からツール一覧に載っているので、モデルが ToolSearch で探す必要がありません。

## 出力

```
2026-10-27 11:16:29 (Tuesday)
Time zone: Asia/Tokyo (UTC+09:00)
ISO 8601: 2026-10-27T11:16:29+09:00
```

ツールの引数は、省略できる `timezone` の1つだけです。
`Asia/Tokyo`・`America/New_York` のような IANA のタイムゾーン名で渡します。
知らない名前を渡すと、IANA の名前で指定し直すよう求めるメッセージで拒否します。

出力は英語です。
読むのはモデルなので、ユーザーの言語への読み替えはモデルに任せています。

## インストール

Claude Code のターミナルのセッションで、プロンプトに次のように入力します。

```
/plugin install time --marketplace khayasaka/claude-mod-time
```

marketplace を追加するか聞かれたら `y` で答え、スコープを選びます（最初に並ぶのはユーザーのスコープです）。

シェルから入れるときは、次のように実行します。

```
claude plugin install time --marketplace khayasaka/claude-mod-time
```

デスクトップアプリでは `/plugin` が使えません。
プロンプトの入力欄の横の + から Plugins を開き、Add marketplace で `khayasaka/claude-mod-time` を追加してから、Add plugin を選びます。

mod は Claude Code の early access の機能で、API はリリースごとに変わることがあります。
この mod は Claude Code 2.1.311 で動作を確かめました。

## 設定

| `/config` の項目 | 既定値 | 意味 |
|---|---|---|
| Current time tool: default time zone | 空 | 引数の `timezone` を省略したときに使う IANA のタイムゾーン |

項目が空のときは、マシンのタイムゾーンを使います。
マシンのタイムゾーンも取れないときは `UTC` を使います。
マシンと異なるタイムゾーンに固定したいときだけ設定してください（たとえば、タイムゾーンが UTC のままの WSL）。
変更は同じセッションのうちに反映されます。

## 更新

```
claude plugin marketplace update claude-mod-time
claude plugin update time@claude-mod-time
```

実行したら、Claude Code を再起動します。
mod が自分で自分を更新することはありません。

## 開発

```
claude plugin test .
claude plugin validate .
```

`hooks/time.ts` は、`Intl.DateTimeFormat` で時刻を整形します。
UTC からの時差は、現地の日時を UTC とみなした値と実際の時刻の差から求めます。
タイムゾーン名の `longOffset` は、ICU のビルドによって表記が異なりうるため使っていません。

## ライセンス

MIT
