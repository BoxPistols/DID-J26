# docs/ ディレクトリ整理案

## 現状の問題
- 15個のドキュメントが平坦に配置されている
- カテゴリが不明確で目的のドキュメントを探しにくい

## 提案する構造

```
docs/
├── README.md                    # ドキュメント索引
│
├── data/                        # データ関連
│   ├── DATA_DISTRIBUTION_GUIDE.md
│   ├── DID_DATA_UPDATE_GUIDE.md
│   ├── DATA_UPDATE_STATUS.md
│   ├── UPDATE_REQUIREMENTS.md
│   └── TERRAIN_2024_IMPLEMENTATION.md
│
├── api/                         # API・外部連携
│   ├── DRONE_OPERATION_API_GUIDE.md
│   ├── WEATHER_API_REQUIREMENTS.md
│   └── WEATHER_API_INVESTIGATION.md
│
├── specifications/              # 仕様書
│   ├── PROJECT_REQUIREMENTS.md
│   └── COLLISION_DETECTION_SPEC.md
│
└── development/                 # 開発ガイド
    ├── GEMINI_CLI_GUIDE.md
    ├── CLI_NOTIFICATION_ARCHITECTURE.md
    ├── npm_package_plan.md
    ├── ACTIVE_TASKS.md
    └── NEXT_ACTION.md
```

## カテゴリ分類

### 📊 data/ - データ関連（5ファイル）
- **DATA_DISTRIBUTION_GUIDE.md** - 他プロジェクトへのデータ提供方法
- **DID_DATA_UPDATE_GUIDE.md** - DIDデータ更新手順
- **DATA_UPDATE_STATUS.md** - データ更新状況
- **UPDATE_REQUIREMENTS.md** - データ更新要件
- **TERRAIN_2024_IMPLEMENTATION.md** - 地形データ実装

### 🔌 api/ - API・外部連携（3ファイル）
- **DRONE_OPERATION_API_GUIDE.md** - ドローン運航API
- **WEATHER_API_REQUIREMENTS.md** - 気象API要件
- **WEATHER_API_INVESTIGATION.md** - 気象API調査

### 📐 specifications/ - 仕様書（2ファイル）
- **PROJECT_REQUIREMENTS.md** - プロジェクト要件定義
- **COLLISION_DETECTION_SPEC.md** - 衝突判定仕様

### 🛠️ development/ - 開発ガイド（5ファイル）
- **GEMINI_CLI_GUIDE.md** - Gemini CLIコマンドガイド
- **CLI_NOTIFICATION_ARCHITECTURE.md** - CLI通知アーキテクチャ
- **npm_package_plan.md** - npmパッケージ化計画
- **ACTIVE_TASKS.md** - アクティブタスク
- **NEXT_ACTION.md** - 次のアクション

## 移行コマンド

```bash
# ディレクトリ作成
mkdir -p docs/data docs/api docs/specifications docs/development

# data/
git mv docs/DATA_DISTRIBUTION_GUIDE.md docs/data/
git mv docs/DID_DATA_UPDATE_GUIDE.md docs/data/
git mv docs/DATA_UPDATE_STATUS.md docs/data/
git mv docs/UPDATE_REQUIREMENTS.md docs/data/
git mv docs/TERRAIN_2024_IMPLEMENTATION.md docs/data/

# api/
git mv docs/DRONE_OPERATION_API_GUIDE.md docs/api/
git mv docs/WEATHER_API_REQUIREMENTS.md docs/api/
git mv docs/WEATHER_API_INVESTIGATION.md docs/api/

# specifications/
git mv docs/PROJECT_REQUIREMENTS.md docs/specifications/
git mv docs/COLLISION_DETECTION_SPEC.md docs/specifications/

# development/
git mv docs/GEMINI_CLI_GUIDE.md docs/development/
git mv docs/CLI_NOTIFICATION_ARCHITECTURE.md docs/development/
git mv docs/npm_package_plan.md docs/development/
git mv docs/ACTIVE_TASKS.md docs/development/
git mv docs/NEXT_ACTION.md docs/development/
```

## docs/README.md（索引ページ）

各カテゴリの説明と主要ドキュメントへのリンクを記載。
