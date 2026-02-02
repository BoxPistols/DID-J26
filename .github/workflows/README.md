# GitHub Actions ワークフロー

## Gemini AI Code Review

このリポジトリでは、Gemini AIを使用したコードレビュー機能を提供しています。

### 🔄 自動レビューについて

**重要**: Gemini APIの無料枠のクォータ制限により、**PR作成時の自動レビューは無効化されています**。

### 📝 手動レビューの使い方

PRにGemini AIレビューを依頼する場合は、以下のようにコメントしてください：

```
@gemini-cli /review
```

追加の情報やコンテキストを提供する場合：

```
@gemini-cli /review セキュリティ面を重点的にチェックしてください
```

### 🚫 クォータエラーが発生した場合

Gemini APIの日次クォータを超過すると、以下のメッセージが表示されます：

```
🤖 Gemini APIの日次クォータを超過したため、自動レビューを実行できませんでした。
```

**対応方法:**
- クォータがリセットされるまで待つ（通常24時間）
- 翌日に再度 `@gemini-cli /review` でリトライ
- [Gemini API使用状況](https://ai.google.dev/gemini-api/docs/rate-limits)で現在の状況を確認

### 🔧 その他の機能

#### Issue トリアージ
```
@gemini-cli /triage
```

#### カスタムリクエスト
```
@gemini-cli このコードのパフォーマンスを改善する方法を教えてください
```

### ⚙️ 管理者向け

自動レビューを再度有効化する場合は、`.github/workflows/gemini-dispatch.yml`の以下の行のコメントを解除してください：

```yaml
# pull_request:
#   types:
#     - 'opened'
```

ただし、無料枠のクォータを消費するため、有料プランへのアップグレードまたは使用頻度の管理が必要です。
