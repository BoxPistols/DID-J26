# 衝突判定機能 技術仕様書

**作成日**: 2026年1月18日
**目的**: Waypoint/ポリゴンがDID・禁止エリアに抵触しているかをリアルタイム判定
**技術スタック**: Turf.js + GeoJSON
**実装対象**: フロントエンド / BFF（Backend for Frontend）

---

## 概要

ドローン飛行計画において、以下の地理的オブジェクトが **禁止エリア（DID・空港空域等）** に抵触しているかを、リアルタイムで判定し、ユーザーに視覚的フィードバックを提供する機能。

### 判定対象

1. **Waypoint（点）**: 単一の座標が禁止エリア内にあるか
2. **Flight Path（線）**: 飛行経路が禁止エリアを通過するか
3. **Polygon（面）**: 作成したポリゴンが禁止エリアと重複するか

### 禁止エリアの種類

| エリア種別 | データソース | 更新頻度 | 優先度 | UI色 |
|-----------|------------|---------|--------|------|
| **飛行注意区域（DID）** | e-Stat（統計局） | 5年ごと（国勢調査） | 🟠 警告 | 赤系（危険度を視覚的に強調） |
| **空港空域** | 国土地理院 / AIP Japan | 随時 | 🔴 危険 | 紫 `#9C27B0` |
| **レッドゾーン** | 小型無人機等飛行禁止法 | 随時 | 🔴 危険 | 暗赤 `#b71c1c` |
| **イエローゾーン** | 小型無人機等飛行禁止法 | 随時 | 🟠 警告 | 黄 `#ffc107` |
| **緊急用務空域** | 国土交通省 | 随時 | 🟠 高 | - |
| **自衛隊・米軍基地** | 国土地理院 | 随時 | 🟠 高 | - |
| **国立公園** | 環境省 | 年1回 | 🟡 中 | - |

### ゾーンタイプ別色定義（実装済み）

```typescript
// src/lib/utils/collision.ts
export const ZONE_COLORS: Record<string, string> = {
  DID: '#f44336',       // 赤（人口集中地区）
  AIRPORT: '#9C27B0',   // 紫（空港周辺空域）
  RED_ZONE: '#b71c1c',  // 暗い赤（レッドゾーン - DIDと区別）
  YELLOW_ZONE: '#ffc107', // 黄色（イエローゾーン）
  DEFAULT: '#f44336'    // デフォルト赤
}

export const ZONE_SEVERITY: Record<string, 'DANGER' | 'WARNING'> = {
  DID: 'WARNING',
  AIRPORT: 'DANGER',
  RED_ZONE: 'DANGER',
  YELLOW_ZONE: 'WARNING'
}
```

---

## 技術仕様

### 1. 使用ライブラリ: Turf.js

```bash
npm install @turf/turf
# または
yarn add @turf/turf
```

**Turf.js とは**:
- 地理空間解析のためのJavaScriptライブラリ
- GeoJSON形式のデータを扱う
- ブラウザ・Node.js両対応
- 軽量（必要な関数のみインポート可能）

**公式ドキュメント**: https://turfjs.org/

---

### 2. DIDデータの取得

#### データソース: e-Stat（政府統計の総合窓口）

```
URL: https://www.e-stat.go.jp/
データ形式: Shape File（.shp）→ GeoJSON変換が必要
最新データ: 2020年国勢調査（令和2年）
次回更新: 2025年国勢調査（令和7年）
```

#### GeoJSON変換手順

```bash
# Shape File → GeoJSON 変換（GDALツール使用）
ogr2ogr -f GeoJSON did_areas.json did_2020.shp -t_srs EPSG:4326

# または、オンラインツール使用
# https://mapshaper.org/
# Shape Fileをアップロード → Export → GeoJSON
```

