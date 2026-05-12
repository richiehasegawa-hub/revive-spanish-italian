# Revive Spanish & Italian — Frontend

## セットアップ

```bash
cd src/frontend

# 依存パッケージインストール
npm install

# 環境変数を設定
cp .env.local.example .env.local
# .env.local を編集して各キーを入力

# 開発サーバー起動
npm run dev
# → http://localhost:3000 で確認
```

## 技術スタック

| 役割 | 技術 |
|------|------|
| フレームワーク | Next.js 14 (App Router) |
| スタイリング | Tailwind CSS |
| 言語 | TypeScript |
| DB / Auth | Supabase |
| AI会話 | Claude API (claude-sonnet-4-6) |
| TTS | ElevenLabs（Phase2） |
| STT | Web Speech API（Phase2） |

## ディレクトリ構成

```
src/frontend/
├── app/
│   ├── (app)/
│   │   ├── dashboard/     # トップ画面
│   │   ├── session/[id]/  # 会話練習画面
│   │   ├── history/       # 学習履歴
│   │   └── settings/      # 設定
│   ├── api/
│   │   ├── chat/          # Claude API 会話
│   │   ├── evaluate/      # 文法評価
│   │   ├── sessions/      # セッション管理
│   │   └── memory/        # 長期記憶・弱点
│   └── layout.tsx
├── components/
│   ├── ui/                # 汎用UIコンポーネント
│   ├── chat/              # 会話UI
│   └── dashboard/         # ダッシュボードUI
├── lib/
│   ├── claude/            # Claude API クライアント・プロンプト
│   ├── supabase/          # Supabase クライアント
│   ├── hooks/             # カスタムフック
│   └── utils/             # ユーティリティ
├── types/                 # TypeScript 型定義
└── supabase/
    └── migrations/        # DBスキーマ SQL
```

## Supabase セットアップ

1. [Supabase](https://supabase.com) でプロジェクト作成
2. SQL Editor で `../../supabase/migrations/001_initial_schema.sql` を実行
3. Project Settings > API からURLとanon keyを `.env.local` に設定

## キャラクター

| ID | 名前 | 言語 | 特徴 |
|----|------|------|------|
| carlos | Carlos | スペイン語 | メキシコ系、陽気なガイド |
| elena | Elena | スペイン語 | マドリード出身の語学教師 |
| marco | Marco | イタリア語 | ミラノの音楽プロデューサー |
| sofia | Sofia | イタリア語 | ローマのホテルコンシェルジュ |
