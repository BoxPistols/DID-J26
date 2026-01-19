# 天気予報機能 実装仕様書

**作成日**: 2026年1月18日
**更新日**: 2026年1月20日
**ステータス**: ✅ 実装完了

## 概要

日本全国47都道府県の天気予報を表示する機能。Open-Meteo APIを使用し、完全無料・認証不要で動作。

## 機能一覧

### 1. 天気予報クリックモード [W]

地図上をクリックすると、最寄りの都道府県の天気予報をポップアップで表示。

**操作方法**:
- サイドバーの「クリックで天気予報 [W]」をチェック
- または `W` キーでトグル
- 地図上をクリックで天気ポップアップ表示

**ポップアップ表示内容**:
- 都道府県名（県庁所在地）
- 現在の気温・天気
- 湿度・風速・降水量
- 3日間の週間予報
- 「詳細予報を見る」ボタン

### 2. 雨雲レーダー [C]

リアルタイムの雨雲レーダーを地図上にオーバーレイ表示。

**操作方法**:
- サイドバーの「雨雲 [C]」をチェック
- または `C` キーでトグル

**データソース**: RainViewer API
**更新頻度**: 5分ごと自動更新

### 3. 都道府県別 詳細予報パネル

全47都道府県の詳細な天気予報を表示するパネル。

**操作方法**:
- サイドバーの「都道府県別 詳細予報パネル」ボタンをクリック
- 天気ポップアップの「詳細予報を見る」ボタンをクリック
- `ESC` キーで閉じる

**表示内容**:
- 都道府県セレクター（地方別グループ化）
- 現在の天気（気温、天気、湿度、風速、降水量）
- 48時間の時間ごと予報（横スクロール）
- 7日間の週間予報

---

## 使用API

### Open-Meteo API（天気予報）

```
エンドポイント: https://api.open-meteo.com/v1/forecast
料金: 完全無料
認証: 不要
リクエスト制限: 10,000/日（非商用）
```

**リクエスト例**:
```
https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FTokyo
```

**レスポンス例**:
```json
{
  "current": {
    "temperature_2m": 5.2,
    "relative_humidity_2m": 72,
    "precipitation": 0,
    "weather_code": 3,
    "wind_speed_10m": 7.4
  },
  "hourly": {
    "time": ["2026-01-20T00:00", "2026-01-20T01:00", ...],
    "temperature_2m": [5.2, 4.8, ...],
    "weather_code": [3, 3, ...],
    "precipitation": [0, 0.1, ...]
  },
  "daily": {
    "time": ["2026-01-20", "2026-01-21", ...],
    "weather_code": [3, 71, ...],
    "temperature_2m_max": [8, 5, ...],
    "temperature_2m_min": [-2, -3, ...],
    "precipitation_sum": [0.1, 2.5, ...]
  }
}
```

### RainViewer API（雨雲レーダー）

```
エンドポイント: https://api.rainviewer.com/public/weather-maps.json
料金: 完全無料
認証: 不要
```

**実装**: `src/lib/services/rainViewer.ts`

---

## 実装詳細

### ファイル構成

```
src/
├── lib/
│   └── services/
│       ├── weatherApi.ts      # Open-Meteo API連携
│       └── rainViewer.ts      # RainViewer API連携
├── components/
│   └── weather/
│       └── WeatherForecastPanel.tsx  # 詳細予報パネル
└── App.tsx                    # 天気クリックモード実装
```

### weatherApi.ts

**主要関数**:

| 関数 | 説明 |
|------|------|
| `fetchPrefectureWeather(lat, lng)` | 座標から天気データ取得 |
| `getPrefectureForecast(prefectureId)` | 都道府県IDから天気取得 |
| `findNearestPrefecture(lat, lng)` | 最寄りの都道府県を検索 |
| `getWeatherDescription(code)` | 天気コードをラベル・アイコンに変換 |
| `formatHourlyTime(time)` | 時刻フォーマット |
| `formatDailyDate(date)` | 日付フォーマット |
| `getAllRegions()` | 全地方名リスト取得 |
| `getPrefecturesByRegion(region)` | 地方別都道府県リスト |