#### GeoJSON構造例

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "東京都渋谷区",
        "code": "13113",
        "population": 227850,
        "area_km2": 15.11
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [139.6917, 35.6580],
            [139.7104, 35.6595],
            [139.7004, 35.6762],
            [139.6917, 35.6580]
          ]
        ]
      }
    }
  ]
}
```

---

## 3. 実装パターン

### パターン A: Waypoint（点）の衝突判定

**使用関数**: `turf.booleanPointInPolygon()`

```typescript
import * as turf from '@turf/turf';

interface WaypointCollisionResult {
  isColliding: boolean;
  collisionType: 'DID' | 'AIRPORT' | 'MILITARY' | 'PARK' | null;
  areaName?: string;
  severity: 'DANGER' | 'WARNING' | 'SAFE';
  uiColor: string;
  message: string;
}

/**
 * Waypoint（点）がDID等の禁止エリアに含まれているか判定
 * @param waypointCoords [longitude, latitude] 形式
 * @param prohibitedAreas GeoJSONのFeatureCollection
 * @returns 衝突判定結果
 */
export const checkWaypointCollision = (
  waypointCoords: [number, number],
  prohibitedAreas: turf.FeatureCollection
): WaypointCollisionResult => {
  const point = turf.point(waypointCoords);

  // 各禁止エリアをループして判定
  for (const feature of prohibitedAreas.features) {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      const isInside = turf.booleanPointInPolygon(point, feature);

      if (isInside) {
        const areaType = feature.properties?.type || 'DID';
        const areaName = feature.properties?.name || '不明なエリア';

        return {
          isColliding: true,
          collisionType: areaType,
          areaName: areaName,
          severity: 'DANGER',
          uiColor: '#FF0000',  // 赤色
          message: `このWaypointは${areaName}（${areaType}）内にあります。飛行禁止です。`
        };
      }
    }
  }

  return {
    isColliding: false,
    collisionType: null,
    severity: 'SAFE',
    uiColor: '#00FF00',  // 緑色
    message: '飛行可能エリアです'
  };
};
```

**使用例（React）**:

```tsx
import { checkWaypointCollision } from '@/utils/collisionDetection';
import { useEffect, useState } from 'react';

const WaypointEditor = ({ waypoint, didGeoJSON }) => {
  const [collisionResult, setCollisionResult] = useState(null);

  useEffect(() => {
    const result = checkWaypointCollision(
      [waypoint.longitude, waypoint.latitude],
      didGeoJSON
    );
    setCollisionResult(result);
  }, [waypoint, didGeoJSON]);

  return (
    <div>
      <div
        style={{
          backgroundColor: collisionResult?.uiColor,
          padding: '8px',
          borderRadius: '4px'
        }}
      >
        {collisionResult?.message}
      </div>
    </div>
  );
};
```

---

### パターン B: Flight Path（線）の衝突判定

**使用関数**: `turf.lineIntersect()` または `turf.booleanCrosses()`

```typescript
import * as turf from '@turf/turf';

interface PathCollisionResult {
  isColliding: boolean;
  intersectionPoints: turf.Position[];  // 交差座標のリスト
  affectedSegments: number[];           // 抵触している線分のインデックス
  severity: 'DANGER' | 'WARNING' | 'SAFE';
  message: string;
}

/**
 * Flight Path（線）が禁止エリアを通過しているか判定
 * @param pathCoords [[lon, lat], [lon, lat], ...] 形式の座標配列
 * @param prohibitedAreas GeoJSONのFeatureCollection
 * @returns 衝突判定結果
 */
