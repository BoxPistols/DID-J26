# Japan Overlay Map

日本の各種地理データをオーバーレイ表示できる汎用地図ライブラリです。

## 謝辞

本プロジェクトは [dronebird/DIDinJapan](https://github.com/dronebird/DIDinJapan) をベースにしています。

オリジナルプロジェクトの作者である **Taichi FURUHASHI ([@mapconcierge](https://github.com/mapconcierge))** 氏、**Nobusuke IWASAKI ([@wata909](https://github.com/wata909))** 氏に深く感謝いたします。

DIDデータのGeoJSON変換という基盤を構築していただいたことで、本プロジェクトの開発が可能となりました。

---

## 📘 最優先ドキュメント：Storybook

**開発者向けのメインドキュメントはStorybookです。**

```bash
npm run storybook
```

ブラウザで http://localhost:6006 を開き、以下のドキュメントにアクセスできます：

### 🎯 技術ドキュメント（Storybook内）
- **React基礎・TypeScript** - 01〜03
- **地図技術仕様** - 05〜07（MapLibre GL JS、地理院タイル）
- **実装ガイド** - 08（コンポーネント構造）
- **データソース** - 09〜10（施設データ、データインポート）
- **飛行計画機能** - 11（描画ツール仕様）
- **航空法・安全基準** - 12〜13
- **開発者マニュアル** - 14（環境構築、開発フロー）
- **API仕様** - 15（天気予報API）
- **衝突検出アルゴリズム** - 16
- **パフォーマンス最適化** - 17
- **AI駆動開発** - 18（AIツール活用方法）

### 🧩 コンポーネント仕様（Storybook内）
- インタラクティブなデモ
- Props一覧
- 使用例
- ベストプラクティス

**💡 まず Storybook を開いて全体像を把握することを強く推奨します。**

---

## 主要機能

### 🗺️ ベースマップ
- 標準地図（OpenStreetMap）
- 地理院地図（国土地理院）
- 淡色地図
- 航空写真

### 📍 オーバーレイレイヤー
- **飛行規制区域**: DID（人口集中地区）、空港周辺空域（NFZ）
- **気象情報**: 雨雲レーダー（リアルタイム）、天気予報、全国天気マップ
- **施設データ**: 有人機発着地、駐屯地・基地、消防署・医療機関
- **地理情報**: 陰影起伏図、色別標高図、傾斜量図

### ✏️ 飛行計画機能
- 飛行経路・範囲の描画
- ウェイポイント配置
- 衝突検出（禁止エリアとの重複チェック）
- GeoJSONエクスポート

### ⌨️ キーボードショートカット
`D`: DID表示切替 | `A`: 空港空域切替 | `W`: 天気予報モード | `C`: 雨雲レーダー | `L`: ダーク/ライトモード | `?`: ヘルプ

詳細な使い方は **Storybook** を参照してください。

---

## クイックスタート

### 必要なツール
- Node.js 18.0.0 以上
- npm 9.0.0 以上

### 3ステップで起動

```bash
# 1. リポジトリをクローン
git clone https://github.com/BoxPistols/DID-J26.git
cd DID-J26

# 2. 依存関係をインストール
npm install

# 3. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

### Storybookで開発

```bash
npm run storybook
```

ブラウザで http://localhost:6006 を開き、コンポーネントの仕様を確認しながら開発できます。

### 本番ビルド

```bash
npm run build
```

---

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **地図エンジン**: MapLibre GL JS
- **ビルドツール**: Vite
- **状態管理**: Zustand
- **UI開発**: Storybook 8
- **テスト**: Vitest

技術詳細は **Storybook** の技術ドキュメントセクションを参照してください。

---

## ドキュメント

### 📘 開発者向けドキュメント優先順位

```text
1. Storybook（最優先）
   └ npm run storybook → http://localhost:6006
   └ 技術仕様・実装ガイド・コンポーネント仕様

2. docs/（補足ガイド）
   └ 環境構築、AI駆動開発、用語集

3. README.md（このファイル）
   └ プロジェクト概要・クイックスタート
```

### 📚 補足ドキュメント（docs/）

**はじめての方へ**:
- **[Getting Started](docs/getting-started/QUICK_START.md)** - 環境構築ガイド
- **[AI駆動開発ガイド](docs/ai-driven/AI_DRIVEN_DEVELOPMENT.md)** - AIツール活用方法
- **[用語集](docs/GLOSSARY.md)** - DID、NFZ、GIS等の専門用語

**開発者向け**:
- **[コントリビューションガイド](CONTRIBUTING.md)** - PRの出し方、コードレビュー
- **[ドキュメント索引](docs/README.md)** - 全ドキュメント一覧
- **[地図技術仕様](docs/specifications/MAP_TECHNICAL_SPEC.md)** - 座標系、投影法
- **[衝突検出仕様](docs/specifications/COLLISION_DETECTION_SPEC.md)** - アルゴリズム詳細
- **[DIDデータ更新ガイド](docs/data/DID_DATA_UPDATE_GUIDE.md)** - データ更新手順
- **[Gemini CLI ガイド](docs/development/GEMINI_CLI_GUIDE.md)** - AIレビューの使い方

---

## コントリビューション

貢献を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成
3. 変更をコミット
4. プルリクエストを作成

詳細は **[CONTRIBUTING.md](CONTRIBUTING.md)** を参照してください。

### 初めての方へ
- **Storybook** で全体像を把握
- **[Getting Started](docs/getting-started/QUICK_START.md)** で環境構築
- **[AI駆動開発ガイド](docs/ai-driven/AI_DRIVEN_DEVELOPMENT.md)** でAIツールの使い方を学習
- **[good first issue](https://github.com/BoxPistols/DID-J26/labels/good%20first%20issue)** から簡単なタスクを探す

---

## ライセンス

MIT License

### DIDデータ
[政府統計の総合窓口（e-Stat）利用規約](https://www.e-stat.go.jp/terms-of-use)に基づき利用可能です。

**利用時の出典表示**:
```text
出典：政府統計の総合窓口(e-Stat)（https://www.e-stat.go.jp/）
「人口集中地区（飛行注意区域）」データを加工して作成
```

### 地理院タイル
[国土地理院コンテンツ利用規約](https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)に基づき利用可能です。

---

## 参考リンク

- [dronebird/DIDinJapan](https://github.com/dronebird/DIDinJapan) - 本プロジェクトのベース
- [国土地理院 地理院地図](https://maps.gsi.go.jp/)
- [政府統計の総合窓口（e-Stat）](https://www.e-stat.go.jp/)
- [国土数値情報](https://nlftp.mlit.go.jp/ksj/)
- [MapLibre GL JS](https://maplibre.org/)

---

## サポート

- **質問**: [GitHub Discussions](https://github.com/BoxPistols/DID-J26/discussions)
- **バグ報告**: [GitHub Issues](https://github.com/BoxPistols/DID-J26/issues)
- **ドキュメント**: **Storybook** または [docs/](docs/)

---

**開発**: [BoxPistols](https://github.com/BoxPistols)
**ベースプロジェクト**: [dronebird/DIDinJapan](https://github.com/dronebird/DIDinJapan)
