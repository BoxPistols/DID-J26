# ドキュメント構造分析レポート

## 作成日
2026-02-03

## 目的
AI駆動開発の概念がない人のために、漏れなくダブりなく丁寧なドキュメントを整備する。

## 現状分析

### 📁 ドキュメントの3層構造

```
プロジェクトルート/
├── README.md          【第1層】エンドユーザー向け - アプリの使い方
├── docs/              【第2層】開発者・コントリビューター向け - 開発ガイド
│   ├── README.md      自動生成索引
│   ├── api/           API仕様・外部連携
│   ├── data/          データ取得・更新
│   ├── development/   開発環境・ワークフロー
│   └── specifications/ 要件定義・設計
└── src/stories/       【第3層】技術者向け - 実装詳細・コンポーネント仕様
```

### 📊 ドキュメント数

| カテゴリ | ファイル数 | 内容 |
|---------|-----------|------|
| **ルートREADME** | 1 | メイン使い方ガイド（544行） |
| **docs/** | 15 | 開発者向けドキュメント |
| **Storybook (.mdx)** | 23 | 技術仕様・実装詳細 |
| **ワークフロー** | 6 | GitHub Actions設定 |
| **合計** | **45ファイル** | |

## 重複チェック

### 🔴 重複が見つかった内容

#### 1. 天気予報API
- **README.md** (行189-221): 気象情報とオーバーレイ - 基本的な説明
- **docs/api/WEATHER_API_REQUIREMENTS.md**: 天気予報機能概要
- **docs/api/WEATHER_API_INVESTIGATION.md**: 詳細調査報告書
- **src/stories/15_WeatherApi.mdx**: 技術仕様
- **docs/api/NATIONWIDE_WEATHER_MAP.md**: 全国天気マップ

**重複度**: ⚠️ 中 - 同じ情報が4箇所に散在

#### 2. 衝突検出機能
- **README.md** (行305-328): 衝突検出の概要
- **docs/specifications/COLLISION_DETECTION_SPEC.md**: 技術仕様書
- **src/stories/16_CollisionDetection.mdx**: 実装詳細

**重複度**: ⚠️ 中 - 3箇所で説明

#### 3. DIDデータ更新
- **README.md** (行419-454): DIDデータの更新手順
- **docs/data/DID_DATA_UPDATE_GUIDE.md**: 詳細ガイド
- **docs/data/UPDATE_REQUIREMENTS.md**: 要件定義
- **docs/data/DATA_UPDATE_STATUS.md**: 更新状況

**重複度**: ⚠️ 中 - 同じ手順が2箇所

#### 4. Gemini CLI の使い方
- **.github/workflows/README.md**: ワークフロー使い方
- **docs/development/GEMINI_CLI_GUIDE.md**: コマンドガイド

**重複度**: 🟡 低 - 視点が異なる（ワークフローvs使い方）

### 🟢 適切に分離されている内容

#### 1. 地図技術スタック
- **README.md**: MapLibre GLの基本説明
- **src/stories/05_MapTechnology.mdx**: 詳細な技術仕様
- **src/stories/06_GSISpec.mdx**: 地理院タイル仕様
- **src/stories/07_GSIArch.mdx**: アーキテクチャ

**評価**: ✅ 良好 - レベル別に適切に分離

#### 2. 開発ガイド
- **src/stories/14_DeveloperManual.mdx**: 開発者マニュアル
- **docs/development/**: 開発環境・タスク管理

**評価**: ✅ 良好 - 役割分担が明確

## 漏れチェック

### ❌ 不足しているドキュメント

#### 1. **AI駆動開発ガイド** 【最重要】
- AI駆動開発とは何か
- このプロジェクトでどう活用されているか
- GitHub Copilot、Claude Code、Gemini CLIの使い分け
- 開発者がAIを活用する方法

**影響**: 大 - AI駆動の概念がない人が参加できない

#### 2. **Getting Started（完全初心者向け）**
- 環境構築の詳細ステップ
- 最初のコード変更から動作確認まで
- よくあるエラーとその解決方法

**影響**: 大 - 新規開発者のオンボーディングに必須

#### 3. **コントリビューションガイド**
- PRの出し方
- コードレビュープロセス
- コミットメッセージ規約
- ブランチ戦略

**影響**: 中 - オープンソース貢献のハードルが高い

#### 4. **アーキテクチャ概要図**
- システム全体の構成図
- データフロー図
- コンポーネント間の関係

**影響**: 中 - 全体像が把握しにくい

#### 5. **トラブルシューティングガイド**
- よくあるエラー集
- デバッグ方法
- パフォーマンス問題の対処

**影響**: 中 - サポート負荷が高まる

#### 6. **用語集 (Glossary)**
- DID、NFZ、DIPS、NOTAM等の専門用語説明
- 航空用語
- 技術用語

**影響**: 中 - 初心者の学習曲線が急

## ドキュメントの役割分担案

### ルート README.md
**対象読者**: エンドユーザー・初めて触る人
**内容**:
- プロジェクト概要（3行で説明）
- 主要機能の紹介（スクリーンショット付き）
- クイックスタート（3ステップ）
- 基本的な使い方
- ライセンス・謝辞

**ページ上限**: 300行程度

### docs/
**対象読者**: 開発者・コントリビューター
**内容**:
- Getting Started
- AI駆動開発ガイド
- コントリビューションガイド
- アーキテクチャドキュメント
- API仕様
- データ仕様
- トラブルシューティング

**構造**:
```
docs/
├── getting-started/     新規参加者向け
├── ai-driven/           AI活用ガイド
├── architecture/        設計・構成
├── api/                 API仕様
├── data/                データ仕様
├── development/         開発環境・ツール
├── specifications/      要件定義
└── troubleshooting/     問題解決
```

### src/stories/ (Storybook)
**対象読者**: 実装する技術者
**内容**:
- コンポーネント仕様
- 実装詳細
- コード例
- インタラクティブなデモ
- 技術的な深掘り

## 改善アクションプラン

### 🎯 優先度：高

1. **AI駆動開発ガイド作成**
   - `docs/ai-driven/AI_DRIVEN_DEVELOPMENT.md`
   - AI駆動とは何か、使い方、ベストプラクティス

2. **Getting Started作成**
   - `docs/getting-started/QUICK_START.md`
   - 完全な初心者向け、ステップバイステップ

3. **用語集作成**
   - `docs/GLOSSARY.md`
   - DID、NFZ等の専門用語を平易に説明

4. **README.md簡素化**
   - 現在544行 → 300行以下に
   - 詳細はdocs/へ移動

### 🎯 優先度：中

5. **コントリビューションガイド作成**
   - `CONTRIBUTING.md`
   - PR作成、コードレビュー、規約

6. **アーキテクチャ図作成**
   - `docs/architecture/SYSTEM_OVERVIEW.md`
   - Mermaid図を使用

7. **重複解消**
   - 天気予報API系を統合
   - 衝突検出系を統合

8. **トラブルシューティング**
   - `docs/troubleshooting/COMMON_ISSUES.md`

### 🎯 優先度：低

9. **Storybookナビゲーション改善**
   - カテゴリ整理
   - 番号付け見直し

10. **ドキュメント自動生成強化**
    - TypeDoc導入
    - APIドキュメント自動生成

## 次のステップ

1. ✅ この分析レポート作成
2. ⏳ AI駆動開発ガイド作成
3. ⏳ Getting Started作成
4. ⏳ 用語集作成
5. ⏳ README.md リファクタリング
6. ⏳ 重複解消