**都道府県データ**:

全47都道府県の県庁所在地座標を `JAPAN_PREFECTURES` 配列で管理。

```typescript
export const JAPAN_PREFECTURES = [
  { id: 'hokkaido', name: '北海道', capital: '札幌', lat: 43.06, lng: 141.35, region: '北海道' },
  { id: 'aomori', name: '青森県', capital: '青森', lat: 40.82, lng: 140.74, region: '東北' },
  // ... 全47都道府県
]
```

**天気コード対応表**:

WMO Weather Interpretation Codes (WW) に基づく。

| コード | 天気 | アイコン |
|--------|------|---------|
| 0 | 快晴 | ☀️ |
| 1-3 | 晴れ/一部曇り | 🌤️/⛅/🌥️ |
| 45, 48 | 霧 | 🌫️ |
| 51-55 | 霧雨 | 🌦️ |
| 61-65 | 雨 | 🌧️ |
| 71-75 | 雪 | ❄️ |
| 80-82 | にわか雨 | 🌧️ |
| 85-86 | にわか雪 | 🌨️ |
| 95-99 | 雷雨 | ⛈️ |

### WeatherForecastPanel.tsx

**Props**:

```typescript
interface WeatherForecastPanelProps {
  selectedPrefectureId?: string  // 初期選択の都道府県
  onClose?: () => void           // 閉じるコールバック
  darkMode?: boolean             // ダークモード
}
```

**スタイリング**:
- グラスモーフィズム（75%透過、16pxブラー）
- 角丸16px
- 薄いボーダー（コントラスト確保）
- ダークモード完全対応

---

## キーボードショートカット

| キー | 機能 |
|------|------|
| `W` | 天気予報クリックモードのトグル |
| `C` | 雨雲レーダーのトグル |
| `ESC` | 天気ポップアップ → 詳細パネル → ヘルプ の順に閉じる |

---

## UI仕様

### 天気ポップアップ

```
┌─────────────────────────────┐
│ 都道府県名 (県庁所在地)    ✕ │
├─────────────────────────────┤
│ ☀️  15°C                    │
│     晴れ                     │
├─────────────────────────────┤
│ 湿度    風速    降水         │
│  65%   5km/h   0mm          │
├─────────────────────────────┤
│ 週間予報                     │
│ 今日   ☀️  15° / 5°         │
│ 1/21   🌧️  10° / 3°         │
│ 1/22   ❄️   5° / -2°        │
├─────────────────────────────┤
│    [詳細予報を見る]          │
└─────────────────────────────┘
```

### 詳細予報パネル

```
┌─────────────────────────────────────┐
│ 天気予報                          ✕ │
├─────────────────────────────────────┤
│ [都道府県セレクター (地方別)]       │
├─────────────────────────────────────┤
│ 現在の天気 - 県庁所在地            │
│ ☀️  15°C  晴れ                     │
│ ┌───────┬───────┬───────┐         │
│ │ 湿度  │ 風速  │降水量 │         │
│ │  65%  │5km/h │ 0mm  │         │
│ └───────┴───────┴───────┘         │
├─────────────────────────────────────┤
│ 時間ごとの予報（48時間）           │
│ [0時][1時][2時][3時]... (横スクロール) │
├─────────────────────────────────────┤
│ 週間予報                            │
│ 今日   ☀️ 晴れ      15° / 5°       │
│ 1/21   🌧️ 雨       10° / 3°  5mm  │
│ ...                                 │
├─────────────────────────────────────┤
│ データ提供: Open-Meteo.com          │
└─────────────────────────────────────┘
```

---

## 参考資料

- [Open-Meteo API Documentation](https://open-meteo.com/en/docs)
- [RainViewer API Documentation](https://www.rainviewer.com/api.html)
- [WMO Weather Codes](https://open-meteo.com/en/docs#weathervariables)