export const checkPathCollision = (
  pathCoords: turf.Position[],
  prohibitedAreas: turf.FeatureCollection
): PathCollisionResult => {
  const line = turf.lineString(pathCoords);
  const intersectionPoints: turf.Position[] = [];
  const affectedSegments: number[] = [];

  for (const feature of prohibitedAreas.features) {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      // 線とポリゴンの交差判定
      const intersections = turf.lineIntersect(line, feature);

      if (intersections.features.length > 0) {
        // 交差点を記録
        intersections.features.forEach(point => {
          intersectionPoints.push(point.geometry.coordinates);
        });

        // どの線分が抵触しているか特定（オプション）
        pathCoords.forEach((coord, index) => {
          if (index < pathCoords.length - 1) {
            const segment = turf.lineString([coord, pathCoords[index + 1]]);
            const segmentIntersects = turf.lineIntersect(segment, feature);
            if (segmentIntersects.features.length > 0) {
              affectedSegments.push(index);
            }
          }
        });
      }
    }
  }

  if (intersectionPoints.length > 0) {
    return {
      isColliding: true,
      intersectionPoints,
      affectedSegments,
      severity: 'DANGER',
      message: `飛行経路が禁止エリアを${intersectionPoints.length}箇所で通過しています`
    };
  }

  return {
    isColliding: false,
    intersectionPoints: [],
    affectedSegments: [],
    severity: 'SAFE',
    message: '飛行経路は禁止エリアを通過していません'
  };
};
```

**使用例（MapboxGL可視化）**:

```tsx
import { useEffect } from 'react';
import { checkPathCollision } from '@/utils/collisionDetection';

