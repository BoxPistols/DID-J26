# クイックスタートガイド

## このドキュメントについて

このガイドは、**完全な初心者**がこのプロジェクトの開発に参加できるよう、環境構築から最初のコード変更まで、ステップバイステップで説明します。

**所要時間**: 約30分

---

## 📘 最初にやること

環境構築が完了したら、**まずStorybookを開いて全体像を把握してください。**

```bash
npm run storybook
```

ブラウザで http://localhost:6006 を開き、以下を確認：
- 技術ドキュメント（01〜17）
- コンポーネント仕様とデモ
- 実装例とコード

**Storybookがこのプロジェクトの最優先ドキュメントです。**

---

## 目次

1. [前提知識](#前提知識)
2. [必要なツールのインストール](#必要なツールのインストール)
3. [リポジトリのセットアップ](#リポジトリのセットアップ)
4. [アプリケーションの起動](#アプリケーションの起動)
5. [Storybookで全体像を把握](#storybookで全体像を把握)（**最重要**）
6. [最初のコード変更](#最初のコード変更)
7. [よくあるエラーと解決方法](#よくあるエラーと解決方法)
8. [次のステップ](#次のステップ)

---

## 前提知識

### 必要な知識

このプロジェクトに参加するために必要な最低限の知識：

✅ **必須**:
- コマンドライン（ターミナル）の基本操作
- テキストエディタの使い方

🟡 **あると良い**:
- Gitの基本（clone, commit, push）
- JavaScriptの基礎知識
- Reactの基本概念

❌ **不要**:
- TypeScriptの深い知識（AIがサポート）
- 地図ライブラリの経験
- ドローン関連の専門知識

### AI駆動開発について

このプロジェクトはAI駆動開発を採用しています。
詳細は **[AI駆動開発ガイド](../ai-driven/AI_DRIVEN_DEVELOPMENT.md)** をご覧ください。

---

## 必要なツールのインストール

### 1. Node.js と npm

**確認方法**:
```bash
node --version
npm --version
```

**必要バージョン**:
- Node.js: v18.0.0 以上
- npm: v9.0.0 以上

**インストール方法**:

#### macOS
```bash
# Homebrewを使用
brew install node@20
```

#### Windows
1. [公式サイト](https://nodejs.org/)からインストーラーをダウンロード
2. LTS版（推奨版）を選択
3. インストーラーの指示に従う

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Git

**確認方法**:
```bash
git --version
```

**インストール方法**:

#### macOS
```bash
brew install git
```

#### Windows
[Git for Windows](https://git-scm.com/download/win) をインストール

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install git
```

### 3. エディタ（推奨: VS Code）

**VS Code のインストール**:
1. [公式サイト](https://code.visualstudio.com/)からダウンロード
2. インストール

**推奨拡張機能**:
```markdown
- ESLint
- Prettier - Code formatter
- GitHub Copilot（有料、学生無料）
```

### 4. GitHub CLI（オプション）

PRやIssueの操作に便利です。

#### macOS
```bash
brew install gh
```

#### Windows
```bash
winget install --id GitHub.cli
```

#### Linux
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**認証**:
```bash
gh auth login
```

---

## リポジトリのセットアップ

### ステップ1: リポジトリをフォーク

1. [GitHub リポジトリ](https://github.com/BoxPistols/DID-J26)にアクセス
2. 右上の「Fork」ボタンをクリック
3. 自分のアカウントにフォークを作成

### ステップ2: ローカルにクローン

```bash
# 自分のフォークをクローン（YOUR_USERNAMEを自分のGitHubユーザー名に置き換え）
git clone https://github.com/YOUR_USERNAME/DID-J26.git

# ディレクトリに移動
cd DID-J26
```

### ステップ3: 上流リポジトリを追加

```bash
# オリジナルリポジトリをupstreamとして追加
git remote add upstream https://github.com/BoxPistols/DID-J26.git

# 確認
git remote -v
# 出力例：
# origin    https://github.com/YOUR_USERNAME/DID-J26.git (fetch)
# origin    https://github.com/YOUR_USERNAME/DID-J26.git (push)
# upstream  https://github.com/BoxPistols/DID-J26.git (fetch)
# upstream  https://github.com/BoxPistols/DID-J26.git (push)
```

### ステップ4: 依存関係のインストール

```bash
# パッケージをインストール
npm install
```

**実行時間**: 3〜5分

**確認**:
```bash
# node_modulesフォルダが作成されていることを確認
ls -la | grep node_modules
```

---

## アプリケーションの起動

### ステップ1: 開発サーバーを起動

```bash
npm run dev
```

**成功時の出力例**:
```text
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### ステップ2: ブラウザで確認

1. ブラウザで `http://localhost:5173/` を開く
2. 地図が表示されることを確認

**期待される画面**:
- 日本地図が表示される
- サイドバーにメニューがある
- DID（人口集中地区）のオーバーレイが見える

### ステップ3: サーバーの停止

```bash
# ターミナルでCtrl+C（Macの場合はCommand+C）
```

---

## Storybookで全体像を把握

**💡 これが最も重要なステップです。**

このプロジェクトの技術ドキュメントのメインはStorybookです。環境構築が完了したら、まずStorybookを開いて全体像を把握してください。

### ステップ1: Storybookを起動

```bash
npm run storybook
```

**成功時の出力例**:
```text
╭────────────────────────────────────────────────╮
│                                                │
│   Storybook 8.x.x for react-vite started      │
│   xxx ms                                       │
│                                                │
│    Local:            http://localhost:6006/    │
│    On your network:  http://xxx.xxx.xxx.xxx:6006/ │
│                                                │
╰────────────────────────────────────────────────╯
```

### ステップ2: Storybookで確認すべき内容

ブラウザで `http://localhost:6006/` を開き、以下を確認：

**📚 技術ドキュメント（番号付き）**:
- `01_ReactFundamentals` - React基礎
- `02_TypeScript` - TypeScript基礎
- `05_MapTechnology` - 地図技術仕様
- `06_GSISpec` - 地理院タイル仕様
- `08_Implementation` - 実装ガイド
- `14_DeveloperManual` - 開発者マニュアル
- `15_WeatherApi` - 天気予報API仕様
- `16_CollisionDetection` - 衝突検出アルゴリズム
- `18_AIDrivenDevelopment` - AI駆動開発ガイド（**最初に読むべき**）

**🧩 コンポーネント仕様**:
- サイドバーのコンポーネント一覧を確認
- インタラクティブなデモを操作
- Props一覧を確認
- 実装コード例を参照

### ステップ3: 開発フローを理解する

Storybookの `14_DeveloperManual` を開き、以下を確認：
- 開発環境のセットアップ
- コンポーネントの作成方法
- テストの書き方
- コミット規約

**💡 この後のコード変更は、Storybookの仕様を見ながら進めると効率的です。**

---

## 最初のコード変更

### 例1: タイトルを変更する

最も簡単な変更として、アプリのタイトルを変更してみます。

#### ステップ1: ファイルを開く

```bash
# VS Codeで開く
code src/components/AppHeader.tsx
```

#### ステップ2: タイトルを編集

`AppHeader.tsx` の中から以下の部分を探します：

```tsx
// 現在の記述（30行目あたり）
<h1 className="text-xl font-bold">DID in Japan</h1>
```

これを以下のように変更：

```tsx
<h1 className="text-xl font-bold">DID in Japan - 改良版</h1>
```

#### ステップ3: 保存して確認

1. ファイルを保存（Ctrl+S / Command+S）
2. ブラウザをリロード（開発サーバーが起動中の場合は自動リロード）
3. タイトルが「DID in Japan - 改良版」に変わっていることを確認

### 例2: 地図の初期位置を変更する

#### ステップ1: ファイルを開く

地図の初期設定を変更するには、`App.tsx` または `src/lib/config/baseMaps.ts` を編集します。

```bash
# メインアプリケーションファイルを開く
code src/App.tsx
```

#### ステップ2: 初期座標を編集

`App.tsx` の中から地図の初期設定を探します：

```typescript
// 地図の初期中心座標（東京）
const [lng, lat] = [139.6917, 35.6895]

// 大阪に変更
const [lng, lat] = [135.5023, 34.6937]
```

#### ステップ3: 確認

1. ファイルを保存
2. ブラウザをリロード（自動リロードが有効な場合は自動）
3. 地図の初期表示が大阪中心になっていることを確認

### 例3: コミットとプッシュ

変更をGitで保存します。

```bash
# 変更内容を確認
git status

# 変更をステージング
git add src/components/AppHeader.tsx src/App.tsx

# コミット
git commit -m "feat: タイトルと初期位置を変更"

# プッシュ（初回の場合）
git push -u origin main
```

---

## よくあるエラーと解決方法

### エラー1: `npm install` が失敗する

**エラーメッセージ**:
```text
npm ERR! code ELIFECYCLE
```

**解決方法**:
```bash
# node_modulesとpackage-lock.jsonを削除
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

### エラー2: ポート5173が使用中

**エラーメッセージ**:
```text
Port 5173 is in use, trying another one...
```

**解決方法1**: 別のポートを使用
```bash
npm run dev -- --port 5174
```

**解決方法2**: 既存のプロセスを終了
```bash
# macOS/Linux
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID番号> /F
```

### エラー3: TypeScriptエラー

**エラーメッセージ**:
```text
Property 'xxx' does not exist on type 'yyy'
```

**解決方法**:
1. VS Codeの型チェックを確認
2. TypeScriptサーバーを再起動
   - VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
3. それでも解決しない場合は、Issue を立てる

### エラー4: 地図が表示されない

**症状**:
- ブラウザに何も表示されない
- コンソールにエラーが出ている

**解決方法**:
1. ブラウザの開発者ツールを開く（F12）
2. Console タブでエラーを確認
3. 以下を試す：
```bash
# キャッシュをクリアして再起動（node_modulesを再作成）
npm run clean
```

### エラー5: Git pushが失敗する

**エラーメッセージ**:
```text
Permission denied (publickey)
```

**解決方法**:
1. SSH鍵が設定されているか確認
```bash
ssh -T git@github.com
```

2. HTTPSに切り替え
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/DID-J26.git
```

3. GitHub CLIを使用
```bash
gh auth login
```

---

## 次のステップ

### 1. AI駆動開発を始める

**[AI駆動開発ガイド](../ai-driven/AI_DRIVEN_DEVELOPMENT.md)** を読んで、AIツールの使い方を学びましょう。

推奨ツール：
- GitHub Copilot（コード補完）
- Claude Code（大規模変更）

### 2. コントリビューションガイドを読む

**[CONTRIBUTING.md](../../CONTRIBUTING.md)** でPRの出し方を学びましょう。

### 3. 用語集で専門用語を理解

**[GLOSSARY.md](../GLOSSARY.md)** でDID、NFZ等の用語を学びましょう。

### 4. 機能を追加してみる

簡単な機能追加から始めましょう：

**システム全体像を理解する**:
- **[システム概要図](../architecture/SYSTEM_OVERVIEW.md)** - システム構成、データフロー

**初心者向けタスク**:
- [ ] UIのテキストを変更
- [ ] 地図の初期設定を変更
- [ ] 新しいアイコンを追加

**中級者向けタスク**:
- [ ] 新しいコンポーネントを作成
- [ ] APIを追加
- [ ] テストを書く

### 5. Issueから探す

[GitHub Issues](https://github.com/BoxPistols/DID-J26/issues) で `good first issue` ラベルのタスクを探しましょう。

### 6. Storybookで実装詳細を学ぶ

```bash
# Storybookを起動
npm run storybook
```

ブラウザで `http://localhost:6006/` を開き、各コンポーネントの詳細仕様を確認できます。

---

## サポート

### 困ったときは

1. **[よくあるエラーと解決方法](#よくあるエラーと解決方法)** を確認
2. **[ドキュメント索引](../README.md)** で関連ドキュメントを検索
3. **[GitHub Discussions](https://github.com/BoxPistols/DID-J26/discussions)** で質問
4. **[Issue を作成](https://github.com/BoxPistols/DID-J26/issues/new)** して報告

### 関連ドキュメント

- [AI駆動開発ガイド](../ai-driven/AI_DRIVEN_DEVELOPMENT.md) - AIツールの使い方
- [用語集](../GLOSSARY.md) - 専門用語の説明
- [コントリビューションガイド](../../CONTRIBUTING.md) - PRの出し方
- [ドキュメント索引](../README.md) - 全ドキュメント一覧

---

## まとめ

### 完了したこと

- ✅ 開発環境のセットアップ
- ✅ リポジトリのクローン
- ✅ アプリケーションの起動
- ✅ 最初のコード変更

### 次にやること

1. [AI駆動開発ガイド](../ai-driven/AI_DRIVEN_DEVELOPMENT.md) を読む
2. 小さな変更から始めてPRを出す
3. コードレビューを経験する

**重要**: 失敗を恐れずに試してください。PRを出せば、AIレビュアーやメンバーがサポートします！

---

**作成日**: 2026-02-03
**最終更新**: 2026-02-03
