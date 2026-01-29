# ローディングプログレスバー仕様

データ読み込み中のユーザーフィードバックを提供するUIコンポーネント。

## 概要

大量のGeoJSONデータやAPI呼び出しによる読み込み時間をユーザーに明示し、アプリケーションがフリーズしていないことを示します。

## UI構成

### プログレスバー（メイン）

```
┌─────────────────────────────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (4px高さ) │
└─────────────────────────────────────────────────────────────┘
                                        画面右上: ○ 全国天気 45%
```

- **位置**: 画面最上部（`position: fixed; top: 0`）
- **高さ**: 4px
- **Z-index**: 1300（モーダルより下、通常UIより上）
- **アニメーション**: グラデーションがスライド（1秒周期）

### ステータステキスト

- **位置**: 画面右上（`top: 8px; right: 12px`）
- **フォント**: 11px、半透明
- **内容**: スピナーアイコン + レイヤー名 + 進捗率（%）
- **アニメーション**:
  - スピナー回転（1秒周期）
  - テキスト点滅（1.5秒周期、opacity 0.6-1.0）

## トリガー条件

### 開始トリガー

| イベント | 詳細 |
|---------|------|
| DIDレイヤー表示ON | `addLayer()` 呼び出し時 |
| NFZ（空港空域）表示ON | `addLayer()` 呼び出し時 |
| 施設データ表示ON | GeoJSONフェッチ開始時 |
| 全国天気マップ表示ON | 天気API呼び出し開始時 |
| 地方一括読み込み | 「DID+NFZ表示」ボタン押下時 |

### 終了トリガー

| イベント | 詳細 |
|---------|------|
| データ読み込み完了 | Promise解決時 |
| 読み込みエラー | Promise reject時（エラートースト表示） |
| 複数同時読み込み | 全てのPromiseが解決/rejectした時 |

## 状態管理

```typescript
// ローディング状態管理（レイヤーID -> { name: 表示名, progress?: 進捗率 }）
const [loadingLayers, setLoadingLayers] = useState<Map<string, {
  name: string
  progress?: number
}>>(new Map())

// プログレスバーの表示状態（フェードアウト用）
const [showProgressBar, setShowProgressBar] = useState(false)
```

### 状態遷移

```
[初期状態]
    ↓ loadingLayers.set('layer-id', { name: 'レイヤー名' })
[ローディング中] ← loadingLayers.size > 0
    ↓ showProgressBar = true（即時）
[プログレスバー表示中]
    ↓ loadingLayers.delete('layer-id')
[ローディング終了] ← loadingLayers.size === 0
    ↓ 0.3秒フェードアウトアニメーション
    ↓ setTimeout 300ms
[プログレスバー非表示] ← showProgressBar = false
```

## 進捗率の計算

### 全国天気マップの例

```typescript
// バッチ処理で進捗を追跡
const batchSize = 10
for (let i = 0; i < WEATHER_LOCATIONS.length; i += batchSize) {
  const batch = WEATHER_LOCATIONS.slice(i, i + batchSize)
  await Promise.allSettled(batch.map(city => fetchWeather(city.lat, city.lng)))

  completed += batch.length
  const progress = Math.round((completed / total) * 100)
  onLoadingChange?.(true, progress)  // 進捗を通知
}
```

### 通常のレイヤー読み込み

通常のGeoJSONレイヤーは進捗率を持たない（undefined）。この場合、進捗率は表示されず、レイヤー名のみ表示されます。

## CSSアニメーション

```css
/* プログレスバーのスライドアニメーション */
@keyframes progressBarSlide {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* テキストの点滅アニメーション */
@keyframes loadingPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* スピナーの回転アニメーション */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* フェードイン */
@keyframes fadeInProgressBar {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* フェードアウト */
@keyframes fadeOutProgressBar {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

## 使用方法

### 新しいレイヤーにローディング表示を追加する

```typescript
// ローディング開始
setLoadingLayers((prev) => {
  const next = new Map(prev)
  next.set('layer-id', { name: 'レイヤー名' })
  return next
})

try {
  // データ読み込み処理
  await loadData()
} finally {
  // ローディング終了（成功・失敗問わず）
  setLoadingLayers((prev) => {
    const next = new Map(prev)
    next.delete('layer-id')
    return next
  })
}
```

### 進捗率付きでローディング表示を追加する

```typescript
// コンポーネント側
onLoadingChange={(loading, progress) => {
  setLoadingLayers((prev) => {
    const next = new Map(prev)
    if (loading) {
      next.set('component-id', { name: '処理名', progress })
    } else {
      next.delete('component-id')
    }
    return next
  })
}}
```

## ダークモード対応

| 要素 | ダークモード | ライトモード |
|------|------------|------------|
| バー背景 | `rgba(255,255,255,0.15)` | `rgba(0,0,0,0.08)` |
| バー色 | `#4a90d9` → `#8bb8f0` | `#2563eb` → `#60a5fa` |
| テキスト | `rgba(255,255,255,0.7)` | `rgba(0,0,0,0.5)` |
| スピナー | `#60a5fa` | `#2563eb` |

## パフォーマンス考慮

- **アニメーション**: CSS animationを使用（JSではなくGPUアクセラレーション）
- **状態更新**: Map を使用して O(1) での追加/削除
- **メモリ**: ローディング終了後は即座に Map から削除
- **再レンダリング**: loadingLayers.size の変更時のみ useEffect が発火

## 関連ファイル

- `src/App.tsx` - プログレスバーUI、状態管理
- `src/components/weather/NationwideWeatherMap.tsx` - 進捗率付きローディング例