const FlightPathLayer = ({ map, pathCoords, didGeoJSON }) => {
  useEffect(() => {
    const result = checkPathCollision(pathCoords, didGeoJSON);

    if (result.isColliding) {
      // 交差点をマップ上に赤いマーカーで表示
      result.intersectionPoints.forEach((coord, index) => {
        map.addSource(`intersection-${index}`, {
          type: 'geojson',
          data: {
            type: 'Point',
            coordinates: coord
          }
        });

        map.addLayer({
          id: `intersection-marker-${index}`,
          type: 'circle',
          source: `intersection-${index}`,
          paint: {
            'circle-radius': 8,
            'circle-color': '#FF0000',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF'
          }
        });
      });

      // 抵触している線分を赤く強調
      result.affectedSegments.forEach(segmentIndex => {
        const segment = [
          pathCoords[segmentIndex],
          pathCoords[segmentIndex + 1]
        ];

        map.addSource(`danger-segment-${segmentIndex}`, {
          type: 'geojson',
          data: {
            type: 'LineString',
            coordinates: segment
          }
        });

        map.addLayer({
          id: `danger-segment-layer-${segmentIndex}`,
          type: 'line',
          source: `danger-segment-${segmentIndex}`,
          paint: {
            'line-color': '#FF0000',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      });
    }
  }, [pathCoords, didGeoJSON, map]);

  return null;
};
```

---

### パターン C: Polygon（面）の衝突判定

**使用関数**: `turf.booleanOverlap()` または `turf.intersect()`

```typescript
import * as turf from '@turf/turf';

interface PolygonCollisionResult {
  isColliding: boolean;
  overlapArea?: turf.Feature<turf.Polygon | turf.MultiPolygon>;  // 重複エリア
  overlapPercentage?: number;  // 重複割合（%）
  severity: 'DANGER' | 'WARNING' | 'SAFE';
  message: string;
}

/**
 * Polygon（面）が禁止エリアと重複しているか判定
 * @param polygonCoords [[[lon, lat], ...]] 形式
 * @param prohibitedAreas GeoJSONのFeatureCollection
 * @returns 衝突判定結果
 */
export const checkPolygonCollision = (
  polygonCoords: turf.Position[][],
  prohibitedAreas: turf.FeatureCollection
): PolygonCollisionResult => {
  const polygon = turf.polygon(polygonCoords);
  const polygonArea = turf.area(polygon);  // 元のポリゴン面積（m²）

  for (const feature of prohibitedAreas.features) {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      try {
        // 2つのポリゴンの交差部分を取得
        const intersection = turf.intersect(polygon, feature);

        if (intersection) {
          const intersectionArea = turf.area(intersection);
          const overlapPercentage = (intersectionArea / polygonArea) * 100;

          return {
            isColliding: true,
            overlapArea: intersection,
            overlapPercentage: Math.round(overlapPercentage * 100) / 100,
            severity: overlapPercentage > 50 ? 'DANGER' : 'WARNING',
            message: `作成したポリゴンの${overlapPercentage.toFixed(1)}%が禁止エリアと重複しています`
          };
        }
      } catch (error) {
        console.warn('Intersection calculation failed:', error);
      }
    }
  }

  return {
    isColliding: false,
    severity: 'SAFE',
    message: 'ポリゴンは禁止エリアと重複していません'
  };
};
```

---

## 4. パフォーマンス最適化

### 問題点: リアルタイム判定の負荷

DIDデータは全国で数千〜数万のポリゴンを含むため、毎回全ポリゴンをチェックすると重い。

### 最適化戦略

#### A. 空間インデックス（Spatial Index）の活用

**RBush（高速な空間インデックスライブラリ）**:

```bash
npm install rbush
```

```typescript
import RBush from 'rbush';
import * as turf from '@turf/turf';

// 空間インデックスの作成（初期化時に1回のみ）
export const createSpatialIndex = (prohibitedAreas: turf.FeatureCollection) => {
  const tree = new RBush();
  const items = prohibitedAreas.features.map((feature, index) => {
    const bbox = turf.bbox(feature);  // [minX, minY, maxX, maxY]
    return {
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
      feature: feature,
      index: index
    };
  });

  tree.load(items);
  return tree;
};

// 最適化されたWaypoint判定
export const checkWaypointCollisionOptimized = (
  waypointCoords: [number, number],
  spatialIndex: RBush,
  prohibitedAreas: turf.FeatureCollection
): WaypointCollisionResult => {
  const point = turf.point(waypointCoords);
  const [lon, lat] = waypointCoords;

  // 1. 空間インデックスで候補を絞り込み（高速）
  const candidates = spatialIndex.search({
    minX: lon,
    minY: lat,
    maxX: lon,
    maxY: lat
  });

  // 2. 候補のみ詳細判定（精密）
  for (const candidate of candidates) {
    const isInside = turf.booleanPointInPolygon(point, candidate.feature);
    if (isInside) {
      return {
        isColliding: true,
        collisionType: candidate.feature.properties?.type || 'DID',
        areaName: candidate.feature.properties?.name || '不明',
        severity: 'DANGER',
        uiColor: '#FF0000',
        message: `禁止エリア内です`
      };
    }
  }

  return {
    isColliding: false,
    collisionType: null,
    severity: 'SAFE',
    uiColor: '#00FF00',
    message: '飛行可能'
  };
};
```

**性能改善**:
- 従来: O(n) - 全ポリゴンをチェック（数万回）
- 最適化後: O(log n) - 候補のみチェック（数十回）
- **100倍以上の高速化**

#### B. Web Worker でのバックグラウンド処理

重い判定処理をメインスレッドから分離:

```typescript
// collision.worker.ts
import * as turf from '@turf/turf';
import { checkWaypointCollision } from './collisionDetection';

self.addEventListener('message', (e) => {
  const { type, payload } = e.data;

  if (type === 'CHECK_WAYPOINT') {
    const result = checkWaypointCollision(
      payload.coords,
      payload.prohibitedAreas
    );
    self.postMessage({ type: 'RESULT', result });
  }
});
```

```tsx
// React での使用例
import { useEffect, useState } from 'react';

const useCollisionWorker = () => {
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const w = new Worker(new URL('./collision.worker.ts', import.meta.url));
    setWorker(w);
    return () => w.terminate();
  }, []);

  const checkCollision = (coords, prohibitedAreas) => {
    return new Promise((resolve) => {
      worker?.postMessage({
        type: 'CHECK_WAYPOINT',
        payload: { coords, prohibitedAreas }
      });

      worker?.addEventListener('message', (e) => {
        if (e.data.type === 'RESULT') {
          resolve(e.data.result);
        }
      });
    });
  };

  return { checkCollision };
};
```

#### C. キャッシング戦略

```typescript
// LRU Cache for collision results
import { LRUCache } from 'lru-cache';

