# Japan Overlay Map

日本の各種地理データをオーバーレイ表示できる汎用地図ライブラリです。

## 謝辞

本プロジェクトは [dronebird/DIDinJapan](https://github.com/dronebird/DIDinJapan) をベースにしています。

オリジナルプロジェクトの作者である **Taichi FURUHASHI ([@mapconcierge](https://github.com/mapconcierge))** 氏、**Nobusuke IWASAKI ([@wata909](https://github.com/wata909))** 氏に深く感謝いたします。

DIDデータのGeoJSON変換という基盤を構築していただいたことで、本プロジェクトの開発が可能となりました。

---

## 主要機能

### 🗺️ ベースマップ
- 標準地図（OpenStreetMap）
- 地理院地図（国土地理院）
- 淡色地図
- 航空写真

### 📍 オーバーレイレイヤー

**飛行規制区域**:
- 飛行注意区域（DID：人口集中地区）
- 空港周辺空域（NFZ）
- 地方別・全国表示切替
- スマート検索（市区町村名）

**気象情報**:
- 雨雲レーダー（リアルタイム更新）
- 天気予報（クリックで表示）
- 全国天気マップ
- 都道府県別詳細予報

**施設データ**:
- 有人機発着地
- 駐屯地・基地
- 消防署・医療機関

**地理情報**:
- 陰影起伏図
- 色別標高図
- 傾斜量図

### ✏️ 飛行計画機能
- 飛行経路・範囲の描画
- ウェイポイント配置
- 衝突検出（禁止エリアとの重複チェック）
- GeoJSONエクスポート

### ⌨️ キーボードショートカット
- `D`: DID表示切替
- `A`: 空港空域切替
- `W`: 天気予報モード
- `C`: 雨雲レーダー
- `L`: ダーク/ライトモード
- `?`: ヘルプ

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

### 本番ビルド

```bash
npm run build
```

---

## 使い方

### 基本操作

**地図の移動**:
- ドラッグ: 地図を移動
- スクロール: ズームイン/アウト
- ダブルクリック: ズームイン

**レイヤー切替**:
- 左サイドバーからレイヤーを選択
- キーボードショートカットで高速切替

**検索**:
- 左上の検索バーに市区町村名を入力
- 該当地域に自動ズーム

### 飛行計画の作成

1. 左サイドバー「飛行経路／飛行範囲」を選択
2. 描画ツールを選択（ポリゴン/円/WP/経路）
3. 地図上でクリックして描画
4. 衝突検出で禁止エリアとの重複を確認
5. 「データ出力」でGeoJSONをエクスポート

### 右クリックメニュー

地図上で右クリック:
- 座標表示・コピー
- 天気予報表示
- 規制エリア表示切替
- UI設定

---

## 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **地図エンジン**: MapLibre GL JS
- **ビルドツール**: Vite
- **状態管理**: Zustand
- **UI開発**: Storybook 8
- **テスト**: Vitest

---

## ドキュメント

プロジェクトの詳細なドキュメントは `docs/` ディレクトリに整理されています。

### 📚 はじめての方へ

1. **[Getting Started（環境構築）](docs/getting-started/QUICK_START.md)**
   完全な初心者向け、ステップバイステップの環境構築ガイド

2. **[AI駆動開発ガイド](docs/ai-driven/AI_DRIVEN_DEVELOPMENT.md)**
   このプロジェクトで使用しているAIツール（GitHub Copilot、Claude Code等）の活用方法

3. **[用語集](docs/GLOSSARY.md)**
   DID、NFZ、GIS等の専門用語を平易に説明

### 📖 開発者向け

- **[コントリビューションガイド](CONTRIBUTING.md)** - PRの出し方、コードレビュープロセス
- **[ドキュメント索引](docs/README.md)** - 全ドキュメントのカテゴリ別索引
- **[地図技術仕様](docs/specifications/MAP_TECHNICAL_SPEC.md)** - 座標系、投影法、データソース
- **[衝突検出仕様](docs/specifications/COLLISION_DETECTION_SPEC.md)** - 衝突検出アルゴリズム
- **[DIDデータ更新ガイド](docs/data/DID_DATA_UPDATE_GUIDE.md)** - データ更新手順
- **[Gemini CLI ガイド](docs/development/GEMINI_CLI_GUIDE.md)** - AIレビューの使い方

### 📝 Storybook（コンポーネント仕様）

```bash
npm run storybook
```

ブラウザで http://localhost:6006 を開き、各コンポーネントの詳細仕様を確認できます。

---

## データソース

| データ | 提供元 | 更新頻度 |
|--------|--------|---------|
| 人口集中地区（DID） | e-Stat | 5年ごと（国勢調査） |
| 空港敷地 | 国土数値情報 | 不定期 |
| 空港周辺空域 | 国土地理院 | 不定期 |
| 地理院地図タイル | 国土地理院 | 随時 |
| 雨雲レーダー | RainViewer API | 5分ごと |
| 天気予報 | Open-Meteo API | 1時間ごと |
| 施設データ | OSM/自治体 | 手動更新 |

詳細は [地図技術仕様](docs/specifications/MAP_TECHNICAL_SPEC.md) を参照してください。

---

## データの注意事項

- **最終確認必須**: 実際の飛行可否は必ずDIPS・NOTAM・自治体の最新情報で確認してください
- **DIDデータ**: 国勢調査ベースのため、最新の市街地変化とずれる場合があります
- **パフォーマンス**: 大量データ読み込み時は、地域別表示を推奨します
- **施設データ**: OSM/自治体データを加工した参考情報です。公式の規制区分ではありません

---

## コントリビューション

貢献を歓迎します！

### 参加方法

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

### 初めての方へ

- **[Getting Started](docs/getting-started/QUICK_START.md)** で環境構築
- **[AI駆動開発ガイド](docs/ai-driven/AI_DRIVEN_DEVELOPMENT.md)** でAIツールの使い方を学習
- **[good first issue](https://github.com/BoxPistols/DID-J26/labels/good%20first%20issue)** ラベルから簡単なタスクを探す

---

## ライセンス

MIT License

### DIDデータ
[政府統計の総合窓口（e-Stat）利用規約](https://www.e-stat.go.jp/terms-of-use)に基づき利用可能です。

**利用時の出典表示**:
```
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
- **ドキュメント**: [docs/](docs/)

---

**開発**: [BoxPistols](https://github.com/BoxPistols)
**ベースプロジェクト**: [dronebird/DIDinJapan](https://github.com/dronebird/DIDinJapan)
