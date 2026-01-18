# Vercelデプロイメントガイド

## プロジェクト構成

このリポジトリは2つのVercelプロジェクトにデプロイされます：

- **本番アプリ**: https://didj.vercel.app/ (mainブランチ)
- **Storybook**: https://didj-docs.vercel.app/ (専用プロジェクト)

## 環境変数設定

### 現在のバージョン（v1.0）

**環境変数は不要です。** 以下の無料APIを使用しているため、APIキーなしでデプロイできます：

- **OpenStreetMap Nominatim API** - 住所検索・ジオコーディング
- **国土地理院タイル** - 地図タイル（標準、淡色、航空写真）
- **OpenMapTiles** - フォントグリフ

### Vercelデプロイ手順

#### 本番アプリ (didj.vercel.app)

1. **GitHubリポジトリに接続**
   ```bash
   # Vercel CLIをインストール（初回のみ）
   npm i -g vercel

   # プロジェクトをデプロイ
   vercel
   ```

2. **自動デプロイ設定**
   - Vercelダッシュボードで「New Project」をクリック
   - GitHubリポジトリを選択
   - Framework Preset: **Vite**（自動検出）
   - Build Command: `npm run build`（自動設定）
   - Output Directory: `dist`（自動設定）
   - Production Branch: `main`

3. **環境変数は設定不要**
   - 現在は環境変数なしで動作します

#### Storybook (didj-docs.vercel.app)

1. **別のVercelプロジェクトとして作成**
   - Vercelダッシュボードで「New Project」をクリック
   - 同じGitHubリポジトリを選択
   - プロジェクト名: `didj-docs`

2. **ビルド設定をオーバーライド**
   - Settings → General → Build & Development Settings
   - Override: Yes
   - Build Command: `npm run build-storybook`
   - Output Directory: `storybook-static`
   - Install Command: `npm install`

3. **Production Branchを設定**
   - Settings → Git → Production Branch
   - Branch: `main` (または専用ブランチ)

#### Vercel CLI での設定例

```bash
# Storybookプロジェクトのデプロイ
vercel --prod --build-env VERCEL_PROJECT_NAME=didj-docs
```

### 将来的な拡張（オプション）

以下のサービスを追加する場合は、Vercel環境変数設定が必要です：

#### MapTiler（商用地図タイル）
```
VITE_MAPTILER_API_KEY=your_key_here
```

#### Mapbox（商用地図・ジオコーディング）
```
VITE_MAPBOX_ACCESS_TOKEN=your_token_here
```

#### Google Maps API（ルート検索）
```
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

#### Sentry（エラートラッキング）
```
VITE_SENTRY_DSN=your_dsn_here
```

### 環境変数の設定方法

**Vercelダッシュボード:**
1. プロジェクト → Settings → Environment Variables
2. 変数名と値を入力
3. Environment: Production / Preview / Development を選択
4. Save

**Vercel CLI:**
```bash
vercel env add VITE_YOUR_VAR_NAME
```

### ビルドコマンド

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### パフォーマンス最適化

1. **Static Asset Caching**
   - `vercel.json`に設定済み
   - 静的ファイルは1年間キャッシュ

2. **リージョン設定**
   - `vercel.json`で東京リージョン（hnd1）を指定
   - 日本向けサービスのため最適化

3. **セキュリティヘッダー**
   - CSP、XSS、Frame設定を`vercel.json`に設定済み

### トラブルシューティング

#### ビルドエラー
```bash
# ローカルで確認
npm run build

# 型チェック
npm run build:lib
```

#### 環境変数が読み込まれない
- 変数名が`VITE_`で始まっているか確認
- Vercelでビルドを再実行（キャッシュクリア）

#### フォントが読み込まれない
- `vercel.json`のheaders設定を確認
- CORSエラーがないか確認

### モニタリング

Vercelダッシュボードで以下を確認できます：
- デプロイメント履歴
- ビルドログ
- アクセス解析
- エラーログ

### コスト

**無料枠（Hobby Plan）で十分です：**
- 帯域幅: 100GB/月
- ビルド時間: 6,000分/月
- 商用利用不可

**Pro Planが必要な場合：**
- 商用利用
- カスタムドメイン
- チーム機能
- $20/月

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