const collisionCache = new LRUCache<string, WaypointCollisionResult>({
  max: 500,  // 最大500件キャッシュ
  ttl: 1000 * 60 * 5,  // 5分間有効
});

export const checkWaypointCollisionCached = (
  waypointCoords: [number, number],
  prohibitedAreas: turf.FeatureCollection
): WaypointCollisionResult => {
  const cacheKey = `${waypointCoords[0]}_${waypointCoords[1]}`;

  // キャッシュヒット
  const cached = collisionCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // キャッシュミス → 計算
  const result = checkWaypointCollision(waypointCoords, prohibitedAreas);
  collisionCache.set(cacheKey, result);

  return result;
};
```

---

## 5. UI/UX統合

### A. Waypoint色変更（MapboxGL）

```tsx
import { useEffect } from 'react';
import { checkWaypointCollision } from '@/utils/collisionDetection';

const WaypointLayer = ({ map, waypoints, didGeoJSON }) => {
  useEffect(() => {
    waypoints.forEach((waypoint, index) => {
      const result = checkWaypointCollision(
        [waypoint.longitude, waypoint.latitude],
        didGeoJSON
      );

      // MapboxGLのソース更新
      map.addSource(`waypoint-${index}`, {
        type: 'geojson',
        data: {
          type: 'Point',
          coordinates: [waypoint.longitude, waypoint.latitude]
        }
      });

      map.addLayer({
        id: `waypoint-layer-${index}`,
        type: 'circle',
        source: `waypoint-${index}`,
        paint: {
          'circle-radius': 10,
          'circle-color': result.uiColor,  // 🔴 赤 or 🟢 緑
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF'
        }
      });
    });
  }, [waypoints, didGeoJSON, map]);

  return null;
};
```

### B. リアルタイムフィードバック

```tsx
const DrawingToolsWithCollisionCheck = () => {
  const [currentWaypoint, setCurrentWaypoint] = useState(null);
  const [collisionStatus, setCollisionStatus] = useState<WaypointCollisionResult | null>(null);

  // Waypoint編集時にリアルタイム判定
  const handleWaypointChange = (newCoords: [number, number]) => {
    const result = checkWaypointCollision(newCoords, didGeoJSON);
    setCollisionStatus(result);
  };

  return (
    <div>
      {/* ステータス表示 */}
      {collisionStatus && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px',
            backgroundColor: collisionStatus.severity === 'DANGER' ? '#FF000020' : '#00FF0020',
            border: `2px solid ${collisionStatus.uiColor}`,
            borderRadius: '8px',
            zIndex: 1000
          }}
        >
          <strong>{collisionStatus.severity}</strong>
          <p>{collisionStatus.message}</p>
        </div>
      )}

      {/* 座標入力フィールド */}
      <input
        type="number"
        placeholder="Latitude"
        onChange={(e) => {
          const newCoords: [number, number] = [
            currentWaypoint?.[0] || 0,
            parseFloat(e.target.value)
          ];
          handleWaypointChange(newCoords);
        }}
      />
    </div>
  );
};
```

---

## 6. データ管理

### DIDデータの保存場所

```
project/
├── public/
│   └── geodata/
│       ├── did_areas.geojson         # DIDデータ
│       ├── airport_zones.geojson     # 空港空域
│       ├── military_zones.geojson    # 自衛隊・米軍基地
│       └── national_parks.geojson    # 国立公園
```

### データ読み込み（React）

```tsx
import { useEffect, useState } from 'react';

