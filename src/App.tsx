import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const INITIAL_CENTER: [number, number] = [139.6917, 35.6895]
const INITIAL_ZOOM = 10
const MAP_STYLE = 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json'

interface LayerState {
  id: string
  name: string
  visible: boolean
  color: string
}

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [layers, setLayers] = useState<LayerState[]>([
    { id: 'did-tokyo', name: '人口集中地区（東京）', visible: true, color: '#ff6b6b' }
  ])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', () => {
      map.addSource('did-tokyo', {
        type: 'geojson',
        data: '/GeoJSON/h22_did_13_tokyo.geojson'
      })

      map.addLayer({
        id: 'did-tokyo',
        type: 'fill',
        source: 'did-tokyo',
        paint: {
          'fill-color': '#ff6b6b',
          'fill-opacity': 0.5
        }
      })

      map.addLayer({
        id: 'did-tokyo-outline',
        type: 'line',
        source: 'did-tokyo',
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 1
        }
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const toggleLayer = (layerId: string) => {
    if (!mapRef.current) return

    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    const newVisibility = !layer.visible
    const visibility = newVisibility ? 'visible' : 'none'

    mapRef.current.setLayoutProperty(layerId, 'visibility', visibility)
    mapRef.current.setLayoutProperty(`${layerId}-outline`, 'visibility', visibility)

    setLayers(prev =>
      prev.map(l => (l.id === layerId ? { ...l, visible: newVisibility } : l))
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{
        width: '280px',
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRight: '1px solid #ddd',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>レイヤー</h2>
        {layers.map(layer => (
          <label
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '4px',
              backgroundColor: layer.visible ? '#e3f2fd' : 'transparent'
            }}
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => toggleLayer(layer.id)}
            />
            <span
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: layer.color,
                borderRadius: '2px',
                opacity: 0.7
              }}
            />
            <span>{layer.name}</span>
          </label>
        ))}
      </aside>
      <div ref={mapContainer} style={{ flex: 1 }} />
    </div>
  )
}

export default App