const useProhibitedAreas = () => {
  const [didAreas, setDidAreas] = useState<turf.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/geodata/did_areas.geojson');
        const data = await response.json();
        setDidAreas(data);
      } catch (error) {
        console.error('Failed to load DID data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { didAreas, loading };
};
```

### データ更新戦略

```typescript
interface DataVersion {
  version: string;          // "2020"
  updatedAt: string;        // "2025-10-01"
  source: string;           // "e-Stat"
  checksum: string;         // データ整合性チェック用
}

// LocalStorageでバージョン管理
const DATA_VERSION_KEY = 'did_data_version';

export const checkDataUpdate = async (): Promise<boolean> => {
  const currentVersion = localStorage.getItem(DATA_VERSION_KEY);
  const latestVersion = await fetch('/geodata/version.json').then(r => r.json());

  if (currentVersion !== latestVersion.version) {
    console.warn('DID data is outdated. Please update.');
    return false;
  }

  return true;
};
```

---

## 7. 実装チェックリスト

### Phase 1: 基盤構築
- [ ] Turf.js インストール（`@turf/turf`）
- [ ] RBush インストール（`rbush`） - 空間インデックス用
- [ ] DIDデータ取得（e-Stat）
- [ ] Shape File → GeoJSON 変換
- [ ] `/public/geodata/` にGeoJSONファイル配置

### Phase 2: コア機能実装
- [ ] `checkWaypointCollision()` 実装
- [ ] `checkPathCollision()` 実装
- [ ] `checkPolygonCollision()` 実装
- [ ] 空間インデックス作成ロジック実装
- [ ] キャッシング機構実装

### Phase 3: UI統合
- [ ] Waypoint色変更ロジック（赤/緑）
- [ ] リアルタイムフィードバックUI
- [ ] 交差点マーカー表示（MapboxGL）
- [ ] 抵触線分の強調表示
- [ ] 警告モーダル/トースト通知

### Phase 4: パフォーマンス最適化
- [ ] Web Worker実装
- [ ] LRU Cacheの導入
- [ ] バッチ判定の実装（複数Waypoint同時処理）
- [ ] レンダリング最適化（React.memo等）

### Phase 5: テスト・品質保証
- [ ] ユニットテスト（Turf.js関数）
- [ ] E2Eテスト（UI統合）
- [ ] パフォーマンステスト（1000件のWaypoint判定）
- [ ] エラーハンドリング
- [ ] TypeScript型チェック

---

## 8. BFF vs フロントエンド 実装判断基準

### フロントエンドで実装すべきケース

✅ **リアルタイムUI更新が必要**
- Waypointドラッグ中の即座な色変更
- 描画中の逐次フィードバック

✅ **データサイズが小さい**
- DIDデータが10MB以下
- ユーザーごとのデータ差異がない

✅ **レイテンシが重要**
- 1ms単位の応答速度が求められる

### BFFで実装すべきケース

✅ **データサイズが大きい**
- DIDデータが10MB超
- 全国データを扱う場合

✅ **計算負荷が高い**
- 数万ポリゴンの判定
- 複雑な交差計算

✅ **データ更新頻度が高い**
- 禁止エリアが頻繁に変更される
- リアルタイムNOTAM連携が必要

### 推奨構成（ハイブリッド）

```
初回ロード時: BFFでユーザー位置周辺のDIDデータのみ取得
  ↓
フロントエンド: 取得したデータでリアルタイム判定
  ↓
エリア移動時: BFFから追加データ取得（差分更新）
```

---

## 9. エラーハンドリング

```typescript
export const safeCheckCollision = (
  coords: [number, number],
  prohibitedAreas: turf.FeatureCollection | null
): WaypointCollisionResult => {
  // データ未ロード
  if (!prohibitedAreas) {
    return {
      isColliding: false,
      collisionType: null,
      severity: 'WARNING',
      uiColor: '#FFA500',  // オレンジ
      message: 'DIDデータ読み込み中...'
    };
  }

  // 座標が不正
  if (!coords || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
    return {
      isColliding: false,
      collisionType: null,
      severity: 'WARNING',
      uiColor: '#FFA500',
      message: '座標が不正です'
    };
  }

  // 通常の判定処理
  try {
    return checkWaypointCollision(coords, prohibitedAreas);
  } catch (error) {
    console.error('Collision detection failed:', error);
    return {
      isColliding: false,
      collisionType: null,
      severity: 'WARNING',
      uiColor: '#FFA500',
      message: '判定エラーが発生しました'
    };
  }
};
```

---

## 10. セキュリティ考慮事項

### データ整合性

```typescript
// GeoJSONデータのバリデーション
import Ajv from 'ajv';

const geojsonSchema = {
  type: 'object',
  required: ['type', 'features'],
  properties: {
    type: { type: 'string', enum: ['FeatureCollection'] },
    features: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'geometry', 'properties'],
        properties: {
          type: { type: 'string', enum: ['Feature'] },
          geometry: { type: 'object' },
          properties: { type: 'object' }
        }
      }
    }
  }
};

const ajv = new Ajv();
const validate = ajv.compile(geojsonSchema);

export const validateGeoJSON = (data: unknown): boolean => {
  return validate(data);
};
```

---

## 11. 参考資料

### 公式ドキュメント
- [Turf.js](https://turfjs.org/)
- [RBush](https://github.com/mourner/rbush)
- [e-Stat](https://www.e-stat.go.jp/)
- [国土地理院 地図データ](https://www.gsi.go.jp/)

### GeoJSON仕様
- [RFC 7946 - GeoJSON Format](https://datatracker.ietf.org/doc/html/rfc7946)

### 関連技術
- [MapboxGL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapshaper](https://mapshaper.org/) - Shape File変換ツール
- [GDAL/OGR](https://gdal.org/) - GIS変換ライブラリ

---

## 付録: よくある質問

### Q. 飛行注意区域（DID）データはどこで入手できますか？また、なぜ地方ごとに分類されているのですか？

A. DIDデータはe-Stat（政府統計の総合窓口）から入手できます。地方ごとに分類されているのは、パフォーマンス向上のためです。47都道府県すべてを一度に読み込むと、大量のデータ（数万〜数十万のポリゴン）がメモリに読み込まれ、GPU/CPU/メモリを急激に消費して画面が重くなります。必要な地域だけを選択して表示することで、快適に動作します。
A. e-Stat（https://www.e-stat.go.jp/）から無料でダウンロード可能。Shape File形式で提供されているため、GeoJSONへの変換が必要。

### Q. 判定精度はどの程度ですか？
A. Turf.jsは浮動小数点演算を使用しているため、理論上は数cm単位の精度。ただし、元データ（DID境界線）の精度に依存。

### Q. パフォーマンスが遅い場合は？
A. 空間インデックス（RBush）の導入、Web Workerでのバックグラウンド処理、キャッシングの3つで大幅改善可能。

### Q. BFFとフロントエンドどちらで実装すべきですか？
A. リアルタイム性を重視するならフロントエンド、データサイズが大きい場合はBFFを推奨。ハイブリッド構成が最適。

---

---

## 12. 実装状況（2026年1月19日時点）

### 実装済み機能

#### コア機能
- ✅ `checkWaypointCollision()` - Waypoint（点）の衝突判定
- ✅ `checkPathCollision()` - Flight Path（線）の衝突判定
- ✅ `checkPolygonCollision()` - Polygon（面）の衝突判定
- ✅ `createSpatialIndex()` - RBush空間インデックス作成
- ✅ `checkWaypointCollisionOptimized()` - 空間インデックス使用の高速判定

#### ゾーンタイプ別対応
- ✅ 飛行注意区域（DID）の衝突検出（地方ごとの分類表示、ビューポートベースの動的読み込み対応）
- ✅ 空港周辺空域の衝突検出（紫色フィードバック）
- ✅ レッドゾーン（飛行禁止）の衝突検出（暗赤色フィードバック）
- ✅ イエローゾーン（要許可）の衝突検出（黄色フィードバック）

#### UI統合
- ✅ 頂点ラベルのゾーン別色分け表示
- ✅ Waypoint（Point）の衝突時色変更
- ✅ 描画フィーチャーリストでの警告アイコン表示
- ✅ パフォーマンス最適化（デバウンス処理）

### ファイル構成

```
src/lib/utils/
├── collision.ts          # 衝突検出ユーティリティ
└── collision.test.ts     # ユニットテスト（15件）

src/components/
└── DrawingTools.tsx      # 描画ツール（衝突検出UI統合）

src/App.tsx               # メインアプリ（禁止エリアデータ管理）
```

### テストカバレッジ

```bash
npm test -- --run src/lib/utils/collision.test.ts

# 実行結果:
# ✓ collision utils (5 tests)
# ✓ ゾーンタイプ別衝突検出 (5 tests)
# ✓ 空間インデックスを使用したゾーンタイプ別衝突検出 (3 tests)
# ✓ ZONE_COLORS定数 (2 tests)
# 合計: 15 tests passed
```

---

## 13. コンテキストメニュー統合（2026年1月20日追加）

### 右クリックコンテキストメニュー

マップ上で右クリックすると、Google Maps風のコンテキストメニューが表示され、現在位置の制限エリア情報がツールチップとして表示されます。

#### DID検出パターン

飛行注意区域（DID）レイヤーは2つのパターンで検出されます：

```typescript
// 地域別DIDレイヤー（サイドバーから個別選択）
// パフォーマンス向上のため、地方ごとに分類されています
layerId.startsWith('did-')  // 例: 'did-01', 'did-11'

// 全国DID表示（「飛行注意区域（全国DID）」トグル）
// ビューポートベースの動的読み込みにより、表示範囲内の都道府県のみを自動的に読み込む
layerId.startsWith(ZONE_IDS.DID_ALL_JAPAN)  // 例: 'ZONE_IDS.DID_ALL_JAPAN-did-01'
```

**パフォーマンス最適化の理由:**
- 47都道府県すべてを一度に読み込むと、大量のデータ（数万〜数十万のポリゴン）がメモリに読み込まれ、GPU/CPU/メモリを急激に消費して画面が重くなります
- 地方ごとに分類することで、必要な地域だけを選択して表示でき、メモリ使用量とレンダリング負荷を最小限に抑えられます
- 全国一括表示モードでは、ビューポートベースの動的読み込みにより、表示範囲内の都道府県のみを自動的に読み込むため、パフォーマンスが改善されています

#### 制限エリア検出の優先順位

複数のゾーンが重なる場合、以下の優先順位で表示されます：

| 優先度 | ゾーンタイプ | UI色 |
|--------|-------------|------|
| 1 | RED_ZONE（飛行禁止） | `#B71C1C` 暗い赤 |
| 2 | AIRPORT（空港周辺） | `#9C27B0` 紫 |
| 3 | 飛行注意区域（DID） | 赤系（危険度を視覚的に強調） |
| 4 | YELLOW_ZONE（注意区域） | `#ffc107` 黄色 |

### キーボードショートカット

| キー | 機能 |
|------|------|
| `T` | ツールチップ表示切り替え |
| `X` | 中心十字マーカー表示切り替え |
| `D` | 飛行注意区域（DID）表示切替（ビューポートベースの動的読み込み） |
| `A` | 空港周辺空域表示切り替え |
| `R` | レッドゾーン表示切り替え |
| `Y` | イエローゾーン表示切り替え |
| `S` | 左サイドバー表示切り替え |
| `P` | 右サイドバー表示切り替え |
| `L` | ダーク/ライトモード切り替え |
| `?` | ヘルプ表示 |

---

**更新履歴**:
- 2026-01-26: DIDの表示方法を更新（地方ごとの分類表示、ビューポートベースの動的読み込み、赤系配色への統一）
- 2026-01-20: コンテキストメニュー統合、DID検出パターン修正、キーボードショートカット追加
- 2026-01-19: ゾーンタイプ別衝突検出機能を追加（空港/レッドゾーン/イエローゾーン対応）
- 2026-01-18: 初版作成（Waypoint/Path/Polygon衝突判定の完全仕様）
